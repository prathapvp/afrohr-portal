import { IconCheck, IconPencil, IconPlus, IconX } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
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
    const [page, setPage] = useState(1);
    const itemsPerPage = 3;
    const totalPages = Math.ceil(workSamples.length / itemsPerPage);
    const paginatedSamples = workSamples.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const handlePrev = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));
    // Reset page if workSamples change
    useEffect(() => { setPage(1); }, [workSamples.length]);

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
                                {/* ...other editable fields... */}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {workSamples.length > 0 ? (
                        <>
                            {paginatedSamples.map((sample, idx) => (
                                <div key={(page - 1) * itemsPerPage + idx} className="bg-mine-shaft-800/60 rounded-lg p-4 shadow-md">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-brightSun-300">{sample.title}</span>
                                    </div>
                                    <div className="text-mine-shaft-200 text-sm mb-1">{sample.description}</div>
                                    <a href={sample.url} target="_blank" rel="noopener noreferrer" className="text-pink-400 underline text-xs">{sample.url}</a>
                                </div>
                            ))}
                            <div className="flex justify-center gap-4 mt-2">
                                <Button
                                    variant="gradient"
                                    gradient={{ from: 'brightSun.5', to: 'pink.4', deg: 90 }}
                                    size={matches ? "xs" : "sm"}
                                    onClick={handlePrev}
                                    disabled={page === 1}
                                    className="rounded-full shadow-md px-6"
                                >
                                    Previous
                                </Button>
                                <span className="text-mine-shaft-300 font-semibold self-center">Page {page} of {totalPages}</span>
                                <Button
                                    variant="gradient"
                                    gradient={{ from: 'pink.4', to: 'brightSun.5', deg: 90 }}
                                    size={matches ? "xs" : "sm"}
                                    onClick={handleNext}
                                    disabled={page === totalPages}
                                    className="rounded-full shadow-md px-6"
                                >
                                    Next
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-mine-shaft-400">
                            <p className="mb-3">No work samples added yet. Add your best work to impress employers.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkSamples;
