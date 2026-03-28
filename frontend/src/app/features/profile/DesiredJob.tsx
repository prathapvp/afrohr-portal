import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { ActionIcon, Divider, TagsInput, Alert } from "@mantine/core";
import { changeProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { DesiredJobSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { extractErrorMessage } from "../../services/error-extractor-service";

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
    dropdown: {
        background: "#171717",
        borderColor: "rgba(250, 204, 21, 0.22)",
    },
    pill: {
        background: "rgba(250, 204, 21, 0.2)",
        color: "#fde68a",
        border: "1px solid rgba(250, 204, 21, 0.35)",
    },
};

const DesiredJob = () => {
    const dispatch = useDispatch();
    const profile = useSelector((state: any) => state.profile);
    const matches = useMediaQuery("(max-width: 475px)");
    const [edit, setEdit] = useState(false);
    const [validationError, setValidationError] = useState<string>("");

    const form = useForm({
        mode: "controlled",
        validateInputOnChange: true,
        initialValues: {
            preferredDesignations: profile.desiredJob?.preferredDesignations || [],
            preferredLocations: profile.desiredJob?.preferredLocations || [],
            preferredIndustries: profile.desiredJob?.preferredIndustries || [],
        },
    });

    const handleClick = () => {
        if (!edit) {
            setEdit(true);
            form.setValues({
                preferredDesignations: profile.desiredJob?.preferredDesignations || [],
                preferredLocations: profile.desiredJob?.preferredLocations || [],
                preferredIndustries: profile.desiredJob?.preferredIndustries || [],
            });
            setValidationError("");
        } else {
            setEdit(false);
            setValidationError("");
        }
    };

    const handleSave = async () => {
        const formValues = form.getValues();
        const validation = validateData(formValues, DesiredJobSchema);

        if (!validation.success) {
            const errorMsg = validation.errors?.[0] ?? "Validation error";
            setValidationError(errorMsg);
            errorNotification("Validation Error", errorMsg); // ✅ always a string
            return;
        }


        setValidationError("");
        const updatedProfile = { ...profile, desiredJob: validation.data };
        dispatch(changeProfile(updatedProfile));

        try {
            await (dispatch as any)(persistProfile(updatedProfile)).unwrap();
            setEdit(false);
            successNotification("Success", "Desired Job Updated Successfully");
        } catch (error: any) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    return (
        <div className="mt-2">
            {/* Header with Edit Icons */}
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

            {/* Validation Error Alert */}
            {validationError && (
                <Alert color="red" title="Error" mb="md" withCloseButton onClose={() => setValidationError("")}>
                    {validationError}
                </Alert>
            )}

            {/* Editable Tags */}
            {edit ? (
                <>
                    <div className="my-3">
                        <TagsInput
                            label="Preferred Designations"
                            placeholder="Enter designation and press Enter"
                            styles={premiumInputStyles}
                            {...form.getInputProps("preferredDesignations")}
                        />
                    </div>
                    <div className="my-3">
                        <TagsInput
                            label="Preferred Locations"
                            placeholder="Enter location and press Enter"
                            styles={premiumInputStyles}
                            {...form.getInputProps("preferredLocations")}
                        />
                    </div>
                    <div className="my-3">
                        <TagsInput
                            label="Preferred Industries"
                            placeholder="Enter industry and press Enter"
                            styles={premiumInputStyles}
                            {...form.getInputProps("preferredIndustries")}
                        />
                    </div>
                </>
            ) : (
                <div className="mt-2 text-mine-shaft-200">
                    <div className="space-y-3">
                        {/* Designations */}
                        <div>
                            <span className="font-semibold text-mine-shaft-100">Preferred Designations:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {profile.desiredJob?.preferredDesignations?.length
                                    ? profile.desiredJob.preferredDesignations.map((designation: string, idx: number) => (
                                        <span key={idx} className="rounded-full px-3 py-1 text-sm font-semibold text-mine-shaft-950 border border-bright-sun-300/80 bg-gradient-to-r from-bright-sun-300 to-yellow-300 shadow-[0_3px_10px_rgba(251,191,36,0.28)]">
                                            {designation}
                                        </span>
                                    ))
                                    : <span className="text-mine-shaft-300">Not specified</span>}
                            </div>
                        </div>

                        {/* Locations */}
                        <div>
                            <span className="font-semibold text-mine-shaft-100">Preferred Locations:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {profile.desiredJob?.preferredLocations?.length
                                    ? profile.desiredJob.preferredLocations.map((location: string, idx: number) => (
                                        <span key={idx} className="rounded-full px-3 py-1 text-sm font-semibold text-mine-shaft-950 border border-bright-sun-300/80 bg-gradient-to-r from-bright-sun-300 to-yellow-300 shadow-[0_3px_10px_rgba(251,191,36,0.28)]">
                                            {location}
                                        </span>
                                    ))
                                    : <span className="text-mine-shaft-300">Not specified</span>}
                            </div>
                        </div>

                        {/* Industries */}
                        <div>
                            <span className="font-semibold text-mine-shaft-100">Preferred Industries:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {profile.desiredJob?.preferredIndustries?.length
                                    ? profile.desiredJob.preferredIndustries.map((industry: string, idx: number) => (
                                        <span key={idx} className="rounded-full px-3 py-1 text-sm font-semibold text-mine-shaft-950 border border-bright-sun-300/80 bg-gradient-to-r from-bright-sun-300 to-yellow-300 shadow-[0_3px_10px_rgba(251,191,36,0.28)]">
                                            {industry}
                                        </span>
                                    ))
                                    : <span className="text-mine-shaft-300">Not specified</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesiredJob;
