import { IconPencil, IconPlus } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { ActionIcon, Button, Select, TextInput, Alert, Modal } from "@mantine/core";
import { changeProfile, persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useMediaQuery } from "@mantine/hooks";
import { OnlineProfilesSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";

interface OnlineProfile {
    platform: string;
    url: string;
}


const OnlineProfiles = () => {
    const dispatch = useDispatch();
    const profile = useSelector((state: any) => state.profile);
    const matches = useMediaQuery("(max-width: 475px)");
    const [editOpen, setEditOpen] = useState(false);
    const [onlineProfiles, setOnlineProfiles] = useState<OnlineProfile[]>(profile.onlineProfiles || []);
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
        dropdown: {
            background: "#111827",
            borderColor: "rgba(255, 255, 255, 0.12)",
        },
    };

    useEffect(() => {
        if (!editOpen) {
            setOnlineProfiles(profile.onlineProfiles || []);
        }
    }, [profile.onlineProfiles, editOpen]);

    const handleOpenEdit = () => {
        setOnlineProfiles(profile.onlineProfiles || []);
        setValidationErrors({});
        setEditOpen(true);
    };

    const handleCloseEdit = () => {
        setValidationErrors({});
        setEditOpen(false);
    };

    const handleSave = async () => {
        const result = validateData({ onlineProfiles }, OnlineProfilesSchema);

        if (!result.success) {
            setValidationErrors(
                result.errors?.reduce((acc: Record<string, string>, err: string) => {
                    const fieldMatch = err.match(/(\w+)/);
                    const field = fieldMatch ? fieldMatch[0] : "general";
                    acc[field] = err;
                    return acc;
                }, {}) || {}
            );
            errorNotification("Validation Error", result.message || "Please check your online profiles");
            return;
        }

        setValidationErrors({});
        const updatedProfile = { ...profile, onlineProfiles };
        dispatch(changeProfile(updatedProfile));

        try {
            await (dispatch as any)(persistProfile({ onlineProfiles })).unwrap();
            successNotification("Success", "Online Profiles Updated Successfully");
            setEditOpen(false);
        } catch (error: any) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    const handleAdd = () => {
        setOnlineProfiles([...onlineProfiles, { platform: "", url: "" }]);
    };

    const handleRemove = (index: number) => {
        setOnlineProfiles(onlineProfiles.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof OnlineProfile, value: string) => {
        const updated = [...onlineProfiles];
        updated[index][field] = value;
        setOnlineProfiles(updated);
    };

    return (
        <div className="mt-2">
            <div className="mb-1 flex justify-end items-center" data-aos="zoom-out">
                <ActionIcon onClick={handleOpenEdit} variant="subtle" color="brightSun.4" size={matches ? "md" : "lg"}>
                    <IconPencil className="w-4/5 h-4/5" stroke={1.5} />
                </ActionIcon>
            </div>

            <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
                {onlineProfiles.length > 0 ? (
                    <div className="space-y-3">
                        {onlineProfiles.map((onlineProfile, index) => (
                            <div key={index} className="rounded-xl border border-white/10 bg-slate-900/45 p-4">
                                <div className="font-semibold text-mine-shaft-100">{onlineProfile.platform}</div>
                                <a href={onlineProfile.url} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-cyan-300 hover:underline">
                                    {onlineProfile.url}
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm italic text-mine-shaft-400">No online profiles added yet. Click edit to add your public links.</p>
                )}
            </div>

            <Modal
                opened={editOpen}
                onClose={handleCloseEdit}
                title="Edit Online Profiles"
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
                    {onlineProfiles.map((onlineProfile, index) => (
                        <div key={index} className="rounded-xl border border-white/10 bg-slate-900/45 p-4">
                            <div className="mb-3 flex gap-4 xs-mx:flex-wrap">
                                <Select
                                    className="flex-1"
                                    label="Platform"
                                    data={["LinkedIn", "Github", "Youtube", "Instagram", "Twitter", "Facebook", "Portfolio"]}
                                    value={onlineProfile.platform}
                                    onChange={(value) => handleChange(index, "platform", value || "")}
                                    styles={premiumInputStyles}
                                />
                                <TextInput
                                    className="flex-1"
                                    label="URL"
                                    value={onlineProfile.url}
                                    onChange={(e) => handleChange(index, "url", e.currentTarget.value)}
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
                            Add Online Profile
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

export default OnlineProfiles;
