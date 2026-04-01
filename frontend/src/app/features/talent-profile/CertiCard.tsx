import { formatDate } from "../../services/utilities";

interface CertiCardProps {
    issuer?: string;
    name?: string;
    issueDate?: string;
    certificateId?: string;
}

const CertiCard = (props: CertiCardProps) => {
    return <div data-aos="fade-up" className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 sm:p-5">
        <div className="flex justify-between sm-mx:flex-wrap gap-2">
            <div className="flex gap-2 items-center">
                <div className="rounded-lg border border-white/10 bg-mine-shaft-800/80 p-2 shrink-0">
                    <img className="h-7 w-7 object-contain" src={`/Icons/${props.issuer}.png`} alt={`${props.issuer} logo`} onError={(e) => { (e.target as HTMLImageElement).src = '/avatar.svg'; }} />
                </div>
                <div className="flex flex-col">
                    <div className="font-semibold text-white xs-mx:text-xs">{props.name}</div>
                    <div className="text-sm text-mine-shaft-300 xs-mx:text-xs">{props.issuer}</div>
                </div>
            </div>
            <div className="flex flex-col items-end sm-mx:flex-row sm-mx:gap-2">
                <div className="text-sm text-mine-shaft-300 xs-mx:text-xs">Issued {formatDate( props.issueDate)}</div>
                <div className="text-sm text-mine-shaft-300 xs-mx:text-xs">ID: {props.certificateId}</div>

            </div>
        </div>
    </div>
}
export default CertiCard;