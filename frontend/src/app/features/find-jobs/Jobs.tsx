
import Sort from "./Sort";
import JobCard from "./JobCard";
import { useMemo } from "react";
import { resetFilter } from "../../store/slices/FilterSlice";
import { Button } from "@mantine/core";
import { IconSparkles, IconX } from "@tabler/icons-react";
import { Link } from "react-router";
import { useJobsController } from "./useJobsController";
import type { JobListItem } from "./types";

const Jobs = () => {
    const { dispatch, filter, filteredJobs } = useJobsController();
    const accountType = useMemo(() => localStorage.getItem("accountType"), []);

    return <div className="px-1 py-5 sm:px-2">
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-slate-400">Recommendations</div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-2xl font-semibold text-white xs-mx:text-xl">
                    Recommended Jobs
                    {Object.keys(filter).length>0&&<Button onClick={()=>dispatch(resetFilter())} className="font-body transition duration-300" size="compact-sm" leftSection={<IconX stroke={1.5} size={18}/>} variant="filled" color="brightSun.4" autoContrast >Clear Filters</Button>}
                </div>
                <div className="mt-2 inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                    {filteredJobs.length} role{filteredJobs.length === 1 ? "" : "s"} found
                </div>
            </div>
            <div className="flex items-center gap-3">
                {accountType === "APPLICANT" && (
                    <Link to="/swipe">
                        <Button size="compact-sm" variant="gradient" gradient={{ from: "brightSun.5", to: "pink.4", deg: 90 }} leftSection={<IconSparkles size={14} stroke={2}/>}> 
                            Swipe Mode
                        </Button>
                    </Link>
                )}
                <Sort sort="job" />
            </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {
                filteredJobs.length>0?filteredJobs.map((job: JobListItem) => <JobCard key={job.id} {...job} />):<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 font-medium text-lg text-mine-shaft-200">
                    No jobs found for the selected filters.
                </div>
            }
        </div>
    </div>
}
export default Jobs;