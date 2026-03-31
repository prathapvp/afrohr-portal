import { Button, Divider, Text } from "@mantine/core";
import { IconBookmark, IconBookmarkFilled, IconClockHour3, IconSparkles } from "@tabler/icons-react";
import { Link } from "react-router";
import { timeAgo } from "../../services/utilities";
import { useDispatch, useSelector } from "react-redux";
import { changeProfile } from "../../store/slices/ProfileSlice";
import { computeMatchScore } from "../../services/match-service";

const JobCard = (props: any) => {
    const dispatch = useDispatch();
    const profile = useSelector((state: any) => state.profile);
    const accountType = localStorage.getItem("accountType")?.toUpperCase();
    const showMatch = accountType === "APPLICANT" && (profile?.skills?.length > 0 || profile?.itSkills?.length > 0);
    const match = showMatch ? computeMatchScore(props, profile) : null;

    const handleSaveJob = () => {
        let savedJobs: any = profile.savedJobs ? [...profile.savedJobs] : [];
        if (savedJobs.includes(props.id)) {
            savedJobs = savedJobs.filter((job: any) => job != props.id);
        } else {
            savedJobs.push(props.id);
        }
        dispatch(changeProfile({ ...profile, savedJobs }));
    };

    return (
        <div
            data-aos="fade-up"
            className="group relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl border border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_38%),linear-gradient(180deg,rgba(17,24,39,0.92),rgba(2,6,23,0.96))] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.35)] transition duration-300 ease-in-out hover:-translate-y-0.5 hover:border-bright-sun-400/35 hover:shadow-[0_22px_56px_rgba(0,0,0,0.48)]"
        >
            {match && match.score > 0 && (
                <div
                    className={`mb-1 inline-flex items-center gap-1 self-start sm:self-end rounded-full px-2 py-0.5 text-[10px] font-bold shadow-md ${
                        match.score >= 70 ? "bg-green-500 text-white" :
                        match.score >= 40 ? "bg-yellow-400 text-black" :
                        "bg-red-500 text-white"
                    }`}
                >
                    <IconSparkles size={9} stroke={2} />
                    {match.score}% match
                </div>
            )}
            <div className="flex justify-between gap-3">
                <div className="flex gap-2 items-center">
                    <div className="rounded-lg border border-white/10 bg-mine-shaft-800/70 p-2 icon-container">
                        <img className="h-7 img-polished" src={`/Icons/${props.company}.png`} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="font-semibold text-white leading-tight">{props.jobTitle}</div>
                        <div className="text-xs text-mine-shaft-300">
                            <Link className="hover:text-mine-shaft-200" to="/company">{props.company}</Link>
                            {" "}&bull; {props.applicants ? props.applicants.length : 0} Applicants
                        </div>
                    </div>
                </div>
                {profile.savedJobs?.includes(props.id)
                    ? <IconBookmarkFilled onClick={handleSaveJob} className="cursor-pointer text-bright-sun-400" stroke={1.5} />
                    : <IconBookmark onClick={handleSaveJob} className="cursor-pointer hover:text-bright-sun-400 text-mine-shaft-300" stroke={1.5} />
                }
            </div>
            <div className="flex flex-wrap gap-2">
                <div className="rounded-full border border-bright-sun-400/25 bg-bright-sun-400/10 px-2.5 py-1 text-xs font-medium text-bright-sun-300">{props.experience}</div>
                <div className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-200">{props.jobType}</div>
                <div className="rounded-full border border-fuchsia-300/25 bg-fuchsia-400/10 px-2.5 py-1 text-xs font-medium text-fuchsia-200">{props.location}</div>
            </div>
            <div>
                <Text className="!text-xs text-justify !leading-5 !text-mine-shaft-300" lineClamp={3}>{props.about}</Text>
            </div>
            <Divider color="mineShaft.7" size="xs" />
            <div className="flex justify-between">
                <div className="font-semibold text-bright-sun-200">&#36;{props.packageOffered} K</div>
                <div className="text-xs flex gap-1 items-center text-mine-shaft-400">
                    <IconClockHour3 className="h-5 w-5" stroke={1.5} />Posted {timeAgo(props.postTime)}
                </div>
            </div>
            <Link to={`/jobs/${props.id}`}>
                <Button fullWidth color="brightSun.4" variant="gradient" gradient={{ from: "brightSun.5", to: "orange.6", deg: 90 }} className="font-semibold text-mine-shaft-950">View Job</Button>
            </Link>
        </div>
    );
};

export default JobCard;