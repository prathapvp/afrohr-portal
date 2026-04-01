import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { useState } from "react";
import { ActionIcon, Divider, NumberInput } from "@mantine/core";
import { changeProfile } from "../../store/slices/ProfileSlice";
import { successNotification } from "../../services/NotificationService";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";

const ProfessionalDetails = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
    const matches = useMediaQuery("(max-width: 475px)");
    const [edit, setEdit] = useState(false);

    const form = useForm({
        mode: "controlled",
        validateInputOnChange: true,
        initialValues: {
            totalExp: profile.totalExp || 0,
        },
    });

    const handleClick = () => {
        if (!edit) {
            setEdit(true);
            form.setValues({ ...profile });
        } else {
            setEdit(false);
        }
    };

    const handleSave = () => {
        setEdit(false);
        const updatedProfile = { ...profile, ...form.getValues() };
        dispatch(changeProfile(updatedProfile));
        successNotification("Success", "Professional Details Updated Successfully");
    };

    return (
        <div className="my-5">
            <div className="flex justify-between items-center" data-aos="zoom-out">
                <h2 className="text-2xl xs-mx:text-xl font-semibold">Professional Details</h2>
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
                    <NumberInput label="Total Work Experience (Years)" {...form.getInputProps("totalExp")} />
                </div>
            ) : (
                <div className="my-3">
                    <div>
                        <span className="font-semibold">Total Work Experience:</span> {profile.totalExp || 0} Years
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessionalDetails;
