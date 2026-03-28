import { IconCheck, IconPencil, IconPlus, IconX } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { ActionIcon, Button, Divider, TextInput, Textarea, Alert } from "@mantine/core";
import { changeProfile, persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useMediaQuery } from "@mantine/hooks";
import { WorkSamplesSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";

interface WorkSample {
    title: string;
    url: string;
    description: string;
}

const WorkSamples = () => {
    const dispatch = useDispatch();
    const profile = useSelector((state: any) => state.profile);
    const matches = useMediaQuery("(max-width: 475px)");
    const [edit, setEdit] = useState(false);
    const [workSamples, setWorkSamples] = useState<WorkSample[]>(profile.workSamples || []);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const handleClick = () => {
        if (!edit) {
            setEdit(true);
            setWorkSamples(profile.workSamples || []);
            setValidationErrors({});
        } else {
            setEdit(false);
        }
    };

    const handleSave = async () => {
        // Validate work samples data before saving
        const result = validateData({ workSamples }, WorkSamplesSchema);
        
        if (!result.success) {
            setValidationErrors(
                result.errors?.reduce((acc: Record<string, string>, err: string) => {
                    const fieldMatch = err.match(/(\w+)/);
                    const field = fieldMatch ? fieldMatch[0] : 'general';
                    acc[field] = err;
                    return acc;
                }, {}) || {}
            );
            errorNotification("Validation Error", result.message || "Please check your work samples");
            return;
        }

        setValidationErrors({});
        const updatedProfile = { ...profile, workSamples };
        dispatch(changeProfile(updatedProfile));

        try {
            await (dispatch as any)(persistProfile(updatedProfile)).unwrap();
            setEdit(false);
            successNotification("Success", "Work Samples Updated Successfully");
        } catch (error: any) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    const handleAdd = () => {
        setWorkSamples([...workSamples, { title: "", url: "", description: "" }]);
    };

    const handleRemove = (index: number) => {
        setWorkSamples(workSamples.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof WorkSample, value: string) => {
        const updated = [...workSamples];
        updated[index][field] = value;
        setWorkSamples(updated);
    };

    return (
        <div className="mt-2">
            <div className="flex justify-end items-center" data-aos="zoom-out">
                <div className="flex">
                    {edit && (
                        <ActionIcon onClick={handleSave} variant="subtle" color="green.8" size={matches ? "md" : "lg"}>
                            <IconCheck className="w-4/5 h-4/5" stroke={1.5} />
                        </ActionIcon>
                    )}
                    <ActionIcon
                        onClick={handleClick}
                        variant="subtle"
                        color={edit ? "red.8" : "brightSun.4"}
                        size={matches ? "md" : "lg"}
                    >
                        {edit ? <IconX className="w-4/5 h-4/5" stroke={1.5} /> : <IconPencil className="w-4/5 h-4/5" stroke={1.5} />}
                    </ActionIcon>
                </div>
            </div>

            {Object.keys(validationErrors).length > 0 && (
                <Alert title="Validation Error" color="red" mb="md" onClose={() => setValidationErrors({})}>
                    {Object.values(validationErrors).map((error, idx) => (
                        <div key={idx} className="text-sm">• {error}</div>
                    ))}
                </Alert>
            )}

            {edit ? (
                <div className="mt-2">
                    {workSamples.map((sample, index) => (
                        <div key={index} className="mb-4 p-4 border rounded-md">
                            <div className="flex flex-col gap-3">
                                <TextInput
                                    label="Project Title"
                                    value={sample.title}
                                    onChange={(e) => handleChange(index, "title", e.currentTarget.value)}
                                />
                                <TextInput
                                    label="URL"
                                    value={sample.url}
                                    onChange={(e) => handleChange(index, "url", e.currentTarget.value)}
                                />
                                <Textarea
                                    label="Description"
                                    minRows={2}
                                    value={sample.description}
                                    onChange={(e) => handleChange(index, "description", e.currentTarget.value)}
                                />
                            </div>
                            <Button color="red" size="xs" mt="sm" onClick={() => handleRemove(index)}>
                                Remove
                            </Button>
                        </div>
                    ))}
                    <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
                        Add Work Sample
                    </Button>
                </div>
            ) : (
                <div className="mt-2">
                    {workSamples.length > 0 ? (
                        <div className="space-y-4">
                            {workSamples.map((sample, index) => (
                                <div key={index} className="border-l-4 border-brightSun-400 pl-4">
                                    <div className="font-semibold text-lg">{sample.title}</div>
                                    <a href={sample.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                        {sample.url}
                                    </a>
                                    {sample.description && <p className="text-sm text-mine-shaft-600 mt-1">{sample.description}</p>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-mine-shaft-600">No work samples added yet. Click edit to add.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkSamples;
