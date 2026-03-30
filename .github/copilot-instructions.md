# AfroHR Portal — Copilot Instructions

> **ALWAYS read this file before generating any code, making any change, or answering any question about this project.**
> These rules are non-negotiable and override any general best-practice defaults.

---

## 1. Project Overview

**AfroHR Portal** is a full-stack recruitment and HR management platform supporting four user types: Applicants, Employers, Students, and Admins.

- Figma Design: https://www.figma.com/design/MRpKpAMGIhAu3M2jRFRgJB/AfroHR
- API map: [`api-endpoint-map.json`](../api-endpoint-map.json)
- Backend docs: [`backend/README.md`](../backend/README.md)

---

## 2. Tech Stack (Do Not Deviate)

### Frontend
| Concern | Library | Notes |
|---------|---------|-------|
| Framework | React 18 + TypeScript | Strict mode |
| Build | Vite 6 | Config at `frontend/vite.config.ts` |
| Routing | **`react-router`** | `react-router-dom` is aliased → `react-router` in vite.config; **never import from `react-router-dom`** |
| State | Redux Toolkit | Slices in `frontend/src/app/store/slices/` |
| UI | Mantine v7 | Theme defined in `frontend/src/theme.ts` (orange "brightSun" + "mineShaft" gray) |
| Styling | Tailwind CSS v4 | Inline classes; global styles in `frontend/src/styles/` |
| HTTP | Axios | Always use `axiosInstance` from `frontend/src/app/interceptor/AxiosInterceptor.tsx` — never raw `axios` |
| Validation | Zod | Schemas in `frontend/src/app/validators/` |
| Icons | Tabler Icons (`@tabler/icons-react`) + Lucide React | Check which is used in the file you are editing |

### Backend
| Concern | Library | Notes |
|---------|---------|-------|
| Framework | Spring Boot 3.2.5 (Java 21) | Single service: `backend/dashboard-service` |
| Security | Spring Security + JWT (HS512) | JWT secret in `application.properties` |
| Persistence | Spring Data JPA + Hibernate | `ddl-auto=update`, PostgreSQL dialect |
| Database | PostgreSQL 16 (Docker) | Port 5432, DB/user/pass all `afrohr` / `afrohr_password` |
| Build | Maven 3.9 | Run from `backend/dashboard-service/` |
| Docs | SpringDoc / Swagger | `GET /swagger-ui/**` |

---

## 3. Repository Structure

```
/
├── .github/
│   └── copilot-instructions.md   ← THIS FILE
├── frontend/
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx              ← BrowserRouter + all routes
│       ├── theme.ts              ← Mantine theme (edit only here for colors/fonts)
│       └── app/
│           ├── App.tsx           ← Dashboard layout + tab routing
│           ├── pages/            ← Route-level page components (PascalCase, end with "Page")
│           ├── features/         ← Feature modules (kebab-case dirs)
│           │   ├── auth/         ← Login.tsx, SignUp.tsx
│           │   ├── employer/     ← EmployerView.tsx (main employer dashboard)
│           │   ├── find-jobs/
│           │   ├── post-job/
│           │   └── ...
│           ├── components/
│           │   ├── layout/       ← Header, Footer, Navbar
│           │   └── ui/           ← Reusable UI primitives
│           ├── services/         ← API call functions (camelCase or PascalCase)
│           ├── interceptor/
│           │   └── AxiosInterceptor.tsx  ← axiosInstance + auth headers
│           ├── store/
│           │   └── slices/       ← UserSlice, JwtSlice, FilterSlice, SortSlice, etc.
│           ├── types/            ← TypeScript interfaces/types
│           └── validators/       ← Zod schemas
├── backend/
│   └── dashboard-service/
│       └── src/main/java/com/jobportal/
│           ├── api/              ← REST controllers (@RestController)
│           ├── service/          ← Business logic (interfaces + Impl)
│           ├── entity/           ← JPA entities
│           ├── dto/              ← Data transfer objects
│           ├── jwt/              ← JWT helpers + filter
│           ├── security/         ← SecurityConfig, CORS, rate limiting, CSRF
│           ├── repository/       ← JPA repositories
│           └── exception/        ← GlobalExceptionHandler, custom exceptions
└── docker-compose.yml            ← PostgreSQL + pgAdmin only
```

