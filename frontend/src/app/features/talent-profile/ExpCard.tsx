import { formatDate } from "../../services/utilities";

const ExpCard = (props:any) => {
    return <div data-aos="fade-up" className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 sm:p-5">
        <div className="flex justify-between gap-2 flex-wrap">
            <div className="flex gap-2 items-center">
                <div className="rounded-lg border border-white/10 bg-mine-shaft-800/80 p-2">
                    <img className="h-7 w-7 object-contain" src={`/Icons/${props.company}.png`} alt={`${props.company} logo`} onError={(e) => { (e.target as HTMLImageElement).src = '/avatar.svg'; }} />
                </div>
                <div className="flex flex-col">
                    <div className="font-semibold text-white">{props.title}</div>
                    <div className="text-sm text-mine-shaft-300">{props.company} • {props.location}</div>
                </div>
            </div>
            <div className="text-sm text-mine-shaft-300">{formatDate(props.startDate)} - {formatDate(props.endDate)}</div>
        </div>
        <div className="mt-3 text-sm leading-7 xs-mx:text-xs text-mine-shaft-300 text-justify">
           {props.description}
        </div>
    </div>
}
export default ExpCard;