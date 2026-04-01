import { ActionIcon, Badge, Button, Divider } from "@mantine/core";
import { card } from "../../data/JobDescData";
import { IconBookmark, IconBookmarkFilled } from "@tabler/icons-react";
// @ts-ignore
import DOMPurify from 'dompurify';
import { Link } from "react-router";
import { timeAgo } from "../../services/utilities";
import { useAppDispatch, useAppSelector } from "../../store";
import { useEffect, useState } from "react";
import { changeProfile } from "../../store/slices/ProfileSlice";
import { postJob } from "../../services/job-service";
import { successNotification } from "../../services/NotificationService";
import { hideOverlay, showOverlay } from "../../store/slices/OverlaySlice";
import type { JobListItem } from "../find-jobs/types";

type JobDetailsProps = JobListItem & {
    description?: string;
    about?: string;
    applicants?: Array<{ applicantId?: number; applicationStatus?: string }>;
    edit?: boolean;
    closed?: boolean;
    [key: string]: unknown;
};

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

const Job = (props: JobDetailsProps) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.user as { id?: number } | null);
    const profile = useAppSelector((state) => state.profile as { savedJobs?: number[] });

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

    const rawDescription = props.description ?? "";
    const detailsHtml = /<[^>]+>/.test(rawDescription)
        ? rawDescription
        : formatPlainDescriptionToHtml(rawDescription);
    const cleanHTML = DOMPurify.sanitize(detailsHtml);
    const safeSkills = Array.isArray(props.skillsRequired) ? props.skillsRequired : [];
    const applicantsCount = props.applicants ? props.applicants.length : 0;

    const handleClose = () => {
        if (props.closed) return;
        dispatch(showOverlay())
        postJob({ ...props, jobStatus: "CLOSED" }).then(() => {
            successNotification('Job Closed', 'Job has been closed successfully');
        }).catch((err) => console.log(err))
            .finally(() => dispatch(hideOverlay()));
    }

    return <div data-aos="zoom-out" className="w-full">
        <div className="premium-card-hover overflow-hidden rounded-3xl border border-white/12 bg-[linear-gradient(180deg,rgba(17,24,39,0.9),rgba(2,6,23,0.95))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-lg">
                        <img className="h-14 w-14 rounded-lg object-contain xs-mx:h-10 xs-mx:w-10" src={`/Icons/${props.company}.png`} alt={props.company ?? "Company"} />
                    </div>
                    <div className="min-w-0 space-y-1">
                        <h1 className="truncate text-2xl font-semibold text-white xs-mx:text-xl">{props.jobTitle ?? "Job Role"}</h1>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{props.company ?? "Company"}</span>
                            <span>Posted {timeAgo(props.postTime || "")}</span>
                            <span>{applicantsCount} Applicants</span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <Badge variant="light" color="teal">{props.jobType ?? "Not specified"}</Badge>
                            <Badge variant="light" color="blue">{props.location ?? "Location not set"}</Badge>
                            <Badge variant="light" color="orange">{props.experience ?? "Experience not set"}</Badge>
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                    {(props.edit || !applied) && <Link to={props.edit ? `/post-job/${props.id}` : `/apply-job/${props.id}`}>
                        <Button color="brightSun.4" size="sm" variant="light">{props.closed ? "Reopen" : props.edit ? "Edit" : "Apply"}</Button>
                    </Link>}
                    {applied && !props.edit && <Button color="green.8" size="sm" variant="light">Applied</Button>}
                    {props.edit && !props.closed
                        ? <Button onClick={handleClose} color="red.4" size="sm" variant="light">Close</Button>
                        : profile.savedJobs?.includes(props.id)
                            ? <IconBookmarkFilled onClick={handleSaveJob} className="cursor-pointer text-bright-sun-400" stroke={1.5} />
                            : <IconBookmark onClick={handleSaveJob} className="cursor-pointer text-mine-shaft-300 hover:text-bright-sun-400" stroke={1.5} />}
                </div>
            </div>

            <Divider size="xs" my="xl" color="rgba(255,255,255,0.14)" />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {card.map((item, index) => (
                    <div key={index} className="premium-card-hover rounded-2xl border border-white/10 bg-slate-900/50 p-4 hover:border-bright-sun-400/25 hover:bg-slate-900/65">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">{item.name}</span>
                            <ActionIcon className="!h-8 !w-8" variant="light" color="brightSun.4" radius="xl"><item.icon className="h-4 w-4" /></ActionIcon>
                        </div>
                        <div className="text-base font-semibold text-white">
                            {props ? props[item.id] : "NA"}
                            {item.id === "packageOffered" && <> LPA</>}
                        </div>
                    </div>
                ))}
            </div>

            <Divider size="xs" my="xl" color="rgba(255,255,255,0.14)" />

            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                    {safeSkills.length > 0 ? safeSkills.map((skill: string, index:number) => (
                        <ActionIcon key={index} className="premium-pill !h-fit !w-fit rounded-full !px-3 !py-1 font-medium !text-xs text-white" variant="transparent" radius="xl">{skill}</ActionIcon>
                    )) : (
                        <p className="text-sm text-slate-400">No required skills listed for this role.</p>
                    )}
                </div>
            </div>

            <Divider size="xs" my="xl" color="rgba(255,255,255,0.14)" />

            <div className="premium-card-hover rounded-2xl border border-white/10 bg-slate-900/40 p-5 hover:border-cyan-300/20">
                <h2 className="mb-4 text-xl font-semibold text-white">Role Details</h2>
                <div className="[&>h4]:mb-3 [&>h4]:text-lg [&>h4]:font-semibold [&>h4]:text-mine-shaft-200 [&_*]:text-slate-300 [&_li]:mb-1 [&_li]:text-sm [&_li]:marker:text-bright-sun-300 [&_p]:text-justify [&_p]:text-sm" dangerouslySetInnerHTML={{ __html: cleanHTML }} />
            </div>

            <Divider size="xs" my="xl" color="rgba(255,255,255,0.14)" />

            <div>
                <h2 className="mb-4 text-xl font-semibold text-white">About Company</h2>
                <div className="premium-card-hover mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4 hover:border-bright-sun-400/25">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-mine-shaft-800 p-2">
                            <img className="h-8" src={`/Icons/${props.company}.png`} alt={props.company ?? "Company"} />
                        </div>
                        <div>
                            <div className="text-lg font-medium text-white">{props.company ?? "Company"}</div>
                            <div className="text-sm text-mine-shaft-300">10k+ Employees</div>
                        </div>
                    </div>
                    <Link to={`/company/${props.company}`}>
                        <Button color="brightSun.4" variant="light">Company Page</Button>
                    </Link>
                </div>
                <p className="text-sm text-mine-shaft-300">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quo fuga recusandae perferendis, excepturi nostrum debitis. Accusantium dolorum corrupti et mollitia unde? Possimus vero nemo maxime vitae impedit? Nisi, quos in. Facilis maiores in nostrum qui animi delectus architecto iste quidem soluta. Illo aspernatur saepe dolores minus soluta? Molestias, delectus eveniet.</p>
            </div>
        </div>
    </div>
}
export default Job;