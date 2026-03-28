import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { ActionIcon, Divider, Select, TagsInput, TextInput, Alert } from "@mantine/core";
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
    const dispatch = useDispatch();
    const profile = useSelector((state: any) => state.profile);
    const matches = useMediaQuery("(max-width: 475px)");
    const [edit, setEdit] = useState(false);
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

    const handleClick = () => {
        if (!edit) {
            setEdit(true);
            form.setValues({
                ...profile.personalDetails,
                dateOfBirth: profile.personalDetails?.dateOfBirth ? new Date(profile.personalDetails.dateOfBirth) : null,
            });
            setValidationErrors({});
        } else {
            setEdit(false);
            setValidationErrors({});
        }
    };

    const handleSave = async () => {
        const formValues = form.getValues();
        
        // Format dateOfBirth to YYYY-MM-DD string (max 10 chars as per backend validation)
        const formattedValues = { ...formValues };
        if (formattedValues.dateOfBirth) {
            const date = new Date(formattedValues.dateOfBirth);
            (formattedValues as any).dateOfBirth = date.toISOString().split('T')[0]; // Extract YYYY-MM-DD only
        }
        
        // Convert empty strings to undefined for optional fields (Zod expects undefined, not "")
        const cleaned: Record<string, any> = {};
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
        const updatedProfile = { ...profile, personalDetails: validation.data };
        
        try {
            await (dispatch as any)(persistProfile(updatedProfile)).unwrap();
            successNotification("Success", "Personal Details Updated Successfully");
            setEdit(false);
        } catch (error: any) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
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

            {/* Validation Errors Alert */}
            {Object.keys(validationErrors).length > 0 && (
                <Alert color="red" title="Validation Errors" mb="md" withCloseButton onClose={() => setValidationErrors({})}>
                    <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                        {Object.values(validationErrors).map((error, idx) => (
                            <li key={idx}>{error}</li>
                        ))}
                    </ul>
                </Alert>
            )}

            {edit ? (
                <>
                    <div className="flex gap-10 md-mx:gap-5 [&>*]:w-1/2 xs-mx:[&>*]:w-full xs-mx:flex-wrap my-3">
                        <DateInput label="Date of Birth" styles={premiumInputStyles} {...form.getInputProps("dateOfBirth")} />
                        <Select
                            label="Gender"
                            data={["Male", "Female", "Other"]}
                            styles={premiumInputStyles}
                            {...form.getInputProps("gender")}
                        />
                    </div>
                    <div className="flex gap-10 md-mx:gap-5 [&>*]:w-1/2 xs-mx:[&>*]:w-full xs-mx:flex-wrap my-3">
                        <TextInput label="Nationality" styles={premiumInputStyles} {...form.getInputProps("nationality")} />
                        <Select
                            label="Marital Status"
                            data={["Single", "Married", "Divorced", "Widowed"]}
                            styles={premiumInputStyles}
                            {...form.getInputProps("maritalStatus")}
                        />
                    </div>
                    <div className="flex gap-10 md-mx:gap-5 [&>*]:w-1/2 xs-mx:[&>*]:w-full xs-mx:flex-wrap my-3">
                        <Select
                            label="Do you have a Driving License?"
                            data={["Yes", "No"]}
                            styles={premiumInputStyles}
                            {...form.getInputProps("drivingLicense")}
                        />
                        <TextInput label="Current Location" styles={premiumInputStyles} {...form.getInputProps("currentLocation")} />
                    </div>
                    <div className="flex gap-10 md-mx:gap-5 [&>*]:w-1/2 xs-mx:[&>*]:w-full xs-mx:flex-wrap my-3">
                        <TagsInput label="Languages Known" styles={premiumInputStyles} {...form.getInputProps("languagesKnown")} />
                        <TextInput label="Visa Status For Current Location" styles={premiumInputStyles} {...form.getInputProps("visaStatus")} />
                    </div>
                    <div className="flex gap-10 md-mx:gap-5 [&>*]:w-1/2 xs-mx:[&>*]:w-full xs-mx:flex-wrap my-3">
                        <TextInput label="Religion" styles={premiumInputStyles} {...form.getInputProps("religion")} />
                        <TextInput label="Alternate Email Address" styles={premiumInputStyles} {...form.getInputProps("alternateEmail")} />
                    </div>
                    <div className="my-3">
                        <TextInput label="Alternate Contact Number" styles={premiumInputStyles} {...form.getInputProps("alternateContact")} />
                    </div>
                </>
            ) : (
                <div className="mt-2">
                    <div className="grid grid-cols-2 md-mx:grid-cols-1 gap-4 text-mine-shaft-200">
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
            )}
        </div>
    );
};

export default PersonalDetails;
