# AfroHR Portal

AfroHR is a full-stack HR portal that connects African talent with employers.
It is built with a **React + Vite + TypeScript** frontend and a **Spring Boot + PostgreSQL** backend.

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Database Setup](#database-setup)
  - [Backend (Spring Boot)](#backend-spring-boot)
  - [Frontend (React + Vite)](#frontend-react--vite)
- [API Reference](#api-reference)
- [Contributing](#contributing)

---

## Features

| Feature | Description |
|---|---|
| **Job Posting** | Employers create, update, and manage job listings |
| **Candidate Profiles** | Candidates build profiles, upload resumes, and control visibility |
| **Employer Dashboard** | Company profile management and applicant tracking |
| **Resume Upload / Parsing** | File upload endpoint; swap in an S3 bucket or parsing library in production |
| **Metadata Management** | Admin-managed lookup tables (industries, skill tags, employment types, etc.) |
| **Authenticated API** | JWT Bearer token auth; role-based access (CANDIDATE / EMPLOYER / ADMIN) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                         │
│  React 19 + Vite + TypeScript                                    │
│  Pages: Jobs · Auth · Candidate Dashboard · Employer Dashboard   │
│  Services: authService · jobService · candidateService · ...     │
└───────────────────────────┬─────────────────────────────────────┘
                            │  HTTP (JSON / multipart)
                            │  /api/**  (proxied by Vite dev server)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Spring Boot 3 (Java 21)                                         │
│  Controllers: Auth · Jobs · Candidates · Employers · Metadata    │
│  Security: JWT filter → Spring Security (stateless, RBAC)        │
│  Services / Repositories (Spring Data JPA)                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │  JDBC (HikariCP)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  PostgreSQL                                                       │
│  Tables: users · job_postings · candidate_profiles               │
│          employer_profiles · applications · metadata             │
└─────────────────────────────────────────────────────────────────┘
```

### Key design decisions

- **Stateless JWT auth** – no server-side sessions; tokens are stored in `localStorage` on the client.
- **Role-based access** – `CANDIDATE`, `EMPLOYER`, and `ADMIN` roles enforced with Spring Security's `@PreAuthorize`.
- **CORS** – a single `cors.allowed-origins` property controls which origins the backend accepts.
- **File uploads** – resumes are written to `uploads/resumes/` locally; in production replace with an S3-compatible bucket.
- **Metadata** – a generic `metadata` table replaces hard-coded enums for industries, skill tags, etc., so values can be changed without redeploying.

---

## Project Structure

```
afrohr-portal/
├── README.md                  ← this file
├── frontend/                  ← React + Vite + TypeScript
│   ├── src/
│   │   ├── hooks/             ← useAuth (AuthContext + JWT persistence)
│   │   ├── pages/
│   │   │   ├── auth/          ← LoginPage, RegisterPage
│   │   │   ├── jobs/          ← JobsPage (public listing + search)
│   │   │   ├── candidates/    ← CandidateDashboard (profile + resume upload)
│   │   │   ├── employers/     ← EmployerDashboard (company profile)
│   │   │   └── metadata/      ← (admin metadata management – extend here)
│   │   ├── services/          ← api.ts + domain services (auth, job, …)
│   │   ├── types/             ← shared TypeScript interfaces
│   │   └── components/        ← reusable UI components (extend here)
│   ├── .env.example
│   └── vite.config.ts
└── backend/                   ← Spring Boot 3 + PostgreSQL
    ├── pom.xml
    ├── .env.example
    └── src/main/java/com/afrohr/portal/
        ├── config/            ← SecurityConfig (CORS, JWT filter, RBAC)
        ├── controller/        ← REST endpoints
        ├── dto/               ← request / response DTOs
        ├── exception/         ← GlobalExceptionHandler
        ├── model/             ← JPA entities
        ├── repository/        ← Spring Data JPA repositories
        ├── security/          ← JwtTokenProvider, JwtAuthFilter, UserDetailsServiceImpl
        └── util/              ← shared utilities (extend here)
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Java | 21+ |
| Maven | 3.9+ (or use `./mvnw`) |
| Node.js | 20+ |
| npm | 10+ |
| PostgreSQL | 15+ |

---

## Environment Variables

### Backend — copy `backend/.env.example` to `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | Server port |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/afrohr` | JDBC URL |
| `DATABASE_USERNAME` | `afrohr` | DB username |
| `DATABASE_PASSWORD` | `secret` | DB password |
| `DDL_AUTO` | `update` | Hibernate DDL mode (`validate` in production) |
| `JWT_SECRET` | *(must set)* | Base64-encoded 256-bit secret |
| `JWT_EXPIRATION_MS` | `86400000` | Token lifetime in ms (24 h) |
| `MAX_FILE_SIZE` | `10MB` | Max resume upload size |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |

Generate a safe JWT secret:
```bash
openssl rand -base64 32
```

### Frontend — copy `frontend/.env.example` to `frontend/.env.local`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Spring Boot base URL (used by Vite proxy) |

---

## Getting Started

### Database Setup

```sql
CREATE DATABASE afrohr;
CREATE USER afrohr WITH ENCRYPTED PASSWORD 'secret';
GRANT ALL PRIVILEGES ON DATABASE afrohr TO afrohr;
```

### Backend (Spring Boot)

```bash
cd backend

# Copy and edit environment variables
cp .env.example .env
# Edit .env with your values

# Run (environment variables are read via application.properties placeholders)
./mvnw spring-boot:run
# or: mvn spring-boot:run

# Run tests
./mvnw test
```

The API will be available at `http://localhost:8080`.

### Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Copy and edit environment variables
cp .env.example .env.local
# Edit .env.local (VITE_API_BASE_URL defaults to http://localhost:8080)

# Start development server (with API proxy)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The frontend dev server starts at `http://localhost:5173` and proxies all `/api/**` requests to the Spring Boot backend.

---

## API Reference

All endpoints are prefixed with `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Obtain JWT token |
| GET | `/jobs` | Public | List open jobs (supports `?keyword=`, `?page=`, `?size=`) |
| GET | `/jobs/{id}` | Public | Get a single job posting |
| POST | `/jobs` | EMPLOYER | Create a job posting |
| PUT | `/jobs/{id}` | EMPLOYER | Update own job posting |
| DELETE | `/jobs/{id}` | EMPLOYER | Delete own job posting |
| GET | `/candidates/me` | CANDIDATE | Get own profile |
| PUT | `/candidates/me` | CANDIDATE | Update own profile |
| POST | `/candidates/me/resume` | CANDIDATE | Upload resume (`multipart/form-data`) |
| GET | `/candidates/{id}` | Public | Get a public candidate profile |
| GET | `/employers/me` | EMPLOYER | Get own company profile |
| PUT | `/employers/me` | EMPLOYER | Update own company profile |
| GET | `/employers/{id}` | Public | Get a company profile |
| GET | `/metadata?category=X` | Public | Get active metadata items by category |
| POST | `/metadata` | ADMIN | Create a metadata item |
| PATCH | `/metadata/{id}/toggle` | ADMIN | Toggle active flag on a metadata item |

---

## Contributing

1. Fork the repository and create a feature branch.
2. Follow the existing code conventions.
3. Write or update tests for your changes.
4. Open a pull request with a clear description.

