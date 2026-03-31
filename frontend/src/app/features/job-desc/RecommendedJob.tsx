import { useEffect, useState } from "react";
import { getAllJobs } from "../../services/JobService";
import { Link } from "react-router";
import { IconArrowRight, IconBuilding, IconMapPin } from "@tabler/icons-react";
import { Button } from "@mantine/core";
import { timeAgo } from "../../services/utilities";

interface RecommendedJobProps {
    currentJobId?: number;
}

const RecommendedJob = ({ currentJobId }: RecommendedJobProps) => {
    const [jobList, setJobList] = useState<any[]>([]);

    useEffect(() => {
        getAllJobs().then((res) => {
            setJobList(res);
        }).catch((err) => console.log(err));
    }, []);

    const recommended = jobList
        .filter((job) => job?.id && job?.id !== currentJobId && job?.jobStatus !== "CLOSED")
        .slice(0, 5);

    return <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-white">Recommended Jobs</h3>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                {recommended.length} matches
            </span>
        </div>

        <div className="space-y-3">
            {recommended.length === 0 && (
                <p className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-400">
                    No recommendations available right now.
                </p>
            )}

            {recommended.map((job:any) => (
                <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="block rounded-2xl border border-white/10 bg-slate-900/40 p-4 transition hover:border-cyan-300/30 hover:bg-slate-900/70"
                >
                    <div className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                        <IconBuilding size={16} className="text-cyan-300" />
                        <span className="truncate">{job.company ?? "Company"}</span>
                    </div>
                    <div className="line-clamp-1 text-base font-semibold text-white">{job.jobTitle ?? "Role"}</div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1"><IconMapPin size={14} /> {job.location ?? "Location"}</span>
                        <span>Posted {timeAgo(job.postTime || "")}</span>
                    </div>
                </Link>
            ))}
        </div>

        <Link className="mt-4 block" to="/find-jobs">
            <Button variant="light" color="brightSun.4" fullWidth rightSection={<IconArrowRight size={16} />}>
                Explore More Jobs
            </Button>
        </Link>
    </div>
}
export default RecommendedJob;