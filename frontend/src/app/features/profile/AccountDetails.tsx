import { ActionIcon, TextInput } from "@mantine/core";
import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useMediaQuery } from "@mantine/hooks";
import ProfileEditorModal, { premiumProfileInputStyles } from "./ProfileEditorModal";

const inputClassName = "[&_input]:bg-slate-950/70 [&_input]:text-slate-100 [&_input]:border-white/20 [&_input]:focus:border-cyan-400 [&_input]:placeholder:text-slate-500";

const AccountDetails = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
    const user = useAppSelector((state) => state.user as { name?: string; email?: string; accountType?: string } | null);

    const matches = useMediaQuery("(max-width: 475px)");

    const [editOpen, setEditOpen] = useState(false);
    const [username, setUsername] = useState(profile?.username || user?.name || "");
    const [reportingManager, setReportingManager] = useState(profile?.reportingManager || "");
    const [mobileNumber, setMobileNumber] = useState(profile?.mobileNumber || "");

    const handleOpenEdit = () => {
        setUsername(profile?.username || user?.name || "");
        setReportingManager(profile?.reportingManager || "");
        setMobileNumber(profile?.mobileNumber || "");
        setEditOpen(true);
    };

    const handleCloseEdit = () => {
        setEditOpen(false);
    };

    const handleSave = async () => {
        const updatedProfile = {
            ...profile,
            username,
            reportingManager,
            mobileNumber,
        };
        try {
            await dispatch(persistProfile(updatedProfile)).unwrap();
            successNotification("Success", "Account Details Updated Successfully");
            setEditOpen(false);
        } catch (error: unknown) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    return (
        <div data-aos="fade-up" className="mb-6">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-white">Account Details</h3>
                    <p className="text-xs text-slate-400">Keep your communication and account contact information up to date.</p>
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
                    <div className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(170px,0.9fr)_minmax(0,2fr)] sm:items-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Username</p>
                        <p className="text-sm font-medium text-slate-100">{String(profile?.username || user?.name || "-")}</p>
                    </div>

                    <div className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(170px,0.9fr)_minmax(0,2fr)] sm:items-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Group</p>
                        <p className="text-sm font-medium text-slate-100">{String(profile?.group || "-")}</p>
                    </div>

                    <div className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(170px,0.9fr)_minmax(0,2fr)] sm:items-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Email for Communication</p>
                        <p className="text-sm font-medium text-slate-100 break-all">{String(user?.email || profile?.email || "-")}</p>
                    </div>

                    <div className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(170px,0.9fr)_minmax(0,2fr)] sm:items-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Role</p>
                        <p className="text-sm font-medium text-slate-100">
                            {user?.accountType === "EMPLOYER"
                                ? "Recruiter"
                                : user?.accountType === "APPLICANT"
                                ? "Applicant"
                                : String(profile?.role || "-")}
                        </p>
                    </div>

                    <div className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(170px,0.9fr)_minmax(0,2fr)] sm:items-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Reporting Manager</p>
                        <p className="text-sm font-medium text-slate-100">{String(profile?.reportingManager || "-")}</p>
                    </div>

                    <div className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(170px,0.9fr)_minmax(0,2fr)] sm:items-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Mobile Number</p>
                        <p className="text-sm font-medium text-slate-100">{String(profile?.mobileNumber || "-")}</p>
                    </div>
                </div>
            </div>

            <ProfileEditorModal
                opened={editOpen}
                onClose={handleCloseEdit}
                onSave={handleSave}
                title="Edit Account Details"
                size="lg"
            >
                <div className="flex flex-col gap-4">
                    <TextInput
                        label="Username"
                        value={String(username)}
                        onChange={(e) => setUsername(e.currentTarget.value)}
                        className={inputClassName}
                        autoComplete="off"
                        placeholder="Enter username"
                        maxLength={80}
                        styles={premiumProfileInputStyles}
                    />
                    <TextInput
                        label="Reporting Manager"
                        value={String(reportingManager)}
                        onChange={(e) => setReportingManager(e.currentTarget.value)}
                        className={inputClassName}
                        autoComplete="off"
                        placeholder="Enter reporting manager name"
                        styles={premiumProfileInputStyles}
                    />
                    <TextInput
                        label="Mobile Number"
                        value={String(mobileNumber)}
                        onChange={(e) => setMobileNumber(e.currentTarget.value)}
                        className={inputClassName}
                        autoComplete="off"
                        placeholder="Enter mobile number"
                        styles={premiumProfileInputStyles}
                    />
                </div>
            </ProfileEditorModal>
        </div>
    );
};

export default AccountDetails;
