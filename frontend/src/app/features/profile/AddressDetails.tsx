import { ActionIcon, TextInput } from "@mantine/core";
import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useMediaQuery } from "@mantine/hooks";
import ProfileEditorModal, { premiumProfileInputStyles } from "./ProfileEditorModal";

const inputClassName = "[&_input]:bg-slate-950/70 [&_input]:text-slate-100 [&_input]:border-white/20 [&_input]:focus:border-cyan-400 [&_input]:placeholder:text-slate-500";

const AddressDetails = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);

    const matches = useMediaQuery("(max-width: 475px)");
    const [editOpen, setEditOpen] = useState(false);

    const [addressData, setAddressData] = useState({
        addressLabel: "",
        address: "",
        country: "",
        city: "",
        pincode: "",
    });

    // Initialize local state from profile
    useEffect(() => {
        setAddressData({
            addressLabel: profile?.addressLabel || "Primary Address",
            address: profile?.address || "",
            country: profile?.country || "",
            city: profile?.city || "",
            pincode: profile?.pincode || "",
        });
    }, [profile]);

    const handleOpenEdit = () => {
        setAddressData({
            addressLabel: String(profile?.addressLabel || "Primary Address"),
            address: String(profile?.address || ""),
            country: String(profile?.country || ""),
            city: String(profile?.city || ""),
            pincode: String(profile?.pincode || ""),
        });
        setEditOpen(true);
    };

    const handleCloseEdit = () => {
        setEditOpen(false);
    };

    const handleSave = async () => {
        const updatedProfile = { ...profile, ...addressData };
        try {
            await dispatch(persistProfile(updatedProfile)).unwrap();
            successNotification("Success", "Address Details Updated Successfully");
            setEditOpen(false);
        } catch (error: unknown) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    const handleChange = (field: string, value: string) => {
        setAddressData({ ...addressData, [field]: value });
    };

    return (
        <div data-aos="fade-up" className="mb-6">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-white">Address Details</h3>
                    <p className="text-xs text-slate-400">Maintain accurate office location information for candidates and business communication.</p>
                </div>
                <div className="flex items-center gap-2">
                    <ActionIcon
                        onClick={handleOpenEdit}
                        variant="light"
                        color="yellow"
                        size={matches ? "md" : "lg"}
                        className="!bg-bright-sun-400/20 !text-bright-sun-300 hover:!bg-bright-sun-400/30"
                    >
                        <IconPencil className="h-4 w-4" stroke={1.8} />
                    </ActionIcon>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.85),rgba(2,6,23,0.9))]">
                <div className="grid grid-cols-1 divide-y divide-white/10">
                    {[
                        ["Address Label", "addressLabel", "Enter address label"],
                        ["Address", "address", "Enter address"],
                        ["Country", "country", "Enter country"],
                        ["City", "city", "Enter city"],
                        ["Pincode", "pincode", "Enter pincode"],
                    ].map(([label, key, placeholder]) => (
                        <div key={String(key)} className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(170px,0.9fr)_minmax(0,2fr)] sm:items-center">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
                            <p className="text-sm font-medium text-slate-100">{String(profile?.[key as keyof typeof profile] || "-")}</p>
                        </div>
                    ))}
                </div>
            </div>

            <ProfileEditorModal
                opened={editOpen}
                onClose={handleCloseEdit}
                onSave={handleSave}
                title="Edit Address Details"
                size="lg"
                description="Keep your office location accurate so candidates and admins always see the correct business address."
            >
                <div className="grid gap-4">
                    {[
                        ["Address Label", "addressLabel", "Enter address label"],
                        ["Address", "address", "Enter address"],
                        ["Country", "country", "Enter country"],
                        ["City", "city", "Enter city"],
                        ["Pincode", "pincode", "Enter pincode"],
                    ].map(([label, key, placeholder]) => (
                        <TextInput
                            key={String(key)}
                            label={String(label)}
                            value={String(addressData[key as keyof typeof addressData] || "")}
                            onChange={(e) => handleChange(String(key), e.currentTarget.value)}
                            className={inputClassName}
                            autoComplete="off"
                            placeholder={String(placeholder)}
                            styles={premiumProfileInputStyles}
                        />
                    ))}
                </div>
            </ProfileEditorModal>
        </div>
    );
};

export default AddressDetails;
