import http from "node:http";
import { URL } from "node:url";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
const __dirname = dirname(fileURLToPath(import.meta.url));
const dashboardData = JSON.parse(
  readFileSync(resolve(__dirname, "src/main/resources/data/dashboard-data.json"), "utf8"),
);

function searchCollection(audience, query) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  if (audience === "students") {
    return dashboardData.dashboards.students.careers.items.filter((item) =>
      [item.title, item.salary, item.duration].some((field) =>
        String(field || "").toLowerCase().includes(normalized),
      ),
    );
  }

  if (audience === "candidates") {
    return dashboardData.dashboards.candidates.jobs.items.filter((item) =>
      [item.role, item.company, item.location, item.salary].some((field) =>
        String(field || "").toLowerCase().includes(normalized),
      ),
    );
  }

  return dashboardData.dashboards.employers.verification.items.filter((item) =>
    [item.title, item.description, item.badge].some((field) =>
      String(field || "").toLowerCase().includes(normalized),
    ),
  );
}

// ── In-memory stores (mock Spring Boot AHRM service) ──────────────────────────
let workModeIdSeq = 3;
const workModes = [
  { id: 1, name: "Remote", description: "Fully remote work" },
  { id: 2, name: "On-site", description: "Work from office" },
  { id: 3, name: "Hybrid", description: "Mix of remote and on-site" },
];

let departmentIdSeq = 4;
const departments = [
  { id: 1, name: "Engineering", description: "Software and hardware engineering" },
  { id: 2, name: "Human Resources", description: "People and culture" },
  { id: 3, name: "Finance", description: "Accounting and financial planning" },
  { id: 4, name: "Marketing", description: "Brand, growth and communications" },
];

let industryIdSeq = 5;
const industries = [
  { id: 1, name: "Technology", description: "Software, hardware and IT services" },
  { id: 2, name: "Healthcare", description: "Medical, pharma and wellness" },
  { id: 3, name: "Finance", description: "Banking, insurance and investment" },
  { id: 4, name: "Education", description: "Schools, universities and e-learning" },
  { id: 5, name: "Manufacturing", description: "Production and industrial operations" },
];

let employmentTypeIdSeq = 4;
const employmentTypes = [
  { id: 1, name: "Full-Time", description: "Standard 40-hour work week" },
  { id: 2, name: "Part-Time", description: "Less than 30 hours per week" },
  { id: 3, name: "Contract", description: "Fixed-term or project-based" },
  { id: 4, name: "Internship", description: "Short-term learning placement" },
];

// ── Users/Auth/OTP store (mock AHRM auth service) ───────────────────────────
let userIdSeq = 1;
const users = [
  {
    id: 1,
    name: "Candidate One",
    email: "candidate@example.com",
    password: "Pass@123",
    accountType: "APPLICANT",
    profileId: 1,
  },
];

const otpStore = new Map();

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createMockJwt(user) {
  const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: user.email,
      id: user.id,
      name: user.name,
      accountType: user.accountType,
      profileId: user.profileId || null,
      iat: Math.floor(Date.now() / 1000),
    }),
  );
  return `${header}.${payload}.`;
}

const DEFAULT_OTP = /^\d{6}$/.test(process.env.DEFAULT_OTP || "")
  ? process.env.DEFAULT_OTP
  : "123456";

const ALLOW_DEV_LOGIN = process.env.ALLOW_DEV_LOGIN !== "false";

function createOtp() {
  return DEFAULT_OTP;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  return users.find((user) => normalizeEmail(user.email) === normalized);
}

function buildDevUserFromEmail(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const localPart = normalizedEmail.split("@")[0] || "user";
  const displayName = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const newProfileId = ++profileIdSeq;
  profiles.push({
    id: newProfileId, userId: userIdSeq + 1, name: displayName || "Dev User",
    jobTitle: "Software Developer", company: "", location: "",
    totalExp: 0, picture: null, banner: null, about: "",
    skills: [], experiences: [], certifications: [],
  });

  return {
    id: ++userIdSeq,
    name: displayName || "Dev User",
    email: normalizedEmail,
    password,
    accountType: "APPLICANT",
    profileId: newProfileId,
  };
}

