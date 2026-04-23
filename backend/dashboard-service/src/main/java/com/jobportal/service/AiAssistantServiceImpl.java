package com.jobportal.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.dto.StudentAdvisorChatMessageDTO;
import com.jobportal.dto.StudentAdvisorChatRequestDTO;
import com.jobportal.dto.StudentAdvisorChatResponseDTO;
import com.jobportal.dto.StudentIntakeRecommendationDTO;
import com.jobportal.dto.StudentIntakeRequestDTO;
import com.jobportal.exception.JobPortalException;
import reactor.core.publisher.Flux;

@Service("aiAssistantService")
public class AiAssistantServiceImpl implements AiAssistantService {

	private static final Logger logger = LoggerFactory.getLogger(AiAssistantServiceImpl.class);
	private final HttpClient httpClient;
	private final ObjectMapper objectMapper;
	private volatile OllamaChatModel studentAdvisorChatModel;

	@Value("${openai.api.key:}")
	private String openAiApiKey;

	@Value("${openai.base-url:https://api.openai.com/v1/chat/completions}")
	private String openAiBaseUrl;

	@Value("${openai.model:gpt-4o-mini}")
	private String openAiModel;

	@Value("${openai.max-tokens:350}")
	private int maxTokens;

	@Value("${student.recommendation.provider:local}")
	private String studentRecommendationProvider;

	@Value("${student.recommendation.openai.max-tokens:450}")
	private int studentRecommendationMaxTokens;

	@Value("${ollama.base-url:http://localhost:11434/api/generate}")
	private String ollamaBaseUrl;

	@Value("${ollama.model:llama3.2}")
	private String ollamaModel;

	@Value("${spring.ai.ollama.base-url:http://localhost:11434}")
	private String springAiOllamaBaseUrl;

	@Value("${spring.ai.ollama.chat.options.model:llama3.2}")
	private String springAiOllamaModel;

	@Value("${student.chatbot.ollama.temperature:0.4}")
	private Double studentChatbotTemperature;

	@Value("${student.chatbot.ollama.max-tokens:350}")
	private Integer studentChatbotMaxTokens;

	@Value("${student.chatbot.max-response-words:100}")
	private Integer studentChatbotMaxResponseWords;

