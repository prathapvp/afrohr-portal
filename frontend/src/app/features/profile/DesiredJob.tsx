import { IconPencil } from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { useState, useEffect } from "react";
import { ActionIcon, TagsInput, Alert, Button, Modal } from "@mantine/core";
import { changeProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { DesiredJobSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { extractErrorMessage } from "../../services/error-extractor-service";

const premiumInputStyles = {
    label: {
        color: "#d1d5db",
        fontWeight: 600,
        marginBottom: "6px",
    },
    input: {
        background: "rgba(20, 20, 22, 0.85)",
        color: "#f3f4f6",
        borderColor: "rgba(250, 204, 21, 0.22)",
    },
    dropdown: {
        background: "#171717",
        borderColor: "rgba(250, 204, 21, 0.22)",
    },
    pill: {
        background: "rgba(250, 204, 21, 0.2)",
        color: "#fde68a",
        border: "1px solid rgba(250, 204, 21, 0.35)",
    },
};

const DesiredJob = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
    const matches = useMediaQuery("(max-width: 475px)");
    const [editOpen, setEditOpen] = useState(false);
    const [validationError, setValidationError] = useState<string>("");

    const form = useForm({
        mode: "controlled",
        validateInputOnChange: true,
        initialValues: {
            preferredDesignations: profile.desiredJob?.preferredDesignations || [],
            preferredLocations: profile.desiredJob?.preferredLocations || [],
            preferredIndustries: profile.desiredJob?.preferredIndustries || [],
        },
    });

    const handleOpenEdit = () => {
        form.setValues({
            preferredDesignations: profile.desiredJob?.preferredDesignations || [],
            preferredLocations: profile.desiredJob?.preferredLocations || [],
            preferredIndustries: profile.desiredJob?.preferredIndustries || [],
        });
        setValidationError("");
        setEditOpen(true);
    };

    const handleCloseEdit = () => {
        setValidationError("");
        setEditOpen(false);
    };

    const handleSave = async () => {
        const formValues = form.getValues();
        const validation = validateData(formValues, DesiredJobSchema);

        if (!validation.success) {
            const errorMsg = validation.errors?.[0] ?? "Validation error";
            setValidationError(errorMsg);
            errorNotification("Validation Error", errorMsg); // ✅ always a string
            return;
        }


        setValidationError("");
        const updatedProfile = { ...profile, desiredJob: validation.data };
        dispatch(changeProfile(updatedProfile));

        try {
            await dispatch(persistProfile({ desiredJob: validation.data })).unwrap();
            setEditOpen(false);
            successNotification("Success", "Desired Job Updated Successfully");
        } catch (error: unknown) {
            const errorMessage = extractErrorMessage(error);
            errorNotification("Update Failed", errorMessage);
        }
    };

    return (
        <div className="mt-2">
            <div className="mb-1 flex justify-end items-center" data-aos="zoom-out">
                <ActionIcon
                    onClick={handleOpenEdit}
                    variant="subtle"
                    color="brightSun.4"
                    size={matches ? "md" : "lg"}
                >
                    <IconPencil className="w-4/5 h-4/5" stroke={1.5} />
                </ActionIcon>
            </div>

            <DesiredJobPaginatedDisplay profile={profile} matches={!!matches} />

            <Modal
                opened={editOpen}
                onClose={handleCloseEdit}
                title="Edit Desired Job"
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
                {validationError && (
                    <Alert color="red" title="Error" mb="md" withCloseButton onClose={() => setValidationError("")}>
                        {validationError}
                    </Alert>
                )}

                <div className="space-y-4">
                    <TagsInput
                        label="Preferred Designations"
                        placeholder="Enter designation and press Enter"
                        styles={premiumInputStyles}
                        {...form.getInputProps("preferredDesignations")}
                    />
                    <TagsInput
                        label="Preferred Locations"
                        placeholder="Enter location and press Enter"
                        styles={premiumInputStyles}
                        {...form.getInputProps("preferredLocations")}
                    />
                    <TagsInput
                        label="Preferred Industries"
                        placeholder="Enter industry and press Enter"
                        styles={premiumInputStyles}
                        {...form.getInputProps("preferredIndustries")}
                    />

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="light" color="gray" onClick={handleCloseEdit} className="rounded-full px-5">
                            Cancel
                        </Button>
                        <Button color="brightSun.4" onClick={handleSave} className="rounded-full px-5 font-semibold text-mine-shaft-950">
                            Save
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

function DesiredJobPaginatedDisplay({ profile, matches }: { profile: Record<string, unknown>; matches: boolean }) {
    const [pageDes, setPageDes] = useState(1);
    const [pageLoc, setPageLoc] = useState(1);
    const [pageInd, setPageInd] = useState(1);
    const itemsPerPage = 3;
    const designations = profile.desiredJob?.preferredDesignations || [];
    const totalPagesDes = Math.ceil(designations.length / itemsPerPage) || 1;
    const paginatedDes = designations.slice((pageDes - 1) * itemsPerPage, pageDes * itemsPerPage);
    const locations = profile.desiredJob?.preferredLocations || [];
    const totalPagesLoc = Math.ceil(locations.length / itemsPerPage) || 1;
    const paginatedLoc = locations.slice((pageLoc - 1) * itemsPerPage, pageLoc * itemsPerPage);
    const industries = profile.desiredJob?.preferredIndustries || [];
    const totalPagesInd = Math.ceil(industries.length / itemsPerPage) || 1;
    const paginatedInd = industries.slice((pageInd - 1) * itemsPerPage, pageInd * itemsPerPage);
    useEffect(() => { setPageDes(1); }, [designations.length]);
    useEffect(() => { setPageLoc(1); }, [locations.length]);
    useEffect(() => { setPageInd(1); }, [industries.length]);
    return (
        <div className="mt-2 text-mine-shaft-200 space-y-3">
            {/* Designations */}
            <div>
                <span className="font-semibold text-mine-shaft-100">Preferred Designations:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                    {designations.length ? (
                        paginatedDes.map((designation: string, idx: number) => (
                            <span key={(pageDes - 1) * itemsPerPage + idx} className="rounded-full px-3 py-1 text-sm font-semibold text-mine-shaft-950 border border-bright-sun-300/80 bg-gradient-to-r from-bright-sun-300 to-yellow-300 shadow-[0_3px_10px_rgba(251,191,36,0.28)]">
                                {designation}
                            </span>
                        ))
                    ) : <span className="text-mine-shaft-300">Not specified</span>}
                </div>
                {designations.length > itemsPerPage && (
                    <div className="flex justify-center gap-4 mt-2">
                        <Button
                            variant="gradient"
                            gradient={{ from: 'brightSun.5', to: 'pink.4', deg: 90 }}
                            size={matches ? "xs" : "sm"}
                            onClick={() => setPageDes((p) => Math.max(1, p - 1))}
                            disabled={pageDes === 1}
                            className="rounded-full shadow-md px-6"
                        >Previous</Button>
                        <span className="text-mine-shaft-300 font-semibold self-center">Page {pageDes} of {totalPagesDes}</span>
                        <Button
                            variant="gradient"
                            gradient={{ from: 'pink.4', to: 'brightSun.5', deg: 90 }}
                            size={matches ? "xs" : "sm"}
                            onClick={() => setPageDes((p) => Math.min(totalPagesDes, p + 1))}
                            disabled={pageDes === totalPagesDes}
                            className="rounded-full shadow-md px-6"
                        >Next</Button>
                    </div>
                )}
            </div>
            {/* Locations */}
            <div>
                <span className="font-semibold text-mine-shaft-100">Preferred Locations:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                    {locations.length ? (
                        paginatedLoc.map((location: string, idx: number) => (
                            <span key={(pageLoc - 1) * itemsPerPage + idx} className="rounded-full px-3 py-1 text-sm font-semibold text-mine-shaft-950 border border-bright-sun-300/80 bg-gradient-to-r from-bright-sun-300 to-yellow-300 shadow-[0_3px_10px_rgba(251,191,36,0.28)]">
                                {location}
                            </span>
                        ))
                    ) : <span className="text-mine-shaft-300">Not specified</span>}
                </div>
                {locations.length > itemsPerPage && (
                    <div className="flex justify-center gap-4 mt-2">
                        <Button
                            variant="gradient"
                            gradient={{ from: 'brightSun.5', to: 'pink.4', deg: 90 }}
                            size={matches ? "xs" : "sm"}
                            onClick={() => setPageLoc((p) => Math.max(1, p - 1))}
                            disabled={pageLoc === 1}
                            className="rounded-full shadow-md px-6"
                        >Previous</Button>
                        <span className="text-mine-shaft-300 font-semibold self-center">Page {pageLoc} of {totalPagesLoc}</span>
                        <Button
                            variant="gradient"
                            gradient={{ from: 'pink.4', to: 'brightSun.5', deg: 90 }}
                            size={matches ? "xs" : "sm"}
                            onClick={() => setPageLoc((p) => Math.min(totalPagesLoc, p + 1))}
                            disabled={pageLoc === totalPagesLoc}
                            className="rounded-full shadow-md px-6"
                        >Next</Button>
                    </div>
                )}
            </div>
            {/* Industries */}
            <div>
                <span className="font-semibold text-mine-shaft-100">Preferred Industries:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                    {industries.length ? (
                        paginatedInd.map((industry: string, idx: number) => (
                            <span key={(pageInd - 1) * itemsPerPage + idx} className="rounded-full px-3 py-1 text-sm font-semibold text-mine-shaft-950 border border-bright-sun-300/80 bg-gradient-to-r from-bright-sun-300 to-yellow-300 shadow-[0_3px_10px_rgba(251,191,36,0.28)]">
                                {industry}
                            </span>
                        ))
                    ) : <span className="text-mine-shaft-300">Not specified</span>}
                </div>
                {industries.length > itemsPerPage && (
                    <div className="flex justify-center gap-4 mt-2">
                        <Button
                            variant="gradient"
                            gradient={{ from: 'brightSun.5', to: 'pink.4', deg: 90 }}
                            size={matches ? "xs" : "sm"}
                            onClick={() => setPageInd((p) => Math.max(1, p - 1))}
                            disabled={pageInd === 1}
                            className="rounded-full shadow-md px-6"
                        >Previous</Button>
                        <span className="text-mine-shaft-300 font-semibold self-center">Page {pageInd} of {totalPagesInd}</span>
                        <Button
                            variant="gradient"
                            gradient={{ from: 'pink.4', to: 'brightSun.5', deg: 90 }}
                            size={matches ? "xs" : "sm"}
                            onClick={() => setPageInd((p) => Math.min(totalPagesInd, p + 1))}
                            disabled={pageInd === totalPagesInd}
                            className="rounded-full shadow-md px-6"
                        >Next</Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DesiredJob;
