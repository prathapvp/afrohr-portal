import {
    Avatar,
    Button,
    FileInput,
    Loader,
    Overlay,
} from "@mantine/core";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
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
import ProfileAssistant from "./ProfileAssistant";
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
    IconDownload,
    IconChevronLeft,
    IconChevronRight,
    IconMapPin,
    IconBriefcase2,
} from "@tabler/icons-react";
import { getBase64 } from "../../services/utilities";
import { secureError } from "../../services/secure-logging-service";
import { extractErrorMessage, formatErrorForLogging } from "../../services/error-extractor-service";
import { parseResume } from "../../services/profile-service";

const Profile = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
    const user = useAppSelector((state) => state.user as { accountType?: string } | null);
    const accountType = user?.accountType;
    const skillsCount = Array.isArray(profile?.skills) ? profile.skills.length : 0;
    const experienceCount = Array.isArray(profile?.experiences) ? profile.experiences.length : 0;
    const certificationCount = Array.isArray(profile?.certifications) ? profile.certifications.length : 0;
    const hasCv = Boolean(profile?.cvFileName);

    const { hovered: hoveredProfile, ref: refProfile } = useHover();
    const { hovered: hoveredBanner, ref: refBanner } = useHover();
    const [parseFile, setParseFile] = useState<File | null>(null);
    const [parsing, setParsing] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [downloadingWord, setDownloadingWord] = useState(false);
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);

    const completenessChecks = [
        !!profile?.name,
        !!profile?.jobTitle,
        !!profile?.company,
        !!profile?.location,
        !!profile?.picture,
        !!profile?.about,
        Array.isArray(profile?.skills) && profile.skills.length > 0,
        Array.isArray(profile?.experiences) && profile.experiences.length > 0,
        Array.isArray(profile?.certifications) && profile.certifications.length > 0,
        !!profile?.email,
    ];
    const completenessFilled = completenessChecks.filter(Boolean).length;
    const completenessPct = Math.round((completenessFilled / completenessChecks.length) * 100);

    type ProfileSection = {
        title: string;
        icon: ReactNode;
        defaultOpen?: boolean;
        content: ReactNode;
    };

    const employerSections = useMemo<ProfileSection[]>(() => [
        {
            title: "About",
            icon: <IconUser className="w-4 h-4" stroke={1.5} />,
            content: <About />,
        },
        {
            title: "Account Details",
            icon: <IconInfoCircle className="w-4 h-4" stroke={1.5} />,
            content: <AccountDetails />,
        },
        {
            title: "Company Details",
            icon: <IconBuilding className="w-4 h-4" stroke={1.5} />,
            content: <CompanyDetails />,
        },
        {
            title: "Address Details",
            icon: <IconAddressBook className="w-4 h-4" stroke={1.5} />,
            content: <AddressDetails />,
        },
    ], []);

    const candidateSections = useMemo<ProfileSection[]>(() => [
        {
            title: "About",
            icon: <IconUser className="w-4 h-4" stroke={1.5} />,
            content: <About />,
        },
        {
            title: "Basic Information",
            icon: <IconInfoCircle className="w-4 h-4" stroke={1.5} />,
            content: <Info />,
        },
        {
            title: "Key Skills",
            icon: <IconCode className="w-4 h-4" stroke={1.5} />,
            defaultOpen: !!(profile.skills?.length),
            content: <Skills />,
        },
        {
            title: "Experience",
            icon: <IconBriefcase className="w-4 h-4" stroke={1.5} />,
            defaultOpen: !!(profile.experiences?.length),
            content: <Experience />,
        },
        {
            title: "Education",
            icon: <IconSchool className="w-4 h-4" stroke={1.5} />,
            defaultOpen: !!(profile.education?.length),
            content: <EducationDetails />,
        },
        {
            title: "Certifications",
            icon: <IconCertificate className="w-4 h-4" stroke={1.5} />,
            defaultOpen: !!(profile.certifications?.length),
            content: <Certification />,
        },
        {
            title: "Online Profiles",
            icon: <IconWorld className="w-4 h-4" stroke={1.5} />,
            defaultOpen: false,
            content: <OnlineProfiles />,
        },
        {
            title: "Work Samples",
            icon: <IconFolder className="w-4 h-4" stroke={1.5} />,
            defaultOpen: false,
            content: <WorkSamples />,
        },
        {
            title: "Personal Details",
            icon: <IconHeart className="w-4 h-4" stroke={1.5} />,
            defaultOpen: false,
            content: <PersonalDetails />,
        },
        {
            title: "Desired Job",
            icon: <IconTarget className="w-4 h-4" stroke={1.5} />,
            defaultOpen: false,
            content: <DesiredJob />,
        },
        {
            title: "Update CV",
            icon: <IconFileUpload className="w-4 h-4" stroke={1.5} />,
            defaultOpen: false,
            content: <UpdateCV />,
        },
    ], [
        profile.skills?.length,
        profile.experiences?.length,
        profile.education?.length,
        profile.certifications?.length,
    ]);

    const profileSections = accountType === "EMPLOYER" ? employerSections : candidateSections;
    const activeSection = profileSections[activeSectionIndex];
    const prevSection = activeSectionIndex > 0 ? profileSections[activeSectionIndex - 1] : null;
    const nextSection = activeSectionIndex < profileSections.length - 1 ? profileSections[activeSectionIndex + 1] : null;

    useEffect(() => {
        setActiveSectionIndex(0);
    }, [accountType]);

    useEffect(() => {
        setActiveSectionIndex((current) => {
            if (profileSections.length === 0) return 0;
            return Math.min(current, profileSections.length - 1);
        });
    }, [profileSections.length]);

    const animateSectionChange = (nextIndex: number) => {
        if (nextIndex === activeSectionIndex || nextIndex < 0 || nextIndex >= profileSections.length) {
            return;
        }

        setActiveSectionIndex(nextIndex);
    };

    const handlePrevSection = () => {
        animateSectionChange(activeSectionIndex - 1);
    };

    const handleNextSection = () => {
        animateSectionChange(activeSectionIndex + 1);
    };

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
        const base64 = String(await getBase64(file));
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
        dispatch(persistProfile(updatePayload))
            .unwrap()
            .then(() => {
                console.log('✅ Profile picture updated successfully');
                successNotification("Success", "Profile Picture Updated Successfully");
            })
            .catch((err: unknown) => {
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
        const base64 = String(await getBase64(file));
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
        dispatch(persistProfile(updatePayload))
            .unwrap()
            .then(() => {
                console.log('Banner updated successfully');
                successNotification("Success", "Banner Image Updated Successfully");
            })
            .catch((err: unknown) => {
                console.error('Banner update failed:', formatErrorForLogging(err, 'BannerUpdate'));
                
                secureError("Failed to persist banner", err, "Profile");
                dispatch(changeProfile(prevProfile));
                
                const errorMsg = extractErrorMessage(err) || "Could not update banner image";
                
                errorNotification("Update Failed", errorMsg);
            });
    };

    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleParseAndFillProfile = async () => {
        if (!parseFile) {
            errorNotification("Parse Failed", "Please choose a PDF or Word file first.");
            return;
        }

        try {
            setParsing(true);
            const fileData = await fileToBase64(parseFile);
            const parsed = await parseResume(fileData, parseFile.name);

            const rawLocation = (parsed?.location || "").trim();
            const locationParts = rawLocation ? rawLocation.split(",") : [];
            const inferredCity = locationParts.length > 0 ? locationParts[0].trim() : rawLocation;
            const inferredCountry = locationParts.length > 1 ? locationParts[locationParts.length - 1].trim() : "";

            const mergedSkills = parsed?.skills?.length
                ? [...new Set([...(profile.skills || []), ...parsed.skills])].slice(0, 100)
                : profile.skills;

            const updatedProfile = {
                ...profile,
                name: parsed?.name || profile?.name || "",
                email: parsed?.email || profile?.email || "",
                jobTitle: parsed?.jobTitle || profile?.jobTitle || "",
                about: parsed?.about || profile?.about || "",
                profileSummary: parsed?.profileSummary || parsed?.about || profile?.profileSummary || "",
                company: parsed?.company || profile?.company || "",
                location: parsed?.location || profile?.location || "",
                totalExp: parsed?.totalExp || profile?.totalExp || 0,
                skills: mergedSkills,
                contactPerson: parsed?.name || profile?.contactPerson || "",
                contactDesignation: parsed?.jobTitle || profile?.contactDesignation || "",
                phone1: parsed?.phone || profile?.phone1 || "",
                mobileNumber: parsed?.phone || profile?.mobileNumber || "",
                address: parsed?.address || rawLocation || profile?.address || "",
                city: inferredCity || profile?.city || "",
                country: inferredCountry || profile?.country || "",
            };

            await dispatch(persistProfile(updatedProfile)).unwrap();
            setParseFile(null);
            successNotification("Parsed Successfully", "Profile inputs were filled from the uploaded file.");
        } catch (error: unknown) {
            const errorMessage = extractErrorMessage(error) || "Could not parse the selected file.";
            errorNotification("Parse Failed", errorMessage);
        } finally {
            setParsing(false);
        }
    };

    const getExportRows = () => {
        const rows: Array<[string, string]> = [
            ["Name", profile?.name || ""],
            ["Email", profile?.email || ""],
            ["Account Type", accountType || ""],
            ["Job Title", profile?.jobTitle || ""],
            ["Company", profile?.company || ""],
            ["Location", profile?.location || ""],
            ["Mobile Number", profile?.mobileNumber || ""],
            ["Phone 1", profile?.phone1 || ""],
            ["Phone 2", profile?.phone2 || ""],
            ["Address", profile?.address || ""],
            ["City", profile?.city || ""],
            ["Country", profile?.country || ""],
            ["Total Experience", profile?.totalExp ? String(profile.totalExp) : ""],
            ["Skills", Array.isArray(profile?.skills) ? profile.skills.join(", ") : ""],
            ["Contact Person", profile?.contactPerson || ""],
            ["Contact Designation", profile?.contactDesignation || ""],
            ["Company Type", profile?.companyType || ""],
            ["Industry Type", profile?.industryType || ""],
            ["Website", profile?.websiteUrl || ""],
            ["About", profile?.about || ""],
        ];

        return rows.filter(([, value]) => String(value || "").trim().length > 0);
    };

    const handleDownloadWord = () => {
        try {
            setDownloadingWord(true);
            const rows = getExportRows();
            const tableRows = rows
                .map(([key, value]) => `<tr><td style=\"padding:8px;border:1px solid #d1d5db;font-weight:600;vertical-align:top;\">${key}</td><td style=\"padding:8px;border:1px solid #d1d5db;\">${String(value).replace(/\n/g, "<br/>")}</td></tr>`)
                .join("");

            const html = `
                <html>
                <head><meta charset=\"utf-8\" /></head>
                <body style=\"font-family: Arial, sans-serif;\">
                    <h2>AfroHR Profile Information</h2>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                    <table style=\"border-collapse:collapse;width:100%;\">${tableRows}</table>
                </body>
                </html>
            `;

            const blob = new Blob([html], { type: "application/msword" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `afrohr-profile-${(profile?.name || "user").replace(/\s+/g, "-").toLowerCase()}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } finally {
            setDownloadingWord(false);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            setDownloadingPdf(true);
            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF({ unit: "pt", format: "a4" });
            const rows = getExportRows();

            let y = 48;
            doc.setFontSize(16);
            doc.text("AfroHR Profile Information", 40, y);
            y += 20;
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, y);
            y += 20;

            doc.setFontSize(11);
            for (const [key, value] of rows) {
                const line = `${key}: ${value}`;
                const wrapped = doc.splitTextToSize(line, 515);
                const requiredHeight = wrapped.length * 14;
                if (y + requiredHeight > 790) {
                    doc.addPage();
                    y = 48;
                }
                doc.text(wrapped, 40, y);
                y += requiredHeight + 2;
            }

            doc.save(`afrohr-profile-${(profile?.name || "user").replace(/\s+/g, "-").toLowerCase()}.pdf`);
        } finally {
            setDownloadingPdf(false);
        }
    };

    return (
        <div className="relative mx-auto w-full max-w-[1380px] px-3 pb-12 sm:px-4">
            <div className="pointer-events-none absolute -left-24 -top-16 h-72 w-72 rounded-full bg-bright-sun-400/15 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-36 h-80 w-80 rounded-full bg-cyan-500/12 blur-3xl" />
            <div className="pointer-events-none absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-pink-500/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_38%),radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_34%),linear-gradient(180deg,rgba(9,12,21,0.96),rgba(6,9,16,0.98))] shadow-[0_26px_80px_rgba(0,0,0,0.42)] backdrop-blur-sm">
            {/* ---------------- Banner ---------------- */}
            <div className="relative px-5 pt-5" data-aos="zoom-out">
                <div ref={refBanner} className="relative w-full">
                    <img
                        className="h-[220px] w-full rounded-3xl border border-white/15 object-cover shadow-[0_18px_46px_rgba(0,0,0,0.35)] xs-mx:h-[130px]"
                        src={
                            profile.banner
                                ? `data:image/jpeg;base64,${profile.banner}`
                                : "/Profile/banner.svg"
                        }
                        alt={`${profile.name || "User"} profile banner`}
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-tr from-black/45 via-transparent to-cyan-500/20" />
                    {hoveredBanner && (
                        <>
                            <Overlay color="#000" backgroundOpacity={0.45} className="!rounded-3xl pointer-events-none" />
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
                <div ref={refProfile} className="absolute -bottom-16 left-8 h-32 w-32 cursor-pointer">
                    <Avatar
                        size={128}
                        className="border-4 border-[#060910] shadow-[0_10px_32px_rgba(0,0,0,0.52)]"
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
            <div className="mb-3 mt-20 px-5">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
                    <div className="rounded-[26px] border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.92),rgba(2,6,23,0.96))] px-5 py-5 shadow-[0_18px_48px_rgba(0,0,0,0.32)]">
                        <div className="inline-flex items-center gap-2 rounded-full border border-bright-sun-400/40 bg-bright-sun-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-bright-sun-300">
                            <IconSparkles className="h-3.5 w-3.5" stroke={1.8} />
                            Profile Studio
                        </div>
                        <h1 className="mt-3 text-3xl font-black tracking-tight text-white xs-mx:text-2xl">{profile.name || user?.name || "Your Name"}</h1>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-200">
                            {(profile.jobTitle || profile.company) && (
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5">
                                    <IconBriefcase2 className="h-3.5 w-3.5 text-bright-sun-300" stroke={1.7} />
                                    <span>{profile.jobTitle}{profile.jobTitle && profile.company ? " at " : ""}{profile.company}</span>
                                </div>
                            )}
                            {(profile.location || profile.city || profile.country) && (
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5">
                                    <IconMapPin className="h-3.5 w-3.5 text-cyan-300" stroke={1.7} />
                                    <span>{profile.location || [profile.city, profile.country].filter(Boolean).join(", ")}</span>
                                </div>
                            )}
                            {accountType && (
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5">
                                    <IconCircleCheck className="h-3.5 w-3.5 text-emerald-300" stroke={1.7} />
                                    <span>{accountType}</span>
                                </div>
                            )}
                        </div>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                            {profile.about || profile.profileSummary || "Shape a sharper profile with stronger sections, better positioning, and a complete hiring-ready presence."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
                        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-3 py-3">
                            <p className="text-[10px] uppercase tracking-wider text-amber-100/75">Skills</p>
                            <p className="mt-1 text-lg font-semibold text-white">{skillsCount}</p>
                        </div>
                        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-3">
                            <p className="text-[10px] uppercase tracking-wider text-cyan-100/75">Experience</p>
                            <p className="mt-1 text-lg font-semibold text-white">{experienceCount}</p>
                        </div>
                        <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-3">
                            <p className="text-[10px] uppercase tracking-wider text-fuchsia-100/75">Certifications</p>
                            <p className="mt-1 text-lg font-semibold text-white">{certificationCount}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-3">
                            <p className="text-[10px] uppercase tracking-wider text-emerald-100/75">Resume</p>
                            <p className="mt-1 text-lg font-semibold text-white">{hasCv ? "Ready" : "Needed"}</p>
                        </div>
                            <div className="rounded-2xl border border-violet-300/20 bg-violet-400/10 px-3 py-3">
                                <p className="text-[10px] uppercase tracking-wider text-violet-100/75">Resume Views</p>
                                <p className="mt-1 text-lg font-semibold text-white">{profile?.resumeViewCount ?? 0}</p>
                            </div>
                    </div>
                </div>
            </div>

            {profile?.id && (
                <div className="mb-4 px-5" data-aos="fade-up">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="mb-2 flex items-center gap-2">
                            <IconCircleCheck className="h-4 w-4 text-bright-sun-400" stroke={1.5} />
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Profile completeness</span>
                            <span className="ml-auto text-xs font-semibold text-bright-sun-400">{completenessPct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800/85 shadow-inner">
                            <div
                                className="h-2 rounded-full bg-gradient-to-r from-bright-sun-400 via-yellow-300 to-orange-300 shadow-[0_0_14px_rgba(251,191,36,0.45)] transition-all duration-500"
                                style={{ width: `${completenessPct}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-4 px-5" data-aos="fade-up">
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-cyan-100/80">Profile Tier</p>
                        <p className="text-sm font-semibold text-cyan-50">Premium</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-100/80">Readiness</p>
                        <p className="text-sm font-semibold text-emerald-50">{completenessPct >= 80 ? "High" : completenessPct >= 50 ? "Medium" : "Improving"}</p>
                    </div>
                    <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-fuchsia-100/80">AI Assist</p>
                        <p className="text-sm font-semibold text-fuchsia-50">Enabled</p>
                    </div>
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-amber-100/80">Portfolio</p>
                        <p className="text-sm font-semibold text-amber-50">{hasCv ? "Resume Ready" : "Upload Needed"}</p>
                    </div>
                        <div className="rounded-2xl border border-violet-300/20 bg-violet-400/10 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-violet-100/80">Resume Views</p>
                            <p className="text-sm font-semibold text-violet-50">{profile?.resumeViewCount ?? 0} views</p>
                        </div>
                </div>
            </div>

            {accountType === "EMPLOYER" && (
                <div className="px-5 mb-4" data-aos="fade-up">
                    <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
                        <div className="mb-2 text-sm font-semibold text-white">Parse and Fill Inputs (Entire Profile)</div>
                        <p className="mb-3 text-xs text-slate-300">Upload an existing company CV or profile document and auto-populate this page instantly.</p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <div className="flex-1">
                                <FileInput
                                    value={parseFile}
                                    onChange={setParseFile}
                                    accept=".pdf,.doc,.docx"
                                    placeholder="Choose PDF or Word document"
                                    leftSection={<IconFileUpload size={16} />}
                                />
                            </div>
                            <Button
                                onClick={handleParseAndFillProfile}
                                disabled={!parseFile || parsing}
                                leftSection={parsing ? <Loader size={16} /> : <IconSparkles size={16} />}
                                color="yellow"
                            >
                                {parsing ? "Parsing..." : "Parse and Fill Inputs"}
                            </Button>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <Button
                                onClick={handleDownloadPdf}
                                disabled={downloadingPdf}
                                leftSection={downloadingPdf ? <Loader size={16} /> : <IconDownload size={16} />}
                                variant="light"
                                color="blue"
                            >
                                {downloadingPdf ? "Preparing PDF..." : "Download Profile as PDF"}
                            </Button>
                            <Button
                                onClick={handleDownloadWord}
                                disabled={downloadingWord}
                                leftSection={downloadingWord ? <Loader size={16} /> : <IconDownload size={16} />}
                                variant="light"
                                color="grape"
                            >
                                {downloadingWord ? "Preparing Word..." : "Download Profile as Word"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="px-5 mb-4" data-aos="fade-up">
                <ProfileAssistant />
            </div>

            {/* ================================================================== */}
            {/* CARD-BASED SECTIONS                                                 */}
            {/* ================================================================== */}
            <div className="px-5 pb-5">
                <div className="rounded-[26px] border border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.92),rgba(2,6,23,0.96))] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Section Navigator</div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-slate-200">
                                <span className="rounded-full border border-bright-sun-400/25 bg-bright-sun-400/10 p-1.5 text-bright-sun-300">{activeSection?.icon}</span>
                                <span className="font-semibold text-white">{activeSection?.title}</span>
                                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                                    {profileSections.length > 0 ? `${activeSectionIndex + 1} of ${profileSections.length}` : "0 of 0"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Button
                                variant="gradient"
                                gradient={{ from: "brightSun.5", to: "pink.4", deg: 90 }}
                                size="xs"
                                onClick={handlePrevSection}
                                disabled={activeSectionIndex === 0}
                                className="rounded-full px-5"
                                leftSection={<IconChevronLeft size={14} />}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="gradient"
                                gradient={{ from: "pink.4", to: "brightSun.5", deg: 90 }}
                                size="xs"
                                onClick={handleNextSection}
                                disabled={activeSectionIndex >= profileSections.length - 1}
                                className="rounded-full px-5"
                                rightSection={<IconChevronRight size={14} />}
                            >
                                Next
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                            <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-slate-400">Previous</div>
                            <div className="flex items-center gap-2">
                                {prevSection ? (
                                    <>
                                        <span className="text-bright-sun-300">{prevSection.icon}</span>
                                        <span className="truncate text-xs font-semibold text-slate-200">{prevSection.title}</span>
                                    </>
                                ) : (
                                    <span className="text-xs text-slate-500">Start</span>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-bright-sun-400/30 bg-bright-sun-400/10 px-3 py-3 text-center shadow-[0_0_18px_rgba(251,191,36,0.12)]">
                            <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-bright-sun-100/80">Current</div>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-bright-sun-300">{activeSection?.icon}</span>
                                <span className="text-xs font-semibold text-bright-sun-100">{activeSection?.title}</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                            <div className="mb-2 text-right text-[10px] uppercase tracking-[0.12em] text-slate-400">Next</div>
                            <div className="flex items-center justify-end gap-2">
                                {nextSection ? (
                                    <>
                                        <span className="text-bright-sun-300">{nextSection.icon}</span>
                                        <span className="truncate text-xs font-semibold text-slate-200">{nextSection.title}</span>
                                    </>
                                ) : (
                                    <span className="text-xs text-slate-500">End</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {profileSections.map((section, index) => (
                            <button
                                key={section.title}
                                onClick={() => animateSectionChange(index)}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    activeSectionIndex === index
                                        ? "border-bright-sun-400/70 bg-bright-sun-400/20 text-bright-sun-200 shadow-[0_0_14px_rgba(251,191,36,0.16)]"
                                        : "border-white/15 bg-white/5 text-mine-shaft-300 hover:bg-white/10"
                                }`}
                            >
                                <span className={activeSectionIndex === index ? "text-bright-sun-300" : "text-slate-400"}>{section.icon}</span>
                                {section.title}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 overflow-hidden rounded-3xl">
                        <div
                            style={{ transform: `translateX(-${activeSectionIndex * 100}%)` }}
                            className="flex transition-transform duration-500 ease-out"
                        >
                            {profileSections.map((section) => (
                                <div key={section.title} className="min-w-full">
                                    <ProfileCard
                                        title={section.title}
                                        icon={section.icon}
                                        defaultOpen={section.defaultOpen ?? true}
                                    >
                                        {section.content}
                                    </ProfileCard>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default Profile;
