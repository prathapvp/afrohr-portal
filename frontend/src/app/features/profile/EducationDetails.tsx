import { IconCheck, IconPencil, IconPlus, IconX } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { ActionIcon, Button, Divider, TextInput, Alert, Select } from "@mantine/core";
import { changeProfile, persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useMediaQuery } from "@mantine/hooks";
import { EducationsSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";

interface Education {
    degree: string;
    field: string;
    college: string;
    yearOfPassing: string;
}

const EducationDetails = () => {
    const dispatch = useDispatch();
    const profile = useSelector((state: any) => state.profile);
    const matches = useMediaQuery("(max-width: 475px)");
    const [edit, setEdit] = useState(false);
    const [education, setEducation] = useState<Education[]>(profile.education || []);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    // Pagination for display mode
    const [page, setPage] = useState(1);
    const itemsPerPage = 3;
    const totalPages = Math.ceil(education.length / itemsPerPage);
    const paginatedEducation = education.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const handlePrev = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));
    // Reset page if education changes
    useEffect(() => { setPage(1); }, [education.length]);

    const handleClick = () => {
        if (!edit) {
            setEdit(true);
            // Create deep copy to avoid mutating Redux state
            setEducation(profile.education ? JSON.parse(JSON.stringify(profile.education)) : []);
            setValidationErrors({});
        } else {
            setEdit(false);
        }
    };

    const handleSave = async () => {
        // Validate education data before saving
        const result = validateData({ education }, EducationsSchema);
        
        if (!result.success) {
            setValidationErrors(
                result.errors?.reduce((acc: Record<string, string>, err: string) => {
                    const fieldMatch = err.match(/(\w+)/);
                    const field = fieldMatch ? fieldMatch[0] : 'general';
                    acc[field] = err;
                    return acc;
                }, {}) || {}
            );
            errorNotification("Validation Error", result.message || "Please check your education details");
            return;
        }

        setValidationErrors({});
        const updatedProfile = { ...profile, education };
        dispatch(changeProfile(updatedProfile));

        try {
            await (dispatch as any)(persistProfile(updatedProfile)).unwrap();
            setEdit(false);
            successNotification("Success", "Education Details Updated Successfully");
        } catch (error: any) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    const handleAdd = () => {
        setEducation([...education, { degree: "", field: "", college: "", yearOfPassing: "" }]);
    };

    const handleRemove = (index: number) => {
        setEducation(education.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof Education, value: string) => {
        const updated = education.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
        );
        setEducation(updated);
    };

    return (
        <div className="mt-2">
            <div className="flex justify-end items-center" data-aos="zoom-out">
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

            {Object.keys(validationErrors).length > 0 && (
                <Alert title="Validation Error" color="red" mb="md" onClose={() => setValidationErrors({})}>
                    {Object.values(validationErrors).map((error, idx) => (
                        <div key={idx} className="text-sm">• {error}</div>
                    ))}
                </Alert>
            )}

            {edit ? (
                <div className="mt-2">
                    {education.map((edu, index) => (
                        <div key={index} className="mb-4 p-4 border rounded-md">
                            <div className="flex gap-4 mb-3 xs-mx:flex-wrap">
                                <Select
                                    className="flex-1"
                                    label="Degree"
                                    data={["Bachelors", "Masters", "Doctorate", "Diploma", "Certificate"]}
                                    value={edu.degree}
                                    onChange={(value) => handleChange(index, "degree", value || "")}
                                />
                                <TextInput
                                    className="flex-1"
                                    label="Field of Study"
                                    value={edu.field}
                                    onChange={(e) => handleChange(index, "field", e.currentTarget.value)}
                                />
                            </div>
                            <div className="flex gap-4 mb-3 xs-mx:flex-wrap">
                                <TextInput
                                    className="flex-1"
                                    label="College/University"
                                    value={edu.college}
                                    onChange={(e) => handleChange(index, "college", e.currentTarget.value)}
                                />
                                <TextInput
                                    className="flex-1"
                                    label="Year of Passing"
                                    value={edu.yearOfPassing}
                                    onChange={(e) => handleChange(index, "yearOfPassing", e.currentTarget.value)}
                                />
                            </div>
                            <Button color="red" size="xs" onClick={() => handleRemove(index)}>
                                Remove
                            </Button>
                        </div>
                    ))}
                    <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
                        Add Education
                    </Button>
                </div>
            ) : (
                <div className="mt-2">
                    {education.length > 0 ? (
                        <>
                            <div className="space-y-4">
                                {paginatedEducation.map((edu, idx) => (
                                    <div key={(page - 1) * itemsPerPage + idx} className="border-l-4 border-brightSun-400 pl-4">
                                        <div className="font-semibold text-lg">
                                            {edu.degree} in {edu.field}
                                        </div>
                                        <div className="text-mine-shaft-600">{edu.college}</div>
                                        <div className="text-sm text-mine-shaft-500">{edu.yearOfPassing}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center gap-4 mt-2">
                                <Button
                                    variant="gradient"
                                    gradient={{ from: 'brightSun.5', to: 'pink.4', deg: 90 }}
                                    size={matches ? "xs" : "sm"}
                                    onClick={handlePrev}
                                    disabled={page === 1}
                                    className="rounded-full shadow-md px-6"
                                >
                                    Previous
                                </Button>
                                <span className="text-mine-shaft-300 font-semibold self-center">Page {page} of {totalPages}</span>
                                <Button
                                    variant="gradient"
                                    gradient={{ from: 'pink.4', to: 'brightSun.5', deg: 90 }}
                                    size={matches ? "xs" : "sm"}
                                    onClick={handleNext}
                                    disabled={page === totalPages}
                                    className="rounded-full shadow-md px-6"
                                >
                                    Next
                                </Button>
                            </div>
                        </>
                    ) : (
                        <p className="text-mine-shaft-600">No education details added yet. Click edit to add.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default EducationDetails;
