import { ActionIcon, Stack } from "@mantine/core";
import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useMediaQuery } from "@mantine/hooks";

const AccountDetails = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
    const user = useAppSelector((state) => state.user as { name?: string; email?: string; accountType?: string } | null);

    const matches = useMediaQuery("(max-width: 475px)");

    const [edit, setEdit] = useState(false);
    const [reportingManager, setReportingManager] = useState(profile?.reportingManager || "");
    const [mobileNumber, setMobileNumber] = useState(profile?.mobileNumber || "");

    const handleClick = () => {
        if (!edit) {
            setReportingManager(profile?.reportingManager || "");
            setMobileNumber(profile?.mobileNumber || "");
            setEdit(true);
        } else {
            setEdit(false);
        }
    };

    const handleSave = async () => {
        const updatedProfile = {
            ...profile,
            reportingManager,
            mobileNumber,
        };
        try {
            await dispatch(persistProfile(updatedProfile)).unwrap();
            successNotification("Success", "Account Details Updated Successfully");
            setEdit(false);
        } catch (error: unknown) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    return (
        <div data-aos="fade-up" className="mb-6">
            {/* Header with edit/save icons */}
            <div className="text-2xl font-semibold mb-3 flex justify-between">
                Account Details
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

            {/* Account details rows */}
            <div className="border rounded shadow-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Username</div>
                    <div className="w-2/3">{user?.name || profile?.username || "-"}</div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Group</div>
                    <div className="w-2/3">{profile?.group || "-"}</div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Email for Communication</div>
                    <div className="w-2/3">{user?.email || profile?.email || "-"}</div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Role</div>
                    <div className="w-2/3">
                        {user?.accountType === "EMPLOYER"
                            ? "Recruiter"
                            : user?.accountType === "APPLICANT"
                            ? "Applicant"
                            : profile?.role || "-"}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Reporting Manager</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={reportingManager}
                                onChange={(e) => setReportingManager(e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter reporting manager name"
                            />
                        ) : (
                            <div>{reportingManager || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Mobile Number</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter mobile number"
                            />
                        ) : (
                            <div>{mobileNumber || "-"}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountDetails;
