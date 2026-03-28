import { ActionIcon } from "@mantine/core";
import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useMediaQuery } from "@mantine/hooks";

const AddressDetails = () => {
    const dispatch = useDispatch();
    const profile = useSelector((state: any) => state.profile);

    const matches = useMediaQuery("(max-width: 475px)");
    const [edit, setEdit] = useState(false);

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

    const handleClick = () => {
        setEdit(!edit);
    };

    const handleSave = async () => {
        const updatedProfile = { ...profile, ...addressData };
        try {
            await (dispatch as any)(persistProfile(updatedProfile)).unwrap();
            successNotification("Success", "Address Details Updated Successfully");
            setEdit(false);
        } catch (error: any) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    const handleChange = (field: string, value: string) => {
        setAddressData({ ...addressData, [field]: value });
    };

    return (
        <div data-aos="fade-up" className="mb-6">
            {/* Header with edit/save icons */}
            <div className="text-2xl font-semibold mb-3 flex justify-between">
                Address Details
                <div>
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

            {/* Address details rows */}
            <div className="border rounded shadow-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Address Label</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={addressData.addressLabel}
                                onChange={(e) => handleChange("addressLabel", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter address label"
                            />
                        ) : (
                            <div>{addressData.addressLabel || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Address</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={addressData.address}
                                onChange={(e) => handleChange("address", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter address"
                            />
                        ) : (
                            <div>{addressData.address || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Country</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={addressData.country}
                                onChange={(e) => handleChange("country", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter country"
                            />
                        ) : (
                            <div>{addressData.country || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">City</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={addressData.city}
                                onChange={(e) => handleChange("city", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter city"
                            />
                        ) : (
                            <div>{addressData.city || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Pincode</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={addressData.pincode}
                                onChange={(e) => handleChange("pincode", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter pincode"
                            />
                        ) : (
                            <div>{addressData.pincode || "-"}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddressDetails;
