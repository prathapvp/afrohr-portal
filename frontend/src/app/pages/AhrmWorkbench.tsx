import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { authenticate } from "../services/auth-service";
import { applyToCandidateJobByPath, getCandidateJobById, getCandidateJobs } from "../services/candidate-jobs-service";
import { clearAhrmToken, getAhrmToken, setAhrmToken } from "../services/http-auth";
import {
  applyToJob,
  changeApplicationStatus,
  getAllJobs,
  getJob,
  getJobHistory,
  getJobsPostedBy,
  postAllJobs,
  postJob,
  postJobImage,
  type ApplicationStatusPayload,
  type JobPayload,
} from "../services/job-service";
import { getUnreadNotifications, markNotificationRead } from "../services/notification-service";
import { getAudiences, getDashboardByAudience, getDashboardRoot, getHealth } from "../services/platform-service";
import { getAllProfiles, getProfile, updateProfile, type ProfilePayload } from "../services/profile-service";
import { searchContent } from "../services/search-service";
import { changePassword, loginUser, registerUser, sendOtp, verifyOtp } from "../services/user-service";

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function endpointClass(auth: "public" | "jwt") {
  return auth === "jwt"
    ? "rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700"
    : "rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700";
}

function EndpointTag({ method, path, auth }: { method: string; path: string; auth: "public" | "jwt" }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="rounded bg-slate-900 px-2 py-0.5 font-bold text-white">{method}</span>
      <span className="font-mono text-slate-700">{path}</span>
      <span className={endpointClass(auth)}>{auth === "jwt" ? "JWT" : "Public"}</span>
    </div>
  );
}

type EndpointAuth = "public" | "jwt";

interface EndpointMeta {
  key: string;
  method: "GET" | "POST" | "PUT";
  path: string;
  auth: EndpointAuth;
  group: string;
}

interface EndpointRunState {
  status: "idle" | "running" | "success" | "error";
  at?: string;
  message?: string;
}

