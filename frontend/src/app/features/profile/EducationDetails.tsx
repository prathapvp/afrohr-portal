import { IconPencil, IconPlus } from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { useEffect, useState } from "react";
import { ActionIcon, Button, TextInput, Alert, Select, Modal } from "@mantine/core";
import { changeProfile, persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useMediaQuery } from "@mantine/hooks";
import { EducationsSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";

interface Education {
    degree: string;
    field: string;
    college: string;
    yearOfPassing: string;
}

const EducationDetails = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
    const matches = useMediaQuery("(max-width: 475px)");
    const [editOpen, setEditOpen] = useState(false);
    const [education, setEducation] = useState<Education[]>(profile.education || []);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    // Pagination for display mode
    const [page, setPage] = useState(1);
    const itemsPerPage = 3;
    const totalPages = Math.ceil(education.length / itemsPerPage);
    const paginatedEducation = education.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const handlePrev = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));
    // Reset page if education changes
    useEffect(() => { setPage(1); }, [education.length]);

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
            "::placeholder": {
                color: "rgba(156, 163, 175, 0.7)",
            },
        },
        dropdown: {
            background: "#111827",
            borderColor: "rgba(255, 255, 255, 0.14)",
        },
        option: {
            color: "#f3f4f6",
            "&[data-combobox-selected]": {
                background: "rgba(251, 191, 36, 0.18)",
                color: "#fbbf24",
            },
            "&[data-combobox-active]": {
                background: "rgba(251, 191, 36, 0.18)",
                color: "#fbbf24",
            },
            "&:hover": {
                background: "rgba(255, 255, 255, 0.08)",
                color: "#f9fafb",
            },
        },
    };

    useEffect(() => {
        if (!editOpen) {
            setEducation(profile.education || []);
        }
    }, [profile.education, editOpen]);

    const handleOpenEdit = () => {
        setEducation(profile.education ? JSON.parse(JSON.stringify(profile.education)) : []);
        setValidationErrors({});
        setEditOpen(true);
    };

    const handleCloseEdit = () => {
        setValidationErrors({});
        setEditOpen(false);
    };

    const handleSave = async () => {
        // Validate education data before saving
        const result = validateData({ education }, EducationsSchema);
        
        if (!result.success) {
            setValidationErrors(
                result.errors?.reduce((acc: Record<string, string>, err: string) => {
                    const fieldMatch = err.match(/(\w+)/);
                    const field = fieldMatch ? fieldMatch[0] : 'general';
                    acc[field] = err;
                    return acc;
                }, {}) || {}
            );
            errorNotification("Validation Error", result.message || "Please check your education details");
            return;
        }

        setValidationErrors({});
        const updatedProfile = { ...profile, education };
        dispatch(changeProfile(updatedProfile));

        try {
            await dispatch(persistProfile({ education })).unwrap();
            setEditOpen(false);
            successNotification("Success", "Education Details Updated Successfully");
        } catch (error: unknown) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    const handleAdd = () => {
        setEducation([...education, { degree: "", field: "", college: "", yearOfPassing: "" }]);
    };

    const handleRemove = (index: number) => {
        setEducation(education.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof Education, value: string) => {
        const updated = education.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
        );
        setEducation(updated);
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

            <div className="mt-2">
                {education.length > 0 ? (
                    <>
                        <div className="space-y-4">
                            {paginatedEducation.map((edu, idx) => (
                                <div key={(page - 1) * itemsPerPage + idx} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    <div className="text-lg font-semibold text-mine-shaft-100">
                                        {edu.degree} in {edu.field}
                                    </div>
                                    <div className="text-mine-shaft-300">{edu.college}</div>
                                    <div className="text-sm text-mine-shaft-400">{edu.yearOfPassing}</div>
                                </div>
                            ))}
                        </div>
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
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-mine-shaft-400 sm:p-4">
                        No education added yet. Click edit to add your academic background.
                    </div>
                )}
            </div>

            <Modal
                opened={editOpen}
                onClose={handleCloseEdit}
                title="Edit Education Details"
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
                    {education.map((edu, index) => (
                        <div key={index} className="rounded-xl border border-white/10 bg-slate-900/45 p-4">
                            <div className="mb-3 flex gap-4 xs-mx:flex-wrap">
                                <Select
                                    className="flex-1"
                                    label="Degree"
                                    placeholder="Select degree"
                                    data={["Bachelors", "Masters", "Doctorate", "Diploma", "Certificate"]}
                                    value={edu.degree}
                                    onChange={(value) => handleChange(index, "degree", value || "")}
                                    styles={premiumInputStyles}
                                />
                                <TextInput
                                    className="flex-1"
                                    label="Field of Study"
                                    placeholder="e.g. Computer Science"
                                    value={edu.field}
                                    onChange={(e) => handleChange(index, "field", e.currentTarget.value)}
                                    styles={premiumInputStyles}
                                />
                            </div>
                            <div className="mb-3 flex gap-4 xs-mx:flex-wrap">
                                <TextInput
                                    className="flex-1"
                                    label="College/University"
                                    placeholder="e.g. Anna University"
                                    value={edu.college}
                                    onChange={(e) => handleChange(index, "college", e.currentTarget.value)}
                                    styles={premiumInputStyles}
                                />
                                <TextInput
                                    className="flex-1"
                                    label="Year of Passing"
                                    placeholder="e.g. 2022"
                                    value={edu.yearOfPassing}
                                    onChange={(e) => handleChange(index, "yearOfPassing", e.currentTarget.value)}
                                    styles={premiumInputStyles}
                                />
                            </div>
                            <Button color="red" variant="light" size="xs" onClick={() => handleRemove(index)}>
                                Remove
                            </Button>
                        </div>
                    ))}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <Button variant="light" color="brightSun.4" leftSection={<IconPlus size={16} />} onClick={handleAdd}>
                            Add Education
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

export default EducationDetails;
