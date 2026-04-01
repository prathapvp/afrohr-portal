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
    return <div className="w-1/5">
        <div className="text-2xl font-semibold mb-5">Jobs</div>
        <div>
            <Tabs variant="pills" autoContrast value={activeTab} onChange={(value) => setActiveTab((value as JobStatus) || "ACTIVE")}>
                <Tabs.List className="[&_button[aria-selected='false']]:bg-mine-shaft-900 font-medium">
                    <Tabs.Tab value="ACTIVE">Active [{byStatus("ACTIVE").length}]</Tabs.Tab>
                    <Tabs.Tab value="DRAFT">Drafts [{byStatus("DRAFT").length}]</Tabs.Tab>
                    <Tabs.Tab value="CLOSED">Closed [{byStatus("CLOSED").length}]</Tabs.Tab>
                </Tabs.List>
            </Tabs>
        </div>
        <div className="flex flex-col flex-wrap mt-5 gap-5">
            {
              byStatus(activeTab)
                .sort((a, b) => new Date(b.postTime ?? 0).getTime() - new Date(a.postTime ?? 0).getTime())
                .map((item, index) => <PostedJobCard key={item.id ?? index} {...item}/>) 
              
            }
        </div>
    </div>

}
export default PostedJob;