const endpointCatalog: EndpointMeta[] = [
  { key: "health", method: "GET", path: "/api/health", auth: "public", group: "Platform" },
  { key: "audiences", method: "GET", path: "/api/audiences", auth: "public", group: "Platform" },
  { key: "dashboard-root", method: "GET", path: "/api/ahrm/v3/jobs/getAll", auth: "public", group: "Platform" },
  { key: "dashboard-audience", method: "GET", path: "/api/search?audience={audience}&q=", auth: "public", group: "Platform" },
  { key: "search", method: "GET", path: "/api/search", auth: "public", group: "Platform" },

  { key: "candidate-jobs", method: "GET", path: "/api/candidates/jobs", auth: "public", group: "Candidate" },
  { key: "candidate-job-by-id", method: "GET", path: "/api/candidates/jobs/{jobId}", auth: "public", group: "Candidate" },
  { key: "candidate-apply", method: "POST", path: "/api/candidates/jobs/{jobId}/apply", auth: "public", group: "Candidate" },

  { key: "auth-login", method: "POST", path: "/api/ahrm/v3/auth/login", auth: "public", group: "Auth" },
  { key: "users-register", method: "POST", path: "/api/ahrm/v3/users/register", auth: "public", group: "Auth" },
  { key: "users-login", method: "POST", path: "/api/ahrm/v3/users/login", auth: "public", group: "Auth" },
  { key: "users-change-pass", method: "POST", path: "/api/ahrm/v3/users/changePass", auth: "public", group: "Auth" },
  { key: "users-send-otp", method: "POST", path: "/api/ahrm/v3/users/sendOtp/{email}", auth: "public", group: "Auth" },
  { key: "users-verify-otp", method: "GET", path: "/api/ahrm/v3/users/verifyOtp/{email}/{otp}", auth: "public", group: "Auth" },
  { key: "users-me", method: "GET", path: "/api/ahrm/v3/users/me", auth: "jwt", group: "Auth" },

  { key: "jobs-get-all", method: "GET", path: "/api/ahrm/v3/jobs/getAll", auth: "public", group: "Jobs" },
  { key: "jobs-get-by-id", method: "GET", path: "/api/ahrm/v3/jobs/get/{id}", auth: "public", group: "Jobs" },
  { key: "jobs-apply", method: "POST", path: "/api/ahrm/v3/jobs/apply/{id}", auth: "public", group: "Jobs" },
  { key: "jobs-apply-me", method: "POST", path: "/api/ahrm/v3/jobs/me/applications/{jobId}", auth: "jwt", group: "Jobs" },
  { key: "jobs-post", method: "POST", path: "/api/ahrm/v3/jobs/post", auth: "jwt", group: "Jobs" },
  { key: "jobs-post-me", method: "POST", path: "/api/ahrm/v3/jobs/me", auth: "jwt", group: "Jobs" },
  { key: "jobs-delete", method: "DELETE", path: "/api/ahrm/v3/jobs/delete/{id}", auth: "jwt", group: "Jobs" },
  { key: "jobs-delete-me", method: "DELETE", path: "/api/ahrm/v3/jobs/me/{jobId}", auth: "jwt", group: "Jobs" },
  { key: "jobs-post-all", method: "POST", path: "/api/ahrm/v3/jobs/postAll", auth: "jwt", group: "Jobs" },
  { key: "jobs-posted-by", method: "GET", path: "/api/ahrm/v3/jobs/postedBy/{id}", auth: "jwt", group: "Jobs" },
  { key: "jobs-my-posted", method: "GET", path: "/api/ahrm/v3/jobs/me/posted", auth: "jwt", group: "Jobs" },
  { key: "jobs-history", method: "GET", path: "/api/ahrm/v3/jobs/history/{id}/{applicationStatus}", auth: "jwt", group: "Jobs" },
  { key: "jobs-my-history", method: "GET", path: "/api/ahrm/v3/jobs/me/history/{applicationStatus}", auth: "jwt", group: "Jobs" },
  { key: "jobs-change-status", method: "POST", path: "/api/ahrm/v3/jobs/changeAppStatus", auth: "jwt", group: "Jobs" },
  { key: "jobs-post-image", method: "POST", path: "/api/ahrm/v3/jobs/postImage", auth: "public", group: "Jobs" },
  { key: "jobs-get-image", method: "GET", path: "/api/ahrm/v3/jobs/image/{fileName}", auth: "public", group: "Jobs" },

  { key: "profiles-get", method: "GET", path: "/api/ahrm/v3/profiles/get/{id}", auth: "jwt", group: "Profiles" },
  { key: "profiles-me", method: "GET", path: "/api/ahrm/v3/profiles/me", auth: "jwt", group: "Profiles" },
  { key: "profiles-get-all", method: "GET", path: "/api/ahrm/v3/profiles/getAll", auth: "jwt", group: "Profiles" },
  { key: "profiles-update", method: "PUT", path: "/api/ahrm/v3/profiles/update", auth: "jwt", group: "Profiles" },
  { key: "profiles-me-update", method: "PUT", path: "/api/ahrm/v3/profiles/me", auth: "jwt", group: "Profiles" },
  { key: "profiles-me-patch", method: "PATCH", path: "/api/ahrm/v3/profiles/me", auth: "jwt", group: "Profiles" },
  { key: "profiles-me-upload-resume", method: "POST", path: "/api/ahrm/v3/profiles/me/uploadResume", auth: "jwt", group: "Profiles" },

  { key: "notification-get", method: "GET", path: "/api/ahrm/v3/notification/get/{userId}", auth: "jwt", group: "Notifications" },
  { key: "notification-me", method: "GET", path: "/api/ahrm/v3/notification/me", auth: "jwt", group: "Notifications" },
  { key: "notification-read", method: "PUT", path: "/api/ahrm/v3/notification/read/{id}", auth: "jwt", group: "Notifications" },

  { key: "departments-get-all", method: "GET", path: "/api/ahrm/v3/departments", auth: "public", group: "Metadata" },
  { key: "departments-get", method: "GET", path: "/api/ahrm/v3/departments/{id}", auth: "public", group: "Metadata" },
  { key: "departments-create", method: "POST", path: "/api/ahrm/v3/departments", auth: "jwt", group: "Metadata" },
  { key: "departments-update", method: "PUT", path: "/api/ahrm/v3/departments/{id}", auth: "jwt", group: "Metadata" },
  { key: "departments-delete", method: "DELETE", path: "/api/ahrm/v3/departments/{id}", auth: "jwt", group: "Metadata" },

  { key: "industries-get-all", method: "GET", path: "/api/ahrm/v3/industries", auth: "public", group: "Metadata" },
  { key: "industries-get", method: "GET", path: "/api/ahrm/v3/industries/{id}", auth: "public", group: "Metadata" },
  { key: "industries-create", method: "POST", path: "/api/ahrm/v3/industries", auth: "jwt", group: "Metadata" },
  { key: "industries-update", method: "PUT", path: "/api/ahrm/v3/industries/{id}", auth: "jwt", group: "Metadata" },
  { key: "industries-delete", method: "DELETE", path: "/api/ahrm/v3/industries/{id}", auth: "jwt", group: "Metadata" },

  { key: "employment-types-get-all", method: "GET", path: "/api/ahrm/v3/employment-types", auth: "public", group: "Metadata" },
  { key: "employment-types-get", method: "GET", path: "/api/ahrm/v3/employment-types/{id}", auth: "public", group: "Metadata" },
  { key: "employment-types-create", method: "POST", path: "/api/ahrm/v3/employment-types", auth: "jwt", group: "Metadata" },
  { key: "employment-types-update", method: "PUT", path: "/api/ahrm/v3/employment-types/{id}", auth: "jwt", group: "Metadata" },
  { key: "employment-types-delete", method: "DELETE", path: "/api/ahrm/v3/employment-types/{id}", auth: "jwt", group: "Metadata" },

  { key: "work-modes-get-all", method: "GET", path: "/api/ahrm/v3/work-modes", auth: "public", group: "Metadata" },
  { key: "work-modes-get", method: "GET", path: "/api/ahrm/v3/work-modes/{id}", auth: "public", group: "Metadata" },
  { key: "work-modes-create", method: "POST", path: "/api/ahrm/v3/work-modes", auth: "jwt", group: "Metadata" },
  { key: "work-modes-update", method: "PUT", path: "/api/ahrm/v3/work-modes/{id}", auth: "jwt", group: "Metadata" },
  { key: "work-modes-delete", method: "DELETE", path: "/api/ahrm/v3/work-modes/{id}", auth: "jwt", group: "Metadata" },
];

