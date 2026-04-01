import { IconPencil } from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { useEffect, useState } from "react";
import { ActionIcon, Select, TagsInput, TextInput, Alert, Button, Modal } from "@mantine/core";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { DateInput } from "@mantine/dates";
import { PersonalDetailsSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";

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
    dropdown: {
        background: "#171717",
        borderColor: "rgba(250, 204, 21, 0.22)",
    },
    option: {
        color: "#f3f4f6",
    },
    pill: {
        background: "rgba(250, 204, 21, 0.2)",
        color: "#fde68a",
        border: "1px solid rgba(250, 204, 21, 0.35)",
    },
};

const PersonalDetails = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
    const matches = useMediaQuery("(max-width: 475px)");
    const [editOpen, setEditOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const form = useForm({
        mode: "controlled",
        validateInputOnChange: true,
        initialValues: {
            dateOfBirth: profile.personalDetails?.dateOfBirth ? new Date(profile.personalDetails.dateOfBirth) : null,
            gender: profile.personalDetails?.gender || "",
            nationality: profile.personalDetails?.nationality || "",
            maritalStatus: profile.personalDetails?.maritalStatus || "",
            drivingLicense: profile.personalDetails?.drivingLicense || "",
            currentLocation: profile.personalDetails?.currentLocation || "",
            languagesKnown: profile.personalDetails?.languagesKnown || [],
            visaStatus: profile.personalDetails?.visaStatus || "",
            religion: profile.personalDetails?.religion || "",
            alternateEmail: profile.personalDetails?.alternateEmail || "",
            alternateContact: profile.personalDetails?.alternateContact || "",
        },
    });

    useEffect(() => {
        if (!editOpen) {
            form.setValues({
                dateOfBirth: profile.personalDetails?.dateOfBirth ? new Date(profile.personalDetails.dateOfBirth) : null,
                gender: profile.personalDetails?.gender || "",
                nationality: profile.personalDetails?.nationality || "",
                maritalStatus: profile.personalDetails?.maritalStatus || "",
                drivingLicense: profile.personalDetails?.drivingLicense || "",
                currentLocation: profile.personalDetails?.currentLocation || "",
                languagesKnown: profile.personalDetails?.languagesKnown || [],
                visaStatus: profile.personalDetails?.visaStatus || "",
                religion: profile.personalDetails?.religion || "",
                alternateEmail: profile.personalDetails?.alternateEmail || "",
                alternateContact: profile.personalDetails?.alternateContact || "",
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile.personalDetails, editOpen]);

    const handleOpenEdit = () => {
        form.setValues({
            ...profile.personalDetails,
            dateOfBirth: profile.personalDetails?.dateOfBirth ? new Date(profile.personalDetails.dateOfBirth) : null,
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
        
        // Format dateOfBirth to YYYY-MM-DD string (max 10 chars as per backend validation)
        const formattedValues = { ...formValues };
        if (formattedValues.dateOfBirth) {
            const date = new Date(formattedValues.dateOfBirth);
            formattedValues.dateOfBirth = date.toISOString().split('T')[0];
        }
        
        // Convert empty strings to undefined for optional fields (Zod expects undefined, not "")
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(formattedValues)) {
            cleaned[key] = value === "" ? undefined : value;
        }
        
        const validation = validateData(cleaned, PersonalDetailsSchema);
        
        if (!validation.success) {
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
            await dispatch(persistProfile({ personalDetails: validation.data })).unwrap();
            successNotification("Success", "Personal Details Updated Successfully");
            setEditOpen(false);
        } catch (error: unknown) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
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
                <div className="grid grid-cols-2 gap-4 text-mine-shaft-200 md-mx:grid-cols-1">
                    <div>
                        <span className="font-semibold text-mine-shaft-100">Date of Birth:</span> {
                            profile.personalDetails?.dateOfBirth
                                ? new Date(profile.personalDetails.dateOfBirth).toLocaleDateString()
                                : "Not specified"
                        }
                    </div>
                    <div>
                        <span className="font-semibold text-mine-shaft-100">Gender:</span> {profile.personalDetails?.gender || "Not specified"}
                    </div>
                    <div>
                        <span className="font-semibold text-mine-shaft-100">Nationality:</span> {profile.personalDetails?.nationality || "Not specified"}
                    </div>
                    <div>
                        <span className="font-semibold text-mine-shaft-100">Marital Status:</span> {profile.personalDetails?.maritalStatus || "Not specified"}
                    </div>
                    <div>
                        <span className="font-semibold text-mine-shaft-100">Driving License:</span> {profile.personalDetails?.drivingLicense || "Not specified"}
                    </div>
                    <div>
                        <span className="font-semibold text-mine-shaft-100">Current Location:</span> {profile.personalDetails?.currentLocation || "Not specified"}
                    </div>
                    <div>
                        <span className="font-semibold text-mine-shaft-100">Languages Known:</span> {profile.personalDetails?.languagesKnown?.join(", ") || "Not specified"}
                    </div>
                    <div>
                        <span className="font-semibold text-mine-shaft-100">Visa Status:</span> {profile.personalDetails?.visaStatus || "Not specified"}
                    </div>
                    <div>
                        <span className="font-semibold text-mine-shaft-100">Religion:</span> {profile.personalDetails?.religion || "Not specified"}
                    </div>
                    <div>
                        <span className="font-semibold text-mine-shaft-100">Alternate Email:</span> {profile.personalDetails?.alternateEmail || "Not specified"}
                    </div>
                    <div className="col-span-2">
                        <span className="font-semibold text-mine-shaft-100">Alternate Contact:</span> {profile.personalDetails?.alternateContact || "Not specified"}
                    </div>
                </div>
            </div>

            <Modal
                opened={editOpen}
                onClose={handleCloseEdit}
                title="Edit Personal Details"
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
                        <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                            {Object.values(validationErrors).map((error, idx) => (
                                <li key={idx}>{error}</li>
                            ))}
                        </ul>
                    </Alert>
                )}

                <div className="space-y-3">
                    <div className="my-3 flex gap-10 md-mx:gap-5 xs-mx:flex-wrap [&>*]:w-1/2 xs-mx:[&>*]:w-full">
                        <DateInput
                            label="Date of Birth"
                            placeholder="DD/MM/YYYY"
                            maxDate={new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate())}
                            minDate={new Date(new Date().getFullYear() - 100, new Date().getMonth(), new Date().getDate())}
                            styles={premiumInputStyles}
                            {...form.getInputProps("dateOfBirth")}
                        />
                        <Select label="Gender" data={["Male", "Female", "Other"]} styles={premiumInputStyles} {...form.getInputProps("gender")} />
                    </div>
                    <div className="my-3 flex gap-10 md-mx:gap-5 xs-mx:flex-wrap [&>*]:w-1/2 xs-mx:[&>*]:w-full">
                        <TextInput label="Nationality" styles={premiumInputStyles} {...form.getInputProps("nationality")} />
                        <Select label="Marital Status" data={["Single", "Married", "Divorced", "Widowed"]} styles={premiumInputStyles} {...form.getInputProps("maritalStatus")} />
                    </div>
                    <div className="my-3 flex gap-10 md-mx:gap-5 xs-mx:flex-wrap [&>*]:w-1/2 xs-mx:[&>*]:w-full">
                        <Select label="Do you have a Driving License?" data={["Yes", "No"]} styles={premiumInputStyles} {...form.getInputProps("drivingLicense")} />
                        <TextInput label="Current Location" styles={premiumInputStyles} {...form.getInputProps("currentLocation")} />
                    </div>
                    <div className="my-3 flex gap-10 md-mx:gap-5 xs-mx:flex-wrap [&>*]:w-1/2 xs-mx:[&>*]:w-full">
                        <TagsInput label="Languages Known" styles={premiumInputStyles} {...form.getInputProps("languagesKnown")} />
                        <TextInput label="Visa Status For Current Location" styles={premiumInputStyles} {...form.getInputProps("visaStatus")} />
                    </div>
                    <div className="my-3 flex gap-10 md-mx:gap-5 xs-mx:flex-wrap [&>*]:w-1/2 xs-mx:[&>*]:w-full">
                        <TextInput label="Religion" styles={premiumInputStyles} {...form.getInputProps("religion")} />
                        <TextInput label="Alternate Email Address" styles={premiumInputStyles} {...form.getInputProps("alternateEmail")} />
                    </div>
                    <div className="my-3">
                        <TextInput label="Alternate Contact Number" styles={premiumInputStyles} {...form.getInputProps("alternateContact")} />
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

export default PersonalDetails;
