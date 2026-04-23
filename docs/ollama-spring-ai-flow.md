# AfroHR — Ollama + Spring AI Full Integration Flow

## Overview

AfroHR uses two distinct AI integration paths:

| Feature | Transport | Model Client |
|---------|-----------|--------------|
| Profile Skill Suggestions | Spring AI (OllamaChatModel) | llama3.2 via `localhost:11434` |
| Student Advisor Chatbot (POST) | Spring AI (OllamaChatModel) | llama3.2 via `localhost:11434` |
| Student Advisor Chatbot (SSE stream) | Spring AI reactive stream | llama3.2 via `localhost:11434` |
| Student Intake Recommendation (ollama mode) | Raw Java HTTP client | llama3.2 via `localhost:11434/api/generate` |
| Profile Chat Assistant | Raw Java HTTP client → OpenAI | gpt-4o-mini via OpenAI API |

---

## 1. Configuration

### `application.properties` / Environment Variables

```properties
# Ollama server (used by Spring AI)
spring.ai.ollama.base-url=${SPRING_AI_OLLAMA_BASE_URL:http://localhost:11434}
spring.ai.ollama.chat.options.model=${SPRING_AI_OLLAMA_MODEL:${OLLAMA_MODEL:llama3.2}}

# Ollama server (used by raw HTTP client)
ollama.base-url=${OLLAMA_BASE_URL:http://localhost:11434/api/generate}
ollama.model=${OLLAMA_MODEL:llama3.2}

# Chatbot inference tuning
student.chatbot.ollama.temperature=${STUDENT_CHATBOT_OLLAMA_TEMPERATURE:0.4}
student.chatbot.ollama.max-tokens=${STUDENT_CHATBOT_OLLAMA_MAX_TOKENS:350}
student.chatbot.max-response-words=${STUDENT_CHATBOT_MAX_RESPONSE_WORDS:100}

# Student recommendation routing (local | ollama | openai)
student.recommendation.provider=${STUDENT_RECOMMENDATION_PROVIDER:local}
```

### Spring AI `OllamaChatModel` — Lazy Singleton (in `AiAssistantServiceImpl`)

```java
private volatile OllamaChatModel studentAdvisorChatModel;

private OllamaChatModel getStudentAdvisorChatModel() {
    if (studentAdvisorChatModel == null) {
        synchronized (this) {
            if (studentAdvisorChatModel == null) {
                studentAdvisorChatModel = OllamaChatModel.builder()
                    .ollamaApi(OllamaApi.builder()
                        .baseUrl("http://localhost:11434")
                        .build())
                    .defaultOptions(OllamaOptions.builder()
                        .model("llama3.2")
                        .temperature(0.4)
                        .numPredict(350)
                        .build())
                    .build();
            }
        }
    }
    return studentAdvisorChatModel;
}
```

The model instance is created on **first use** and reused for all subsequent requests (double-checked locking pattern). There is no pre-warming — the first request pays the model-load cost.

---

## 2. Feature: Profile Skill Suggestions

### Frontend → Backend Flow

```
Skills.tsx (modal opens)
  │  useEffect triggers on editOpen=true
  │  Collects: accountType, profile fields → buildSkillSuggestionContext()
  │  Collects: skills + itSkills → existingSkills[]
  │
  ▼
profile-service.ts → getProfileSkillSuggestions()
  │  POST /api/ahrm/v3/profiles/skillSuggestions
  │  Payload: { accountType, profileContext, existingSkills[] }
  │  Timeout: 180,000 ms (3 minutes)
  │  Retry: 1x on ECONNABORTED / ERR_NETWORK / ERR_CANCELED / 5xx
  │
  ▼  (via Vite proxy /api → http://127.0.0.1:8080)
  ▼
ProfileAPI.java → POST /profiles/skillSuggestions
  │  @Valid ProfileSkillSuggestionRequest
  │  Delegates to: aiAssistantService.getProfileSkillSuggestions()
  │
  ▼
AiAssistantServiceImpl.getProfileSkillSuggestions()
  │  1. sanitizeSkills(existingSkills) — strip/dedupe
  │  2. buildProfileSkillSuggestionPrompt() → Spring AI Prompt
  │  3. getStudentAdvisorChatModel().call(prompt)  ← HTTP to Ollama
  │  4. parseSkillSuggestionResponse(rawText)
  │  5. filter duplicates, limit(15)
  │  └─ On ANY exception → buildProfileSkillFallbackSuggestions()
  │
  ▼
Response: { "suggestions": ["Skill A", "Skill B", ...] }
  │
  ▼
Skills.tsx
  ├─ Success: renders up to 40 suggestion badges (coloured by skillToneClasses[])
  └─ Error/fallback empty: setSuggestionsError → "Could not load AI suggestions…"
```

### Prompt Built by `buildProfileSkillSuggestionPrompt()`

| Part | Content |
|------|---------|
| System | `"You are AfroHR's profile skills advisor. Suggest practical resume-ready skills only. Return ONLY a JSON array of strings."` |
| User | accountType + profileContext (truncated to 3000 chars) + existing skills list |
| OllamaOptions | model=llama3.2, temperature=0.3, numPredict=260 |

