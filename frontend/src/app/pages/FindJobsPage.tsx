import { Divider } from "@mantine/core";
import SearchBar from "../features/find-jobs/SearchBar";
import Jobs from "../features/find-jobs/Jobs";

const FindJobsPage = () => {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.1),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.1),transparent_30%),linear-gradient(180deg,#060910_0%,#0b1220_58%,#05070d_100%)] font-['poppins']">
            <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-bright-sun-400/20 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-40 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative mx-auto w-full max-w-[1400px] px-3 pb-10 pt-3 sm:px-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-5 shadow-[0_22px_60px_rgba(0,0,0,0.38)] backdrop-blur-sm sm:px-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/75">Job Discovery</div>
                            <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Find Your Next Great Role</h1>
                        </div>
                        <div className="rounded-full border border-bright-sun-400/40 bg-bright-sun-400/15 px-4 py-1.5 text-xs font-semibold text-bright-sun-200">
                            Curated premium listings
                        </div>
                    </div>

                    <Divider size="xs" mx="md" />
                    <SearchBar />
                    <Divider size="xs" mx="md" />
                    <Jobs />
                </div>
            </div>
        </div>
    )
}
export default FindJobsPage;