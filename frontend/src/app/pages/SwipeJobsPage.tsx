import SwipeJobs from "../features/swipe-jobs/SwipeJobs";

const SwipeJobsPage = () => {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.12),transparent_34%),linear-gradient(180deg,#04070f_0%,#0a1020_58%,#05070d_100%)] font-['poppins']">
            <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-bright-sun-400/15 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-36 h-72 w-72 rounded-full bg-pink-500/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl" />

            <div className="relative mx-auto w-full max-w-[1280px] px-3 pb-8 pt-4 sm:px-4 sm:pt-5">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-sm">
                    <SwipeJobs />
                </div>
            </div>
        </div>
    );
};

export default SwipeJobsPage;
