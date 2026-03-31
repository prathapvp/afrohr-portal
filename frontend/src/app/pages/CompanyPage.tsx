import { Button, Divider } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import Company from "../features/company-profile/Company";
import SimilarCompanies from "../features/company-profile/SimilarCompanies";

const CompanyPage = () => {
    const navigate = useNavigate();
    return (
        <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_34%),linear-gradient(180deg,#060910_0%,#0b1324_58%,#05080f_100%)] font-['poppins'] p-4">
            <div className="pointer-events-none absolute -left-16 top-16 h-64 w-64 rounded-full bg-cyan-400/16 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-36 h-72 w-72 rounded-full bg-bright-sun-400/16 blur-3xl" />

            <div className="relative mx-auto w-full max-w-[1400px]">
                <Divider/>
                <div className="my-4 flex items-center justify-between gap-3">
                    <Button size="sm" onClick={() => navigate(-1)} color="brightSun.4" leftSection={<IconArrowLeft size={20} />} variant="light">Back</Button>
                    <div className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white">Company Spotlight</div>
                </div>
                <div className="flex justify-between gap-5">
                    <div className="flex-1 rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_20px_52px_rgba(0,0,0,0.32)]">
                        <Company/>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_20px_52px_rgba(0,0,0,0.32)]">
                        <SimilarCompanies/>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default CompanyPage;