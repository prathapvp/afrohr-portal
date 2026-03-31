import { type ReactNode } from "react";

interface ProfileCardProps {
    title: string;
    icon: ReactNode;
    children: ReactNode;
    defaultOpen?: boolean;
    actions?: ReactNode;
}

const ProfileCard = ({ title, icon, children, actions }: ProfileCardProps) => {
    return (
        <div className="group relative overflow-hidden rounded-3xl border border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_38%),linear-gradient(180deg,rgba(17,24,39,0.94),rgba(2,6,23,0.96))] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-bright-sun-400/35 hover:shadow-[0_18px_48px_rgba(15,23,42,0.45)]">
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_45%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* Card Header */}
            <div className="w-full px-5 py-3 transition-colors hover:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-bright-sun-400/25 bg-bright-sun-400/10 p-1.5 text-bright-sun-300 shadow-[0_0_20px_rgba(251,191,36,0.12)]">
                            {icon}
                        </div>
                        <h2 className="text-sm font-semibold tracking-tight text-white">{title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {actions && <div>{actions}</div>}
                    </div>
                </div>
            </div>

            <div className="border-t border-white/10 px-5 pb-5">
                {children}
            </div>
        </div>
    );
};

export default ProfileCard;
