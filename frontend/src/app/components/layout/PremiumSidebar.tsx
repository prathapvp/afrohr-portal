import { useState } from "react";
import { Menu, X, Users, Briefcase, BookOpen, Building2, Briefcase as BriefcaseIcon, Network, GraduationCap, Sparkles, PanelLeftClose, PanelLeftOpen, ChevronDown, ShieldCheck, CreditCard } from "lucide-react";
import { useAppSelector } from "../../store";
import { selectAccountType } from "../../store/selectors/authSelectors";

const navItems = [
  { label: "Candidate", icon: Users, gradient: "from-pink-400 via-fuchsia-500 to-indigo-500" },
  { 
    label: "Employer", 
    icon: Briefcase, 
    gradient: "from-yellow-400 via-orange-500 to-pink-500",
    submenu: [
      { label: "Subscription", icon: CreditCard, gradient: "from-cyan-400 via-blue-500 to-indigo-500" },
      { label: "Department", icon: BookOpen, gradient: "from-green-400 via-blue-500 to-purple-500" },
      { label: "Industry", icon: Building2, gradient: "from-orange-400 via-red-500 to-pink-500" },
      { label: "Employment Type", icon: BriefcaseIcon, gradient: "from-blue-400 via-cyan-500 to-teal-500" },
      { label: "Work Mode", icon: Network, gradient: "from-purple-400 via-pink-500 to-rose-500" }
    ]
  },
  { label: "Student", icon: GraduationCap, gradient: "from-cyan-400 via-sky-500 to-blue-500" },
  { label: "Admin", icon: ShieldCheck, gradient: "from-amber-400 via-orange-500 to-red-500" },
];

