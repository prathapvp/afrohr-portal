
import Sort from "./Sort";
import JobCard from "./JobCard";
import { useMemo } from "react";
import { resetFilter, updateFilter } from "../../store/slices/FilterSlice";
import { Button } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useJobsController } from "./useJobsController";
import type { FindJobsFilters, JobListItem } from "./types";

const FILTER_LABELS: Record<string, string> = {
    "Job Title": "Title",
    Location: "Location",
    Experience: "Exp",
    "Job Type": "Type",
};

const Jobs = () => {
    const { dispatch, filter, filteredJobs, fetchError, isFetchingJobs, retryJobsFetch } = useJobsController();
    const accountType = useMemo(() => localStorage.getItem("accountType"), []);

    // Build active filter chips (excluding salary and page)
    const activeChips = useMemo(() => {
        const chips: { key: string; value: string }[] = [];
        const f = filter as FindJobsFilters;
        const multiKeys: (keyof FindJobsFilters)[] = ["Job Title", "Location", "Experience", "Job Type"];
        for (const key of multiKeys) {
            const vals = f[key];
            if (Array.isArray(vals)) {
                vals.forEach((v) => chips.push({ key: key as string, value: v }));
            }
        }
        return chips;
    }, [filter]);

    const removeChip = (key: string, value: string) => {
        const f = filter as FindJobsFilters;
        const current = Array.isArray(f[key as keyof FindJobsFilters]) ? (f[key as keyof FindJobsFilters] as string[]) : [];
        dispatch(updateFilter({ [key]: current.filter((v) => v !== value) }));
    };

    const salaryRange = (filter as FindJobsFilters).salary;
    const hasFilters = activeChips.length > 0 || !!salaryRange;

    return (
        <div className="px-1 py-3 sm:px-2">
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div>
                    <div className="text-[11px] uppercase tracking-[0.15em] text-slate-400">Recommendations</div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xl font-semibold text-white">
                        Recommended Jobs
                        <span className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-medium text-cyan-100">
                            {filteredJobs.length} {filteredJobs.length === 1 ? "role" : "roles"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Sort sort="job" />
                </div>
            </div>

            {/* Active filter chips */}
            {hasFilters && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-500">Filtering by:</span>
                    {activeChips.map((chip) => (
                        <span
                            key={`${chip.key}-${chip.value}`}
                            className="inline-flex items-center gap-1 rounded-full border border-bright-sun-400/25 bg-bright-sun-400/10 px-2.5 py-0.5 text-[11px] font-medium text-bright-sun-200"
                        >
                            <span className="text-bright-sun-400/60">{FILTER_LABELS[chip.key] ?? chip.key}:</span>
                            {chip.value}
                            <button onClick={() => removeChip(chip.key, chip.value)} className="ml-0.5 text-bright-sun-400/50 hover:text-bright-sun-300 transition">
                                <IconX size={10} stroke={2.5} />
                            </button>
                        </span>
                    ))}
                    {salaryRange && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-bright-sun-400/25 bg-bright-sun-400/10 px-2.5 py-0.5 text-[11px] font-medium text-bright-sun-200">
                            <span className="text-bright-sun-400/60">Salary:</span>
                            ${salaryRange[0]}K-${salaryRange[1]}K
                        </span>
                    )}
                    {hasFilters && (
                        <button
                            onClick={() => dispatch(resetFilter())}
                            className="text-[11px] font-medium text-slate-400 underline underline-offset-2 hover:text-slate-200 transition"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            )}

            {fetchError && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    <span>{fetchError}</span>
                    <Button
                        size="compact-sm"
                        variant="light"
                        color="red"
                        loading={isFetchingJobs}
                        onClick={retryJobsFetch}
                    >
                        Retry
                    </Button>
                </div>
            )}

            {/* Job cards */}
            {filteredJobs.length > 0 ? (
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredJobs.map((job: JobListItem) => (
                        <JobCard key={job.id} {...job} />
                    ))}
                </div>
            ) : (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] py-12 text-center">
                    <div className="text-3xl">🔍</div>
                    <p className="font-semibold text-white">No jobs match your filters</p>
                    <p className="text-sm text-slate-400">Try broadening your search or</p>
                    <Button size="compact-sm" variant="outline" color="brightSun.4" onClick={() => dispatch(resetFilter())}>
                        Clear all filters
                    </Button>
                </div>
            )}
        </div>
    );
};
export default Jobs;