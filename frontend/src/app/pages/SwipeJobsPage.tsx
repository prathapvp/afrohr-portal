import CandidateFlowNav, { type CandidateBreadcrumbItem } from "../components/navigation/CandidateFlowNav";
import { CANDIDATE_FLOW_ROUTE, getCandidateShortcuts } from "../navigation/candidateFlowNav";
import SwipeJobs from "../features/swipe-jobs/SwipeJobs";

interface SwipeJobsPageProps {
    embedded?: boolean;
}

const SwipeJobsPage = ({ embedded = false }: SwipeJobsPageProps) => {
    const shortcuts = getCandidateShortcuts(["dashboard", "findJobs", "jobHistory"]);
    const breadcrumbs: CandidateBreadcrumbItem[] = [
        { label: "Candidate Dashboard", to: CANDIDATE_FLOW_ROUTE.dashboard },
        { label: "Swipe Mode", activeTone: "brightSun" },
    ];

    return (
        <div className={`relative overflow-hidden font-['poppins'] ${embedded ? "min-h-0 bg-transparent" : "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.12),transparent_34%),linear-gradient(180deg,#04070f_0%,#0a1020_58%,#05070d_100%)]"}`}>
            {!embedded && <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-bright-sun-400/15 blur-3xl" />}
            {!embedded && <div className="pointer-events-none absolute right-0 top-36 h-72 w-72 rounded-full bg-pink-500/15 blur-3xl" />}
            {!embedded && <div className="pointer-events-none absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl" />}

            <div className={`relative mx-auto w-full max-w-[1280px] px-3 sm:px-4 ${embedded ? "pb-2 pt-1" : "pb-8 pt-4 sm:pt-5"}`}>
                {!embedded && (
                    <CandidateFlowNav
                        breadcrumbs={breadcrumbs}
                        shortcuts={shortcuts}
                        breadcrumbsClassName="mb-3"
                        shortcutsClassName="mb-3"
                    />
                )}
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-sm">
                    <SwipeJobs embedded={embedded} />
                </div>
            </div>
        </div>
    );
};

export default SwipeJobsPage;
