import {Button, Divider, Drawer } from "@mantine/core";
import PostedJob from "../features/posted-job/PostedJob";
import PostedJobDesc from "../features/posted-job/PostedJobDesc";
import { useEffect, useState } from "react";
import { getMyPostedJobs } from "../services/job-service";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { hideOverlay, showOverlay } from "../store/slices/OverlaySlice";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { EmployerPostedJob } from "../features/employer/employer-types";

const PostedJobPage = () => {
    const navigate=useNavigate();
    const dispatch=useDispatch();
    const {id}=useParams();
    const [opened, { open, close }] = useDisclosure(false);
    const [jobList, setJobList] = useState<EmployerPostedJob[]>([]);
    const [job, setJob] = useState<EmployerPostedJob | null>(null);
    const matches = useMediaQuery('(max-width: 767px)');

    useEffect(()=>{
        window.scrollTo(0,0);
        dispatch(showOverlay());
        getMyPostedJobs().then((res)=>{
            const jobs = Array.isArray(res) ? (res as EmployerPostedJob[]) : [];
            setJobList(jobs);

            const routeJobId = Number(id ?? 0);
            if (jobs.length > 0 && routeJobId === 0) {
                const preferredJob = jobs.find((x) => x.jobStatus === "ACTIVE") ?? jobs[0];
                if (preferredJob?.id) {
                    navigate(`/posted-jobs/${preferredJob.id}`);
                }
                return;
            }

            const selected = jobs.find((item) => item.id === routeJobId) ?? null;
            setJob(selected);
            window.scrollTo(0,0);
        }).catch((err)=>console.log(err))
        .finally(()=>dispatch(hideOverlay()));
    }, [id, dispatch, navigate])
    return (
        <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_34%),linear-gradient(180deg,#060910_0%,#0b1324_58%,#05080f_100%)] font-['poppins'] px-5 pb-6 pt-2">
            <div className="pointer-events-none absolute -left-20 top-12 h-64 w-64 rounded-full bg-bright-sun-400/18 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-32 h-80 w-80 rounded-full bg-cyan-400/16 blur-3xl" />

            <div className="relative mx-auto w-full max-w-[1500px]">
            <div className="mb-5 overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-r from-emerald-900/35 via-cyan-900/25 to-slate-900/35 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                            <Sparkles className="h-3.5 w-3.5" />
                            Hiring Pipeline
                        </div>
                        <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Posted Jobs Workspace</h1>
                        <p className="mt-1 text-sm text-slate-300">Manage each posting, review applicants, and move candidates through hiring stages faster.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="light"
                            color="gray"
                            className="!h-10 !bg-white/10 !px-4 !text-sm !font-semibold !text-slate-100 !transition-all !duration-200 hover:!-translate-y-0.5 hover:!bg-white/20"
                            leftSection={<ArrowLeft className="h-4 w-4" />}
                            onClick={() => void navigate("/dashboard?tab=employers&section=viewall")}
                        >
                            Back to Posted Jobs
                        </Button>
                        {matches&&<Button size="sm" className="!h-10 !bg-emerald-500 !text-sm !font-semibold hover:!bg-emerald-400" autoContrast onClick={open}>All Jobs</Button>}
                    </div>
                </div>
            </div>
            <Divider size="xs" mx="md" />
            <Drawer opened={opened} size={230} overlayProps={{ backgroundOpacity: 0.5, blur: 4 }} onClose={close} title="All Jobs">
                <PostedJob job={job} jobList={jobList}/>   
            </Drawer>
            <div className="flex justify-around gap-5 py-5">
                {!matches&&<div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_20px_52px_rgba(0,0,0,0.32)]"><PostedJob job={job} jobList={jobList}/></div>}              
                <div className="flex-1 rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_20px_52px_rgba(0,0,0,0.32)]">
                    <PostedJobDesc {...job} />
                </div>
            </div>
            </div>
        </div>
    )
}
export default PostedJobPage;