type AdminBillingSection = "subscription-snapshot" | "billing-control" | "subscription-requests";

export default function AdminBillingSuiteTabs({
  activeSection,
  onSelect,
}: {
  activeSection: AdminBillingSection;
  onSelect: (section: AdminBillingSection) => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => onSelect("subscription-snapshot")}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
          activeSection === "subscription-snapshot"
            ? "bg-gradient-to-r from-cyan-500/80 to-blue-500/80 text-white shadow-[0_10px_24px_rgba(8,145,178,0.28)]"
            : "text-slate-300 hover:bg-white/8 hover:text-white"
        }`}
      >
        Subscription Snapshot
      </button>
      <button
        type="button"
        onClick={() => onSelect("billing-control")}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
          activeSection === "billing-control"
            ? "bg-gradient-to-r from-violet-500/80 to-fuchsia-500/80 text-white shadow-[0_10px_24px_rgba(147,51,234,0.28)]"
            : "text-slate-300 hover:bg-white/8 hover:text-white"
        }`}
      >
        Billing Control
      </button>
      <button
        type="button"
        onClick={() => onSelect("subscription-requests")}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
          activeSection === "subscription-requests"
            ? "bg-gradient-to-r from-orange-500/80 to-amber-500/80 text-white shadow-[0_10px_24px_rgba(217,119,6,0.28)]"
            : "text-slate-300 hover:bg-white/8 hover:text-white"
        }`}
      >
        Subscription Requests
      </button>
    </div>
  );
}
