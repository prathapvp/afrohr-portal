import { ActionIcon, Button } from "@mantine/core"
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import CertiInput from "./CertiInput";
import CertiCard from "./CertiCard";
import { IconDeviceFloppy, IconPencil, IconPlus, IconX } from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";

const Certification = () => {
    const profile = useSelector((state: any) => state.profile);
    const matches = useMediaQuery('(max-width: 475px)');
    const [edit, setEdit] = useState(false);
    const [addCerti, setAddCerti] = useState(false);
    const [page, setPage] = useState(1);
    const itemsPerPage = 3;
    const certifications = profile?.certifications || [];
    const totalPages = Math.ceil(certifications.length / itemsPerPage);
    const paginatedCerts = certifications.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const handleClick = () => {
        setEdit(!edit);
    };
    const handlePrev = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));
    // Reset page if certifications change
    useEffect(() => { setPage(1); }, [certifications.length]);
    return (
        <div>
            <div className="flex justify-end mb-2 gap-2">
                <div className="flex gap-2">
                    <ActionIcon onClick={() => setAddCerti(true)} variant="subtle" color="brightSun.4" size={matches ? "md" : "lg"}>
                        <IconPlus className="w-4/5 h-4/5" stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon onClick={handleClick} variant="subtle" color={edit ? "red.8" : "brightSun.4"} size={matches ? "md" : "lg"}>
                        {edit ? <IconX className="w-4/5 h-4/5" stroke={1.5} /> : <IconPencil className="w-4/5 h-4/5" stroke={1.5} />}
                    </ActionIcon>
                </div>
            </div>
            <div className="flex flex-col gap-8">
                {certifications.length > 0 ? (
                    <>
                        {paginatedCerts.map((certi: any, index: number) => (
                            <CertiCard edit={edit} index={(page - 1) * itemsPerPage + index} key={(page - 1) * itemsPerPage + index} {...certi} />
                        ))}
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
                    !addCerti && (
                        <div className="text-center py-8 text-mine-shaft-400">
                            <p className="mb-3">No certifications added yet. Showcase your credentials to stand out.</p>
                            <Button variant="outline" color="brightSun.4" leftSection={<IconPlus size={16} />} onClick={() => setAddCerti(true)}>
                                Add your first certification
                            </Button>
                        </div>
                    )
                )}
                {addCerti && <CertiInput add setEdit={setAddCerti} />}
            </div>
        </div>
    );
};
export default Certification;