import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { ActionIcon, TagsInput, Alert } from "@mantine/core";
import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useMediaQuery } from "@mantine/hooks";
import { SkillsSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";

const Skills = () => {
    const dispatch = useDispatch();
    const profile = useSelector((state: any) => state.profile);
    const [skills, setSkills] = useState<string[]>([]);
    const [edit, setEdit] = useState(false);
    const matches = useMediaQuery('(max-width: 475px)');
    const [validationError, setValidationError] = useState<string>("");

    const handleClick = () => {
        if (!edit) {
            setSkills(profile.skills || []);
            setEdit(true);
            setValidationError("");
        } else setEdit(false);
    };

    const handleSave = async () => {
        const validation = validateData({ skills }, SkillsSchema);

        if (!validation.success) {
            const errorMsg = validation.errors?.[0] ?? "Validation error";
            setValidationError(errorMsg);
            errorNotification("Validation Error", errorMsg);
            return;
        }

        setValidationError("");
        const updatedProfile = { ...profile, skills };
        
        try {
            await (dispatch as any)(persistProfile(updatedProfile)).unwrap();
            successNotification("Success", "Skills Updated Successfully");
            setEdit(false);
        } catch (error: any) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-2">
                <div>
                    {edit && (
                        <ActionIcon onClick={handleSave} variant="subtle" color="green.8" size={matches ? "md" : "lg"}>
                            <IconCheck className="w-4/5 h-4/5" stroke={1.5} />
                        </ActionIcon>
                    )}
                    <ActionIcon onClick={handleClick} variant="subtle" color={edit ? "red.8" : "brightSun.4"} size={matches ? "md" : "lg"}>
                        {edit ? <IconX className="w-4/5 h-4/5" stroke={1.5} /> : <IconPencil className="w-4/5 h-4/5" stroke={1.5} />}
                    </ActionIcon>
                </div>
            </div>

            {validationError && (
                <Alert color="red" title="Error" mb="md" withCloseButton onClose={() => setValidationError("")}>
                    {validationError}
                </Alert>
            )}

            {edit ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
                    <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-slate-300">Edit Skills</div>
                    <TagsInput
                        data-aos="zoom-out"
                        placeholder="Add skill (press Enter or comma to add)"
                        value={skills}
                        onChange={setSkills}
                        splitChars={[',', '|']}
                        error={!!validationError}
                    />
                </div>
            ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
                <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-slate-300">Core Skills</div>
                <div className="flex flex-wrap gap-2">
                    {profile?.skills?.length
                        ? profile.skills.map((skill: string, index: number) => (
                            <div
                                key={index}
                                className="rounded-full border border-amber-200/80 bg-gradient-to-r from-bright-sun-300 via-yellow-300 to-amber-300 px-3 py-1.5 text-sm font-semibold text-mine-shaft-950 shadow-[0_6px_14px_rgba(251,191,36,0.28)]"
                            >
                                {skill}
                            </div>
                        ))
                        : <span className="text-mine-shaft-300">No skills added</span>}
                </div>
                </div>
            )}
        </div>
    );
};

export default Skills;
