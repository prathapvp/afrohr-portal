import { Avatar, Button, Divider, Skeleton } from "@mantine/core";
import { IconBriefcase, IconMapPin } from "@tabler/icons-react";
import ExpCard from "./ExpCard";
import CertiCard from "./CertiCard";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { getProfile } from "../../services/ProfileService";
import { useMediaQuery } from "@mantine/hooks";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../store/slices/OverlaySlice";

const Profile = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const matches = useMediaQuery('(max-width: 475px)');

    const dispatch = useDispatch();
    useEffect(() => {
        setLoading(true);
        setError(null);
        dispatch(showOverlay());
        window.scrollTo(0, 0);
        getProfile(id).then((res) => {
            setProfile(res);
        }).catch(() => {
            setError("Failed to load profile. Please try again later.");
        })
        .finally(() => {
            setLoading(false);
            dispatch(hideOverlay());
        });
    }, [id, dispatch])

    if (loading) {
        return <div className="w-2/3 lg-mx:w-full p-4">
            <Skeleton height={160} radius="md" mb="xl" />
            <Skeleton height={30} width="40%" mb="sm" />
            <Skeleton height={20} width="60%" mb="sm" />
            <Skeleton height={20} width="30%" mb="xl" />
            <Skeleton height={100} mb="xl" />
            <Skeleton height={60} mb="md" />
            <Skeleton height={60} mb="md" />
        </div>;
    }

    if (error || !profile) {
        return <div className="w-2/3 lg-mx:w-full flex flex-col items-center justify-center py-20 text-mine-shaft-300">
            <IconBriefcase size={48} stroke={1.2} className="mb-4 text-mine-shaft-500" />
            <div className="text-lg font-medium mb-1">{error || "Profile not found"}</div>
            <div className="text-sm">The profile you are looking for does not exist or could not be loaded.</div>
        </div>;
    }

    return <div data-aos="zoom-out" className="w-2/3 lg-mx:w-full">
        <div>
            <div className="relative">
                <img className="rounded-t-2xl xl-mx:h-40 w-full xs-mx:h-32 " src={profile?.banner || "/Profile/banner.svg"} alt={`${profile?.name ?? "User"} banner`} />
                <div className="absolute cursor-pointer flex items-center justify-center !rounded-full -bottom-1/3 md-mx:-bottom-10 sm-mx:-bottom-16 left-6">
                    <Avatar className="!w-48 !h-48 md-mx:!w-40 md-mx:!h-40 border-mine-shaft-950 border-8 rounded-full sm-mx:!w-36 sm-mx:!h-36 xs-mx:!h-32 xs-mx:!w-32" src={profile?.picture ? `data:image/jpeg;base64,${profile?.picture}` : '/avatar.svg'} alt={profile?.name ?? "User avatar"} />
                </div>
            </div>
            <div className="px-3 mt-16">
                <div className="text-3xl xs-mx:text-2xl font-semibold flex justify-between">{profile?.name} <Button size={matches ? "sm" : "md"} color="brightSun.4" variant="light">Message</Button></div>
                <div className="text-xl xs-mx:text-base flex gap-1 items-center"> <IconBriefcase className="h-5 w-5" stroke={1.5} />{profile?.jobTitle} &bull; {profile?.company}</div>
                <div className="text-lg flex xs-mx:text-base gap-1 items-center text-mine-shaft-300">
                    <IconMapPin className="h-5 w-5" stroke={1.5} /> {profile?.location}
                </div>
                <div className="text-lg xs-mx:text-base flex gap-1 items-center text-mine-shaft-300">
                    <IconBriefcase className="h-5 w-5" stroke={1.5} /> Experience: {profile?.totalExp ?? 0} Years
                </div>
                <Divider my="xl" />
                <div>
                    <div className="text-2xl font-semibold mb-3">About</div>
                    <div className="text-sm text-mine-shaft-300 text-justify">{profile?.about || "No information provided."}</div>
                </div>
                <Divider my="xl" />
                <div>
                    <div className="text-2xl font-semibold mb-3">Skills</div>
                    {profile?.skills?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill: any, index: number) => <div key={index} className="bg-bright-sun-300 rounded-3xl px-3 py-1 text-sm font-medium bg-opacity-15 text-bright-sun-400">{skill}</div>)}
                        </div>
                    ) : (
                        <div className="text-sm text-mine-shaft-400">No skills listed yet.</div>
                    )}
                </div>
                <Divider my="xl" />
                <div>
                    <div className="text-2xl font-semibold mb-4">Experience</div>
                    {profile?.experiences?.length > 0 ? (
                        <div className="flex flex-col gap-8">
                            {profile.experiences.map((exp: any, index: number) => <ExpCard key={index} {...exp} />)}
                        </div>
                    ) : (
                        <div className="text-sm text-mine-shaft-400">No experience added yet.</div>
                    )}
                </div>
                <Divider my="xl" />
                <div>
                    <div className="text-2xl font-semibold mb-4">Certifications</div>
                    {profile?.certifications?.length > 0 ? (
                        <div className="flex flex-col gap-8">
                            {profile.certifications.map((certi: any, index: number) => <CertiCard key={index} {...certi} />)}
                        </div>
                    ) : (
                        <div className="text-sm text-mine-shaft-400">No certifications added yet.</div>
                    )}
                </div>
            </div>
        </div>
    </div>
}
export default Profile;