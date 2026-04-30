import { Loader, Pagination, TextInput } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpDown, Award, BarChart3, Search, TrendingUp, Users } from "lucide-react";
import axiosInstance from "../interceptor/AxiosInterceptor";

interface ProfileCompletionRow {
  userId: number;
  name: string;
  email: string;
  accountType: string;
  profileCompletionPercent: number;
  lastActiveAt: string;
}

type TabType = "EMPLOYER" | "APPLICANT";
type SortField = "name" | "pct" | "date";
type SortDir = "asc" | "desc";

function formatDate(val?: string | null) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getCompletionTier(pct: number) {
  if (pct >= 70) return {
    bar: "from-emerald-400 to-teal-500",
    borderL: "hover:border-l-emerald-500",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    label: "Strong",
  };
  if (pct >= 40) return {
    bar: "from-amber-400 to-orange-500",
    borderL: "hover:border-l-amber-500",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    label: "Partial",
  };
  return {
    bar: "from-rose-500 to-pink-600",
    borderL: "hover:border-l-rose-500",
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    label: "Weak",
  };
}

function CompletionBar({ pct }: { pct: number }) {
  const tier = getCompletionTier(pct);
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${tier.bar}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <span className="text-xs font-bold text-white/70 w-8 text-right tabular-nums">{pct}%</span>
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${tier.badge} w-14 text-center shrink-0`}>
        {tier.label}
      </span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accentClass }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; accentClass: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#111b32]/85 via-[#0f1a2f]/75 to-[#111827]/85 p-4 shadow-[0_14px_40px_rgba(2,8,23,0.45)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_20px_50px_rgba(8,145,178,0.22)]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className={`h-1.5 w-16 rounded-full ${accentClass}`} />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
          {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-cyan-200 transition-colors group-hover:border-cyan-300/40 group-hover:bg-cyan-500/10">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function SortBtn({ field, active, onClick }: { field: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 group">
      <span className={`text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${active ? "text-cyan-300" : "text-white/40 group-hover:text-white/60"}`}>
        {field}
      </span>
      <ArrowUpDown className={`h-3 w-3 transition-colors ${active ? "text-cyan-400" : "text-white/20 group-hover:text-white/40"}`} />
    </button>
  );
}

export default function AdminProfileCompletionPage() {
  const pageSize = 8;
  const [rows, setRows] = useState<ProfileCompletionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("EMPLOYER");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("pct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosInstance
      .get<ProfileCompletionRow[]>("/admin/profile-completion")
      .then((res) => setRows(res.data))
      .catch((e) => setError(e?.response?.data?.errorMessage || e.message))
      .finally(() => setLoading(false));
  }, []);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  const tabRows = useMemo(() => rows.filter((r) => r.accountType === activeTab), [rows, activeTab]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = q ? tabRows.filter((r) => r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)) : tabRows;
    return [...base].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = (a.name ?? "").localeCompare(b.name ?? "");
      else if (sortField === "pct") cmp = (a.profileCompletionPercent ?? 0) - (b.profileCompletionPercent ?? 0);
      else cmp = new Date(a.lastActiveAt ?? 0).getTime() - new Date(b.lastActiveAt ?? 0).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [tabRows, search, sortField, sortDir]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const stats = useMemo(() => {
    if (!tabRows.length) return { avg: 0, strong: 0, partial: 0, weak: 0 };
    const avg = Math.round(tabRows.reduce((s, r) => s + (r.profileCompletionPercent ?? 0), 0) / tabRows.length);
    const strong = tabRows.filter((r) => (r.profileCompletionPercent ?? 0) >= 70).length;
    const partial = tabRows.filter((r) => { const p = r.profileCompletionPercent ?? 0; return p >= 40 && p < 70; }).length;
    const weak = tabRows.filter((r) => (r.profileCompletionPercent ?? 0) < 40).length;
    return { avg, strong, partial, weak };
  }, [tabRows]);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "EMPLOYER", label: "Employers", count: rows.filter((r) => r.accountType === "EMPLOYER").length },
    { key: "APPLICANT", label: "Applicants", count: rows.filter((r) => r.accountType === "APPLICANT").length },
  ];

  const total = tabRows.length || 1;
  const strongPct  = Math.round((stats.strong  / total) * 100);
  const partialPct = Math.round((stats.partial / total) * 100);
  const weakPct    = Math.max(0, 100 - strongPct - partialPct);

  return (
    <div className="space-y-5">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f1a2f]/95 via-[#111b32]/90 to-[#0d1626]/95 p-6 shadow-[0_14px_40px_rgba(2,8,23,0.6)] backdrop-blur-sm">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-500/[0.06] blur-3xl" />
        <div className="absolute right-24 bottom-0 h-32 w-32 rounded-full bg-violet-500/[0.07] blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1">
              <Activity className="h-3 w-3 text-cyan-300" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-200">Admin Analytics</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Profile Completion</h1>
            <p className="mt-1 text-sm text-slate-400">Fill rate and last activity across all registered users</p>
          </div>
          {!loading && !error && (
            <div className="flex items-end gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1">Avg Completion</p>
                <p className="text-5xl font-black leading-none text-white tabular-nums">
                  {stats.avg}<span className="text-2xl text-slate-400 font-bold">%</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">{activeTab === "EMPLOYER" ? "Employers" : "Applicants"}</p>
              </div>
              <div className="relative h-14 w-14 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={stats.avg >= 70 ? "#34d399" : stats.avg >= 40 ? "#fbbf24" : "#f43f5e"}
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${stats.avg} ${100 - stats.avg}`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white">{stats.avg}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                : "bg-white/[0.05] text-white/50 hover:bg-white/[0.09] border border-white/[0.08]"
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
              activeTab === tab.key ? "bg-white/20 text-white" : "bg-white/10 text-white/40"
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader color="cyan" size="md" />
            <p className="text-sm text-slate-500">Loading profile data…</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.08] p-4 text-sm text-rose-300">{error}</div>
      ) : (
        <>
          {/* ── Stat cards ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Users}      label="Total Users"    value={tabRows.length}  sub={activeTab === "EMPLOYER" ? "Employer accounts" : "Applicant accounts"} accentClass="bg-gradient-to-r from-cyan-400 to-blue-400" />
            <StatCard icon={TrendingUp} label="Avg Completion" value={`${stats.avg}%`} sub="Across all users"    accentClass="bg-gradient-to-r from-violet-400 to-purple-400" />
            <StatCard icon={Award}      label="Strong (≥70%)"  value={stats.strong}    sub={`${strongPct}% of total`}  accentClass="bg-gradient-to-r from-emerald-400 to-teal-400" />
            <StatCard icon={BarChart3}  label="Need Attention" value={stats.weak}      sub="Below 40% completion" accentClass="bg-gradient-to-r from-rose-400 to-pink-400" />
          </div>

          {tabRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-20">
              <Users className="mb-3 h-10 w-10 text-white/15" />
              <p className="text-sm font-medium text-slate-500">No records found</p>
            </div>
          ) : (
            <>
              {/* ── Distribution bar ───────────────────────────── */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#111b32]/85 via-[#0f1a2f]/75 to-[#111827]/85 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Completion Distribution</p>
                  <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Strong {stats.strong}</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Partial {stats.partial}</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Weak {stats.weak}</span>
                  </div>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full gap-0.5">
                  {strongPct  > 0 && <div className="bg-gradient-to-r from-emerald-400 to-teal-400 rounded-l-full" style={{ width: `${strongPct}%` }} />}
                  {partialPct > 0 && <div className="bg-gradient-to-r from-amber-400 to-orange-400"               style={{ width: `${partialPct}%` }} />}
                  {weakPct    > 0 && <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-r-full"   style={{ width: `${weakPct}%` }} />}
                </div>
              </div>

              {/* ── Table card ─────────────────────────────────── */}
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b1221]/90 via-[#0f1624]/85 to-[#0b1221]/90 backdrop-blur-sm shadow-[0_14px_40px_rgba(2,8,23,0.5)]">

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/[0.07]">
                  <TextInput
                    placeholder="Search name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    leftSection={<Search className="h-3.5 w-3.5 text-slate-500" />}
                    size="xs"
                    classNames={{
                      input: "bg-white/[0.05] border-white/10 text-white placeholder:text-slate-600 focus:border-cyan-500/40 text-xs rounded-lg",
                      root: "w-60",
                    }}
                  />
                  <p className="text-[11px] text-slate-500 shrink-0">
                    {filtered.length > 0
                      ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length}`
                      : "0 users"}
                  </p>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[1.2fr_1.5fr_2fr_1fr] gap-4 border-b border-white/[0.06] bg-white/[0.02] px-5 py-2.5">
                  <SortBtn field="Name"        active={sortField === "name"} onClick={() => toggleSort("name")} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Email</span>
                  <SortBtn field="Completion"  active={sortField === "pct"}  onClick={() => toggleSort("pct")} />
                  <SortBtn field="Last Active" active={sortField === "date"} onClick={() => toggleSort("date")} />
                </div>

                {/* Rows */}
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Search className="mb-3 h-8 w-8 text-white/20" />
                    <p className="text-sm text-slate-500">No users match "{search}"</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {paginatedRows.map((row) => {
                      const pct = row.profileCompletionPercent ?? 0;
                      const tier = getCompletionTier(pct);
                      const date = formatDate(row.lastActiveAt);
                      return (
                        <div
                          key={row.userId}
                          className={`group grid grid-cols-[1.2fr_1.5fr_2fr_1fr] gap-4 items-center pr-5 py-3 border-l-2 border-l-transparent transition-all duration-150 hover:bg-white/[0.03] ${tier.borderL}`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pl-5">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tier.bar} text-[11px] font-black text-white`}>
                              {row.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </div>
                            <span className="truncate text-sm font-semibold text-white/85">{row.name || "—"}</span>
                          </div>
                          <span className="truncate text-xs text-slate-500">{row.email || "—"}</span>
                          <CompletionBar pct={pct} />
                          {date ? (
                            <span className="text-[11px] text-slate-500 tabular-nums">{date}</span>
                          ) : (
                            <span className="text-[11px] text-white/20">—</span>
                          )}
                        </div>
                      );
                    })}
                    {totalPages > 1 && (
                      <div className="flex justify-end px-5 py-4">
                        <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="cyan" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}