---

## 4. Authentication & Authorization Rules

### JWT Storage Pattern
- Token is stored in `localStorage` under key `"token"`
- Account type stored in `localStorage` under key `"accountType"`
- Redux slices (`JwtSlice`, `UserSlice`) mirror this state — always sync both when logging in/out
- **Logout**: dispatch `removeUser()` + `removeJwt()` then redirect to `/login`

### AccountType Enum (`com.jobportal.dto.AccountType`)
Only four valid values — use exactly these strings in frontend localStorage and backend enum:
```
APPLICANT   — job seekers / candidates
EMPLOYER    — companies that post jobs
STUDENT     — career explorers
ADMIN       — system administrators
```

### Role-Based Access (Frontend)
- `ProtectedRoute` in `main.tsx` accepts `allowedRoles: string[]`
- For guarding specific UI operations (not just routes) check `localStorage.getItem("accountType")` AND `localStorage.getItem("token")`
- The employer dashboard tab (`/dashboard?tab=employers`) redirects to `/login` for non-EMPLOYER accounts — see `App.tsx` for the pattern

### Backend Security
- Public endpoints (no JWT required): auth/login, users/register, users/sendOtp, users/verifyOtp, users/changePass, all jobs/departments/industries/employment-types/work-modes reads, dashboard APIs
- **All other endpoints require a valid JWT** — validated by `JwtAuthenticationFilter`
- Rate limit: 10 requests per 60 seconds per endpoint per IP (enforced by `RateLimitFilter`)

---

## 5. API Conventions

### Base URL
All backend API calls go through: `/api/ahrm/v3`  
Vite proxies `/api` → `http://127.0.0.1:8080`

### Calling APIs (Frontend)
```ts
// ALWAYS use axiosInstance — never raw axios
import axiosInstance from '../interceptor/AxiosInterceptor';

// Example
const response = await axiosInstance.post('/auth/login', { email, password });
// Expands to: POST /api/ahrm/v3/auth/login
```

### Service File Pattern
- One service file per domain (e.g., `job-service.ts`, `UserService.tsx`)
- Place in `frontend/src/app/services/`
- Export named async functions

### Backend Controller Pattern
```java
@RestController
@CrossOrigin
@RequestMapping("/api/ahrm/v3/{resource}")
public class ResourceAPI {
    // Use @Valid on all @RequestBody parameters
    // Throw JobPortalException for business errors — GlobalExceptionHandler formats the response
}
```

### Error Response Shape
Backend error responses always follow:
```json
{ "errorMessage": "Human-readable error description" }
```
Frontend should read `err.response?.data?.errorMessage` for display.

---

## 6. Frontend Coding Conventions

### File Naming
| Type | Convention | Example |
|------|-----------|---------|
| Page components | PascalCase + "Page" suffix | `FindJobsPage.tsx` |
| Feature components | PascalCase | `JobCard.tsx`, `EmployerView.tsx` |
| Services | camelCase kebab or PascalCase | `job-service.ts`, `UserService.tsx` |
| Redux slices | PascalCase + "Slice" | `UserSlice.tsx` |
| Feature dirs | kebab-case | `find-jobs/`, `post-job/` |
| Style files | kebab-case | `fonts.css`, `index.css` |

### Component Rules
- Use **Mantine** components for form inputs, buttons, modals, notifications (`useNotifications` or `notifications.show`)
- Use **Tailwind** utility classes for layout and spacing — do not write custom CSS unless absolutely necessary
- Do not use inline `style={{}}` — prefer Tailwind classes or Mantine `styles` prop
- Theme colors: `orange` (primary/CTA), `gray` (secondary), `pink` (gradient accent) — match the existing `brightSun` theme

