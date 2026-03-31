import { Button, Divider } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { Link, useNavigate, useParams } from "react-router";
import Job from "../features/job-desc/Job";
import RecommendedJob from "../features/job-desc/RecommendedJob";
import { useEffect, useState } from "react";
import { getJob } from "../services/JobService";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../store/slices/OverlaySlice";

const JobPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [job, setJob] = useState<any>(null);
    useEffect(() => {
        window.scrollTo(0, 0);
        dispatch(showOverlay());
        getJob(id).then((res) => {
            setJob(res);
            if (res.jobStatus === "CLOSED") navigate(-1);
        }).catch((err) => console.log(err))
            .finally(() => dispatch(hideOverlay()));
    }, [dispatch, id, navigate]);

    return <div className="min-h-screen bg-gradient-to-br from-[#080b14] via-[#0b1120] to-[#130f24] font-['poppins'] text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[-120px] top-[-90px] h-72 w-72 rounded-full bg-orange-400/15 blur-3xl" />
            <div className="absolute bottom-[-120px] right-[-100px] h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl p-4 pb-10 sm:p-6 lg:p-8">
            <Divider size="xs" color="rgba(255,255,255,0.16)" />

            <div className="my-5 flex items-center justify-between gap-4">
                <Link className="inline-block" to="/find-jobs">
                    <Button color="brightSun.4" leftSection={<IconArrowLeft size={20} />} variant="light">Back To Jobs</Button>
                </Link>
                <div className="hidden rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-200 md:block">
                    Premium Job View
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div>
                    {job ? (
                        <Job {...job} />
                    ) : (
                        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
                            <div className="h-8 w-3/4 animate-pulse rounded-lg bg-white/10" />
                            <div className="h-5 w-1/2 animate-pulse rounded-lg bg-white/10" />
                            <div className="h-36 animate-pulse rounded-2xl bg-white/10" />
                            <div className="h-56 animate-pulse rounded-2xl bg-white/10" />
                        </div>
                    )}
                </div>

                <div className="xl:sticky xl:top-24 xl:self-start">
                    <RecommendedJob currentJobId={id ? Number(id) : undefined} />
                </div>
            </div>
        </div>
    </div>
}
export default JobPage;