Expected response: a raw JSON array, e.g. `["Skill A", "Skill B"]`

### Response Parsing (`parseSkillSuggestionResponse`)

1. Strip markdown fences (` ```json `, ` ``` `)
2. Extract first `[...]` substring
3. Parse as JSON array — each text node → sanitizeSkill (strip `[]"`` `, max 40 chars)
4. Fallback: split on newlines/commas, strip bullet markers

### Fallback Suggestions (when Ollama fails)

| accountType | Fallback Skills |
|-------------|----------------|
| STUDENT | Problem Solving, Communication, Teamwork, Git, SQL, Time Management |
| EMPLOYER | Talent Acquisition, Interview Coordination, Stakeholder Management, Screening, ATS, Offer Negotiation |
| APPLICANT (default) | Communication, Problem Solving, Stakeholder Management, Collaboration, Adaptability, Analytical Thinking |

---

## 3. Feature: Student Advisor Chatbot

### 3a. Standard POST (non-streaming)

```
StudentDashboardView.tsx
  │  User sends message in chat UI
  │  Tries streamStudentAdvisorChat() first (SSE)
  │  Falls back to chatWithStudentAdvisor() if stream fails
  │
  ▼
student-chat-service.ts → chatWithStudentAdvisor()
  │  POST /api/ahrm/v3/dashboard/students/chatbot
  │  Payload: { message, history[], decisionMode, targetRole,
  │             primaryInterest, primaryField, backgroundLevel,
  │             timeline, skills, recommendationSummary, recommendedRoles[] }
  │  No custom timeout (uses axiosInstance default)
  │
  ▼
DashboardAPI.java → POST /dashboard/students/chatbot
  │  @Valid StudentAdvisorChatRequestDTO
  │  Delegates to: aiAssistantService.chatWithStudentAdvisor()
  │
  ▼
AiAssistantServiceImpl.chatWithStudentAdvisor()
  │  1. getStudentAdvisorReplyFromOllama(request)
  │     a. buildStudentAdvisorPrompt() → System + history messages + UserMessage
  │     b. getStudentAdvisorChatModel().call(prompt)  ← HTTP to Ollama
  │     c. truncate reply to 2200 chars
  │  └─ On exception → buildLocalStudentAdvisorReply() (rule-based local reply)
  │
  ▼
Response: { "reply": "...", "provider": "spring-ai-ollama" | "local-fallback" }
```

### 3b. SSE Streaming (primary path)

```
StudentDashboardView.tsx
  │
  ▼
student-chat-service.ts → streamStudentAdvisorChat()
  │  POST /api/ahrm/v3/dashboard/students/chatbot/stream
  │  Headers: Content-Type: application/json, X-Requested-With: XMLHttpRequest
  │  Uses native fetch() (NOT axiosInstance) to enable ReadableStream
  │  Reads SSE events manually with TextDecoder + ReadableStreamDefaultReader
  │  Event types: "message" (chunk), "done" ("[DONE]"), "error"
  │
  ▼
DashboardAPI.java → POST /dashboard/students/chatbot/stream
  │  produces = MediaType.TEXT_EVENT_STREAM_VALUE
  │  Creates SseEmitter(timeout=0L — no timeout)
  │  Subscribes to: aiAssistantService.streamStudentAdvisorChat(request)
  │
  ▼
AiAssistantServiceImpl.streamStudentAdvisorChat()
  │  1. buildStudentAdvisorPrompt() → Prompt with OllamaOptions
  │  2. getStudentAdvisorChatModel().stream(prompt)  ← Reactive Flux<ChatResponse>
  │  3. .map(chunk text)
  │     .filter(not blank)
  │     .map(truncate to 800 chars per chunk)
  │     .switchIfEmpty(Flux.just(localFallback))
  │     .onErrorResume(→ Flux.just(localFallback))
  │
  ▼
SSE stream to browser:
  event: message\ndata: <chunk>\n\n  (repeated)
  event: done\ndata: [DONE]\n\n
```

### Prompt Built by `buildStudentAdvisorPrompt()`

| Part | Content |
|------|---------|
| System | Student context block: decisionMode, primaryInterest, primaryField, targetRole, backgroundLevel, timeline, skills, recommendationSummary, suggestedRoles |
| History | Mapped from `request.history[]` → `AssistantMessage` / `UserMessage` (each truncated to 1000 chars) |
| User | Current message (truncated to 1000 chars) |
| OllamaOptions | model=llama3.2, temperature=0.4, numPredict=350 |

### Per-chat AI controls (new)

Both chatbot endpoints now accept optional runtime controls in request payload:

```json
{
  "message": "How do I become an aircraft design engineer?",
  "maxResponseWords": 100,
  "temperature": 0.35,
  "maxTokens": 320,
  "model": "llama3.2"
}
```

Rules:
- `maxResponseWords`: min 20, max 300 (default from `student.chatbot.max-response-words`)
- `temperature`: min 0.0, max 1.0
- `maxTokens`: min 64, max 1200
- `model`: max length 80 chars

