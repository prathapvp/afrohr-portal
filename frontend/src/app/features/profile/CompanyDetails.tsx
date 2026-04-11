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

const CompanyDetails = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);

    const matches = useMediaQuery("(max-width: 475px)");
    const [editOpen, setEditOpen] = useState(false);

    const [companyData, setCompanyData] = useState({
        companyType: "",
        industryType: "",
        contactPerson: "",
        alias: "",
        contactDesignation: "",
        websiteUrl: "",
        profileHotVacancies: "",
        profileClassifieds: "",
        phone1: "",
        phone2: "",
        fax: "",
    });

    // Initialize local state from profile
    useEffect(() => {
        setCompanyData({
            companyType: profile?.companyType || "",
            industryType: profile?.industryType || "",
            contactPerson: profile?.contactPerson || "",
            alias: profile?.alias || "",
            contactDesignation: profile?.contactDesignation || "",
            websiteUrl: profile?.websiteUrl || "",
            profileHotVacancies: profile?.profileHotVacancies || "",
            profileClassifieds: profile?.profileClassifieds || "",
            phone1: profile?.phone1 || "",
            phone2: profile?.phone2 || "",
            fax: profile?.fax || "",
        });
    }, [profile]);

    const handleOpenEdit = () => {
        setCompanyData({
            companyType: String(profile?.companyType || ""),
            industryType: String(profile?.industryType || ""),
            contactPerson: String(profile?.contactPerson || ""),
            alias: String(profile?.alias || ""),
            contactDesignation: String(profile?.contactDesignation || ""),
            websiteUrl: String(profile?.websiteUrl || ""),
            profileHotVacancies: String(profile?.profileHotVacancies || ""),
            profileClassifieds: String(profile?.profileClassifieds || ""),
            phone1: String(profile?.phone1 || ""),
            phone2: String(profile?.phone2 || ""),
            fax: String(profile?.fax || ""),
        });
        setEditOpen(true);
    };

    const handleCloseEdit = () => {
        setEditOpen(false);
    };

    const handleSave = async () => {
        const updatedProfile = { ...profile, ...companyData };
        try {
            await dispatch(persistProfile(updatedProfile)).unwrap();
            successNotification("Success", "Company Details Updated Successfully");
            setEditOpen(false);
        } catch (error: unknown) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    const handleChange = (field: string, value: string) => {
        setCompanyData({ ...companyData, [field]: value });
    };

    return (
        <div data-aos="fade-up" className="mb-6">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-white">Company Details</h3>
                    <p className="text-xs text-slate-400">Build trust with complete business identity and recruitment contact details.</p>
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
                        ["Company Type", "companyType", "Enter company type"],
                        ["Industry Type", "industryType", "Enter industry type"],
                        ["Contact Person", "contactPerson", "Enter contact person"],
                        ["Alias", "alias", "Enter alias"],
                        ["Contact Designation", "contactDesignation", "Enter contact designation"],
                        ["Website URL", "websiteUrl", "Enter website URL"],
                        ["Profile for Hot Vacancies", "profileHotVacancies", "Enter profile for hot vacancies"],
                        ["Profile for Classifieds", "profileClassifieds", "Enter profile for classifieds"],
                        ["Phone Number 1", "phone1", "Enter phone number 1"],
                        ["Phone Number 2", "phone2", "Enter phone number 2"],
                        ["Fax Number", "fax", "Enter fax number"],
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
                title="Edit Company Details"
                size="xl"
                description="Update your business identity, recruiter contact details, and public-facing company information."
            >
                <div className="grid gap-4 md:grid-cols-2">
                    {[
                        ["Company Type", "companyType", "Enter company type"],
                        ["Industry Type", "industryType", "Enter industry type"],
                        ["Contact Person", "contactPerson", "Enter contact person"],
                        ["Alias", "alias", "Enter alias"],
                        ["Contact Designation", "contactDesignation", "Enter contact designation"],
                        ["Website URL", "websiteUrl", "Enter website URL"],
                        ["Profile for Hot Vacancies", "profileHotVacancies", "Enter profile for hot vacancies"],
                        ["Profile for Classifieds", "profileClassifieds", "Enter profile for classifieds"],
                        ["Phone Number 1", "phone1", "Enter phone number 1"],
                        ["Phone Number 2", "phone2", "Enter phone number 2"],
                        ["Fax Number", "fax", "Enter fax number"],
                    ].map(([label, key, placeholder]) => (
                        <TextInput
                            key={String(key)}
                            label={String(label)}
                            value={String(companyData[key as keyof typeof companyData] || "")}
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

export default CompanyDetails;
