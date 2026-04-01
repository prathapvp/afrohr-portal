import JobCard from "../find-jobs/JobCard";
import { CompanyJob } from "./types";

interface CompanyJobsProps {
    jobs: CompanyJob[];
    loading?: boolean;
}

const CompanyJobs=({ jobs, loading }: CompanyJobsProps)=>{
    const activeJobs = jobs.filter((job) => String(job?.jobStatus || "").toUpperCase() !== "CLOSED");

    return <div className="mt-3">
    <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-cyan-200/75">Open Roles</div>
        <div className="text-base font-semibold text-white sm:text-lg">Active jobs at this company ({activeJobs.length})</div>
    </div>

    {loading && <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-mine-shaft-300">Loading jobs...</div>}

    {!loading && activeJobs.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-mine-shaft-300">
            No active jobs are available for this company right now.
        </div>
    )}

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
    {
        activeJobs.map((job, index) => <JobCard key={index} {...job} />)
    }
</div>
 </div>
}
export default CompanyJobs;