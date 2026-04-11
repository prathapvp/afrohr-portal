import { Avatar, Button, Skeleton } from "@mantine/core";
import { IconBriefcase, IconMapPin, IconSparkles } from "@tabler/icons-react";
import ExpCard from "./ExpCard";
import CertiCard from "./CertiCard";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { getProfile } from "../../services/profile-service";
import { useMediaQuery } from "@mantine/hooks";
import { useAppDispatch } from "../../store";
import { hideOverlay, showOverlay } from "../../store/slices/OverlaySlice";
import { errorNotification } from "../../services/NotificationService";

interface ExperienceItem {
    title?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
}

interface CertificationItem {
    issuer?: string;
    name?: string;
    issueDate?: string;
    certificateId?: string;
}

interface TalentProfile {
    id?: number;
    name?: string;
    banner?: string;
    picture?: string;
    jobTitle?: string;
    company?: string;
    location?: string;
    totalExp?: number;
    about?: string;
    mobileNumber?: string;
    phone?: string;
    email?: string;
    skills?: string[];
    experiences?: ExperienceItem[];
    certifications?: CertificationItem[];
}

const Profile = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState<TalentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const matches = useMediaQuery("(max-width: 475px)");

    const dispatch = useAppDispatch();

    useEffect(() => {
        setLoading(true);
        setError(null);
        dispatch(showOverlay());
        window.scrollTo(0, 0);

        getProfile(Number(id))
            .then((res) => {
                setProfile(res as TalentProfile);
            })
            .catch(() => {
                setError("Failed to load profile. Please try again later.");
            })
            .finally(() => {
                setLoading(false);
                dispatch(hideOverlay());
            });
    }, [id, dispatch]);

    if (loading) {
        return (
            <div className="p-4 sm:p-5">
                <Skeleton height={220} radius="lg" mb="xl" />
                <Skeleton height={28} width="42%" mb="sm" />
                <Skeleton height={18} width="62%" mb="sm" />
                <Skeleton height={18} width="36%" mb="xl" />
                <Skeleton height={120} radius="md" mb="xl" />
                <Skeleton height={84} radius="md" mb="md" />
                <Skeleton height={84} radius="md" mb="md" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-mine-shaft-300">
                <IconBriefcase size={48} stroke={1.2} className="mb-4 text-mine-shaft-500" />
                <div className="mb-1 text-lg font-medium">{error || "Profile not found"}</div>
                <div className="text-sm">The profile you are looking for does not exist or could not be loaded.</div>
            </div>
        );
    }

    const skillList = Array.isArray(profile?.skills) ? profile.skills : [];
    const visibleSkills = skillList.slice(0, 24);
    const hiddenSkillsCount = Math.max(skillList.length - visibleSkills.length, 0);
    const experiences = Array.isArray(profile?.experiences) ? profile.experiences : [];
    const certifications = Array.isArray(profile?.certifications) ? profile.certifications : [];

    const statItems = [
        { label: "Experience", value: `${profile?.totalExp ?? 0} Years` },
        { label: "Current Role", value: profile?.jobTitle || "Not specified" },
        { label: "Current Company", value: profile?.company || "Not specified" }
    ];

    const handleMessage = () => {
        const mobile = String(profile?.mobileNumber || profile?.phone || "").trim();
        const email = String(profile?.email || "").trim();

        if (mobile) {
            let decodedMobile = mobile;
            try {
                decodedMobile = decodeURIComponent(mobile);
            } catch {
                decodedMobile = mobile;
            }

            const whatsappDigits = decodedMobile.replace(/\D+/g, "");
            if (whatsappDigits) {
                window.open(`https://wa.me/${whatsappDigits}`, "_blank", "noopener,noreferrer");
                return;
            }
        }

        if (email) {
            window.open(`mailto:${email}`, "_self");
            return;
        }

        errorNotification("Contact Unavailable", "This profile does not have a phone number or email yet.");
    };

    return (
        <div data-aos="zoom-out" className="w-full">
            <section className="overflow-hidden rounded-3xl border border-white/12 bg-[linear-gradient(170deg,rgba(10,19,39,0.9),rgba(5,10,20,0.88))]">
                <div className="relative">
                    <img className="h-44 w-full object-cover sm:h-56" src={profile?.banner ? `data:image/jpeg;base64,${profile.banner}` : "/Profile/banner.svg"} alt={`${profile?.name ?? "User"} banner`} />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,7,14,0.05),rgba(4,7,14,0.65)_85%)]" />
                    <div className="absolute -bottom-14 left-5 sm:-bottom-16 sm:left-7">
                        <Avatar
                            className="!h-28 !w-28 border-4 border-[#05080f] shadow-[0_8px_24px_rgba(0,0,0,0.4)] sm:!h-32 sm:!w-32"
                            src={profile?.picture ? `data:image/jpeg;base64,${profile?.picture}` : "/avatar.svg"}
                            alt={profile?.name ?? "User avatar"}
                        />
                    </div>
                </div>

                <div className="px-5 pb-6 pt-16 sm:px-7 sm:pt-20">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{profile?.name}</h2>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-200 sm:text-base">
                                <span className="inline-flex items-center gap-1">
                                    <IconBriefcase className="h-4 w-4" stroke={1.5} />
                                    {profile?.jobTitle || "Role not specified"}
                                </span>
                                <span className="text-slate-400">|</span>
                                <span>{profile?.company || "Company not specified"}</span>
                            </div>
                            <div className="mt-2 inline-flex items-center gap-1 text-sm text-slate-300 sm:text-base">
                                <IconMapPin className="h-4 w-4" stroke={1.5} />
                                <span>{profile?.location || "Location unavailable"}</span>
                            </div>
                        </div>
                        <Button size={matches ? "sm" : "md"} color="brightSun.4" variant="light" onClick={handleMessage}>
                            Message
                        </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {statItems.map((item) => (
                            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
                                <div className="text-[11px] uppercase tracking-[0.15em] text-slate-400">{item.label}</div>
                                <div className="mt-1 text-sm font-semibold text-slate-100 sm:text-base">{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mt-5 space-y-5 sm:mt-6">
                <article className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 sm:p-6">
                    <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-cyan-200/70">About</div>
                    <h3 className="mb-3 text-2xl font-semibold text-white">Professional Summary</h3>
                    <p className="max-w-4xl whitespace-pre-wrap text-[15px] leading-8 tracking-[0.006em] text-slate-200/95">{profile?.about || "No information provided."}</p>
                </article>

                <article className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 sm:p-6">
                    <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-cyan-200/70">Skill Stack</div>
                    <h3 className="mb-4 text-2xl font-semibold text-white">Core Skills</h3>
                    {skillList.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                            {visibleSkills.map((skill: string, index: number) => (
                                <div key={index} className="rounded-full border border-bright-sun-300/25 bg-bright-sun-300/12 px-3 py-1.5 text-sm font-medium text-bright-sun-200">
                                    {skill}
                                </div>
                            ))}
                            {hiddenSkillsCount > 0 && (
                                <div className="rounded-full border border-white/20 bg-white/[0.05] px-3 py-1.5 text-sm font-medium text-slate-300">
                                    +{hiddenSkillsCount} more
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-mine-shaft-400">No skills listed yet.</div>
                    )}
                </article>

                <article className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 sm:p-6">
                    <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-cyan-200/70">Career Timeline</div>
                    <h3 className="mb-5 text-2xl font-semibold text-white">Experience</h3>
                    {experiences.length > 0 ? (
                        <div className="flex flex-col gap-4 sm:gap-5">
                            {experiences.map((exp: ExperienceItem, index: number) => (
                                <ExpCard key={index} {...exp} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-mine-shaft-400">No experience added yet.</div>
                    )}
                </article>

                <article className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 sm:p-6">
                    <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-cyan-200/70">Credentials</div>
                    <h3 className="mb-5 flex items-center gap-2 text-2xl font-semibold text-white">
                        <IconSparkles size={20} className="text-bright-sun-300" />
                        Certifications
                    </h3>
                    {certifications.length > 0 ? (
                        <div className="flex flex-col gap-4 sm:gap-5">
                            {certifications.map((certi: CertificationItem, index: number) => (
                                <CertiCard key={index} {...certi} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-mine-shaft-400">No certifications added yet.</div>
                    )}
                </article>
            </section>
        </div>
    );
};

export default Profile;