// ── Profiles store ────────────────────────────────────────────────────────────
let profileIdSeq = 3;
const profiles = [
  {
    id: 1, userId: 1, name: "Candidate One", jobTitle: "Software Engineer", company: "TechCorp Africa",
    location: "Lagos, Nigeria", totalExp: 4, picture: null, banner: null,
    about: "Passionate software engineer with 4 years of experience building scalable web applications. Skilled in React, Node.js, and cloud technologies. I enjoy solving complex problems and contributing to open-source projects.",
    skills: ["React", "TypeScript", "Node.js", "MongoDB", "AWS", "Docker", "Git", "REST APIs"],
    experiences: [
      { title: "Software Engineer", company: "TechCorp Africa", location: "Lagos, Nigeria", startDate: "Jan 2022", endDate: "Present", description: "Develop and maintain front-end applications using React and TypeScript. Collaborate with backend teams to integrate REST APIs and improve performance." },
      { title: "Junior Developer", company: "StartupHub", location: "Accra, Ghana", startDate: "Jun 2020", endDate: "Dec 2021", description: "Built internal tools and customer-facing dashboards. Participated in agile sprints and code reviews." },
    ],
    certifications: [
      { name: "AWS Certified Cloud Practitioner", issuer: "Amazon", issueDate: "Mar 2023", certificateId: "AWS-CP-1234" },
      { name: "Meta Front-End Developer Certificate", issuer: "Meta", issueDate: "Nov 2022", certificateId: "META-FE-5678" },
    ],
  },
  {
    id: 2, userId: 2, name: "Amara Osei", jobTitle: "HR Business Partner", company: "AfroHR",
    location: "Nairobi, Kenya", totalExp: 6, picture: null, banner: null,
    about: "Experienced HR professional with a focus on people strategy, talent acquisition, and employee engagement across African markets.",
    skills: ["Recruitment", "Employee Relations", "HRIS", "Performance Management", "Labour Law"],
    experiences: [
      { title: "HR Business Partner", company: "AfroHR", location: "Nairobi, Kenya", startDate: "Mar 2021", endDate: "Present", description: "Lead people strategy for 200+ employees across three offices. Implemented a new HRIS that reduced onboarding time by 40%." },
    ],
    certifications: [
      { name: "SHRM Certified Professional", issuer: "SHRM", issueDate: "Jul 2022", certificateId: "SHRM-CP-9012" },
    ],
  },
  {
    id: 3, userId: 3, name: "Kwame Asante", jobTitle: "Data Analyst", company: "FinScope",
    location: "Accra, Ghana", totalExp: 2, picture: null, banner: null,
    about: "Data analyst passionate about turning raw data into actionable insights. Proficient in SQL, Python, and BI tools.",
    skills: ["SQL", "Python", "Power BI", "Excel", "Tableau", "Statistics"],
    experiences: [
      { title: "Data Analyst Intern", company: "FinScope", location: "Accra, Ghana", startDate: "Sep 2023", endDate: "Present", description: "Analyse financial datasets and build executive dashboards using Power BI." },
    ],
    certifications: [],
  },
];
// ── end Profiles store ────────────────────────────────────────────────────────

// ── Jobs store ────────────────────────────────────────────────────────────────
let jobIdSeq = 4;
let applicationIdSeq = 0;
const jobs = [
  {
    id: 1, title: "Senior Frontend Engineer", company: "TechCorp Africa", description: "Build world-class React UIs for our platform.",
    location: "Lagos, Nigeria", salary: "120,000", currency: "USD", logoTone: "blue",
    department: "Engineering", role: "Frontend Engineer", experience: "3-5 years",
    employmentType: "Full-Time", industry: "Technology", workMode: "Remote",
    vacancies: 2, skills: "React, TypeScript, Tailwind", postedBy: 1, jobStatus: "OPEN",
    applicants: [], createdAt: new Date().toISOString(),
  },
  {
    id: 2, title: "HR Business Partner", company: "AfroHR", description: "Lead people strategy across our African offices.",
    location: "Nairobi, Kenya", salary: "85,000", currency: "USD", logoTone: "green",
    department: "Human Resources", role: "HR Manager", experience: "5+ years",
    employmentType: "Full-Time", industry: "Technology", workMode: "Hybrid",
    vacancies: 1, skills: "HRIS, Recruitment, Employee Relations", postedBy: 1, jobStatus: "OPEN",
    applicants: [], createdAt: new Date().toISOString(),
  },
  {
    id: 3, title: "Data Analyst Intern", company: "FinScope", description: "Analyse financial datasets and build dashboards.",
    location: "Accra, Ghana", salary: "15,000", currency: "USD", logoTone: "violet",
    department: "Finance", role: "Data Analyst", experience: "Student / Intern",
    employmentType: "Internship", industry: "Finance", workMode: "On-site",
    vacancies: 3, skills: "SQL, Excel, Power BI", postedBy: 2, jobStatus: "OPEN",
    applicants: [], createdAt: new Date().toISOString(),
  },
  {
    id: 4, title: "Marketing Manager", company: "BrandAfrica", description: "Drive brand campaigns across digital channels.",
    location: "Cape Town, South Africa", salary: "95,000", currency: "USD", logoTone: "amber",
    department: "Marketing", role: "Marketing Manager", experience: "3-5 years",
    employmentType: "Full-Time", industry: "Manufacturing", workMode: "Hybrid",
    vacancies: 1, skills: "SEO, Social Media, Google Ads", postedBy: 2, jobStatus: "OPEN",
    applicants: [], createdAt: new Date().toISOString(),
  },
];

