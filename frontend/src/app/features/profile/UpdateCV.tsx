import { IconUpload, IconFileText, IconCheck, IconX, IconRefresh, IconPencil } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { Button, FileInput, Loader, Badge, Text, Divider, Modal, ActionIcon } from "@mantine/core";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { parseResume, uploadResume } from "../../services/ProfileService";

const premiumInputStyles = {
    label: {
        color: "#d1d5db",
        fontWeight: 600,
        marginBottom: "6px",
    },
    input: {
        background: "rgba(20, 20, 22, 0.85)",
        color: "#f3f4f6",
        borderColor: "rgba(250, 204, 21, 0.22)",
    },
    section: {
        color: "#f3f4f6",
    },
};

// Matches Spring Boot ProfileDTO fields
interface ParsedData {
    name?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    company?: string;
    location?: string;
    about?: string;
    profileSummary?: string;
    totalExp?: number;
    skills?: string[];
    experiences?: { title: string; company: string; location: string; startDate: string; endDate: string; working: boolean; description: string }[];
    education?: { degree: string; field: string; college: string; yearOfPassing: string }[];
    certifications?: { name: string; issuer: string; issueDate: string; certificateId: string }[];
    personalDetails?: { currentLocation?: string; languagesKnown?: string[]; alternateContact?: string };
    address?: string;
    summary?: string;
}

