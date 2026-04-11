import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "../../components/ui/input";
import { getAllProfiles, getProfilesByAccountType } from "../../services/profile-service";
import { useAppDispatch, useAppSelector } from "../../store";
import { resetFilter } from "../../store/slices/FilterSlice";
import { hideOverlay, showOverlay } from "../../store/slices/OverlaySlice";
import Sort from "../find-jobs/Sort";
import TalentCard from "../find-talent/TalentCard";
import { Search, X, Users, Sparkles, SlidersHorizontal, GraduationCap, BriefcaseBusiness, UserRound, ChevronUp, ChevronDown, LayoutGrid, List } from "lucide-react";

interface TalentProfile {
  id?: number;
  applicantId?: number;
  name?: string;
  jobTitle?: string;
  location?: string;
  skills?: string[];
  itSkills?: string[];
  totalExp?: number;
  email?: string;
  mobileNumber?: string;
  accountType?: "APPLICANT" | "STUDENT" | "EMPLOYER";
}

type UserType = "profiles" | "applicants" | "students";
type ViewMode = "grid" | "list";

const SEGMENT_CONFIG: Record<UserType, { label: string; icon: typeof UserRound; helper: string }> = {
  profiles:   { label: "All Profiles",  icon: UserRound,       helper: "Full talent pool" },
  applicants: { label: "Applicants",    icon: BriefcaseBusiness, helper: "Job-ready candidates" },
  students:   { label: "Students",      icon: GraduationCap,   helper: "Emerging talent" },
};

