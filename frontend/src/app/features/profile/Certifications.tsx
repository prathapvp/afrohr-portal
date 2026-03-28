import { ActionIcon, Button } from "@mantine/core"
import { useState } from "react";
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
    const handleClick = () => {
        setEdit(!edit);
}
    return <div>
        <div className="flex justify-end mb-2 gap-2"><div className="flex gap-2"><ActionIcon  onClick={() => setAddCerti(true)} variant="subtle" color="brightSun.4" size={matches?"md":"lg"} ><IconPlus className="w-4/5 h-4/5" stroke={1.5} /></ActionIcon><ActionIcon onClick={handleClick} variant="subtle" color={edit ? "red.8" : "brightSun.4"} size={matches?"md":"lg"} >{edit ? <IconX className="w-4/5 h-4/5" stroke={1.5} /> : <IconPencil className="w-4/5 h-4/5" stroke={1.5} />}</ActionIcon></div></div>
        <div className="flex flex-col gap-8">
            {
                profile?.certifications?.length > 0
                    ? profile.certifications.map((certi: any, index: number) => <CertiCard edit={edit} index={index} key={index} {...certi} />)
                    : !addCerti && (
                        <div className="text-center py-8 text-mine-shaft-400">
                            <p className="mb-3">No certifications added yet. Showcase your credentials to stand out.</p>
                            <Button variant="outline" color="brightSun.4" leftSection={<IconPlus size={16} />} onClick={() => setAddCerti(true)}>Add your first certification</Button>
                        </div>
                    )
            }
            {addCerti && <CertiInput add  setEdit={setAddCerti} />}
        </div>
    </div>
}
export default Certification;