Enforcement behavior:
- Prompt-level: system prompt includes `Limit each reply to at most N words`
- Backend-level: reply text is word-capped after generation
- Stream-level: SSE chunks are emitted only until the word budget is exhausted

### Local Fallback Reply (`buildLocalStudentAdvisorReply`)

Rule-based text generation based on keywords in the user message:
- Keywords `start / begin / next` → project + skill + portfolio advice
- Keywords `skill / learn` → fundamentals + project proof advice
- Keywords `job / intern / apply` → application targeting advice
- Default → general exploration guidance

---

## 4. Feature: Student Intake Recommendation

```
DashboardAPI.java → POST /dashboard/students/intake-recommendation
  │
  ▼
AiAssistantServiceImpl.getStudentIntakeRecommendation()
  │  Reads: student.recommendation.provider property
  │  Routes to:
  │    "openai"  → getStudentRecommendationFromOpenAi() (raw HTTP → OpenAI)
  │    "ollama"  → getStudentRecommendationFromOllama() (raw HTTP → Ollama /api/generate)
  │    "local" (default) → buildLocalStudentRecommendation() (pure Java logic)
```

### Ollama Path (raw HTTP, NOT Spring AI)

```java
// Calls ollama.base-url (default: http://localhost:11434/api/generate)
// Payload: { model, stream: false, prompt: buildStudentRecommendationPrompt() }
// Timeout: 60 seconds (HttpClient)
// Parses: response.path("response") → parseRecommendationJson()
```

The recommendation prompt requests JSON with keys: `summary`, `pathwayMode`, `recommendedRoles`, `roleConfidence`, `roleReasons`, `focusAreas`, `nextSteps`.

---

## 5. Feature: Profile Chat Assistant

```
ProfileAPI.java → POST /profiles/chatAssistant
  │
  ▼
AiAssistantServiceImpl.getProfileAssistantReply()
  │  Uses raw Java HttpClient → OpenAI API (NOT Ollama)
  │  Requires: OPENAI_API_KEY set in environment
  │  Returns: JobPortalException if key missing
  │  Timeout: 45 seconds
  │  Model: gpt-4o-mini (configurable)
  │  Max tokens: 350
```

This feature is **not Ollama-powered** — it exclusively uses OpenAI.

---

## 6. Security & CORS

```java
// SecurityConfig.java — these endpoints are PUBLIC (no JWT required):
"/api/ahrm/v3/dashboard/students/chatbot"
"/api/ahrm/v3/dashboard/students/chatbot/stream"

// These endpoints require JWT:
"/api/ahrm/v3/profiles/skillSuggestions"  (auth enforced by JwtAuthenticationFilter)
```

The SSE stream endpoint uses native `fetch()` (not `axiosInstance`) so the `X-CSRF-Token` header from `AxiosInterceptor` is **not** sent. This is accepted because the chatbot endpoints are public.

---

## 7. Known Latency Characteristics

| Operation | Observed Latency | Timeout Setting |
|-----------|-----------------|-----------------|
| Skill Suggestions (complex profile, 25+ skills) | ~128 seconds | Frontend: 180s |
| Student Advisor chat (typical message) | ~30–90 seconds (estimated) | SseEmitter: none |
| Student Recommendation (ollama mode) | ~60 seconds max | HttpClient: 60s |
| Profile Chat Assistant (OpenAI) | ~5–15 seconds | HttpClient: 45s |

**Root cause of latency**: Ollama runs llama3.2 locally without GPU acceleration. The model is loaded on first use (no pre-warm). Inference time scales with prompt token count.

### Current Mitigations

1. Frontend timeout raised to **180,000 ms** in `profile-service.ts`
2. 1x automatic retry on transient network errors (`ECONNABORTED`, `ERR_NETWORK`, `ERR_CANCELED`, 5xx)
3. Backend catches all exceptions and returns fallback suggestions instead of 500 error
4. Streaming (SSE) path for chatbot avoids browser timeout — tokens appear as they are generated

---

## 8. File Reference Map

| Layer | File | Purpose |
|-------|------|---------|
| Frontend UI | `frontend/src/app/features/profile/Skills.tsx` | Skill suggestions modal, suggestion badges |
| Frontend UI | `frontend/src/app/dashboard/StudentDashboardView.tsx` | Chat UI, stream + fallback logic |
| Frontend Service | `frontend/src/app/services/profile-service.ts` | `getProfileSkillSuggestions()` with 180s timeout + retry |
| Frontend Service | `frontend/src/app/services/student-chat-service.ts` | `chatWithStudentAdvisor()`, `streamStudentAdvisorChat()` SSE reader |
| Backend Controller | `backend/.../api/ProfileAPI.java` | `POST /profiles/skillSuggestions`, `POST /profiles/chatAssistant` |
| Backend Controller | `backend/.../api/DashboardAPI.java` | `POST /dashboard/students/chatbot`, SSE stream endpoint |
| Backend Service | `backend/.../service/AiAssistantServiceImpl.java` | All AI logic: prompts, Ollama calls, parsing, fallbacks |
| Config | `backend/.../resources/application.properties` | All Ollama/OpenAI property defaults |
