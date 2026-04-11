import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle, ArrowDownRight, ArrowLeft, ArrowUpRight, BadgeCheck, CalendarClock, CheckCircle2, Clock,
  CreditCard, Eye, FileDown, FileText, Layers, Paperclip, RefreshCw,
  Minus, Pencil, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp, Trash2, Upload, X, Zap,
} from "lucide-react";
import { deleteSubscriptionRequest, getMySubscription, getMySubscriptionRequests, openSubscriptionStatement, submitSubscriptionRequest, updateSubscriptionRequest } from "../../services/subscription-service";
import type { EmployerSubscription, SubscriptionRequest, SubscriptionRequestType } from "../../services/admin-service";

/* ── helpers ── */
function statusDot(status: string) {
  if (status === "ACTIVE" || status === "PAID") return "bg-emerald-400";
  if (status === "PENDING") return "bg-amber-400";
  return "bg-rose-400";
}
function statusText(status: string) {
  if (status === "ACTIVE" || status === "PAID") return "text-emerald-300";
  if (status === "PENDING") return "text-amber-300";
  return "text-rose-300";
}

function QuotaBar({ used, limit, color }: { used: number; limit: number; color: string }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const barColor = pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-400" : color;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between text-[11px] text-slate-400">
        <span>{used} used</span>
        <span>{limit > 0 ? `${limit} limit` : "Unlimited"}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ReqBadge({ status }: { status: string }) {
  if (status === "APPROVED") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
      <ThumbsUp className="h-3 w-3" />{status}
    </span>
  );
  if (status === "REJECTED") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300 ring-1 ring-rose-500/30">
      <ThumbsDown className="h-3 w-3" />{status}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-500/30">
      <Clock className="h-3 w-3" />{status}
    </span>
  );
}

function PlanTier({ name }: { name: string }) {
  const upper = name.toUpperCase();
  if (upper.includes("ENTERPRISE")) return { icon: <Sparkles className="h-5 w-5 text-violet-300" />, color: "from-violet-600/30 to-purple-700/30 ring-violet-500/30", label: "text-violet-200" };
  if (upper.includes("PRO") || upper.includes("GROWTH")) return { icon: <Zap className="h-5 w-5 text-cyan-300" />, color: "from-cyan-600/30 to-blue-700/30 ring-cyan-500/30", label: "text-cyan-200" };
  return { icon: <ShieldCheck className="h-5 w-5 text-slate-300" />, color: "from-slate-600/20 to-slate-700/20 ring-slate-500/20", label: "text-slate-200" };
}

const PLAN_DETAILS: Record<string, { maxActiveJobs: number; maxResumeViewsPerMonth: number; maxResumeDownloadsPerMonth: number; summary: string }> = {
  STARTER: {
    maxActiveJobs: 10,
    maxResumeViewsPerMonth: 100,
    maxResumeDownloadsPerMonth: 50,
    summary: "Great for growing teams with steady hiring.",
  },
  GROWTH: {
    maxActiveJobs: 20,
    maxResumeViewsPerMonth: 250,
    maxResumeDownloadsPerMonth: 100,
    summary: "Balanced plan for active recruitment pipelines.",
  },
  PRO: {
    maxActiveJobs: 50,
    maxResumeViewsPerMonth: 500,
    maxResumeDownloadsPerMonth: 250,
    summary: "High-volume hiring with larger resume access limits.",
  },
  ENTERPRISE: {
    maxActiveJobs: 100,
    maxResumeViewsPerMonth: 5000,
    maxResumeDownloadsPerMonth: 2500,
    summary: "Maximum capacity for large recruiting operations.",
  },
};

