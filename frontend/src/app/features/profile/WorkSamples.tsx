import { IconPencil, IconPlus } from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { useEffect, useState } from "react";
import { ActionIcon, Button, TextInput, Textarea, Alert, Modal } from "@mantine/core";
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
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
    const matches = useMediaQuery("(max-width: 475px)");
    const [editOpen, setEditOpen] = useState(false);
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
    };

    useEffect(() => {
        if (!editOpen) {
            setWorkSamples(profile.workSamples || []);
        }
    }, [profile.workSamples, editOpen]);

    const handleOpenEdit = () => {
        setWorkSamples(profile.workSamples || []);
        setValidationErrors({});
        setEditOpen(true);
    };

    const handleCloseEdit = () => {
        setValidationErrors({});
        setEditOpen(false);
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
            await dispatch(persistProfile({ workSamples })).unwrap();
            setEditOpen(false);
            successNotification("Success", "Work Samples Updated Successfully");
        } catch (error: unknown) {
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
            <div className="mb-1 flex justify-end items-center" data-aos="zoom-out">
                <ActionIcon
                    onClick={handleOpenEdit}
                    variant="subtle"
                    color="brightSun.4"
                    size={matches ? "md" : "lg"}
                >
                    <IconPencil className="w-4/5 h-4/5" stroke={1.5} />
                </ActionIcon>
            </div>

            <div className="flex flex-col gap-6">
                {workSamples.length > 0 ? (
                    <>
                        {paginatedSamples.map((sample, idx) => (
                            <div key={(page - 1) * itemsPerPage + idx} className="bg-mine-shaft-800/60 rounded-lg p-4 shadow-md">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="font-semibold text-brightSun-300">{sample.title}</span>
                                </div>
                                <div className="mb-1 text-sm text-mine-shaft-200">{sample.description}</div>
                                <a href={sample.url} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 underline">{sample.url}</a>
                            </div>
                        ))}
                        <div className="mt-2 flex justify-center gap-4">
                            <Button
                                variant="gradient"
                                gradient={{ from: 'brightSun.5', to: 'pink.4', deg: 90 }}
                                size={matches ? "xs" : "sm"}
                                onClick={handlePrev}
                                disabled={page === 1}
                                className="rounded-full px-6 shadow-md"
                            >
                                Previous
                            </Button>
                            <span className="self-center font-semibold text-mine-shaft-300">Page {page} of {totalPages}</span>
                            <Button
                                variant="gradient"
                                gradient={{ from: 'pink.4', to: 'brightSun.5', deg: 90 }}
                                size={matches ? "xs" : "sm"}
                                onClick={handleNext}
                                disabled={page === totalPages}
                                className="rounded-full px-6 shadow-md"
                            >
                                Next
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 py-8 text-center text-mine-shaft-200">
                        <p className="mb-3 text-base text-amber-100">No work samples added yet. Add your best work to impress employers.</p>
                    </div>
                )}
            </div>

            <Modal
                opened={editOpen}
                onClose={handleCloseEdit}
                title="Edit Work Samples"
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
                {Object.keys(validationErrors).length > 0 && (
                    <Alert title="Validation Error" color="red" mb="md" withCloseButton onClose={() => setValidationErrors({})}>
                        {Object.values(validationErrors).map((error, idx) => (
                            <div key={idx} className="text-sm">• {error}</div>
                        ))}
                    </Alert>
                )}

                <div className="flex flex-col gap-4">
                    {workSamples.map((sample, index) => (
                        <div key={index} className="rounded-xl border border-white/10 bg-slate-900/45 p-4">
                            <div className="flex flex-col gap-3">
                                <TextInput
                                    label="Project Title"
                                    value={sample.title}
                                    onChange={(e) => handleChange(index, "title", e.currentTarget.value)}
                                    styles={premiumInputStyles}
                                />
                                <TextInput
                                    label="Project URL"
                                    placeholder="https://example.com"
                                    value={sample.url}
                                    onChange={(e) => handleChange(index, "url", e.currentTarget.value)}
                                    styles={premiumInputStyles}
                                />
                                <Textarea
                                    label="Description"
                                    placeholder="Describe what you built and your impact"
                                    value={sample.description}
                                    onChange={(e) => handleChange(index, "description", e.currentTarget.value)}
                                    minRows={3}
                                    autosize
                                    styles={premiumInputStyles}
                                />
                                <div>
                                    <Button color="red" variant="light" size="xs" onClick={() => handleRemove(index)}>
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <Button variant="light" color="brightSun.4" leftSection={<IconPlus size={16} />} onClick={handleAdd}>
                            Add Work Sample
                        </Button>
                        <div className="flex gap-3">
                            <Button variant="light" color="gray" onClick={handleCloseEdit} className="rounded-full px-5">
                                Cancel
                            </Button>
                            <Button color="brightSun.4" onClick={handleSave} className="rounded-full px-5 font-semibold text-mine-shaft-950">
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default WorkSamples;
