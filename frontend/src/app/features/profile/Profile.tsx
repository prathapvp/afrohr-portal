import {
    Avatar,
    FileInput,
    Overlay,
} from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import { changeProfile, persistProfile } from "../../store/slices/ProfileSlice";
import Info from "./Info";
import About from "./About";
import Skills from "./Skills";
import Experience from "./Experience";
import Certification from "./Certifications";
import OnlineProfiles from "./OnlineProfiles";
import WorkSamples from "./WorkSamples";
import EducationDetails from "./EducationDetails";
import PersonalDetails from "./PersonalDetails";
import DesiredJob from "./DesiredJob";
import UpdateCV from "./UpdateCV";
import AccountDetails from "./AccountDetails";
import CompanyDetails from "./CompanyDetails";
import AddressDetails from "./AddressDetails";
import ProfileCard from "./ProfileCard";
import { useHover } from "@mantine/hooks";
import { successNotification, errorNotification } from "../../services/NotificationService";
import {
    IconEdit,
    IconCircleCheck,
    IconCamera,
    IconSparkles,
    IconUser,
    IconCode,
    IconBriefcase,
    IconSchool,
    IconCertificate,
    IconWorld,
    IconFolder,
    IconHeart,
    IconTarget,
    IconFileUpload,
    IconInfoCircle,
    IconBuilding,
    IconAddressBook,
} from "@tabler/icons-react";
import { getBase64 } from "../../services/utilities";
import { secureError } from "../../services/secure-logging-service";
import { extractErrorMessage, formatErrorForLogging } from "../../services/error-extractor-service";

