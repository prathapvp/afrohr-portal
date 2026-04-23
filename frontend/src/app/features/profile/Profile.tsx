import {
    Avatar,
    Button,
    FileInput,
    Loader,
    Overlay,
} from "@mantine/core";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
    IconShieldCheck,
    IconUsers,
    IconChartBar,
    IconClipboardList,
} from "@tabler/icons-react";
import { getBase64 } from "../../services/utilities";
import { secureError } from "../../services/secure-logging-service";
import { extractErrorMessage, formatErrorForLogging } from "../../services/error-extractor-service";
import { parseResume } from "../../services/profile-service";
import { getAdminOverview, type AdminOverview } from "../../services/admin-service";
import { moderateImageForProfileUpload } from "../../services/image-moderation-service";
import { useNavigate } from "react-router";

const Profile = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
    const user = useAppSelector((state) => state.user as { accountType?: string } | null);
    const accountType = user?.accountType;
    const displayName = String(profile?.username || profile?.name || (user as { name?: string } | null)?.name || "Your Name");
    const profilePreviewText = String(profile.about || profile.profileSummary || "Shape a sharper profile with stronger sections, better positioning, and a complete hiring-ready presence.")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+/g, " ")
        .trim();
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
    const [isSectionFadingOut, setIsSectionFadingOut] = useState(false);
    const sectionTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState<string | null>(null);

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

    const desiredJob = (profile?.desiredJob ?? {}) as Record<string, unknown>;
    const preferredDesignations = Array.isArray(desiredJob.preferredDesignations)
        ? desiredJob.preferredDesignations.map((item) => String(item ?? "").trim()).filter(Boolean)
        : [];
    const preferredLocations = Array.isArray(desiredJob.preferredLocations)
        ? desiredJob.preferredLocations.map((item) => String(item ?? "").trim()).filter(Boolean)
        : [];
    const targetRole = preferredDesignations[0] || "Not set";
    const targetLocation = preferredLocations[0] || "Not set";

    const educationCount = Array.isArray(profile?.education) ? profile.education.length : 0;
    const totalExp = Number(profile?.totalExp ?? 0);
    const currentYear = new Date().getFullYear();
    const latestPassingYear = Array.isArray(profile?.education)
        ? profile.education
            .map((entry) => Number(((entry ?? {}) as Record<string, unknown>).yearOfPassing ?? 0))
            .filter((year) => Number.isFinite(year) && year > 0)
            .sort((a, b) => b - a)[0]
        : undefined;

    const studentStage = totalExp > 0
        ? "Early Professional"
        : latestPassingYear && latestPassingYear >= currentYear
            ? "Final Year / Fresher"
            : educationCount > 0
                ? "Student"
                : "Not set";

    const studentRoadmapChecks = [
        preferredDesignations.length > 0,
        preferredLocations.length > 0,
        educationCount > 0,
        skillsCount >= 8,
        experienceCount > 0 || totalExp > 0,
        hasCv,
    ];
    const studentRoadmapPct = Math.round((studentRoadmapChecks.filter(Boolean).length / studentRoadmapChecks.length) * 100);

    const studentMissingItems: Array<{ label: string; section: string }> = [
        ...(preferredDesignations.length === 0 ? [{ label: "Set target role", section: "Desired Job" }] : []),
        ...(preferredLocations.length === 0 ? [{ label: "Set target location", section: "Desired Job" }] : []),
        ...(skillsCount < 8 ? [{ label: "Add at least 8 skills", section: "Key Skills" }] : []),
        ...(educationCount === 0 ? [{ label: "Add education details", section: "Education" }] : []),
        ...(experienceCount === 0 && totalExp <= 0 ? [{ label: "Add internship/project experience", section: "Experience" }] : []),
        ...(!Array.isArray(profile?.certifications) || profile.certifications.length === 0
            ? [{ label: "Add one certification", section: "Certifications" }]
            : []),
        ...(!Array.isArray(profile?.workSamples) || profile.workSamples.length === 0
            ? [{ label: "Add project/work sample link", section: "Work Samples" }]
            : []),
        ...(!hasCv ? [{ label: "Upload CV", section: "Update CV" }] : []),
    ];

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

    const adminSections = useMemo<ProfileSection[]>(() => [
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
    ], []);

    const profileSections = accountType === "ADMIN"
        ? adminSections
        : accountType === "EMPLOYER"
            ? employerSections
            : candidateSections;
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

    useEffect(() => {
        return () => {
            if (sectionTransitionTimerRef.current) {
                clearTimeout(sectionTransitionTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (accountType !== "ADMIN") {
            return;
        }
        let alive = true;
        setAdminLoading(true);
        setAdminError(null);
        getAdminOverview()
            .then((overview) => {
                if (!alive) {
                    return;
                }
                setAdminOverview(overview);
            })
            .catch(() => {
                if (!alive) {
                    return;
                }
                setAdminError("Admin overview is currently unavailable.");
            })
            .finally(() => {
                if (alive) {
                    setAdminLoading(false);
                }
            });

        return () => {
            alive = false;
        };
    }, [accountType]);

    const animateSectionChange = (nextIndex: number) => {
        if (
            isSectionFadingOut ||
            nextIndex === activeSectionIndex ||
            nextIndex < 0 ||
            nextIndex >= profileSections.length
        ) {
            return;
        }

        setIsSectionFadingOut(true);
        if (sectionTransitionTimerRef.current) {
            clearTimeout(sectionTransitionTimerRef.current);
        }
        sectionTransitionTimerRef.current = setTimeout(() => {
            setActiveSectionIndex(nextIndex);
            setIsSectionFadingOut(false);
        }, 140);
    };

    const handlePrevSection = () => {
        animateSectionChange(activeSectionIndex - 1);
    };

    const handleNextSection = () => {
        animateSectionChange(activeSectionIndex + 1);
    };

    const jumpToSection = (title: string) => {
        const targetIndex = profileSections.findIndex((section) => section.title === title);
        if (targetIndex >= 0) {
            animateSectionChange(targetIndex);
        }
    };

    /* ---------------- Image Handlers ---------------- */
    const handleProfilePicChange = async (file: File | null) => {
        if (!file) return;

        try {
            const moderation = await moderateImageForProfileUpload(file);
            if (!moderation.isAllowed) {
                errorNotification("Upload Blocked", moderation.blockedReason || "This image is not allowed.");
                return;
            }
        } catch (moderationError) {
            secureError("Image moderation failed", moderationError, "Profile");
            errorNotification("Upload Blocked", "We could not verify image safety. Please try another image.");
            return;
        }
        
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

        try {
            const moderation = await moderateImageForProfileUpload(file);
            if (!moderation.isAllowed) {
                errorNotification("Upload Blocked", moderation.blockedReason || "This image is not allowed.");
                return;
            }
        } catch (moderationError) {
            secureError("Image moderation failed", moderationError, "Profile");
            errorNotification("Upload Blocked", "We could not verify image safety. Please try another image.");
            return;
        }
        
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
                        alt={`${displayName} profile banner`}
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
                <div className={`grid gap-4 ${accountType === "ADMIN" ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]"}`}>
                    <div className="rounded-[26px] border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.92),rgba(2,6,23,0.96))] px-5 py-5 shadow-[0_18px_48px_rgba(0,0,0,0.32)]">
                        <div className="inline-flex items-center gap-2 rounded-full border border-bright-sun-400/40 bg-bright-sun-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-bright-sun-300">
                            <IconSparkles className="h-3.5 w-3.5" stroke={1.8} />
                            Profile Studio
                        </div>
                        <h1 className="mt-3 text-3xl font-black tracking-tight text-white xs-mx:text-2xl">{displayName}</h1>
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
                        <p className="mt-4 max-w-2xl whitespace-pre-line break-words text-sm leading-7 text-slate-300">
                            {profilePreviewText}
                        </p>
                    </div>

                    {accountType !== "ADMIN" && (
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
                    )}
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

            {accountType === "STUDENT" && (
                <div className="mb-4 px-5" data-aos="fade-up">
                    <div className="rounded-2xl border border-violet-300/25 bg-violet-500/10 p-4">
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/35 bg-violet-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-100">
                                    <IconTarget size={14} />
                                    Student Career Goal
                                </div>
                                <p className="mt-2 text-sm text-slate-200">Set your target role and complete the roadmap to improve guidance and matching.</p>
                            </div>
                            <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-right">
                                <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-100/80">Roadmap Score</div>
                                <div className="text-base font-semibold text-emerald-50">{studentRoadmapPct}%</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Target Role</p>
                                <p className="mt-1 text-sm font-semibold text-white">{targetRole}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Target Location</p>
                                <p className="mt-1 text-sm font-semibold text-white">{targetLocation}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Current Stage</p>
                                <p className="mt-1 text-sm font-semibold text-white">{studentStage}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Recommended Timeline</p>
                                <p className="mt-1 text-sm font-semibold text-white">{totalExp > 0 ? "6-12 months" : "12-24 months"}</p>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="xs" variant="light" color="violet" onClick={() => jumpToSection("Desired Job")}>Set Career Goal</Button>
                            <Button size="xs" variant="light" color="cyan" onClick={() => jumpToSection("Key Skills")}>Align Skills</Button>
                            <Button size="xs" variant="light" color="blue" onClick={() => jumpToSection("Education")}>Update Education</Button>
                            <Button size="xs" variant="light" color="grape" onClick={() => jumpToSection("Update CV")}>Upload CV</Button>
                        </div>

                        <div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-500/10 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-100/90">Missing Items Checklist</p>
                            {studentMissingItems.length === 0 ? (
                                <p className="mt-2 text-sm text-emerald-100">All core student profile items are complete. Great work.</p>
                            ) : (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {studentMissingItems.map((item) => (
                                        <Button
                                            key={`${item.label}-${item.section}`}
                                            size="xs"
                                            variant="light"
                                            color="yellow"
                                            onClick={() => jumpToSection(item.section)}
                                        >
                                            {item.label}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {accountType === "ADMIN" && (
                <div className="mb-4 px-5" data-aos="fade-up">
                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                                    <IconShieldCheck size={14} />
                                    Admin Control Center
                                </div>
                                <h2 className="mt-3 text-lg font-bold text-white">Workspace Administration Snapshot</h2>
                                <p className="mt-1 text-xs text-slate-300">Quick view of platform totals and direct shortcuts to admin dashboard sections.</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button size="xs" variant="light" color="cyan" onClick={() => void navigate("/dashboard?tab=admin&section=overview")}>Overview</Button>
                                <Button size="xs" variant="light" color="grape" onClick={() => void navigate("/dashboard?tab=admin&section=subscription-requests")}>Subscription Requests</Button>
                                <Button size="xs" variant="light" color="orange" onClick={() => void navigate("/dashboard?tab=admin&section=subscription-snapshot")}>Subscription Snapshot</Button>
                            </div>
                        </div>

                        {adminError && (
                            <div className="mt-3 rounded-xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">{adminError}</div>
                        )}

                        {adminLoading ? (
                            <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                                <Loader size={16} /> Loading admin overview...
                            </div>
                        ) : adminOverview && (
                            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Users</p>
                                    <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-white"><IconUsers size={13} /> {adminOverview.totalUsers}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Profiles</p>
                                    <p className="mt-1 text-sm font-semibold text-white">{adminOverview.totalProfiles}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Jobs</p>
                                    <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-white"><IconChartBar size={13} /> {adminOverview.totalJobs}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Active Jobs</p>
                                    <p className="mt-1 text-sm font-semibold text-emerald-200">{adminOverview.activeJobs}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Employers</p>
                                    <p className="mt-1 text-sm font-semibold text-white">{adminOverview.activeEmployers}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Pending Subs</p>
                                    <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-amber-200"><IconClipboardList size={13} /> {adminOverview.employerSubscriptionsPending}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {accountType !== "ADMIN" && (
            <div className="mb-4 px-5" data-aos="fade-up">
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
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
            )}

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

                    <div className="grid grid-cols-1 gap-2 md:hidden">
                        <div className="rounded-2xl border border-bright-sun-400/30 bg-bright-sun-400/10 px-3 py-3 shadow-[0_0_18px_rgba(251,191,36,0.12)]">
                            <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-bright-sun-100/80">Current</div>
                            <div className="flex items-center justify-between gap-2">
                                <Button
                                    variant="subtle"
                                    size="compact-sm"
                                    onClick={handlePrevSection}
                                    disabled={activeSectionIndex === 0}
                                    className="!text-slate-200 disabled:!text-slate-500"
                                >
                                    <IconChevronLeft size={14} />
                                </Button>
                                <div className="flex min-w-0 items-center justify-center gap-2">
                                    <span className="text-bright-sun-300">{activeSection?.icon}</span>
                                    <span className="truncate text-xs font-semibold text-bright-sun-100">{activeSection?.title}</span>
                                </div>
                                <Button
                                    variant="subtle"
                                    size="compact-sm"
                                    onClick={handleNextSection}
                                    disabled={activeSectionIndex >= profileSections.length - 1}
                                    className="!text-slate-200 disabled:!text-slate-500"
                                >
                                    <IconChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="hidden gap-2 md:grid md:grid-cols-3">
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

                    <div className="mt-4 -mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex min-w-max flex-nowrap gap-2 md:min-w-0 md:flex-wrap">
                            {profileSections.map((section, index) => (
                                <button
                                    key={section.title}
                                    onClick={() => animateSectionChange(index)}
                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        activeSectionIndex === index
                                            ? "border-bright-sun-400/70 bg-bright-sun-400/20 text-bright-sun-200 shadow-[0_0_14px_rgba(251,191,36,0.16)]"
                                            : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                                    }`}
                                >
                                    <span className={activeSectionIndex === index ? "text-bright-sun-300" : "text-slate-400"}>{section.icon}</span>
                                    {section.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-3xl">
                        <div className={`transition-opacity duration-150 ${isSectionFadingOut ? "opacity-0" : "opacity-100"}`}>
                            {activeSection && (
                                <ProfileCard
                                    title={activeSection.title}
                                    icon={activeSection.icon}
                                    defaultOpen={activeSection.defaultOpen ?? true}
                                >
                                    {activeSection.content}
                                </ProfileCard>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default Profile;
