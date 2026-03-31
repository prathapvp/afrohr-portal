import { Button, Divider } from "@mantine/core";
import ApplyJobComp from "../features/apply-job/ApplyJobComp";
import { useNavigate, useParams } from "react-router";
import { IconArrowLeft } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getJob } from "../services/JobService";
import { hideOverlay, showOverlay } from "../store/slices/OverlaySlice";
import { useDispatch } from "react-redux";
const ApplyJobPage = () => {
    const navigate=useNavigate();
    const dispatch=useDispatch();
    const {id}=useParams();
    const [job, setJob] = useState<any>(null);
    useEffect(()=>{
        window.scrollTo(0,0);
        dispatch(showOverlay());
        getJob(id).then((res)=>{
            setJob(res);
        }).catch((err)=>console.log(err))
        .finally(()=>dispatch(hideOverlay()));
    },[id])
    return <div className="min-h-[90vh] bg-[radial-gradient(circle_at_15%_20%,#1f2a44_0%,#0a0f1a_35%,#070b14_100%)] font-['poppins'] px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto mb-6 w-full max-w-6xl rounded-3xl border border-white/15 bg-[linear-gradient(120deg,rgba(8,14,30,0.92),rgba(10,20,40,0.78))] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
                <Button color="brightSun.4" onClick={()=>navigate(-1)} leftSection={<IconArrowLeft size={20} />} variant="light">Back</Button>
                <div className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                    Premium Apply Flow
                </div>
            </div>
            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Career Application</div>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Apply With Confidence</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-[15px]">Complete your details, review everything in one place, and submit a polished application in minutes.</p>
                </div>
            </div>
            <Divider size="xs" color="rgba(255,255,255,0.18)" />
        </div>

        <ApplyJobComp {...job}/>
    </div>
}
export default ApplyJobPage;