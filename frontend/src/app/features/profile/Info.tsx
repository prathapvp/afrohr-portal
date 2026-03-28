import {
    IconBriefcase,
    IconCheck,
    IconMapPin,
    IconPencil,
    IconX,
    IconMail,
} from "@tabler/icons-react";
import SelectInput from "./SelectInput";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { ActionIcon, NumberInput, TextInput, Divider, Tooltip, Alert } from "@mantine/core";
import fields from "../../data/Profile";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { InfoSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";

const Info = () => {
    const select = fields;
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.user);
    const profile = useSelector((state: any) => state.profile);
    const matches = useMediaQuery("(max-width: 475px)");
    const [edit, setEdit] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
        if (profile?.id && !edit) {
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

    const handleClick = () => {
        if (!edit) {
            setEdit(true);
            form.setValues({ ...profile });
            setValidationErrors({});
        } else {
            setEdit(false);
            setValidationErrors({});
        }
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
        const updatedProfile = { ...profile, ...validation.data };
        
        try {
            await (dispatch as any)(persistProfile(updatedProfile)).unwrap();
            successNotification("Success", "Profile Updated Successfully");
            setEdit(false);
        } catch (error: any) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    return (
        <div className="mt-2">
            {/* Header with Name and Edit Icons */}
            <div className="flex justify-end" data-aos="zoom-out">
                <div>
                    {edit && (
                        <Tooltip label="Save changes" withArrow>
                            <ActionIcon onClick={handleSave} variant="subtle" color="green.8" size={matches ? "md" : "lg"}>
                                <IconCheck className="w-4/5 h-4/5" stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                    <Tooltip label={edit ? "Discard changes" : "Edit"} withArrow>
                        <ActionIcon
                            onClick={handleClick}
                            variant="subtle"
                            color={edit ? "red.8" : "brightSun.4"}
                            size={matches ? "md" : "lg"}
                        >
                            {edit ? <IconX className="w-4/5 h-4/5" stroke={1.5} /> : <IconPencil className="w-4/5 h-4/5" stroke={1.5} />}
                        </ActionIcon>
                    </Tooltip>
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

            {/* Editable Fields */}
            {edit ? (
                <>
                    <div className="flex gap-10 md-mx:gap-5 [&>*]:w-1/2 xs-mx:[&>*]:w-full xs-mx:flex-wrap my-3">
                        <TextInput 
                            label="Full Name" 
                            {...form.getInputProps("name")}
                            error={validationErrors['name'] && 'Invalid'}
                        />
                        <Tooltip
                            label="Please visit account settings to change Email ID"
                            position="top"
                            withArrow
                            color="#fff"
                            styles={{ tooltip: { color: "white" } }}
                        >
                            <TextInput
                                label="Email ID"
                                {...form.getInputProps("email")}
                                disabled
                            />
                        </Tooltip>
                    </div>

                    <div className="flex gap-10 md-mx:gap-5 [&>*]:w-1/2 xs-mx:[&>*]:w-full xs-mx:flex-wrap my-3">
                        <SelectInput form={form} name="jobTitle" {...select[0]} />
                        <SelectInput form={form} name="company" {...select[1]} />
                    </div>

                    <div className="flex gap-10 md-mx:gap-5 [&>*]:w-1/2 xs-mx:[&>*]:w-full xs-mx:flex-wrap my-3">
                        <SelectInput name="location" form={form} {...select[2]} />
                        <NumberInput
                            label="Experience (Years)"
                            withAsterisk
                            hideControls
                            clampBehavior="strict"
                            min={1}
                            max={50}
                            {...form.getInputProps("totalExp")}
                        />
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-2 xs-mx:grid-cols-1 gap-x-6 gap-y-2 text-sm">
                    <div className="flex gap-1.5 items-center text-mine-shaft-200">
                        <IconBriefcase className="h-4 w-4 text-mine-shaft-400 shrink-0" stroke={1.5} />
                        {profile.jobTitle || <span className="text-mine-shaft-500 italic">No job title</span>}
                        {profile.jobTitle && profile.company ? " \u2022 " : ""}{profile.company}
                    </div>
                    <div className="flex gap-1.5 items-center text-mine-shaft-300">
                        <IconMapPin className="h-4 w-4 text-mine-shaft-400 shrink-0" stroke={1.5} />
                        {profile.location || <span className="italic text-mine-shaft-500">Not specified</span>}
                    </div>
                    <div className="flex gap-1.5 items-center text-mine-shaft-300">
                        <IconBriefcase className="h-4 w-4 text-mine-shaft-400 shrink-0" stroke={1.5} />
                        {profile.totalExp ? `${profile.totalExp} yrs experience` : <span className="italic text-mine-shaft-500">Experience not specified</span>}
                    </div>
                    <div className="flex gap-1.5 items-center text-mine-shaft-200">
                        <IconMail className="h-4 w-4 text-mine-shaft-400 shrink-0" stroke={1.5} />
                        {profile.email || user?.email || <span className="text-mine-shaft-500 italic">No email</span>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Info;
