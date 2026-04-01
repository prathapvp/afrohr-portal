import { useEffect, useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, Clock, CreditCard, Layers, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { getMySubscription, getMySubscriptionRequests, submitSubscriptionRequest } from "../../services/subscription-service";
import type { EmployerSubscription, SubscriptionRequest } from "../../services/admin-service";

function statusTone(status: string): string {
  if (status === "ACTIVE" || status === "PAID") {
    return "text-emerald-300";
  }
  if (status === "PENDING") {
    return "text-amber-300";
  }
  return "text-rose-300";
}

function requestStatusBadge(status: string) {
  if (status === "APPROVED") return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
  if (status === "REJECTED") return "bg-rose-500/20 text-rose-300 border border-rose-500/30";
  return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
}

function requestStatusIcon(status: string) {
  if (status === "APPROVED") return <ThumbsUp className="h-3 w-3" />;
  if (status === "REJECTED") return <ThumbsDown className="h-3 w-3" />;
  return <Clock className="h-3 w-3" />;
}

export default function EmployerSubscriptionPage() {
  const [subscription, setSubscription] = useState<EmployerSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const accountType = (localStorage.getItem("accountType") ?? "").toUpperCase();
  const token = localStorage.getItem("token");
  const isEmployerAuthorized = Boolean(token) && accountType === "EMPLOYER";

  async function loadData(cancelled: { value: boolean }) {
    if (!isEmployerAuthorized) return;
    try {
      setLoading(true);
      setError(null);
      const [subData, reqData] = await Promise.all([
        getMySubscription(),
        getMySubscriptionRequests(),
      ]);
      if (!cancelled.value) {
        setSubscription(subData);
        setRequests(reqData);
      }
    } catch (loadError) {
      if (!cancelled.value) {
        const nextError = loadError instanceof Error ? loadError.message : "Unable to load subscription details.";
        setSubscription(null);
        setError(nextError);
      }
    } finally {
      if (!cancelled.value) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const cancelled = { value: false };
    void loadData(cancelled);
    return () => {
      cancelled.value = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployerAuthorized]);

  async function handleRequest(type: "RENEWAL" | "UPGRADE") {
    try {
      setSubmitting(true);
      setMessage(null);
      await submitSubscriptionRequest(type);
      const updated = await getMySubscriptionRequests();
      setRequests(updated);
      setMessageType("success");
      setMessage(
        type === "RENEWAL"
          ? "Renewal request submitted. Admin will verify and activate your renewal."
          : "Upgrade request submitted. Admin will contact you with plan and payment details.",
      );
    } catch (err) {
      setMessageType("error");
      const msg = err instanceof Error ? err.message : "Failed to submit request.";
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isEmployerAuthorized) {
    return (
      <Card className="border border-amber-400/30 bg-amber-500/10 text-amber-100 shadow-lg">
        <CardContent className="p-5">
          <p className="text-sm font-medium">Please sign in as EMPLOYER to access your subscription page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-r from-cyan-800/60 via-blue-800/50 to-indigo-900/60 text-white shadow-xl ring-1 ring-cyan-400/20">
        <CardContent className="p-6 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200">Employer</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Subscription</h1>
          <p className="mt-2 max-w-2xl text-sm text-cyan-100/90 sm:text-base">
            Manage your current subscription status, payment state, and posting limits in one place.
          </p>
        </CardContent>
      </Card>

      <Card className="border border-white/10 bg-white/[0.04] shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-white">Current Plan</CardTitle>
            <CardDescription className="text-slate-300">Latest status synced from your employer account.</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/10"
            onClick={() => void loadData({ value: false })}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-3">
          {loading && <p className="text-sm text-slate-300">Loading subscription details...</p>}

          {!loading && error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>
          )}

          {!loading && !error && !subscription && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              No active subscription found. Contact admin to activate a plan.
            </div>
          )}

          {!loading && subscription && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Plan</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                    <Layers className="h-4 w-4 text-cyan-300" />
                    {subscription.planName}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Subscription Status</p>
                  <p className={`mt-1 flex items-center gap-2 text-sm font-semibold ${statusTone(subscription.subscriptionStatus)}`}>
                    <CheckCircle2 className="h-4 w-4" />
                    {subscription.subscriptionStatus}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Payment Status</p>
                  <p className={`mt-1 flex items-center gap-2 text-sm font-semibold ${statusTone(subscription.paymentStatus)}`}>
                    <CreditCard className="h-4 w-4" />
                    {subscription.paymentStatus}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Remaining Days</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                    <CalendarClock className="h-4 w-4 text-cyan-300" />
                    {Math.max(subscription.remainingDays, 0)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Posting Usage</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {subscription.activeJobs}/{subscription.maxActiveJobs > 0 ? subscription.maxActiveJobs : "Unlimited"} active jobs
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Posting Permission</p>
                  <p className={`mt-1 text-sm font-semibold ${subscription.postingAllowed ? "text-emerald-300" : "text-rose-300"}`}>
                    {subscription.postingAllowed ? "Allowed" : "Blocked"}
                  </p>
                </div>
              </div>

              {!subscription.postingAllowed && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                  <span className="inline-flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Posting is currently blocked for your account. Renew payment or contact admin.
                  </span>
                </div>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/10 disabled:opacity-50"
              disabled={submitting}
              onClick={() => void handleRequest("RENEWAL")}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${submitting ? "animate-spin" : ""}`} />
              Request Renewal
            </Button>
            <Button
              size="sm"
              className="bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50"
              disabled={submitting}
              onClick={() => void handleRequest("UPGRADE")}
            >
              Request Upgrade
            </Button>
          </div>

          {message && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                messageType === "error"
                  ? "border border-rose-500/30 bg-rose-500/10 text-rose-200"
                  : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-100"
              }`}
            >
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      {requests.length > 0 && (
        <Card className="border border-white/10 bg-white/[0.04] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Request History</CardTitle>
            <CardDescription className="text-slate-300">Your past renewal and upgrade requests.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${requestStatusBadge(req.status)}`}>
                      {requestStatusIcon(req.status)}
                      {req.status}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">{req.requestType}</span>
                    {req.note && <span className="text-xs text-slate-400">"{req.note}"</span>}
                  </div>
                  <div className="flex flex-col items-start gap-0.5 sm:items-end">
                    <span className="text-[10px] text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                    {req.adminNote && <span className="text-[11px] text-slate-400">Admin: {req.adminNote}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
