import { promises as fs } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const backendApiDir = path.join(repoRoot, "backend", "dashboard-service", "src", "main", "java", "com", "jobportal", "api");
const securityConfigPath = path.join(repoRoot, "backend", "dashboard-service", "src", "main", "java", "com", "jobportal", "security", "SecurityConfig.java");
const frontendDir = path.join(repoRoot, "frontend", "src", "app");
const outputPath = path.join(repoRoot, "api-endpoint-map.json");

const API_BASE = "/api/ahrm/v3";

function toPosix(p) {
  return p.replace(/\\/g, "/");
}

async function walkFiles(dir, exts, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(full, exts, files);
      continue;
    }
    if (exts.some((ext) => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

function getQuotedPaths(sectionText) {
  const values = [];
  const rx = /"([^"]+)"/g;
  let m;
  while ((m = rx.exec(sectionText)) !== null) {
    values.push(m[1]);
  }
  return values;
}

function parsePublicMatchers(securityText) {
  const blockMatch = securityText.match(/requestMatchers\(([^]*?)\)\.permitAll\(\)/m);
  if (!blockMatch) {
    return [];
  }
  return getQuotedPaths(blockMatch[1]);
}

function joinPaths(base, sub) {
  const b = base || "";
  const s = sub || "";
  const left = b.endsWith("/") ? b.slice(0, -1) : b;
  const right = s.startsWith("/") ? s : `/${s}`;
  return `${left}${right}`;
}

function normalizeTemplatePath(value) {
  return value
    .replace(/`/g, "")
    .replace(/\$\{[^}]+\}/g, "{var}")
    .replace(/\{[^}]+\}/g, "{var}")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");
}

function pathPatternToRegex(p) {
  const safe = normalizeTemplatePath(p)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\{var\}/g, "[^/]+")
    .replace(/\\\*\\\*/g, ".*")
    .replace(/\\\*/g, "[^/]*");
  return new RegExp(`^${safe}$`);
}

function isPublicPath(endpointPath, publicMatchers) {
  return publicMatchers.some((matcher) => pathPatternToRegex(matcher).test(endpointPath));
}

function parseBackendEndpoints(filePath, text) {
  const classReq = text.match(/@RequestMapping\("([^"]+)"\)/);
  const base = classReq ? classReq[1] : "";
  const endpoints = [];
  const rx = /@(GetMapping|PostMapping|PutMapping|DeleteMapping)\("([^"]+)"\)/g;
  let m;
  while ((m = rx.exec(text)) !== null) {
    const method = m[1].replace("Mapping", "").toUpperCase();
    const subPath = m[2];
    endpoints.push({
      method,
      path: joinPaths(base, subPath),
      group: path.basename(filePath, ".java"),
      source: toPosix(path.relative(repoRoot, filePath)),
    });
  }
  return endpoints;
}

function extractFetchCalls(content) {
  const calls = [];
  const fetchRx = /fetch\(\s*(["'`])([^"'`]+)\1/g;
  let m;
  while ((m = fetchRx.exec(content)) !== null) {
    calls.push(m[2]);
  }

  const axiosRx = /axiosInstance\.(get|post|put|delete)\(\s*(["'`])([^"'`]+)\2/g;
  while ((m = axiosRx.exec(content)) !== null) {
    const raw = m[3];
    const normalized = raw.startsWith("/api") || raw.startsWith("/actuator") || raw.startsWith("/swagger")
      ? raw
      : `${API_BASE}${raw.startsWith("/") ? "" : "/"}${raw}`;
    calls.push(normalized);
  }

  return calls.map((x) => normalizeTemplatePath(x));
}

function mapConsumers(endpoints, consumerMap) {
  for (const endpoint of endpoints) {
    const epPath = normalizeTemplatePath(endpoint.path);
    const epRegex = pathPatternToRegex(epPath);
    endpoint.frontendConsumers = [];

    for (const [file, calls] of Object.entries(consumerMap)) {
      if (calls.some((c) => epRegex.test(c))) {
        endpoint.frontendConsumers.push(file);
      }
    }
  }
}

async function main() {
  const [securityText, backendFiles, frontendFiles] = await Promise.all([
    fs.readFile(securityConfigPath, "utf8"),
    walkFiles(backendApiDir, [".java"]),
    walkFiles(frontendDir, [".ts", ".tsx"]),
  ]);

  const publicMatchers = parsePublicMatchers(securityText);

  const backendEndpoints = [];
  for (const file of backendFiles) {
    const text = await fs.readFile(file, "utf8");
    backendEndpoints.push(...parseBackendEndpoints(file, text));
  }

  const consumerMap = {};
  for (const file of frontendFiles) {
    const text = await fs.readFile(file, "utf8");
    const calls = extractFetchCalls(text);
    if (calls.length > 0) {
      consumerMap[toPosix(path.relative(repoRoot, file))] = calls;
    }
  }

  mapConsumers(backendEndpoints, consumerMap);

  const payload = {
    service: "AfroHR Monolith",
    generatedAt: new Date().toISOString(),
    baseUrl: "http://localhost:8080",
    apiBasePath: API_BASE,
    securityModel: {
      type: "JWT Bearer",
      publicMatchers,
      defaultForOtherEndpoints: "authenticated",
    },
    endpoints: backendEndpoints
      .sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method))
      .map((e) => ({
        group: e.group,
        method: e.method,
        path: e.path,
        auth: isPublicPath(e.path, publicMatchers) ? "public" : "authenticated",
        frontendConsumers: e.frontendConsumers,
        source: e.source,
      })),
  };

  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Generated ${toPosix(path.relative(repoRoot, outputPath))}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
