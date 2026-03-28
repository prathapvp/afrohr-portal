# AfroHR Spring Boot Microservices Backend

Three Spring Boot services that replace the original Node server. All traffic from the frontend enters through **api-gateway** — individual services are never called directly by the browser.

## Services

| Service            | Port | Responsibility                          |
|--------------------|------|-----------------------------------------|
| `api-gateway`      | 9080 | Routes, CORS, single entry point        |
| `dashboard-service`| 9081 | Branding, audiences, dashboard content  |
| `search-service`   | 9082 | Full-text search across jobs & careers  |

## Route table

```
GET /api/health              → dashboard-service
GET /api/audiences           → dashboard-service
GET /api/dashboard           → dashboard-service
GET /api/dashboard/{audience}→ dashboard-service
GET /api/search?audience=&q= → search-service
```

## Requirements

- Java 21+
- Maven 3.9+

## Build all modules

```bash
# from backend/spring/
mvn clean package -DskipTests
```

## Run each service (three terminals)

```bash
# Terminal 1 — dashboard-service must start before the gateway routes to it
cd dashboard-service
mvn spring-boot:run

# Terminal 2
cd search-service
mvn spring-boot:run

# Terminal 3
cd api-gateway
mvn spring-boot:run
```

Or run the packaged JARs after `mvn package`:

```bash
java -jar api-gateway/target/api-gateway-1.0.0.jar
java -jar dashboard-service/target/dashboard-service-1.0.0.jar
java -jar search-service/target/search-service-1.0.0.jar
```

## Import into Spring Tool Suite

1. **File → Import → Maven → Existing Maven Projects**
2. Navigate to `backend/spring/`
3. Select all four POMs (parent + three modules)
4. Click **Finish**

## Health checks

```
GET http://localhost:9080/api/health     (via gateway)
GET http://localhost:9081/actuator/health
GET http://localhost:9082/actuator/health
```
