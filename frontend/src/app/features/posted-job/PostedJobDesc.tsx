import { Badge, Button, Tabs } from "@mantine/core";
import { IconLayoutKanban, IconLayoutList } from "@tabler/icons-react";
import Job from "../job-desc/Job";
import TalentCard from "../find-talent/TalentCard";
import KanbanBoard from "../employer/KanbanBoard";
import { useEffect, useMemo, useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { useSearchParams } from "react-router";
import { changeAppStatus } from "../../services/job-service";
import { errorNotification, successNotification } from "../../services/NotificationService";

type ApplicantStatus = "APPLIED" | "SCREENING" | "INTERVIEWING" | "OFFERED" | "HIRED" | "REJECTED";
type PostedJobTab = "overview" | "applicants" | "screening" | "invited" | "offered" | "hired" | "rejected";
type ApplicantSort = "NEWEST" | "OLDEST" | "NAME_ASC" | "EXP_DESC" | "RECOMMENDED";

interface PostedApplicant {
    applicantId?: number;
    applicationStatus?: ApplicantStatus | string;
    [key: string]: unknown;
}

interface PostedJobDescProps {
    id?: number;
    jobTitle?: string;
    jobStatus?: string;
    location?: string;
    applicants?: PostedApplicant[];
    [key: string]: unknown;
}

const TAB_TO_STATUS: Partial<Record<PostedJobTab, ApplicantStatus>> = {
    applicants: "APPLIED",
    screening: "SCREENING",
    invited: "INTERVIEWING",
    offered: "OFFERED",
    hired: "HIRED",
    rejected: "REJECTED",
};

const TAB_ORDER: PostedJobTab[] = ["overview", "applicants", "screening", "invited", "offered", "hired", "rejected"];

const BULK_NEXT_STATUS: Partial<Record<Exclude<PostedJobTab, "overview" | "hired" | "rejected">, ApplicantStatus>> = {
    applicants: "SCREENING",
    screening: "INTERVIEWING",
    invited: "OFFERED",
    offered: "HIRED",
};

const STATUS_LABEL: Record<ApplicantStatus, string> = {
    APPLIED: "Applied",
    SCREENING: "Screening",
    INTERVIEWING: "Interview",
    OFFERED: "Offered",
    HIRED: "Hired",
    REJECTED: "Rejected",
};

const TAB_LABELS: Record<Exclude<PostedJobTab, "overview">, string> = {
    applicants: "Applicants",
    screening: "Screening",
    invited: "Invited",
    offered: "Shortlisted",
    hired: "Hired",
    rejected: "Rejected",
};

const TAB_EMPTY_MESSAGES: Record<Exclude<PostedJobTab, "overview">, string> = {
    applicants: "No applicants have applied yet.",
    screening: "No applicants are currently in screening.",
    invited: "No applicants have been invited yet.",
    offered: "No applicants have been shortlisted yet.",
    hired: "No applicants have been hired yet.",
    rejected: "No applicants have been rejected yet.",
};

const WORKFLOW_TABS: Array<Exclude<PostedJobTab, "overview">> = ["applicants", "screening", "invited", "offered", "hired", "rejected"];

interface QuickActionConfig {
    label: string;
    status: ApplicantStatus;
    color: string;
    variant?: "filled" | "light";
}

type AttentionTone = "rose" | "amber" | "cyan";
type TabRiskLevel = "none" | "warning" | "critical";

interface AttentionItem {
    id: string;
    tab: Exclude<PostedJobTab, "overview">;
    title: string;
    detail: string;
    tone: AttentionTone;
}

type InterviewTimeline = "Invited" | "Accepted" | "Scheduled" | "Completed" | "No Show";

type OfferChecklistState = {
    salaryBand: boolean;
    approvals: boolean;
    startDate: boolean;
};

const QUICK_ACTIONS_BY_TAB: Partial<Record<Exclude<PostedJobTab, "overview">, QuickActionConfig[]>> = {
    applicants: [
        { label: "Move to Screening", status: "SCREENING", color: "cyan", variant: "filled" },
        { label: "Invite to Interview", status: "INTERVIEWING", color: "violet", variant: "light" },
        { label: "Reject", status: "REJECTED", color: "red", variant: "light" },
    ],
    screening: [
        { label: "Invite to Interview", status: "INTERVIEWING", color: "violet", variant: "filled" },
        { label: "Move to Offered", status: "OFFERED", color: "indigo", variant: "light" },
        { label: "Reject", status: "REJECTED", color: "red", variant: "light" },
    ],
    invited: [
        { label: "Move to Offered", status: "OFFERED", color: "indigo", variant: "filled" },
        { label: "Mark as Hired", status: "HIRED", color: "green", variant: "light" },
        { label: "Reject", status: "REJECTED", color: "red", variant: "light" },
    ],
};

const PostedJobDesc = (props: PostedJobDescProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get("tab");
    const initialView = searchParams.get("view");
    const [tab, setTab]=useState<PostedJobTab>(TAB_ORDER.includes((initialTab as PostedJobTab) ?? "overview") ? (initialTab as PostedJobTab) : "overview");
    const [viewMode, setViewMode] = useState<"tabs" | "kanban">(initialView === "kanban" ? "kanban" : "tabs");
    const [applicantQuery, setApplicantQuery] = useState(searchParams.get("aq") ?? "");
    const [locationQuery, setLocationQuery] = useState(searchParams.get("lq") ?? "");
    const [applicantSort, setApplicantSort] = useState<ApplicantSort>((searchParams.get("asort") as ApplicantSort) ?? "NEWEST");
    const [applicantList, setApplicantList] = useState<PostedApplicant[]>(props.applicants ?? []);
    const [selectedApplicantIds, setSelectedApplicantIds] = useState<number[]>([]);
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [quickUpdating, setQuickUpdating] = useState<{ applicantId: number; status: ApplicantStatus } | null>(null);
    const [recentlyMovedApplicantId, setRecentlyMovedApplicantId] = useState<number | null>(null);
    const [workflowUpdatingId, setWorkflowUpdatingId] = useState<number | null>(null);
    const hasApplicants = applicantList.length > 0;

    useEffect(() => {
        setApplicantList(props.applicants ?? []);
    }, [props.applicants]);

    const applicantCounts = useMemo(() => ({
        applicants: applicantList.filter((applicant) => String(applicant.applicationStatus ?? "").toUpperCase() === "APPLIED").length,
        screening: applicantList.filter((applicant) => String(applicant.applicationStatus ?? "").toUpperCase() === "SCREENING").length,
        invited: applicantList.filter((applicant) => String(applicant.applicationStatus ?? "").toUpperCase() === "INTERVIEWING").length,
        offered: applicantList.filter((applicant) => String(applicant.applicationStatus ?? "").toUpperCase() === "OFFERED").length,
        hired: applicantList.filter((applicant) => String(applicant.applicationStatus ?? "").toUpperCase() === "HIRED").length,
        rejected: applicantList.filter((applicant) => String(applicant.applicationStatus ?? "").toUpperCase() === "REJECTED").length,
    }), [applicantList]);

    const firstNonEmptyWorkflowTab = useMemo<Exclude<PostedJobTab, "overview"> | null>(
        () => WORKFLOW_TABS.find((workflowTab) => applicantCounts[workflowTab] > 0) ?? null,
        [applicantCounts]
    );

    const activeKanbanColumns = useMemo(
        () => WORKFLOW_TABS.filter((workflowTab) => applicantCounts[workflowTab] > 0).length,
        [applicantCounts]
    );

    const kanbanRequiredColumns = 1;
    const remainingKanbanColumns = Math.max(0, kanbanRequiredColumns - activeKanbanColumns);
    const isKanbanEligible = activeKanbanColumns >= kanbanRequiredColumns;

    const handleTab=(value: string | null)=>{
        if (!value) return;
        setTab(value as PostedJobTab);
    };

    const applicantsForTab = useMemo(() => {
        const status = TAB_TO_STATUS[tab];
        if (!status) {
            return [];
        }

        return applicantList.filter((applicant) => String(applicant.applicationStatus ?? "").toUpperCase() === status);
    }, [applicantList, tab]);

    const filteredApplicantsForTab = useMemo(() => {
        return applicantsForTab.filter((applicant) => {
            const name = String((applicant as { name?: string }).name ?? "").toLowerCase();
            const email = String((applicant as { email?: string }).email ?? "").toLowerCase();
            const role = String((applicant as { jobTitle?: string }).jobTitle ?? "").toLowerCase();
            const location = String((applicant as { location?: string; currentLocation?: string }).location ?? (applicant as { currentLocation?: string }).currentLocation ?? "").toLowerCase();
            const skills = [
                ...(((applicant as { skills?: string[] }).skills) ?? []),
                ...(((applicant as { itSkills?: string[] }).itSkills) ?? []),
            ]
                .map((item) => String(item).toLowerCase())
                .join(" ");

            const query = applicantQuery.trim().toLowerCase();
            const locationTerm = locationQuery.trim().toLowerCase();

            const matchesText =
                !query ||
                name.includes(query) ||
                email.includes(query) ||
                role.includes(query) ||
                skills.includes(query);

            const matchesLocation = !locationTerm || location.includes(locationTerm);

            return matchesText && matchesLocation;
        });
    }, [applicantsForTab, applicantQuery, locationQuery]);

    const getApplicantTimestamp = (applicant: PostedApplicant) => {
        const candidateDate =
            (applicant as { appliedAt?: string }).appliedAt ??
            (applicant as { createdAt?: string }).createdAt ??
            (applicant as { updatedAt?: string }).updatedAt ??
            (applicant as { applicationTime?: string }).applicationTime;
        return candidateDate ? Date.parse(candidateDate) : Number.NaN;
    };

    const getApplicantAging = (applicant: PostedApplicant) => {
        const time = getApplicantTimestamp(applicant);
        if (!Number.isFinite(time)) {
            return {
                label: "No timestamp",
                className: "border-slate-300/20 bg-slate-500/20 text-slate-100",
            };
        }

        const ageDays = Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24));
        if (ageDays >= 14) {
            return {
                label: `Stale ${ageDays}d`,
                className: "border-rose-300/30 bg-rose-500/20 text-rose-100",
            };
        }
        if (ageDays >= 7) {
            return {
                label: `Aging ${ageDays}d`,
                className: "border-amber-300/30 bg-amber-500/20 text-amber-100",
            };
        }
        return {
            label: `New ${Math.max(ageDays, 0)}d`,
            className: "border-emerald-300/30 bg-emerald-500/20 text-emerald-100",
        };
    };

    const sortedApplicantsForTab = useMemo(() => {
        const source = [...filteredApplicantsForTab];
        source.sort((a, b) => {
            if (applicantSort === "RECOMMENDED") {
                const score = (candidate: PostedApplicant) => {
                    const expScore = Math.min(Number((candidate as { totalExp?: number }).totalExp ?? 0), 10) * 6;
                    const recencyTime = getApplicantTimestamp(candidate);
                    const ageDays = Number.isFinite(recencyTime) ? Math.max(0, Math.floor((Date.now() - recencyTime) / (1000 * 60 * 60 * 24))) : 30;
                    const recencyScore = Math.max(0, 40 - ageDays * 2);
                    return expScore + recencyScore;
                };
                return score(b) - score(a);
            }

            if (applicantSort === "NAME_ASC") {
                const aName = String((a as { name?: string }).name ?? "").toLowerCase();
                const bName = String((b as { name?: string }).name ?? "").toLowerCase();
                return aName.localeCompare(bName);
            }

            if (applicantSort === "EXP_DESC") {
                const aExp = Number((a as { totalExp?: number }).totalExp ?? 0);
                const bExp = Number((b as { totalExp?: number }).totalExp ?? 0);
                return bExp - aExp;
            }

            const aTime = getApplicantTimestamp(a);
            const bTime = getApplicantTimestamp(b);
            const safeATime = Number.isFinite(aTime) ? aTime : 0;
            const safeBTime = Number.isFinite(bTime) ? bTime : 0;

            if (applicantSort === "OLDEST") {
                return safeATime - safeBTime;
            }

            return safeBTime - safeATime;
        });
        return source;
    }, [filteredApplicantsForTab, applicantSort]);

    const selectableApplicantIds = useMemo(
        () => filteredApplicantsForTab
            .map((applicant) => applicant.applicantId)
            .filter((value): value is number => typeof value === "number"),
        [filteredApplicantsForTab]
    );

    const allVisibleSelected = selectableApplicantIds.length > 0 && selectableApplicantIds.every((id) => selectedApplicantIds.includes(id));

    const stageAlertChips = useMemo(() => {
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const fourteenDays = 14 * 24 * 60 * 60 * 1000;
        const stages: Array<{ key: PostedJobTab; status: ApplicantStatus; label: string }> = [
            { key: "applicants", status: "APPLIED", label: "Applied" },
            { key: "screening", status: "SCREENING", label: "Screening" },
            { key: "invited", status: "INTERVIEWING", label: "Interview" },
            { key: "offered", status: "OFFERED", label: "Offered" },
        ];

        return stages
            .map((stage) => {
                const stageApplicants = (props.applicants ?? []).filter(
                    (applicant) => String(applicant.applicationStatus ?? "").toUpperCase() === stage.status
                );
                const over14 = stageApplicants.filter((applicant) => {
                    const time = getApplicantTimestamp(applicant);
                    return Number.isFinite(time) && now - time > fourteenDays;
                }).length;
                const over7 = stageApplicants.filter((applicant) => {
                    const time = getApplicantTimestamp(applicant);
                    return Number.isFinite(time) && now - time > sevenDays;
                }).length;

                return {
                    key: stage.key,
                    label: stage.label,
                    over14,
                    over7,
                    tone: over14 > 0 ? "rose" : over7 > 0 ? "amber" : "emerald",
                };
            })
            .filter((item) => item.over7 > 0 || item.over14 > 0);
            }, [applicantList]);

            const attentionItems = useMemo<AttentionItem[]>(() => {
                const items: AttentionItem[] = [];
                const now = Date.now();
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                const fiveDays = 5 * 24 * 60 * 60 * 1000;

                const screeningAged = applicantList.filter((applicant) => {
                    const status = String(applicant.applicationStatus ?? "").toUpperCase();
                    if (status !== "SCREENING") return false;
                    const time = getApplicantTimestamp(applicant);
                    return Number.isFinite(time) && now - time > sevenDays;
                }).length;

                if (screeningAged > 0) {
                    items.push({
                        id: "screening-aged",
                        tab: "screening",
                        title: "Screening backlog",
                        detail: `${screeningAged} over 7 days`,
                        tone: "amber",
                    });
                }

                const invitedNoSchedule = applicantList.filter((applicant) => {
                    const status = String(applicant.applicationStatus ?? "").toUpperCase();
                    if (status !== "INTERVIEWING") return false;
                    const interviewStatus = String((applicant as { interviewStatus?: string }).interviewStatus ?? "").toUpperCase();
                    return interviewStatus !== "SCHEDULED" && interviewStatus !== "COMPLETED";
                }).length;

                if (invitedNoSchedule > 0) {
                    items.push({
                        id: "invited-unscheduled",
                        tab: "invited",
                        title: "Interview not scheduled",
                        detail: `${invitedNoSchedule} pending schedule`,
                        tone: "cyan",
                    });
                }

                const offeredStale = applicantList.filter((applicant) => {
                    const status = String(applicant.applicationStatus ?? "").toUpperCase();
                    if (status !== "OFFERED") return false;
                    const time = getApplicantTimestamp(applicant);
                    return Number.isFinite(time) && now - time > fiveDays;
                }).length;

                if (offeredStale > 0) {
                    items.push({
                        id: "offered-stale",
                        tab: "offered",
                        title: "Offer response risk",
                        detail: `${offeredStale} over 5 days`,
                        tone: "rose",
                    });
                }

                const rejectedWithoutReason = applicantList.filter((applicant) => {
                    const status = String(applicant.applicationStatus ?? "").toUpperCase();
                    if (status !== "REJECTED") return false;
                    const rejectionReason = String((applicant as { rejectionReason?: string }).rejectionReason ?? "").trim();
                    return rejectionReason.length === 0;
                }).length;

                if (rejectedWithoutReason > 0) {
                    items.push({
                        id: "rejected-missing-reason",
                        tab: "rejected",
                        title: "Rejected reason missing",
                        detail: `${rejectedWithoutReason} need reason`,
                        tone: "rose",
                    });
                }

                return items;
            }, [applicantList]);

            const getInterviewTimeline = (applicant: PostedApplicant): InterviewTimeline => {
                const explicit = String((applicant as { interviewStatus?: string }).interviewStatus ?? "").toUpperCase();
                if (explicit === "NO_SHOW") return "No Show";
                if (explicit === "COMPLETED") return "Completed";
                if (explicit === "SCHEDULED") return "Scheduled";
                if (explicit === "ACCEPTED") return "Accepted";

                if ((applicant as { noShow?: boolean }).noShow) return "No Show";
                if ((applicant as { interviewCompletedAt?: string }).interviewCompletedAt) return "Completed";
                if ((applicant as { interviewScheduledAt?: string }).interviewScheduledAt) return "Scheduled";
                if ((applicant as { interviewAcceptedAt?: string }).interviewAcceptedAt) return "Accepted";
                return "Invited";
            };

    const pipelineHealth = useMemo(() => {
        const applied = applicantCounts.applicants;
        const screening = applicantCounts.screening;
        const interviewing = applicantCounts.invited;
        const offered = applicantCounts.offered;
        const hired = applicantCounts.hired;
        const total = applicantList.length;

        const pct = (current: number, prev: number) => (prev > 0 ? Math.round((current / prev) * 100) : 0);

        return {
            total,
            stages: [
                { key: "applied", label: "Applied", count: applied, conversion: pct(applied, total || applied || 1) },
                { key: "screening", label: "Screening", count: screening, conversion: pct(screening, applied || 1) },
                { key: "interview", label: "Interview", count: interviewing, conversion: pct(interviewing, screening || 1) },
                { key: "offered", label: "Offered", count: offered, conversion: pct(offered, interviewing || 1) },
                { key: "hired", label: "Hired", count: hired, conversion: pct(hired, offered || 1) },
            ],
            finalConversion: pct(hired, total || 1),
        };
    }, [applicantCounts, applicantList.length]);

    const tabRiskCounts = useMemo(() => {
        const risk: Record<Exclude<PostedJobTab, "overview">, number> = {
            applicants: 0,
            screening: 0,
            invited: 0,
            offered: 0,
            hired: 0,
            rejected: 0,
        };

        stageAlertChips.forEach((chip) => {
            risk[chip.key] += 1;
        });

        attentionItems.forEach((item) => {
            risk[item.tab] += 1;
        });

        return risk;
    }, [stageAlertChips, attentionItems]);

    const tabRiskLevels = useMemo(() => {
        const levels: Record<Exclude<PostedJobTab, "overview">, TabRiskLevel> = {
            applicants: "none",
            screening: "none",
            invited: "none",
            offered: "none",
            hired: "none",
            rejected: "none",
        };

        const setWarning = (tabKey: Exclude<PostedJobTab, "overview">) => {
            if (levels[tabKey] === "none") levels[tabKey] = "warning";
        };

        const setCritical = (tabKey: Exclude<PostedJobTab, "overview">) => {
            levels[tabKey] = "critical";
        };

        stageAlertChips.forEach((chip) => {
            if (chip.tone === "rose") setCritical(chip.key);
            else if (chip.tone === "amber") setWarning(chip.key);
        });

        attentionItems.forEach((item) => {
            if (item.tone === "rose") setCritical(item.tab);
            else setWarning(item.tab);
        });

        return levels;
    }, [stageAlertChips, attentionItems]);

    const tabRiskBreakdown = useMemo(() => {
        const breakdown: Record<Exclude<PostedJobTab, "overview">, { warning: number; critical: number }> = {
            applicants: { warning: 0, critical: 0 },
            screening: { warning: 0, critical: 0 },
            invited: { warning: 0, critical: 0 },
            offered: { warning: 0, critical: 0 },
            hired: { warning: 0, critical: 0 },
            rejected: { warning: 0, critical: 0 },
        };

        stageAlertChips.forEach((chip) => {
            if (chip.tone === "rose") {
                breakdown[chip.key].critical += 1;
            } else {
                breakdown[chip.key].warning += 1;
            }
        });

        attentionItems.forEach((item) => {
            if (item.tone === "rose") {
                breakdown[item.tab].critical += 1;
            } else {
                breakdown[item.tab].warning += 1;
            }
        });

        return breakdown;
    }, [stageAlertChips, attentionItems]);

    const getRiskDotClass = (level: TabRiskLevel) => {
        if (level === "critical") {
            return "bg-rose-300 shadow-[0_0_0_4px_rgba(253,164,175,0.25)]";
        }
        if (level === "warning") {
            return "bg-amber-300 shadow-[0_0_0_4px_rgba(252,211,77,0.2)]";
        }
        return "";
    };

    const getRiskDotTitle = (tabKey: Exclude<PostedJobTab, "overview">) => {
        const total = tabRiskCounts[tabKey];
        const warning = tabRiskBreakdown[tabKey].warning;
        const critical = tabRiskBreakdown[tabKey].critical;

        if (total <= 0) return "No alerts";
        return `${total} reason${total === 1 ? "" : "s"}: ${warning} warning, ${critical} critical`;
    };

    useEffect(()=>{
        const tabParam = searchParams.get("tab");
        const viewParam = searchParams.get("view");
        const applicantQueryParam = searchParams.get("aq");
        const locationQueryParam = searchParams.get("lq");
        const applicantSortParam = searchParams.get("asort");

        const nextTab = TAB_ORDER.includes((tabParam as PostedJobTab) ?? "overview") ? (tabParam as PostedJobTab) : "overview";
        setTab(nextTab);
        setViewMode(viewParam === "kanban" ? "kanban" : "tabs");
        setApplicantQuery(applicantQueryParam ?? "");
        setLocationQuery(locationQueryParam ?? "");
        setApplicantSort((applicantSortParam as ApplicantSort) ?? "NEWEST");
        setSelectedApplicantIds([]);
    }, [props.id]);

    useEffect(() => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("tab", tab);
        nextParams.set("view", viewMode);

        if (applicantQuery.trim()) nextParams.set("aq", applicantQuery.trim());
        else nextParams.delete("aq");

        if (locationQuery.trim()) nextParams.set("lq", locationQuery.trim());
        else nextParams.delete("lq");

        nextParams.set("asort", applicantSort);

        setSearchParams(nextParams, { replace: true });
    }, [tab, viewMode, applicantQuery, locationQuery, applicantSort, setSearchParams]);

    useEffect(() => {
        if ((!hasApplicants || !isKanbanEligible) && viewMode === "kanban") {
            setViewMode("tabs");
        }
    }, [hasApplicants, isKanbanEligible, viewMode]);

    useEffect(() => {
        setSelectedApplicantIds([]);
    }, [tab, applicantQuery, locationQuery, applicantSort, props.id]);

    useEffect(() => {
        if (recentlyMovedApplicantId === null) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setRecentlyMovedApplicantId(null);
        }, 1400);

        return () => window.clearTimeout(timeoutId);
    }, [recentlyMovedApplicantId]);

    const handleQuickMove = async (applicantId: number, targetStatus: ApplicantStatus, label?: string) => {
        if (!props.id) return;

        try {
            setQuickUpdating({ applicantId, status: targetStatus });
            await changeAppStatus({
                id: props.id,
                applicantId,
                applicationStatus: targetStatus,
            });
            setApplicantList((prev) =>
                prev.map((applicant) =>
                    applicant.applicantId === applicantId
                        ? { ...applicant, applicationStatus: targetStatus }
                        : applicant
                )
            );
            setRecentlyMovedApplicantId(applicantId);
            setSelectedApplicantIds((prev) => prev.filter((id) => id !== applicantId));
            successNotification("Status Updated", `${label ?? "Candidate"} moved to ${STATUS_LABEL[targetStatus]}.`);
        } catch {
            errorNotification("Update Failed", "Unable to update candidate status. Please retry.");
        } finally {
            setQuickUpdating((prev) => (prev?.applicantId === applicantId ? null : prev));
        }
    };

    const getApplicantStatus = (applicant: PostedApplicant): ApplicantStatus => {
        const status = String(applicant.applicationStatus ?? "APPLIED").toUpperCase();
        if (status === "SCREENING" || status === "INTERVIEWING" || status === "OFFERED" || status === "HIRED" || status === "REJECTED") {
            return status;
        }
        return "APPLIED";
    };

    const updateApplicantWorkflow = async (
        applicantId: number,
        updates: {
            screeningOwner?: string;
            interviewStatus?: string;
            offerSalaryBandConfirmed?: boolean;
            offerApprovalsDone?: boolean;
            offerStartDateConfirmed?: boolean;
            rejectionReason?: string;
        },
        successTitle: string,
        successMessage: string
    ) => {
        if (!props.id) return;

        const existing = applicantList.find((applicant) => applicant.applicantId === applicantId);
        if (!existing) return;

        const previous = { ...existing };
        setApplicantList((prev) =>
            prev.map((applicant) =>
                applicant.applicantId === applicantId
                    ? { ...applicant, ...updates }
                    : applicant
            )
        );

        try {
            setWorkflowUpdatingId(applicantId);
            await changeAppStatus({
                id: props.id,
                applicantId,
                applicationStatus: getApplicantStatus(existing),
                ...updates,
            });
            successNotification(successTitle, successMessage);
        } catch {
            setApplicantList((prev) =>
                prev.map((applicant) =>
                    applicant.applicantId === applicantId
                        ? previous
                        : applicant
                )
            );
            errorNotification("Update Failed", "Unable to save workflow update. Please retry.");
        } finally {
            setWorkflowUpdatingId((current) => (current === applicantId ? null : current));
        }
    };

    const handleBulkMove = async (targetStatus: ApplicantStatus) => {
        if (!props.id || selectedApplicantIds.length === 0) {
            return;
        }

        try {
            setBulkUpdating(true);
            const results = await Promise.allSettled(
                selectedApplicantIds.map((applicantId) =>
                    changeAppStatus({
                        id: props.id,
                        applicantId,
                        applicationStatus: targetStatus,
                    })
                )
            );

            const successCount = results.filter((result) => result.status === "fulfilled").length;
            const failureCount = results.length - successCount;

            if (successCount > 0) {
                successNotification("Bulk Update Complete", `${successCount} candidate${successCount === 1 ? "" : "s"} moved to ${STATUS_LABEL[targetStatus]}.`);
            }
            if (failureCount > 0) {
                errorNotification("Partial Failure", `${failureCount} update${failureCount === 1 ? "" : "s"} failed. Please retry.`);
            }

            if (successCount > 0) {
                const successfulIds = selectedApplicantIds.filter((_, index) => results[index]?.status === "fulfilled");
                setApplicantList((prev) =>
                    prev.map((applicant) =>
                        successfulIds.includes(Number(applicant.applicantId))
                            ? { ...applicant, applicationStatus: targetStatus }
                            : applicant
                    )
                );
                setSelectedApplicantIds([]);
            }
        } catch (error) {
            errorNotification("Bulk Update Failed", "Unable to update selected candidates.");
        } finally {
            setBulkUpdating(false);
        }
    };

    const renderApplicantPanel = (panelTab: Exclude<PostedJobTab, "overview">, cardMode?: "invited" | "offered") => (
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,28,0.94),rgba(7,12,21,0.98))] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.28)] sm:p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Candidate Stage</div>
                    <div className="mt-1 text-xl font-semibold text-white">{TAB_LABELS[panelTab]}</div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-slate-200">
                    <span className="h-2 w-2 rounded-full bg-bright-sun-400" />
                    {applicantCounts[panelTab]} candidate{applicantCounts[panelTab] === 1 ? "" : "s"}
                </div>
            </div>

            <div className="mb-5 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-2">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={applicantQuery}
                        onChange={(event) => setApplicantQuery(event.target.value)}
                        placeholder="Search by name, email, role, skill"
                        className="h-10 w-full rounded-xl border border-white/15 bg-white/[0.05] pl-9 pr-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.08]"
                    />
                </div>
                <input
                    value={locationQuery}
                    onChange={(event) => setLocationQuery(event.target.value)}
                    placeholder="Filter by location"
                    className="h-10 w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.08]"
                />
                <select
                    value={applicantSort}
                    onChange={(event) => setApplicantSort(event.target.value as ApplicantSort)}
                    className="h-10 w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.08] sm:col-span-2"
                >
                    <option className="bg-slate-900" value="RECOMMENDED">Sort: Recommended first</option>
                    <option className="bg-slate-900" value="NEWEST">Sort: Newest first</option>
                    <option className="bg-slate-900" value="OLDEST">Sort: Oldest first</option>
                    <option className="bg-slate-900" value="NAME_ASC">Sort: Name A-Z</option>
                    <option className="bg-slate-900" value="EXP_DESC">Sort: Experience high to low</option>
                </select>
            </div>

            {!!BULK_NEXT_STATUS[panelTab] && selectableApplicantIds.length > 0 && (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-500/8 p-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                        <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={() => {
                                if (allVisibleSelected) {
                                    setSelectedApplicantIds([]);
                                    return;
                                }
                                setSelectedApplicantIds(selectableApplicantIds);
                            }}
                            className="h-4 w-4 rounded border-white/20 bg-white/10"
                        />
                        Select all visible ({selectableApplicantIds.length})
                    </label>
                    <Button
                        size="xs"
                        loading={bulkUpdating}
                        disabled={selectedApplicantIds.length === 0}
                        className="!bg-cyan-500 !font-semibold !text-white hover:!bg-cyan-400 disabled:!bg-white/15"
                        onClick={() => handleBulkMove(BULK_NEXT_STATUS[panelTab] as ApplicantStatus)}
                    >
                        Move {selectedApplicantIds.length} to {STATUS_LABEL[BULK_NEXT_STATUS[panelTab] as ApplicantStatus]}
                    </Button>
                </div>
            )}

            {sortedApplicantsForTab.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                    {sortedApplicantsForTab.map((talent, index) => {
                        const aging = getApplicantAging(talent);
                        const applicantName = String((talent as { name?: string }).name ?? "Candidate");
                        const applicantId = Number(talent.applicantId);
                        const showSuccessPulse = Number.isFinite(applicantId) && recentlyMovedApplicantId === applicantId;
                        return (
                        <div
                            key={talent.applicantId ?? index}
                            className={`relative rounded-2xl transition-all duration-500 ${showSuccessPulse ? "ring-2 ring-emerald-300/70 shadow-[0_0_0_1px_rgba(110,231,183,0.4),0_18px_40px_rgba(16,185,129,0.24)]" : ""}`}
                        >
                            {showSuccessPulse && (
                                <span className="pointer-events-none absolute inset-0 z-10 rounded-2xl border border-emerald-300/35 animate-pulse" />
                            )}
                            <span className={`absolute right-3 top-3 z-20 rounded-lg border px-2 py-1 text-[11px] font-semibold backdrop-blur-sm ${aging.className}`}>
                                {aging.label}
                            </span>
                            {typeof talent.applicantId === "number" && !!BULK_NEXT_STATUS[panelTab] && (
                                <label className="absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-lg border border-white/15 bg-black/45 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                                    <input
                                        type="checkbox"
                                        checked={selectedApplicantIds.includes(talent.applicantId)}
                                        onChange={() => {
                                            setSelectedApplicantIds((prev) =>
                                                prev.includes(talent.applicantId as number)
                                                    ? prev.filter((id) => id !== talent.applicantId)
                                                    : [...prev, talent.applicantId as number]
                                            );
                                        }}
                                        className="h-3.5 w-3.5 rounded border-white/20 bg-white/10"
                                    />
                                    Select
                                </label>
                            )}
                            <TalentCard
                                {...talent}
                                posted={true}
                                invited={cardMode === "invited"}
                                offered={cardMode === "offered"}
                            />
                            {typeof talent.applicantId === "number" && (QUICK_ACTIONS_BY_TAB[panelTab]?.length ?? 0) > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                                    {(QUICK_ACTIONS_BY_TAB[panelTab] ?? []).map((action) => (
                                        <Button
                                            key={action.status}
                                            size="xs"
                                            variant={action.variant ?? "light"}
                                            color={action.color}
                                            loading={
                                                quickUpdating?.applicantId === (talent.applicantId as number) &&
                                                quickUpdating?.status === action.status
                                            }
                                            disabled={
                                                bulkUpdating ||
                                                (quickUpdating?.applicantId === (talent.applicantId as number) &&
                                                    quickUpdating?.status !== action.status)
                                            }
                                            className={action.variant === "filled" ? "!font-semibold !text-white" : undefined}
                                            onClick={() => void handleQuickMove(talent.applicantId as number, action.status, applicantName)}
                                        >
                                            {action.label}
                                        </Button>
                                    ))}
                                </div>
                            )}
                            {panelTab === "screening" && typeof talent.applicantId === "number" && (
                                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">Owner</span>
                                    <select
                                        value={String((talent as { screeningOwner?: string }).screeningOwner ?? "")}
                                        disabled={workflowUpdatingId === (talent.applicantId as number)}
                                        onChange={(event) => {
                                            void updateApplicantWorkflow(
                                                talent.applicantId as number,
                                                { screeningOwner: event.target.value },
                                                "Owner Updated",
                                                `${applicantName} assigned to ${event.target.value || "Unassigned"}.`
                                            );
                                        }}
                                        className="h-8 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 text-xs font-medium text-white outline-none"
                                    >
                                        <option className="bg-slate-900" value="">Assign reviewer</option>
                                        <option className="bg-slate-900" value="Asha K.">Asha K.</option>
                                        <option className="bg-slate-900" value="Daniel M.">Daniel M.</option>
                                        <option className="bg-slate-900" value="Nora T.">Nora T.</option>
                                    </select>
                                    {!!String((talent as { screeningOwner?: string }).screeningOwner ?? "") && (
                                        <span className="rounded-full border border-cyan-300/25 bg-cyan-500/15 px-2 py-1 text-[11px] font-medium text-cyan-100">
                                            {String((talent as { screeningOwner?: string }).screeningOwner ?? "")}
                                        </span>
                                    )}
                                </div>
                            )}
                            {panelTab === "invited" && (
                                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">Interview Timeline</span>
                                    <span className="rounded-full border border-violet-300/30 bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold text-violet-100">
                                        {getInterviewTimeline(talent)}
                                    </span>
                                    {typeof talent.applicantId === "number" && (
                                        <select
                                            value={String((talent as { interviewStatus?: string }).interviewStatus ?? "")}
                                            disabled={workflowUpdatingId === (talent.applicantId as number)}
                                            onChange={(event) => {
                                                void updateApplicantWorkflow(
                                                    talent.applicantId as number,
                                                    { interviewStatus: event.target.value },
                                                    "Interview Status Updated",
                                                    `${applicantName} marked as ${event.target.value || "Invited"}.`
                                                );
                                            }}
                                            className="h-8 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 text-xs font-medium text-white outline-none"
                                        >
                                            <option className="bg-slate-900" value="">Invited</option>
                                            <option className="bg-slate-900" value="ACCEPTED">Accepted</option>
                                            <option className="bg-slate-900" value="SCHEDULED">Scheduled</option>
                                            <option className="bg-slate-900" value="COMPLETED">Completed</option>
                                            <option className="bg-slate-900" value="NO_SHOW">No Show</option>
                                        </select>
                                    )}
                                </div>
                            )}
                            {panelTab === "offered" && typeof talent.applicantId === "number" && (
                                <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">Offer Readiness</div>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { key: "salaryBand", label: "Salary band", payloadKey: "offerSalaryBandConfirmed" },
                                            { key: "approvals", label: "Approvals", payloadKey: "offerApprovalsDone" },
                                            { key: "startDate", label: "Start date", payloadKey: "offerStartDateConfirmed" },
                                        ].map((item) => {
                                            const checklist: OfferChecklistState = {
                                                salaryBand: Boolean((talent as { offerSalaryBandConfirmed?: boolean }).offerSalaryBandConfirmed),
                                                approvals: Boolean((talent as { offerApprovalsDone?: boolean }).offerApprovalsDone),
                                                startDate: Boolean((talent as { offerStartDateConfirmed?: boolean }).offerStartDateConfirmed),
                                            };
                                            const checked = checklist[item.key as keyof OfferChecklistState];
                                            return (
                                                <button
                                                    key={item.key}
                                                    type="button"
                                                    disabled={workflowUpdatingId === (talent.applicantId as number)}
                                                    onClick={() => {
                                                        void updateApplicantWorkflow(
                                                            talent.applicantId as number,
                                                            { [item.payloadKey]: !checked } as {
                                                                offerSalaryBandConfirmed?: boolean;
                                                                offerApprovalsDone?: boolean;
                                                                offerStartDateConfirmed?: boolean;
                                                            },
                                                            "Offer Checklist Updated",
                                                            `${item.label} ${!checked ? "completed" : "cleared"} for ${applicantName}.`
                                                        );
                                                    }}
                                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                                                        checked
                                                            ? "border-emerald-300/35 bg-emerald-500/15 text-emerald-100"
                                                            : "border-white/20 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                                                    }`}
                                                >
                                                    {item.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {panelTab === "rejected" && typeof talent.applicantId === "number" && (
                                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">Rejection reason</span>
                                    <select
                                        value={String((talent as { rejectionReason?: string }).rejectionReason ?? "")}
                                        disabled={workflowUpdatingId === (talent.applicantId as number)}
                                        onChange={(event) => {
                                            void updateApplicantWorkflow(
                                                talent.applicantId as number,
                                                { rejectionReason: event.target.value },
                                                "Rejection Reason Saved",
                                                `Reason saved for ${applicantName}.`
                                            );
                                        }}
                                        className="h-8 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 text-xs font-medium text-white outline-none"
                                    >
                                        <option className="bg-slate-900" value="">Select reason</option>
                                        <option className="bg-slate-900" value="Skills gap">Skills gap</option>
                                        <option className="bg-slate-900" value="Comp mismatch">Comp mismatch</option>
                                        <option className="bg-slate-900" value="No show">No show</option>
                                        <option className="bg-slate-900" value="Culture fit">Culture fit</option>
                                    </select>
                                    {!String((talent as { rejectionReason?: string }).rejectionReason ?? "") && (
                                        <span className="rounded-full border border-rose-300/30 bg-rose-500/14 px-2 py-1 text-[11px] font-medium text-rose-100">
                                            Required
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );})}
                </div>
            ) : (
                <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-12 text-center">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br from-bright-sun-400/25 to-cyan-400/20" />
                    <div className="text-lg font-semibold text-white">No matching candidates</div>
                    <div className="mt-2 text-sm text-slate-300">{TAB_EMPTY_MESSAGES[panelTab]}</div>
                </div>
            )}
        </div>
    );

    return <div data-aos="zoom-out" className="w-full px-2 md-mx:p-0">
        {props.jobTitle?<><div className="mb-5 overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(135deg,rgba(17,24,39,0.88),rgba(11,19,36,0.92),rgba(8,14,24,0.96))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Role Detail</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-2xl font-semibold text-white xs-mx:text-xl sm:text-[30px]">{props?.jobTitle} <Badge variant="light" color="brightSun.4" size="lg" className="!border !border-bright-sun-300/25 !bg-bright-sun-400/16 !px-3 !font-semibold">{props?.jobStatus}</Badge></div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">{props?.location || "Location not set"}</span>
                    <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-cyan-100">{applicantList.length} total applicants</span>
                </div>
            </div>
            <Button
                size="sm"
                variant={viewMode === "kanban" ? "filled" : "default"}
                color="brightSun.4"
                autoContrast
                title={!isKanbanEligible ? "Kanban needs candidates in at least one workflow column." : undefined}
                className="!h-11 !rounded-2xl !border !border-white/10 !bg-white/[0.06] !px-4 !font-semibold !text-slate-100 hover:!bg-white/[0.12] disabled:!bg-white/[0.04] disabled:!text-slate-400"
                leftSection={viewMode === "kanban" ? <IconLayoutList size={16}/> : <IconLayoutKanban size={16}/>}
                onClick={() => {
                    if (!isKanbanEligible) {
                        setViewMode("tabs");
                        if (firstNonEmptyWorkflowTab) {
                            setTab(firstNonEmptyWorkflowTab);
                        }
                        return;
                    }
                    setViewMode(m => m === "tabs" ? "kanban" : "tabs");
                }}
            >
                {!isKanbanEligible ? `Kanban ${activeKanbanColumns}/${kanbanRequiredColumns} Stages` : viewMode === "kanban" ? "Tab View" : "Kanban View"}
            </Button>
            </div>
            {!isKanbanEligible && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 font-medium text-amber-100">
                        Rule: at least one candidate in one workflow column
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 font-medium text-slate-100">
                        Add {remainingKanbanColumns} more active {remainingKanbanColumns === 1 ? "stage" : "stages"}
                    </span>
                    {firstNonEmptyWorkflowTab && (
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode("tabs");
                                setTab(firstNonEmptyWorkflowTab);
                            }}
                            className="rounded-full border border-cyan-300/30 bg-cyan-500/12 px-2.5 py-1 font-medium text-cyan-100 transition hover:bg-cyan-500/22"
                        >
                            Open {TAB_LABELS[firstNonEmptyWorkflowTab]} ({applicantCounts[firstNonEmptyWorkflowTab]})
                        </button>
                    )}
                </div>
            )}
        </div>
        <div className="mb-5 rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(15,29,46,0.92),rgba(9,17,30,0.98))] p-4 shadow-[0_20px_52px_rgba(0,0,0,0.28)] sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.17em] text-cyan-300/80">Pipeline Health</div>
                    <div className="mt-1 text-lg font-semibold text-white">End-to-end candidate conversion snapshot</div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-sm font-medium text-emerald-100">
                    <TrendingUp className="h-4 w-4" />
                    {pipelineHealth.finalConversion}% hired conversion
                </div>
            </div>
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <div className="flex min-w-max gap-2">
                    {pipelineHealth.stages.map((stage) => (
                        <div key={stage.key} className="w-[210px] rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                            <div className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{stage.label}</div>
                            <div className="mt-0.5 text-[34px] leading-none font-bold text-white">{stage.count}</div>
                            <div className="mt-1 text-[12px] text-cyan-200">{stage.conversion}% conversion</div>
                        </div>
                    ))}
                </div>
            </div>
            {stageAlertChips.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {stageAlertChips.map((chip) => (
                        <button
                            key={chip.key}
                            type="button"
                            onClick={() => setTab(chip.key)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                chip.tone === "rose"
                                    ? "border-rose-300/35 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25"
                                    : chip.tone === "amber"
                                    ? "border-amber-300/35 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25"
                                    : "border-emerald-300/30 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/22"
                            }`}
                        >
                            {chip.label}: {chip.over14 > 0 ? `${chip.over14} stuck >14d` : `${chip.over7} aging >7d`}
                        </button>
                    ))}
                </div>
            )}
            {attentionItems.length > 0 && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">Needs Attention</div>
                    <div className="flex flex-wrap gap-2">
                        {attentionItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTab(item.tab)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                    item.tone === "rose"
                                        ? "border-rose-300/35 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25"
                                        : item.tone === "amber"
                                        ? "border-amber-300/35 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25"
                                        : "border-cyan-300/35 bg-cyan-500/14 text-cyan-100 hover:bg-cyan-500/24"
                                }`}
                            >
                                {item.title}: {item.detail}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
        <div>
            {viewMode === "kanban" ? (
                <KanbanBoard applicants={applicantList} />
            ) : (
            <Tabs value={tab} onChange={handleTab} radius="xl" autoContrast variant="outline">
                                <Tabs.List className="mb-6 flex flex-wrap gap-2 rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.88),rgba(10,16,28,0.96))] p-2.5 font-semibold shadow-[0_22px_48px_rgba(0,0,0,0.22)]
                                    [&_button]:!min-h-[48px]
                                    [&_button]:!rounded-2xl
                                    [&_button]:!border
                                    [&_button]:!border-transparent
                                    [&_button]:!bg-transparent
                                    [&_button]:!px-4
                                    [&_button]:!py-2.5
                                    [&_button]:!text-sm
                                    [&_button]:!font-semibold
                                    [&_button]:!text-slate-200
                                    [&_button]:!transition-all
                                    [&_button]:!duration-200
                                    [&_button:hover]:!border-white/10
                                    [&_button:hover]:!bg-white/[0.05]
                                    [&_button[data-active='true']]:!border-bright-sun-300/20
                                    [&_button[data-active='true']]:!bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(245,158,11,0.14))]
                                    [&_button[data-active='true']]:!text-bright-sun-100
                                    [&_button[data-active='true']]:!shadow-[0_12px_30px_rgba(251,191,36,0.16)]
                                ">
                    <Tabs.Tab value="overview">Overview</Tabs.Tab>
                                    <Tabs.Tab value="applicants">Applicants <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-100">{applicantCounts.applicants}</span>{tabRiskCounts.applicants > 0 && <span className={`ml-2 inline-block h-2.5 w-2.5 rounded-full animate-pulse ${getRiskDotClass(tabRiskLevels.applicants)}`} title={getRiskDotTitle("applicants")} />}</Tabs.Tab>
                                    <Tabs.Tab value="screening">Screening <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-100">{applicantCounts.screening}</span>{tabRiskCounts.screening > 0 && <span className={`ml-2 inline-block h-2.5 w-2.5 rounded-full animate-pulse ${getRiskDotClass(tabRiskLevels.screening)}`} title={getRiskDotTitle("screening")} />}</Tabs.Tab>
                                    <Tabs.Tab value="invited">Invited <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-100">{applicantCounts.invited}</span>{tabRiskCounts.invited > 0 && <span className={`ml-2 inline-block h-2.5 w-2.5 rounded-full animate-pulse ${getRiskDotClass(tabRiskLevels.invited)}`} title={getRiskDotTitle("invited")} />}</Tabs.Tab>
                                    <Tabs.Tab value="offered">Shortlisted <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-100">{applicantCounts.offered}</span>{tabRiskCounts.offered > 0 && <span className={`ml-2 inline-block h-2.5 w-2.5 rounded-full animate-pulse ${getRiskDotClass(tabRiskLevels.offered)}`} title={getRiskDotTitle("offered")} />}</Tabs.Tab>
                                    <Tabs.Tab value="hired">Hired <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-100">{applicantCounts.hired}</span>{tabRiskCounts.hired > 0 && <span className={`ml-2 inline-block h-2.5 w-2.5 rounded-full animate-pulse ${getRiskDotClass(tabRiskLevels.hired)}`} title={getRiskDotTitle("hired")} />}</Tabs.Tab>
                                    <Tabs.Tab value="rejected">Rejected <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-100">{applicantCounts.rejected}</span>{tabRiskCounts.rejected > 0 && <span className={`ml-2 inline-block h-2.5 w-2.5 rounded-full animate-pulse ${getRiskDotClass(tabRiskLevels.rejected)}`} title={getRiskDotTitle("rejected")} />}</Tabs.Tab>
                </Tabs.List>
                <div className="-mt-3 mb-5 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
                    <span className="font-semibold text-slate-200">Kanban Eligibility</span>
                    <span className="mx-2 text-slate-500">|</span>
                    Applicants: {applicantCounts.applicants}
                    <span className="mx-2 text-slate-500">|</span>
                    Screening: {applicantCounts.screening}
                    <span className="mx-2 text-slate-500">|</span>
                    Invited: {applicantCounts.invited}
                    <span className="mx-2 text-slate-500">|</span>
                    Active columns: {activeKanbanColumns}/2 required
                    <span className="mx-2 text-slate-500">|</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-amber-500/12 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
                        <span className="h-2 w-2 rounded-full bg-amber-300" /> Warning
                    </span>
                    <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-rose-300/35 bg-rose-500/12 px-2 py-0.5 text-[11px] font-semibold text-rose-100">
                        <span className="h-2 w-2 rounded-full bg-rose-300" /> Critical
                    </span>
                </div>
                <Tabs.Panel value="overview" className="[&>div]:w-full">{props.jobStatus=="CLOSED"?<Job {...props} edit={true} closed />:<Job {...props} edit={true}  />}</Tabs.Panel>
                <Tabs.Panel value="applicants">{renderApplicantPanel("applicants")}</Tabs.Panel>
                <Tabs.Panel value="screening">{renderApplicantPanel("screening")}</Tabs.Panel>
                <Tabs.Panel value="invited">{renderApplicantPanel("invited", "invited")}</Tabs.Panel>
                <Tabs.Panel value="offered">{renderApplicantPanel("offered", "offered")}</Tabs.Panel>
                <Tabs.Panel value="hired">{renderApplicantPanel("hired", "offered")}</Tabs.Panel>
                <Tabs.Panel value="rejected">{renderApplicantPanel("rejected", "offered")}</Tabs.Panel>
                
            </Tabs>
            )}
        </div></>:<div className="flex min-h-[70vh] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl font-semibold text-white">Job Not Found.</div>}
    </div>
}
export default PostedJobDesc;