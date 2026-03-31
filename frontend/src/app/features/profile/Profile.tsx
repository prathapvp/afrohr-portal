import {
    Avatar,
    Button,
    FileInput,
    Loader,
    Overlay,
} from "@mantine/core";
import { useState } from "react";
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
} from "@tabler/icons-react";
import { getBase64 } from "../../services/utilities";
import { secureError } from "../../services/secure-logging-service";
import { extractErrorMessage, formatErrorForLogging } from "../../services/error-extractor-service";
import { parseResume } from "../../services/ProfileService";

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
    const [parseFile, setParseFile] = useState<File | null>(null);
    const [parsing, setParsing] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [downloadingWord, setDownloadingWord] = useState(false);

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

            await (dispatch as any)(persistProfile(updatedProfile)).unwrap();
            setParseFile(null);
            successNotification("Parsed Successfully", "Profile inputs were filled from the uploaded file.");
        } catch (error: any) {
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
            <div className="mb-2 mt-20 flex flex-col gap-4 px-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-bright-sun-400/40 bg-bright-sun-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-bright-sun-300">
                        <IconSparkles className="h-3.5 w-3.5" stroke={1.8} />
                        Premium Identity
                    </div>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-white xs-mx:text-2xl">{profile.name || user?.name || "Your Name"}</h1>
                    {(profile.jobTitle || profile.company) && (
                        <p className="mt-1 text-sm text-slate-300">
                            {profile.jobTitle}{profile.jobTitle && profile.company ? " at " : ""}{profile.company}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Skills</p>
                        <p className="text-sm font-semibold text-white">{skillsCount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Experience</p>
                        <p className="text-sm font-semibold text-white">{experienceCount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Certs</p>
                        <p className="text-sm font-semibold text-white">{certificationCount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Resume</p>
                        <p className="text-sm font-semibold text-white">{hasCv ? "Uploaded" : "Missing"}</p>
                    </div>
                </div>
            </div>

            {/* ---------------- Profile Completeness ---------------- */}
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
                {accountType === "EMPLOYER" ? (
                    <div className="grid grid-cols-1 gap-3">
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
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
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
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

export default Profile;
