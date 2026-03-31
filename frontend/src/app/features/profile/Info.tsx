import {
    IconBriefcase,
    IconMapPin,
    IconPencil,
    IconMail,
} from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { ActionIcon, NumberInput, TextInput, Alert, Button, Modal } from "@mantine/core";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { InfoSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";

const Info = () => {
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.user);
    const profile = useSelector((state: any) => state.profile);
    const matches = useMediaQuery("(max-width: 475px)");
    const [editOpen, setEditOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

    const form = useForm({
        mode: "controlled",
        validateInputOnChange: true,
        initialValues: {
            name: profile.name || "",
            email: profile.email || "",
            jobTitle: profile.jobTitle || "",
            company: profile.company || "",
            location: profile.location || "",
            totalExp: profile.totalExp || 1,
        },
    });

    // Re-sync form values when profile data arrives after initial mount
    useEffect(() => {
        if (profile?.id && !editOpen) {
            form.setValues({
                name: profile.name || "",
                email: profile.email || "",
                jobTitle: profile.jobTitle || "",
                company: profile.company || "",
                location: profile.location || "",
                totalExp: profile.totalExp || 1,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.id]);

    const handleOpenEdit = () => {
        form.setValues({
            name: profile.name || "",
            email: profile.email || user?.email || "",
            jobTitle: profile.jobTitle || "",
            company: profile.company || "",
            location: profile.location || "",
            totalExp: profile.totalExp || 1,
        });
        setValidationErrors({});
        setEditOpen(true);
    };

    const handleCloseEdit = () => {
        setValidationErrors({});
        setEditOpen(false);
    };

    const handleSave = async () => {
        const formValues = form.getValues();
        
        // Validate against schema
        const validation = validateData(formValues, InfoSchema);
        
        if (!validation.success) {
            // Extract errors by field
            const fieldErrors: Record<string, string> = {};
            validation.errors?.forEach(error => {
                const fieldName = error.split(':')[0].trim();
                fieldErrors[fieldName] = error;
            });
            setValidationErrors(fieldErrors);
            errorNotification("Validation Error", "Please fix the errors below");
            return;
        }

        setValidationErrors({});
        
        try {
            await (dispatch as any)(persistProfile(validation.data)).unwrap();
            successNotification("Success", "Profile Updated Successfully");
            setEditOpen(false);
        } catch (error: any) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    return (
        <div className="mt-2">
            <div className="mb-1 flex justify-end" data-aos="zoom-out">
                <ActionIcon
                    onClick={handleOpenEdit}
                    variant="subtle"
                    color="brightSun.4"
                    size={matches ? "md" : "lg"}
                >
                    <IconPencil className="h-4/5 w-4/5" stroke={1.5} />
                </ActionIcon>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-mine-shaft-200">
                    <IconBriefcase className="h-4 w-4 shrink-0 text-mine-shaft-400" stroke={1.5} />
                    {profile.jobTitle || <span className="italic text-mine-shaft-500">No job title</span>}
                    {profile.jobTitle && profile.company ? " \u2022 " : ""}
                    {profile.company}
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-mine-shaft-300">
                    <IconMapPin className="h-4 w-4 shrink-0 text-mine-shaft-400" stroke={1.5} />
                    {profile.location || <span className="italic text-mine-shaft-500">Not specified</span>}
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-mine-shaft-300">
                    <IconBriefcase className="h-4 w-4 shrink-0 text-mine-shaft-400" stroke={1.5} />
                    {profile.totalExp ? `${profile.totalExp} yrs experience` : <span className="italic text-mine-shaft-500">Experience not specified</span>}
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-mine-shaft-200">
                    <IconMail className="h-4 w-4 shrink-0 text-mine-shaft-400" stroke={1.5} />
                    {profile.email || user?.email || <span className="italic text-mine-shaft-500">No email</span>}
                </div>
            </div>

            <Modal
                opened={editOpen}
                onClose={handleCloseEdit}
                title="Edit Basic Information"
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
                    <Alert color="red" title="Validation Errors" mb="md" withCloseButton onClose={() => setValidationErrors({})}>
                        <ul style={{ marginBottom: 0, paddingLeft: "20px" }}>
                            {Object.values(validationErrors).map((error, idx) => (
                                <li key={idx}>{error}</li>
                            ))}
                        </ul>
                    </Alert>
                )}

                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <TextInput
                            label="Full Name"
                            {...form.getInputProps("name")}
                            error={validationErrors.name && "Invalid"}
                            styles={premiumInputStyles}
                        />
                        <TextInput
                            label="Email ID"
                            {...form.getInputProps("email")}
                            disabled
                            styles={premiumInputStyles}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <TextInput
                            label="Job Title"
                            withAsterisk
                            placeholder="Enter your job title"
                            {...form.getInputProps("jobTitle")}
                            styles={premiumInputStyles}
                        />
                        <TextInput
                            label="Company"
                            withAsterisk
                            placeholder="Enter your company"
                            {...form.getInputProps("company")}
                            styles={premiumInputStyles}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <TextInput
                            label="Location"
                            withAsterisk
                            placeholder="Enter your location"
                            {...form.getInputProps("location")}
                            styles={premiumInputStyles}
                        />
                        <NumberInput
                            label="Experience (Years)"
                            withAsterisk
                            hideControls
                            clampBehavior="strict"
                            min={1}
                            max={50}
                            {...form.getInputProps("totalExp")}
                            styles={premiumInputStyles}
                        />
                    </div>

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

export default Info;
