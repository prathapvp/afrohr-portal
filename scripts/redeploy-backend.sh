#!/usr/bin/env bash
set -euo pipefail

# One-shot backend redeploy for AfroHR Spring Boot service.
# Run this on the Linux server from repository root.

ROOT_DIR="${ROOT_DIR:-$(pwd)}"
BACKEND_POM="${BACKEND_POM:-$ROOT_DIR/backend/pom.xml}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/appdata/backend}"
JAR_NAME="${JAR_NAME:-JobPortal-0.0.1-SNAPSHOT.jar}"
APP_PORT="${APP_PORT:-8080}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${APP_PORT}/actuator/health}"
OTP_SMOKE_URL="${OTP_SMOKE_URL:-http://127.0.0.1:${APP_PORT}/api/ahrm/v3/users/sendOtp/register/deploy-smoke@example.com}"
LOG_FILE="${LOG_FILE:-$DEPLOY_DIR/app.log}"

say() {
  printf "\n[%s] %s\n" "$(date +"%Y-%m-%d %H:%M:%S")" "$*"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found: $1" >&2
    exit 1
  }
}

require_cmd mvn
require_cmd java
require_cmd curl

if [[ ! -f "$BACKEND_POM" ]]; then
  echo "Backend pom not found at: $BACKEND_POM" >&2
  exit 1
fi

say "Building backend jar from latest source"
mvn -f "$BACKEND_POM" clean package -DskipTests

BUILT_JAR="$ROOT_DIR/backend/target/$JAR_NAME"
if [[ ! -f "$BUILT_JAR" ]]; then
  echo "Build completed but jar not found: $BUILT_JAR" >&2
  exit 1
fi

say "Preparing deploy directory: $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
cp -f "$BUILT_JAR" "$DEPLOY_DIR/$JAR_NAME"
ls -lh "$DEPLOY_DIR/$JAR_NAME"

say "Stopping existing backend process (if running)"
pkill -f "$JAR_NAME" || true

say "Starting backend with nohup"
cd "$DEPLOY_DIR"
nohup java -jar "$JAR_NAME" > "$LOG_FILE" 2>&1 &
APP_PID=$!
say "Started PID: $APP_PID"

say "Waiting for service to become healthy"
for i in {1..40}; do
  if curl -sS "$HEALTH_URL" >/dev/null 2>&1; then
    say "Health check reachable: $HEALTH_URL"
    break
  fi
  sleep 2
  if [[ "$i" == "40" ]]; then
    echo "Service did not become reachable in time. Tail logs:" >&2
    tail -n 120 "$LOG_FILE" || true
    exit 1
  fi
done

say "Smoke test: signup OTP route should be mapped (not 404)"
STATUS_CODE="$(curl -s -o /tmp/otp-smoke-response.txt -w "%{http_code}" -X POST "$OTP_SMOKE_URL" || true)"
echo "OTP smoke endpoint HTTP status: $STATUS_CODE"

if [[ "$STATUS_CODE" == "404" ]]; then
  echo "Route mapping failed: /users/sendOtp/register/{email} still not found" >&2
  tail -n 120 "$LOG_FILE" || true
  exit 1
fi

say "Redeploy complete"

echo "Next checks:"
echo "  - tail -f $LOG_FILE"
echo "  - curl -i $HEALTH_URL"
echo "  - curl -i -X POST $OTP_SMOKE_URL"
