import { Divider, Tabs } from "@mantine/core";
import Card from "./Card";
import { useEffect, useState } from "react";
import { getAllJobs } from "../../services/JobService";
import { useDispatch, useSelector } from "react-redux";
import { hideOverlay, showOverlay } from "../../store/slices/OverlaySlice";
import { getAllJobs as getAllJobsV3, getJobHistory } from "../../services/job-service";

const JobHistory = () => { 
    const dispatch=useDispatch();
    const user=useSelector((state:any)=>state.user);
    const profile=useSelector((state:any)=>state.profile);
    const [activeTab, setActiveTab] = useState<any>('APPLIED');
    const [jobList, setJobList] = useState<any>([]);
    const[showList, setShowList]=useState<any>([]);

    const normalizeHistoryPayload = (items: any[]) => {
        return (items || []).map((item: any) => {
            if (item?.job && typeof item.job === "object") {
                return {
                    ...item.job,
                    applicants: item.job.applicants || item.applicants,
                };
            }
            return item;
        });
    };

    const loadTabData = async (value: string) => {
        if (!user?.id) {
            setShowList([]);
            return;
        }

        if (value === "SAVED") {
            const allJobs = await getAllJobsV3();
            const savedSet = new Set<number>(profile?.savedJobs || []);
            setJobList(allJobs || []);
            setShowList((allJobs || []).filter((job: any) => savedSet.has(job.id)));
            return;
        }

        const historyItems = await getJobHistory(user.id, value);
        setShowList(normalizeHistoryPayload(historyItems));
    };
    
    useEffect(()=>{
        dispatch(showOverlay());
        loadTabData("APPLIED").catch((err)=>{
            // fallback to legacy behavior when v3 history endpoint is unavailable
            getAllJobs().then((res)=>{
                setJobList(res);
                setShowList(res.filter((job:any)=>{
                    let found=false;
                    job.applicants?.forEach((applicant:any)=>{
                        if(applicant.applicantId==user.id && applicant.applicationStatus=="APPLIED")found=true;
                    }) 
                    return found;
                }));
            }).catch((legacyErr)=>console.log(legacyErr));
            console.log(err);
        })
        .finally(()=>dispatch(hideOverlay()));
    }, [user?.id, profile?.savedJobs])

    const handleTabChange = (value: string | null) => {
        if (!value) return;
        setActiveTab(value);
        dispatch(showOverlay());
        loadTabData(value)
            .catch((err) => {
                console.log(err);
                // fallback to legacy in case of API mismatch
                if(value=="SAVED"){
                    setShowList(jobList.filter((job:any)=>profile?.savedJobs?.includes(job.id)));
                }else {
                    setShowList(jobList.filter((job:any)=>{
                        let found=false;
                        job.applicants?.forEach((applicant:any)=>{
                            if(applicant.applicantId==user.id && applicant.applicationStatus==value)found=true;
                        }) 
                        return found;
                    }));
                }
            })
            .finally(() => dispatch(hideOverlay()));
    }
    return <div>
        <div className="text-2xl font-semibold mb-5">Job History</div>
        <div>
            <Tabs  value={activeTab} onChange={handleTabChange} radius="lg" autoContrast variant="outline">
                <Tabs.List className="font-semibold [&_button[data-active='true']]:!border-b-mine-shaft-950 [&_button]:!text-xl sm-mx:[&_button]:!text-lg  xs-mx:[&_button]:!text-base xsm-mx:[&_button]:!text-sm xs-mx:[&_button]:!px-1.5 xs-mx:[&_button]:!py-2 mb-5 [&_button[data-active='true']]:text-bright-sun-400 xs-mx:font-medium">
                    <Tabs.Tab value="APPLIED">Applied</Tabs.Tab>
                    <Tabs.Tab value="SAVED"> Saved</Tabs.Tab>
                    <Tabs.Tab value="OFFERED">Shortlisted</Tabs.Tab>
                    <Tabs.Tab value="INTERVIEWING">In Progress</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value={activeTab} className="[&>div]:w-full">
                    <div className="flex mt-10 flex-wrap gap-5">
                        {
                            showList.length>0?showList.map((item:any, index:any)=> <Card key={index} {...item} {...{ [activeTab.toLowerCase()]: true }} />):<div className="text-lg font-medium">Nothing to show..</div>
                        }
                    </div>
                </Tabs.Panel>

            </Tabs>
        </div>
    </div>
}
export default JobHistory;