export default function PremiumSidebar({ active, onNav }: { active: string; onNav: (label: string) => void }) {
  const [open, setOpen] = useState(true);
  const [collapsedDesktop, setCollapsedDesktop] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const accountType = useAppSelector(selectAccountType);
  const roleToNavLabel: Record<string, string> = {
    APPLICANT: "Candidate",
    CANDIDATE: "Candidate",
    EMPLOYER: "Employer",
    STUDENT: "Student",
    ADMIN: "Admin",
  };
  const allowedLabel = roleToNavLabel[accountType];
  const visibleNavItems = allowedLabel ? navItems.filter((item) => item.label === allowedLabel) : navItems;
  return (
    <>
      {/* Hamburger menu for mobile/desktop */}
      <button
        className="fixed top-20 left-4 z-50 p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 transition md:hidden"
        aria-label={open ? "Close sidebar" : "Open sidebar"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
      </button>
      {/* Sidebar */}
      <aside
        className={`premium-enter fixed top-[68px] left-0 h-[calc(100vh-68px)] z-40 bg-gradient-to-br from-[#1a2740]/80 via-[#101c2c]/90 to-[#232946]/80 glass-card shadow-2xl border-r border-white/10 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"} md:relative md:top-0 md:h-full md:translate-x-0 md:transition-[width] md:duration-300 md:ease-out ${collapsedDesktop ? "md:w-20" : "md:w-64"} w-64 flex flex-col backdrop-blur-2xl`}
        style={{
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          borderRadius: "2rem 0 0 2rem",
          background: "linear-gradient(160deg, rgba(26,39,64,0.95) 0%, rgba(16,28,44,0.96) 55%, rgba(35,41,70,0.95) 100%)",
        }}
      >
        {/* Desktop collapse toggle */}
        <button
          className="absolute -right-3 top-4 z-50 hidden h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-[#0f1a2e] text-white/90 shadow-lg transition hover:bg-[#1a2a47] md:flex"
          aria-label={collapsedDesktop ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsedDesktop((v) => !v)}
        >
          {collapsedDesktop ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
        {/* Highlight badge */}
        <div className={`flex items-center gap-2 pt-8 pb-4 ${collapsedDesktop ? "justify-center px-2" : "px-6"}`}>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 shadow-lg">
            <Sparkles className="h-6 w-6 text-white drop-shadow-lg" />
          </span>
          <span className={`ml-2 text-xl font-extrabold bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent tracking-wide select-none ${collapsedDesktop ? "hidden" : "md:inline"}`}>
            Elite
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-5 md:hidden">
          <span className="text-lg font-bold text-white tracking-wide">Menu</span>
          <button onClick={() => setOpen(false)} aria-label="Close sidebar">
            <X className="h-6 w-6 text-white" />
          </button>
        </div>
        <nav className={`flex-1 flex flex-col gap-2 py-4 ${collapsedDesktop ? "px-1" : "px-2"}`}>
          {visibleNavItems.map(({ label, icon: Icon, gradient, submenu }) => (
            <div key={label}>
              <button
                title={collapsedDesktop ? label : undefined}
                aria-label={collapsedDesktop ? label : undefined}
                className={`premium-card-hover group w-full flex items-center ${collapsedDesktop ? "justify-center gap-0 px-2" : "gap-3 px-4"} py-3 rounded-xl font-semibold text-base focus:outline-none relative overflow-hidden ${
                  active === label
                    ? "bg-gradient-to-r from-blue-700/60 via-blue-500/40 to-indigo-600/40 text-white shadow-xl ring-2 ring-blue-400/40 animate-accent-shimmer"
                    : "text-white hover:bg-white/10 hover:scale-[1.03] hover:shadow-lg"
                }`}
                style={{ boxShadow: active === label ? "0 4px 24px 0 rgba(0, 123, 255, 0.15)" : undefined }}
                onClick={() => {
                  if (submenu) {
                    setExpandedSubmenu(expandedSubmenu === label ? null : label);
                  }
                  // Always navigate to main menu item
                  onNav(label);
                }}
              >
                {/* Animated gradient icon */}
                <span
                  className={`inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-tr ${gradient} shadow-md transition-transform duration-300 group-hover:scale-110 ${
                    active === label ? "ring-2 ring-white/60 animate-accent-shimmer" : ""
                  }`}
                  style={{ filter: active === label ? "brightness(1.2)" : undefined }}
                >
                  <Icon className="h-5 w-5 text-white drop-shadow" />
                </span>
                <span className={`hidden font-medium tracking-wide text-white ${collapsedDesktop ? "md:hidden" : "md:inline"}`}>{label}</span>
                {submenu && !collapsedDesktop && (
                  <ChevronDown className={`ml-auto h-4 w-4 transition-transform duration-200 ${expandedSubmenu === label ? "rotate-180" : ""}`} />
                )}
                {/* Shimmer effect for active tab */}
                {active === label && (
                  <span className="absolute left-0 top-0 h-full w-full pointer-events-none animate-accent-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60" />
                )}
              </button>
              {/* Submenu items */}
              {submenu && expandedSubmenu === label && !collapsedDesktop && (
                <div className="ml-2 mt-1 flex flex-col gap-1 border-l border-white/20 pl-2">
                  {submenu.map(({ label: subLabel, icon: SubIcon, gradient: subGradient }) => (
                    <button
                      key={subLabel}
                      title={subLabel}
                      className={`premium-card-hover group flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-sm focus:outline-none relative overflow-hidden w-full ${
                        active === subLabel
                          ? "bg-gradient-to-r from-green-700/40 via-green-500/30 to-teal-600/30 text-white shadow-md ring-1 ring-green-400/30"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                      onClick={() => onNav(subLabel)}
                    >
                      <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-tr ${subGradient} shadow-md transition-transform duration-300 group-hover:scale-110 flex-shrink-0`}>
                        <SubIcon className="h-4 w-4 text-white drop-shadow" />
                      </span>
                      <span className="font-medium md:whitespace-nowrap md:overflow-hidden md:text-ellipsis">{subLabel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 top-[68px] z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      {/* Accent shimmer animation */}
      <style>{`
        @keyframes accent-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-accent-shimmer {
          background-size: 200% 100%;
          animation: accent-shimmer 2.5s linear infinite;
        }
      `}</style>
    </>
  );
}
