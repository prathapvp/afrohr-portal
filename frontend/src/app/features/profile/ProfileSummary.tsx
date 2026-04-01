import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { useState } from "react";
import { ActionIcon, Divider, Textarea } from "@mantine/core";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";

const ProfileSummary = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
    const matches = useMediaQuery("(max-width: 475px)");
    const [edit, setEdit] = useState(false);

    const form = useForm({
        mode: "controlled",
        validateInputOnChange: true,
        initialValues: {
            profileSummary: profile.profileSummary || "",
        },
    });

    const handleClick = () => {
        if (!edit) {
            setEdit(true);
            form.setValues({ profileSummary: profile.profileSummary || "" });
        } else {
            setEdit(false);
        }
    };

    const handleSave = async () => {
        const updatedProfile = { ...profile, ...form.getValues() };
        
        try {
            await dispatch(persistProfile(updatedProfile)).unwrap();
            successNotification("Success", "Profile Summary Updated Successfully");
            setEdit(false);
        } catch (error: unknown) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    return (
        <div className="my-5">
            <div className="flex justify-between items-start" data-aos="zoom-out">
                <div>
                    <h2 className="text-2xl xs-mx:text-xl font-semibold mb-1">Profile Summary</h2>
                    <p className="text-sm text-mine-shaft-600">
                        Keep it updated for better job opportunities
                    </p>
                </div>
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

            <Divider my="sm" />

            {edit ? (
                <div className="my-3">
                    <Textarea
                        label="Profile Summary"
                        placeholder="Describe your professional background and expertise"
                        minRows={4}
                        maxRows={8}
                        {...form.getInputProps("profileSummary")}
                    />
                </div>
            ) : (
                <div className="my-3">
                    <div className="text-mine-shaft-700 text-base whitespace-pre-wrap">
                        {profile.profileSummary || "Click the edit icon to add your professional summary"}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileSummary;
