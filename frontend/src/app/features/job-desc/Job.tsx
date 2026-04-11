import { ActionIcon, Badge, Button, Divider } from "@mantine/core";
import { card } from "../../data/JobDescData";
import { IconBookmark, IconBookmarkFilled } from "@tabler/icons-react";
// @ts-ignore
import DOMPurify from 'dompurify';
import { Link } from "react-router";
import { timeAgo } from "../../services/utilities";
import { useAppDispatch, useAppSelector } from "../../store";
import { useEffect, useMemo, useState } from "react";
import { changeProfile } from "../../store/slices/ProfileSlice";
import { closeMyJob } from "../../services/job-service";
import { getMyProfile, getProfile } from "../../services/profile-service";
import { errorNotification, successNotification } from "../../services/NotificationService";
import { hideOverlay, showOverlay } from "../../store/slices/OverlaySlice";
import type { JobListItem } from "../find-jobs/types";
import { Copy, ExternalLink, ListChecks, Sparkles } from "lucide-react";

type JobDetailsProps = JobListItem & {
    description?: string;
    about?: string;
    applicants?: Array<{ applicantId?: number; applicationStatus?: string }>;
    postedBy?: number;
    edit?: boolean;
    closed?: boolean;
    [key: string]: unknown;
};

type OverviewSectionId = "section-overview" | "section-skills" | "section-role-details" | "section-company";

