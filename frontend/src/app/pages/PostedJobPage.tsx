import {Button, Divider, Drawer } from "@mantine/core";
import PostedJob from "../features/posted-job/PostedJob";
import PostedJobDesc from "../features/posted-job/PostedJobDesc";
import { useEffect, useState } from "react";
import { getMyPostedJobs } from "../services/job-service";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { hideOverlay, showOverlay } from "../store/slices/OverlaySlice";

const PostedJobPage = () => {
    const navigate=useNavigate();
    const dispatch=useDispatch();
    const {id}=useParams();
    const [opened, { open, close }] = useDisclosure(false);
    const [jobList, setJobList] = useState<any>([]);
    const [job, setJob] = useState<any>(null);
    const matches = useMediaQuery('(max-width: 767px)');

    useEffect(()=>{
        window.scrollTo(0,0);
        dispatch(showOverlay());
        getMyPostedJobs().then((res)=>{
            setJobList(res);
            if(res && res.length>0 && Number(id) == 0){
                res.forEach((x:any)=>{
                    if(x.jobStatus=="ACTIVE"){
                        navigate(`/posted-jobs/${x.id}`);
                    }

                }, [])
            }
            res.forEach((item:any)=>{
                if(id==item.id)setJob(item);
            })
            window.scrollTo(0,0);
        }).catch((err)=>console.log(err))
        .finally(()=>dispatch(hideOverlay()));
    }, [id])
    return (
        <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_34%),linear-gradient(180deg,#060910_0%,#0b1324_58%,#05080f_100%)] font-['poppins'] px-5 pb-6 pt-2">
            <div className="pointer-events-none absolute -left-20 top-12 h-64 w-64 rounded-full bg-bright-sun-400/18 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-32 h-80 w-80 rounded-full bg-cyan-400/16 blur-3xl" />

            <div className="relative mx-auto w-full max-w-[1500px]">
            <Divider />
            <div className="my-4 flex items-center justify-between gap-3">
                <div className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white">Employer Command Center</div>
                {matches&&<Button size="sm" autoContrast onClick={open}>All Jobs</Button>}
            </div>
            <Drawer opened={opened} size={230} overlayProps={{ backgroundOpacity: 0.5, blur: 4 }} onClose={close} title="All Jobs">
                <PostedJob job={job} jobList={jobList}/>   
            </Drawer>
            <div className="flex justify-around gap-5 py-5">
                {!matches&&<div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_20px_52px_rgba(0,0,0,0.32)]"><PostedJob job={job} jobList={jobList}/></div>}              
                <div className="flex-1 rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_20px_52px_rgba(0,0,0,0.32)]">
                    <PostedJobDesc {...job} />
                </div>
            </div>
            </div>
        </div>
    )
}
export default PostedJobPage;