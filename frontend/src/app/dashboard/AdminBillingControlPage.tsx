import { Badge, Loader, Select, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Layers,
  Save,
  Trash2,
} from "lucide-react";
import AdminBillingSuiteTabs from "./AdminBillingSuiteTabs";
import {
  deleteEmployerSubscription,
  getEmployerSubscription,
  resetEmployerSubscriptionUsage,
  upsertEmployerSubscription,
  type AdminOverview,
  type EmployerSubscription,
  type PaymentStatus,
  type SubscriptionStatus,
  type UpsertEmployerSubscriptionPayload,
} from "../services/admin-service";

const PLAN_OPTIONS = ["STARTER", "GROWTH", "PRO", "ENTERPRISE"];
const DURATION_OPTIONS = [30, 60, 90, 180, 365];
const MAX_ACTIVE_JOB_OPTIONS = [5, 10, 20, 50, 100];
const MAX_RESUME_VIEW_OPTIONS = [20, 50, 100, 250, 500, 1000, 5000];
const MAX_RESUME_DOWNLOAD_OPTIONS = [10, 25, 50, 100, 250, 500, 2500];

function getPlanOptions(current: string): string[] {
  if (PLAN_OPTIONS.includes(current)) return PLAN_OPTIONS;
  return [current, ...PLAN_OPTIONS];
}

function FieldLabel({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="mb-1 flex items-center gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">{label}</span>
      <Tooltip
        label={<span className="text-xs leading-relaxed">{hint}</span>}
        withArrow
        multiline
        w={220}
        color="#0b1220"
        c="#dbeafe"
        openDelay={120}
        transitionProps={{ transition: "fade", duration: 150 }}
      >
        <button
          type="button"
          aria-label={`${label} info`}
          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-400/70 text-[9px] font-bold text-slate-200 transition-colors hover:border-cyan-300 hover:text-cyan-200"
        >
          i
        </button>
      </Tooltip>
    </div>
  );
}

function statusColor(status: string) {
  if (status === "ACTIVE" || status === "PAID") return "text-emerald-300";
  if (status === "PENDING") return "text-amber-300";
  return "text-rose-300";
}

