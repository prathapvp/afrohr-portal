import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { ActionIcon, Divider, TagsInput } from "@mantine/core";
import { changeProfile } from "../../store/slices/ProfileSlice";
import { successNotification } from "../../services/NotificationService";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";

const ITSkills = () => {
    const dispatch = useDispatch();
    const profile = useSelector((state: any) => state.profile);
    const matches = useMediaQuery("(max-width: 475px)");
    const [edit, setEdit] = useState(false);

    const form = useForm({
        mode: "controlled",
        validateInputOnChange: true,
        initialValues: {
            itSkills: profile.itSkills || [],
        },
    });

    const handleClick = () => {
        if (!edit) {
            setEdit(true);
            form.setValues({ itSkills: profile.itSkills || [] });
        } else {
            setEdit(false);
        }
    };

    const handleSave = () => {
        setEdit(false);
        const updatedProfile = { ...profile, ...form.getValues() };
        dispatch(changeProfile(updatedProfile));
        successNotification("Success", "IT Skills Updated Successfully");
    };

    return (
        <div className="my-5">
            <div className="flex justify-between items-center" data-aos="zoom-out">
                <h2 className="text-2xl xs-mx:text-xl font-semibold">IT Skills</h2>
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
                    <TagsInput
                        label="IT Skills"
                        placeholder="Enter skill and press Enter"
                        {...form.getInputProps("itSkills")}
                    />
                </div>
            ) : (
                <div className="my-3">
                    {profile.itSkills && profile.itSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {profile.itSkills.map((skill: string, index: number) => (
                                <span key={index} className="bg-brightSun-100 text-mine-shaft-800 px-3 py-1 rounded-full text-sm">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-mine-shaft-600">No IT skills added yet. Click edit to add.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ITSkills;
