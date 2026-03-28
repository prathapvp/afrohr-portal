import { Skeleton } from "@mantine/core";
import Profile from "../features/profile/Profile";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setProfile } from "../store/slices/ProfileSlice";
import { getProfile } from "../services/ProfileService";

const ProfilePage = () => {
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.user);
    const profile = useSelector((state: any) => state.profile);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.profileId && (!profile || !profile.id)) {
            setLoading(true);
            setError(null);
            getProfile(user.profileId)
                .then((data) => {
                    dispatch(setProfile(data));
                })
                .catch(() => {
                    setError("Could not load your profile. Please try again later.");
                })
                .finally(() => setLoading(false));
        }
    }, [user?.profileId, dispatch, profile]);

    if (loading) {
        return <div className="min-h-screen bg-mine-shaft-950 font-['poppins'] p-6">
            <Skeleton height={180} radius="md" mb="xl" />
            <div className="flex gap-4 mb-6">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={36} width={100} radius="md" />)}
            </div>
            <Skeleton height={30} width="40%" mb="sm" />
            <Skeleton height={20} width="60%" mb="sm" />
            <Skeleton height={20} width="30%" mb="sm" />
            <Skeleton height={20} width="50%" />
        </div>;
    }

    if (error) {
        return <div className="min-h-screen bg-mine-shaft-950 font-['poppins'] flex flex-col items-center justify-center text-mine-shaft-300">
            <div className="text-lg font-medium mb-2">{error}</div>
            <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 rounded-md bg-bright-sun-400 text-mine-shaft-950 font-medium hover:bg-bright-sun-300 transition-colors"
            >
                Retry
            </button>
        </div>;
    }

    return <div className="min-h-screen bg-mine-shaft-950 font-['poppins'] pt-4">
        <Profile />
    </div>
}
export default ProfilePage;