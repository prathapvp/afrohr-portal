import { ActionIcon } from "@mantine/core";
import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useMediaQuery } from "@mantine/hooks";

const CompanyDetails = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);

    const matches = useMediaQuery("(max-width: 475px)");
    const [edit, setEdit] = useState(false);

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

    const handleClick = () => {
        setEdit(!edit);
    };

    const handleSave = async () => {
        const updatedProfile = { ...profile, ...companyData };
        try {
            await dispatch(persistProfile(updatedProfile)).unwrap();
            successNotification("Success", "Company Details Updated Successfully");
            setEdit(false);
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
            <div className="text-2xl font-semibold mb-3 flex justify-between">
                Company Details
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

            {/* Company details rows */}
            <div className="border rounded shadow-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Company Type</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={companyData.companyType}
                                onChange={(e) => handleChange("companyType", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter company type"
                            />
                        ) : (
                            <div>{companyData.companyType || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Industry Type</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={companyData.industryType}
                                onChange={(e) => handleChange("industryType", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter industry type"
                            />
                        ) : (
                            <div>{companyData.industryType || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Contact Person</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={companyData.contactPerson}
                                onChange={(e) => handleChange("contactPerson", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter contact person"
                            />
                        ) : (
                            <div>{companyData.contactPerson || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Alias</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={companyData.alias}
                                onChange={(e) => handleChange("alias", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter alias"
                            />
                        ) : (
                            <div>{companyData.alias || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Contact Designation</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={companyData.contactDesignation}
                                onChange={(e) => handleChange("contactDesignation", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter contact designation"
                            />
                        ) : (
                            <div>{companyData.contactDesignation || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Website URL</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={companyData.websiteUrl}
                                onChange={(e) => handleChange("websiteUrl", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter website URL"
                            />
                        ) : (
                            <div>{companyData.websiteUrl || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Profile for Hot Vacancies</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={companyData.profileHotVacancies}
                                onChange={(e) => handleChange("profileHotVacancies", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter profile for hot vacancies"
                            />
                        ) : (
                            <div>{companyData.profileHotVacancies || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Profile for Classifieds</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={companyData.profileClassifieds}
                                onChange={(e) => handleChange("profileClassifieds", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter profile for classifieds"
                            />
                        ) : (
                            <div>{companyData.profileClassifieds || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Phone Number 1</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={companyData.phone1}
                                onChange={(e) => handleChange("phone1", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter phone number 1"
                            />
                        ) : (
                            <div>{companyData.phone1 || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Phone Number 2</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={companyData.phone2}
                                onChange={(e) => handleChange("phone2", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter phone number 2"
                            />
                        ) : (
                            <div>{companyData.phone2 || "-"}</div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div className="text-gray-500 font-medium w-1/3">Fax Number</div>
                    <div className="w-2/3">
                        {edit ? (
                            <input
                                type="text"
                                value={companyData.fax}
                                onChange={(e) => handleChange("fax", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoComplete="off"
                                placeholder="Enter fax number"
                            />
                        ) : (
                            <div>{companyData.fax || "-"}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyDetails;
