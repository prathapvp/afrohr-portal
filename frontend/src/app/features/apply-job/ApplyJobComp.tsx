import {  Divider} from "@mantine/core";
import { timeAgo } from "../../services/utilities";
import ApplicationForm from "./ApplicationForm";

const ApplyJobComp = (props:any) => {
    const postedTime = props.postTime ? timeAgo(props.postTime) : "Recently posted";
    const safePostedTime = postedTime && !postedTime.toLowerCase().includes("nan") ? postedTime : "Recently posted";
    const applicantsCount = Array.isArray(props.applicants) ? props.applicants.length : 0;

    return <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 rounded-2xl border border-white/15 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-blue-950/60 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[.05] p-3 shadow-inner">
                        <img className="h-14 w-14 rounded-md object-contain xs-mx:h-10 xs-mx:w-10" src={`/Icons/${props.company}.png`} alt="" />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-2xl font-semibold text-white xs-mx:text-xl">{props.jobTitle || "Job Application"}</div>
                        <div className="mt-1 flex flex-wrap gap-x-2 text-sm text-slate-300 xs-mx:text-xs">
                            <span>{props.company || "Company"}</span>
                            <span>&bull;</span>
                            <span>{safePostedTime}</span>
                            {applicantsCount > 0 && (
                                <>
                                    <span>&bull;</span>
                                    <span>{applicantsCount} Applicants</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-cyan-100">
                    Guided Flow
                </div>
            </div>
            <Divider size="xs" my="lg" color="rgba(255,255,255,0.18)" />
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 sm:p-6">
                <ApplicationForm jobId={props.id} />
            </div>
        </div>
    </div>
}
export default ApplyJobComp;