export default function AhrmWorkbench() {
  const navigate = useNavigate();

  const [result, setResult] = useState<string>("Run any endpoint below to see response");
  const [busy, setBusy] = useState(false);
  const [endpointStates, setEndpointStates] = useState<Record<string, EndpointRunState>>({});

  const [email, setEmail] = useState("candidate@example.com");
  const [password, setPassword] = useState("Pass@123");
  const [name, setName] = useState("Candidate One");
  const [accountType, setAccountType] = useState("candidate");
  const [otp, setOtp] = useState("123456");

  const [audience, setAudience] = useState("candidates");
  const [query, setQuery] = useState("engineer");

  const [jobId, setJobId] = useState(1);
  const [userId, setUserId] = useState(1);
  const [applicationId, setApplicationId] = useState(1);
  const [applicationStatus, setApplicationStatus] = useState("APPLIED");

  const [jobTitle, setJobTitle] = useState("Senior AI Engineer");
  const [jobCompany, setJobCompany] = useState("TechCorp");
  const [jobLocation, setJobLocation] = useState("Remote");
  const [jobSalary, setJobSalary] = useState("$200k-$280k");
  const [jobDescription, setJobDescription] = useState("Lead AI initiatives");

  const [profileId, setProfileId] = useState(1);
  const [profileName, setProfileName] = useState("Candidate One");
  const [profilePhone, setProfilePhone] = useState("+123456789");
  const [profileAddress, setProfileAddress] = useState("Nairobi");
  const [profileSummary, setProfileSummary] = useState("AI Engineer");
  const [profileSkills, setProfileSkills] = useState("Python,ML,Cloud");

  const [notificationId, setNotificationId] = useState(1);
  const [imageFileName, setImageFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const imageUrl = useMemo(() => {
    if (!imageFileName.trim()) {
      return "";
    }
    return `/api/ahrm/v3/jobs/image/${encodeURIComponent(imageFileName.trim())}`;
  }, [imageFileName]);

  const groupedEndpoints = useMemo(() => {
    return endpointCatalog.reduce<Record<string, EndpointMeta[]>>((acc, endpoint) => {
      if (!acc[endpoint.group]) {
        acc[endpoint.group] = [];
      }
      acc[endpoint.group].push(endpoint);
      return acc;
    }, {});
  }, []);

  const successCount = Object.values(endpointStates).filter((entry) => entry.status === "success").length;
  const errorCount = Object.values(endpointStates).filter((entry) => entry.status === "error").length;

  async function run(endpointKey: string, operation: () => Promise<unknown>) {
    setEndpointStates((prev) => ({
      ...prev,
      [endpointKey]: {
        status: "running",
        at: new Date().toLocaleTimeString(),
      },
    }));

    try {
      setBusy(true);
      const response = await operation();
      setResult(pretty(response));
      setEndpointStates((prev) => ({
        ...prev,
        [endpointKey]: {
          status: "success",
          at: new Date().toLocaleTimeString(),
          message: "OK",
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operation failed";
      setResult(message);
      setEndpointStates((prev) => ({
        ...prev,
        [endpointKey]: {
          status: "error",
          at: new Date().toLocaleTimeString(),
          message,
        },
      }));
    } finally {
      setBusy(false);
    }
  }

  async function runAndCaptureToken(endpointKey: string, operation: () => Promise<any>) {
    await run(endpointKey, async () => {
      const response = await operation();
      if (response && typeof response === "object" && "token" in response && typeof response.token === "string") {
        setAhrmToken(response.token);
      }
      return response;
    });
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Full Backend API Console</h1>
              <p className="text-sm text-slate-600">UI controls for each backend endpoint in gateway + dashboard-service + search-service.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void navigate("/")} className="rounded border px-3 py-2 text-sm">Home</button>
              <button onClick={() => void navigate("/dashboard")} className="rounded border px-3 py-2 text-sm">Dashboard</button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Token:</span>
            <span className="max-w-[60ch] truncate rounded bg-slate-100 px-2 py-1 font-mono">{getAhrmToken() ?? "(none)"}</span>
            <button
              disabled={busy}
              onClick={() => {
                clearAhrmToken();
                setResult("JWT token cleared from localStorage");
              }}
              className="rounded border px-2 py-1"
            >
              Clear Token
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <aside className="rounded-xl bg-white p-4 shadow-sm xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-auto">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Endpoint Status</h2>
            <p className="mt-1 text-xs text-slate-500">Green means last run succeeded, red means last run failed.</p>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">Passed {successCount}</span>
              <span className="rounded bg-rose-100 px-2 py-1 text-rose-800">Failed {errorCount}</span>
            </div>

            <div className="mt-4 space-y-3">
              {Object.entries(groupedEndpoints).map(([group, endpoints]) => (
                <div key={group} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</h3>
                  <div className="space-y-1">
                    {endpoints.map((endpoint) => {
                      const state = endpointStates[endpoint.key];
                      const dotClass =
                        state?.status === "success"
                          ? "bg-emerald-500"
                          : state?.status === "error"
                            ? "bg-rose-500"
                            : state?.status === "running"
                              ? "bg-amber-400"
                              : "bg-slate-300";

                      return (
                        <div key={endpoint.key} className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className={`h-2 w-2 rounded-full ${dotClass}`} />
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-bold text-white">{endpoint.method}</span>
                            <span className="truncate font-mono text-slate-700">{endpoint.path}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                            <span>{endpoint.auth === "jwt" ? "JWT" : "Public"}</span>
                            <span>{state?.at ?? "never"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Platform And Search</h2>
            <div className="space-y-2">
              <EndpointTag method="GET" path="/api/health" auth="public" />
              <button disabled={busy} onClick={() => void run("health", () => getHealth())} className="rounded bg-slate-800 px-3 py-2 text-sm text-white">Run Health</button>

              <EndpointTag method="GET" path="/api/audiences" auth="public" />
              <button disabled={busy} onClick={() => void run("audiences", () => getAudiences())} className="rounded bg-slate-800 px-3 py-2 text-sm text-white">Run Audiences</button>

              <EndpointTag method="GET" path="/api/ahrm/v3/jobs/getAll" auth="public" />
              <button disabled={busy} onClick={() => void run("dashboard-root", () => getDashboardRoot())} className="rounded bg-slate-800 px-3 py-2 text-sm text-white">Run Dashboard</button>

              <EndpointTag method="GET" path="/api/search?audience={audience}&q=" auth="public" />
              <input className="w-full rounded border px-3 py-2" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="audience" />
              <button disabled={busy} onClick={() => void run("dashboard-audience", () => getDashboardByAudience(audience))} className="rounded bg-slate-800 px-3 py-2 text-sm text-white">Run Dashboard By Audience</button>

              <EndpointTag method="GET" path="/api/search?audience=&q=" auth="public" />
              <input className="w-full rounded border px-3 py-2" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search query" />
              <button disabled={busy} onClick={() => void run("search", () => searchContent(audience, query))} className="rounded bg-slate-800 px-3 py-2 text-sm text-white">Run Search</button>
            </div>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Candidate Routes</h2>
            <div className="space-y-2">
              <input className="w-full rounded border px-3 py-2" type="number" value={jobId} onChange={(e) => setJobId(Number(e.target.value))} placeholder="job id" />
              <input className="w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="applicant name" />
              <input className="w-full rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="applicant email" />

              <EndpointTag method="GET" path="/api/candidates/jobs" auth="public" />
              <button disabled={busy} onClick={() => void run("candidate-jobs", () => getCandidateJobs())} className="rounded bg-indigo-700 px-3 py-2 text-sm text-white">Run Candidates Jobs</button>

              <EndpointTag method="GET" path="/api/candidates/jobs/{jobId}" auth="public" />
              <button disabled={busy} onClick={() => void run("candidate-job-by-id", () => getCandidateJobById(jobId))} className="rounded bg-indigo-700 px-3 py-2 text-sm text-white">Run Candidate Job By Id</button>

              <EndpointTag method="POST" path="/api/candidates/jobs/{jobId}/apply" auth="public" />
              <button
                disabled={busy}
                onClick={() =>
                  void run("candidate-apply", () =>
                    applyToCandidateJobByPath(jobId, {
                      applicantName: name,
                      applicantEmail: email,
                    }),
                  )
                }
                className="rounded bg-indigo-700 px-3 py-2 text-sm text-white"
              >
                Run Candidate Apply
              </button>
            </div>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Auth And Users</h2>
            <div className="grid gap-2">
              <input className="rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
              <input className="rounded border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
              <input className="rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
              <input className="rounded border px-3 py-2" value={accountType} onChange={(e) => setAccountType(e.target.value)} placeholder="account type" />
              <input className="rounded border px-3 py-2" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="otp" />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <EndpointTag method="POST" path="/api/ahrm/v3/auth/login" auth="public" />
                <button disabled={busy} onClick={() => void runAndCaptureToken("auth-login", () => authenticate({ email, password }))} className="rounded bg-slate-800 px-3 py-2 text-sm text-white">Run Auth Login</button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="POST" path="/api/ahrm/v3/users/register" auth="public" />
                <button disabled={busy} onClick={() => void runAndCaptureToken("users-register", () => registerUser({ name, email, password, accountType }))} className="rounded bg-slate-800 px-3 py-2 text-sm text-white">Run Register</button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="POST" path="/api/ahrm/v3/users/login" auth="public" />
                <button disabled={busy} onClick={() => void runAndCaptureToken("users-login", () => loginUser({ email, password }))} className="rounded bg-slate-800 px-3 py-2 text-sm text-white">Run User Login</button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="POST" path="/api/ahrm/v3/users/changePass" auth="public" />
                <button disabled={busy} onClick={() => void run("users-change-pass", () => changePassword({ email, currentPassword: password, newPassword: password }))} className="rounded bg-slate-800 px-3 py-2 text-sm text-white">Run Change Password</button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="POST" path="/api/ahrm/v3/users/sendOtp/{email}" auth="public" />
                <button disabled={busy} onClick={() => void run("users-send-otp", () => sendOtp(email))} className="rounded bg-slate-800 px-3 py-2 text-sm text-white">Run Send OTP</button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="GET" path="/api/ahrm/v3/users/verifyOtp/{email}/{otp}" auth="public" />
                <button disabled={busy} onClick={() => void run("users-verify-otp", () => verifyOtp(email, otp))} className="rounded bg-slate-800 px-3 py-2 text-sm text-white">Run Verify OTP</button>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Jobs (AHRM)</h2>
            <div className="grid gap-2">
              <input className="rounded border px-3 py-2" type="number" value={jobId} onChange={(e) => setJobId(Number(e.target.value))} placeholder="job id" />
              <input className="rounded border px-3 py-2" type="number" value={userId} onChange={(e) => setUserId(Number(e.target.value))} placeholder="user id" />
              <input className="rounded border px-3 py-2" type="number" value={applicationId} onChange={(e) => setApplicationId(Number(e.target.value))} placeholder="application id" />
              <input className="rounded border px-3 py-2" value={applicationStatus} onChange={(e) => setApplicationStatus(e.target.value)} placeholder="application status" />
              <input className="rounded border px-3 py-2" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="title" />
              <input className="rounded border px-3 py-2" value={jobCompany} onChange={(e) => setJobCompany(e.target.value)} placeholder="company" />
              <input className="rounded border px-3 py-2" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} placeholder="location" />
              <input className="rounded border px-3 py-2" value={jobSalary} onChange={(e) => setJobSalary(e.target.value)} placeholder="salary" />
              <input className="rounded border px-3 py-2" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="description" />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <EndpointTag method="GET" path="/api/ahrm/v3/jobs/getAll" auth="public" />
                <button disabled={busy} onClick={() => void run("jobs-get-all", () => getAllJobs())} className="rounded bg-blue-700 px-3 py-2 text-sm text-white">Run GetAll</button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="GET" path="/api/ahrm/v3/jobs/get/{id}" auth="public" />
                <button disabled={busy} onClick={() => void run("jobs-get-by-id", () => getJob(jobId))} className="rounded bg-blue-700 px-3 py-2 text-sm text-white">Run Get By Id</button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="POST" path="/api/ahrm/v3/jobs/apply/{id}" auth="public" />
                <button
                  disabled={busy}
                  onClick={() =>
                    void run("jobs-apply", () =>
                      applyToJob(jobId, {
                        applicantUserId: userId,
                        applicantName: name,
                        applicantEmail: email,
                      }),
                    )
                  }
                  className="rounded bg-blue-700 px-3 py-2 text-sm text-white"
                >
                  Run AHRM Apply
                </button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="POST" path="/api/ahrm/v3/jobs/post" auth="jwt" />
                <button
                  disabled={busy}
                  onClick={() =>
                    void run("jobs-post", () =>
                      postJob({
                        id: jobId > 0 ? jobId : undefined,
                        title: jobTitle,
                        company: jobCompany,
                        description: jobDescription,
                        location: jobLocation,
                        salary: jobSalary,
                        postedBy: userId,
                        jobStatus: "ACTIVE",
                      } as JobPayload),
                    )
                  }
                  className="rounded bg-blue-700 px-3 py-2 text-sm text-white"
                >
                  Run Post
                </button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="POST" path="/api/ahrm/v3/jobs/postAll" auth="jwt" />
                <button
                  disabled={busy}
                  onClick={() =>
                    void run("jobs-post-all", () =>
                      postAllJobs([
                        {
                          title: `${jobTitle} I`,
                          company: jobCompany,
                          description: jobDescription,
                          location: jobLocation,
                          salary: jobSalary,
                          postedBy: userId,
                        },
                        {
                          title: `${jobTitle} II`,
                          company: jobCompany,
                          description: jobDescription,
                          location: jobLocation,
                          salary: jobSalary,
                          postedBy: userId,
                        },
                      ] as JobPayload[]),
                    )
                  }
                  className="rounded bg-blue-700 px-3 py-2 text-sm text-white"
                >
                  Run PostAll
                </button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="GET" path="/api/ahrm/v3/jobs/postedBy/{id}" auth="jwt" />
                <button disabled={busy} onClick={() => void run("jobs-posted-by", () => getJobsPostedBy(userId))} className="rounded bg-blue-700 px-3 py-2 text-sm text-white">Run PostedBy</button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="GET" path="/api/ahrm/v3/jobs/history/{id}/{applicationStatus}" auth="jwt" />
                <button disabled={busy} onClick={() => void run("jobs-history", () => getJobHistory(userId, applicationStatus))} className="rounded bg-blue-700 px-3 py-2 text-sm text-white">Run History</button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="POST" path="/api/ahrm/v3/jobs/changeAppStatus" auth="jwt" />
                <button
                  disabled={busy}
                  onClick={() =>
                    void run("jobs-change-status", () =>
                      changeApplicationStatus({
                        applicationId,
                        jobId,
                        applicantUserId: userId,
                        applicationStatus,
                      } as ApplicationStatusPayload),
                    )
                  }
                  className="rounded bg-blue-700 px-3 py-2 text-sm text-white"
                >
                  Run Change Status
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Jobs Image APIs</h2>
            <div className="space-y-2">
              <EndpointTag method="POST" path="/api/ahrm/v3/jobs/postImage" auth="public" />
              <input
                className="w-full rounded border px-3 py-2"
                type="file"
                accept="image/*"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
              <button
                disabled={busy || !selectedFile}
                onClick={() =>
                  void run("jobs-post-image", async () => {
                    if (!selectedFile) {
                      throw new Error("Select an image first");
                    }
                    const response = await postJobImage(selectedFile);
                    setImageFileName(response.fileName);
                    return response;
                  })
                }
                className="rounded bg-rose-700 px-3 py-2 text-sm text-white"
              >
                Run Upload Image
              </button>

              <EndpointTag method="GET" path="/api/ahrm/v3/jobs/image/{fileName}" auth="public" />
              <input
                className="w-full rounded border px-3 py-2"
                value={imageFileName}
                onChange={(event) => setImageFileName(event.target.value)}
                placeholder="image file name"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={busy || !imageUrl}
                  onClick={() =>
                    void run("jobs-get-image", async () => {
                      const response = await fetch(imageUrl);
                      return {
                        ok: response.ok,
                        status: response.status,
                        contentType: response.headers.get("content-type"),
                      };
                    })
                  }
                  className="rounded bg-rose-700 px-3 py-2 text-sm text-white"
                >
                  Verify Image Endpoint
                </button>
                {imageUrl ? (
                  <a className="rounded border px-3 py-2 text-sm" href={imageUrl} target="_blank" rel="noreferrer">
                    Open Image
                  </a>
                ) : null}
              </div>
              {imageUrl ? <img src={imageUrl} alt="Job upload preview" className="mt-2 max-h-40 rounded border object-contain" /> : null}
            </div>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Profiles</h2>
            <div className="grid gap-2">
              <input className="rounded border px-3 py-2" type="number" value={profileId} onChange={(e) => setProfileId(Number(e.target.value))} placeholder="profile id" />
              <input className="rounded border px-3 py-2" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="full name" />
              <input className="rounded border px-3 py-2" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="phone" />
              <input className="rounded border px-3 py-2" value={profileAddress} onChange={(e) => setProfileAddress(e.target.value)} placeholder="address" />
              <input className="rounded border px-3 py-2" value={profileSummary} onChange={(e) => setProfileSummary(e.target.value)} placeholder="summary" />
              <input className="rounded border px-3 py-2" value={profileSkills} onChange={(e) => setProfileSkills(e.target.value)} placeholder="skills comma separated" />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <EndpointTag method="GET" path="/api/ahrm/v3/profiles/get/{id}" auth="jwt" />
                <button disabled={busy} onClick={() => void run("profiles-get", () => getProfile(profileId))} className="rounded bg-emerald-700 px-3 py-2 text-sm text-white">Run Get Profile</button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="GET" path="/api/ahrm/v3/profiles/getAll" auth="jwt" />
                <button disabled={busy} onClick={() => void run("profiles-get-all", () => getAllProfiles())} className="rounded bg-emerald-700 px-3 py-2 text-sm text-white">Run Get All Profiles</button>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <EndpointTag method="PUT" path="/api/ahrm/v3/profiles/update" auth="jwt" />
                <button
                  disabled={busy}
                  onClick={() =>
                    void run("profiles-update", () =>
                      updateProfile({
                        id: profileId,
                        userId,
                        fullName: profileName,
                        email,
                        accountType,
                        phone: profilePhone,
                        address: profileAddress,
                        summary: profileSummary,
                        skills: profileSkills
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      } as ProfilePayload),
                    )
                  }
                  className="rounded bg-emerald-700 px-3 py-2 text-sm text-white"
                >
                  Run Update Profile
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Notifications</h2>
            <div className="grid gap-2">
              <input className="rounded border px-3 py-2" type="number" value={userId} onChange={(e) => setUserId(Number(e.target.value))} placeholder="user id" />
              <input className="rounded border px-3 py-2" type="number" value={notificationId} onChange={(e) => setNotificationId(Number(e.target.value))} placeholder="notification id" />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <EndpointTag method="GET" path="/api/ahrm/v3/notification/get/{userId}" auth="jwt" />
                <button disabled={busy} onClick={() => void run("notification-get", () => getUnreadNotifications(userId))} className="rounded bg-violet-700 px-3 py-2 text-sm text-white">Run Get Unread</button>
              </div>
              <div className="space-y-1">
                <EndpointTag method="PUT" path="/api/ahrm/v3/notification/read/{id}" auth="jwt" />
                <button disabled={busy} onClick={() => void run("notification-read", () => markNotificationRead(notificationId))} className="rounded bg-violet-700 px-3 py-2 text-sm text-white">Run Mark Read</button>
              </div>
            </div>
          </section>
          </div>
        </div>

        <section className="rounded-xl bg-slate-900 p-4 text-white shadow-sm">
          <h2 className="mb-2 font-semibold">Response</h2>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-xs leading-5">{result}</pre>
        </section>
      </div>
    </div>
  );
}
