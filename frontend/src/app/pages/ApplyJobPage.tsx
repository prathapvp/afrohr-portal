import { Button, Divider } from "@mantine/core";
import ApplyJobComp from "../features/apply-job/ApplyJobComp";
import { useNavigate, useParams } from "react-router-dom";
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
        <div className="mx-auto mb-6 w-full max-w-6xl rounded-2xl border border-white/15 bg-white/[.04] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
                <Button color="brightSun.4" onClick={()=>navigate(-1)} leftSection={<IconArrowLeft size={20} />} variant="light">Back</Button>
                <div className="text-right">
                    <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">Career Application</div>
                    <div className="text-lg font-semibold text-white sm:text-xl">Apply With Confidence</div>
                </div>
            </div>
            <Divider size="xs" color="rgba(255,255,255,0.18)" />
        </div>

        <ApplyJobComp {...job}/>
    </div>
}
export default ApplyJobPage;