function jobToMap(job) {
  const { applicants, ...rest } = job;
  return { ...rest, applicantCount: applicants.length };
}
// ── end Jobs store ─────────────────────────────────────────────────────────────
// ── end stores ────────────────────────────────────────────────────────────────

/** Build a generic in-memory CRUD handler for /api/ahrm/v3/<resource> */
function makeCrudHandler(basePath, store, getSeq) {
  return function handleCrud(method, pathname, request, response, readBody) {
    // List
    if (method === "GET" && pathname === basePath) {
      sendJson(response, 200, store);
      return true;
    }
    // Create
    if (method === "POST" && pathname === basePath) {
      readBody(request, (body) => {
        const { name, description } = body;
        if (!name) { sendJson(response, 400, { error: "name is required" }); return; }
        const item = { id: setSeq(), name, description: description ?? null };
        store.push(item);
        sendJson(response, 201, item);
      });
      return true;
    }
    // Item routes
    const itemMatch = pathname.match(new RegExp(`^${basePath}/(\\d+)$`));
    if (!itemMatch) return false;
    const id = Number(itemMatch[1]);
    const idx = store.findIndex((w) => w.id === id);
    if (method === "GET") {
      if (idx === -1) { sendJson(response, 404, { error: "Not found" }); return true; }
      sendJson(response, 200, store[idx]);
      return true;
    }
    if (method === "PUT") {
      readBody(request, (body) => {
        const { name, description } = body;
        if (!name) { sendJson(response, 400, { error: "name is required" }); return; }
        if (idx === -1) { sendJson(response, 404, { error: "Not found" }); return; }
        store[idx] = { id, name, description: description ?? null };
        sendJson(response, 200, store[idx]);
      });
      return true;
    }
    if (method === "DELETE") {
      if (idx === -1) { sendJson(response, 404, { error: "Not found" }); return true; }
      const [removed] = store.splice(idx, 1);
      sendJson(response, 200, { deleted: true, id: removed.id });
      return true;
    }
    return false;
  };
}

const PORT = process.env.PORT || 4000;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload));
}

function notFound(response) {
  sendJson(response, 404, { error: "Not found" });
}

