import { IconCheck, IconPencil, IconPlus, IconX } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { ActionIcon, Button, Divider, Select, TextInput, Alert } from "@mantine/core";
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
    const [edit, setEdit] = useState(false);
    const [onlineProfiles, setOnlineProfiles] = useState<OnlineProfile[]>(profile.onlineProfiles || []);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
            {edit ? (
                <div className="mt-2">
                    {onlineProfiles.map((profile, index) => (
                        <div key={index} className="mb-4 p-4 border rounded-md">
                            <div className="flex gap-4 mb-3 xs-mx:flex-wrap">
                                <Select
                                    className="flex-1"
                                    label="Platform"
                                    data={["LinkedIn", "Github", "Youtube", "Instagram", "Twitter", "Facebook", "Portfolio"]}
                                    value={profile.platform}
                                    onChange={(value) => handleChange(index, "platform", value || "")}
                                />
                                <TextInput
                                    className="flex-1"
                                    label="URL"
                                    value={profile.url}
                                    onChange={(e) => handleChange(index, "url", e.currentTarget.value)}
                                />
                            </div>
                            <Button color="red" size="xs" onClick={() => handleRemove(index)}>
                                Remove
                            </Button>
                        </div>
                    ))}
                    <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
                        Add Online Profile
                    </Button>
                </div>
            ) : (
                <div className="mt-2">
                    {onlineProfiles.length > 0 ? (
                        <div className="space-y-3">
                            {onlineProfiles.map((profile, index) => (
                                <div key={index} className="border-l-4 border-brightSun-400 pl-4">
                                    <div className="font-semibold">{profile.platform}</div>
                                    <a href={profile.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                        {profile.url}
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-mine-shaft-600">No online profiles added yet. Click edit to add.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default OnlineProfiles;