### State Management
- **Server data / async state**: Fetch in `useEffect`, store in local `useState` — do not put API response data into Redux unless it's auth or global UI state
- **Auth state**: Always update both Redux slice AND localStorage together
- **Global UI state only in Redux**: Filters, sort order, overlay visibility

### Routing
- Always import from `react-router` (NOT `react-router-dom`)
- Use `useNavigate()` for programmatic navigation
- Use `useSearchParams()` for URL query params (e.g., `?tab=employers`)

---

## 7. Backend Coding Conventions

### Package Structure
All backend code lives under `com.jobportal.*` — do NOT create new top-level packages.

| Package | Contents |
|---------|----------|
| `com.jobportal.api` | REST controllers only — no business logic |
| `com.jobportal.service` | Interface + `Impl` class pairs for all business logic |
| `com.jobportal.entity` | JPA `@Entity` classes, minimal logic, have `toDTO()` method |
| `com.jobportal.dto` | DTOs with Jakarta validation annotations; have `toEntity()` method |
| `com.jobportal.repository` | `JpaRepository` interfaces only |
| `com.jobportal.exception` | All exceptions go through `JobPortalException`; handled by `GlobalExceptionHandler` |

### Entity ↔ DTO Pattern
```java
// Entity always has toDTO()
public UserDTO toDTO() { return new UserDTO(...); }

// DTO always has toEntity()
public User toEntity() { return new User(...); }
```
Never expose entities directly in API responses — always convert to DTO.

### Validation
- Use `@Valid` on all `@RequestBody` and `@PathVariable` parameters
- Validation messages go in `src/main/resources/ValidationMessages.properties`
- Use message keys (e.g., `{user.email.invalid}`) not hardcoded strings in annotations

### Error Handling
- Throw `JobPortalException(message)` for all expected business errors
- Do NOT use `try/catch` to swallow exceptions — let `GlobalExceptionHandler` handle them
- `AuthenticationException` in `AuthAPI` maps to `"Incorrect username or password"`

---

## 8. OTP / Registration Flow

The sign-up flow is: Send OTP → Verify OTP → Register user (in that order).

- `sendOTP(email)` works for **both** new and existing users (does NOT require the user to exist first)
- `verifyOtp(email, otp)` validates the code (6 digits, expires in 5 minutes)
- `registerUser(userDTO)` creates the user + hashes password (BCrypt) + creates profile
- OTPs are auto-cleaned by a `@Scheduled` task every 60 seconds (5-minute expiry)

---

## 9. Build & Run Commands

```bash
# 1. Start the database (required first)
docker compose up -d

# 2. Start the backend (from repo root)
Set-Location backend/dashboard-service
mvn spring-boot:run
# Backend runs at http://localhost:8080

# 3. Start the frontend (from repo root)
npm run dev
# Frontend runs at http://localhost:5173
# API proxied: /api → http://127.0.0.1:8080
```

### pgAdmin
http://localhost:5050 — login: `admin@afrohr.com` / `admin123`

---

## 10. Security Rules (Non-Negotiable)

- **Never store secrets in frontend code** — no API keys, JWT secrets, or SMTP credentials in `.ts`/`.tsx` files
- **Never log JWT tokens or passwords** to the console — mask or omit them
- **Input sanitization**: Validate on both frontend (Zod) and backend (Jakarta `@Valid`) — never trust one side alone
- **SQL**: Always use JPA/Spring Data — never build raw SQL strings with user input
- **CSRF tokens**: The `AxiosInterceptor` already adds `X-CSRF-Token` to state-changing requests — do not remove this
- **Sensitive response data**: Backend must null out `password` field before returning any `UserDTO`
- **Auth checks before operations**: Any destructive or write operation in the UI must first verify `isEmployerAuthorized` (or equivalent for other roles) before proceeding — never rely on button `disabled` alone

