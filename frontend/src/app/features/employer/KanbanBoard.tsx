import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Avatar, Tooltip } from "@mantine/core";
import { IconGripVertical } from "@tabler/icons-react";
import { changeAppStatus } from "../../services/JobService";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { timeAgo } from "../../services/utilities";

// ── Column definitions ────────────────────────────────────────────────────────
const COLUMNS = [
    { id: "APPLIED",      label: "Applied",      dot: "#3b82f6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.25)"  },
    { id: "SCREENING",    label: "Screening",    dot: "#6366f1", bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.25)"  },
    { id: "INTERVIEWING", label: "Interviewing", dot: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)"  },
    { id: "OFFERED",      label: "Offered",      dot: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.25)"  },
    { id: "HIRED",        label: "Hired",        dot: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.25)"   },
    { id: "REJECTED",     label: "Rejected",     dot: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)"   },
] as const;

// ── Applicant card ────────────────────────────────────────────────────────────
const ApplicantCard = ({
    applicant,
    onDragStart,
}: {
    applicant: any;
    onDragStart: (a: any) => void;
}) => {
    const initials = (applicant.name || "?")
        .split(" ")
        .slice(0, 2)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();

    return (
        <div
            draggable
            onDragStart={() => onDragStart(applicant)}
            className="
                bg-mine-shaft-900 border border-mine-shaft-800 rounded-xl p-3
                cursor-grab active:cursor-grabbing select-none
                hover:border-bright-sun-400/40 hover:shadow-lg
                transition-all duration-150
                flex gap-2.5 items-start
            "
        >
            <Avatar color="brightSun" radius="xl" size="sm" className="flex-shrink-0 mt-0.5">
                {initials}
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="text-mine-shaft-100 text-xs font-semibold truncate">{applicant.name}</div>
                <div className="text-mine-shaft-500 text-[10px] truncate">{applicant.email}</div>
                {applicant.timestamp && (
                    <div className="text-mine-shaft-600 text-[10px] mt-0.5">
                        {timeAgo(applicant.timestamp)}
                    </div>
                )}
            </div>
            <IconGripVertical size={14} className="text-mine-shaft-700 flex-shrink-0 mt-0.5" />
        </div>
    );
};

// ── Kanban board ──────────────────────────────────────────────────────────────
interface KanbanBoardProps {
    applicants: any[];
}

const KanbanBoard = ({ applicants: initialApplicants }: KanbanBoardProps) => {
    const { id: jobId } = useParams<{ id: string }>();
    const [applicants, setApplicants] = useState<any[]>(initialApplicants || []);
    const [draggedApplicant, setDraggedApplicant] = useState<any>(null);
    const [dragOverCol, setDragOverCol] = useState<string | null>(null);

    // Sync when parent re-fetches
    useEffect(() => {
        setApplicants(initialApplicants || []);
    }, [initialApplicants]);

    const handleDragStart = (applicant: any) => {
        setDraggedApplicant(applicant);
    };

    const handleDragOver = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        setDragOverCol(colId);
    };

    const handleDragLeave = (colId: string) => {
        setDragOverCol((prev) => (prev === colId ? null : prev));
    };

    const handleDrop = async (newStatus: string) => {
        setDragOverCol(null);
        if (!draggedApplicant) return;
        if (draggedApplicant.applicationStatus === newStatus) {
            setDraggedApplicant(null);
            return;
        }

        // Optimistic update
        setApplicants((prev) =>
            prev.map((a) =>
                a.applicantId === draggedApplicant.applicantId
                    ? { ...a, applicationStatus: newStatus }
                    : a
            )
        );

        try {
            await changeAppStatus({
                id: jobId,
                applicantId: draggedApplicant.applicantId,
                applicationStatus: newStatus,
            });
            successNotification(
                "Status Updated",
                `${draggedApplicant.name} moved to ${newStatus.charAt(0) + newStatus.slice(1).toLowerCase()}`
            );
        } catch (err: any) {
            // Roll back
            setApplicants((prev) =>
                prev.map((a) =>
                    a.applicantId === draggedApplicant.applicantId
                        ? { ...a, applicationStatus: draggedApplicant.applicationStatus }
                        : a
                )
            );
            errorNotification(
                "Error",
                err?.response?.data?.errorMessage || "Failed to update status"
            );
        } finally {
            setDraggedApplicant(null);
        }
    };

    return (
        <div className="overflow-x-auto pb-4 -mx-2 px-2">
            <div className="flex gap-3 min-w-max py-1">
                {COLUMNS.map((col) => {
                    const cards = applicants.filter((a) => a.applicationStatus === col.id);
                    const isOver = dragOverCol === col.id;

                    return (
                        <div
                            key={col.id}
                            onDragOver={(e) => handleDragOver(e, col.id)}
                            onDragLeave={() => handleDragLeave(col.id)}
                            onDrop={() => handleDrop(col.id)}
                            className="flex flex-col rounded-2xl transition-all duration-150"
                            style={{
                                width: 210,
                                minHeight: 380,
                                background: col.bg,
                                border: `1.5px solid ${isOver ? col.dot : col.border}`,
                                boxShadow: isOver ? `0 0 0 2px ${col.dot}44` : undefined,
                            }}
                        >
                            {/* Column header */}
                            <div className="flex items-center justify-between px-3 pt-3 pb-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ background: col.dot }}
                                    />
                                    <span className="text-mine-shaft-200 text-xs font-semibold tracking-wide uppercase">
                                        {col.label}
                                    </span>
                                </div>
                                <Tooltip label={`${cards.length} applicant${cards.length !== 1 ? "s" : ""}`} position="top" withArrow>
                                    <span
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                        style={{ background: col.dot + "33", color: col.dot }}
                                    >
                                        {cards.length}
                                    </span>
                                </Tooltip>
                            </div>

                            {/* Drop zone + cards */}
                            <div className="flex flex-col gap-2 px-2 pb-3 flex-1">
                                {cards.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-[11px] text-mine-shaft-600 text-center px-2 min-h-[60px]">
                                        {isOver ? "Drop here" : "No applicants"}
                                    </div>
                                ) : (
                                    cards.map((a) => (
                                        <ApplicantCard key={a.applicantId} applicant={a} onDragStart={handleDragStart} />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default KanbanBoard;
