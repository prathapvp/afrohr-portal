import { Button, Divider } from "@mantine/core";
import Profile from "../features/talent-profile/Profile";
import RecommendTalent from "../features/talent-profile/RecommendTalent";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { getAllProfiles } from "../services/profile-service";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../store/slices/OverlaySlice";

const TalentProfilePage = () => {
    const navigate=useNavigate();
    const dispatch=useDispatch();
    const [talents, setTalents] = useState<any>([]);
    useEffect(() => {
        dispatch(showOverlay());
        getAllProfiles().then((res) => {
            setTalents(res);
        }).catch((err) => console.log(err))
        .finally(()=>dispatch(hideOverlay()));
    },[dispatch])
    return (
        <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_36%),linear-gradient(180deg,#060910_0%,#0b1324_60%,#05080f_100%)] font-['poppins'] p-4 sm:p-6">
            <div className="pointer-events-none absolute -left-16 top-20 h-64 w-64 rounded-full bg-bright-sun-400/18 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-40 h-72 w-72 rounded-full bg-cyan-400/18 blur-3xl" />

            <div className="relative mx-auto w-full max-w-[1440px]">
                <section className="premium-enter mb-6 rounded-3xl border border-white/10 bg-[linear-gradient(120deg,rgba(8,14,30,0.9),rgba(10,20,40,0.7))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                    <Button onClick={()=>navigate(-1)} color="brightSun.4" leftSection={<IconArrowLeft size={20} />} variant="light">Back</Button>
                        <div className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">Talent Intelligence</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Candidate Showcase</div>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Talent Profile</h1>
                        <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-[15px]">Review candidate story, skills, and achievements in a polished premium layout built for fast hiring decisions.</p>
                    </div>
                    <Divider className="mt-5" size="xs" color="rgba(255,255,255,0.18)" />
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="premium-enter rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_20px_52px_rgba(0,0,0,0.32)] [animation-delay:60ms] sm:p-4">
                        <Profile />
                    </div>
                    <aside className="premium-enter rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_20px_52px_rgba(0,0,0,0.32)] [animation-delay:120ms] sm:p-4 lg:sticky lg:top-24 lg:h-fit">
                        <RecommendTalent talents={talents} />
                    </aside>
                </div>
            </div>
        </div>
    )
}
export default TalentProfilePage;