const server = http.createServer((request, response) => {
  if (!request.url) {
    notFound(response);
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);

  // Helper: parse JSON request body
  function readBody(req, cb) {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try { cb(JSON.parse(raw)); }
      catch { sendJson(response, 400, { error: "Invalid JSON" }); }
    });
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { status: "ok", service: "afrohr-api" });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/audiences") {
    sendJson(response, 200, { branding: dashboardData.branding, audiences: dashboardData.audiences });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/dashboard") {
    sendJson(response, 200, dashboardData);
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/dashboard/")) {
    const audience = url.pathname.split("/").pop();
    const dashboard = audience ? dashboardData.dashboards[audience] : null;
    if (!dashboard) {
      sendJson(response, 404, { error: "Unknown audience" });
      return;
    }

    sendJson(response, 200, {
      branding: dashboardData.branding,
      audience: dashboardData.audiences.find((item) => item.id === audience),
      dashboard,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/search") {
    const audience = url.searchParams.get("audience") || "candidates";
    const query = url.searchParams.get("q") || "";
    const results = searchCollection(audience, query);
    sendJson(response, 200, { audience, query, results });
    return;
  }

  // ── AHRM v3: Users/Auth/Otp ───────────────────────────────────────────────
  if (request.method === "POST" && url.pathname === "/api/ahrm/v3/users/register") {
    readBody(request, (body) => {
      const name = String(body?.name || "").trim();
      const email = normalizeEmail(body?.email);
      const password = String(body?.password || "");
      const accountType = String(body?.accountType || "APPLICANT").toUpperCase();

      if (!name || !email || !password) {
        sendJson(response, 400, { errorMessage: "name, email and password are required" });
        return;
      }
      if (findUserByEmail(email)) {
        sendJson(response, 409, { errorMessage: "User already exists with this email" });
        return;
      }

      const user = { id: ++userIdSeq, name, email, password, accountType };
      users.push(user);
      sendJson(response, 201, {
        message: "Registered successfully",
        user: { id: user.id, name: user.name, email: user.email, accountType: user.accountType },
      });
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ahrm/v3/users/login") {
    readBody(request, (body) => {
      const email = normalizeEmail(body?.email);
      const password = String(body?.password || "");
      let user = findUserByEmail(email);

      if (!user) {
        const otpData = otpStore.get(email);
        if (otpData || ALLOW_DEV_LOGIN) {
          user = buildDevUserFromEmail(email, password);
          users.push(user);
        }
      }

      if (user && user.password !== password && ALLOW_DEV_LOGIN) {
        // Local mock convenience: allow credential changes without manual reset.
        user.password = password;
      }

      if (!user || user.password !== password) {
        sendJson(response, 401, { errorMessage: "Invalid email or password" });
        return;
      }

      sendJson(response, 200, {
        message: "Login successful",
        jwt: createMockJwt(user),
      });
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ahrm/v3/auth/login") {
    readBody(request, (body) => {
      const email = normalizeEmail(body?.email);
      const password = String(body?.password || "");
      let user = findUserByEmail(email);

      if (!user) {
        const otpData = otpStore.get(email);
        if (otpData || ALLOW_DEV_LOGIN) {
          user = buildDevUserFromEmail(email, password);
          users.push(user);
        }
      }

      if (user && user.password !== password && ALLOW_DEV_LOGIN) {
        // Local mock convenience: allow credential changes without manual reset.
        user.password = password;
      }

      if (!user || user.password !== password) {
        sendJson(response, 401, { errorMessage: "Invalid email or password" });
        return;
      }

      sendJson(response, 200, {
        message: "Login successful",
        jwt: createMockJwt(user),
      });
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ahrm/v3/users/changePass") {
    readBody(request, (body) => {
      const email = normalizeEmail(body?.email);
      const currentPassword = String(body?.currentPassword || "");
      const newPassword = String(body?.newPassword || "");
      const user = findUserByEmail(email);

      if (!user) {
        sendJson(response, 404, { errorMessage: "User not found" });
        return;
      }
      if (user.password !== currentPassword) {
        sendJson(response, 400, { errorMessage: "Current password is incorrect" });
        return;
      }
      if (!newPassword) {
        sendJson(response, 400, { errorMessage: "newPassword is required" });
        return;
      }

      user.password = newPassword;
      sendJson(response, 200, { message: "Password changed successfully" });
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ahrm/v3/users/resetPass") {
    readBody(request, (body) => {
      const email = normalizeEmail(body?.email);
      const password = String(body?.password || "");
      const user = findUserByEmail(email);

      if (!user) {
        sendJson(response, 404, { errorMessage: "User not found" });
        return;
      }
      if (!password) {
        sendJson(response, 400, { errorMessage: "password is required" });
        return;
      }

      user.password = password;
      sendJson(response, 200, { message: "Password reset successful" });
    });
    return;
  }

  const sendOtpMatch = url.pathname.match(/^\/api\/ahrm\/v3\/users\/sendOtp\/(.+)$/);
  if (request.method === "POST" && sendOtpMatch) {
    const email = normalizeEmail(decodeURIComponent(sendOtpMatch[1]));
    const otp = createOtp();
    otpStore.set(email, { otp, createdAt: Date.now() });

    // Keep OTP in response for local mock/testing convenience.
    sendJson(response, 200, {
      message: "OTP sent successfully.",
      email,
      otp,
    });
    return;
  }

  const verifyOtpMatch = url.pathname.match(/^\/api\/ahrm\/v3\/users\/verifyOtp\/(.+)\/([^/]+)$/);
  if (request.method === "GET" && verifyOtpMatch) {
    const email = normalizeEmail(decodeURIComponent(verifyOtpMatch[1]));
    const otp = decodeURIComponent(verifyOtpMatch[2]);
    const otpData = otpStore.get(email);

    if (!otpData) {
      sendJson(response, 404, { errorMessage: "OTP not found or expired" });
      return;
    }

    const isExpired = Date.now() - otpData.createdAt > 5 * 60 * 1000;
    if (isExpired) {
      otpStore.delete(email);
      sendJson(response, 400, { errorMessage: "OTP has expired" });
      return;
    }

    if (String(otpData.otp) !== String(otp)) {
      sendJson(response, 400, { errorMessage: "Invalid OTP" });
      return;
    }

    otpStore.set(email, { ...otpData, verifiedAt: Date.now() });

    sendJson(response, 202, { message: "OTP has been verified." });
    return;
  }
  // ── end Users/Auth/Otp ───────────────────────────────────────────────────

  // ── AHRM v3: Jobs ─────────────────────────────────────────────────────────
  const jobsBase = "/api/ahrm/v3/jobs";

  if (request.method === "GET" && url.pathname === `${jobsBase}/getAll`) {
    sendJson(response, 200, jobs.map(jobToMap));
    return;
  }

  const jobGetMatch = url.pathname.match(/^\/api\/ahrm\/v3\/jobs\/get\/(\d+)$/);
  if (request.method === "GET" && jobGetMatch) {
    const job = jobs.find((j) => j.id === Number(jobGetMatch[1]));
    if (!job) { sendJson(response, 404, { error: "Job not found" }); return; }
    sendJson(response, 200, jobToMap(job));
    return;
  }

  const jobPostedByMatch = url.pathname.match(/^\/api\/ahrm\/v3\/jobs\/postedBy\/(\d+)$/);
  if (request.method === "GET" && jobPostedByMatch) {
    const postedBy = Number(jobPostedByMatch[1]);
    sendJson(response, 200, jobs.filter((j) => j.postedBy === postedBy).map(jobToMap));
    return;
  }

  const jobHistoryMatch = url.pathname.match(/^\/api\/ahrm\/v3\/jobs\/history\/(\d+)\/(.+)$/);
  if (request.method === "GET" && jobHistoryMatch) {
    const userId = Number(jobHistoryMatch[1]);
    const status = decodeURIComponent(jobHistoryMatch[2]);
    const applications = [];
    for (const job of jobs) {
      for (const app of job.applicants) {
        if (app.applicantUserId === userId && (status === "ALL" || app.applicationStatus === status)) {
          applications.push({ ...app, jobTitle: job.title, company: job.company });
        }
      }
    }
    sendJson(response, 200, applications);
    return;
  }

  if (request.method === "POST" && url.pathname === `${jobsBase}/post`) {
    readBody(request, (body) => {
      if (!body.title || !body.company) { sendJson(response, 400, { error: "title and company are required" }); return; }
      const job = { ...body, id: ++jobIdSeq, applicants: [], jobStatus: body.jobStatus ?? "OPEN", createdAt: new Date().toISOString() };
      jobs.push(job);
      sendJson(response, 201, jobToMap(job));
    });
    return;
  }

  if (request.method === "POST" && url.pathname === `${jobsBase}/postAll`) {
    readBody(request, (body) => {
      if (!Array.isArray(body)) { sendJson(response, 400, { error: "Expected array" }); return; }
      const created = body.map((item) => {
        const job = { ...item, id: ++jobIdSeq, applicants: [], jobStatus: item.jobStatus ?? "OPEN", createdAt: new Date().toISOString() };
        jobs.push(job);
        return jobToMap(job);
      });
      sendJson(response, 201, created);
    });
    return;
  }

  const jobApplyMatch = url.pathname.match(/^\/api\/ahrm\/v3\/jobs\/apply\/(\d+)$/);
  if (request.method === "POST" && jobApplyMatch) {
    const job = jobs.find((j) => j.id === Number(jobApplyMatch[1]));
    if (!job) { sendJson(response, 404, { error: "Job not found" }); return; }
    readBody(request, (body) => {
      const application = { applicationId: ++applicationIdSeq, jobId: job.id, applicationStatus: "PENDING", appliedAt: new Date().toISOString(), ...body };
      job.applicants.push(application);
      sendJson(response, 200, { message: "Application submitted", application });
    });
    return;
  }

  if (request.method === "POST" && url.pathname === `${jobsBase}/changeAppStatus`) {
    readBody(request, (body) => {
      const { applicationId, jobId, applicationStatus } = body;
      const job = jobs.find((j) => j.id === Number(jobId));
      if (!job) { sendJson(response, 404, { error: "Job not found" }); return; }
      const app = job.applicants.find((a) => a.applicationId === Number(applicationId));
      if (!app) { sendJson(response, 404, { error: "Application not found" }); return; }
      app.applicationStatus = applicationStatus;
      sendJson(response, 200, { message: "Status updated", application: app });
    });
    return;
  }

  const jobDeleteMatch = url.pathname.match(/^\/api\/ahrm\/v3\/jobs\/delete\/(\d+)$/);
  if (request.method === "DELETE" && jobDeleteMatch) {
    const idx = jobs.findIndex((j) => j.id === Number(jobDeleteMatch[1]));
    if (idx === -1) { sendJson(response, 404, { error: "Job not found" }); return; }
    const [removed] = jobs.splice(idx, 1);
    sendJson(response, 200, { deleted: true, id: removed.id });
    return;
  }

  // postImage — return a stub (no file storage in mock)
  if (request.method === "POST" && url.pathname === `${jobsBase}/postImage`) {
    sendJson(response, 200, { message: "Image uploaded", fileName: "mock-image.png", imageUrl: "/api/ahrm/v3/jobs/image/mock-image.png", contentType: "image/png", size: 0 });
    return;
  }

  const jobImageMatch = url.pathname.match(/^\/api\/ahrm\/v3\/jobs\/image\/(.+)$/);
  if (request.method === "GET" && jobImageMatch) {
    sendJson(response, 404, { error: "Image not found in mock server" });
    return;
  }
  // ── end Jobs ───────────────────────────────────────────────────────────────

  // ── AHRM v3: reference-data CRUD (work-modes, departments, industries, employment-types) ──
  const ahrmCrudRoutes = [
    makeCrudHandler("/api/ahrm/v3/work-modes",        workModes,        () => ++workModeIdSeq),
    makeCrudHandler("/api/ahrm/v3/departments",        departments,      () => ++departmentIdSeq),
    makeCrudHandler("/api/ahrm/v3/industries",         industries,       () => ++industryIdSeq),
    makeCrudHandler("/api/ahrm/v3/employment-types",   employmentTypes,  () => ++employmentTypeIdSeq),
  ];

  for (const handler of ahrmCrudRoutes) {
    if (handler(request.method, url.pathname, request, response, readBody)) return;
  }
  // ── end AHRM CRUD ─────────────────────────────────────────────────────────

  // ── AHRM v3: Profiles ──────────────────────────────────────────────────────
  const profilesBase = "/api/ahrm/v3/profiles";

  if (request.method === "GET" && url.pathname === `${profilesBase}/getAll`) {
    sendJson(response, 200, profiles);
    return;
  }

  const profileGetMatch = url.pathname.match(/^\/api\/ahrm\/v3\/profiles\/get\/(\d+)$/);
  if (request.method === "GET" && profileGetMatch) {
    const profile = profiles.find((p) => p.id === Number(profileGetMatch[1]));
    if (!profile) { sendJson(response, 404, { error: "Profile not found" }); return; }
    sendJson(response, 200, profile);
    return;
  }

  if (request.method === "PUT" && url.pathname === `${profilesBase}/update`) {
    readBody(request, (body) => {
      const idx = profiles.findIndex((p) => p.id === Number(body?.id));
      if (idx === -1) { sendJson(response, 404, { error: "Profile not found" }); return; }
      profiles[idx] = { ...profiles[idx], ...body };
      sendJson(response, 200, profiles[idx]);
    });
    return;
  }
  // ── Resume parsing ──────────────────────────────────────────────────────────
  if (request.method === "POST" && url.pathname === `${profilesBase}/parseResume`) {
    // Accept larger payloads for file uploads
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", async () => {
      try {
        const body = JSON.parse(raw);
        const { fileData, fileName } = body;
        if (!fileData || !fileName) {
          sendJson(response, 400, { error: "fileData and fileName are required" });
          return;
        }

        const buffer = Buffer.from(fileData, "base64");
        const ext = fileName.toLowerCase().split(".").pop();
        let text = "";

        if (ext === "pdf") {
          const result = await pdfParse(buffer);
          text = result.text || "";
        } else if (ext === "docx") {
          const result = await mammoth.extractRawText({ buffer });
          text = result.value || "";
        } else if (ext === "doc") {
          // .doc (legacy Word) – mammoth only supports .docx; fall back to raw text
          text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
        } else {
          sendJson(response, 400, { error: "Unsupported file type. Use PDF or DOCX." });
          return;
        }

        // ── Extract structured data matching ProfileDTO ────────────────────
        const sectionBreak = /^(experiences?|education|certif\w*|projects?|summary|profile\s*summary|objective|about\s*me|about|work\s*experience|work\s*history|employment|references?|languages?|interests?|awards?|honors?|publications?|skills?|personal\s*details?|contact\s*info|address)\s*:?\s*$/i;
        const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);

        // Name: usually first non-empty line
        const name = lines[0] || "";

        // Email  (ProfileDTO.email)
        const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
        const email = emailMatch ? emailMatch[0] : "";

        // Phone  (ProfileDTO.personalDetails.alternateContact or dashboard phone)
        const phoneMatch = text.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/);
        const phone = phoneMatch ? phoneMatch[0].trim() : "";

        // Location  (ProfileDTO.location)
        let location = "";
        const locMatch = text.match(/(?:location|address|city)[:\s]*([^\n]{3,80})/i);
        if (locMatch) {
          location = locMatch[1].trim();
        } else {
          // Try to find a line that looks like "City, State" or "City, Country" near the top
          for (let i = 0; i < Math.min(lines.length, 8); i++) {
            if (/^[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\b/.test(lines[i]) || /^[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z]+/.test(lines[i])) {
              location = lines[i].substring(0, 200);
              break;
            }
          }
        }

        // ─── Skills  (ProfileDTO.skills: List<String>, max 100) ──────────
        let skills = [];
        const skillIdx = lines.findIndex(l => /^(?:skills?|technical\s*skills?|core\s*competenc|key\s*skills)\b/i.test(l));
        if (skillIdx !== -1) {
          for (let i = skillIdx + 1; i < lines.length; i++) {
            if (sectionBreak.test(lines[i])) break;
            const parts = lines[i].split(/[,;|•·●○■□▪▸▹►▻–—\-/]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 50);
            skills.push(...parts);
          }
        }
        if (!skills.length) {
          const techWords = text.match(/\b(JavaScript|TypeScript|React|Angular|Vue|Node\.?js|Python|Java|C\+\+|C#|SQL|MongoDB|AWS|Docker|Kubernetes|Git|HTML|CSS|Tailwind|Express|Spring|Django|Flask|REST|GraphQL|Agile|Scrum|Power\s*BI|Excel|Tableau)\b/gi);
          if (techWords) skills = [...new Set(techWords.map(s => s.trim()))];
        }
        skills = [...new Set(skills)].slice(0, 100);

        // ─── Job title  (ProfileDTO.jobTitle) ────────────────────────────
        let jobTitle = "";
        const titleLine = lines.find(l => /engineer|developer|analyst|manager|designer|architect|consultant|specialist|lead|director|admin|coordinator|intern|partner|recruiter/i.test(l));
        if (titleLine && titleLine !== name) jobTitle = titleLine.substring(0, 120);

        // ─── Company  (ProfileDTO.company) ───────────────────────────────
        let company = "";
        const compMatch = text.match(/(?:company|employer|organization|organisation)[:\s]*([^\n]{2,200})/i);
        if (compMatch) company = compMatch[1].trim();

        // ─── About / Summary  (ProfileDTO.about + profileSummary) ────────
        let about = "";
        let profileSummary = "";
        const summIdx = lines.findIndex(l => /^(summary|profile\s*summary|professional\s*summary|objective|about\s*me|about)\b/i.test(l));
        if (summIdx !== -1) {
          const parts = [];
          for (let i = summIdx + 1; i < lines.length; i++) {
            if (sectionBreak.test(lines[i])) break;
            parts.push(lines[i]);
          }
          const summText = parts.join(" ").substring(0, 2000);
          about = summText;
          profileSummary = summText;
        }

        // ─── Experience  (ProfileDTO.experiences: List<Experience>) ───────
        //  Experience { title, company, location, startDate, endDate, working, description }
        const experiences = [];
        const expIdx = lines.findIndex(l => /^(experience|work\s*experience|employment|work\s*history|professional\s*experience)\b/i.test(l));
        if (expIdx !== -1) {
          let current = null;
          for (let i = expIdx + 1; i < lines.length; i++) {
            if (/^(education|certif|skill|project|summary|objective|reference|language|interest|award|honor|publication|personal)/i.test(lines[i])) break;
            const dateMatch = lines[i].match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s,]*\d{4})\s*[-–—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s,]*\d{4}|Present|Current)/i);
            if (dateMatch) {
              if (current) experiences.push(current);
              const isPresent = /present|current/i.test(dateMatch[2]);
              current = {
                title: (i > expIdx + 1 && lines[i - 1] !== lines[expIdx]) ? lines[i - 1].substring(0, 120) : "",
                company: "",
                location: "",
                startDate: dateMatch[1],
                endDate: isPresent ? "Present" : dateMatch[2],
                working: isPresent,
                description: ""
              };
            } else if (current) {
              current.description += (current.description ? " " : "") + lines[i];
            }
          }
          if (current) experiences.push(current);
          // Trim description to 2000 chars per Experience DTO @Size(max=2000)
          for (const e of experiences) e.description = e.description.substring(0, 2000);
        }

        // If no company found from explicit label, take from first experience
        if (!company && experiences.length && experiences[0].title) {
          company = experiences[0].company || "";
        }

        // ─── Education  (ProfileDTO.education: List<Education>) ──────────
        //  Education { degree, field, college, yearOfPassing }
        const education = [];
        const eduIdx = lines.findIndex(l => /^education\b/i.test(l));
        if (eduIdx !== -1) {
          const parts = [];
          for (let i = eduIdx + 1; i < lines.length; i++) {
            if (sectionBreak.test(lines[i]) && !/^education/i.test(lines[i])) break;
            parts.push(lines[i]);
          }
          // Try to extract degree, field, college, year
          let degree = "", field = "", college = "", yearOfPassing = "";
          for (const p of parts) {
            const yearMatch = p.match(/\b(19|20)\d{2}\b/);
            if (yearMatch && !yearOfPassing) yearOfPassing = yearMatch[0];
            if (/bachelor|master|b\.?\s*tech|m\.?\s*tech|b\.?\s*sc|m\.?\s*sc|b\.?\s*e\b|m\.?\s*e\b|mba|phd|diploma|degree|b\.?\s*a\b|m\.?\s*a\b|b\.?com|m\.?com/i.test(p) && !degree) {
              degree = p.substring(0, 120);
            } else if (/university|college|institute|school|academy/i.test(p) && !college) {
              college = p.substring(0, 200);
            } else if (!field && p.length > 2) {
              field = p.substring(0, 120);
            }
          }
          if (degree || college) education.push({ degree, field, college, yearOfPassing });
        }

        // ─── Certifications  (ProfileDTO.certifications: List<Certification>) ─
        //  Certification { name, issuer, issueDate, certificateId }
        const certifications = [];
        const certIdx = lines.findIndex(l => /^certif/i.test(l));
        if (certIdx !== -1) {
          for (let i = certIdx + 1; i < lines.length; i++) {
            if (sectionBreak.test(lines[i]) && !/^certif/i.test(lines[i])) break;
            if (lines[i].length > 3) certifications.push({
              name: lines[i].substring(0, 200),
              issuer: "",
              issueDate: "",
              certificateId: ""
            });
          }
        }

        // ─── Total experience in years (ProfileDTO.totalExp) ─────────────
        let totalExp = 0;
        for (const exp of experiences) {
          const startYear = parseInt((exp.startDate || "").match(/\d{4}/)?.[0] || "0");
          const endYear = (exp.endDate || "").toLowerCase().includes("present") ? new Date().getFullYear() : parseInt((exp.endDate || "").match(/\d{4}/)?.[0] || "0");
          if (startYear && endYear) totalExp += endYear - startYear;
        }

        // ─── Languages (ProfileDTO.personalDetails.languagesKnown) ───────
        const languagesKnown = [];
        const langIdx = lines.findIndex(l => /^language/i.test(l));
        if (langIdx !== -1) {
          for (let i = langIdx + 1; i < lines.length; i++) {
            if (sectionBreak.test(lines[i]) && !/^language/i.test(lines[i])) break;
            const parts = lines[i].split(/[,;|•·●○]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 40);
            languagesKnown.push(...parts);
          }
        }

        // ─── Response shaped like ProfileDTO ─────────────────────────────
        sendJson(response, 200, {
          // Basic fields
          name,
          email,
          jobTitle,
          company,
          location,
          about,
          profileSummary,
          totalExp,
          // Collections
          skills,
          experiences: experiences.slice(0, 10),
          education: education.slice(0, 5),
          certifications: certifications.slice(0, 10),
          // PersonalDetails subset
          personalDetails: {
            currentLocation: location,
            languagesKnown: languagesKnown.slice(0, 10),
            alternateContact: phone,
          },
          // Dashboard-service DTO fields
          phone,
          address: location,
          summary: about,
          rawTextPreview: text.substring(0, 500),
        });
      } catch (err) {
        console.error("parseResume error:", err);
        sendJson(response, 500, { error: "Failed to parse resume: " + (err.message || "Unknown error") });
      }
    });
    return;
  }

  // ── end Profiles ───────────────────────────────────────────────────────────

  notFound(response);
});

server.listen(PORT, () => {
  console.log(`AfroHR backend listening on http://127.0.0.1:${PORT}`);
});