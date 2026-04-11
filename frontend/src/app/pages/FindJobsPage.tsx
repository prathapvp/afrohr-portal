import { useState } from "react";
import { Button, Divider } from "@mantine/core";
import { IconBolt, IconSearch, IconX } from "@tabler/icons-react";
import { Link } from "react-router";
import CandidateFlowNav, { type CandidateBreadcrumbItem } from "../components/navigation/CandidateFlowNav";
import SearchBar from "../features/find-jobs/SearchBar";
import Jobs from "../features/find-jobs/Jobs";
import {
    CANDIDATE_FLOW_ROUTE,
    getCandidateShortcuts,
} from "../navigation/candidateFlowNav";
import { useAppDispatch } from "../store";
import { updateFilter } from "../store/slices/FilterSlice";

interface FindJobsPageProps {
    embedded?: boolean;
}

const FindJobsPage = ({ embedded = false }: FindJobsPageProps) => {
    const dispatch = useAppDispatch();
    const [keyword, setKeyword] = useState("");
    const shortcuts = getCandidateShortcuts(["dashboard", "jobHistory", "swipe"]);
    const breadcrumbs: CandidateBreadcrumbItem[] = [
        { label: "Candidate Dashboard", to: CANDIDATE_FLOW_ROUTE.dashboard },
        { label: "Find Jobs", activeTone: "cyan" },
    ];

    const handleKeywordSearch = () => {
        const trimmed = keyword.trim();
        if (trimmed) {
            dispatch(updateFilter({ "Job Title": [trimmed] }));
        }
    };

    const handleChipClick = (chip: string) => {
        dispatch(updateFilter({ "Job Title": [chip] }));
    };

    const POPULAR = ["React Developer", "Data Analyst", "Product Manager", "Remote", "UX Designer", "Python Engineer"];

    return (
        <div className={`relative overflow-hidden font-['poppins'] ${embedded ? "min-h-0 bg-transparent" : "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.08),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_30%),linear-gradient(180deg,#060910_0%,#0b1220_58%,#05070d_100%)]"}`}>
            {/* ambient glows */}
            {!embedded && <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-bright-sun-400/15 blur-3xl" />}
            {!embedded && <div className="pointer-events-none absolute right-0 top-32 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />}
            {!embedded && <div className="pointer-events-none absolute left-1/3 top-64 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />}

            <div className={`relative mx-auto w-full max-w-[1400px] px-3 sm:px-4 ${embedded ? "pb-2 pt-1" : "pb-10 pt-6"}`}>

                {!embedded && <CandidateFlowNav breadcrumbs={breadcrumbs} shortcuts={shortcuts} breadcrumbsClassName="mb-4" shortcutsClassName="mb-4" />}
                {embedded && (
                    <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-cyan-200/70">Candidate Section</div>
                        <h2 className="mt-1 text-xl font-bold text-white">Find Jobs</h2>
                    </div>
                )}

                {/* ── Hero Banner ── */}
                <div className={`mb-5 overflow-hidden rounded-3xl border border-white/10 p-6 shadow-[0_28px_72px_rgba(0,0,0,0.5)] sm:p-8 ${embedded ? "bg-[linear-gradient(130deg,rgba(15,26,51,0.92),rgba(12,33,66,0.9)_45%,rgba(10,54,85,0.86))]" : "bg-[linear-gradient(130deg,rgba(17,28,62,0.95),rgba(10,38,80,0.92)_45%,rgba(8,62,100,0.88))]"}`}>
                    <div className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-bright-sun-400/15 blur-3xl" />

                    {/* eyebrow + headline */}
                    <div className="relative mb-5 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                                <IconBolt size={11} stroke={2.5} />
                                Job Discovery
                            </div>
                            <h1 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-[2.4rem]">
                                Find Your Next Great Role
                            </h1>
                            <p className="mt-1.5 max-w-xl text-sm text-slate-300/80">
                                Thousands of curated opportunities across Africa, the Middle East and beyond — matched to your skills.
                            </p>
                        </div>
                        {!embedded && (
                            <Link
                                to="/job-history"
                                className="shrink-0 rounded-full border border-cyan-300/40 bg-cyan-400/15 px-4 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/25"
                            >
                                Job History →
                            </Link>
                        )}
                    </div>

                    {/* keyword search row */}
                    <div className="relative flex flex-col gap-2 sm:flex-row">
                        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/20 bg-white/95 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                            <IconSearch size={18} className="shrink-0 text-slate-400" />
                            <input
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleKeywordSearch()}
                                placeholder="Job title, skill, or company…"
                                className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                            />
                            {keyword && (
                                <button onClick={() => setKeyword("")} className="text-slate-400 transition hover:text-slate-600">
                                    <IconX size={15} />
                                </button>
                            )}
                        </div>
                        <Button
                            size="md"
                            onClick={handleKeywordSearch}
                            variant="gradient"
                            gradient={{ from: "brightSun.5", to: "orange.6", deg: 90 }}
                            className="min-w-[120px] font-semibold"
                        >
                            Search Jobs
                        </Button>
                    </div>

                    {/* popular chips */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-slate-400">Popular:</span>
                        {POPULAR.map((chip) => (
                            <button
                                key={chip}
                                onClick={() => handleChipClick(chip)}
                                className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[11px] font-medium text-slate-300 transition hover:border-bright-sun-400/40 hover:bg-bright-sun-400/10 hover:text-bright-sun-200"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>

                    {/* stats row */}
                    <div className="mt-5 flex flex-wrap gap-5 border-t border-white/10 pt-4">
                        {[
                            { label: "Live Jobs", value: "2,400+" },
                            { label: "Companies Hiring", value: "180+" },
                            { label: "Countries", value: "30+" },
                            { label: "New This Week", value: "340+" },
                        ].map((s) => (
                            <div key={s.label} className="flex flex-col">
                                <span className="text-lg font-black text-bright-sun-300">{s.value}</span>
                                <span className="text-[11px] text-slate-400">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Filters + Results ── */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-5 shadow-[0_22px_60px_rgba(0,0,0,0.38)] backdrop-blur-sm sm:px-5">
                    <SearchBar />
                    <Divider size="xs" color="dark.6" my="sm" />
                    <Jobs />
                </div>
            </div>
        </div>
    );
}
export default FindJobsPage;