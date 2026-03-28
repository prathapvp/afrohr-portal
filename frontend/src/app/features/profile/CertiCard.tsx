import { ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { formatDate } from "../../services/utilities";
import { useDispatch, useSelector } from "react-redux";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { useState } from "react";
import { useMediaQuery } from "@mantine/hooks";

const CertiCard = (props: any) => {
    const [edit, setEdit]=useState(false);
    const dispatch = useDispatch<any>();
    const profile=useSelector((state:any)=>state.profile);
    const matches = useMediaQuery('(max-width: 475px)');
    const handleDelete=async ()=>{
        let updatedProfile={...profile, certifications: profile.certifications.filter((_:any, index:number)=>index!==props.index)};
        try {
            await dispatch(persistProfile(updatedProfile)).unwrap();
            successNotification("Success","Certificate Deleted Successfully");
        } catch {
            errorNotification("Error","Failed to delete certification");
        }
    }
    return <div data-aos="zoom-out" className="elevated-card p-4 rounded-lg bg-transparent-light">
        <div className="flex justify-between sm-mx:flex-wrap">
            <div className="flex gap-2 items-center">
                <div className="p-2 bg-mine-shaft-800 rounded-md shrink-0 icon-container">
                    <img className="h-7" src={`/Icons/${props.issuer}.png`} alt="" />
                </div>
                <div className="flex flex-col">
                    <div className="font-semibold xs-mx:text-sm">{props.name}</div>
                    <div className="text-sm xs-mx:text-xs text-mine-shaft-300">{props.issuer}</div>
                </div>
            </div>
            <div className="flex gap-2 ">
                <div className="flex flex-col items-end sm-mx:flex-row sm-mx:gap-2">
                    <div className="text-sm xs-mx:text-xs text-mine-shaft-300">Issued {formatDate(props.issueDate)}</div>
                    <div className="text-sm xs-mx:text-xs text-mine-shaft-300">ID: {props.certificateId}</div>
                </div>
                { props.edit&&<ActionIcon onClick={handleDelete} variant="subtle" color="red.8" size={matches?"md":"lg"} ><IconTrash className="w-4/5 h-4/5" stroke={1.5} /></ActionIcon>}
            </div>
        </div>

    </div>
}
export default CertiCard;