
import Sort from "./Sort";
import JobCard from "./JobCard";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { resetFilter, updateFilter } from "../../store/slices/FilterSlice";
import { Button } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import { useJobsController } from "./useJobsController";
import type { FindJobsFilters, JobListItem } from "./types";

const FILTER_LABELS: Record<string, string> = {
    "Job Title": "Title",
    Location: "Location",
    Experience: "Exp",
    "Job Type": "Type",
};

const PAGE_QUERY_PARAM = "findJobsPage";

const parsePageParam = (value: string | null): number => {
    const parsed = value ? Number.parseInt(value, 10) : 1;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const Jobs = () => {
    const { dispatch, filter, filteredJobs, fetchError, isFetchingJobs, retryJobsFetch } = useJobsController();
    const [queryParams, setQueryParams] = useSearchParams();
    const queryPage = queryParams.get(PAGE_QUERY_PARAM);
    const [page, setPage] = useState(() => parsePageParam(queryPage));
    const pageSize = 6;

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

    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageStart = (safePage - 1) * pageSize;
    const pagedJobs = filteredJobs.slice(pageStart, pageStart + pageSize);

    useEffect(() => {
        const nextPage = parsePageParam(queryPage);
        setPage((current) => (current === nextPage ? current : nextPage));
    }, [queryPage]);

    useEffect(() => {
        setQueryParams((prev) => {
            const next = new URLSearchParams(prev);
            if (safePage <= 1) {
                next.delete(PAGE_QUERY_PARAM);
            } else {
                next.set(PAGE_QUERY_PARAM, String(safePage));
            }
            return next;
        }, { replace: true });
    }, [safePage, setQueryParams]);

    useEffect(() => {
        setPage(1);
    }, [filter, filteredJobs.length]);

    return (
        <div className="px-1 py-3 sm:px-2">
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(8,47,73,0.28),rgba(15,23,42,0.42))] px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.24)]">
                <div>
                    <div className="text-[11px] uppercase tracking-[0.15em] text-slate-400/90">Recommendations</div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xl font-semibold text-white">
                        Recommended Jobs
                        <span className="inline-flex items-center rounded-full border border-cyan-300/35 bg-cyan-400/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-100">
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
                            className="inline-flex items-center gap-1 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-100"
                        >
                            <span className="text-cyan-300/70">{FILTER_LABELS[chip.key] ?? chip.key}:</span>
                            {chip.value}
                            <button onClick={() => removeChip(chip.key, chip.value)} className="ml-0.5 text-cyan-300/60 hover:text-cyan-200 transition">
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
                <>
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {pagedJobs.map((job: JobListItem) => (
                        <JobCard key={job.id} {...job} />
                    ))}
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-300/20 bg-white/[0.03] px-3 py-2">
                    <span className="text-xs text-slate-400">
                        Showing {Math.min(pageStart + 1, filteredJobs.length)}-{Math.min(pageStart + pageSize, filteredJobs.length)} of {filteredJobs.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={safePage === 1}
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-2 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <IconChevronLeft size={14} /> Prev
                        </button>
                        <span className="px-1 text-xs text-slate-300">
                            Page {safePage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={safePage === totalPages}
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-2 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next <IconChevronRight size={14} />
                        </button>
                    </div>
                </div>
                </>
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