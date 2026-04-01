import { Badge, Loader, Table } from "@mantine/core";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Briefcase, Building2, CheckCircle2, ExternalLink, FileText, GraduationCap, Layers, Sparkles, ThumbsDown, ThumbsUp, Users, XCircle } from "lucide-react";
import {
  getAllSubscriptionRequests,
  resolveSubscriptionRequest,
  type AdminEmployerSummary,
  type AdminOverview,
  type EmployerSubscription,
  type SubscriptionRequest,
} from "../services/admin-service";
import BillingControlModal from "./BillingControlModal";

type StatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  subtitle: string;
  accentClass: string;
};

function StatCard({ label, value, icon: Icon, subtitle, accentClass }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#111b32]/85 via-[#0f1a2f]/75 to-[#111827]/85 p-4 shadow-[0_14px_40px_rgba(2,8,23,0.45)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_20px_50px_rgba(8,145,178,0.22)]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className={`h-1.5 w-16 rounded-full ${accentClass}`} />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-cyan-200 transition-colors group-hover:border-cyan-300/40 group-hover:bg-cyan-500/10">
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
    </div>
  );
}

export default function AdminDashboardView({
  overview,
  loading,
  error,
}: {
  overview: AdminOverview | null;
  loading: boolean;
  error: string | null;
}) {
  const [subRequests, setSubRequests] = useState<SubscriptionRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqResolving, setReqResolving] = useState<Record<number, boolean>>({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState<AdminEmployerSummary | null>(null);
  const [employerPlans, setEmployerPlans] = useState<Record<number, string>>({});

  function openModal(employer: AdminEmployerSummary) {
    setSelectedEmployer(employer);
    setModalOpen(true);
  }

  function handleModalSaved(updated: EmployerSubscription) {
    setEmployerPlans((prev) => ({ ...prev, [updated.employerId]: updated.planName }));
  }

  function handleModalDeleted(employerId: number) {
    setEmployerPlans((prev) => {
      const next = { ...prev };
      delete next[employerId];
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;
    setReqLoading(true);
    getAllSubscriptionRequests()
      .then((data) => { if (!cancelled) setSubRequests(data); })
      .catch(() => { /* non-blocking */ })
      .finally(() => { if (!cancelled) setReqLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleResolve(requestId: number, resolution: "APPROVED" | "REJECTED") {
    try {
      setReqResolving((prev) => ({ ...prev, [requestId]: true }));
      const updated = await resolveSubscriptionRequest(requestId, resolution);
      setSubRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch { /* silent */ } finally {
      setReqResolving((prev) => ({ ...prev, [requestId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <Loader color="orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">
        {error}
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
        No admin overview data available.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <BillingControlModal
        opened={modalOpen}
        employer={selectedEmployer}
        onClose={() => setModalOpen(false)}
        onSaved={handleModalSaved}
        onDeleted={handleModalDeleted}
      />
      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-[#0f172a] via-[#0b2342] to-[#1f1b3b] p-5 shadow-[0_18px_50px_rgba(14,116,144,0.24)]">
        <div className="absolute -left-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/10 blur-2xl" />
        <div className="absolute -bottom-16 right-4 h-36 w-36 rounded-full bg-fuchsia-400/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/90">Admin Control Room</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Subscription Intelligence Hub</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-200/85">
              Monitor employer accounts, update subscription access, and drive billing actions from a single premium dashboard.
            </p>
          </div>
          <Badge
            variant="light"
            color="orange"
            className="!rounded-full !border !border-orange-300/30 !bg-orange-400/15 !px-3 !py-1 !text-[11px] !font-bold !tracking-[0.08em]"
          >
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Pending: {overview.employerSubscriptionsPending}
            </span>
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Employers" value={overview.activeEmployers} icon={Building2} subtitle="Companies with employer accounts" accentClass="bg-amber-400" />
        <StatCard label="Active Candidates" value={overview.activeCandidates} icon={Users} subtitle="Applicants ready for hiring" accentClass="bg-cyan-400" />
        <StatCard label="Active Students" value={overview.activeStudents} icon={GraduationCap} subtitle="Student talent in pipeline" accentClass="bg-emerald-400" />
        <StatCard label="Active Jobs" value={overview.activeJobs} icon={Briefcase} subtitle="Live openings in marketplace" accentClass="bg-fuchsia-400" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={overview.totalUsers} icon={Users} subtitle="Overall platform users" accentClass="bg-sky-400" />
        <StatCard label="Total Profiles" value={overview.totalProfiles} icon={FileText} subtitle="Profiles across all roles" accentClass="bg-indigo-400" />
        <StatCard label="Total Jobs" value={overview.totalJobs} icon={Briefcase} subtitle="Posted jobs to date" accentClass="bg-pink-400" />
        <StatCard
          label="Subscriptions Configured"
          value={overview.employerSubscriptionsConfigured}
          icon={Layers}
          subtitle="Employers with billing setup"
          accentClass="bg-lime-400"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a]/80 via-[#0d203f]/65 to-[#111827]/80 p-4 shadow-[0_18px_44px_rgba(2,6,23,0.45)] backdrop-blur-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-white">Employer Subscription Snapshot</h3>
          <Badge
            variant="light"
            color="cyan"
            className="!rounded-full !border !border-cyan-300/30 !bg-cyan-400/15 !px-3 !py-1 !text-[11px] !font-bold !tracking-[0.08em]"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Live Billing Control
            </span>
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table withTableBorder withColumnBorders className="min-w-[720px] text-slate-100">
            <Table.Thead>
              <Table.Tr className="bg-slate-900/95">
                <Table.Th className="!text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Company</Table.Th>
                <Table.Th className="!text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Contact</Table.Th>
                <Table.Th className="!text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Email</Table.Th>
                <Table.Th className="!text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Location</Table.Th>
                <Table.Th className="!text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Plan</Table.Th>
                <Table.Th className="!text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Status</Table.Th>
                <Table.Th className="!text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em] !text-center">Billing</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {overview.employers.map((employer, index) => (
                <Table.Tr
                  key={employer.employerId}
                  className={index % 2 === 0 ? "bg-white/[0.03] hover:bg-sky-500/10" : "bg-slate-950/45 hover:bg-sky-500/10"}
                >
                  <Table.Td className="!text-slate-100 !font-medium">{employer.companyName}</Table.Td>
                  <Table.Td className="!text-slate-100">{employer.contactName}</Table.Td>
                  <Table.Td className="!text-sky-200">{employer.email}</Table.Td>
                  <Table.Td className="!text-slate-200">{employer.location}</Table.Td>
                  <Table.Td className="!text-slate-200">
                    {employerPlans[employer.employerId] ?? employer.subscriptionPlan}
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={employer.subscriptionStatus === "Active" ? "green" : "orange"}
                      variant="filled"
                    >
                      {employer.subscriptionStatus}
                    </Badge>
                  </Table.Td>
                  <Table.Td className="!text-center">
                    <button
                      type="button"
                      onClick={() => openModal(employer)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 transition-all hover:border-cyan-300/60 hover:bg-cyan-500/20 hover:text-white"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Manage
                    </button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a]/80 via-[#0d203f]/65 to-[#111827]/80 p-4 shadow-[0_18px_44px_rgba(2,6,23,0.45)] backdrop-blur-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-white">Employer Subscription Requests</h3>
          <Badge
            variant="light"
            color="orange"
            className="!rounded-full !border !border-orange-300/30 !bg-orange-400/15 !px-3 !py-1 !text-[11px] !font-bold !tracking-[0.08em]"
          >
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Pending: {subRequests.filter((r) => r.status === "PENDING").length}
            </span>
          </Badge>
        </div>

        {reqLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader color="orange" size="sm" />
          </div>
        )}

        {!reqLoading && subRequests.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">No subscription requests yet.</p>
        )}

        {!reqLoading && subRequests.length > 0 && (
          <div className="overflow-x-auto">
            <Table withTableBorder withColumnBorders className="min-w-[720px] text-slate-100">
              <Table.Thead>
                <Table.Tr className="bg-slate-900/95">
                  <Table.Th className="!text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Employer ID</Table.Th>
                  <Table.Th className="!text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Type</Table.Th>
                  <Table.Th className="!text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Status</Table.Th>
                  <Table.Th className="!text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Note</Table.Th>
                  <Table.Th className="!text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Submitted</Table.Th>
                  <Table.Th className="!text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {subRequests.map((req, index) => (
                  <Table.Tr
                    key={req.id}
                    className={index % 2 === 0 ? "bg-white/[0.03] hover:bg-sky-500/10" : "bg-slate-950/45 hover:bg-sky-500/10"}
                  >
                    <Table.Td className="!text-slate-300">{req.employerId}</Table.Td>
                    <Table.Td>
                      <Badge color={req.requestType === "RENEWAL" ? "cyan" : "violet"} variant="light">
                        {req.requestType}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={req.status === "APPROVED" ? "green" : req.status === "REJECTED" ? "red" : "orange"}
                        variant="filled"
                      >
                        {req.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td className="!text-slate-300 !text-xs">{req.note ?? "—"}</Table.Td>
                    <Table.Td className="!text-slate-400 !text-xs">{new Date(req.createdAt).toLocaleDateString()}</Table.Td>
                    <Table.Td>
                      {req.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={Boolean(reqResolving[req.id])}
                            onClick={() => void handleResolve(req.id, "APPROVED")}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                          >
                            <ThumbsUp className="h-3 w-3" />
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(reqResolving[req.id])}
                            onClick={() => void handleResolve(req.id, "REJECTED")}
                            className="inline-flex items-center gap-1 rounded bg-rose-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
                          >
                            <ThumbsDown className="h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          {req.status === "APPROVED" ? (
                            <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Approved</>
                          ) : (
                            <><XCircle className="h-3.5 w-3.5 text-rose-400" /> Rejected</>
                          )}
                        </span>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        )}
      </div>
    </section>
  );
}
