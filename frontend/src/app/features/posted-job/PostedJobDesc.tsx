import { Badge, Button, Tabs } from "@mantine/core";
import { IconLayoutKanban, IconLayoutList } from "@tabler/icons-react";
import Job from "../job-desc/Job";
import TalentCard from "../find-talent/TalentCard";
import KanbanBoard from "../employer/KanbanBoard";
import { useEffect, useMemo, useState } from "react";

type ApplicantStatus = "APPLIED" | "SCREENING" | "INTERVIEWING" | "OFFERED" | "HIRED" | "REJECTED";
type PostedJobTab = "overview" | "applicants" | "screening" | "invited" | "offered" | "hired" | "rejected";

interface PostedApplicant {
    applicantId?: number;
    applicationStatus?: ApplicantStatus | string;
    [key: string]: unknown;
}

interface PostedJobDescProps {
    jobTitle?: string;
    jobStatus?: string;
    location?: string;
    applicants?: PostedApplicant[];
    [key: string]: unknown;
}

const TAB_TO_STATUS: Partial<Record<PostedJobTab, ApplicantStatus>> = {
    applicants: "APPLIED",
    screening: "SCREENING",
    invited: "INTERVIEWING",
    offered: "OFFERED",
    hired: "HIRED",
    rejected: "REJECTED",
};

const PostedJobDesc = (props: PostedJobDescProps) => {
    const [tab, setTab]=useState<PostedJobTab>("overview");
    const [viewMode, setViewMode] = useState<"tabs" | "kanban">("tabs");

    const handleTab=(value: string | null)=>{
        if (!value) return;
        setTab(value as PostedJobTab);
    };

    const applicantsForTab = useMemo(() => {
        const status = TAB_TO_STATUS[tab];
        if (!status) {
            return [];
        }

        return (props.applicants ?? []).filter((applicant) => String(applicant.applicationStatus ?? "").toUpperCase() === status);
    }, [props.applicants, tab]);

    useEffect(()=>{
        setTab("overview");
    }, [props]);

    return <div data-aos="zoom-out" className=" w-3/4 md-mx:w-full px-5 md-mx:p-0">
        {props.jobTitle?<><div className="text-2xl xs-mx:text-xl font-semibold flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">{props?.jobTitle} <Badge variant="light" ml="sm" color="brightSun.4" size="sm">{props?.jobStatus}</Badge></div>
            <Button
                size="xs"
                variant={viewMode === "kanban" ? "filled" : "default"}
                color="brightSun.4"
                autoContrast
                leftSection={viewMode === "kanban" ? <IconLayoutList size={14}/> : <IconLayoutKanban size={14}/>}
                onClick={() => setViewMode(m => m === "tabs" ? "kanban" : "tabs")}
            >
                {viewMode === "kanban" ? "Tab View" : "Kanban View"}
            </Button>
        </div>
        <div className="font-medium xs-mx:text-sm text-mine-shaft-300 mb-5">{props?.location}</div>
        <div className="">
            {viewMode === "kanban" ? (
                <KanbanBoard applicants={props.applicants || []} />
            ) : (
            <Tabs value={tab} onChange={handleTab} radius="lg" autoContrast variant="outline">
                                <Tabs.List className="font-semibold mb-5 xs-mx:font-medium
                                    [&_button]:!text-xl sm-mx:[&_button]:!text-lg xs-mx:[&_button]:!text-base xsm-mx:[&_button]:!text-sm
                                    xs-mx:[&_button]:!px-1.5 xs-mx:[&_button]:!py-2
                                    [&_button[data-active='true']]:!text-bright-sun-400
                                    [&_button[data-active='true']]:!border-b-2
                                    [&_button[data-active='true']]:!border-bright-sun-400
                                ">
                    <Tabs.Tab value="overview">Overview</Tabs.Tab>
                    <Tabs.Tab value="applicants">Applicants</Tabs.Tab>
                    <Tabs.Tab value="screening">Screening</Tabs.Tab>
                    <Tabs.Tab value="invited">Invited</Tabs.Tab>
                    <Tabs.Tab value="offered">Shortlisted</Tabs.Tab>
                    <Tabs.Tab value="hired">Hired</Tabs.Tab>
                    <Tabs.Tab value="rejected">Rejected</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="overview" className="[&>div]:w-full">{props.jobStatus=="CLOSED"?<Job {...props} edit={true} closed />:<Job {...props} edit={true}  />}</Tabs.Panel>
                <Tabs.Panel value="applicants"><div className="flex mt-10 flex-wrap gap-5 justify-around">
                    {applicantsForTab.length?applicantsForTab.map((talent, index) =>  <TalentCard key={talent.applicantId ?? index} {...talent} posted={true}/>):"No Applicants Yet"
                    }
                </div></Tabs.Panel>
                <Tabs.Panel value="screening"><div className="flex mt-10 flex-wrap gap-5 justify-around">
                    {applicantsForTab.length?applicantsForTab.map((talent, index) =>  <TalentCard key={talent.applicantId ?? index} {...talent} posted={true}/>):"No Applicants in Screening"}
                </div></Tabs.Panel>
                <Tabs.Panel value="invited"><div className="flex mt-10 flex-wrap gap-5 justify-around">
                    {
                        applicantsForTab.length?applicantsForTab.map((talent, index) =>  <TalentCard key={talent.applicantId ?? index} {...talent} invited/>):"No Applicants Invited Yet"
                    }
                </div></Tabs.Panel>
                <Tabs.Panel value="offered"><div className="flex mt-10 flex-wrap gap-5 justify-around">
                    {
                         applicantsForTab.length?applicantsForTab.map((talent, index) =>  <TalentCard key={talent.applicantId ?? index} {...talent} offered/>):"No Applicants Offered Yet"
                    }
                </div></Tabs.Panel>
                <Tabs.Panel value="hired"><div className="flex mt-10 flex-wrap gap-5 justify-around">
                    {applicantsForTab.length?applicantsForTab.map((talent, index) =>  <TalentCard key={talent.applicantId ?? index} {...talent} offered/>):"No Applicants Hired Yet"}
                </div></Tabs.Panel>
                <Tabs.Panel value="rejected"><div className="flex mt-10 flex-wrap gap-5 justify-around">
                    {
                         applicantsForTab.length?applicantsForTab.map((talent, index) =>  <TalentCard key={talent.applicantId ?? index} {...talent} offered/>):"No Applicants Rejected Yet"
                    }
                </div></Tabs.Panel>
                
            </Tabs>
            )}
        </div></>:<div className="text-2xl font-semibold flex items-center justify-center min-h-[70vh]">Job Not Found.</div>}
    </div>
}
export default PostedJobDesc;