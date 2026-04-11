import { Tabs } from "@mantine/core";
import { useEffect, useState } from "react";
import PostedJobCard from "./PostedJobCard";

type JobStatus = "ACTIVE" | "DRAFT" | "CLOSED";

interface PostedJobItem {
    id?: number;
    jobStatus?: JobStatus | string;
    postTime?: string;
    jobTitle?: string;
    location?: string;
}

interface PostedJobProps {
    job?: PostedJobItem;
    jobList: PostedJobItem[];
}

const PostedJob = (props: PostedJobProps) => {

    const [activeTab, setActiveTab] = useState<JobStatus>(props.job?.jobStatus as JobStatus || "ACTIVE");
    useEffect(()=>{
        setActiveTab((props.job?.jobStatus as JobStatus) || "ACTIVE");
    },[props.job]);

    const jobs = Array.isArray(props.jobList) ? props.jobList : [];

    const byStatus = (status: JobStatus) => jobs.filter((job) => String(job?.jobStatus) === status);
    return <div className="w-full min-w-[260px] max-w-[320px]">
        <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">Navigator</div>
            <div className="mt-1 text-xl font-bold text-white">Jobs</div>
        </div>
        <div>
            <Tabs variant="pills" autoContrast value={activeTab} onChange={(value) => setActiveTab((value as JobStatus) || "ACTIVE")}>
                <Tabs.List className="gap-2 rounded-xl border border-white/15 bg-white/[0.04] p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.25)] font-semibold
                    [&_button]:!h-10
                    [&_button]:!rounded-lg
                    [&_button]:!px-3
                    [&_button]:!transition-all
                    [&_button]:!duration-200
                    [&_button[aria-selected='false']]:!border
                    [&_button[aria-selected='false']]:!border-white/15
                    [&_button[aria-selected='false']]:!bg-white/[0.03]
                    [&_button[aria-selected='false']]:!text-slate-100
                    [&_button[aria-selected='false']]:hover:!bg-white/[0.08]
                    [&_button[aria-selected='true']]:!border
                    [&_button[aria-selected='true']]:!border-bright-sun-300/40
                    [&_button[aria-selected='true']]:!bg-[linear-gradient(135deg,rgba(251,191,36,0.95),rgba(245,158,11,0.88))]
                    [&_button[aria-selected='true']]:!text-slate-950
                    [&_button[aria-selected='true']]:!shadow-[0_10px_24px_rgba(251,191,36,0.35)]
                ">
                    <Tabs.Tab value="ACTIVE">Active [{byStatus("ACTIVE").length}]</Tabs.Tab>
                    <Tabs.Tab value="DRAFT">Drafts [{byStatus("DRAFT").length}]</Tabs.Tab>
                    <Tabs.Tab value="CLOSED">Closed [{byStatus("CLOSED").length}]</Tabs.Tab>
                </Tabs.List>
            </Tabs>
        </div>
        <div className="mt-5 flex max-h-[72vh] flex-col gap-3 overflow-y-auto pr-1">
            {
              byStatus(activeTab)
                .sort((a, b) => new Date(b.postTime ?? 0).getTime() - new Date(a.postTime ?? 0).getTime())
                .map((item, index) => <PostedJobCard key={item.id ?? index} {...item}/>) 
              
            }
        </div>
    </div>

}
export default PostedJob;