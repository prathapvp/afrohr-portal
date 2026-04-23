import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { ActionIcon, TagsInput, Alert, Button, Modal } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useMediaQuery } from "@mantine/hooks";
import { SkillsSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";
import { getProfileSkillSuggestions } from "../../services/profile-service";

const toUniqueSkills = (skills: string[]) =>
    Array.from(new Set(skills.map((skill) => skill.trim()).filter(Boolean)));

const asString = (value: unknown) => String(value ?? "").trim();

const asStringArray = (value: unknown) => {
    if (!Array.isArray(value)) {
        return [] as string[];
    }
    return value.map((item) => asString(item)).filter(Boolean);
};

const buildSkillSuggestionContext = (profile: Record<string, unknown>, accountType: string) => {
    const desiredJob = (profile.desiredJob ?? {}) as Record<string, unknown>;
    const preferredDesignations = asStringArray(desiredJob.preferredDesignations).join(", ");
    const preferredIndustries = asStringArray(desiredJob.preferredIndustries).join(", ");
    const preferredLocations = asStringArray(desiredJob.preferredLocations).join(", ");

    return [
        `Account Type: ${accountType || "UNKNOWN"}`,
        `Job Title: ${asString(profile.jobTitle) || "Not provided"}`,
        `Industry: ${asString(profile.industryType) || "Not provided"}`,
        `Summary: ${asString(profile.profileSummary || profile.about) || "Not provided"}`,
        `Company Type: ${asString(profile.companyType) || "Not provided"}`,
        `Student Goal: ${asString(profile.targetRole) || "Not provided"}`,
        `Preferred Designations: ${preferredDesignations || "Not provided"}`,
        `Preferred Industries: ${preferredIndustries || "Not provided"}`,
        `Preferred Locations: ${preferredLocations || "Not provided"}`,
    ].join("\n");
};

const skillToneClasses = [
    "border-amber-300/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(120,53,15,0.18))] text-amber-100 shadow-[0_8px_20px_rgba(251,191,36,0.14)]",
    "border-cyan-300/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(8,47,73,0.22))] text-cyan-50 shadow-[0_8px_20px_rgba(34,211,238,0.12)]",
    "border-fuchsia-300/30 bg-[linear-gradient(135deg,rgba(217,70,239,0.16),rgba(88,28,135,0.22))] text-fuchsia-50 shadow-[0_8px_20px_rgba(217,70,239,0.12)]",
    "border-emerald-300/30 bg-[linear-gradient(135deg,rgba(52,211,153,0.16),rgba(6,78,59,0.22))] text-emerald-50 shadow-[0_8px_20px_rgba(52,211,153,0.12)]",
    "border-violet-300/30 bg-[linear-gradient(135deg,rgba(167,139,250,0.16),rgba(76,29,149,0.22))] text-violet-50 shadow-[0_8px_20px_rgba(167,139,250,0.12)]",
];

const Skills = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
    const user = useAppSelector((state) => state.user as { accountType?: string } | null);
    const accountType = user?.accountType || "";
    const [skills, setSkills] = useState<string[]>(profile.skills || []);
    const [editOpen, setEditOpen] = useState(false);
    const matches = useMediaQuery('(max-width: 475px)');
    const [validationError, setValidationError] = useState<string>("");
    const [profileAwareSuggestions, setProfileAwareSuggestions] = useState<string[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [suggestionsError, setSuggestionsError] = useState<string>("");

    const premiumInputStyles = {
        label: {
            color: "#d1d5db",
            fontWeight: 600,
            marginBottom: "6px",
        },
        input: {
            background: "rgba(15, 23, 42, 0.55)",
            color: "#f3f4f6",
            borderColor: "rgba(255, 255, 255, 0.14)",
        },
        pill: {
            background: "linear-gradient(135deg, rgba(251,191,36,0.22), rgba(217,70,239,0.18), rgba(34,211,238,0.18))",
            color: "#f8fafc",
            fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.14)",
        },
    };

    useEffect(() => {
        if (!editOpen) {
            setSkills(profile.skills || []);
        }
    }, [profile.skills, editOpen]);

    const handleOpenEdit = () => {
        setSkills(profile.skills || []);
        setValidationError("");
        setSuggestionsError("");
        setEditOpen(true);
    };

    const handleCloseEdit = () => {
        setValidationError("");
        setSuggestionsError("");
        setEditOpen(false);
    };

    useEffect(() => {
        if (!editOpen) {
            return;
        }

        const existingSkills = toUniqueSkills([
            ...asStringArray(profile.skills),
            ...asStringArray(profile.itSkills),
        ]);

        const profileContext = buildSkillSuggestionContext(profile, accountType);
        let active = true;

        setSuggestionsLoading(true);
        setSuggestionsError("");

        void getProfileSkillSuggestions(accountType, profileContext, existingSkills)
            .then((suggestions) => {
                if (!active) {
                    return;
                }
                const next = toUniqueSkills(suggestions)
                    .filter((item) => !existingSkills.some((existing) => existing.toLowerCase() === item.toLowerCase()))
                    .slice(0, 40);
                setProfileAwareSuggestions(next);
            })
            .catch((error: unknown) => {
                if (!active) {
                    return;
                }
                setProfileAwareSuggestions([]);
                setSuggestionsError(extractErrorMessage(error));
            })
            .finally(() => {
                if (active) {
                    setSuggestionsLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [accountType, editOpen, profile]);

    const handleSave = async () => {
        const validation = validateData({ skills }, SkillsSchema);

        if (!validation.success) {
            const errorMsg = validation.errors?.[0] ?? "Validation error";
            setValidationError(errorMsg);
            errorNotification("Validation Error", errorMsg);
            return;
        }

        setValidationError("");
        
        try {
            await dispatch(persistProfile({ skills })).unwrap();
            successNotification("Success", "Skills Updated Successfully");
            setEditOpen(false);
        } catch (error: unknown) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    return (
        <div className="mt-2">
            <div className="mb-1 flex justify-end" data-aos="zoom-out">
                <ActionIcon onClick={handleOpenEdit} variant="subtle" color="brightSun.4" size={matches ? "md" : "lg"}>
                    <IconPencil className="w-4/5 h-4/5" stroke={1.5} />
                </ActionIcon>
            </div>

            <div className="rounded-[24px] border border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.68),rgba(2,6,23,0.88))] p-3 sm:p-4 shadow-[0_18px_44px_rgba(2,6,23,0.22)]">
                <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Core Skills</div>
                <div className="flex flex-wrap gap-2.5">
                    {profile?.skills?.length
                        ? profile.skills.map((skill: string, index: number) => (
                            <div
                                key={index}
                                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 ${skillToneClasses[index % skillToneClasses.length]}`}
                            >
                                {skill}
                            </div>
                        ))
                        : <span className="italic text-mine-shaft-400">No skills added yet. Click edit to add your core strengths.</span>}
                </div>
            </div>

            <Modal
                opened={editOpen}
                onClose={handleCloseEdit}
                title="Edit Key Skills"
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
                {validationError && (
                    <Alert color="red" title="Error" mb="md" withCloseButton onClose={() => setValidationError("")}>
                        {validationError}
                    </Alert>
                )}

                <div className="flex flex-col gap-4">
                    <TagsInput
                        data-aos="zoom-out"
                        label="Key Skills"
                        placeholder="Add skill and press Enter or comma"
                        description={suggestionsLoading
                            ? "Loading AI suggestions from Spring AI (Ollama)..."
                            : suggestionsError
                                ? "Could not load AI suggestions right now. You can still add skills manually."
                                : accountType === "STUDENT"
                            ? "Suggestions use your student goal/target role and profile context for better roadmap alignment."
                            : "Suggestions are personalized from your profile (job title, industry, summary, and existing skills)."}
                        data={profileAwareSuggestions}
                        searchable
                        value={skills}
                        onChange={setSkills}
                        splitChars={[',', '|']}
                        error={!!validationError}
                        styles={premiumInputStyles}
                    />

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="light" color="gray" onClick={handleCloseEdit} className="rounded-full px-5">
                            Cancel
                        </Button>
                        <Button color="brightSun.4" onClick={handleSave} className="rounded-full px-5 font-semibold text-mine-shaft-950">
                            Save
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Skills;