export default function SearchCandidatesPage() {
  const dispatch = useAppDispatch();
  const skillInputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [candidates, setCandidates] = useState<TalentProfile[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<TalentProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minExp, setMinExp] = useState(0);
  const [maxExp, setMaxExp] = useState(50);
  const [userType, setUserType] = useState<UserType>("profiles");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const sort = useAppSelector((state) => state.sort as string);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Load candidates when segment changes
  useEffect(() => {
    dispatch(resetFilter());
    dispatch(showOverlay());
    const loadProfiles =
      userType === "applicants"
        ? getProfilesByAccountType("APPLICANT")
        : userType === "students"
          ? getProfilesByAccountType("STUDENT")
          : getAllProfiles();
    loadProfiles
      .then((res) => {
        const profiles = Array.isArray(res) ? (res as TalentProfile[]) : [];
        setCandidates(profiles);
        // Build auto-complete skill pool from the fetched dataset
        const skillSet = new Set<string>();
        profiles.forEach((p) => {
          (p.skills ?? []).forEach((s) => skillSet.add(s));
          (p.itSkills ?? []).forEach((s) => skillSet.add(s));
        });
        setAllSkills(Array.from(skillSet).sort());
      })
      .catch((err) => console.error("Error loading candidates:", err))
      .finally(() => dispatch(hideOverlay()));
  }, [dispatch, userType]);

  // Apply sort
  useEffect(() => {
    const sorted = [...candidates];
    if (sort === "Experience: Low to High") {
      sorted.sort((a, b) => (a.totalExp ?? 0) - (b.totalExp ?? 0));
    } else if (sort === "Experience: High to Low") {
      sorted.sort((a, b) => (b.totalExp ?? 0) - (a.totalExp ?? 0));
    }
    setCandidates(sorted);
  }, [sort]);

  // Apply filters
  useEffect(() => {
    let filtered = candidates;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) => {
          const allSkills = [...(c.skills ?? []), ...(c.itSkills ?? [])].map((s) => s.toLowerCase());
          return (
            (c.name ?? "").toLowerCase().includes(q) ||
            (c.jobTitle ?? "").toLowerCase().includes(q) ||
            (c.email ?? "").toLowerCase().includes(q) ||
            allSkills.some((skill) => skill.includes(q))
          );
        }
      );
    }
    if (selectedSkills.length > 0) {
      filtered = filtered.filter((c) => {
        const cs = [...(c.skills ?? []), ...(c.itSkills ?? [])].map((s) => s.toLowerCase());
        return selectedSkills.some((sk) => cs.some((x) => x.includes(sk.toLowerCase())));
      });
    }
    if (minExp > 0 || maxExp < 50) {
      filtered = filtered.filter((c) => (c.totalExp ?? 0) >= minExp && (c.totalExp ?? 0) <= maxExp);
    }
    setFilteredCandidates(filtered);
  }, [candidates, searchTerm, selectedSkills, minExp, maxExp]);

  const handleAddSkill = (skill: string) => {
    const t = skill.trim();
    if (t && !selectedSkills.includes(t)) setSelectedSkills([...selectedSkills, t]);
  };
  const handleRemoveSkill = (skill: string) => setSelectedSkills(selectedSkills.filter((s) => s !== skill));
  const handleClearFilters = () => {
    setSearchTerm("");
    setSkillInput("");
    setSelectedSkills([]);
    setMinExp(0);
    setMaxExp(50);
  };

  const hasActiveFilters = !!(searchTerm.trim() || selectedSkills.length > 0 || minExp > 0 || maxExp < 50);
  const totalFilters =
    (searchTerm.trim().length > 0 ? 1 : 0) +
    selectedSkills.length +
    (minExp > 0 || maxExp < 50 ? 1 : 0);

  // Skill auto-complete: match input, exclude already-selected
  const skillSuggestions = useMemo(() => {
    if (!skillInput.trim()) return [];
    const lower = skillInput.toLowerCase();
    return allSkills.filter((s) => s.toLowerCase().includes(lower) && !selectedSkills.includes(s)).slice(0, 7);
  }, [skillInput, allSkills, selectedSkills]);

  return (
    <div className={`space-y-4 px-4 py-5 sm:px-6 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d2236] via-[#0f2b42] to-[#122033] px-6 py-5 shadow-[0_18px_60px_rgba(2,10,24,0.5)]">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
              <Sparkles className="h-3 w-3" />
              Talent Discovery
            </div>
            <h1 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
              Search Candidates &amp; Students
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Sort />
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/20"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Command Bar ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm">

        {/* Segment pills */}
        <div className="mb-3 flex flex-wrap gap-2">
          {(Object.keys(SEGMENT_CONFIG) as UserType[]).map((type) => {
            const { label, icon: Icon } = SEGMENT_CONFIG[type];
            const isActive = userType === type;
            return (
              <button
                key={type}
                onClick={() => setUserType(type)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
                    : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:bg-white/[0.08] hover:text-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Search row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name, title, email, or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 rounded-xl border-white/20 bg-white/[0.08] pl-9 text-sm text-white placeholder:text-slate-400 focus:bg-white/[0.12]"
            />
          </div>
          <button
            onClick={() => setShowAdvanced((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all ${
              showAdvanced || totalFilters > 1
                ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
                : "border-white/10 bg-white/[0.06] text-slate-300 hover:border-white/20 hover:bg-white/[0.10]"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {totalFilters > 1 && (
              <span className="rounded-full bg-cyan-400/30 px-1.5 py-px text-[10px] font-bold text-cyan-100">
                {totalFilters}
              </span>
            )}
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Advanced filters — collapsible */}
        {showAdvanced && (
          <div className="mt-3 space-y-3 border-t border-white/[0.06] pt-3">

            {/* Experience */}
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                Experience Range
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2">
                  <span className="w-7 text-[10px] text-slate-400">Min</span>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={minExp}
                    onChange={(e) => setMinExp(Math.min(Number(e.target.value), maxExp))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg accent-cyan-400 bg-white/10"
                  />
                  <span className="w-12 text-right text-xs font-semibold text-white">{minExp} yrs</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2">
                  <span className="w-7 text-[10px] text-slate-400">Max</span>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={maxExp}
                    onChange={(e) => setMaxExp(Math.max(Number(e.target.value), minExp))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg accent-cyan-400 bg-white/10"
                  />
                  <span className="w-12 text-right text-xs font-semibold text-white">{maxExp} yrs</span>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                Skills Filter
              </div>
              <div className="relative">
                <Input
                  ref={skillInputRef}
                  placeholder="Type a skill and press Enter…"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { handleAddSkill(skillInput); setSkillInput(""); }
                    if (e.key === "Escape") setSkillInput("");
                  }}
                  className="h-9 rounded-xl border-white/20 bg-white/[0.08] text-sm text-white placeholder:text-slate-400 focus:bg-white/[0.12]"
                />
                {skillSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#0f2238]/95 shadow-xl backdrop-blur-md">
                    {skillSuggestions.map((s) => (
                      <button
                        key={s}
                        onMouseDown={() => { handleAddSkill(s); setSkillInput(""); }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[0.08]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedSkills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedSkills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/25 bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-100">
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)} className="hover:text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ── Active filter chips ──────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-500">Active:</span>
          {searchTerm.trim() && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs text-slate-200">
              &ldquo;{searchTerm.trim()}&rdquo;
              <button onClick={() => setSearchTerm("")} className="hover:text-white"><X className="h-3 w-3" /></button>
            </span>
          )}
          {selectedSkills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs text-cyan-200">
              {s}
              <button onClick={() => handleRemoveSkill(s)} className="hover:text-white"><X className="h-3 w-3" /></button>
            </span>
          ))}
          {(minExp > 0 || maxExp < 50) && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-200">
              {minExp}–{maxExp} yrs exp
              <button onClick={() => { setMinExp(0); setMaxExp(50); }} className="hover:text-white"><X className="h-3 w-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────── */}
      <div>
        {/* Results header */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-slate-300">
            <span className="font-bold text-white">{filteredCandidates.length}</span>{" "}
            {filteredCandidates.length === 1 ? "profile" : "profiles"} found
            <span className="ml-2 text-xs text-slate-500">· {SEGMENT_CONFIG[userType].label}</span>
          </p>
          {/* Grid / List toggle */}
          <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/[0.04] p-1">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid view"
              className={`rounded-lg p-1.5 transition-colors ${viewMode === "grid" ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List view"
              className={`rounded-lg p-1.5 transition-colors ${viewMode === "list" ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {filteredCandidates.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3"}>
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.id ?? candidate.applicantId}
                className="group rounded-2xl border border-transparent transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/20 hover:shadow-[0_12px_28px_rgba(56,189,248,0.12)]"
              >
                <TalentCard {...candidate} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] py-16">
            <Users className="mb-4 h-10 w-10 text-slate-600" />
            <p className="text-base font-semibold text-slate-300">
              No {SEGMENT_CONFIG[userType].label.toLowerCase()} found
            </p>
            <p className="mt-1.5 text-sm text-slate-500">
              {hasActiveFilters ? "Try adjusting your search criteria" : "No candidates available right now"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="mt-4 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.14]"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