/* ── component ── */
export default function EmployerSubscriptionPage() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<EmployerSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── request modal state ── */
  const [requestModal, setRequestModal] = useState<{ type: SubscriptionRequestType; requestId?: number; existingStatementName?: string | null } | null>(null);
  const [reqPlan, setReqPlan] = useState("STARTER");
  const [reqNote, setReqNote] = useState("");
  const [reqFile, setReqFile] = useState<File | null>(null);
  const [reqFileError, setReqFileError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openingStatementId, setOpeningStatementId] = useState<number | null>(null);
  const [requestStatusFilter, setRequestStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [requestTypeFilter, setRequestTypeFilter] = useState<"ALL" | SubscriptionRequestType>("ALL");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accountType = (localStorage.getItem("accountType") ?? "").toUpperCase();
  const token = localStorage.getItem("token");
  const isEmployerAuthorized = Boolean(token) && accountType === "EMPLOYER";

  async function loadData(cancelled: { value: boolean }) {
    if (!isEmployerAuthorized) return;
    try {
      setLoading(true);
      setError(null);
      const [subData, reqData] = await Promise.all([getMySubscription(), getMySubscriptionRequests()]);
      if (!cancelled.value) { setSubscription(subData); setRequests(reqData); }
    } catch (loadError) {
      if (!cancelled.value) {
        setSubscription(null);
        setError(loadError instanceof Error ? loadError.message : "Unable to load subscription details.");
      }
    } finally {
      if (!cancelled.value) setLoading(false);
    }
  }

  useEffect(() => {
    const cancelled = { value: false };
    void loadData(cancelled);
    return () => { cancelled.value = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployerAuthorized]);

  function openCreateModal() {
    setReqPlan(subscription?.planName ?? "STARTER");
    setReqNote("");
    setReqFile(null);
    setReqFileError(null);
    setMessage(null);
    setRequestModal({ type: "NEW" });
  }

  function openEditModal(request: SubscriptionRequest) {
    setReqPlan(request.requestedPlan ?? subscription?.planName ?? "STARTER");
    setReqNote(request.note ?? "");
    setReqFile(null);
    setReqFileError(null);
    setMessage(null);
    setRequestModal({
      type: request.requestType,
      requestId: request.id,
      existingStatementName: request.paymentStatementName,
    });
  }

  function closeModal() {
    setRequestModal(null);
    setReqNote("");
    setReqFile(null);
    setReqFileError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) { setReqFile(null); setReqFileError(null); return; }
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      setReqFile(null);
      setReqFileError("Only PDF, JPG, or PNG files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setReqFile(null);
      setReqFileError("File must be 5 MB or smaller.");
      return;
    }
    setReqFileError(null);
    setReqFile(file);
  }

  async function handleSubmit() {
    if (!requestModal) return;
    if (!reqFile && !requestModal.existingStatementName) { setReqFileError("A payment statement is required."); return; }
    const normalizedType = requestModal.type.toUpperCase() as SubscriptionRequestType;
    const normalizedPlan = reqPlan.trim().toUpperCase();
    try {
      setSubmitting(true);
      setMessage(null);
      if (requestModal.requestId) {
        await updateSubscriptionRequest(requestModal.requestId, normalizedType, normalizedPlan || undefined, reqNote || undefined, reqFile ?? undefined);
      } else {
        await submitSubscriptionRequest(normalizedType, normalizedPlan || undefined, reqNote || undefined, reqFile ?? undefined);
      }
      const updated = await getMySubscriptionRequests();
      setRequests(updated);
      closeModal();
      setMessage({
        type: "success",
        text: requestModal.requestId
          ? "Subscription request updated successfully."
          : requestModal.type === "NEW"
            ? "New subscription request submitted with your payment proof. Admin will review and configure your plan."
          : requestModal.type === "RENEWAL"
            ? "Renewal request submitted with your payment proof. Admin will verify and activate your renewal."
            : "Upgrade request submitted with your payment proof. Admin will verify and contact you.",
      });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to submit request." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRequest(requestId: number) {
    if (!window.confirm("Delete this pending subscription request?")) return;
    try {
      setDeletingId(requestId);
      setMessage(null);
      await deleteSubscriptionRequest(requestId);
      const updated = await getMySubscriptionRequests();
      setRequests(updated);
      setMessage({ type: "success", text: "Subscription request deleted successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete request." });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleOpenStatement(requestId: number) {
    try {
      setOpeningStatementId(requestId);
      await openSubscriptionStatement(requestId);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to open payment statement." });
    } finally {
      setOpeningStatementId(null);
    }
  }

  if (!isEmployerAuthorized) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-amber-100">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">Please sign in as EMPLOYER to access your subscription.</p>
      </div>
    );
  }

  const tier = subscription ? PlanTier({ name: subscription.planName }) : null;
  const selectedPlanDetails = PLAN_DETAILS[(reqPlan || "STARTER").toUpperCase()] ?? PLAN_DETAILS.STARTER;
  const pendingRequest = requests.find((request) => request.status === "PENDING") ?? null;
  const filteredRequests = requests.filter((request) => {
    const statusMatch = requestStatusFilter === "ALL" || request.status === requestStatusFilter;
    const typeMatch = requestTypeFilter === "ALL" || request.requestType === requestTypeFilter;
    return statusMatch && typeMatch;
  });
  const filteredPendingCount = filteredRequests.filter((request) => request.status === "PENDING").length;
  const filteredApprovedCount = filteredRequests.filter((request) => request.status === "APPROVED").length;
  const filteredRejectedCount = filteredRequests.filter((request) => request.status === "REJECTED").length;
  const filteredResolvedCount = filteredApprovedCount + filteredRejectedCount;
  const filteredApprovalRate = filteredResolvedCount > 0 ? Math.round((filteredApprovedCount / filteredResolvedCount) * 100) : 0;
  const totalPendingCount = requests.filter((request) => request.status === "PENDING").length;
  const totalApprovedCount = requests.filter((request) => request.status === "APPROVED").length;
  const totalRejectedCount = requests.filter((request) => request.status === "REJECTED").length;
  const totalResolvedCount = totalApprovedCount + totalRejectedCount;
  const totalApprovalRate = totalResolvedCount > 0 ? Math.round((totalApprovedCount / totalResolvedCount) * 100) : 0;
  const filteredResolvedRequests = filteredRequests.filter((request) => request.resolvedAt);
  const totalResolvedRequests = requests.filter((request) => request.resolvedAt);
  const averageTurnaroundDays = filteredResolvedRequests.length > 0
    ? Math.round(
      (filteredResolvedRequests.reduce((sum, request) => {
        const createdAt = new Date(request.createdAt).getTime();
        const resolvedAt = request.resolvedAt ? new Date(request.resolvedAt).getTime() : createdAt;
        const diffInDays = Math.max((resolvedAt - createdAt) / (1000 * 60 * 60 * 24), 0);
        return sum + diffInDays;
      }, 0) / filteredResolvedRequests.length) * 10
    ) / 10
    : 0;
  const totalAverageTurnaroundDays = totalResolvedRequests.length > 0
    ? Math.round(
      (totalResolvedRequests.reduce((sum, request) => {
        const createdAt = new Date(request.createdAt).getTime();
        const resolvedAt = request.resolvedAt ? new Date(request.resolvedAt).getTime() : createdAt;
        const diffInDays = Math.max((resolvedAt - createdAt) / (1000 * 60 * 60 * 24), 0);
        return sum + diffInDays;
      }, 0) / totalResolvedRequests.length) * 10
    ) / 10
    : 0;

  const buildTrend = (current: number, baseline: number, lowerIsBetter = false) => {
    const delta = Number((current - baseline).toFixed(1));
    if (Math.abs(delta) < 0.1) {
      return {
        icon: <Minus className="h-3 w-3" />,
        className: "text-slate-300/80",
        label: "No change vs all",
      };
    }
    const improved = lowerIsBetter ? delta < 0 : delta > 0;
    return {
      icon: delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />,
      className: improved ? "text-emerald-300" : "text-rose-300",
      label: `${delta > 0 ? "+" : ""}${delta} vs all`,
    };
  };

  const pendingTrend = buildTrend(filteredPendingCount, totalPendingCount, true);
  const approvalTrend = buildTrend(filteredApprovalRate, totalApprovalRate, false);
  const turnaroundTrend = buildTrend(averageTurnaroundDays, totalAverageTurnaroundDays, true);

  const renewalUrgency = subscription
    ? Math.max(subscription.remainingDays, 0) <= 0
      ? { tone: "rose", title: "Plan expired", detail: "Your subscription window has ended. Submit a renewal request with payment proof to restore full access." }
      : Math.max(subscription.remainingDays, 0) <= 7
        ? { tone: "rose", title: "Critical renewal window", detail: `${Math.max(subscription.remainingDays, 0)} day(s) remaining. Renew now to avoid hiring interruptions.` }
        : Math.max(subscription.remainingDays, 0) <= 14
          ? { tone: "amber", title: "Renewal due soon", detail: `${Math.max(subscription.remainingDays, 0)} day(s) left. Start renewal to keep posting uninterrupted.` }
          : Math.max(subscription.remainingDays, 0) <= 30
            ? { tone: "sky", title: "Upcoming renewal", detail: `${Math.max(subscription.remainingDays, 0)} day(s) left. Plan your next billing cycle ahead of time.` }
            : null
    : null;

  return (
    <>
    <div className="space-y-6">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0c1a3a] p-6 shadow-2xl ring-1 ring-white/10 sm:p-8">
        {/* decorative orbs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-cyan-300 ring-1 ring-white/10">
              <BadgeCheck className="h-3.5 w-3.5" />
              Employer Plan
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {subscription ? subscription.planName : "Subscription"}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-slate-400">
              Manage your plan status, quota usage, and billing requests all in one place.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => void navigate("/dashboard?tab=employers")}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              onClick={() => void loadData({ value: false })}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* date strip */}
        {subscription && (
          <div className="relative z-10 mt-5 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
              Started {new Date(subscription.startAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
              Expires {new Date(subscription.endAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span className={Math.max(subscription.remainingDays, 0) <= 7 ? "text-rose-300 font-semibold" : ""}>
                {Math.max(subscription.remainingDays, 0)} days remaining
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ── loading / error / empty ── */}
      {loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading subscription…
        </div>
      )}
      {!loading && error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {!loading && !error && !subscription && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          <AlertCircle className="h-4 w-4 shrink-0" /> No active subscription found. Contact your admin to activate a plan.
        </div>
      )}

      {!loading && subscription && renewalUrgency && (
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm ring-1 ${
          renewalUrgency.tone === "rose"
            ? "border border-rose-500/25 bg-rose-500/12 text-rose-100 ring-rose-500/20"
            : renewalUrgency.tone === "amber"
              ? "border border-amber-500/25 bg-amber-500/12 text-amber-100 ring-amber-500/20"
              : "border border-sky-500/25 bg-sky-500/12 text-sky-100 ring-sky-500/20"
        }`}>
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">{renewalUrgency.title}</p>
              <p className="text-xs opacity-90">{renewalUrgency.detail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            disabled={Boolean(pendingRequest)}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingRequest ? "Pending Request Active" : "Start Renewal Request"}
          </button>
        </div>
      )}

      {!loading && subscription && (
        <>
          {/* ── Status tiles ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Plan */}
            <div className={`flex flex-col gap-3 rounded-2xl bg-gradient-to-br ${tier!.color} p-4 ring-1`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Plan</p>
                {tier!.icon}
              </div>
              <p className={`text-lg font-bold ${tier!.label}`}>{subscription.planName}</p>
            </div>

            {/* Subscription status */}
            <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Subscription</p>
              <p className={`flex items-center gap-2 text-sm font-bold ${statusText(subscription.subscriptionStatus)}`}>
                <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot(subscription.subscriptionStatus)}`} />
                {subscription.subscriptionStatus}
              </p>
            </div>

            {/* Payment status */}
            <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Payment</p>
                <CreditCard className="h-4 w-4 text-slate-500" />
              </div>
              <p className={`flex items-center gap-2 text-sm font-bold ${statusText(subscription.paymentStatus)}`}>
                <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot(subscription.paymentStatus)}`} />
                {subscription.paymentStatus}
              </p>
            </div>

            {/* Posting */}
            <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Job Posting</p>
                <Layers className="h-4 w-4 text-slate-500" />
              </div>
              <p className={`text-sm font-bold ${subscription.postingAllowed ? "text-emerald-300" : "text-rose-300"}`}>
                {subscription.postingAllowed ? "Allowed" : "Blocked"}
              </p>
              <QuotaBar
                used={subscription.activeJobs}
                limit={subscription.maxActiveJobs}
                color="bg-cyan-400"
              />
            </div>
          </div>

          {/* ── Quota cards ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Eye className="h-4 w-4 text-sky-400" />
                  Resume Views
                </div>
                <span className="rounded-lg bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
                  {subscription.monthlyResumeViewsUsed}/{subscription.maxResumeViewsPerMonth > 0 ? subscription.maxResumeViewsPerMonth : "∞"}
                </span>
              </div>
              <QuotaBar
                used={subscription.monthlyResumeViewsUsed}
                limit={subscription.maxResumeViewsPerMonth}
                color="bg-sky-400"
              />
            </div>

            <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <FileDown className="h-4 w-4 text-violet-400" />
                  Resume Downloads
                </div>
                <span className="rounded-lg bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-300">
                  {subscription.monthlyResumeDownloadsUsed}/{subscription.maxResumeDownloadsPerMonth > 0 ? subscription.maxResumeDownloadsPerMonth : "∞"}
                </span>
              </div>
              <QuotaBar
                used={subscription.monthlyResumeDownloadsUsed}
                limit={subscription.maxResumeDownloadsPerMonth}
                color="bg-violet-400"
              />
            </div>
          </div>

          {/* ── Blocked warning ── */}
          {!subscription.postingAllowed && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-3.5 text-sm text-amber-100">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              Posting is currently blocked. Renew your payment or contact admin to restore access.
            </div>
          )}

          {/* ── Action buttons ── */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => openCreateModal()}
              disabled={Boolean(pendingRequest)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {pendingRequest ? "Pending Request In Progress" : "New Subscription Request"}
            </button>
            {pendingRequest && (
              <span className="text-xs text-amber-300">
                Request #{pendingRequest.id} is pending. Edit or delete it from history before creating another.
              </span>
            )}
          </div>

          {/* ── Feedback message ── */}
          {message && (
            <div className={`flex items-start gap-3 rounded-2xl px-5 py-3.5 text-sm ${
              message.type === "error"
                ? "border border-rose-500/20 bg-rose-500/10 text-rose-200"
                : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
            }`}>
              {message.type === "error"
                ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
              {message.text}
            </div>
          )}
        </>
      )}

      {/* ── Request history ── */}
      {requests.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-sm font-semibold text-white">Request History</p>
            <p className="mt-0.5 text-xs text-slate-400">Your past renewal and upgrade requests.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs">
                <p className="text-amber-200/80">Pending</p>
                <p className="mt-0.5 text-base font-bold text-amber-100">{filteredPendingCount}</p>
                <p className={`mt-1 inline-flex items-center gap-1 text-[11px] ${pendingTrend.className}`}>
                  {pendingTrend.icon}
                  {pendingTrend.label}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs">
                <p className="text-emerald-200/80">Approval Rate</p>
                <p className="mt-0.5 text-base font-bold text-emerald-100">{filteredApprovalRate}%</p>
                <p className={`mt-1 inline-flex items-center gap-1 text-[11px] ${approvalTrend.className}`}>
                  {approvalTrend.icon}
                  {approvalTrend.label}
                </p>
              </div>
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs">
                <p className="text-cyan-200/80">Avg Turnaround</p>
                <p className="mt-0.5 text-base font-bold text-cyan-100">{averageTurnaroundDays} day{averageTurnaroundDays === 1 ? "" : "s"}</p>
                <p className={`mt-1 inline-flex items-center gap-1 text-[11px] ${turnaroundTrend.className}`}>
                  {turnaroundTrend.icon}
                  {turnaroundTrend.label}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setRequestStatusFilter(status)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                    requestStatusFilter === status
                      ? "border-cyan-400/45 bg-cyan-500/18 text-cyan-200"
                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                  }`}
                >
                  {status}
                </button>
              ))}
              {(["ALL", "NEW", "RENEWAL", "UPGRADE"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRequestTypeFilter(type as "ALL" | SubscriptionRequestType)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                    requestTypeFilter === type
                      ? "border-emerald-400/45 bg-emerald-500/18 text-emerald-200"
                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {filteredRequests.map((req) => (
              <div key={req.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2.5">
                  <ReqBadge status={req.status} />
                  <span className="rounded-lg bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                    {req.requestType}
                  </span>
                  {req.requestedPlan && (
                    <span className="rounded-lg bg-emerald-500/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-200 ring-1 ring-emerald-500/25">
                      Plan: {req.requestedPlan}
                    </span>
                  )}
                  {req.hasPaymentStatement ? (
                    <button
                      type="button"
                      onClick={() => void handleOpenStatement(req.id)}
                      disabled={openingStatementId === req.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300 ring-1 ring-cyan-500/30 hover:bg-cyan-500/25 transition disabled:opacity-60"
                    >
                      <Paperclip className="h-3 w-3" />
                      {openingStatementId === req.id ? "Opening..." : (req.paymentStatementName ?? "View Statement")}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 px-2.5 py-0.5 text-[11px] text-rose-300/70 ring-1 ring-rose-500/20">
                      <FileText className="h-3 w-3" />
                      No statement
                    </span>
                  )}
                  {req.note && <span className="text-xs text-slate-500 italic">"{req.note}"</span>}
                  {req.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(req)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/[0.06] px-2 py-1 text-[11px] font-semibold text-slate-200 transition hover:bg-white/[0.12]"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === req.id}
                        onClick={() => void handleDeleteRequest(req.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-500/12 px-2 py-1 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        {deletingId === req.id ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </div>
                <div className="flex flex-col items-start gap-0.5 text-right sm:items-end">
                  <span className="text-[11px] text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                  {req.adminNote && (
                    <span className="text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Admin:</span> {req.adminNote}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {filteredRequests.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                No requests match the current filters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* ── Request Modal ── */}
    {requestModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div className="w-full max-w-lg rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0c1a3a] shadow-2xl ring-1 ring-white/15">
          {/* header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-3">
              {requestModal.type === "UPGRADE"
                ? <ArrowUpRight className="h-5 w-5 text-cyan-400" />
                : <RefreshCw className="h-5 w-5 text-slate-300" />}
              <span className="text-base font-bold text-white">
                {requestModal.requestId
                  ? requestModal.type === "UPGRADE"
                    ? "Edit Upgrade Request"
                    : requestModal.type === "RENEWAL"
                      ? "Edit Renewal Request"
                      : "Edit New Subscription Request"
                  : requestModal.type === "UPGRADE"
                    ? "Request Plan Upgrade"
                    : requestModal.type === "RENEWAL"
                      ? "Request Plan Renewal"
                      : "Request New Subscription"}
              </span>
            </div>
            <button onClick={closeModal} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* body */}
          <div className="space-y-5 px-6 py-5">

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Request Type</label>
              <select
                value={requestModal.type}
                onChange={(e) => setRequestModal((prev) => (prev ? { ...prev, type: e.target.value as SubscriptionRequestType } : prev))}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              >
                <option className="bg-slate-900" value="NEW">New</option>
                <option className="bg-slate-900" value="RENEWAL">Renewal</option>
                <option className="bg-slate-900" value="UPGRADE">Upgrade</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Plan</label>
              <select
                value={reqPlan}
                onChange={(e) => setReqPlan(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              >
                <option className="bg-slate-900" value="STARTER">STARTER</option>
                <option className="bg-slate-900" value="GROWTH">GROWTH</option>
                <option className="bg-slate-900" value="PRO">PRO</option>
                <option className="bg-slate-900" value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4 ring-1 ring-emerald-500/15">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-200">Plan Details</p>
              <p className="mt-1 text-xs text-emerald-100/90">{selectedPlanDetails.summary}</p>
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-lg bg-black/20 px-3 py-2">
                  <span className="text-emerald-200/70">Active Jobs</span>
                  <p className="font-semibold text-white">{selectedPlanDetails.maxActiveJobs}</p>
                </div>
                <div className="rounded-lg bg-black/20 px-3 py-2">
                  <span className="text-emerald-200/70">Resume Views / Month</span>
                  <p className="font-semibold text-white">{selectedPlanDetails.maxResumeViewsPerMonth}</p>
                </div>
                <div className="rounded-lg bg-black/20 px-3 py-2">
                  <span className="text-emerald-200/70">Downloads / Month</span>
                  <p className="font-semibold text-white">{selectedPlanDetails.maxResumeDownloadsPerMonth}</p>
                </div>
              </div>
            </div>

            {/* current plan summary */}
            {subscription && (
              <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10 space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Current Subscription</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">Plan</span>
                    <p className="font-semibold text-white">{subscription.planName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Status</span>
                    <p className={`font-semibold ${statusText(subscription.subscriptionStatus)}`}>{subscription.subscriptionStatus}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Expires</span>
                    <p className="font-semibold text-white">{new Date(subscription.endAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Days Remaining</span>
                    <p className={`font-semibold ${subscription.remainingDays <= 7 ? "text-rose-300" : "text-white"}`}>
                      {Math.max(subscription.remainingDays, 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Note <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={reqNote}
                onChange={(e) => setReqNote(e.target.value)}
                placeholder={requestModal.type === "UPGRADE" ? "Describe which plan you want to upgrade to…" : "Add any notes for the admin…"}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
              />
            </div>

            {/* file upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Payment Statement <span className="text-rose-400">*</span>
                <span className="ml-1.5 text-slate-500 font-normal">(PDF, JPG, or PNG · max 5 MB)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />
              {reqFile ? (
                <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Paperclip className="h-4 w-4 shrink-0 text-cyan-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-cyan-200">{reqFile.name}</p>
                      <p className="text-[11px] text-slate-400">{(reqFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setReqFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="ml-3 shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {requestModal.existingStatementName && (
                    <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/8 px-4 py-2 text-xs text-cyan-200">
                      <Paperclip className="h-3.5 w-3.5" />
                      Current statement: {requestModal.existingStatementName}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-4 text-sm text-slate-400 transition hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:text-slate-300"
                  >
                    <Upload className="h-4 w-4 shrink-0 text-slate-500" />
                    <span>{requestModal.existingStatementName ? "Replace payment proof" : "Click to attach payment proof"}</span>
                  </button>
                </div>
              )}
              {reqFileError && (
                <p className="flex items-center gap-1.5 text-xs text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />{reqFileError}
                </p>
              )}
            </div>

            {/* error from submission */}
            {message?.type === "error" && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />{message.text}
              </div>
            )}
          </div>

          {/* footer */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
            <button
              onClick={closeModal}
              disabled={submitting}
              className="rounded-xl border border-white/10 px-5 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50 ${
                requestModal.type === "UPGRADE"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/20 hover:opacity-90"
                  : requestModal.type === "NEW"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20 hover:opacity-90"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {submitting
                ? <><RefreshCw className="h-4 w-4 animate-spin" />Submitting…</>
                : <><ShieldCheck className="h-4 w-4" />{requestModal.requestId ? "Update" : "Submit"} {requestModal.type === "UPGRADE" ? "Upgrade" : requestModal.type === "RENEWAL" ? "Renewal" : "New"} Request</>}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