	public AiAssistantServiceImpl(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(20))
				.build();
	}

	@Override
	public String getProfileAssistantReply(String message, String accountType, String profileContext) throws JobPortalException {
		if (openAiApiKey == null || openAiApiKey.isBlank()) {
			throw new JobPortalException("Profile assistant is not configured. Set OPENAI_API_KEY on the backend.");
		}

		try {
			String requestBody = objectMapper.writeValueAsString(buildPayload(message, accountType, profileContext));
			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(openAiBaseUrl))
					.timeout(Duration.ofSeconds(45))
					.header("Authorization", "Bearer " + openAiApiKey)
					.header("Content-Type", "application/json")
					.POST(HttpRequest.BodyPublishers.ofString(requestBody))
					.build();

			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				logger.error("OpenAI request failed with status {} and body {}", response.statusCode(), response.body());
				throw new JobPortalException("Profile assistant could not respond right now. Please try again later.");
			}

			JsonNode responseJson = objectMapper.readTree(response.body());
			String reply = responseJson.path("choices").path(0).path("message").path("content").asText("").trim();
			if (reply.isEmpty()) {
				throw new JobPortalException("Profile assistant returned an empty response. Please try again.");
			}
			return reply;
		} catch (JobPortalException e) {
			throw e;
		} catch (Exception e) {
			logger.error("Failed to fetch assistant response", e);
			throw new JobPortalException("Profile assistant is temporarily unavailable.");
		}
	}

	@Override
	public List<String> getProfileSkillSuggestions(String accountType, String profileContext, List<String> existingSkills) throws JobPortalException {
		List<String> normalizedExisting = sanitizeSkills(existingSkills);
		try {
			Prompt prompt = buildProfileSkillSuggestionPrompt(accountType, profileContext, normalizedExisting);
			ChatResponse response = getStudentAdvisorChatModel().call(prompt);
			String raw = clean(response.getResult().getOutput().getText(), "");
			List<String> parsed = parseSkillSuggestionResponse(raw);
			List<String> filtered = parsed.stream()
					.filter(skill -> normalizedExisting.stream().noneMatch(existing -> existing.equalsIgnoreCase(skill)))
					.limit(15)
					.toList();
			if (!filtered.isEmpty()) {
				return filtered;
			}
		} catch (Exception ex) {
			logger.warn("Profile skill suggestion fallback triggered: {}", ex.getMessage());
		}

		return buildProfileSkillFallbackSuggestions(accountType, normalizedExisting);
	}

	@Override
	public StudentIntakeRecommendationDTO getStudentIntakeRecommendation(StudentIntakeRequestDTO request) throws JobPortalException {
		String provider = clean(studentRecommendationProvider, "local").toLowerCase();
		if ("openai".equals(provider)) {
			return getStudentRecommendationFromOpenAi(request);
		}
		if ("ollama".equals(provider)) {
			return getStudentRecommendationFromOllama(request);
		}
		return buildLocalStudentRecommendation(request);
	}

	@Override
	public StudentAdvisorChatResponseDTO chatWithStudentAdvisor(StudentAdvisorChatRequestDTO request) throws JobPortalException {
		StudentAdvisorChatResponseDTO response = new StudentAdvisorChatResponseDTO();
		try {
			response.setReply(getStudentAdvisorReplyFromOllama(request));
			response.setProvider("spring-ai-ollama");
			return response;
		} catch (Exception ex) {
			logger.warn("Student advisor chatbot fallback to local: {}", ex.getMessage());
			response.setReply(buildLocalStudentAdvisorReply(request));
			response.setProvider("local-fallback");
			return response;
		}
	}

	@Override
	public Flux<String> streamStudentAdvisorChat(StudentAdvisorChatRequestDTO request) {
		try {
			Prompt prompt = buildStudentAdvisorPrompt(request);
			int maxResponseWords = resolveMaxResponseWords(request);
			AtomicInteger wordsUsed = new AtomicInteger(0);
			return getStudentAdvisorChatModel().stream(prompt)
					.map(chatResponse -> clean(chatResponse.getResult().getOutput().getText(), ""))
					.filter(chunk -> !chunk.isBlank())
					.map(chunk -> truncate(chunk, 800))
					.map(chunk -> limitWordsByBudget(chunk, wordsUsed, maxResponseWords))
					.filter(chunk -> !chunk.isBlank())
					.switchIfEmpty(Flux.just(buildLocalStudentAdvisorReply(request)))
					.onErrorResume(ex -> {
						logger.warn("Student advisor stream fallback to local: {}", ex.getMessage());
						return Flux.just(limitWords(buildLocalStudentAdvisorReply(request), maxResponseWords));
					});
		} catch (Exception ex) {
			logger.warn("Student advisor stream setup failed, fallback to local: {}", ex.getMessage());
			return Flux.just(limitWords(buildLocalStudentAdvisorReply(request), resolveMaxResponseWords(request)));
		}
	}

	private StudentIntakeRecommendationDTO getStudentRecommendationFromOpenAi(StudentIntakeRequestDTO request) throws JobPortalException {
		if (openAiApiKey == null || openAiApiKey.isBlank()) {
			return buildLocalStudentRecommendation(request);
		}

		try {
			String prompt = buildStudentRecommendationPrompt(request);
			Map<String, Object> payload = new LinkedHashMap<>();
			payload.put("model", openAiModel);
			payload.put("max_tokens", studentRecommendationMaxTokens);
			payload.put("temperature", 0.5);
			payload.put("messages", List.of(
					Map.of("role", "system", "content", "You are AfroHR's student advisor. Always respond with valid JSON only."),
					Map.of("role", "user", "content", prompt)
			));

			HttpRequest httpRequest = HttpRequest.newBuilder()
					.uri(URI.create(openAiBaseUrl))
					.timeout(Duration.ofSeconds(45))
					.header("Authorization", "Bearer " + openAiApiKey)
					.header("Content-Type", "application/json")
					.POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
					.build();

			HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				logger.error("Student recommendation OpenAI status {} body {}", response.statusCode(), response.body());
				return buildLocalStudentRecommendation(request);
			}

			JsonNode responseJson = objectMapper.readTree(response.body());
			String content = responseJson.path("choices").path(0).path("message").path("content").asText("").trim();
			if (content.isEmpty()) {
				return buildLocalStudentRecommendation(request);
			}

			StudentIntakeRecommendationDTO parsed = parseRecommendationJson(content);
			return parsed != null ? parsed : buildLocalStudentRecommendation(request);
		} catch (Exception ex) {
			logger.warn("OpenAI recommendation fallback to local: {}", ex.getMessage());
			return buildLocalStudentRecommendation(request);
		}
	}

	private StudentIntakeRecommendationDTO getStudentRecommendationFromOllama(StudentIntakeRequestDTO request) throws JobPortalException {
		try {
			Map<String, Object> payload = new LinkedHashMap<>();
			payload.put("model", ollamaModel);
			payload.put("stream", false);
			payload.put("prompt", buildStudentRecommendationPrompt(request));

			HttpRequest httpRequest = HttpRequest.newBuilder()
					.uri(URI.create(ollamaBaseUrl))
					.timeout(Duration.ofSeconds(60))
					.header("Content-Type", "application/json")
					.POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
					.build();

			HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				logger.error("Student recommendation Ollama status {} body {}", response.statusCode(), response.body());
				return buildLocalStudentRecommendation(request);
			}

			JsonNode responseJson = objectMapper.readTree(response.body());
			String content = responseJson.path("response").asText("").trim();
			if (content.isEmpty()) {
				return buildLocalStudentRecommendation(request);
			}

			StudentIntakeRecommendationDTO parsed = parseRecommendationJson(content);
			return parsed != null ? parsed : buildLocalStudentRecommendation(request);
		} catch (Exception ex) {
			logger.warn("Ollama recommendation fallback to local: {}", ex.getMessage());
			return buildLocalStudentRecommendation(request);
		}
	}

	private String getStudentAdvisorReplyFromOllama(StudentAdvisorChatRequestDTO request) {
 		Prompt prompt = buildStudentAdvisorPrompt(request);
		int maxResponseWords = resolveMaxResponseWords(request);

		ChatResponse response = getStudentAdvisorChatModel().call(prompt);
		String reply = clean(response.getResult().getOutput().getText(), "");
		if (reply.isBlank()) {
			throw new IllegalStateException("Empty Ollama student advisor response");
		}
		return limitWords(truncate(reply, 2200), maxResponseWords);
	}

	private Prompt buildStudentAdvisorPrompt(StudentAdvisorChatRequestDTO request) {
		List<Message> messages = new ArrayList<>();
		String systemPrompt = Objects.requireNonNull(buildStudentAdvisorSystemPrompt(request));
		messages.add(new SystemMessage(systemPrompt));

		for (StudentAdvisorChatMessageDTO historyItem : request.getHistory()) {
			Message mapped = toSpringAiMessage(historyItem);
			if (mapped != null) {
				messages.add(mapped);
			}
		}

		String userPrompt = Objects.requireNonNull(truncate(clean(request.getMessage(), ""), 1000));
		messages.add(new UserMessage(userPrompt));

		return new Prompt(messages, OllamaOptions.builder()
				.model(resolveStudentAdvisorModel(request))
				.temperature(resolveStudentAdvisorTemperature(request))
				.numPredict(resolveStudentAdvisorMaxTokens(request))
				.build());
	}

	private Prompt buildProfileSkillSuggestionPrompt(String accountType, String profileContext, List<String> existingSkills) {
		String normalizedAccountType = clean(accountType, "UNKNOWN").toUpperCase();
		String normalizedContext = truncate(clean(profileContext, "No profile context provided."), 3000);
		String existing = existingSkills.isEmpty() ? "none" : String.join(", ", existingSkills);

		String systemPrompt = "You are AfroHR's profile skills advisor. Suggest practical resume-ready skills only. "
				+ "Return ONLY a JSON array of strings. No markdown, no explanation.";

		String userPrompt = "Account type: " + normalizedAccountType + "\n"
				+ "Profile context:\n" + normalizedContext + "\n\n"
				+ "Already listed skills: " + existing + "\n\n"
				+ "Generate 10 to 15 additional skill suggestions relevant to this profile. "
				+ "Rules:\n"
				+ "- Keep each skill short (max 40 chars).\n"
				+ "- Prefer concrete, recruiter-searchable terms.\n"
				+ "- Avoid duplicates and avoid already listed skills.\n"
				+ "- Return valid JSON array only, e.g. [\"Skill A\", \"Skill B\"].";

		List<Message> messages = List.of(new SystemMessage(systemPrompt), new UserMessage(userPrompt));

		return new Prompt(messages, OllamaOptions.builder()
				.model(clean(springAiOllamaModel, clean(ollamaModel, "llama3.2")))
				.temperature(0.3)
				.numPredict(260)
				.build());
	}

	private List<String> parseSkillSuggestionResponse(String rawResponse) {
		String cleaned = clean(rawResponse, "");
		if (cleaned.isBlank()) {
			return List.of();
		}

		String normalized = cleaned
				.replace("```json", "")
				.replace("```", "")
				.trim();

		int arrayStart = normalized.indexOf('[');
		int arrayEnd = normalized.lastIndexOf(']');
		if (arrayStart >= 0 && arrayEnd > arrayStart) {
			String arrayJson = normalized.substring(arrayStart, arrayEnd + 1);
			try {
				JsonNode node = objectMapper.readTree(arrayJson);
				if (node.isArray()) {
					List<String> parsed = new ArrayList<>();
					node.forEach(item -> {
						if (item.isTextual()) {
							String value = sanitizeSkill(item.asText(""));
							if (!value.isBlank()) {
								parsed.add(value);
							}
						}
					});
					return dedupeSkills(parsed);
				}
			} catch (Exception ignored) {
				// fallback parser below
			}
		}

		List<String> fallback = Arrays.stream(normalized.split("\\r?\\n|,"))
				.map(value -> value.replaceFirst("^[-*\\d.)\\s]+", ""))
				.map(this::sanitizeSkill)
				.filter(value -> !value.isBlank())
				.toList();

		return dedupeSkills(fallback);
	}

	private List<String> buildProfileSkillFallbackSuggestions(String accountType, List<String> existingSkills) {
		String normalized = clean(accountType, "").toUpperCase();
		List<String> base = switch (normalized) {
			case "STUDENT" -> List.of("Problem Solving", "Communication", "Teamwork", "Git", "SQL", "Time Management");
			case "EMPLOYER" -> List.of("Talent Acquisition", "Interview Coordination", "Stakeholder Management", "Screening", "ATS", "Offer Negotiation");
			default -> List.of("Communication", "Problem Solving", "Stakeholder Management", "Collaboration", "Adaptability", "Analytical Thinking");
		};

		return base.stream()
				.filter(skill -> existingSkills.stream().noneMatch(existing -> existing.equalsIgnoreCase(skill)))
				.limit(10)
				.toList();
	}

	private List<String> sanitizeSkills(List<String> skills) {
		if (skills == null) {
			return List.of();
		}
		return dedupeSkills(skills.stream().map(this::sanitizeSkill).filter(skill -> !skill.isBlank()).toList());
	}

	private List<String> dedupeSkills(List<String> skills) {
		Set<String> seen = new LinkedHashSet<>();
		List<String> deduped = new ArrayList<>();
		for (String skill : skills) {
			String key = skill.toLowerCase();
			if (seen.add(key)) {
				deduped.add(skill);
			}
		}
		return deduped;
	}

	private String sanitizeSkill(String rawSkill) {
		String normalized = clean(rawSkill, "")
				.replaceAll("[\\[\\]\\\"`]", "")
				.replaceAll("\\s+", " ")
				.trim();
		return truncate(normalized, 40);
	}

	private OllamaChatModel getStudentAdvisorChatModel() {
		if (studentAdvisorChatModel == null) {
			synchronized (this) {
				if (studentAdvisorChatModel == null) {
					studentAdvisorChatModel = OllamaChatModel.builder()
							.ollamaApi(OllamaApi.builder().baseUrl(clean(springAiOllamaBaseUrl, "http://localhost:11434")).build())
							.defaultOptions(OllamaOptions.builder()
									.model(clean(springAiOllamaModel, clean(ollamaModel, "llama3.2")))
									.temperature(studentChatbotTemperature)
									.numPredict(studentChatbotMaxTokens)
									.build())
							.build();
				}
			}
		}
		return studentAdvisorChatModel;
	}

	private Message toSpringAiMessage(StudentAdvisorChatMessageDTO historyItem) {
		String role = clean(historyItem.getRole(), "user").toLowerCase();
		String content = truncate(clean(historyItem.getContent(), ""), 1000);
		if (content.isBlank()) {
			return null;
		}
		if ("assistant".equals(role)) {
			return new AssistantMessage(content);
		}
		return new UserMessage(content);
	}

	private String buildStudentAdvisorSystemPrompt(StudentAdvisorChatRequestDTO request) {
		String primaryInterest = clean(request.getPrimaryInterest(), "general career exploration");
		String primaryField = clean(request.getPrimaryField(), "undecided field");
		String decisionMode = clean(request.getDecisionMode(), "exploring");
		String targetRole = clean(request.getTargetRole(), "");
		String backgroundLevel = clean(request.getBackgroundLevel(), "not shared");
		String timeline = clean(request.getTimeline(), "not shared");
		String skills = clean(request.getSkills(), "not shared");
		String recommendationSummary = clean(request.getRecommendationSummary(), "");
		int maxResponseWords = resolveMaxResponseWords(request);
		String recommendedRoles = request.getRecommendedRoles() == null || request.getRecommendedRoles().isEmpty()
				? "not available"
				: request.getRecommendedRoles().stream().map(role -> clean(role, "")).filter(role -> !role.isBlank()).limit(4).collect(Collectors.joining(", "));

		return "You are AfroHR's student career advisor. Give practical, concise guidance for students. "
				+ "Ground your answers in the student context below, but if context is incomplete, ask at most one clarifying question. "
				+ "Prefer actionable next steps, realistic skills guidance, and student-friendly language. Avoid markdown tables. "
				+ "Limit each reply to at most " + maxResponseWords + " words.\n\n"
				+ "Student context:\n"
				+ "- Decision mode: " + decisionMode + "\n"
				+ "- Primary interest: " + primaryInterest + "\n"
				+ "- Primary field: " + primaryField + "\n"
				+ "- Target role: " + (targetRole.isBlank() ? "not set" : targetRole) + "\n"
				+ "- Background level: " + backgroundLevel + "\n"
				+ "- Timeline: " + timeline + "\n"
				+ "- Skills: " + skills + "\n"
				+ "- Recommendation summary: " + (recommendationSummary.isBlank() ? "not available" : recommendationSummary) + "\n"
				+ "- Suggested roles: " + recommendedRoles + "\n";
	}

	private String buildLocalStudentAdvisorReply(StudentAdvisorChatRequestDTO request) {
		String primaryInterest = clean(request.getPrimaryInterest(), "your selected area");
		String primaryField = clean(request.getPrimaryField(), "your field");
		String targetRole = clean(request.getTargetRole(), "");
		String question = clean(request.getMessage(), "your question").toLowerCase();

		String intro = !targetRole.isBlank()
				? "You are currently aiming toward " + targetRole + ", so keep your next steps tightly aligned to that role."
				: "You are still exploring, so use short experiments to compare adjacent career options before committing.";

		if (question.contains("start") || question.contains("begin") || question.contains("next")) {
			return intro + " Start with one small project in " + primaryField + ", one skill checkpoint this week, and one portfolio proof point connected to " + primaryInterest + ".";
		}
		if (question.contains("skill") || question.contains("learn")) {
			return intro + " Prioritize fundamentals in " + primaryField + ", then add one project that proves you can apply the skills rather than only list them.";
		}
		if (question.contains("job") || question.contains("intern") || question.contains("apply")) {
			return intro + " Focus your applications on roles close to " + (targetRole.isBlank() ? primaryField : targetRole) + ", tailor your resume headline, and show one outcome-based project before expanding your applications.";
		}
		return intro + " Based on your current context in " + primaryInterest + " and " + primaryField + ", ask about next steps, skills, projects, or role fit and I will narrow the advice further.";
	}

	private String buildStudentRecommendationPrompt(StudentIntakeRequestDTO request) {
		return "Return JSON only with keys summary,pathwayMode,recommendedRoles,roleConfidence,roleReasons,focusAreas,nextSteps. " +
				"All list values must be short strings. " +
				"roleConfidence must be an object where each key is a role from recommendedRoles and each value is an integer 0-100. " +
				"roleReasons must be an object where each key is a role from recommendedRoles and each value is an array of short reasons. " +
				"pathwayMode must be either focused or exploration. " +
				"Input: decisionMode=" + clean(request.getDecisionMode(), "exploring") +
				", targetRole=" + clean(request.getTargetRole(), "") +
				", primaryInterest=" + clean(request.getPrimaryInterest(), "") +
				", primaryField=" + clean(request.getPrimaryField(), "") +
				", backgroundLevel=" + clean(request.getBackgroundLevel(), "") +
				", timeline=" + clean(request.getTimeline(), "") +
				", skills=" + clean(request.getSkills(), "") + ".";
	}

	private StudentIntakeRecommendationDTO parseRecommendationJson(String content) {
		try {
			String sanitized = content.trim();
			int firstBrace = sanitized.indexOf("{");
			int lastBrace = sanitized.lastIndexOf("}");
			if (firstBrace >= 0 && lastBrace > firstBrace) {
				sanitized = sanitized.substring(firstBrace, lastBrace + 1);
			}
			JsonNode node = objectMapper.readTree(sanitized);
			StudentIntakeRecommendationDTO dto = new StudentIntakeRecommendationDTO();
			dto.setSummary(clean(node.path("summary").asText("Personalized recommendations generated."), "Personalized recommendations generated."));
			dto.setPathwayMode(clean(node.path("pathwayMode").asText("exploration"), "exploration"));
			dto.setRecommendedRoles(readStringList(node.path("recommendedRoles")));
			dto.setRoleConfidence(readRoleConfidence(node.path("roleConfidence")));
			dto.setRoleReasons(readRoleReasons(node.path("roleReasons")));
			dto.setFocusAreas(readStringList(node.path("focusAreas")));
			dto.setNextSteps(readStringList(node.path("nextSteps")));
			return dto;
		} catch (Exception ex) {
			logger.warn("Failed to parse recommendation JSON: {}", ex.getMessage());
			return null;
		}
	}

	private List<String> readStringList(JsonNode node) {
		if (!node.isArray()) {
			return List.of();
		}
		List<String> values = new ArrayList<>();
		node.forEach(item -> {
			String value = clean(item.asText(""), "");
			if (!value.isBlank()) {
				values.add(value);
			}
		});
		return values;
	}

	private Map<String, List<String>> readRoleReasons(JsonNode node) {
		if (!node.isObject()) {
			return Map.of();
		}

		Map<String, List<String>> reasons = new LinkedHashMap<>();
		node.fields().forEachRemaining(entry -> {
			String role = clean(entry.getKey(), "");
			if (role.isBlank()) {
				return;
			}
			List<String> roleReasonList = readStringList(entry.getValue());
			if (!roleReasonList.isEmpty()) {
				reasons.put(role, roleReasonList);
			}
		});
		return reasons;
	}

	private Map<String, Integer> readRoleConfidence(JsonNode node) {
		if (!node.isObject()) {
			return Map.of();
		}

		Map<String, Integer> confidence = new LinkedHashMap<>();
		node.fields().forEachRemaining(entry -> {
			String role = clean(entry.getKey(), "");
			if (role.isBlank()) {
				return;
			}
			int score = entry.getValue().asInt(-1);
			if (score >= 0) {
				confidence.put(role, Math.max(0, Math.min(100, score)));
			}
		});
		return confidence;
	}

	private StudentIntakeRecommendationDTO buildLocalStudentRecommendation(StudentIntakeRequestDTO request) {
		String decisionMode = clean(request.getDecisionMode(), "exploring").toLowerCase();
		String primaryInterest = clean(request.getPrimaryInterest(), "Technology");
		String primaryField = clean(request.getPrimaryField(), "General");
		String targetRole = clean(request.getTargetRole(), "");

		List<String> recommendedRoles = inferRoles(primaryInterest, primaryField, targetRole);
		List<String> focusAreas = inferFocusAreas(primaryField, request.getSkills());
		List<String> nextSteps = inferNextSteps(decisionMode, primaryInterest, targetRole, request.getTimeline());
		Map<String, Integer> roleConfidence = inferRoleConfidence(decisionMode, recommendedRoles);
		Map<String, List<String>> roleReasons = inferRoleReasons(decisionMode, primaryInterest, primaryField, targetRole, recommendedRoles, focusAreas, nextSteps);

		StudentIntakeRecommendationDTO dto = new StudentIntakeRecommendationDTO();
		dto.setPathwayMode("determined".equals(decisionMode) ? "focused" : "exploration");
		dto.setSummary("determined".equals(decisionMode)
				? "You are goal-focused. Prioritize role-specific projects and interview-ready proof of work."
				: "You are in exploration mode. Compare adjacent career options and narrow your direction with short experiments.");
		dto.setRecommendedRoles(recommendedRoles);
		dto.setRoleConfidence(roleConfidence);
		dto.setRoleReasons(roleReasons);
		dto.setFocusAreas(focusAreas);
		dto.setNextSteps(nextSteps);
		return dto;
	}

	private Map<String, Integer> inferRoleConfidence(String decisionMode, List<String> recommendedRoles) {
		Map<String, Integer> confidence = new LinkedHashMap<>();
		for (int idx = 0; idx < recommendedRoles.size(); idx++) {
			String role = recommendedRoles.get(idx);
			int base = "determined".equals(decisionMode) ? 90 : 82;
			int score = Math.max(55, base - (idx * 8));
			confidence.put(role, score);
		}
		return confidence;
	}

	private Map<String, List<String>> inferRoleReasons(
			String decisionMode,
			String primaryInterest,
			String primaryField,
			String targetRole,
			List<String> recommendedRoles,
			List<String> focusAreas,
			List<String> nextSteps) {
		Map<String, List<String>> reasons = new LinkedHashMap<>();
		String defaultFocus = focusAreas.isEmpty() ? primaryField + " fundamentals" : focusAreas.get(0);
		String defaultStep = nextSteps.isEmpty() ? "Build one proof-of-work project" : nextSteps.get(0);

		for (int idx = 0; idx < recommendedRoles.size(); idx++) {
			String role = recommendedRoles.get(idx);
			String focusHint = idx < focusAreas.size() ? focusAreas.get(idx) : defaultFocus;
			List<String> roleHints = List.of(
					"Aligned with " + primaryInterest,
					"determined".equals(decisionMode) && !targetRole.isBlank()
							? "Close to your target role: " + targetRole
							: "Useful for exploring adjacent pathways",
					idx == 0 ? "Start with: " + defaultStep : "Skill focus: " + focusHint
			);
			reasons.put(role, roleHints);
		}
		return reasons;
	}

	private List<String> inferRoles(String primaryInterest, String primaryField, String targetRole) {
		if (!targetRole.isBlank()) {
			return List.of(targetRole, targetRole + " Intern", targetRole + " Associate");
		}

		String seed = (primaryInterest + " " + primaryField).toLowerCase();
		if (seed.contains("data") || seed.contains("ai") || seed.contains("ml")) {
			return List.of("Data Analyst", "Machine Learning Engineer", "Data Engineer");
		}
		if (seed.contains("cloud") || seed.contains("devops")) {
			return List.of("Cloud Engineer", "DevOps Engineer", "Site Reliability Engineer");
		}
		if (seed.contains("security")) {
			return List.of("Security Analyst", "SOC Analyst", "Application Security Engineer");
		}
		if (seed.contains("frontend") || seed.contains("backend") || seed.contains("software") || seed.contains("full")) {
			return List.of("Software Engineer", "Frontend Developer", "Backend Developer");
		}
		return List.of("Business Analyst", "Product Analyst", "Operations Analyst");
	}

	private List<String> inferFocusAreas(String primaryField, String skills) {
		List<String> list = new ArrayList<>();
		String field = clean(primaryField, "General");
		list.add(field + " fundamentals");
		list.add("Portfolio projects");
		list.add("Interview preparation");

		if (skills != null && !skills.isBlank()) {
			String firstSkill = List.of(skills.split(","))
					.stream()
					.map(String::trim)
					.filter(token -> !token.isBlank())
					.findFirst()
					.orElse(null);
			if (firstSkill != null) {
				list.add(firstSkill + " advanced practice");
			}
		}

		return list.stream().filter(Objects::nonNull).distinct().limit(4).collect(Collectors.toList());
	}

	private List<String> inferNextSteps(String decisionMode, String primaryInterest, String targetRole, String timeline) {
		List<String> steps = new ArrayList<>();
		if ("determined".equals(decisionMode)) {
			steps.add("Finalize a " + clean(targetRole, "target role") + " learning roadmap");
			steps.add("Build one role-aligned project this week");
			steps.add("Update profile headline and skills for recruiter search");
		} else {
			steps.add("Compare top 3 " + clean(primaryInterest, "career") + " pathways");
			steps.add("Run one short trial project in each shortlisted pathway");
			steps.add("Select one path based on effort and demand fit");
		}

		if (timeline != null && !timeline.isBlank()) {
			steps.add("Set a " + timeline + " checkpoint review in your action plan");
		}

		return steps.stream().distinct().limit(4).collect(Collectors.toList());
	}

	private Map<String, Object> buildPayload(String message, String accountType, String profileContext) {
		String systemPrompt = "You are AfroHR's profile assistant. Help users improve their profile, hiring summary, skills presentation, and recruiter-facing content. Be concise, practical, and action-oriented. When profile context is provided, tailor the advice to that context. Prefer short paragraphs or bullet points when useful.";
		String userPrompt = String.format(
				"Account type: %s\n\nProfile context:\n%s\n\nUser message:\n%s",
				clean(accountType, "Unknown"),
				truncate(clean(profileContext, "No profile context provided."), 6000),
				truncate(clean(message, ""), 2000)
		);

		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("model", openAiModel);
		payload.put("max_tokens", maxTokens);
		payload.put("temperature", 0.7);
		payload.put("messages", List.of(
				Map.of("role", "system", "content", systemPrompt),
				Map.of("role", "user", "content", userPrompt)
		));
		return payload;
	}

	private String clean(String value, String fallback) {
		if (value == null) {
			return fallback;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? fallback : trimmed;
	}

	private String truncate(String value, int maxLength) {
		if (value.length() <= maxLength) {
			return value;
		}
		return value.substring(0, maxLength);
	}

	private String resolveStudentAdvisorModel(StudentAdvisorChatRequestDTO request) {
		return clean(request.getModel(), clean(springAiOllamaModel, clean(ollamaModel, "llama3.2")));
	}

	private Double resolveStudentAdvisorTemperature(StudentAdvisorChatRequestDTO request) {
		Double requested = request.getTemperature();
		if (requested == null) {
			return studentChatbotTemperature;
		}
		return Math.max(0.0, Math.min(1.0, requested));
	}

	private Integer resolveStudentAdvisorMaxTokens(StudentAdvisorChatRequestDTO request) {
		Integer requested = request.getMaxTokens();
		if (requested == null) {
			return studentChatbotMaxTokens;
		}
		return Math.max(64, Math.min(1200, requested));
	}

	private int resolveMaxResponseWords(StudentAdvisorChatRequestDTO request) {
		Integer requested = request.getMaxResponseWords();
		if (requested == null) {
			int configuredDefault = studentChatbotMaxResponseWords == null ? 100 : studentChatbotMaxResponseWords;
			return Math.max(20, Math.min(300, configuredDefault));
		}
		return Math.max(20, Math.min(300, requested));
	}

	private String limitWords(String text, int maxWords) {
		String normalized = clean(text, "").trim();
		if (normalized.isEmpty()) {
			return normalized;
		}

		String[] words = normalized.split("\\s+");
		if (words.length <= maxWords) {
			return normalized;
		}

		return String.join(" ", Arrays.copyOfRange(words, 0, maxWords));
	}

	private String limitWordsByBudget(String chunk, AtomicInteger wordsUsed, int maxWords) {
		String normalized = clean(chunk, "").trim();
		if (normalized.isEmpty()) {
			return "";
		}

		int remaining = maxWords - wordsUsed.get();
		if (remaining <= 0) {
			return "";
		}

		String limited = limitWords(normalized, remaining);
		int emittedWords = limited.isBlank() ? 0 : limited.split("\\s+").length;
		if (emittedWords > 0) {
			wordsUsed.addAndGet(emittedWords);
		}
		return limited;
	}
}
