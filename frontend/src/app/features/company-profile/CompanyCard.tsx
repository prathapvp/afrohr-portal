import { ActionIcon } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

const CompanyCard=(props:any)=>{
    const [showFallback, setShowFallback] = useState(false);

    const initials = useMemo(() => {
        const name = (props.name ?? "").trim();
        if (!name) {
            return "NA";
        }

        const letters = name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part: string) => part[0]?.toUpperCase() ?? "")
            .join("");

        return letters || name.slice(0, 2).toUpperCase();
    }, [props.name]);

    return(
        <div className="premium-card-hover flex items-center justify-between rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.88),rgba(2,6,23,0.92))] p-3 hover:-translate-y-0.5 hover:border-cyan-300/25">
        <div className="flex gap-2 items-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-mine-shaft-800/80 p-2 text-sm font-semibold text-mine-shaft-100">
                {
                    showFallback ? (
                        <span>{initials}</span>
                    ) : (
                        <img
                            className="h-7 w-7 object-contain"
                            src={`/Icons/${props.name}.png`}
                            alt={`${props.name} logo`}
                            onError={() => setShowFallback(true)}
                        />
                    )
                }
            </div>
            <div className="flex flex-col ">
                <div className="font-semibold text-white">{props.name}</div>
                <div className="text-xs text-mine-shaft-300">{props.employees} Employees</div>
            </div>
        </div>
        <Link to={`/company/${encodeURIComponent(props.name)}`}>
       <ActionIcon variant="subtle" color="brightSun.4" aria-label="Settings"> <IconExternalLink/></ActionIcon></Link>
    </div>
    )
}
export default CompanyCard;