const Profile = () => {
    const dispatch = useDispatch();
    const profile = useSelector((state: any) => state.profile);
    const user = useSelector((state: any) => state.user);
    const accountType = user?.accountType;
    const skillsCount = Array.isArray(profile?.skills) ? profile.skills.length : 0;
    const experienceCount = Array.isArray(profile?.experiences) ? profile.experiences.length : 0;
    const certificationCount = Array.isArray(profile?.certifications) ? profile.certifications.length : 0;
    const hasCv = Boolean(profile?.cvFileName);

    const { hovered: hoveredProfile, ref: refProfile } = useHover();
    const { hovered: hoveredBanner, ref: refBanner } = useHover();

    /* ---------------- Image Handlers ---------------- */
    const handleProfilePicChange = async (file: File | null) => {
        if (!file) return;
        
        console.log('Profile picture upload started:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            timestamp: new Date().toISOString()
        });
        
        const prevProfile = profile;
        const base64: any = await getBase64(file);
        const pictureBase64 = base64.split(",")[1];
        
        // Backend requires: id, name, email, picture
        // IMPORTANT: Include existing banner to prevent it from being cleared
        const updatePayload = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            picture: pictureBase64,
            ...(profile.banner && { banner: profile.banner }) // Preserve existing banner
        };
        
        console.log('=== PROFILE PICTURE UPDATE DEBUG ===');
        console.log('File info:', {
            name: file.name,
            size: file.size,
            type: file.type
        });
        console.log('Base64 length (with header):', base64.length);
        console.log('Base64 length (without header):', pictureBase64?.length);
        console.log('Update payload:', {
            id: updatePayload.id,
            name: updatePayload.name,
            email: updatePayload.email,
            pictureLength: updatePayload.picture?.length
        });
        console.log('First 50 chars of Base64:', pictureBase64?.substring(0, 50));
        console.log('===================================');
        
        // Optimistic update - update full profile in UI
        const updated = { ...profile, picture: pictureBase64 };
        dispatch(changeProfile(updated));
        // Persist in background - send only required fields
        // @ts-ignore unwrap available when using TS config with RTK
        (dispatch as any)(persistProfile(updatePayload))
            .unwrap()
            .then(() => {
                console.log('✅ Profile picture updated successfully');
                successNotification("Success", "Profile Picture Updated Successfully");
            })
            .catch((err: any) => {
                console.error('❌ Profile picture update failed - Full error details:', {
                    message: err?.message,
                    response: err?.response,
                    data: err?.response?.data,
                    status: err?.response?.status,
                    statusText: err?.response?.statusText
                });
                console.error('Stack trace:', err);
                
                // Keep UI updated; optionally fetch fresh profile or rollback here
                secureError("Failed to persist profile picture", err, "Profile");
                dispatch(changeProfile(prevProfile));
                
                const errorMsg = extractErrorMessage(err) || "Could not update profile picture";
                
                errorNotification("Update Failed", errorMsg);
            });
    };

    const handleBannerChange = async (file: File | null) => {
        if (!file) return;
        
        console.log('Banner upload started:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            timestamp: new Date().toISOString()
        });
        
        const prevProfile = profile;
        const base64: any = await getBase64(file);
        const bannerBase64 = base64.split(",")[1];
        
        // Backend requires: id, name, email, banner
        // IMPORTANT: Include existing picture to prevent it from being cleared
        const updatePayload = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            banner: bannerBase64,
            ...(profile.picture && { picture: profile.picture }) // Preserve existing picture
        };
        
        console.log('Sending profile update with banner:', {
            profileId: updatePayload.id,
            bannerLength: updatePayload.banner?.length,
            timestamp: new Date().toISOString()
        });
        
        // Optimistic update - update full profile in UI
        const updated = { ...profile, banner: bannerBase64 };
        dispatch(changeProfile(updated));
        // Persist in background - send only required fields
        (dispatch as any)(persistProfile(updatePayload))
            .unwrap()
            .then(() => {
                console.log('Banner updated successfully');
                successNotification("Success", "Banner Image Updated Successfully");
            })
            .catch((err: any) => {
                console.error('Banner update failed:', formatErrorForLogging(err, 'BannerUpdate'));
                
                secureError("Failed to persist banner", err, "Profile");
                dispatch(changeProfile(prevProfile));
                
                const errorMsg = extractErrorMessage(err) || "Could not update banner image";
                
                errorNotification("Update Failed", errorMsg);
            });
    };

    return (
        <div className="relative w-4/5 lg-mx:w-full mx-auto pb-10 px-2">
            <div className="pointer-events-none absolute -top-12 -left-16 h-56 w-56 rounded-full bg-bright-sun-400/10 blur-3xl" />
            <div className="pointer-events-none absolute top-20 right-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative rounded-3xl border border-mine-shaft-800/70 bg-gradient-to-b from-mine-shaft-900/95 via-mine-shaft-950/95 to-mine-shaft-950/95 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            {/* ---------------- Banner ---------------- */}
            <div className="relative px-5 pt-5" data-aos="zoom-out">
                <div ref={refBanner} className="relative w-full">
                    <img
                        className="rounded-2xl h-[180px] xs-mx:h-[120px] w-full object-cover border border-mine-shaft-700/40"
                        src={
                            profile.banner
                                ? `data:image/jpeg;base64,${profile.banner}`
                                : "/Profile/banner.svg"
                        }
                        alt={`${profile.name || "User"} profile banner`}
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-mine-shaft-950/55 via-transparent to-blue-600/20" />
                    {hoveredBanner && (
                        <>
                            <Overlay color="#000" backgroundOpacity={0.5} className="!rounded-2xl pointer-events-none" />
                            <IconEdit className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white w-14 h-14 z-10 pointer-events-none" />
                        </>
                    )}
                    <FileInput
                        onChange={handleBannerChange}
                        className="absolute inset-0 z-20 opacity-0 cursor-pointer"
                        variant="unstyled"
                        accept="image/png,image/jpeg"
                        aria-label="Upload banner image"
                        styles={{
                            root: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
                            wrapper: { height: '100%' },
                            input: { cursor: 'pointer', height: '100%', width: '100%' },
                        }}
                    />
                </div>

                {/* Profile Picture */}
                <div ref={refProfile} className="absolute -bottom-14 left-8 cursor-pointer w-32 h-32">
                    <Avatar
                        size={128}
                        className="border-4 border-mine-shaft-950 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                        src={profile.picture ? `data:image/jpeg;base64,${profile.picture}` : "/avatar.svg"}
                    />
                    {hoveredProfile && (
                        <>
                            <Overlay color="#000" backgroundOpacity={0.75} className="rounded-full pointer-events-none" />
                            <IconEdit className="absolute inset-0 m-auto w-14 h-14 z-10 pointer-events-none text-white" />
                        </>
                    )}
                    <div className="absolute bottom-1 right-1 z-10 bg-bright-sun-400 rounded-full p-1 shadow-md pointer-events-none">
                        <IconCamera className="w-3.5 h-3.5 text-mine-shaft-950" stroke={2} />
                    </div>
                    <FileInput
                        onChange={handleProfilePicChange}
                        className="absolute inset-0 z-20 opacity-0 cursor-pointer"
                        variant="unstyled"
                        accept="image/png,image/jpeg"
                        aria-label="Upload profile picture"
                        styles={{
                            root: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
                            wrapper: { height: '100%' },
                            input: { cursor: 'pointer', height: '100%', width: '100%', borderRadius: '50%' },
                        }}
                    />
                </div>
            </div>

            {/* ---------------- Name & Title ---------------- */}
            <div className="px-5 mt-16 mb-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-bright-sun-400/30 bg-bright-sun-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-bright-sun-300">
                        <IconSparkles className="h-3.5 w-3.5" stroke={1.8} />
                        Premium Profile
                    </div>
                    <h1 className="mt-2 text-2xl xs-mx:text-xl font-extrabold text-mine-shaft-50 tracking-tight">{profile.name || user?.name || "Your Name"}</h1>
                    {(profile.jobTitle || profile.company) && (
                        <p className="text-sm text-mine-shaft-300 mt-1">
                            {profile.jobTitle}{profile.jobTitle && profile.company ? " at " : ""}{profile.company}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl border border-mine-shaft-700/60 bg-mine-shaft-900/60 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-mine-shaft-400">Skills</p>
                        <p className="text-sm font-semibold text-mine-shaft-100">{skillsCount}</p>
                    </div>
                    <div className="rounded-xl border border-mine-shaft-700/60 bg-mine-shaft-900/60 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-mine-shaft-400">Experience</p>
                        <p className="text-sm font-semibold text-mine-shaft-100">{experienceCount}</p>
                    </div>
                    <div className="rounded-xl border border-mine-shaft-700/60 bg-mine-shaft-900/60 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-mine-shaft-400">Certs</p>
                        <p className="text-sm font-semibold text-mine-shaft-100">{certificationCount}</p>
                    </div>
                    <div className="rounded-xl border border-mine-shaft-700/60 bg-mine-shaft-900/60 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-mine-shaft-400">Resume</p>
                        <p className="text-sm font-semibold text-mine-shaft-100">{hasCv ? "Uploaded" : "Missing"}</p>
                    </div>
                </div>
            </div>

            {/* ---------------- Profile Completeness ---------------- */}
            {profile?.id && (() => {
                const checks = [
                    !!profile.name, !!profile.jobTitle, !!profile.company, !!profile.location,
                    !!profile.picture, !!profile.about,
                    Array.isArray(profile.skills) && profile.skills.length > 0,
                    Array.isArray(profile.experiences) && profile.experiences.length > 0,
                    Array.isArray(profile.certifications) && profile.certifications.length > 0,
                    !!profile.email,
                ];
                const filled = checks.filter(Boolean).length;
                const pct = Math.round((filled / checks.length) * 100);
                return (
                    <div className="px-5 mb-4" data-aos="fade-up">
                        <div className="flex items-center gap-2 mb-1">
                            <IconCircleCheck className="h-4 w-4 text-bright-sun-400" stroke={1.5} />
                            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-mine-shaft-300">Profile completeness</span>
                            <span className="text-xs font-semibold text-bright-sun-400 ml-auto">{pct}%</span>
                        </div>
                        <div className="w-full bg-mine-shaft-800/80 rounded-full h-2 shadow-inner">
                            <div
                                className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-bright-sun-400 via-yellow-300 to-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.45)]"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                );
            })()}

            {/* ================================================================== */}
            {/* CARD-BASED SECTIONS                                                 */}
            {/* ================================================================== */}
            <div className="px-5 flex flex-col gap-3">
                {accountType === "EMPLOYER" ? (
                    <>
                        <ProfileCard title="About" icon={<IconUser className="w-4 h-4" stroke={1.5} />}>
                            <About />
                        </ProfileCard>
                        <ProfileCard title="Account Details" icon={<IconInfoCircle className="w-4 h-4" stroke={1.5} />}>
                            <AccountDetails />
                        </ProfileCard>
                        <ProfileCard title="Company Details" icon={<IconBuilding className="w-4 h-4" stroke={1.5} />}>
                            <CompanyDetails />
                        </ProfileCard>
                        <ProfileCard title="Address Details" icon={<IconAddressBook className="w-4 h-4" stroke={1.5} />}>
                            <AddressDetails />
                        </ProfileCard>
                    </>
                ) : (
                    <>
                        {/* Primary cards — full width */}
                        <ProfileCard title="About" icon={<IconUser className="w-4 h-4" stroke={1.5} />}>
                            <About />
                        </ProfileCard>

                        <ProfileCard title="Basic Information" icon={<IconInfoCircle className="w-4 h-4" stroke={1.5} />}>
                            <Info />
                        </ProfileCard>

                        <ProfileCard title="Key Skills" icon={<IconCode className="w-4 h-4" stroke={1.5} />} defaultOpen={!!(profile.skills?.length)}>
                            <Skills />
                        </ProfileCard>

                        <ProfileCard title="Experience" icon={<IconBriefcase className="w-4 h-4" stroke={1.5} />} defaultOpen={!!(profile.experiences?.length)}>
                            <Experience />
                        </ProfileCard>

                        <ProfileCard title="Education" icon={<IconSchool className="w-4 h-4" stroke={1.5} />} defaultOpen={!!(profile.education?.length)}>
                            <EducationDetails />
                        </ProfileCard>

                        <ProfileCard title="Certifications" icon={<IconCertificate className="w-4 h-4" stroke={1.5} />} defaultOpen={!!(profile.certifications?.length)}>
                            <Certification />
                        </ProfileCard>

                        {/* Secondary cards — two-column grid */}
                        <div className="grid grid-cols-2 md-mx:grid-cols-1 gap-3">
                            <ProfileCard title="Online Profiles" icon={<IconWorld className="w-4 h-4" stroke={1.5} />} defaultOpen={false}>
                                <OnlineProfiles />
                            </ProfileCard>

                            <ProfileCard title="Work Samples" icon={<IconFolder className="w-4 h-4" stroke={1.5} />} defaultOpen={false}>
                                <WorkSamples />
                            </ProfileCard>

                            <ProfileCard title="Personal Details" icon={<IconHeart className="w-4 h-4" stroke={1.5} />} defaultOpen={false}>
                                <PersonalDetails />
                            </ProfileCard>

                            <ProfileCard title="Desired Job" icon={<IconTarget className="w-4 h-4" stroke={1.5} />} defaultOpen={false}>
                                <DesiredJob />
                            </ProfileCard>
                        </div>

                        <ProfileCard title="Update CV" icon={<IconFileUpload className="w-4 h-4" stroke={1.5} />} defaultOpen={false}>
                            <UpdateCV />
                        </ProfileCard>
                    </>
                )}
            </div>
            </div>
        </div>
    );
};

export default Profile;
