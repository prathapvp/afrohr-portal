import { ActionIcon, Button, Modal } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { formatDate } from "../../services/utilities";
import { useDispatch, useSelector } from "react-redux";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import CertiInput from "./CertiInput";

const CertiCard = (props: any) => {
    const [manageOpen, setManageOpen]=useState(false);
    const [editing, setEditing]=useState(false);
    const dispatch = useDispatch<any>();
    const profile=useSelector((state:any)=>state.profile);
    const matches = useMediaQuery('(max-width: 475px)');
    const handleDelete=async ()=>{
        const certifications = profile.certifications.filter((_:any, index:number)=>index!==props.index);
        try {
            await dispatch(persistProfile({ certifications })).unwrap();
            successNotification("Success","Certificate Deleted Successfully");
            setManageOpen(false);
            setEditing(false);
        } catch {
            errorNotification("Error","Failed to delete certification");
        }
    }
    return <>
    <div data-aos="zoom-out" className="rounded-xl border border-white/[0.12] bg-[linear-gradient(135deg,rgba(30,41,59,0.7),rgba(15,23,42,0.85))] p-4 shadow-md transition-all duration-200 hover:border-white/20 hover:shadow-lg">
        <div className="flex justify-between sm-mx:flex-wrap gap-3">
            <div className="flex gap-3 items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mine-shaft-800/80 p-2 ring-1 ring-white/10">
                    <img className="h-7 w-7 object-contain" src={`/Icons/${props.issuer}.png`} alt={props.issuer} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="flex flex-col">
                    <div className="font-semibold text-mine-shaft-50 xs-mx:text-sm">{props.name}</div>
                    <div className="text-sm xs-mx:text-xs text-bright-sun-400 font-medium">{props.issuer}</div>
                </div>
            </div>
            <div className="flex gap-2 items-center">
                <div className="flex flex-col items-end sm-mx:flex-row sm-mx:gap-2">
                    <div className="text-sm xs-mx:text-xs text-mine-shaft-200 font-medium">Issued {formatDate(props.issueDate)}</div>
                    <div className="text-xs text-mine-shaft-400 font-mono tracking-wide">ID: {props.certificateId}</div>
                </div>
                { props.edit && <ActionIcon onClick={() => setManageOpen(true)} variant="subtle" color="brightSun.4" size={matches?"md":"lg"}><IconPencil className="w-4/5 h-4/5" stroke={1.5} /></ActionIcon>}
            </div>
        </div>
    </div>

    <Modal
        opened={manageOpen}
        onClose={() => {
            setManageOpen(false);
            setEditing(false);
        }}
        title={editing ? "Edit Certificate" : "Manage Certificate"}
        centered
        size="lg"
        radius="xl"
        transitionProps={{ transition: "fade", duration: 180 }}
        overlayProps={{ backgroundOpacity: 0.78, blur: 4, color: "#020617" }}
        styles={{
            content: {
                background: "radial-gradient(circle at top right, rgba(251,191,36,0.12), transparent 36%), linear-gradient(180deg, rgba(10,15,30,0.98), rgba(2,6,23,0.98))",
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
        {editing ? (
            <CertiInput
                {...props}
                setEdit={(value: boolean) => {
                    setEditing(value);
                    if (!value) {
                        setManageOpen(false);
                    }
                }}
            />
        ) : (
            <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-mine-shaft-200">
                    <p className="font-semibold text-mine-shaft-100">{props.name}</p>
                    <p>{props.issuer}</p>
                    <p className="text-mine-shaft-300 mt-1">Issued {formatDate(props.issueDate)} • ID: {props.certificateId}</p>
                </div>
                <div className="flex gap-3">
                    <Button color="brightSun.4" onClick={() => setEditing(true)} variant="light" className="rounded-full px-5">Edit</Button>
                    <Button color="red.8" onClick={handleDelete} variant="light" className="rounded-full px-5" leftSection={<IconTrash size={14} />}>Delete</Button>
                </div>
            </div>
        )}
    </Modal>
    </>
}
export default CertiCard;