function toProfileImageUri(rawValue?: string | null): string {
    if (typeof rawValue !== "string") {
        return "";
    }

    const cleanValue = rawValue.trim();
    if (!cleanValue) {
        return "";
    }

    if (cleanValue.startsWith("data:image/")) {
        return cleanValue;
    }

    // PNG uploads are common for logos/banners; JPEG starts with /9j/
    const mime = cleanValue.startsWith("/9j/") ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${cleanValue}`;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatPlainDescriptionToHtml(rawDescription: string): string {
    const normalized = rawDescription.replace(/\s+/g, " ").trim();
    if (!normalized) {
        return "<p>No role details provided.</p>";
    }

    const withSectionBreaks = normalized
        .replace(/(Key Responsibilities:|Responsibilities:|Requirements:|Qualifications:|Why Join Us\?|Why Join Us:|Benefits:)/gi, "\n\n$1\n")
        .trim();

    const sections = withSectionBreaks
        .split(/\n\n+/)
        .map((section) => section.trim())
        .filter(Boolean);

    const htmlSections = sections.map((section) => {
        const headingMatch = section.match(/^(Key Responsibilities:|Responsibilities:|Requirements:|Qualifications:|Why Join Us\?|Why Join Us:|Benefits:)\s*/i);
        const heading = headingMatch ? headingMatch[1].replace(/:$/, "") : null;
        const body = headingMatch ? section.slice(headingMatch[0].length).trim() : section;

        const sentences = body
            .split(/(?<=[.!?])\s+(?=[A-Z])/)
            .map((part) => part.trim())
            .filter(Boolean);

        const isBulletSection = heading
            ? /responsibilities|requirements|qualifications|benefits/i.test(heading)
            : false;

        if (heading && isBulletSection && sentences.length > 0) {
            const items = sentences.map((sentence) => `<li>${escapeHtml(sentence)}</li>`).join("");
            return `<h4>${escapeHtml(heading)}</h4><ul>${items}</ul>`;
        }

        if (heading && sentences.length > 0) {
            const paragraphs = sentences.map((sentence) => `<p>${escapeHtml(sentence)}</p>`).join("");
            return `<h4>${escapeHtml(heading)}</h4>${paragraphs}`;
        }

        if (sentences.length > 0) {
            return sentences.map((sentence) => `<p>${escapeHtml(sentence)}</p>`).join("");
        }

        return `<p>${escapeHtml(body)}</p>`;
    });

    return htmlSections.join("");
}

function formatSalaryDisplay(props: JobDetailsProps): string {
    if (props.hideSalary) {
        return "Salary hidden";
    }

    const minSalary = Number(props.packageOffered);
    const maxSalary = Number(props.maxPackageOffered);
    const hasMinSalary = Number.isFinite(minSalary) && minSalary > 0;
    const hasMaxSalary = Number.isFinite(maxSalary) && maxSalary > 0;
    const currency = typeof props.currency === "string" && props.currency.trim().length > 0
        ? props.currency.trim().toUpperCase()
        : "";
    const prefix = currency ? `${currency} ` : "";

    if (hasMinSalary && hasMaxSalary) {
        if (minSalary === maxSalary) {
            return `${prefix}${minSalary} LPA`;
        }
        return `${prefix}${minSalary} - ${maxSalary} LPA`;
    }

    if (hasMinSalary) {
        return `${prefix}${minSalary} LPA`;
    }

    if (hasMaxSalary) {
        return `${prefix}${maxSalary} LPA`;
    }

    return "Not specified";
}

function toCountryCode(country?: unknown): string {
    const raw = typeof country === "string" ? country.trim() : "";
    if (!raw) {
        return "GLB";
    }

    const normalized = raw.replace(/[^A-Za-z ]/g, " ").trim();
    if (!normalized) {
        return "GLB";
    }

    const parts = normalized.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        const initials = parts.map((part) => part[0]?.toUpperCase() ?? "").join("").slice(0, 3);
        return initials.padEnd(3, "X");
    }

    return parts[0].toUpperCase().slice(0, 3).padEnd(3, "X");
}

function formatJobCodeFallback(props: JobDetailsProps): string {
    const jobId = Number(props.id);
    if (!Number.isFinite(jobId) || jobId <= 0) {
        return "NA";
    }

    const employerId = Number(props.postedBy);
    const safeEmployerId = Number.isFinite(employerId) && employerId > 0 ? employerId : 0;
    const countryCode = toCountryCode(props.country);
    const employerCode = `EMP${String(safeEmployerId).padStart(4, "0")}`;
    const idCode = String(jobId).padStart(5, "0");
    return `${countryCode}${employerCode}${idCode}`;
}

const Job = (props: JobDetailsProps) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.user as { id?: number; accountType?: string } | null);
    const profile = useAppSelector((state) => state.profile as { savedJobs?: number[]; picture?: string | null; banner?: string | null });
    const [fallbackPicture, setFallbackPicture] = useState<string>("");
    const [fallbackBanner, setFallbackBanner] = useState<string>("");
    const [companyProfileLogo, setCompanyProfileLogo] = useState<string>("");
    const [activeSection, setActiveSection] = useState<OverviewSectionId>("section-overview");

    const handleSaveJob = () => {
        let savedJobs = profile.savedJobs ? [...profile.savedJobs] : [];
        if (savedJobs.includes(props.id)) {
            savedJobs = savedJobs.filter((jobId) => jobId !== props.id);
        } else {
            savedJobs.push(props.id);
        }
        const updatedProfile = { ...profile, savedJobs };
        dispatch(changeProfile(updatedProfile));
    }
    const [applied, setApplied] = useState(false);
    useEffect(() => {
        if (props.applicants?.filter((applicant) => applicant.applicantId === user?.id).length > 0) {
            setApplied(true);
        }
        else setApplied(false);
    }, [props, user?.id]);

    useEffect(() => {
        const isEmployerSession = String(user?.accountType ?? localStorage.getItem("accountType") ?? "").toUpperCase() === "EMPLOYER";
        if (!isEmployerSession) {
            return;
        }

        if (profile.picture && profile.banner) {
            return;
        }

        let cancelled = false;

        getMyProfile()
            .then((res) => {
                if (cancelled || !res) {
                    return;
                }

                const picture = typeof res.picture === "string" ? res.picture : "";
                const banner = typeof res.banner === "string" ? res.banner : "";
                if (!profile.picture && picture) {
                    setFallbackPicture(picture);
                }
                if (!profile.banner && banner) {
                    setFallbackBanner(banner);
                }
            })
            .catch(() => {
                // no-op; static icon/banner fallbacks already exist
            });

        return () => {
            cancelled = true;
        };
    }, [profile.banner, profile.picture, user?.accountType]);

    const profileLogo = toProfileImageUri(profile.picture || fallbackPicture);
    const profileBanner = toProfileImageUri(profile.banner || fallbackBanner);
    const isEmployerSession = String(user?.accountType ?? localStorage.getItem("accountType") ?? "").toUpperCase() === "EMPLOYER";

    useEffect(() => {
        if (isEmployerSession) {
            setCompanyProfileLogo("");
            return;
        }

        if (profileLogo) {
            setCompanyProfileLogo("");
            return;
        }

        if (!props.postedBy || !Number.isFinite(props.postedBy)) {
            setCompanyProfileLogo("");
            return;
        }

        let cancelled = false;

        getProfile(props.postedBy)
            .then((res) => {
                if (cancelled || !res) {
                    return;
                }

                const publicLogo = toProfileImageUri(typeof res.picture === "string" ? res.picture : "");
                setCompanyProfileLogo(publicLogo);
            })
            .catch(() => {
                if (!cancelled) {
                    setCompanyProfileLogo("");
                }
            });

        return () => {
            cancelled = true;
        };
    }, [profileLogo, props.postedBy, user?.accountType]);

    const rawDescription = props.description ?? "";
    const detailsHtml = /<[^>]+>/.test(rawDescription)
        ? rawDescription
        : formatPlainDescriptionToHtml(rawDescription);
    const cleanHTML = DOMPurify.sanitize(detailsHtml);
    const safeSkills = Array.isArray(props.skillsRequired) ? props.skillsRequired : [];
    const applicantsCount = props.applicants ? props.applicants.length : 0;
    const companyAbout = typeof props.about === "string" && props.about.trim().length > 0
        ? props.about
        : "Build your brand story here so candidates quickly understand your mission, culture, and why this role matters.";
    const companyLogoSrc = isEmployerSession && profileLogo ? profileLogo : companyProfileLogo || `/Icons/${props.company}.png`;
    const companyBannerSrc = isEmployerSession && profileBanner ? profileBanner : "/Profile/banner.svg";
    const postedWhen = props.postTime ? timeAgo(props.postTime) : "Recently";
    const salaryDisplay = formatSalaryDisplay(props);
    const safeJobId = Number(props.id);
    const hasSafeJobId = Number.isFinite(safeJobId) && safeJobId > 0;
    const safeWorkMode = typeof props.workMode === "string" ? props.workMode.trim() : "";
    const safeEmploymentType = typeof props.employmentType === "string" ? props.employmentType.trim() : "";
    const safeDescriptionLength = typeof props.description === "string" ? props.description.replace(/<[^>]+>/g, "").trim().length : 0;
    const safeVacancies = typeof props.vacancies === "number" ? props.vacancies : Number(props.vacancies ?? 0);

    const pipelineSnapshot = useMemo(() => {
        const applicants = props.applicants ?? [];
        const byStatus = (status: string) => applicants.filter((applicant) => String(applicant.applicationStatus ?? "").toUpperCase() === status).length;
        return {
            total: applicants.length,
            applied: byStatus("APPLIED"),
            screening: byStatus("SCREENING"),
            interviewing: byStatus("INTERVIEWING"),
            offered: byStatus("OFFERED"),
            hired: byStatus("HIRED"),
        };
    }, [props.applicants]);

    const jobHealth = useMemo(() => {
        let score = 100;
        const quickFixes: string[] = [];

        if (salaryDisplay === "Not specified") {
            score -= 15;
            quickFixes.push("Add a salary range to improve candidate conversion");
        }
        if (!safeSkills.length || safeSkills.length < 3) {
            score -= 20;
            quickFixes.push("Include at least 3 required skills");
        }
        if (!props.location || props.location.trim().length === 0) {
            score -= 10;
            quickFixes.push("Set a clear location");
        }
        if (!safeWorkMode) {
            score -= 10;
            quickFixes.push("Specify work mode (Remote/Hybrid/Onsite)");
        }
        if (!safeEmploymentType) {
            score -= 10;
            quickFixes.push("Define employment type");
        }
        if (safeDescriptionLength < 280) {
            score -= 15;
            quickFixes.push("Expand role details for better applicant quality");
        }
        if (!Number.isFinite(safeVacancies) || safeVacancies <= 0) {
            score -= 10;
            quickFixes.push("Set valid vacancy count");
        }

        return {
            score: Math.max(score, 0),
            quickFixes,
        };
    }, [salaryDisplay, safeSkills.length, props.location, safeWorkMode, safeEmploymentType, safeDescriptionLength, safeVacancies]);

    const handleCopy = async (label: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            successNotification("Copied", `${label} copied to clipboard.`);
        } catch {
            errorNotification("Copy failed", `Unable to copy ${label.toLowerCase()}.`);
        }
    };

    const copyJobCode = () => {
        const jobCode = typeof props.jobCode === "string" && props.jobCode.trim().length > 0
            ? props.jobCode
            : formatJobCodeFallback(props);
        void handleCopy("Job code", jobCode);
    };

    const copyJobLink = () => {
        const jobId = Number(props.id);
        if (!Number.isFinite(jobId) || jobId <= 0) {
            errorNotification("Copy failed", "Job link is unavailable.");
            return;
        }
        const url = `${window.location.origin}/posted-jobs/${jobId}?tab=overview&view=tabs`;
        void handleCopy("Job link", url);
    };

    const copyJobSummary = () => {
        const summary = [
            `Job: ${props.jobTitle ?? "Role"}`,
            `Company: ${props.company ?? "Company"}`,
            `Location: ${props.location ?? "Not specified"}`,
            `Salary: ${salaryDisplay}`,
            `Skills: ${safeSkills.slice(0, 6).join(", ") || "Not specified"}`,
            `Applicants: ${pipelineSnapshot.total}`,
        ].join("\n");
        void handleCopy("Job summary", summary);
    };

    const scrollToSection = (sectionId: string) => {
        const target = document.getElementById(sectionId);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    useEffect(() => {
        const sectionIds: OverviewSectionId[] = [
            "section-overview",
            "section-skills",
            "section-role-details",
            "section-company",
        ];

        const sections = sectionIds
            .map((id) => document.getElementById(id))
            .filter((element): element is HTMLElement => Boolean(element));

        if (sections.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                if (visible.length === 0) return;
                const id = visible[0].target.id as OverviewSectionId;
                setActiveSection(id);
            },
            {
                root: null,
                threshold: [0.2, 0.45, 0.7],
                rootMargin: "-18% 0px -45% 0px",
            }
        );

        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, [props.id]);

    const getSectionChipClass = (sectionId: OverviewSectionId) =>
        activeSection === sectionId
            ? "rounded-lg border border-cyan-300/45 bg-cyan-500/18 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition"
            : "rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/[0.12]";

    const handleClose = () => {
        if (props.closed) return;
        if (!props.id || !Number.isFinite(props.id)) return;
        dispatch(showOverlay())
        closeMyJob(props.id).then(() => {
            successNotification('Job Closed', 'Job has been closed successfully');
        }).catch((err) => console.log(err))
            .finally(() => dispatch(hideOverlay()));
    }

    return <div data-aos="zoom-out" className="w-full">
        <div className="premium-card-hover overflow-hidden rounded-3xl border border-white/12 bg-[linear-gradient(180deg,rgba(17,24,39,0.92),rgba(2,6,23,0.96))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:p-7">
            <div id="section-overview" className="relative flex flex-wrap items-start justify-between gap-5 overflow-hidden rounded-2xl border border-white/10 px-4 py-4">
                <img
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
                    src={companyBannerSrc}
                    alt={`${props.company ?? "Company"} background`}
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/Profile/banner.svg";
                    }}
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.8),rgba(2,6,23,0.88))]" />
                <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-lg">
                        <img
                            className="h-14 w-14 rounded-lg object-contain xs-mx:h-10 xs-mx:w-10"
                            src={companyLogoSrc}
                            alt={props.company ?? "Company"}
                            onError={(e) => {
                                const image = e.currentTarget as HTMLImageElement;
                                if (image.src.endsWith("/afrohr-logo.svg")) {
                                    return;
                                }

                                if (image.src.includes("/Icons/")) {
                                    image.src = "/afrohr-logo.svg";
                                    return;
                                }

                                image.src = `/Icons/${props.company}.png`;
                            }}
                        />
                    </div>
                    <div className="min-w-0 space-y-1 relative z-[1]">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">Job Overview</div>
                        <h1 className="truncate text-2xl font-semibold text-white xs-mx:text-xl">{props.jobTitle ?? "Job Role"}</h1>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{props.company ?? "Company"}</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Posted {postedWhen}</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{applicantsCount} Applicants</span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <Badge variant="light" color="teal">{props.jobType ?? "Not specified"}</Badge>
                            <Badge variant="light" color="blue">{props.location ?? "Location not set"}</Badge>
                            <Badge variant="light" color="orange">{props.experience ?? "Experience not set"}</Badge>
                        </div>
                    </div>
                </div>

                <div className="relative z-[1] flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                    {(props.edit || !applied) && <Link to={props.edit ? `/post-job/${props.id}` : `/apply-job/${props.id}`}>
                        <Button color="brightSun.4" size="sm" variant="light" className="!font-semibold !transition-all !duration-200 hover:!-translate-y-0.5">{props.closed ? "Reopen" : props.edit ? "Edit" : "Apply"}</Button>
                    </Link>}
                    {applied && !props.edit && <Button color="green.8" size="sm" variant="light" className="!font-semibold">Applied</Button>}
                    {props.edit && !props.closed
                        ? <Button onClick={handleClose} color="red.4" size="sm" variant="light" className="!font-semibold">Close</Button>
                        : profile.savedJobs?.includes(props.id)
                            ? <IconBookmarkFilled onClick={handleSaveJob} className="cursor-pointer rounded-full border border-white/12 bg-white/5 p-1 text-bright-sun-400" stroke={1.5} />
                            : <IconBookmark onClick={handleSaveJob} className="cursor-pointer rounded-full border border-white/12 bg-white/5 p-1 text-mine-shaft-300 hover:text-bright-sun-400" stroke={1.5} />}
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
                <div className="rounded-2xl border border-cyan-300/18 bg-cyan-500/8 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                            <ListChecks className="h-4 w-4" />
                            Pipeline Snapshot
                        </div>
                        <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs text-slate-100">{pipelineSnapshot.total} total</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <Link to={`/posted-jobs/${props.id}?tab=applicants&view=tabs`} className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-200 transition hover:bg-white/[0.1]">Applied <span className="ml-1 font-bold text-white">{pipelineSnapshot.applied}</span></Link>
                        <Link to={`/posted-jobs/${props.id}?tab=screening&view=tabs`} className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-200 transition hover:bg-white/[0.1]">Screening <span className="ml-1 font-bold text-white">{pipelineSnapshot.screening}</span></Link>
                        <Link to={`/posted-jobs/${props.id}?tab=invited&view=tabs`} className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-200 transition hover:bg-white/[0.1]">Interview <span className="ml-1 font-bold text-white">{pipelineSnapshot.interviewing}</span></Link>
                        <Link to={`/posted-jobs/${props.id}?tab=offered&view=tabs`} className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-200 transition hover:bg-white/[0.1]">Offered <span className="ml-1 font-bold text-white">{pipelineSnapshot.offered}</span></Link>
                        <Link to={`/posted-jobs/${props.id}?tab=hired&view=tabs`} className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-200 transition hover:bg-white/[0.1]">Hired <span className="ml-1 font-bold text-white">{pipelineSnapshot.hired}</span></Link>
                    </div>
                </div>

                <div className="rounded-2xl border border-emerald-300/18 bg-emerald-500/8 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100">
                            <Sparkles className="h-4 w-4" />
                            Job Health
                        </div>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${jobHealth.score >= 80 ? "border-emerald-300/35 bg-emerald-500/18 text-emerald-100" : jobHealth.score >= 60 ? "border-amber-300/35 bg-amber-500/18 text-amber-100" : "border-rose-300/35 bg-rose-500/18 text-rose-100"}`}>{jobHealth.score}/100</span>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                        <Button size="xs" variant="light" color="gray" leftSection={<Copy className="h-3.5 w-3.5" />} className="!text-xs" onClick={copyJobCode}>Copy Code</Button>
                        <Button size="xs" variant="light" color="gray" leftSection={<ExternalLink className="h-3.5 w-3.5" />} className="!text-xs" onClick={copyJobLink}>Copy Link</Button>
                        <Button size="xs" variant="light" color="gray" leftSection={<Copy className="h-3.5 w-3.5" />} className="!text-xs" onClick={copyJobSummary}>Copy Summary</Button>
                    </div>
                    {jobHealth.quickFixes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {jobHealth.quickFixes.slice(0, 3).map((fix) => (
                                <span key={fix} className="rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[11px] text-slate-200">{fix}</span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-emerald-100/90">This posting is well-optimized for applicant quality.</p>
                    )}
                </div>
            </div>

            <div className="sticky top-3 z-20 mt-4 rounded-2xl border border-white/12 bg-slate-950/75 p-2 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => scrollToSection("section-overview")} className={getSectionChipClass("section-overview")}>Overview</button>
                        <button type="button" onClick={() => scrollToSection("section-skills")} className={getSectionChipClass("section-skills")}>Skills</button>
                        <button type="button" onClick={() => scrollToSection("section-role-details")} className={getSectionChipClass("section-role-details")}>Role Details</button>
                        <button type="button" onClick={() => scrollToSection("section-company")} className={getSectionChipClass("section-company")}>Company</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button size="xs" variant="light" color="gray" leftSection={<Copy className="h-3.5 w-3.5" />} className="!text-xs" onClick={copyJobCode}>Copy Code</Button>
                        <Button size="xs" variant="light" color="gray" leftSection={<ExternalLink className="h-3.5 w-3.5" />} className="!text-xs" onClick={copyJobLink}>Copy Link</Button>
                        {props.edit && hasSafeJobId && (
                            <Link to={`/post-job/${safeJobId}`}>
                                <Button size="xs" color="brightSun.4" variant="light" className="!text-xs !font-semibold">Edit</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <Divider size="xs" my="xl" color="rgba(255,255,255,0.14)" />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {card.map((item, index) => (
                    <div key={index} className="premium-card-hover rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/55 to-slate-800/45 p-4 hover:border-bright-sun-400/25 hover:bg-slate-900/65">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">{item.name}</span>
                            <ActionIcon className="!h-8 !w-8" variant="light" color="brightSun.4" radius="xl"><item.icon className="h-4 w-4" /></ActionIcon>
                        </div>
                        <div className="text-base font-semibold text-white">
                            {item.id === "jobCode"
                                ? (typeof props.jobCode === "string" && props.jobCode.trim().length > 0
                                    ? props.jobCode
                                    : formatJobCodeFallback(props))
                                : item.id === "packageOffered"
                                ? salaryDisplay
                                : (props && props[item.id] ? String(props[item.id]) : "NA")}
                        </div>
                    </div>
                ))}
            </div>

            <Divider size="xs" my="xl" color="rgba(255,255,255,0.14)" />

            <div id="section-skills" className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                    {safeSkills.length > 0 ? safeSkills.map((skill: string, index:number) => (
                        <span key={index} className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">{skill}</span>
                    )) : (
                        <p className="text-sm text-slate-400">No required skills listed for this role.</p>
                    )}
                </div>
            </div>

            <Divider size="xs" my="xl" color="rgba(255,255,255,0.14)" />

            <div id="section-role-details" className="premium-card-hover rounded-2xl border border-white/10 bg-slate-900/40 p-5 hover:border-cyan-300/20">
                <h2 className="mb-4 text-xl font-semibold text-white">Role Details</h2>
                <div className="[&>h4]:mb-3 [&>h4]:text-lg [&>h4]:font-semibold [&>h4]:text-slate-100 [&_*]:text-slate-300 [&_li]:mb-1 [&_li]:text-sm [&_li]:marker:text-bright-sun-300 [&_p]:text-justify [&_p]:leading-6 [&_p]:text-sm" dangerouslySetInnerHTML={{ __html: cleanHTML }} />
            </div>

            <Divider size="xs" my="xl" color="rgba(255,255,255,0.14)" />

            <div id="section-company">
                <h2 className="mb-4 text-xl font-semibold text-white">About Company</h2>
                <div className="premium-card-hover relative mb-4 flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-4 hover:border-bright-sun-400/25">
                    <img
                        className="pointer-events-none absolute inset-0 h-full w-full rounded-2xl object-cover opacity-20"
                        src={companyBannerSrc}
                        alt={`${props.company ?? "Company"} company background`}
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/Profile/banner.svg";
                        }}
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(2,6,23,0.74),rgba(2,6,23,0.9))]" />
                    <div className="relative z-[1] flex items-center gap-3">
                        <div className="rounded-xl bg-mine-shaft-800 p-2">
                            <img
                                className="h-8"
                                src={companyLogoSrc}
                                alt={props.company ?? "Company"}
                                onError={(e) => {
                                    const image = e.currentTarget as HTMLImageElement;
                                    if (image.src.endsWith("/afrohr-logo.svg")) {
                                        return;
                                    }

                                    if (image.src.includes("/Icons/")) {
                                        image.src = "/afrohr-logo.svg";
                                        return;
                                    }

                                    image.src = `/Icons/${props.company}.png`;
                                }}
                            />
                        </div>
                        <div className="relative z-[1]">
                            <div className="text-lg font-medium text-white">{props.company ?? "Company"}</div>
                            <div className="text-sm text-mine-shaft-300">10k+ Employees</div>
                        </div>
                    </div>
                    <Link to={`/company/${props.company}`} className="relative z-[1]">
                        <Button color="brightSun.4" variant="light" className="!font-semibold">Company Page</Button>
                    </Link>
                </div>
                <p className="text-sm leading-6 text-slate-300">{companyAbout}</p>
            </div>
        </div>
    </div>
}
export default Job;