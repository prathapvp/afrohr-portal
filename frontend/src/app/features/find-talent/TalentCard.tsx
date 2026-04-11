import { Anchor, Avatar, Button, Divider, Modal, Text } from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { IconBriefcase, IconCalendarMonth, IconCoin, IconFileText, IconHeart, IconMail, IconMapPin, IconPhone, IconSchool, IconWorld } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { getProfile, getProfileByUserId } from "../../services/profile-service";
import { formatInterviewTime, openPDF, downloadPDF } from "../../services/utilities";
import { changeAppStatus } from "../../services/job-service";
import { getMyApplicantResume } from "../../services/job-service";
import { errorNotification, successNotification } from "../../services/NotificationService";

interface TalentCardProps {
    applicantId?: number;
    id?: number;
    name?: string;
    email?: string;
    mobileNumber?: string;
    phone?: number | string;
    website?: string;
    resume?: string;
    skills?: string[];
    education?: string;
    currentPosition?: string;
    ctc?: string;
    experience?: string;
    currentLocation?: string;
    coverLetter?: string;
    invited?: boolean;
    posted?: boolean;
    offered?: boolean;
    interviewTime?: string;
}

interface TalentProfile {
    id?: number;
    name?: string;
    email?: string;
    picture?: string;
    jobTitle?: string;
    company?: string;
    skills?: string[];
    itSkills?: string[];
    about?: string;
    totalExp?: number;
    location?: string;
    mobileNumber?: string;
    phone1?: string;
    websiteUrl?: string;
    education?: Array<{ degree?: string; field?: string; college?: string; yearOfPassing?: string }>;
    experiences?: Array<{ title?: string; company?: string; startDate?: string; endDate?: string; working?: boolean }>;
    personalDetails?: { currentLocation?: string };
    onlineProfiles?: Array<{ platform?: string; url?: string }>;
}

interface InterviewPayload {
    id?: string;
    applicantId?: number;
    applicationStatus: string;
    interviewTime?: Date;
}

function formatFieldValue(value: unknown, fallback = "Not provided") {
    if (Array.isArray(value)) {
        const items = value.map((item) => String(item).trim()).filter(Boolean);
        return items.length > 0 ? items.join(", ") : fallback;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : fallback;
    }

    if (typeof value === "number") {
        return String(value);
    }

    return fallback;
}

function formatEducationSummary(education?: Array<{ degree?: string; field?: string; college?: string; yearOfPassing?: string }>) {
    if (!Array.isArray(education) || education.length === 0) {
        return "";
    }

    return education
        .map((item) => [item.degree, item.field, item.college, item.yearOfPassing].map((value) => String(value ?? "").trim()).filter(Boolean).join(" • "))
        .filter(Boolean)
        .join(" | ");
}

function toWhatsappDigits(rawPhone?: string | number | null) {
    if (rawPhone === undefined || rawPhone === null) {
        return "";
    }

    const raw = String(rawPhone).trim();
    if (!raw) {
        return "";
    }

    let decoded = raw;
    try {
        decoded = decodeURIComponent(raw);
    } catch {
        decoded = raw;
    }

    return decoded.replace(/\D+/g, "");
}

