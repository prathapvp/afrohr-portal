import { Avatar, Button } from "@mantine/core";
import { IconArrowUpRight, IconMapPin } from "@tabler/icons-react";
import { Link } from "react-router";
import { useParams } from "react-router";

interface TalentItem {
    id?: number;
    picture?: string;
    name?: string;
    jobTitle?: string;
    totalExp?: number;
    location?: string;
}

interface RecommendTalentProps {
    talents?: TalentItem[];
}

const RecommendTalent = (props: RecommendTalentProps) => {
    const {id}=useParams();
    const recommended = (props.talents || []).filter((talent) => Number(talent?.id) !== Number(id)).slice(0, 4);

    const getInitials = (name: string) => {
        const parts = String(name || "Talent").trim().split(/\s+/).filter(Boolean).slice(0, 2);
        const initials = parts.map((part) => part[0]?.toUpperCase() || "").join("");
        return initials || "TL";
    };

    return <div data-aos="zoom-out">
        <div className="mb-5 rounded-2xl border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70">Curated List</div>
            <div className="mt-2 text-xl font-semibold text-white">Recommended Talent</div>
            <p className="mt-1 text-sm text-slate-300">Explore similar candidates based on profile alignment and hiring relevance.</p>
        </div>

        <div className="flex flex-col gap-4">
        {recommended.map((talent) => (
            <div key={talent?.id} className="premium-card-hover rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(16,22,40,0.9),rgba(10,15,28,0.92))] p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar size={42} src={talent?.picture ? `data:image/jpeg;base64,${talent.picture}` : undefined} color="yellow">
                            {getInitials(talent?.name)}
                        </Avatar>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">{talent?.name || "Candidate"}</div>
                            <div className="truncate text-xs text-slate-300">{talent?.jobTitle || "Role not specified"}</div>
                        </div>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-300">{talent?.totalExp ?? 0}y</div>
                </div>

                <div className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400">
                    <IconMapPin size={13} />
                    <span className="truncate">{talent?.location || "Location unavailable"}</span>
                </div>

                <div className="mt-3">
                    <Link to={`/talent-profile/${talent?.id}`}>
                        <Button fullWidth color="brightSun.4" variant="light" size="xs" rightSection={<IconArrowUpRight size={14} />}>View Profile</Button>
                    </Link>
                </div>
            </div>
        ))}
        {recommended.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">No similar candidates found right now.</div>}
        </div>
    </div>
}
export default RecommendTalent;