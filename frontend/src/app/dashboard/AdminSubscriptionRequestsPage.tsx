import { Badge, Button, Loader, Modal, Pagination, Select, Table, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AlertCircle, AlertTriangle, CheckCircle2, Paperclip, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import {
  getAllSubscriptionRequests,
  openAdminSubscriptionStatement,
  resolveSubscriptionRequest,
  type SubscriptionRequest,
} from "../services/admin-service";
import AdminActiveFilterChips from "./AdminActiveFilterChips";
import AdminBillingSuiteTabs from "./AdminBillingSuiteTabs";

export default function AdminSubscriptionRequestsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subRequests, setSubRequests] = useState<SubscriptionRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqResolving, setReqResolving] = useState<Record<number, boolean>>({});
  const [viewingStatementId, setViewingStatementId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>("ALL");
  const [typeFilter, setTypeFilter] = useState<string | null>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveNote, setApproveNote] = useState("");
  const [approveTarget, setApproveTarget] = useState<SubscriptionRequest | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectTarget, setRejectTarget] = useState<SubscriptionRequest | null>(null);

  const pageSize = 8;

  const pendingCount = subRequests.filter((request) => request.status === "PENDING").length;
  const approvedCount = subRequests.filter((request) => request.status === "APPROVED").length;
  const rejectedCount = subRequests.filter((request) => request.status === "REJECTED").length;
  const statementsCount = subRequests.filter((request) => request.hasPaymentStatement).length;
  const filteredRequests = subRequests.filter((request) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      String(request.employerId).includes(normalizedSearch) ||
      String(request.id).includes(normalizedSearch) ||
      String(request.note ?? "").toLowerCase().includes(normalizedSearch) ||
      String(request.paymentStatementName ?? "").toLowerCase().includes(normalizedSearch);
    const matchesStatus = !statusFilter || statusFilter === "ALL" || request.status === statusFilter;
    const matchesType = !typeFilter || typeFilter === "ALL" || request.requestType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeFilterChips = [
    searchTerm.trim().length > 0
      ? {
          key: "search",
          label: "Search",
          value: searchTerm.trim(),
          onClear: () => {
            setSearchTerm("");
            if (searchParams.get("employerId")) {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete("employerId");
              setSearchParams(nextParams, { replace: true });
            }
          },
        }
      : null,
    statusFilter && statusFilter !== "ALL"
      ? {
          key: "status",
          label: "Status",
          value: statusFilter,
          onClear: () => setStatusFilter("ALL"),
        }
      : null,
    typeFilter && typeFilter !== "ALL"
      ? {
          key: "type",
          label: "Type",
          value: typeFilter,
          onClear: () => setTypeFilter("ALL"),
        }
      : null,
  ].filter((chip): chip is NonNullable<typeof chip> => chip !== null);

  useEffect(() => {
    const employerId = searchParams.get("employerId");
    if (employerId) {
      setSearchTerm(employerId);
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    let cancelled = false;
    setReqLoading(true);
    getAllSubscriptionRequests()
      .then((data) => {
        if (!cancelled) {
          setSubRequests(data);
        }
      })
      .catch(() => {
        // Keep UI non-blocking if admin request feed fails.
      })
      .finally(() => {
        if (!cancelled) {
          setReqLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openApproveModal(request: SubscriptionRequest) {
    setApproveTarget(request);
    setApproveNote("");
    setApproveModalOpen(true);
  }

  async function handleApproveSubmit() {
    if (!approveTarget) {
      return;
    }

    try {
      setReqResolving((prev) => ({ ...prev, [approveTarget.id]: true }));
      const updated = await resolveSubscriptionRequest(approveTarget.id, "APPROVED", approveNote.trim() || undefined);
      setSubRequests((prev) => prev.map((request) => (request.id === updated.id ? updated : request)));
      notifications.show({
        color: "green",
        title: "Request approved",
        message: `Subscription request #${updated.id} was approved successfully.`,
      });
      setApproveModalOpen(false);
      setApproveTarget(null);
      setApproveNote("");
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Approval failed",
        message: error instanceof Error ? error.message : "Failed to approve subscription request.",
      });
    } finally {
      if (approveTarget) {
        setReqResolving((prev) => ({ ...prev, [approveTarget.id]: false }));
      }
    }
  }

  function openRejectModal(request: SubscriptionRequest) {
    setRejectTarget(request);
    setRejectNote("");
    setRejectModalOpen(true);
  }

  async function handleRejectSubmit() {
    if (!rejectTarget || rejectNote.trim().length === 0) {
      return;
    }

    try {
      setReqResolving((prev) => ({ ...prev, [rejectTarget.id]: true }));
      const updated = await resolveSubscriptionRequest(rejectTarget.id, "REJECTED", rejectNote.trim());
      setSubRequests((prev) => prev.map((request) => (request.id === updated.id ? updated : request)));
      notifications.show({
        color: "orange",
        title: "Request rejected",
        message: `Subscription request #${updated.id} was rejected and the admin note was saved.`,
      });
      setRejectModalOpen(false);
      setRejectTarget(null);
      setRejectNote("");
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Rejection failed",
        message: error instanceof Error ? error.message : "Failed to reject subscription request.",
      });
    } finally {
      if (rejectTarget) {
        setReqResolving((prev) => ({ ...prev, [rejectTarget.id]: false }));
      }
    }
  }

  async function handleViewStatement(requestId: number) {
    try {
      setViewingStatementId(requestId);
      await openAdminSubscriptionStatement(requestId);
      notifications.show({
        color: "cyan",
        title: "Statement opened",
        message: `Payment statement for request #${requestId} opened successfully.`,
      });
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Statement unavailable",
        message: error instanceof Error ? error.message : "Failed to open payment statement.",
      });
    } finally {
      setViewingStatementId(null);
    }
  }

  return (
    <section className="space-y-5">
      <Modal
        opened={approveModalOpen}
        onClose={() => {
          setApproveModalOpen(false);
          setApproveTarget(null);
          setApproveNote("");
        }}
        title="Approve Request"
        centered
        radius="lg"
        classNames={{
          content: "!bg-[#0f172a] !text-white",
          header: "!bg-[#0f172a]",
          title: "!text-white !font-bold",
          close: "!text-slate-300 hover:!bg-white/10",
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Add an optional admin note before approving {approveTarget ? `request #${approveTarget.id}` : "this request"}.
          </p>
          <Textarea
            value={approveNote}
            onChange={(event) => setApproveNote(event.currentTarget.value)}
            label="Admin note"
            placeholder="Optional note for approval record"
            autosize
            minRows={4}
            classNames={{
              input: "!border-white/10 !bg-white/5 !text-white placeholder:!text-slate-500",
              label: "!mb-1 !text-xs !font-semibold !uppercase !tracking-[0.12em] !text-slate-300",
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="default" onClick={() => setApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button color="green" onClick={() => void handleApproveSubmit()} disabled={!approveTarget}>
              Approve Request
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        opened={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectTarget(null);
          setRejectNote("");
        }}
        title="Reject Request"
        centered
        radius="lg"
        classNames={{
          content: "!bg-[#0f172a] !text-white",
          header: "!bg-[#0f172a]",
          title: "!text-white !font-bold",
          close: "!text-slate-300 hover:!bg-white/10",
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Add an admin note before rejecting {rejectTarget ? `request #${rejectTarget.id}` : "this request"}.
          </p>
          <Textarea
            value={rejectNote}
            onChange={(event) => setRejectNote(event.currentTarget.value)}
            label="Admin note"
            placeholder="Explain why this request was rejected"
            autosize
            minRows={4}
            classNames={{
              input: "!border-white/10 !bg-white/5 !text-white placeholder:!text-slate-500",
              label: "!mb-1 !text-xs !font-semibold !uppercase !tracking-[0.12em] !text-slate-300",
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="default" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={() => void handleRejectSubmit()} disabled={rejectNote.trim().length === 0 || !rejectTarget}>
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>

      <div className="relative overflow-hidden rounded-3xl border border-orange-300/20 bg-[radial-gradient(circle_at_15%_20%,rgba(251,146,60,0.24),transparent_45%),radial-gradient(circle_at_82%_15%,rgba(236,72,153,0.14),transparent_42%),linear-gradient(120deg,#1f1321_0%,#2c1a2f_46%,#231528_100%)] p-6 shadow-[0_28px_60px_rgba(180,83,9,0.22)]">
        <div className="absolute -left-14 -top-14 h-36 w-36 rounded-full bg-orange-400/15 blur-2xl" />
        <div className="absolute -bottom-16 right-4 h-36 w-36 rounded-full bg-fuchsia-300/15 blur-2xl" />
        <div className="absolute inset-y-0 right-[22%] w-px bg-gradient-to-b from-transparent via-orange-200/20 to-transparent" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-200/90">Admin Billing Desk</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Employer Subscription Requests</h2>
            <p className="mt-3 max-w-3xl text-sm text-slate-200/85">
              Review uploaded statements, approve or reject requests, and keep subscription operations moving.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-orange-300/40 bg-orange-400/15 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-orange-100">
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Pending: {pendingCount}
            </span>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
          <AdminBillingSuiteTabs
            activeSection="subscription-requests"
            onSelect={(section) => navigate(`/dashboard?tab=admin&section=${section}`)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-orange-300/25 bg-gradient-to-br from-orange-500/20 to-orange-400/5 p-4 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-100/85">Pending Review</p>
          <p className="mt-2 text-2xl font-black text-white">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-300/25 bg-gradient-to-br from-emerald-500/20 to-emerald-400/5 p-4 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100/85">Approved</p>
          <p className="mt-2 text-2xl font-black text-white">{approvedCount}</p>
        </div>
        <div className="rounded-2xl border border-rose-300/25 bg-gradient-to-br from-rose-500/20 to-rose-400/5 p-4 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-100/85">Rejected</p>
          <p className="mt-2 text-2xl font-black text-white">{rejectedCount}</p>
        </div>
        <div className="rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-cyan-500/20 to-cyan-400/5 p-4 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100/85">Statements Uploaded</p>
          <p className="mt-2 text-2xl font-black text-white">{statementsCount}</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a]/85 via-[#0d203f]/70 to-[#111827]/85 p-4 shadow-[0_18px_44px_rgba(2,6,23,0.45)] backdrop-blur-sm">
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-white sm:text-lg">Request Queue</h3>
          <Badge variant="light" color="gray" className="!border !border-white/20 !bg-white/10 !text-slate-100">
            Total: {filteredRequests.length}
          </Badge>
        </div>

        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_220px]">
          <TextInput
            value={searchTerm}
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              setSearchTerm(nextValue);
              if (searchParams.get("employerId")) {
                const nextParams = new URLSearchParams(searchParams);
                nextParams.delete("employerId");
                setSearchParams(nextParams, { replace: true });
              }
            }}
            label="Search requests"
            placeholder="Employer ID, request ID, note, or statement"
            classNames={{
              input: "!border-white/10 !bg-white/5 !text-white placeholder:!text-slate-500",
              label: "!mb-1 !text-xs !font-semibold !uppercase !tracking-[0.12em] !text-slate-300",
            }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            label="Request status"
            data={[
              { value: "ALL", label: "All statuses" },
              { value: "PENDING", label: "Pending" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" },
            ]}
            classNames={{
              input: "!border-white/10 !bg-white/5 !text-white",
              dropdown: "!border-white/10 !bg-[#0f172a] !text-white",
              option: "!text-white",
              label: "!mb-1 !text-xs !font-semibold !uppercase !tracking-[0.12em] !text-slate-300",
            }}
            allowDeselect={false}
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            label="Request type"
            data={[
              { value: "ALL", label: "All types" },
              { value: "NEW", label: "New" },
              { value: "RENEWAL", label: "Renewal" },
              { value: "UPGRADE", label: "Upgrade" },
            ]}
            classNames={{
              input: "!border-white/10 !bg-white/5 !text-white",
              dropdown: "!border-white/10 !bg-[#0f172a] !text-white",
              option: "!text-white",
              label: "!mb-1 !text-xs !font-semibold !uppercase !tracking-[0.12em] !text-slate-300",
            }}
            allowDeselect={false}
          />
        </div>

        <AdminActiveFilterChips
          chips={activeFilterChips}
          onClearAll={() => {
            setSearchTerm("");
            setStatusFilter("ALL");
            setTypeFilter("ALL");
            if (searchParams.get("employerId")) {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete("employerId");
              setSearchParams(nextParams, { replace: true });
            }
          }}
        />

        {reqLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader color="orange" size="sm" />
          </div>
        )}

        {!reqLoading && filteredRequests.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">No subscription requests yet.</p>
        )}

        {!reqLoading && filteredRequests.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
              <Table withTableBorder withColumnBorders className="min-w-[760px] text-slate-100">
                <Table.Thead>
                  <Table.Tr className="bg-[#0b1328]/95">
                    <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Employer ID</Table.Th>
                    <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Type</Table.Th>
                    <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Status</Table.Th>
                    <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Note</Table.Th>
                    <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Statement</Table.Th>
                    <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Submitted</Table.Th>
                    <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedRequests.map((request, index) => (
                    <Table.Tr
                      key={request.id}
                      className={index % 2 === 0 ? "bg-white/[0.03] transition-colors hover:bg-cyan-500/10" : "bg-slate-950/40 transition-colors hover:bg-cyan-500/10"}
                    >
                    <Table.Td className="!text-slate-200 !font-semibold">#{request.employerId}</Table.Td>
                    <Table.Td>
                      <Badge color={request.requestType === "RENEWAL" ? "cyan" : "violet"} variant="light" className="!font-bold">
                        {request.requestType}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={request.status === "APPROVED" ? "green" : request.status === "REJECTED" ? "red" : "orange"}
                        variant="filled"
                        className="!font-bold"
                      >
                        {request.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td className="!text-slate-300 !text-xs">{request.note ?? "No note provided"}</Table.Td>
                    <Table.Td>
                      {request.hasPaymentStatement ? (
                        <button
                          type="button"
                          onClick={() => void handleViewStatement(request.id)}
                          disabled={viewingStatementId === request.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/30 bg-cyan-600/20 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.06)] transition hover:bg-cyan-600/30"
                          title={request.paymentStatementName ?? "View payment statement"}
                        >
                          <Paperclip className="h-3 w-3" />
                          {viewingStatementId === request.id
                            ? "Opening..."
                            : request.paymentStatementName
                              ? request.paymentStatementName.slice(0, 18) + (request.paymentStatementName.length > 18 ? "..." : "")
                              : "View"}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400/70">
                          <AlertCircle className="h-3 w-3" /> None
                        </span>
                      )}
                    </Table.Td>
                    <Table.Td className="!text-slate-400 !text-xs">{new Date(request.createdAt).toLocaleDateString()}</Table.Td>
                    <Table.Td>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={Boolean(reqResolving[request.id]) || !request.hasPaymentStatement || request.status === "APPROVED"}
                          onClick={() => openApproveModal(request)}
                          title={!request.hasPaymentStatement ? "Cannot approve: no payment statement attached" : undefined}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/25 bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_20px_rgba(5,150,105,0.25)] hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {request.status === "APPROVED" ? <CheckCircle2 className="h-3 w-3" /> : <ThumbsUp className="h-3 w-3" />}
                          {request.status === "APPROVED" ? "Approved" : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(reqResolving[request.id]) || request.status === "REJECTED"}
                          onClick={() => openRejectModal(request)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-300/25 bg-rose-700 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_20px_rgba(190,24,93,0.25)] hover:bg-rose-600 disabled:opacity-50"
                        >
                          {request.status === "REJECTED" ? <XCircle className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}
                          {request.status === "REJECTED" ? "Rejected" : "Reject"}
                        </button>
                      </div>
                    </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex justify-end">
                <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="orange" />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
