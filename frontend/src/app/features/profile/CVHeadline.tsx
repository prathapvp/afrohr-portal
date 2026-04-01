import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { useState } from "react";
import { ActionIcon, Divider, Textarea, Alert } from "@mantine/core";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { CVHeadlineSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";

const CVHeadline = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
    const matches = useMediaQuery("(max-width: 475px)");
    const [edit, setEdit] = useState(false);
    const [validationError, setValidationError] = useState<string>("");

    const form = useForm({
        mode: "controlled",
        validateInputOnChange: true,
        initialValues: {
            cvHeadline: profile.cvHeadline || "",
        },
    });

    const handleClick = () => {
        if (!edit) {
            setEdit(true);
            form.setValues({ cvHeadline: profile.cvHeadline || "" });
            setValidationError("");
        } else {
            setEdit(false);
        }
    };

    const handleSave = async () => {
        const formValues = form.getValues();
        const validation = validateData(formValues, CVHeadlineSchema);

        if (!validation.success) {
            const errorMsg = validation.errors?.[0] ?? "Validation error";
            setValidationError(errorMsg);
            errorNotification("Validation Error", errorMsg);
            return;
        }

        setValidationError("");
        const updatedProfile = { ...profile, ...validation.data };
        
        try {
            await dispatch(persistProfile(updatedProfile)).unwrap();
            successNotification("Success", "CV Headline Updated Successfully");
            setEdit(false);
        } catch (error: unknown) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    return (
        <div className="my-5">
            {/* Header with Edit Icons */}
            <div className="flex justify-between items-start" data-aos="zoom-out">
                <div>
                    <h2 className="text-2xl xs-mx:text-xl font-semibold mb-1">CV Headline</h2>
                    <p className="text-sm text-mine-shaft-600">
                        Keep it updated for better job opportunities
                    </p>
                </div>
                <div className="flex">
                    {edit && (
                        <ActionIcon
                            onClick={handleSave}
                            variant="subtle"
                            color="green.8"
                            size={matches ? "md" : "lg"}
                        >
                            <IconCheck className="w-4/5 h-4/5" stroke={1.5} />
                        </ActionIcon>
                    )}
                    <ActionIcon
                        onClick={handleClick}
                        variant="subtle"
                        color={edit ? "red.8" : "brightSun.4"}
                        size={matches ? "md" : "lg"}
                    >
                        {edit ? (
                            <IconX className="w-4/5 h-4/5" stroke={1.5} />
                        ) : (
                            <IconPencil className="w-4/5 h-4/5" stroke={1.5} />
                        )}
                    </ActionIcon>
                </div>
            </div>

            <Divider my="sm" />

            {/* Editable CV Headline */}
            {edit ? (
                <div className="my-3">
                    {validationError && (
                        <Alert
                            color="red"
                            title="Error"
                            mb="md"
                            withCloseButton
                            onClose={() => setValidationError("")}
                        >
                            {validationError}
                        </Alert>
                    )}
                    <Textarea
                        label="CV Headline"
                        placeholder="e.g., Immediate Joiner - Java Full Stack Developer"
                        minRows={3}
                        maxRows={5}
                        {...form.getInputProps("cvHeadline")}
                        error={validationError ? true : false}
                    />
                </div>
            ) : (
                <div className="my-3">
                    <div className="text-mine-shaft-700 text-base">
                        {profile.cvHeadline ||
                            "Click the edit icon to add a headline that describes your professional profile"}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CVHeadline;
