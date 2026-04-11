type FilterChip = {
  key: string;
  label: string;
  value: string;
  onClear: () => void;
};

export default function AdminActiveFilterChips({
  chips,
  onClearAll,
}: {
  chips: FilterChip[];
  onClearAll: () => void;
}) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Active filters</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClear}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10"
        >
          <span className="text-slate-400">{chip.label}:</span>
          <span>{chip.value}</span>
          <span className="text-slate-500">x</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-auto rounded-full border border-rose-300/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
      >
        Clear all
      </button>
    </div>
  );
}
