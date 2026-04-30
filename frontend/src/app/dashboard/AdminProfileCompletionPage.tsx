import { Loader, Table } from "@mantine/core";
import { useEffect, useState } from "react";
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

function formatDate(val?: string | null) {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function CompletionBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-white/10">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-white/80 w-9 text-right">{pct}%</span>
    </div>
  );
}

export default function AdminProfileCompletionPage() {
  const [rows, setRows] = useState<ProfileCompletionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("EMPLOYER");

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosInstance
      .get<ProfileCompletionRow[]>("/admin/profile-completion")
      .then((res) => setRows(res.data))
      .catch((e) => setError(e?.response?.data?.errorMessage || e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter((r) => r.accountType === activeTab);

  const tabs: { key: TabType; label: string }[] = [
    { key: "EMPLOYER", label: "Employers" },
    { key: "APPLICANT", label: "Applicants" },
  ];

  return (
    <div className="rounded-2xl bg-[#101c2c]/80 border border-white/10 p-6">
      <h2 className="text-2xl font-bold mb-1 text-white">Profile Completion</h2>
      <p className="text-sm text-white/50 mb-5">Profile fill rate and last activity per user</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader color="cyan" /></div>
      ) : error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-white/40 text-sm text-center py-10">No records found.</div>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Completion</Table.Th>
              <Table.Th>Last Active</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((row) => (
              <Table.Tr key={row.userId}>
                <Table.Td>{row.name}</Table.Td>
                <Table.Td className="text-white/60 text-xs">{row.email}</Table.Td>
                <Table.Td style={{ minWidth: 160 }}><CompletionBar pct={row.profileCompletionPercent ?? 0} /></Table.Td>
                <Table.Td className="text-white/60 text-xs">{formatDate(row.lastActiveAt)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </div>
  );
}