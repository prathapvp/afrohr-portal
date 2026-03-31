 import { Button, Modal } from "@mantine/core";
import { useState } from "react";
import ExpInput from "./ExpInput";
import { formatDate } from "../../services/utilities";
import { useDispatch, useSelector } from "react-redux";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";

const ExpCard = (props:any) => {
    const dispatch = useDispatch<any>();
    const [manageOpen, setManageOpen]=useState(false);
    const [editing, setEditing]=useState(false);
    const profile=useSelector((state:any)=>state.profile);
    const roleTitle = props.jobTitle || props.title;
    const handleDelete=async ()=>{
        const experiences = profile.experiences.filter((_:any, index:number)=>index!==props.index);
        try {
            await dispatch(persistProfile({ experiences })).unwrap();
            successNotification("Success","Experience Deleted Successfully");
            setManageOpen(false);
            setEditing(false);
        } catch {
            errorNotification("Error","Failed to delete experience");
        }
    }
    return <>
    <div  data-aos="fade-up" className="flex flex-col gap-2 elevated-card p-4 rounded-lg bg-transparent-light">
        <div className="flex justify-between gap-2 flex-wrap">
            <div className="flex gap-2 items-center">
                <div className="p-2 bg-mine-shaft-800 rounded-md icon-container">
                    <img className="h-7" src={`/Icons/${props.company}.png`} alt="" />
                </div>
                <div className="flex flex-col">
                    <div className="font-semibold ">{roleTitle}</div>
                    <div className="text-sm text-mine-shaft-300">{props.company} &bull; {props.location}</div>
                </div>
            </div>
            <div className="text-sm  text-mine-shaft-300">{formatDate(props.startDate)} - {props.working?"Present":formatDate(props.endDate)}</div>
        </div>
        <div className="text-sm xs-mx:text-xs text-mine-shaft-300 text-justify">
           {props.description}
        </div>
        { props.edit&&<div className="flex gap-3">
            <Button color="brightSun.4" onClick={()=>setManageOpen(true)} variant="light" className="rounded-full px-5">Manage</Button>
        </div>}
    </div>

    <Modal
        opened={manageOpen}
        onClose={() => {
            setManageOpen(false);
            setEditing(false);
        }}
        title={editing ? "Edit Experience" : "Manage Experience"}
        centered
        size="lg"
        radius="xl"
        transitionProps={{ transition: "fade", duration: 180 }}
        overlayProps={{ backgroundOpacity: 0.78, blur: 4, color: "#020617" }}
        styles={{
            content: {
                background: "radial-gradient(circle at top right, rgba(56,189,248,0.12), transparent 36%), linear-gradient(180deg, rgba(10,15,30,0.98), rgba(2,6,23,0.98))",
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
            <ExpInput
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
                    <p className="font-semibold text-mine-shaft-100">{roleTitle}</p>
                    <p>{props.company} • {props.location}</p>
                    <p className="text-mine-shaft-300 mt-1">{formatDate(props.startDate)} - {props.working ? "Present" : formatDate(props.endDate)}</p>
                </div>
                <div className="flex gap-3">
                    <Button color="brightSun.4" onClick={() => setEditing(true)} variant="light" className="rounded-full px-5">Edit</Button>
                    <Button color="red.8" onClick={handleDelete} variant="light" className="rounded-full px-5">Delete</Button>
                </div>
            </div>
        )}
    </Modal>
    </>
}
export default ExpCard;