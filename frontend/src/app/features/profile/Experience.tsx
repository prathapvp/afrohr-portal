import { ActionIcon, Button, Modal } from "@mantine/core";
import { IconPencil, IconPlus, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import ExpInput from "./ExpInput";
import ExpCard from "./ExpCard";
import { useMediaQuery } from "@mantine/hooks";

const Experience=()=>{
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
                            className="rounded-full font-semibold"
                        >
                            Add your first experience
                        </Button>
                    </div>
                )
        }
    </div>
    </div>

    <Modal
        opened={addExp}
        onClose={() => setAddExp(false)}
        title="Add Experience"
        centered
        size="lg"
        radius="xl"
        transitionProps={{ transition: "fade", duration: 180 }}
        overlayProps={{ backgroundOpacity: 0.78, blur: 4, color: "#020617" }}
        styles={{
            content: {
                background: "radial-gradient(circle at top right, rgba(34,211,238,0.12), transparent 36%), linear-gradient(180deg, rgba(10,15,30,0.98), rgba(2,6,23,0.98))",
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
        <ExpInput add setEdit={setAddExp} />
    </Modal>
</div>
}
export default Experience;