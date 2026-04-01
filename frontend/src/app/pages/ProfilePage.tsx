import { Skeleton } from "@mantine/core";
import Profile from "../features/profile/Profile";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setProfile } from "../store/slices/ProfileSlice";
import { getMyProfile } from "../services/profile-service";

const ProfilePage = () => {
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.user);
    const profile = useSelector((state: any) => state.profile);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user && (!profile || !profile.id)) {
            setLoading(true);
            setError(null);
            getMyProfile()
                .then((data) => {
                    dispatch(setProfile(data));
                })
                .catch(() => {
                    setError("Could not load your profile. Please try again later.");
                })
                .finally(() => setLoading(false));
        }
    }, [user, dispatch, profile]);

    if (loading) {
        return <div className="min-h-screen bg-gradient-to-br from-[#070a12] via-[#0b1020] to-[#130f24] font-['poppins'] p-6 text-white">
            <div className="mx-auto w-full max-w-[1380px]">
            <Skeleton height={220} radius="md" mb="xl" />
            <div className="flex gap-4 mb-6">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={36} width={100} radius="md" />)}
            </div>
            <Skeleton height={30} width="40%" mb="sm" />
            <Skeleton height={20} width="60%" mb="sm" />
            <Skeleton height={20} width="30%" mb="sm" />
            <Skeleton height={20} width="50%" />
            </div>
        </div>;
    }

    if (error) {
        return <div className="min-h-screen bg-gradient-to-br from-[#070a12] via-[#0b1020] to-[#130f24] font-['poppins'] flex items-center justify-center px-4">
            <div className="w-full max-w-xl rounded-2xl border border-red-300/20 bg-red-500/10 p-6 text-center text-red-100 shadow-xl">
                <div className="mb-2 text-lg font-medium">{error}</div>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 rounded-md bg-bright-sun-400 px-4 py-2 font-medium text-mine-shaft-950 transition-colors hover:bg-bright-sun-300"
                >
                    Retry
                </button>
            </div>
        </div>;
    }

    return <div className="min-h-screen bg-gradient-to-br from-[#070a12] via-[#0b1020] to-[#130f24] font-['poppins'] pt-4">
        <Profile />
    </div>
}
export default ProfilePage;