const TalentCard = (props: TalentCardProps) => {
    const { id } = useParams();
    const ref = useRef<HTMLInputElement>(null);
    const [opened, { open, close }] = useDisclosure(false);
    const [app, { open: openApp, close: closeApp }] = useDisclosure(false);
    const [date, setDate] = useState<Date | null>(null);
    const [time, setTime] = useState<string>("");
    const [profile, setProfile] = useState<TalentProfile | null>(null);
    const [resumeBusy, setResumeBusy] = useState(false);
    const isPostedView = Boolean(props.posted);
    const isInvitedView = Boolean(props.invited);
    const profileSkills = useMemo(() => {
        const baseSkills = Array.isArray(profile?.skills) ? profile.skills : [];
        const itSkills = Array.isArray(profile?.itSkills) ? profile.itSkills : [];
        return [...new Set([...baseSkills, ...itSkills].map((skill) => String(skill).trim()).filter(Boolean))];
    }, [profile?.itSkills, profile?.skills]);
    const candidateName = formatFieldValue(props.name || profile?.name, "Unnamed candidate");
    const candidateEmail = typeof props.email === "string" && props.email.trim() ? props.email.trim() : (typeof profile?.email === "string" ? profile.email.trim() : "");
    const phoneValue = formatFieldValue(props.mobileNumber || props.phone || profile?.mobileNumber || profile?.phone1, "Not provided");
    const whatsappDigits = toWhatsappDigits(props.mobileNumber || props.phone || profile?.mobileNumber || profile?.phone1);
    const websiteValue = typeof (props.website || profile?.websiteUrl || profile?.onlineProfiles?.find((item) => item?.url)?.url) === "string"
        ? String(props.website || profile?.websiteUrl || profile?.onlineProfiles?.find((item) => item?.url)?.url).trim()
        : "";
    const websiteHref = websiteValue ? (websiteValue.startsWith("http://") || websiteValue.startsWith("https://") ? websiteValue : `https://${websiteValue}`) : "";
    const skillsList = (Array.isArray(props.skills) ? props.skills.filter(Boolean) : []).length > 0
        ? (props.skills ?? []).filter(Boolean)
        : profileSkills;
    const educationValue = props.education || formatEducationSummary(profile?.education);
    const currentPositionValue = props.currentPosition || profile?.jobTitle || profile?.experiences?.[0]?.title || "";
    const experienceValue = props.experience || (profile?.totalExp ? `${profile.totalExp} years` : "");
    const currentLocationValue = props.currentLocation || profile?.personalDetails?.currentLocation || profile?.location || "";
    const ctcValue = props.ctc || "";
    const coverLetterValue = props.coverLetter || profile?.about || "";

    const loadResume = async (action: "VIEW" | "DOWNLOAD") => {
        if (!props.applicantId || !id) {
            errorNotification("Resume", "Missing applicant or job identifier.");
            return;
        }
        try {
            setResumeBusy(true);
            const resumeBase64 = await getMyApplicantResume(Number(id), props.applicantId, action);
            if (action === "DOWNLOAD") {
                downloadPDF(resumeBase64, `${candidateName || "candidate"}-resume.pdf`);
            } else {
                openPDF(resumeBase64);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unable to access resume";
            errorNotification("Resume Access", message);
        } finally {
            setResumeBusy(false);
        }
    };
    const handleOffer = (status: string) => {
        const interview: InterviewPayload = { id, applicantId: profile?.id, applicationStatus: status };
        if (status === "INTERVIEWING" && date && time) {
            const [hours, minutes] = time.split(':').map(Number);
            const interviewDate = new Date(date);
            interviewDate.setHours(hours);
            interviewDate.setMinutes(minutes);
            interview.interviewTime = interviewDate;
        }
        changeAppStatus(interview).then((res) => {
            if (status === "INTERVIEWING") successNotification('Interview Scheduled', 'Interview has been scheduled successfully');
            else if (status === "OFFERED") successNotification('Offered', 'Offer has been sent successfully');
            else successNotification('Rejected', 'Offer has been rejected');
            window.location.reload();
        }).catch((err: unknown) => {
            console.log(err)
            const message =
                (err as { response?: { data?: { errorMessage?: string } } })?.response?.data?.errorMessage ??
                "Failed to update application status";
            errorNotification('Error', message);
        });

    }
    useEffect(() => {
        if (props.applicantId) getProfileByUserId(props.applicantId).then((res) => {
            setProfile(res as TalentProfile);
        }).catch(() => {
            // Fall back to legacy profile-by-ID lookup (used when applicantId is actually a profileId)
            getProfile(props.applicantId!).then((res) => setProfile(res as TalentProfile)).catch((err) => console.log(err));
        })
        else setProfile(props);
    }, [props])
    return <div data-aos="fade-up" className={`premium-card-hover flex min-w-0 flex-col gap-3 rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(17,24,39,0.9),rgba(2,6,23,0.95))] p-4 shadow-[0_16px_46px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 hover:border-bright-sun-400/30 ${isPostedView ? "w-full" : "w-96 bs-mx:w-[48%] md-mx:w-full"}`}>
        <div className="flex justify-between">
            <div className="flex gap-2 items-center">
                <div className="rounded-full border border-white/10 bg-mine-shaft-800/80 p-2">
                    <Avatar className="rounded-full" size="lg" src={profile?.picture ? `data:image/jpeg;base64,${profile?.picture}` : '/avatar.svg'} />
                </div>
                <div className="flex flex-col gap-1">
                    <div className="text-lg font-semibold text-white">{candidateName}</div>
                    <div className="text-sm text-slate-300">{profile?.jobTitle} {profile?.jobTitle && profile?.company ? <>&bull;</> : null} {profile?.company}</div>

                </div>
            </div>
            <IconHeart className="cursor-pointer text-slate-300" stroke={1.5} />
        </div>
        <div className="flex gap-2 flex-wrap ">
            {profile?.skills?.map((skill, index) => index < 4 && <div key={`${skill}-${index}`} className="rounded-full border border-bright-sun-400/25 bg-bright-sun-400/10 px-2.5 py-1 text-xs font-medium text-bright-sun-300">{skill}</div>)}
        </div>
        <div>
            <Text className="!text-xs text-justify !text-slate-300" lineClamp={3}>{profile?.about}
            </Text>
        </div>
        <Divider color="mineShaft.7" size="xs" />
        {
            isInvitedView ? <div className="flex gap-1 text-sm items-center text-slate-200">
                <IconCalendarMonth stroke={1.5} /> Interview: {formatInterviewTime(props.interviewTime)}
            </div> : <div className="flex justify-between">
                <div className="font-medium text-slate-200">Exp: {profile?.totalExp ? profile?.totalExp : 1} Years</div>
                <div className="text-xs flex gap-1 items-center text-slate-400">
                    <IconMapPin className="h-5 w-5" /> {profile?.location}
                </div>
            </div>
        }
        <Divider color="mineShaft.7" size="xs" />
        <div className="flex [&>*]:w-1/2 [&>*]:p-1">
            {
                !isInvitedView && <>
                    <Link to={`/talent-profile/${profile?.id}`}>
                        <Button color="brightSun.4" variant="outline" fullWidth>Profile</Button>
                    </Link>

                    <div>
                        {/* {props.posted ? <Button color="brightSun.4" variant="light" onClick={open} rightSection={<IconCalendarMonth className="w-5 h-5" />} fullWidth>Schedule</Button> : <Button color="brightSun.4" variant="light" fullWidth>Message</Button>} */}

                        {isPostedView ? (
                            <Button
                                color="brightSun.4"
                                variant="light"
                                onClick={openApp}
                                fullWidth
                            >
                                View Application
                            </Button>
                        ) : (
                            <Anchor
                                href={whatsappDigits ? `https://wa.me/${whatsappDigits}` : undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                            >
                                <Button color="green" variant="light" fullWidth disabled={!whatsappDigits}>
                                    WhatsApp
                                </Button>
                            </Anchor>
                        )}


                    </div>
                </>
            }{

                isInvitedView && <>
                    <div>

                        <Button onClick={() => handleOffer("OFFERED")} color="brightSun.4" variant="outline" fullWidth>Accept</Button>
                    </div>
                    <div>

                        <Button onClick={() => handleOffer("REJECTED")} color="brightSun.4" variant="light" fullWidth>Reject</Button>
                    </div>
                </>
            }
        </div>
        {isInvitedView && <Button color="brightSun.4" variant="filled" onClick={openApp} autoContrast fullWidth>View Application</Button>}
        <Modal opened={opened} onClose={close} radius="lg" title="Schedule Interview" centered>
            <div className="flex flex-col gap-4">
                <DateInput value={date} onChange={setDate} minDate={new Date()} label="Date" placeholder="Enter Date" />
                <TimeInput label="Time" ref={ref} value={time}
                    onChange={(event) => setTime(event.currentTarget.value)} minTime="" onClick={() => ref.current?.showPicker()} />
                <Button onClick={() => handleOffer("INTERVIEWING")} color="brightSun.4" variant="light" fullWidth>Schedule</Button>
            </div>
        </Modal>
        <Modal
            opened={app}
            onClose={closeApp}
            radius="xl"
            centered
            size="lg"
            title="Application"
            overlayProps={{ backgroundOpacity: 0.6, blur: 6 }}
            styles={{
                content: { background: "linear-gradient(180deg, rgba(10,16,28,0.98), rgba(6,10,18,1))", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 28px 80px rgba(0,0,0,0.45)" },
                header: { background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.08)" },
                title: { color: "#f8fafc", fontWeight: 700, fontSize: "1.1rem" },
                close: { color: "#cbd5e1" },
                body: { paddingTop: 16 },
            }}
        >
            <div className="flex flex-col gap-5">
                <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(34,211,238,0.08),rgba(15,23,42,0.48))] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Candidate Snapshot</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{candidateName}</div>
                    <div className="mt-2 text-sm text-slate-300">Review the full application details, resume, and hiring actions from one place.</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            <IconMail size={14} className="text-bright-sun-300" /> Email
                        </div>
                        {candidateEmail ? (
                            <a className="break-all text-sm font-medium text-bright-sun-300 hover:underline" href={`mailto:${candidateEmail}`}>
                                {candidateEmail}
                            </a>
                        ) : (
                            <div className="text-sm text-slate-400">Not provided</div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            <IconPhone size={14} className="text-bright-sun-300" /> Mobile Number
                        </div>
                        <div className="text-sm font-medium text-slate-100">{phoneValue}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            <IconWorld size={14} className="text-bright-sun-300" /> Website
                        </div>
                        {websiteHref ? (
                            <a className="break-all text-sm font-medium text-cyan-300 hover:underline" target="_blank" rel="noopener noreferrer" href={websiteHref}>
                                {websiteValue}
                            </a>
                        ) : (
                            <div className="text-sm text-slate-400">Not provided</div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            <IconFileText size={14} className="text-bright-sun-300" /> Resume
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button color="brightSun.4" variant="light" size="xs" onClick={() => void loadResume("VIEW")}>View</Button>
                            <Button color="brightSun.4" variant="outline" size="xs" loading={resumeBusy} onClick={() => void loadResume("DOWNLOAD")}>Download</Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        <IconFileText size={14} className="text-bright-sun-300" /> Skills
                    </div>
                    {skillsList.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {skillsList.map((skill, index) => (
                                <span key={`${skill}-${index}`} className="rounded-full border border-bright-sun-400/20 bg-bright-sun-400/10 px-3 py-1 text-xs font-medium text-bright-sun-200">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-slate-400">No skills submitted.</div>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            <IconSchool size={14} className="text-bright-sun-300" /> Education
                        </div>
                        <div className="text-sm text-slate-100">{formatFieldValue(educationValue)}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            <IconBriefcase size={14} className="text-bright-sun-300" /> Current Position
                        </div>
                        <div className="text-sm text-slate-100">{formatFieldValue(currentPositionValue)}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            <IconCoin size={14} className="text-bright-sun-300" /> CTC
                        </div>
                        <div className="text-sm text-slate-100">{formatFieldValue(ctcValue)}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            <IconBriefcase size={14} className="text-bright-sun-300" /> Experience
                        </div>
                        <div className="text-sm text-slate-100">{formatFieldValue(experienceValue)}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:col-span-2">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            <IconMapPin size={14} className="text-bright-sun-300" /> Current Location
                        </div>
                        <div className="text-sm text-slate-100">{formatFieldValue(currentLocationValue)}</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Cover Letter</div>
                    <div className="min-h-24 whitespace-pre-wrap text-sm leading-6 text-slate-100">{formatFieldValue(coverLetterValue)}</div>
                </div>

                <Divider color="rgba(255,255,255,0.10)" size="xs" />

                <div className="flex gap-2">
                    <Button
                        color="brightSun.4"
                        variant="outline"
                        fullWidth
                        onClick={() => handleOffer("OFFERED")}
                    >
                        Shortlisted
                    </Button>

                    <Button
                        color="brightSun.4"
                        variant="light"
                        fullWidth
                        onClick={() => handleOffer("REJECTED")}
                    >
                        Rejected
                    </Button>
                </div>
            </div>
        </Modal>

    </div>
}
export default TalentCard;