import { Button, Divider } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Job from "../features/job-desc/Job";
import RecommendedJob from "../features/job-desc/RecommendedJob";
import { useEffect, useState } from "react";
import { getJob } from "../services/JobService";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../store/slices/OverlaySlice";

const JobPage = () => {
    const {id}=useParams();
    const dispatch=useDispatch();
    const navigate=useNavigate();
    const [job, setJob] = useState<any>(null);
    useEffect(()=>{
        window.scrollTo(0,0);
        dispatch(showOverlay());
        getJob(id).then((res)=>{
            setJob(res);
            if(res.jobStatus=="CLOSED")navigate(-1);
        }).catch((err)=>console.log(err))
        .finally(()=>dispatch(hideOverlay()));
    },[id])
    return <div className="min-h-screen bg-mine-shaft-950 font-['poppins'] p-4">
        <Divider size="xs" />
        <Link className="my-5 inline-block" to="/find-jobs">
            <Button color="brightSun.4" leftSection={<IconArrowLeft size={20} />} variant="light">Back</Button>
        </Link>
        <div className="flex gap-5 justify-around bs-mx:flex-wrap">
            <Job {...job} />
            <RecommendedJob />
        </div>
    </div>
}
export default JobPage;