import { Button, Divider } from "@mantine/core";
import Profile from "../features/talent-profile/Profile";
import RecommendTalent from "../features/talent-profile/RecommendTalent";
import { IconArrowLeft } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllProfiles } from "../services/ProfileService";
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
    },[])
    return (
        <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_36%),linear-gradient(180deg,#060910_0%,#0b1324_60%,#05080f_100%)] font-['poppins'] p-4">
            <div className="pointer-events-none absolute -left-16 top-20 h-64 w-64 rounded-full bg-bright-sun-400/18 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-40 h-72 w-72 rounded-full bg-cyan-400/18 blur-3xl" />

            <div className="relative mx-auto w-full max-w-[1400px]">
                <Divider size="xs" mx="md" />
                <div className="my-4 flex items-center justify-between gap-3">
                    <Button onClick={()=>navigate(-1)} color="brightSun.4" leftSection={<IconArrowLeft size={20} />} variant="light">Back</Button>
                    <div className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold text-cyan-100">Talent Profile</div>
                </div>
                <div className="flex gap-5 lg-mx:flex-wrap">
                    <div className="flex-1 rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_20px_52px_rgba(0,0,0,0.32)]">
                        <Profile />
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_20px_52px_rgba(0,0,0,0.32)]">
                        <RecommendTalent talents={talents} />
                    </div>
                </div>
            </div>
        </div>
    )
}
export default TalentProfilePage;