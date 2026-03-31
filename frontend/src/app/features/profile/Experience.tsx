import { ActionIcon, Button } from "@mantine/core";
import { IconDeviceFloppy, IconPencil, IconPlus, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ExpInput from "./ExpInput";
import ExpCard from "./ExpCard";
import { useMediaQuery } from "@mantine/hooks";

const Experience=()=>{
    const dispatch = useDispatch();
    const matches = useMediaQuery('(max-width: 475px)');
    const profile=useSelector((state:any)=>state.profile);
    const [edit, setEdit] = useState(false);
    const [addExp, setAddExp] = useState(false);
    const handleClick = () => {
            setEdit(!edit);
    }
    // Sort experiences by start date (most recent first)
    const sortedExperiences = profile?.experiences ? 
        [...profile.experiences].sort((a: any, b: any) => {
            const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
            const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
            return dateB - dateA; // Descending order (most recent first)
        }) : [];

    return <div>
    <div className="flex justify-end mb-2 gap-2"><div className="flex gap-2"><ActionIcon onClick={() => setAddExp(true)} variant="subtle" color="brightSun.4" size={matches?"md":"lg"} ><IconPlus className="w-4/5 h-4/5" stroke={1.5} /></ActionIcon><ActionIcon onClick={ handleClick} variant="subtle" color={edit ? "red.8" : "brightSun.4"} size={matches?"md":"lg"} >{edit? <IconX className="w-4/5 h-4/5" stroke={1.5} /> : <IconPencil className="w-4/5 h-4/5" stroke={1.5} />}</ActionIcon></div></div>
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
    <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-slate-300">Experience Timeline</div>
    <div className="flex flex-col gap-8">
        {
            sortedExperiences.length > 0
                ? sortedExperiences.map((exp:any, index:number) => <ExpCard edit={edit} index={index} key={index} {...exp} />)
                : !addExp && (
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 py-8 text-center text-mine-shaft-200">
                        <p className="mb-3 text-base text-amber-100">No experience added yet. Employers value detailed work history.</p>
                        <Button
                            variant="light"
                            color="brightSun.4"
                            leftSection={<IconPlus size={16} />}
                            onClick={() => setAddExp(true)}
                            className="font-semibold"
                        >
                            Add your first experience
                        </Button>
                    </div>
                )
        }
        {addExp && <ExpInput add   setEdit={setAddExp} />}
    </div>
    </div>
</div>
}
export default Experience;