---

## 11. What NOT to Do

- ❌ Do NOT import from `react-router-dom` — import from `react-router`
- ❌ Do NOT use raw `axios` — always use `axiosInstance`
- ❌ Do NOT add a new AccountType value without updating both `AccountType.java` (backend) and all frontend checks
- ❌ Do NOT expose JPA entities directly in API responses — always use DTOs
- ❌ Do NOT add hardcoded validation messages in Java — use `ValidationMessages.properties`
- ❌ Do NOT write business logic in controllers (`api/` package) — delegate to service layer
- ❌ Do NOT create a custom CSS file for one-off styles — use Tailwind classes
- ❌ Do NOT put API response data in Redux (except auth state) — use local `useState`
- ❌ Do NOT remove the `X-CSRF-Token` header from the Axios interceptor
- ❌ Do NOT use `import.meta.env.DEV` to show development-only notices in the UI

---

## 12. Feature Modules

### 12.1 AI Job Match Score

**Location:** ``frontend/src/app/services/match-service.ts``
**Strategy:** Pure client-side computation - no backend API call needed. All required data is in Redux state and the jobs list.

**Algorithm (weights):**
- Skills match: 60% - Jaccard-like intersection of ``profile.skills + profile.itSkills`` vs ``job.skillsRequired``
- Experience match: 25% - Parse ``job.experience`` range string (e.g. "3-5 years") against ``profile.totalExp``
- Location match: 15% - String containment check; if ``job.workMode`` is remote, grant full 15 pts

**Usage in JobCard.tsx:**
```
const match = showMatch ? computeMatchScore(props, profile) : null;
```

**Badge colours:** green >=70 � yellow 40-69 � red <40
**Do NOT** call a backend endpoint for match scores - client-side is instant and avoids N+1 calls.

---

### 12.2 Swipe-to-Apply

**Location:** ``frontend/src/app/features/swipe-jobs/SwipeJobs.tsx`` + ``frontend/src/app/pages/SwipeJobsPage.tsx``
**Route:** ``/swipe`` (under LegacyLayout, ProtectedRoute allowedRoles=["APPLICANT"])
**Entry point:** "Swipe Mode" button in Jobs.tsx header.

**Mechanics:**
- Uses onPointerDown / onPointerMove / onPointerUp + setPointerCapture - no drag library needed
- Swipe right (>100px) -> save job to ``profile.savedJobs`` in Redux
- Swipe left (>100px) -> skip
- Seen job IDs persisted in localStorage under key ``"swipe-seen-ids"``
- Cards rendered 3-deep with CSS scale + translateY stacking effect

**Do NOT** install @use-gesture/react or framer-motion - pointer events are sufficient.

---

### 12.3 Applicant Tracking Kanban

**Location:** ``frontend/src/app/features/employer/KanbanBoard.tsx``
**Integration:** Rendered inside PostedJobDesc.tsx with a "Kanban View / Tab View" toggle.

**ApplicationStatus enum** - six values (SCREENING and HIRED added to backend enum):
```
APPLIED -> SCREENING -> INTERVIEWING -> OFFERED -> HIRED
                                                -> REJECTED
```

**Kanban columns:** APPLIED (blue) | SCREENING (indigo) | INTERVIEWING (amber) | OFFERED (violet) | HIRED (green) | REJECTED (red)

**Drag mechanics:** HTML5 Drag-and-Drop API (draggable, onDragStart, onDragOver, onDrop)
**State:** KanbanBoard manages its own copy of applicants (useState) initialised from props; updates optimistically on successful changeAppStatus call.
**API call:** changeAppStatus({ id: jobId, applicantId: applicant.applicantId, applicationStatus: newStatus }) from JobService.tsx
**jobId source:** const { id: jobId } = useParams() inside KanbanBoard (URL param from /posted-jobs/:id)

**Do NOT** install @hello-pangea/dnd or react-beautiful-dnd - HTML5 DnD is sufficient.
