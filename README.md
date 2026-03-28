
# AfroHR

This workspace contains the AfroHR web app exported from Figma Make and extended with a lightweight Node backend.

The original design file is available at https://www.figma.com/design/MRpKpAMGIhAu3M2jRFRgJB/AfroHR.

## Project structure

- `frontend/` contains the Vite React application.
- `backend/spring/` contains the Spring Boot microservices backend (api-gateway, dashboard-service, search-service).
- `backend/server.js` is the original lightweight Node server kept as a fallback reference.
- The root `package.json` is a thin workspace entry point for the frontend.

## Running the code

### PostgreSQL + pgAdmin with Docker Compose

```bash
copy .env.example .env
docker compose up -d
```

Services:

- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`

Default pgAdmin login:

- Email: `admin@afrohr.local`
- Password: `admin123`

Suggested pgAdmin server connection:

- Host: `postgres`
- Port: `5432`
- Username: value from `POSTGRES_USER`
- Password: value from `POSTGRES_PASSWORD`

### Spring Boot backend (recommended)

See `backend/spring/README.md` for full instructions. Quick start (Java 21 + Maven 3.9 required):

```bash
# from backend/spring/ — start all three services
cd backend/spring/dashboard-service && mvn spring-boot:run   # port 8081
cd backend/spring/search-service    && mvn spring-boot:run   # port 8082
cd backend/spring/api-gateway       && mvn spring-boot:run   # port 8080
```

### Frontend

```bash
npm i        # install dependencies
npm run dev  # Vite dev server — proxies /api/* to gateway on port 8080
```

### Legacy Node server (fallback)

```bash
npm run server   # starts the original Node API on port 4000
```

> To use the Node server instead of Spring Boot, change the proxy in `frontend/vite.config.ts` back to `http://127.0.0.1:4000`.

## Backend endpoints

- `GET /api/health`
- `GET /api/audiences`
- `GET /api/dashboard`
- `GET /api/dashboard/:audience`
- `GET /api/search?audience=candidates&q=engineer`

## Build

Run `npm run build` to create a production frontend build in `frontend/dist`.
  