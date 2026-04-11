import { Button, Divider } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import CandidateFlowNav, { type CandidateBreadcrumbItem } from "../components/navigation/CandidateFlowNav";
import JobHistory from "../features/job-history/JobHistory";
import {
    CANDIDATE_FLOW_ROUTE,
    getCandidateShortcuts,
} from "../navigation/candidateFlowNav";

interface JobHistoryPageProps {
        embedded?: boolean;
}

const JobHistoryPage = ({ embedded = false }: JobHistoryPageProps) => {
    const navigate = useNavigate();
        const shortcuts = getCandidateShortcuts(["dashboard", "findJobs", "swipe"]);
    const breadcrumbs: CandidateBreadcrumbItem[] = [
        { label: "Candidate Dashboard", to: CANDIDATE_FLOW_ROUTE.dashboard },
        { label: "Find Jobs", to: CANDIDATE_FLOW_ROUTE.findJobs },
        { label: "Job History", activeTone: "emerald" },
    ];

    return (
        <div className={`relative font-['poppins'] px-4 ${embedded ? "min-h-0 bg-transparent pb-1 pt-0" : "min-h-[90vh] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.1),transparent_34%),linear-gradient(180deg,#060910_0%,#0b1324_58%,#05080f_100%)] pb-6 pt-2"}`}>
            {!embedded && <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-emerald-400/14 blur-3xl" />}
            {!embedded && <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-pink-500/12 blur-3xl" />}

            <div className="relative mx-auto w-full max-w-[1400px]">
                {!embedded && <Divider/>}
                {!embedded && <div className="my-4 rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 shadow-[0_16px_44px_rgba(0,0,0,0.3)]">
                    {!embedded && (
                        <CandidateFlowNav
                            breadcrumbs={breadcrumbs}
                            shortcuts={shortcuts}
                            breadcrumbsClassName="mb-3"
                            shortcutsClassName="mb-3 px-3 py-2"
                        />
                    )}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200/80">Career Timeline</div>
                            <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">Your Job Activity & Application History</h1>
                        </div>
                        {!embedded && (
                            <Button
                                size="compact-sm"
                                variant="light"
                                color="green"
                                leftSection={<IconArrowLeft size={14} stroke={2} />}
                                onClick={() => navigate(-1)}
                            >
                                Back
                            </Button>
                        )}
                    </div>
                </div>}
                <div className="my-5 rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_20px_52px_rgba(0,0,0,0.32)]">
                    <JobHistory/>
                </div>
            </div>
        </div>
    )
}
export default JobHistoryPage;