import { IconChevronDown } from "@tabler/icons-react";
import { useRef, useState, useEffect, type ReactNode } from "react";

interface ProfileCardProps {
    title: string;
    icon: ReactNode;
    children: ReactNode;
    defaultOpen?: boolean;
    actions?: ReactNode;
}

const ProfileCard = ({ title, icon, children, defaultOpen = true, actions }: ProfileCardProps) => {
    const [open, setOpen] = useState(defaultOpen);
    const bodyRef = useRef<HTMLDivElement>(null);
    const [bodyHeight, setBodyHeight] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (bodyRef.current) {
            setBodyHeight(bodyRef.current.scrollHeight);
        }
    }, [open, children]);

    return (
        <div className="group relative rounded-2xl bg-gradient-to-b from-mine-shaft-900/90 to-mine-shaft-950/90 backdrop-blur-md border border-mine-shaft-800/70 overflow-hidden transition-all duration-300 hover:border-bright-sun-400/35 hover:shadow-[0_10px_30px_rgba(251,191,36,0.08)]">
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_45%)]" />
            {/* Card Header */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-mine-shaft-800/35 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-bright-sun-400/15 text-bright-sun-300 border border-bright-sun-400/20">
                        {icon}
                    </div>
                    <h2 className="text-[15px] font-semibold tracking-tight text-mine-shaft-100">{title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
                    <IconChevronDown
                        className={`w-4 h-4 text-mine-shaft-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                        stroke={1.5}
                    />
                </div>
            </button>

            {/* Card Body — animated */}
            <div
                style={{
                    maxHeight: open ? (bodyHeight ?? 2000) : 0,
                    opacity: open ? 1 : 0,
                }}
                className="transition-all duration-300 ease-in-out overflow-hidden"
            >
                <div ref={bodyRef} className="px-4 pb-4 border-t border-mine-shaft-800/60">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
