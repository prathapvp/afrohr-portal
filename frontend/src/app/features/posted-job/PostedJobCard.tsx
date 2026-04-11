import { Link, useParams } from "react-router";
import { timeAgo } from "../../services/utilities";

interface PostedJobCardProps {
    id?: number;
    jobTitle?: string;
    location?: string;
    jobStatus?: "ACTIVE" | "DRAFT" | "CLOSED" | string;
    postTime?: string;
}

const PostedJobCard=(props: PostedJobCardProps)=>{
    const {id}=useParams();
    const statusLabel = props.jobStatus === "DRAFT" ? "Drafted" : props.jobStatus === "CLOSED" ? "Closed" : "Posted";
    const isActive = String(props.id) === id;

    return <Link data-aos="fade-up" to={`/posted-jobs/${props.id}`} className={`group cursor-pointer rounded-2xl border p-3 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${isActive?"border-emerald-400/45 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 text-white":"border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20"}`}>
        <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400">#{props.id}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${props.jobStatus === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300" : props.jobStatus === "DRAFT" ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"}`}>{props.jobStatus || "ACTIVE"}</span>
        </div>
        <div className="line-clamp-2 text-sm font-semibold text-white">{props.jobTitle}</div>
        <div className="mt-1 text-xs font-medium text-slate-300">{props.location}</div>
        <div className="mt-2 text-xs text-slate-400">{statusLabel} {timeAgo(props.postTime)}</div>
    </Link>
}
export default PostedJobCard;