function formatUsagePeriod(value?: string | null) {
  if (!value) return "Current month";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getQuotaHealth(used?: number | null, limit?: number | null) {
  const normalizedUsed = used ?? 0;
  const normalizedLimit = limit ?? 0;
  if (normalizedLimit <= 0) {
    if (normalizedUsed > 0) {
      return {
        valueClass: "text-rose-300",
        badgeClass: "border-rose-400/35 bg-rose-500/10 text-rose-200",
        statusText: "Unconfigured overuse",
      };
    }
    return {
      valueClass: "text-slate-200",
      badgeClass: "border-slate-400/30 bg-slate-400/10 text-slate-200",
      statusText: "Not set",
    };
  }

  const ratio = normalizedUsed / normalizedLimit;
  if (ratio >= 1) {
    return {
      valueClass: "text-rose-300",
      badgeClass: "border-rose-400/35 bg-rose-500/10 text-rose-200",
      statusText: "Limit reached",
    };
  }
  if (ratio >= 0.8) {
    return {
      valueClass: "text-amber-300",
      badgeClass: "border-amber-400/35 bg-amber-500/10 text-amber-200",
      statusText: "Near limit",
    };
  }
  return {
    valueClass: "text-emerald-300",
    badgeClass: "border-emerald-400/35 bg-emerald-500/10 text-emerald-200",
    statusText: "Healthy",
  };
}

function DetailRow({ label, value, valueClass = "text-white" }: { label: string; value: ReactNode; valueClass?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

export default function AdminBillingControlPage({
  overview,
  loading,
  error,
}: {
  overview: AdminOverview | null;
  loading: boolean;
  error: string | null;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const employerIdParam = Number(searchParams.get("employerId") || "");
  const employers = overview?.employers ?? [];
  const selectedEmployer = useMemo(
    () => employers.find((employer) => employer.employerId === employerIdParam) ?? employers[0] ?? null,
    [employers, employerIdParam],
  );

  const [subscription, setSubscription] = useState<EmployerSubscription | null>(null);
  const [loadingRead, setLoadingRead] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [form, setForm] = useState<UpsertEmployerSubscriptionPayload>({
    planName: "STARTER",
    subscriptionStatus: "PENDING",
    paymentStatus: "PENDING",
    durationDays: 30,
    maxActiveJobs: 5,
    maxResumeViewsPerMonth: 100,
    maxResumeDownloadsPerMonth: 50,
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [resettingUsage, setResettingUsage] = useState(false);

  useEffect(() => {
    if (!selectedEmployer) {
      return;
    }
    if (String(selectedEmployer.employerId) !== searchParams.get("employerId")) {
      setSearchParams({ tab: "admin", section: "billing-control", employerId: String(selectedEmployer.employerId) }, { replace: true });
    }
  }, [selectedEmployer, searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedEmployer) {
      setSubscription(null);
      return;
    }

    setSubscription(null);
    setReadError(null);
    setSaveMessage(null);
    setConfirmDelete(false);
    setDeleteError(null);

    const currentPlan =
      selectedEmployer.subscriptionPlan && selectedEmployer.subscriptionPlan !== "Not Configured"
        ? selectedEmployer.subscriptionPlan
        : "STARTER";
    const isActive = selectedEmployer.subscriptionStatus.toUpperCase() === "ACTIVE";

    setForm({
      planName: currentPlan,
      subscriptionStatus: isActive ? "ACTIVE" : "PENDING",
      paymentStatus: isActive ? "PAID" : "PENDING",
      durationDays: 30,
      maxActiveJobs: 5,
      maxResumeViewsPerMonth: 100,
      maxResumeDownloadsPerMonth: 50,
    });

    let cancelled = false;
    setLoadingRead(true);
    getEmployerSubscription(selectedEmployer.employerId)
      .then((data) => {
        if (cancelled) return;
        setSubscription(data);
        setForm({
          planName: data.planName,
          subscriptionStatus: data.subscriptionStatus,
          paymentStatus: data.paymentStatus,
          durationDays: 30,
          maxActiveJobs: data.maxActiveJobs ?? 5,
          maxResumeViewsPerMonth: data.maxResumeViewsPerMonth ?? 100,
          maxResumeDownloadsPerMonth: data.maxResumeDownloadsPerMonth ?? 50,
        });
      })
      .catch(() => {
        if (!cancelled) setReadError(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingRead(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedEmployer]);

  function patch(partial: Partial<UpsertEmployerSubscriptionPayload>) {
    setForm((prev) => ({ ...prev, ...partial }));
    setSaveMessage(null);
  }

  async function handleSave() {
    if (!selectedEmployer) return;
    try {
      setSaving(true);
      setSaveMessage(null);
      const updated = await upsertEmployerSubscription(selectedEmployer.employerId, form);
      setSubscription(updated);
      setSaveMessage({ type: "ok", text: "Subscription saved successfully." });
      notifications.show({ color: "green", title: "Subscription saved", message: `${selectedEmployer.companyName} billing settings were updated successfully.` });
    } catch (err) {
      notifications.show({ color: "red", title: "Save failed", message: err instanceof Error ? err.message : "Failed to save subscription." });
      setSaveMessage({ type: "err", text: err instanceof Error ? err.message : "Failed to save subscription." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedEmployer) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteEmployerSubscription(selectedEmployer.employerId);
      notifications.show({ color: "orange", title: "Subscription deleted", message: `${selectedEmployer.companyName} subscription record was removed.` });
      onAfterDelete(selectedEmployer.employerId);
    } catch (err) {
      notifications.show({ color: "red", title: "Delete failed", message: err instanceof Error ? err.message : "Failed to delete subscription." });
      setDeleteError(err instanceof Error ? err.message : "Failed to delete subscription.");
    } finally {
      setDeleting(false);
    }
  }

  function onAfterDelete(employerId: number) {
    const nextEmployer = employers.find((employer) => employer.employerId !== employerId) ?? null;
    if (nextEmployer) {
      setSearchParams({ tab: "admin", section: "billing-control", employerId: String(nextEmployer.employerId) }, { replace: true });
    } else {
      setSubscription(null);
    }
  }

  async function handleResetUsage() {
    if (!selectedEmployer) return;
    try {
      setResettingUsage(true);
      setSaveMessage(null);
      const updated = await resetEmployerSubscriptionUsage(selectedEmployer.employerId);
      setSubscription(updated);
      notifications.show({ color: "cyan", title: "Usage reset", message: `${selectedEmployer.companyName} monthly resume usage counters were reset.` });
      setSaveMessage({ type: "ok", text: "Monthly resume usage counters reset." });
    } catch (err) {
      notifications.show({ color: "red", title: "Reset failed", message: err instanceof Error ? err.message : "Failed to reset usage counters." });
      setSaveMessage({ type: "err", text: err instanceof Error ? err.message : "Failed to reset usage counters." });
    } finally {
      setResettingUsage(false);
    }
  }

  const selectClass = "w-full rounded-lg border border-white/20 bg-slate-900/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400/60 transition-colors";
  const viewHealth = getQuotaHealth(subscription?.monthlyResumeViewsUsed, subscription?.maxResumeViewsPerMonth);
  const downloadHealth = getQuotaHealth(subscription?.monthlyResumeDownloadsUsed, subscription?.maxResumeDownloadsPerMonth);

  if (loading) {
    return <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]"><Loader color="orange" /></div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>;
  }

  if (!overview || employers.length === 0) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">No employers available for billing control.</div>;
  }

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.24),transparent_45%),radial-gradient(circle_at_84%_12%,rgba(192,132,252,0.18),transparent_42%),linear-gradient(120deg,#0d172c_0%,#122746_48%,#171738_100%)] p-6 shadow-[0_28px_60px_rgba(14,116,144,0.22)]">
        <div className="absolute -left-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/15 blur-2xl" />
        <div className="absolute -bottom-16 right-4 h-36 w-36 rounded-full bg-fuchsia-400/15 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/90">Admin Billing View</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Billing Control</h2>
            <p className="mt-3 max-w-3xl text-sm text-slate-200/85">Manage a single employer subscription with full billing, quota, and usage controls.</p>
          </div>
          <Badge variant="light" color="cyan" className="!rounded-full !border !border-cyan-300/30 !bg-cyan-400/15 !px-3 !py-1 !text-[11px] !font-bold !tracking-[0.08em]">Direct Admin Control</Badge>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
          <AdminBillingSuiteTabs activeSection="billing-control" onSelect={(section) => navigate(`/dashboard?tab=admin&section=${section}`)} />
          <div className="w-full max-w-sm">
            <Select
              value={selectedEmployer ? String(selectedEmployer.employerId) : null}
              onChange={(value) => {
                if (!value) return;
                navigate(`/dashboard?tab=admin&section=billing-control&employerId=${value}`);
              }}
              label="Employer"
              data={employers.map((employer) => ({ value: String(employer.employerId), label: employer.companyName || employer.email || `Employer ${employer.employerId}` }))}
              classNames={{
                input: "!border-white/10 !bg-white/5 !text-white",
                dropdown: "!border-white/10 !bg-[#0f172a] !text-white",
                option: "!text-white",
                label: "!mb-1 !text-xs !font-semibold !uppercase !tracking-[0.12em] !text-slate-300",
              }}
              allowDeselect={false}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-5 shadow-[0_18px_44px_rgba(2,6,23,0.45)]">
        <div className="space-y-5 pb-2 pt-1">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">Current Subscription</p>
            {subscription && <p className="mb-3 text-xs text-slate-400">Usage Period: <span className="font-medium text-cyan-200">{formatUsagePeriod(subscription.usageWindowStartAt)}</span></p>}
            {loadingRead && <p className="text-xs text-slate-400">Loading subscription details…</p>}
            {!loadingRead && !subscription && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">No subscription configured yet. Use the form below to create one.</div>}
            {!loadingRead && subscription && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <DetailRow label="Plan" value={<span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-cyan-300" />{subscription.planName}</span>} />
                <DetailRow label="Sub Status" value={<span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />{subscription.subscriptionStatus}</span>} valueClass={statusColor(subscription.subscriptionStatus)} />
                <DetailRow label="Payment" value={<span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />{subscription.paymentStatus}</span>} valueClass={statusColor(subscription.paymentStatus)} />
                <DetailRow label="Remaining" value={<span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-cyan-300" />{Math.max(subscription.remainingDays, 0)}d</span>} />
                <DetailRow label="Active Jobs" value={`${subscription.activeJobs} / ${subscription.maxActiveJobs > 0 ? subscription.maxActiveJobs : "∞"}`} />
                <DetailRow label="Posting" value={subscription.postingAllowed ? "Allowed" : "Blocked"} valueClass={subscription.postingAllowed ? "text-emerald-300" : "text-rose-300"} />
                <DetailRow label="Resume Views" value={<span className="space-y-1"><span className="block">{subscription.monthlyResumeViewsUsed} / {subscription.maxResumeViewsPerMonth}</span><span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${viewHealth.badgeClass}`}>{viewHealth.statusText}</span></span>} valueClass={viewHealth.valueClass} />
                <DetailRow label="Downloads" value={<span className="space-y-1"><span className="block">{subscription.monthlyResumeDownloadsUsed} / {subscription.maxResumeDownloadsPerMonth}</span><span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${downloadHealth.badgeClass}`}>{downloadHealth.statusText}</span></span>} valueClass={downloadHealth.valueClass} />
              </div>
            )}
          </div>

          <div className="h-px bg-white/10" />

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">{subscription ? "Update Subscription" : "Create Subscription"}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel label="Plan" hint="Subscription plan tier determines posting limits" />
                <select value={form.planName} onChange={(e) => patch({ planName: e.target.value })} className={selectClass}>{getPlanOptions(form.planName).map((p) => <option key={p} value={p}>{p}</option>)}</select>
              </div>
              <div>
                <FieldLabel label="Subscription" hint="Lifecycle status of the subscription" />
                <select value={form.subscriptionStatus} onChange={(e) => patch({ subscriptionStatus: e.target.value as SubscriptionStatus })} className={selectClass}>{(["ACTIVE", "PENDING", "EXPIRED", "CANCELED", "PAST_DUE"] as SubscriptionStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <div>
                <FieldLabel label="Payment" hint="Whether payment has been collected" />
                <select value={form.paymentStatus} onChange={(e) => patch({ paymentStatus: e.target.value as PaymentStatus })} className={selectClass}>{(["PAID", "PENDING", "FAILED", "REFUNDED"] as PaymentStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <div>
                <FieldLabel label="Duration (days)" hint="Subscription period starting from today" />
                <select value={form.durationDays} onChange={(e) => patch({ durationDays: Number(e.target.value) })} className={selectClass}>{DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}</select>
              </div>
              <div>
                <FieldLabel label="Max Active Jobs" hint="Maximum simultaneous active job postings" />
                <select value={form.maxActiveJobs} onChange={(e) => patch({ maxActiveJobs: Number(e.target.value) })} className={selectClass}>{MAX_ACTIVE_JOB_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}</select>
              </div>
              <div>
                <FieldLabel label="Resume Views / Month" hint="Maximum monthly resume views for this employer" />
                <select value={form.maxResumeViewsPerMonth} onChange={(e) => patch({ maxResumeViewsPerMonth: Number(e.target.value) })} className={selectClass}>{MAX_RESUME_VIEW_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}</select>
              </div>
              <div>
                <FieldLabel label="Downloads / Month" hint="Maximum monthly resume downloads for this employer" />
                <select value={form.maxResumeDownloadsPerMonth} onChange={(e) => patch({ maxResumeDownloadsPerMonth: Number(e.target.value) })} className={selectClass}>{MAX_RESUME_DOWNLOAD_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}</select>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button type="button" disabled={saving} onClick={() => void handleSave()} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-amber-400 disabled:opacity-50"><Save className="h-3.5 w-3.5" />{saving ? "Saving…" : subscription ? "Update Plan" : "Create Plan"}</button>
              {saveMessage && <span className={`text-xs font-medium ${saveMessage.type === "ok" ? "text-emerald-300" : "text-rose-300"}`}>{saveMessage.text}</span>}
            </div>
          </div>

          {subscription && (
            <>
              <div className="h-px bg-white/10" />
              <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Usage Controls</p>
                <p className="mb-3 text-xs text-slate-400">Active Period: <span className="font-medium text-cyan-200">{formatUsagePeriod(subscription.usageWindowStartAt)}</span></p>
                <button type="button" disabled={resettingUsage} onClick={() => void handleResetUsage()} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/20 disabled:opacity-60">{resettingUsage ? "Resetting..." : "Reset Monthly Resume Usage"}</button>
              </div>
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-300/80"><AlertTriangle className="h-3.5 w-3.5" />Danger Zone</p>
                {!confirmDelete ? (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-700/20 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-700/40"><Trash2 className="h-3.5 w-3.5" />Delete Subscription</button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-rose-200">This will permanently remove the subscription for <strong>{selectedEmployer?.companyName}</strong>. The employer will lose posting access immediately. Are you sure?</p>
                    <div className="flex gap-2">
                      <button type="button" disabled={deleting} onClick={() => void handleDelete()} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />{deleting ? "Deleting…" : "Yes, Delete"}</button>
                      <button type="button" onClick={() => { setConfirmDelete(false); setDeleteError(null); }} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-300 hover:border-white/40">Cancel</button>
                    </div>
                    {deleteError && <p className="text-xs text-rose-300">{deleteError}</p>}
                  </div>
                )}
              </div>
            </>
          )}
          {readError && <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">{readError}</div>}
        </div>
      </div>
    </section>
  );
}