const UpdateCV = () => {
    const dispatch = useDispatch<any>();
    const profile = useSelector((state: any) => state.profile);
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [parsed, setParsed] = useState<ParsedData | null>(null);
    const [manageOpen, setManageOpen] = useState(false);

    const buildProfileUpdates = (parsedData: ParsedData) => {
        const updates: any = {
            cvFileName: cvFile?.name,
            cvLastUpdated: new Date().toISOString(),
        };

        // Basic ProfileDTO fields — only overwrite if parsed has a value
        if (parsedData.name && !profile.name) updates.name = parsedData.name;
        if (parsedData.email && !profile.email) updates.email = parsedData.email;
        if (parsedData.jobTitle) updates.jobTitle = parsedData.jobTitle;
        if (parsedData.company) updates.company = parsedData.company;
        if (parsedData.location) updates.location = parsedData.location;
        if (parsedData.about) updates.about = parsedData.about;
        if (parsedData.profileSummary) updates.profileSummary = parsedData.profileSummary;
        if (parsedData.totalExp) updates.totalExp = parsedData.totalExp;

        // Collections — merge with existing (ProfileDTO lists)
        if (parsedData.skills?.length) {
            updates.skills = [...new Set([...(profile.skills || []), ...parsedData.skills])].slice(0, 100);
        }
        if (parsedData.experiences?.length) {
            updates.experiences = [...(profile.experiences || []), ...parsedData.experiences];
        }
        if (parsedData.certifications?.length) {
            updates.certifications = [...(profile.certifications || []), ...parsedData.certifications];
        }
        if (parsedData.education?.length) {
            updates.education = [...(profile.education || []), ...parsedData.education];
        }

        // PersonalDetails (nested DTO)
        if (parsedData.personalDetails) {
            updates.personalDetails = {
                ...(profile.personalDetails || {}),
                ...(parsedData.personalDetails.currentLocation ? { currentLocation: parsedData.personalDetails.currentLocation } : {}),
                ...(parsedData.personalDetails.languagesKnown?.length ? { languagesKnown: parsedData.personalDetails.languagesKnown } : {}),
                ...(parsedData.personalDetails.alternateContact ? { alternateContact: parsedData.personalDetails.alternateContact } : {}),
            };
        }

        // Map parsed contact fields to backend-supported fields
        if (parsedData.phone && !profile.mobileNumber) updates.mobileNumber = parsedData.phone;
        if (parsedData.phone && !profile.phone1) updates.phone1 = parsedData.phone;
        if (parsedData.address && !profile.address) updates.address = parsedData.address;

        return updates;
    };

    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(",")[1]); // strip data:...;base64, prefix
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleUpload = async () => {
        if (!cvFile) return;
        if (!profile?.id) {
            errorNotification("Upload Failed", "Profile ID is missing.");
            return;
        }

        setUploading(true);
        try {
            const base64 = await fileToBase64(cvFile);
            await uploadResume(Number(profile.id), base64, cvFile.name);
            successNotification("Uploaded", `${cvFile.name} uploaded successfully.`);
        } catch (err: any) {
            errorNotification("Upload Failed", err?.response?.data?.errorMessage || "Could not upload the resume file.");
        } finally {
            setUploading(false);
        }
    };

    const handleParse = async () => {
        if (!cvFile) return;
        setLoading(true);
        setParsed(null);
        try {
            const base64 = await fileToBase64(cvFile);
            const data = await parseResume(base64, cvFile.name);
            setParsed(data);

            const updates = buildProfileUpdates(data);
            await dispatch(persistProfile(updates)).unwrap();

            successNotification("Profile Updated", `Parsed data from ${cvFile.name} has been applied.`);
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (err: any) {
            errorNotification("Parse Failed", err?.response?.data?.error || "Could not parse the resume file.");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyToProfile = async () => {
        if (!parsed) return;
        const updates = buildProfileUpdates(parsed);

        try {
            await dispatch(persistProfile(updates)).unwrap();
            successNotification("Profile Updated", "Resume data has been applied to your profile.");
            setParsed(null);
            setCvFile(null);
        } catch {
            errorNotification("Update Failed", "Could not save profile changes.");
        }
    };

    return (
        <div className="mt-2">
            <div className="mb-1 flex justify-end">
                <ActionIcon onClick={() => setManageOpen(true)} variant="subtle" color="brightSun.4" size="lg">
                    <IconPencil className="h-4/5 w-4/5" stroke={1.5} />
                </ActionIcon>
            </div>

            {/* Current CV info */}
            {profile.cvFileName && (
                <div className="mb-3 px-3 py-2 bg-mine-shaft-800/60 rounded-lg flex items-center gap-3">
                    <IconFileText size={20} className="text-bright-sun-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <Text size="sm" fw={500} className="text-mine-shaft-200 truncate">{profile.cvFileName}</Text>
                        <Text size="xs" c="dimmed">
                            Updated {profile.cvLastUpdated ? new Date(profile.cvLastUpdated).toLocaleDateString() : "N/A"}
                        </Text>
                    </div>
                    <IconCheck size={18} className="text-green-400" />
                </div>
            )}

            {!profile.cvFileName && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-mine-shaft-400 sm:p-4">
                    No resume uploaded yet. Click edit to upload or parse your CV.
                </div>
            )}

            <Modal
                opened={manageOpen}
                onClose={() => setManageOpen(false)}
                title="Manage Resume"
                centered
                size="lg"
                radius="xl"
                transitionProps={{ transition: "fade", duration: 180 }}
                overlayProps={{ backgroundOpacity: 0.78, blur: 4, color: "#020617" }}
                styles={{
                    content: {
                        background:
                            "radial-gradient(circle at top right, rgba(34,211,238,0.12), transparent 36%), linear-gradient(180deg, rgba(10,15,30,0.98), rgba(2,6,23,0.98))",
                        border: "1px solid rgba(255,255,255,0.12)",
                        boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
                    },
                    header: {
                        background: "transparent",
                        borderBottom: "1px solid rgba(255,255,255,0.10)",
                        paddingBottom: "12px",
                    },
                    title: {
                        color: "#f8fafc",
                        fontWeight: 800,
                        letterSpacing: "0.01em",
                    },
                    close: {
                        color: "#cbd5e1",
                    },
                    body: {
                        paddingTop: "16px",
                    },
                }}
            >
                <div className="space-y-3">
                    <FileInput
                        label="Upload Resume"
                        placeholder="Choose PDF or Word file"
                        accept=".pdf,.doc,.docx"
                        value={cvFile}
                        onChange={(file) => { setCvFile(file); setParsed(null); }}
                        leftSection={<IconUpload size={16} />}
                        styles={premiumInputStyles}
                    />
                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={handleUpload}
                            disabled={!cvFile || uploading}
                            leftSection={uploading ? <Loader size={16} color="white" /> : <IconUpload size={16} />}
                            variant="light"
                            color="yellow"
                            size="sm"
                            className="font-semibold"
                        >
                            {uploading ? "Uploading…" : "Upload Resume"}
                        </Button>
                        <Button
                            onClick={handleParse}
                            disabled={!cvFile || loading}
                            leftSection={loading ? <Loader size={16} color="white" /> : <IconRefresh size={16} />}
                            variant="filled"
                            color="yellow"
                            size="sm"
                            className="font-semibold text-mine-shaft-950"
                        >
                            {loading ? "Parsing…" : "Parse Resume"}
                        </Button>
                    </div>
                </div>

                {parsed && (
                    <div className="mt-4 space-y-3">
                        <Divider label="Extracted Profile Data" labelPosition="center" />

                        <div className="grid grid-cols-1 gap-2 text-sm xs:grid-cols-2">
                            {parsed.name && <Field label="Name" value={parsed.name} />}
                            {parsed.email && <Field label="Email" value={parsed.email} />}
                            {parsed.phone && <Field label="Phone" value={parsed.phone} />}
                            {parsed.jobTitle && <Field label="Job Title" value={parsed.jobTitle} />}
                            {parsed.company && <Field label="Company" value={parsed.company} />}
                            {parsed.location && <Field label="Location" value={parsed.location} />}
                            {parsed.totalExp ? <Field label="Experience" value={`${parsed.totalExp} year(s)`} /> : null}
                        </div>

                        {parsed.about && (
                            <div>
                                <Text size="xs" fw={600} c="dimmed" className="mb-1">Summary</Text>
                                <Text size="sm" className="line-clamp-3 text-mine-shaft-300">{parsed.about}</Text>
                            </div>
                        )}

                        {parsed.skills && parsed.skills.length > 0 && (
                            <div>
                                <Text size="xs" fw={600} c="dimmed" className="mb-1">Skills</Text>
                                <div className="flex flex-wrap gap-1">
                                    {parsed.skills.map((s, i) => (
                                        <Badge key={i} size="sm" variant="light">{s}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {parsed.experiences && parsed.experiences.length > 0 && (
                            <div>
                                <Text size="xs" fw={600} c="dimmed" className="mb-1">Experience ({parsed.experiences.length})</Text>
                                {parsed.experiences.map((exp: any, i: number) => (
                                    <Text key={i} size="sm" className="text-mine-shaft-300">
                                        {exp.title || "Role"} - {exp.startDate} to {exp.endDate}
                                    </Text>
                                ))}
                            </div>
                        )}

                        {parsed.certifications && parsed.certifications.length > 0 && (
                            <div>
                                <Text size="xs" fw={600} c="dimmed" className="mb-1">Certifications ({parsed.certifications.length})</Text>
                                {parsed.certifications.map((c: any, i: number) => (
                                    <Text key={i} size="sm" className="text-mine-shaft-300">{c.name}</Text>
                                ))}
                            </div>
                        )}

                        {parsed.education && parsed.education.length > 0 && (
                            <div>
                                <Text size="xs" fw={600} c="dimmed" className="mb-1">Education ({parsed.education.length})</Text>
                                {parsed.education.map((ed: any, i: number) => (
                                    <Text key={i} size="sm" className="text-mine-shaft-300">
                                        {ed.degree}{ed.college ? ` — ${ed.college}` : ""}{ed.yearOfPassing ? ` (${ed.yearOfPassing})` : ""}
                                    </Text>
                                ))}
                            </div>
                        )}

                        {parsed.personalDetails?.languagesKnown && parsed.personalDetails.languagesKnown.length > 0 && (
                            <div>
                                <Text size="xs" fw={600} c="dimmed" className="mb-1">Languages</Text>
                                <div className="flex flex-wrap gap-1">
                                    {parsed.personalDetails.languagesKnown.map((l: string, i: number) => (
                                        <Badge key={i} size="sm" variant="outline">{l}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button onClick={handleApplyToProfile} leftSection={<IconCheck size={16} />} size="sm">
                                Apply to Profile
                            </Button>
                            <Button variant="subtle" color="gray" onClick={() => { setParsed(null); setCvFile(null); }} leftSection={<IconX size={16} />} size="sm">
                                Discard
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const Field = ({ label, value }: { label: string; value: string }) => (
    <div className="px-2 py-1 bg-mine-shaft-800/40 rounded">
        <Text size="xs" c="dimmed">{label}</Text>
        <Text size="sm" fw={500} className="text-mine-shaft-200">{value}</Text>
    </div>
);

export default UpdateCV;
