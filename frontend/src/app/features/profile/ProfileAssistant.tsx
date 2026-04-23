import { IconCircleCheck, IconSparkles } from "@tabler/icons-react";
import { useAppSelector } from "../../store";

const getString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const getStringArray = (value: unknown) => {
    if (!Array.isArray(value)) {
        return [] as string[];
    }
    return value
        .map((item) => String(item ?? "").trim())
        .filter(Boolean);
};

const getEducationTips = (profile: Record<string, unknown>) => {
    const education = Array.isArray(profile?.education) ? profile.education : [];
    if (!education.length) {
        return [
            "Add at least one education entry with Degree, Field, College, and Year of passing.",
            "Use official degree naming (for example: B.Tech, MBA, B.Sc).",
            "Keep year and institution name consistent with resume format.",
        ];
    }

    const tips = education.slice(0, 2).map((entry) => {
        const item = (entry ?? {}) as Record<string, unknown>;
        const degree = getString(item.degree);
        const field = getString(item.field);
        const college = getString(item.college);
        const year = getString(item.yearOfPassing);
        return `${degree || "Degree"} ${field ? `in ${field}` : ""} ${college ? `at ${college}` : ""} ${year ? `(${year})` : ""}`.replace(/\s+/g, " ").trim();
    });

    return [
        `Keep entries recruiter-friendly: ${tips.join("; ")}.`,
        "For each degree, ensure specialization and passing year are present.",
        "If you have certifications, add them in Certifications for better ATS ranking.",
    ];
};

type SuggestionSection = {
    title: string;
    tips: string[];
};

const buildSections = (profile: Record<string, unknown>, accountType: string): SuggestionSection[] => {
    const profileSummary = getString(profile?.profileSummary) || getString(profile?.about);
    const skills = [...new Set([...getStringArray(profile?.skills), ...getStringArray(profile?.itSkills)])];
    const experiences = Array.isArray(profile?.experiences) ? profile.experiences : [];
    const totalExp = Number(profile?.totalExp ?? 0);
    const desiredJob = ((profile?.desiredJob ?? {}) as Record<string, unknown>);
    const designations = getStringArray(desiredJob.preferredDesignations);
    const locations = getStringArray(desiredJob.preferredLocations);
    const industries = getStringArray(desiredJob.preferredIndustries);

    const summaryTips = profileSummary
        ? [
            "- Start with years of experience + domain in the first line.",
            "- Add one measurable outcome (hiring volume, time-to-hire, retention improvement).",
            "- End with the exact role you are targeting next.",
        ]
        : [
            "Add a 3-line profile summary: who you are, impact delivered, and target role.",
            "Mention your strongest industry/domain and years of experience.",
            "Include one quantified achievement to improve recruiter confidence.",
        ];

    const skillTips = skills.length >= 8
        ? [
            `Keep top 8 skills first: ${skills.slice(0, 8).join(", ")}`,
            "Add role-specific keywords recruiters search for (ATS friendly).",
            "Separate core skills and tools to improve scan readability.",
        ]
        : [
            `You currently have ${skills.length} listed skill(s); aim for at least 8-12 role-matched skills.`,
            "Include both domain skills and tool/platform skills.",
            "Prioritize skills that appear in your target job descriptions.",
        ];

    const experienceTips = experiences.length > 0 || totalExp > 0
        ? [
            "For each role, add one measurable result (for example: reduced hiring time by 20%).",
            "Use action verbs and keep each bullet to one achievement.",
            "Ensure your most recent role is listed first with accurate dates.",
        ]
        : [
            "Add at least one experience entry with title, company, duration, and achievements.",
            "If you are a fresher, add internships/projects and internship outcomes.",
            "Use numbers where possible to strengthen profile credibility.",
        ];

    const desiredJobTips = accountType === "EMPLOYER"
        ? [
            "Clarify company value proposition in one line.",
            "Add hiring focus areas and team scale.",
            "Mention industries and talent profiles you are actively hiring.",
        ]
        : [
            `Preferred designations: ${designations.length ? designations.join(", ") : "Add at least 2 target roles."}`,
            `Preferred locations: ${locations.length ? locations.join(", ") : "Add at least 2 preferred locations."}`,
            `Preferred industries: ${industries.length ? industries.join(", ") : "Add industries to improve job matching."}`,
        ];

    return [
        {
            title: "Profile Summary",
            tips: summaryTips,
        },
        {
            title: "Key Skills",
            tips: skillTips,
        },
        {
            title: "Experience",
            tips: experienceTips,
        },
        {
            title: "Education",
            tips: getEducationTips(profile),
        },
        {
            title: "Desired Job",
            tips: desiredJobTips,
        },
    ];
};

const completionScore = (profile: Record<string, unknown>) => {
    const summary = (getString(profile?.profileSummary) || getString(profile?.about)).length >= 120 ? 20 : 0;
    const skills = getStringArray(profile?.skills).length >= 8 ? 20 : 0;
    const education = (Array.isArray(profile?.education) ? profile.education.length : 0) > 0 ? 15 : 0;
    const experience = ((Array.isArray(profile?.experiences) ? profile.experiences.length : 0) > 0 || Number(profile?.totalExp ?? 0) > 0) ? 20 : 0;
    const desiredJob = (() => {
        const job = (profile?.desiredJob ?? {}) as Record<string, unknown>;
        return getStringArray(job.preferredDesignations).length >= 1 && getStringArray(job.preferredLocations).length >= 1 ? 15 : 0;
    })();
    const resume = Boolean(profile?.cvFileName) ? 10 : 0;

    return summary + skills + education + experience + desiredJob + resume;
};

const ProfileAssistant = () => {
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
    const user = useAppSelector((state) => state.user as { accountType?: string } | null);
    const accountType = user?.accountType || "";
    const sections = buildSections(profile, accountType);
    const score = completionScore(profile);

    return (
        <div className="rounded-3xl border border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(244,114,182,0.14),transparent_34%),linear-gradient(180deg,rgba(13,20,37,0.96),rgba(3,7,16,0.96))] p-4 shadow-[0_22px_54px_rgba(0,0,0,0.34)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                        <IconSparkles size={14} />
                        Profile Copilot
                    </div>
                    <p className="mt-1 text-sm text-slate-300">
                        Rule-based instant suggestions using your current profile data. No AI dependency.
                    </p>
                </div>
                <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-right">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-100/80">Strength Score</div>
                    <div className="text-lg font-semibold text-emerald-50">{score}/100</div>
                </div>
            </div>

            <div className="mt-4 space-y-3 rounded-2xl border border-white/12 bg-black/25 p-3">
                <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                    Suggestions are generated locally from profile completeness checks, so they are always available.
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {sections.map((section) => (
                        <div key={section.title} className="rounded-2xl border border-white/12 bg-slate-900/70 p-3">
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100">
                                <IconCircleCheck size={12} />
                                {section.title}
                            </div>
                            <div className="space-y-1">
                                {section.tips.map((tip) => (
                                    <p key={`${section.title}-${tip}`} className="text-sm leading-6 text-slate-200">
                                        - {tip}
                                    </p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProfileAssistant;
