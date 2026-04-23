import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRightLeft, Bookmark, BookmarkCheck, BookOpen, Brain, CalendarDays, CheckCircle2, Circle, CircleHelp, DollarSign, ExternalLink, GraduationCap, Link2, MapPin, Pencil, Pin, PinOff, Play, Plus, Save, Search, Sparkles, Star, Target, Trash2, TrendingUp, Trophy, User, X, Zap, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Textarea } from "../components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import type { CareerItem, StudentDashboard } from "./types";
import { useNavigate, useSearchParams } from "react-router";
import { useAppSelector } from "../store";
import { getMyProfile } from "../services/profile-service";
import { chatWithStudentAdvisor, streamStudentAdvisorChat } from "../services/student-chat-service";
import { getStudentIntakeRecommendation, type StudentIntakeRecommendation } from "../services/student-intake-service";

interface StudentDashboardViewProps {
  dashboard: StudentDashboard;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  searchLoading: boolean;
  searchResults: CareerItem[] | null;
}

export default function StudentDashboardView({
  dashboard,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searchLoading,
  searchResults,
}: StudentDashboardViewProps) {
  type StudentAdvisorChatMessage = {
    id: string;
    role: "assistant" | "user";
    content: string;
  };

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const sectionParam = searchParams.get("section");
  const activeSection = sectionParam ?? "roadmap";
  const qpInterest = searchParams.get("ri");
  const qpCareer = searchParams.get("rc");
  const qpSubfield = searchParams.get("rs");
  const roadmapByInterest = dashboard.roadmap?.byInterest ?? {};
  const fallbackInterest = Object.keys(roadmapByInterest)[0] ?? dashboard.advisor.interests[0] ?? "";

  function normalizeRoadmapToken(value: string | null) {
    if (!value) {
      return "";
    }
    return value
      .replace(/^[^A-Za-z0-9]+/, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function findBestMatch(options: string[], raw: string | null) {
    const normalizedRaw = normalizeRoadmapToken(raw);
    if (!normalizedRaw) {
      return null;
    }
    const exact = options.find((option) => option.toLowerCase() === normalizedRaw);
    if (exact) {
      return exact;
    }
    return options.find((option) => option.toLowerCase().includes(normalizedRaw) || normalizedRaw.includes(option.toLowerCase())) ?? null;
  }

  const LS_KEY = "student-wizard-state";
  function loadWizardState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as { interest: string; career: string; subfield: string };
    } catch {
      return null;
    }
  }
  function saveWizardState(interest: string, career: string, subfield: string) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ interest, career, subfield }));
    } catch { /* ignore quota errors */ }
  }

  const persisted = loadWizardState();
  const interestCandidates = Array.from(new Set([...dashboard.advisor.interests, ...Object.keys(roadmapByInterest)]));
  const matchedInterestFromQuery = findBestMatch(interestCandidates, qpInterest);
  const initialInterest = matchedInterestFromQuery ?? (persisted?.interest ?? fallbackInterest);
  const [selectedInterest, setSelectedInterest] = useState<string>(initialInterest);
  const [selectedCareer, setSelectedCareer] = useState<string>((findBestMatch((roadmapByInterest[initialInterest] ?? []).map((item) => item.career), qpCareer) ?? persisted?.career ?? ""));
  const [selectedSubfield, setSelectedSubfield] = useState<string>(qpSubfield ?? persisted?.subfield ?? "");

  type IntakeDecisionMode = "determined" | "exploring";
  interface IntakeState {
    completed: boolean;
    decisionMode: IntakeDecisionMode;
    targetRole: string;
    primaryInterest: string;
    primaryField: string;
    backgroundLevel: string;
    timeline: string;
    skills: string;
  }

  const INTAKE_KEY = "student-intake-state";
  function loadIntakeState(): IntakeState | null {
    try {
      const raw = localStorage.getItem(INTAKE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<IntakeState>;
      return {
        completed: Boolean(parsed.completed),
        decisionMode: parsed.decisionMode === "determined" ? "determined" : "exploring",
        targetRole: parsed.targetRole ?? "",
        primaryInterest: parsed.primaryInterest ?? "",
        primaryField: parsed.primaryField ?? "",
        backgroundLevel: parsed.backgroundLevel ?? "",
        timeline: parsed.timeline ?? "",
        skills: parsed.skills ?? "",
      };
    } catch {
      return null;
    }
  }

  function persistIntakeState(state: IntakeState) {
    try {
      localStorage.setItem(INTAKE_KEY, JSON.stringify(state));
    } catch {
      // ignore local storage quota errors
    }
  }

  const intakePersisted = loadIntakeState();
  const [intakeStep, setIntakeStep] = useState(1);
  const [intakeCompleted, setIntakeCompleted] = useState(Boolean(intakePersisted?.completed));
  const [intakeDecisionMode, setIntakeDecisionMode] = useState<IntakeDecisionMode>(intakePersisted?.decisionMode ?? "exploring");
  const [intakeTargetRole, setIntakeTargetRole] = useState(intakePersisted?.targetRole ?? "");
  const [intakePrimaryInterest, setIntakePrimaryInterest] = useState(intakePersisted?.primaryInterest ?? "");
  const [intakePrimaryField, setIntakePrimaryField] = useState(intakePersisted?.primaryField ?? "");
  const [intakeBackgroundLevel, setIntakeBackgroundLevel] = useState(intakePersisted?.backgroundLevel ?? "");
  const [intakeTimeline, setIntakeTimeline] = useState(intakePersisted?.timeline ?? "");
  const [intakeSkillInput, setIntakeSkillInput] = useState(intakePersisted?.skills ?? "");
  const [intakeRecommendation, setIntakeRecommendation] = useState<StudentIntakeRecommendation | null>(null);
  const [intakeRecommendationLoading, setIntakeRecommendationLoading] = useState(false);
  const [intakeRecommendationError, setIntakeRecommendationError] = useState<string | null>(null);

  const STUDENT_CHAT_KEY = "student-advisor-chat-history";
  const studentChatBottomRef = useRef<HTMLDivElement | null>(null);

  function buildStudentAdvisorGreeting() {
    return {
      id: "student-chat-welcome",
      role: "assistant" as const,
      content: "Ask me about career direction, which skills to prioritize, what project to build next, or how to turn your current roadmap into an action plan.",
    };
  }

  function isMalformedLegacyAssistantMessage(role: "assistant" | "user", content: string) {
    if (role !== "assistant") {
      return false;
    }

    const trimmed = content.trim();
    if (trimmed.length < 120) {
      return false;
    }

    const whitespaceCount = (trimmed.match(/\s/g) ?? []).length;
    const containsVeryLongToken = /[A-Za-z0-9]{40,}/.test(trimmed);

    return whitespaceCount <= 1 || containsVeryLongToken;
  }

  function loadStudentChatHistory(): StudentAdvisorChatMessage[] {
    try {
      const raw = localStorage.getItem(STUDENT_CHAT_KEY);
      if (!raw) {
        return [buildStudentAdvisorGreeting()];
      }
      const parsed = JSON.parse(raw) as Array<Partial<StudentAdvisorChatMessage>>;
      const normalized = parsed
        .map((item, index) => ({
          id: typeof item.id === "string" && item.id ? item.id : `student-chat-${index}`,
          role: item.role === "user" ? "user" : "assistant",
          content: typeof item.content === "string" ? item.content.trim() : "",
        }))
        .filter((item) => item.content)
        .filter((item) => !isMalformedLegacyAssistantMessage(item.role, item.content));

      if (normalized.length !== parsed.length) {
        try {
          localStorage.setItem(STUDENT_CHAT_KEY, JSON.stringify(normalized.slice(-12)));
        } catch {
          // ignore local storage quota errors
        }
      }

      return normalized.length > 0 ? normalized : [buildStudentAdvisorGreeting()];
    } catch {
      return [buildStudentAdvisorGreeting()];
    }
  }

  const [studentChatMessages, setStudentChatMessages] = useState<StudentAdvisorChatMessage[]>(() => loadStudentChatHistory());
  const [studentChatInput, setStudentChatInput] = useState("");
  const [studentChatLoading, setStudentChatLoading] = useState(false);
  const [studentChatError, setStudentChatError] = useState<string | null>(null);
  const [advisorChatModalOpen, setAdvisorChatModalOpen] = useState(false);

  const intakeInterestOptions = ["Software", "Data", "Cloud", "Security", "Product", "Biotech", "Operations"];
  const intakeFieldOptions = ["Frontend", "Backend", "Full Stack", "AI/ML", "DevOps", "QA", "Business Analysis"];
  const intakeBackgroundOptions = ["School", "College Fresher", "Working Professional", "Career Switcher"];
  const intakeTimelineOptions = ["3 months", "6 months", "1 year", "Flexible"];

  const [showAllIndiaColleges, setShowAllIndiaColleges] = useState(false);
  const [showAllGlobalColleges, setShowAllGlobalColleges] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [deepLinkNotice, setDeepLinkNotice] = useState<string | null>(null);
  const profile = useAppSelector((state) => state.profile as Record<string, unknown>);
  const [fetchedProfileSkills, setFetchedProfileSkills] = useState<string[]>([]);
  const [skillSignalSource, setSkillSignalSource] = useState<"profile" | "inferred">("inferred");

  const [scenarioInterestB, setScenarioInterestB] = useState<string>(fallbackInterest);
  const [scenarioCareerB, setScenarioCareerB] = useState<string>("");
  const [scenarioSubfieldB, setScenarioSubfieldB] = useState<string>("");

  function parseSkillTokens(input: unknown): string[] {
    if (Array.isArray(input)) {
      return input
        .map((value) => String(value).trim())
        .filter(Boolean);
    }
    if (typeof input === "string") {
      return input
        .split(/[;,/|]/g)
        .map((value) => value.trim())
        .filter(Boolean);
    }
    return [];
  }

  function extractProfileSkills(profileRecord: Record<string, unknown>): string[] {
    const merged = [
      ...parseSkillTokens(profileRecord.skills),
      ...parseSkillTokens(profileRecord.itSkills),
      ...parseSkillTokens(profileRecord.Skills),
    ];
    return Array.from(new Set(merged.map((skill) => skill.toLowerCase()))).map((skill) => {
      const match = merged.find((item) => item.toLowerCase() === skill);
      return match ?? skill;
    });
  }

  const reduxProfileSkills = useMemo(() => extractProfileSkills(profile), [profile]);

  useEffect(() => {
    let cancelled = false;

    if (reduxProfileSkills.length > 0) {
      setSkillSignalSource("profile");
      return;
    }

    if (!localStorage.getItem("token")) {
      setSkillSignalSource("inferred");
      return;
    }

    void getMyProfile({ suppressAuthRedirect: true })
      .then((response) => {
        if (cancelled) {
          return;
        }
        const apiSkills = extractProfileSkills((response ?? {}) as Record<string, unknown>);
        setFetchedProfileSkills(apiSkills);
        setSkillSignalSource(apiSkills.length > 0 ? "profile" : "inferred");
      })
      .catch(() => {
        if (!cancelled) {
          setSkillSignalSource("inferred");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reduxProfileSkills]);

  // ── 1. Saved Goals ────────────────────────────────────────────────────────
  interface SavedGoal {
    id: string;
    label: string;
    interest: string;
    career: string;
    subfield: string;
    favorite: boolean;
    createdAt: number;
    lastUsedAt: number;
    source: "manual" | "deep-link" | "advisor";
  }
  const GOALS_KEY = "student-saved-goals";
  function loadGoals(): SavedGoal[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(GOALS_KEY) ?? "[]") as Array<Partial<SavedGoal>>;
      const now = Date.now();
      return Array.isArray(parsed)
        ? parsed.map((item, index) => ({
          id: item.id ?? `legacy-${index}-${now}`,
          label: item.label ?? "Saved goal",
          interest: item.interest ?? fallbackInterest,
          career: item.career ?? "",
          subfield: item.subfield ?? "",
          favorite: item.favorite ?? false,
          createdAt: item.createdAt ?? now,
          lastUsedAt: item.lastUsedAt ?? item.createdAt ?? now,
          source: item.source ?? "manual",
        }))
        : [];
    } catch {
      return [];
    }
  }
  function persistGoals(g: SavedGoal[]) { try { localStorage.setItem(GOALS_KEY, JSON.stringify(g)); } catch { /* noop */ } }
  const [savedGoals, setSavedGoals] = useState<SavedGoal[]>(loadGoals);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalLabel, setEditingGoalLabel] = useState("");
  const [newGoalLabel, setNewGoalLabel] = useState("");
  function createGoal(labelOverride?: string) {
    const label = labelOverride?.trim() || newGoalLabel.trim() || `${selectedInterest} → ${activeRoadmap?.career ?? ""}`;
    if (!label || !selectedInterest) return;
    const now = Date.now();
    const goal: SavedGoal = {
      id: crypto.randomUUID(),
      label,
      interest: selectedInterest,
      career: activeRoadmap?.career ?? "",
      subfield: selectedSubfield,
      favorite: false,
      createdAt: now,
      lastUsedAt: now,
      source: "manual",
    };
    const next = [goal, ...savedGoals];
    setSavedGoals(next); persistGoals(next); setNewGoalLabel("");
  }
  function applyGoal(goal: SavedGoal) {
    const now = Date.now();
    const updated = savedGoals.map((item) => (item.id === goal.id ? { ...item, lastUsedAt: now } : item));
    setSavedGoals(updated);
    persistGoals(updated);
    setSelectedInterest(goal.interest); setSelectedCareer(goal.career); setSelectedSubfield(goal.subfield);
    document.getElementById("student-roadmap-wizard")?.scrollIntoView({ behavior: "smooth" });
  }
  function startEditGoal(goal: SavedGoal) { setEditingGoalId(goal.id); setEditingGoalLabel(goal.label); }
  function saveEditGoal(id: string) {
    const next = savedGoals.map((g) => g.id === id ? { ...g, label: editingGoalLabel.trim() || g.label } : g);
    setSavedGoals(next); persistGoals(next); setEditingGoalId(null);
  }
  function deleteGoal(id: string) {
    const next = savedGoals.filter((g) => g.id !== id);
    setSavedGoals(next); persistGoals(next);
  }
  function toggleFavoriteGoal(id: string) {
    const next = savedGoals.map((g) => (g.id === id ? { ...g, favorite: !g.favorite } : g));
    setSavedGoals(next);
    persistGoals(next);
  }

  const sortedSavedGoals = useMemo(
    () => [...savedGoals].sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.lastUsedAt - a.lastUsedAt),
    [savedGoals],
  );

  // ── 2. Action Checklist ──────────────────────────────────────────────────
  type TaskPriority = "high" | "medium" | "low";
  type PlanDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  interface CheckItem {
    id: string;
    text: string;
    done: boolean;
    priority: TaskPriority;
    dueDate: string;
    planDay: PlanDay | "";
  }
  const CHECKLIST_KEY = "student-action-checklist";
  const WEEK_DAYS: PlanDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function daysFromNowIso(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function derivePlanDay(dueDate: string): PlanDay | "" {
    if (!dueDate) {
      return "";
    }
    const parsed = new Date(`${dueDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }
    const labels: PlanDay[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayLabel = labels[parsed.getDay()];
    return dayLabel === "Sun" ? "Sun" : dayLabel;
  }

  const DEFAULT_TASKS: CheckItem[] = [
    { id: "t1", text: "Complete Student Profile", done: false, priority: "high", dueDate: daysFromNowIso(2), planDay: derivePlanDay(daysFromNowIso(2)) },
    { id: "t2", text: "Align skills to target role", done: false, priority: "high", dueDate: daysFromNowIso(4), planDay: derivePlanDay(daysFromNowIso(4)) },
    { id: "t3", text: "Set desired job & country", done: false, priority: "medium", dueDate: daysFromNowIso(6), planDay: derivePlanDay(daysFromNowIso(6)) },
    { id: "t4", text: "Explore matching jobs", done: false, priority: "low", dueDate: daysFromNowIso(8), planDay: derivePlanDay(daysFromNowIso(8)) },
  ];
  function loadChecklist(): CheckItem[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(CHECKLIST_KEY) ?? "null") as Array<Partial<CheckItem>> | null;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return DEFAULT_TASKS;
      }

      return parsed.map((item, index) => {
        const priority = item.priority === "high" || item.priority === "medium" || item.priority === "low"
          ? item.priority
          : /profile|resume|cv|skill|target/i.test(item.text ?? "")
            ? "high"
            : /country|visa|tuition|program|compare/i.test(item.text ?? "")
              ? "medium"
              : "low";
        const dueDate = typeof item.dueDate === "string" ? item.dueDate : daysFromNowIso(index + 2);
        return {
          id: item.id ?? crypto.randomUUID(),
          text: item.text ?? "Untitled task",
          done: Boolean(item.done),
          priority,
          dueDate,
          planDay: item.planDay && WEEK_DAYS.includes(item.planDay) ? item.planDay : derivePlanDay(dueDate),
        };
      });
    } catch {
      return DEFAULT_TASKS;
    }
  }
  function persistChecklist(items: CheckItem[]) { try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(items)); } catch { /* noop */ } }
  const [checkItems, setCheckItems] = useState<CheckItem[]>(loadChecklist);
  const [actionView, setActionView] = useState<"list" | "week">("list");
  const [actionFilter, setActionFilter] = useState<"all" | "overdue" | "week" | "high">("all");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState<TaskPriority>("medium");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [editTaskPlanDay, setEditTaskPlanDay] = useState<PlanDay | "">("");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPlanDay, setNewTaskPlanDay] = useState<PlanDay | "">("");
  const checkInputRef = useRef<HTMLInputElement>(null);

  function priorityRank(priority: TaskPriority) {
    if (priority === "high") return 0;
    if (priority === "medium") return 1;
    return 2;
  }

  function getDueMeta(task: CheckItem) {
    if (task.done) {
      return { label: "Done", tone: "text-emerald-200 border-emerald-300/25 bg-emerald-500/20", urgency: -1 };
    }
    if (!task.dueDate) {
      return { label: "No date", tone: "text-slate-300 border-white/15 bg-white/[0.06]", urgency: 9 };
    }
    const today = new Date();
    const due = new Date(`${task.dueDate}T00:00:00`);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0) {
      return { label: `Overdue ${Math.abs(diffDays)}d`, tone: "text-rose-100 border-rose-300/30 bg-rose-500/25", urgency: 0 };
    }
    if (diffDays <= 2) {
      return { label: `Due in ${diffDays}d`, tone: "text-amber-100 border-amber-300/30 bg-amber-500/20", urgency: 1 };
    }
    return { label: `Due in ${diffDays}d`, tone: "text-cyan-100 border-cyan-300/30 bg-cyan-500/20", urgency: 2 };
  }

  const orderedCheckItems = useMemo(() => {
    return [...checkItems].sort((a, b) => {
      if (a.done !== b.done) {
        return Number(a.done) - Number(b.done);
      }
      const dueA = getDueMeta(a).urgency;
      const dueB = getDueMeta(b).urgency;
      if (dueA !== dueB) {
        return dueA - dueB;
      }
      const priorityDiff = priorityRank(a.priority) - priorityRank(b.priority);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return a.text.localeCompare(b.text);
    });
  }, [checkItems]);

  const weekBoard = useMemo(() => {
    return WEEK_DAYS.map((day) => ({
      day,
      tasks: orderedCheckItems.filter((item) => {
        const taskDay = item.planDay || derivePlanDay(item.dueDate);
        return taskDay === day;
      }),
    }));
  }, [orderedCheckItems]);

  const reminderStats = useMemo(() => {
    const pending = orderedCheckItems.filter((item) => !item.done);
    const overdue = pending.filter((item) => getDueMeta(item).urgency === 0).length;
    const dueSoon = pending.filter((item) => getDueMeta(item).urgency === 1).length;
    const dueThisWeek = pending.filter((item) => {
      if (!item.dueDate) {
        return false;
      }
      const today = new Date();
      const due = new Date(`${item.dueDate}T00:00:00`);
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
      return diffDays >= 0 && diffDays <= 7;
    }).length;
    const highPriority = pending.filter((item) => item.priority === "high").length;
    return { overdue, dueSoon, dueThisWeek, highPriority };
  }, [orderedCheckItems]);

  const filteredListItems = useMemo(() => {
    if (actionFilter === "overdue") {
      return orderedCheckItems.filter((item) => !item.done && getDueMeta(item).urgency === 0);
    }
    if (actionFilter === "week") {
      return orderedCheckItems.filter((item) => {
        if (item.done || !item.dueDate) {
          return false;
        }
        const today = new Date();
        const due = new Date(`${item.dueDate}T00:00:00`);
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
        return diffDays >= 0 && diffDays <= 7;
      });
    }
    if (actionFilter === "high") {
      return orderedCheckItems.filter((item) => !item.done && item.priority === "high");
    }
    return orderedCheckItems;
  }, [actionFilter, orderedCheckItems]);

  function addTask() {
    const text = newTaskText.trim(); if (!text) return;
    const dueDate = newTaskDueDate;
    const planDay = newTaskPlanDay || derivePlanDay(dueDate);
    const next = [...checkItems, { id: crypto.randomUUID(), text, done: false, priority: newTaskPriority, dueDate, planDay }];
    setCheckItems(next); persistChecklist(next);
    setNewTaskText("");
    setNewTaskPriority("medium");
    setNewTaskDueDate("");
    setNewTaskPlanDay("");
  }
  function startEditTask(task: CheckItem) {
    setEditingTaskId(task.id);
    setEditTaskText(task.text);
    setEditTaskPriority(task.priority);
    setEditTaskDueDate(task.dueDate);
    setEditTaskPlanDay(task.planDay);
  }
  function cancelEditTask() {
    setEditingTaskId(null);
    setEditTaskText("");
    setEditTaskPriority("medium");
    setEditTaskDueDate("");
    setEditTaskPlanDay("");
  }
  function saveEditTask(id: string) {
    const text = editTaskText.trim();
    if (!text) {
      return;
    }
    const dueDate = editTaskDueDate;
    const next = checkItems.map((item) => item.id === id
      ? {
          ...item,
          text,
          priority: editTaskPriority,
          dueDate,
          planDay: editTaskPlanDay || derivePlanDay(dueDate),
        }
      : item);
    setCheckItems(next);
    persistChecklist(next);
    cancelEditTask();
  }
  function addSuggestedTask(text: string) {
    const normalized = text.trim().toLowerCase();
    if (!normalized) return;
    if (checkItems.some((item) => item.text.trim().toLowerCase() === normalized)) {
      return;
    }
    const dueDate = daysFromNowIso(5);
    const next = [...checkItems, {
      id: crypto.randomUUID(),
      text: text.trim(),
      done: false,
      priority: /profile|skill|resume|cv/i.test(text) ? "high" : "medium",
      dueDate,
      planDay: derivePlanDay(dueDate),
    }];
    setCheckItems(next);
    persistChecklist(next);
  }
  function toggleTask(id: string) { const next = checkItems.map((t) => t.id === id ? { ...t, done: !t.done } : t); setCheckItems(next); persistChecklist(next); }
  function deleteTask(id: string) { const next = checkItems.filter((t) => t.id !== id); setCheckItems(next); persistChecklist(next); }

  // ── 3. Country Watchlist ─────────────────────────────────────────────────
  const WATCHLIST_KEY = "student-country-watchlist";
  function loadWatchlist(): string[] { try { return JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? "[]"); } catch { return []; } }
  function persistWatchlist(w: string[]) { try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(w)); } catch { /* noop */ } }
  const [watchlist, setWatchlist] = useState<string[]>(loadWatchlist);
  function toggleWatchlist(country: string) {
    const next = watchlist.includes(country) ? watchlist.filter((c) => c !== country) : [country, ...watchlist];
    setWatchlist(next); persistWatchlist(next);
  }

  // ── 4. Bookmarked Career Paths ───────────────────────────────────────────
  const BOOKMARKS_KEY = "student-career-bookmarks";
  function loadBookmarks(): string[] { try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]"); } catch { return []; } }
  function persistBookmarks(b: string[]) { try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(b)); } catch { /* noop */ } }
  const [bookmarks, setBookmarks] = useState<string[]>(loadBookmarks);
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [careerSortBy, setCareerSortBy] = useState<"fit" | "salary" | "duration">("fit");
  const [careerDurationFilter, setCareerDurationFilter] = useState<"all" | "short" | "mid" | "long">("all");
  const [careerCompare, setCareerCompare] = useState<string[]>([]);
  function toggleBookmark(title: string) {
    const next = bookmarks.includes(title) ? bookmarks.filter((b) => b !== title) : [title, ...bookmarks];
    setBookmarks(next); persistBookmarks(next);
  }
  function toggleCareerCompare(title: string) {
    if (careerCompare.includes(title)) {
      setCareerCompare(careerCompare.filter((item) => item !== title));
      return;
    }
    if (careerCompare.length >= 2) {
      setCareerCompare([careerCompare[1], title]);
      return;
    }
    setCareerCompare([...careerCompare, title]);
  }

  const careers = searchResults ?? dashboard.careers.items;

  function parseCurrencyBand(value: string) {
    const numbers = (value.match(/\d+(?:\.\d+)?/g) ?? []).map((token) => Number(token));
    if (!numbers.length) {
      return { min: 0, max: 0 };
    }
    return { min: numbers[0], max: numbers[numbers.length - 1] };
  }

  function parseDurationYears(value: string) {
    const numbers = (value.match(/\d+(?:\.\d+)?/g) ?? []).map((token) => Number(token));
    if (!numbers.length) {
      return 0;
    }
    return numbers[numbers.length - 1];
  }

  function computeCareerFit(title: string) {
    const haystack = `${title} ${selectedInterest} ${selectedSubfield}`.toLowerCase();
    const tokens = [selectedInterest, selectedSubfield, searchQuery]
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2);
    let score = 54;
    for (const token of tokens) {
      if (haystack.includes(token)) {
        score += 8;
      }
    }
    if (bookmarks.includes(title)) {
      score += 6;
    }
    if (selectedCareer && title.toLowerCase().includes(selectedCareer.toLowerCase().split(" ")[0] ?? "")) {
      score += 10;
    }
    return Math.min(98, score);
  }

  const skillTaxonomy: Record<string, string[]> = {
    data: ["Statistics", "Python", "SQL", "Data Visualization", "A/B Testing", "Experiment Design"],
    science: ["Research Methods", "Scientific Writing", "Lab Workflow", "Literature Review", "Critical Thinking"],
    biotech: ["Molecular Biology", "Cell Culture", "Bioinformatics", "PCR", "Genomics"],
    software: ["JavaScript", "TypeScript", "System Design", "APIs", "Git"],
    engineer: ["Problem Solving", "Algorithms", "Testing", "Debugging", "Architecture"],
    ai: ["Machine Learning", "Model Evaluation", "Prompt Design", "Data Ethics", "MLOps"],
    analyst: ["Excel", "SQL", "Dashboarding", "Business Metrics", "Storytelling"],
    product: ["Roadmapping", "Stakeholder Management", "Prioritization", "User Research", "KPIs"],
    design: ["UX Research", "Wireframing", "Design Systems", "Prototyping", "Accessibility"],
    marketing: ["SEO", "Copywriting", "Campaign Analytics", "Positioning", "Social Strategy"],
    cyber: ["Threat Modeling", "Network Security", "SIEM", "IAM", "Incident Response"],
    finance: ["Financial Modeling", "Valuation", "Accounting", "Risk Analysis", "Forecasting"],
  };

  function dedupeSkills(values: string[]) {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
  }

  function inferLearnerSkills() {
    const tokens = `${selectedInterest} ${selectedSubfield} ${searchQuery}`.toLowerCase();
    const inferred = ["Communication", "Problem Solving", "Presentation"];
    Object.entries(skillTaxonomy).forEach(([key, skills]) => {
      if (tokens.includes(key)) {
        inferred.push(...skills.slice(0, 3));
      }
    });
    return dedupeSkills(inferred);
  }

  function inferCareerSkills(title: string) {
    const tokens = `${title} ${selectedInterest}`.toLowerCase();
    const inferred: string[] = [];
    Object.entries(skillTaxonomy).forEach(([key, skills]) => {
      if (tokens.includes(key)) {
        inferred.push(...skills);
      }
    });
    if (inferred.length === 0) {
      inferred.push("Research", "Documentation", "Collaboration", "Domain Knowledge");
    }
    return dedupeSkills(inferred).slice(0, 6);
  }

  function toWordTokens(value: string) {
    return value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2);
  }

  function recommendResourcesForCareer(missingSkills: string[], careerTitle: string) {
    const intentTokens = new Set(
      dedupeSkills([
        ...missingSkills,
        selectedInterest,
        selectedSubfield,
        careerTitle,
      ].flatMap((value) => toWordTokens(value))),
    );

    const ranked = dashboard.resources.items
      .map((resource) => {
        const resourceTokens = new Set(toWordTokens(`${resource.title} ${resource.alt ?? ""}`));
        let score = 0;
        intentTokens.forEach((token) => {
          if (resourceTokens.has(token)) {
            score += 2;
          } else if (`${resource.title} ${(resource.alt ?? "")}`.toLowerCase().includes(token)) {
            score += 1;
          }
        });
        return { resource, score };
      })
      .sort((a, b) => b.score - a.score);

    const withMatches = ranked.filter((item) => item.score > 0).slice(0, 2).map((item) => item.resource);
    if (withMatches.length > 0) {
      return withMatches;
    }
    return dashboard.resources.items.slice(0, 2);
  }

  const learnerSkillSignals = useMemo(() => {
    const fromProfile = dedupeSkills([...reduxProfileSkills, ...fetchedProfileSkills]);
    if (fromProfile.length > 0) {
      return fromProfile;
    }
    return inferLearnerSkills();
  }, [fetchedProfileSkills, reduxProfileSkills, searchQuery, selectedInterest, selectedSubfield]);

  const careerInsights = useMemo(() => {
    return careers.map((career) => {
      const durationYears = parseDurationYears(career.duration);
      const salaryBand = parseCurrencyBand(career.salary);
      const fitScore = computeCareerFit(career.title);
      const requiredSkills = inferCareerSkills(career.title);
      const matchedSkills = requiredSkills.filter((skill) => learnerSkillSignals.some((known) => known.toLowerCase() === skill.toLowerCase()));
      const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill));
      const recommendedResources = recommendResourcesForCareer(missingSkills, career.title);
      const learningPace = durationYears > 0 && durationYears <= 2
        ? "Fast-track"
        : durationYears <= 4
          ? "Balanced"
          : "Deep-specialization";
      const demandSignal = fitScore >= 80 ? "High" : fitScore >= 68 ? "Medium" : "Emerging";
      return {
        ...career,
        durationYears,
        salaryBand,
        fitScore,
        requiredSkills,
        matchedSkills,
        missingSkills,
        recommendedResources,
        learningPace,
        demandSignal,
      };
    });
  }, [bookmarks, careers, dashboard.resources.items, learnerSkillSignals, searchQuery, selectedCareer, selectedInterest, selectedSubfield]);

  const visibleCareerInsights = useMemo(() => {
    const onlyBookmarked = showOnlyBookmarked
      ? careerInsights.filter((career) => bookmarks.includes(career.title))
      : careerInsights;

    const byDuration = onlyBookmarked.filter((career) => {
      if (careerDurationFilter === "all") return true;
      if (careerDurationFilter === "short") return career.durationYears > 0 && career.durationYears <= 2;
      if (careerDurationFilter === "mid") return career.durationYears > 2 && career.durationYears <= 4;
      return career.durationYears > 4;
    });

    const sorted = [...byDuration].sort((a, b) => {
      if (careerSortBy === "salary") {
        return b.salaryBand.max - a.salaryBand.max;
      }
      if (careerSortBy === "duration") {
        return a.durationYears - b.durationYears;
      }
      return b.fitScore - a.fitScore;
    });

    return sorted;
  }, [bookmarks, careerDurationFilter, careerInsights, careerSortBy, showOnlyBookmarked]);

  const compareCareers = useMemo(
    () => careerInsights.filter((career) => careerCompare.includes(career.title)).slice(0, 2),
    [careerCompare, careerInsights],
  );

  type PathwayTrackId = "research" | "bioinformatics" | "clinical";
  const pathwayTracks: Array<{ id: PathwayTrackId; label: string; focus: string[]; cadence: string }> = [
    { id: "research", label: "Lab Research", focus: ["Molecular Biology", "Experimental Design", "Lab Documentation"], cadence: "6-week sprint" },
    { id: "bioinformatics", label: "Bioinformatics", focus: ["Python", "Genomics", "Data Analysis"], cadence: "8-week sprint" },
    { id: "clinical", label: "Clinical Ops", focus: ["Regulatory Basics", "Clinical Workflow", "Ethics"], cadence: "5-week sprint" },
  ];

  const PATHWAY_PROGRESS_KEY = "student-pathway-progress";
  const RESOURCE_PROGRESS_KEY = "student-resource-progress";

  function loadTitleList(key: string) {
    try {
      const raw = JSON.parse(localStorage.getItem(key) ?? "[]");
      return Array.isArray(raw) ? raw.map((value) => String(value)) : [];
    } catch {
      return [];
    }
  }

  function persistTitleList(key: string, values: string[]) {
    try {
      localStorage.setItem(key, JSON.stringify(values));
    } catch {
      // noop
    }
  }

  const [selectedPathwayTrack, setSelectedPathwayTrack] = useState<PathwayTrackId>("research");
  const [completedPathwaySteps, setCompletedPathwaySteps] = useState<string[]>(() => loadTitleList(PATHWAY_PROGRESS_KEY));
  const [completedResources, setCompletedResources] = useState<string[]>(() => loadTitleList(RESOURCE_PROGRESS_KEY));
  const [resourceTypeFilter, setResourceTypeFilter] = useState<"all" | "skills" | "career" | "recommended">("all");
  const [resourceDurationFilter, setResourceDurationFilter] = useState<"all" | "short" | "medium" | "long">("all");
  const [plannerWeeks, setPlannerWeeks] = useState(4);
  const [plannerNotice, setPlannerNotice] = useState<string | null>(null);

  const activePathwayTrack = pathwayTracks.find((track) => track.id === selectedPathwayTrack) ?? pathwayTracks[0];

  useEffect(() => {
    const normalized = `${selectedInterest} ${selectedSubfield}`.toLowerCase();
    if (normalized.includes("bioinform")) {
      setSelectedPathwayTrack("bioinformatics");
      return;
    }
    if (normalized.includes("clinic")) {
      setSelectedPathwayTrack("clinical");
      return;
    }
    if (normalized.includes("biotech") || normalized.includes("science")) {
      setSelectedPathwayTrack("research");
    }
  }, [selectedInterest, selectedSubfield]);

  function togglePathwayStep(stepTitle: string) {
    const next = completedPathwaySteps.includes(stepTitle)
      ? completedPathwaySteps.filter((item) => item !== stepTitle)
      : [...completedPathwaySteps, stepTitle];
    setCompletedPathwaySteps(next);
    persistTitleList(PATHWAY_PROGRESS_KEY, next);
  }

  function toggleResourceComplete(resourceTitle: string) {
    const next = completedResources.includes(resourceTitle)
      ? completedResources.filter((item) => item !== resourceTitle)
      : [...completedResources, resourceTitle];
    setCompletedResources(next);
    persistTitleList(RESOURCE_PROGRESS_KEY, next);
  }

  function parseCadenceWeeks(value: string) {
    const parsed = Number((value.match(/\d+/)?.[0] ?? "0"));
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return 4;
  }

  const weeklyPlanBlueprint = useMemo(() => {
    const cap = Math.max(1, plannerWeeks);
    const focus = activePathwayTrack.focus;
    const steps = dashboard.pathway.steps;
    return Array.from({ length: cap }).map((_, index) => {
      const step = steps[index % steps.length];
      const focusSkill = focus[index % focus.length] ?? "Core Skill";
      const weekLabel = `Week ${index + 1}`;
      const text = `${weekLabel}: ${step?.title ?? "Pathway Progress"} (${focusSkill})`;
      const dueDate = daysFromNowIso(index * 7 + 5);
      return {
        text,
        dueDate,
        planDay: derivePlanDay(dueDate),
        priority: index <= 1 ? "high" as TaskPriority : "medium" as TaskPriority,
      };
    });
  }, [activePathwayTrack.focus, dashboard.pathway.steps, plannerWeeks]);

  function queueWeeklyPlannerTasks() {
    const existing = new Set(checkItems.map((item) => item.text.trim().toLowerCase()));
    const additions = weeklyPlanBlueprint.filter((item) => !existing.has(item.text.trim().toLowerCase()));

    if (additions.length === 0) {
      setPlannerNotice("Planner tasks already exist in your action plan.");
      return;
    }

    const next = [
      ...checkItems,
      ...additions.map((item) => ({
        id: crypto.randomUUID(),
        text: item.text,
        done: false,
        priority: item.priority,
        dueDate: item.dueDate,
        planDay: item.planDay,
      })),
    ];

    setCheckItems(next);
    persistChecklist(next);
    setPlannerNotice(`Added ${additions.length} weekly tasks to Action Plan.`);
    document.getElementById("student-action-panel")?.scrollIntoView({ behavior: "smooth" });
  }

  const pathwayProgressPct = useMemo(() => {
    const total = dashboard.pathway.steps.length || 1;
    const done = dashboard.pathway.steps.filter((step) => completedPathwaySteps.includes(step.title)).length;
    return Math.round((done / total) * 100);
  }, [completedPathwaySteps, dashboard.pathway.steps]);

  function parseDurationMinutes(value: string | undefined) {
    if (!value) return 0;
    const lowered = value.toLowerCase();
    const nums = (lowered.match(/\d+(?:\.\d+)?/g) ?? []).map((token) => Number(token));
    if (!nums.length) return 0;
    const base = nums[0];
    if (lowered.includes("hour")) return Math.round(base * 60);
    return Math.round(base);
  }

  const resourceInsights = useMemo(() => {
    const contextTokens = new Set(toWordTokens(`${selectedInterest} ${selectedSubfield} ${activePathwayTrack.label} ${activePathwayTrack.focus.join(" ")} ${intakePrimaryField} ${intakeTargetRole}`));
    return dashboard.resources.items.map((resource, index) => {
      const minutes = parseDurationMinutes(resource.duration);
      const kind = index % 2 === 0 ? "career" : "skills";
      const text = `${resource.title} ${resource.alt ?? ""}`.toLowerCase();
      const tokens = new Set(toWordTokens(text));
      let relevanceScore = 0;
      contextTokens.forEach((token) => {
        if (tokens.has(token)) {
          relevanceScore += 2;
        } else if (text.includes(token)) {
          relevanceScore += 1;
        }
      });
      return {
        ...resource,
        kind,
        minutes,
        relevanceScore,
      };
    });
  }, [activePathwayTrack.focus, activePathwayTrack.label, dashboard.resources.items, intakePrimaryField, intakeTargetRole, selectedInterest, selectedSubfield]);

  const visibleResourceInsights = useMemo(() => {
    return resourceInsights
      .filter((resource) => {
        if (resourceTypeFilter === "skills") return resource.kind === "skills";
        if (resourceTypeFilter === "career") return resource.kind === "career";
        if (resourceTypeFilter === "recommended") return resource.relevanceScore > 0;
        return true;
      })
      .filter((resource) => {
        if (resourceDurationFilter === "short") return resource.minutes > 0 && resource.minutes <= 20;
        if (resourceDurationFilter === "medium") return resource.minutes > 20 && resource.minutes <= 45;
        if (resourceDurationFilter === "long") return resource.minutes > 45;
        return true;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore || a.minutes - b.minutes);
  }, [resourceDurationFilter, resourceInsights, resourceTypeFilter]);

  const resourceProgress = useMemo(() => {
    const total = dashboard.resources.items.length || 1;
    const done = dashboard.resources.items.filter((resource) => completedResources.includes(resource.title)).length;
    return {
      done,
      total,
      pct: Math.round((done / total) * 100),
    };
  }, [completedResources, dashboard.resources.items]);

  const advisorTopCareers = useMemo(
    () => careerInsights.slice(0, 3),
    [careerInsights],
  );

  const advisorCoachTips = useMemo(() => {
    const stream = selectedSubfield || selectedInterest;
    const firstCareer = advisorTopCareers[0]?.title ?? "your target career";
    return [
      `Build a 30-day skill sprint around ${stream} fundamentals and keep it portfolio-backed.`,
      `Anchor your profile headline to ${firstCareer} outcomes, not only tools.`,
      `Run one weekly reflection: what you learned, what you shipped, what to improve next week.`,
    ];
  }, [advisorTopCareers, selectedInterest, selectedSubfield]);

  const advisorResourcePicks = useMemo(() => {
    const topCareer = advisorTopCareers[0]?.title ?? selectedInterest;
    return recommendResourcesForCareer([selectedSubfield, selectedInterest].filter(Boolean), topCareer).slice(0, 3);
  }, [advisorTopCareers, selectedInterest, selectedSubfield]);

  const currentRoadmaps = useMemo(() => roadmapByInterest[selectedInterest] ?? [], [roadmapByInterest, selectedInterest]);

  const activeRoadmap = useMemo(() => {
    if (currentRoadmaps.length === 0) {
      return null;
    }

    const byCareer = selectedCareer
      ? currentRoadmaps.find((item) => item.career === selectedCareer)
      : currentRoadmaps[0];

    return byCareer ?? currentRoadmaps[0];
  }, [currentRoadmaps, selectedCareer]);

  useEffect(() => {
    persistIntakeState({
      completed: intakeCompleted,
      decisionMode: intakeDecisionMode,
      targetRole: intakeTargetRole,
      primaryInterest: intakePrimaryInterest,
      primaryField: intakePrimaryField,
      backgroundLevel: intakeBackgroundLevel,
      timeline: intakeTimeline,
      skills: intakeSkillInput,
    });
  }, [intakeBackgroundLevel, intakeCompleted, intakeDecisionMode, intakePrimaryField, intakePrimaryInterest, intakeSkillInput, intakeTargetRole, intakeTimeline]);

  useEffect(() => {
    if (!intakeCompleted) {
      return;
    }

    const matchedInterest = findBestMatch(interestCandidates, intakePrimaryInterest);
    if (matchedInterest && matchedInterest !== selectedInterest) {
      setSelectedInterest(matchedInterest);
      return;
    }

    const roadmaps = roadmapByInterest[matchedInterest ?? selectedInterest] ?? [];
    const matchedCareer = intakeTargetRole
      ? roadmaps.find((item) => item.career.toLowerCase().includes(intakeTargetRole.toLowerCase()))?.career
      : null;

    if (matchedCareer && matchedCareer !== selectedCareer) {
      setSelectedCareer(matchedCareer);
    }
  }, [intakeCompleted, intakePrimaryInterest, intakeTargetRole, interestCandidates, roadmapByInterest, selectedCareer, selectedInterest]);

  useEffect(() => {
    if (!intakeCompleted || !intakePrimaryInterest || !intakePrimaryField) {
      return;
    }

    let cancelled = false;
    setIntakeRecommendationLoading(true);
    setIntakeRecommendationError(null);

    void getStudentIntakeRecommendation({
      decisionMode: intakeDecisionMode,
      targetRole: intakeTargetRole,
      primaryInterest: intakePrimaryInterest,
      primaryField: intakePrimaryField,
      backgroundLevel: intakeBackgroundLevel,
      timeline: intakeTimeline,
      skills: intakeSkillInput,
    })
      .then((response) => {
        if (cancelled) {
          return;
        }
        setIntakeRecommendation(response);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const fallbackMessage = "Could not generate AI recommendation right now.";
        const message = (err as { response?: { data?: { errorMessage?: string } } })?.response?.data?.errorMessage ?? fallbackMessage;
        setIntakeRecommendationError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setIntakeRecommendationLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [intakeBackgroundLevel, intakeCompleted, intakeDecisionMode, intakePrimaryField, intakePrimaryInterest, intakeSkillInput, intakeTargetRole, intakeTimeline]);

  useEffect(() => {
    try {
      localStorage.setItem(STUDENT_CHAT_KEY, JSON.stringify(studentChatMessages.slice(-12)));
    } catch {
      // ignore local storage quota errors
    }
  }, [studentChatMessages]);

  useEffect(() => {
    studentChatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeSection, studentChatLoading, studentChatMessages]);

  const roleRecommendationReasons = useMemo(() => {
    if (!intakeRecommendation) {
      return {} as Record<string, string[]>;
    }

    if (intakeRecommendation.roleReasons && Object.keys(intakeRecommendation.roleReasons).length > 0) {
      return intakeRecommendation.roleReasons;
    }

    const defaultFocus = intakeRecommendation.focusAreas[0] ?? `${intakePrimaryField} fundamentals`;
    const defaultStep = intakeRecommendation.nextSteps[0] ?? `Build proof of work in ${intakePrimaryField}`;

    return intakeRecommendation.recommendedRoles.slice(0, 3).reduce((acc, role, index) => {
      const focusHint = intakeRecommendation.focusAreas[index] ?? defaultFocus;
      const modeHint = intakeDecisionMode === "determined" && intakeTargetRole
        ? `Close to your target role: ${intakeTargetRole}`
        : "Supports exploration while you compare nearby paths.";

      acc[role] = [
        `Aligned with ${intakePrimaryInterest || "your selected interest"}`,
        modeHint,
        index === 0 ? `Start with: ${defaultStep}` : `Skill focus: ${focusHint}`,
      ];
      return acc;
    }, {} as Record<string, string[]>);
  }, [intakeDecisionMode, intakePrimaryField, intakePrimaryInterest, intakeRecommendation, intakeTargetRole]);

  const roleConfidenceScores = useMemo(() => {
    if (!intakeRecommendation) {
      return {} as Record<string, number>;
    }

    if (intakeRecommendation.roleConfidence && Object.keys(intakeRecommendation.roleConfidence).length > 0) {
      return intakeRecommendation.roleConfidence;
    }

    return intakeRecommendation.recommendedRoles.slice(0, 3).reduce((acc, role, index) => {
      const base = intakeDecisionMode === "determined" ? 90 : 82;
      acc[role] = Math.max(55, base - index * 8);
      return acc;
    }, {} as Record<string, number>);
  }, [intakeDecisionMode, intakeRecommendation]);

  const roleConfidenceFactors = useMemo(() => {
    if (!intakeRecommendation) {
      return {} as Record<string, string[]>;
    }

    const normalizedTarget = intakeTargetRole.trim().toLowerCase();

    return intakeRecommendation.recommendedRoles.slice(0, 3).reduce((acc, role) => {
      const factors: string[] = [];
      const reasons = roleRecommendationReasons[role] ?? [];

      if (reasons[0]) {
        factors.push(reasons[0]);
      }
      if (reasons[1]) {
        factors.push(reasons[1]);
      }

      if (intakeDecisionMode === "determined" && normalizedTarget) {
        const roleText = role.toLowerCase();
        const isTargetAdjacent = normalizedTarget
          .split(/\s+/)
          .some((token) => token.length > 2 && roleText.includes(token));
        factors.push(isTargetAdjacent ? `Target-role overlap with ${intakeTargetRole}` : `Adjacent path to your target role: ${intakeTargetRole}`);
      } else {
        factors.push("Exploration-fit based on your interest and field selection");
      }

      if (intakeTimeline) {
        factors.push(`Timeline readiness: ${intakeTimeline}`);
      }

      if (intakePrimaryField) {
        factors.push(`Field alignment: ${intakePrimaryField}`);
      }

      acc[role] = Array.from(new Set(factors.filter(Boolean))).slice(0, 2);
      return acc;
    }, {} as Record<string, string[]>);
  }, [intakeDecisionMode, intakePrimaryField, intakeRecommendation, intakeTargetRole, intakeTimeline, roleRecommendationReasons]);

  const getConfidenceBadgeClasses = (score: number) => {
    if (score >= 80) {
      return "border-emerald-300/45 bg-emerald-500/25 text-emerald-50";
    }
    if (score >= 60) {
      return "border-amber-300/45 bg-amber-500/25 text-amber-50";
    }
    return "border-rose-300/45 bg-rose-500/25 text-rose-50";
  };

  const advisorSuggestedPrompts = useMemo(() => {
    const focusRole = intakeTargetRole || selectedCareer || advisorTopCareers[0]?.title || "this path";
    return [
      `What should I build first for ${focusRole}?`,
      "Which skills should I prioritize in the next 30 days?",
      "How do I turn this roadmap into an internship plan?",
    ];
  }, [advisorTopCareers, intakeTargetRole, selectedCareer]);

  function appendStreamChunk(previousText: string, chunk: string) {
    if (!chunk) {
      return previousText;
    }

    if (!previousText) {
      return chunk;
    }

    const prevLast = previousText.slice(-1);
    const chunkFirst = chunk.slice(0, 1);
    const needsSpacing = /[A-Za-z0-9]/.test(prevLast) && /[A-Za-z0-9]/.test(chunkFirst);

    return needsSpacing ? `${previousText} ${chunk}` : `${previousText}${chunk}`;
  }

  async function sendStudentAdvisorMessage(prefilledMessage?: string) {
    const trimmedMessage = (prefilledMessage ?? studentChatInput).trim();
    if (!trimmedMessage || studentChatLoading) {
      return;
    }

    const messageId = `student-chat-user-${Date.now()}`;
    const userMessage: StudentAdvisorChatMessage = {
      id: messageId,
      role: "user",
      content: trimmedMessage,
    };

    const recentHistory = studentChatMessages.slice(-8).map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const assistantMessageId = `student-chat-assistant-${Date.now()}`;

    setStudentChatMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ]);
    setStudentChatInput("");
    setStudentChatLoading(true);
    setStudentChatError(null);

    try {
      const aiOptions = {
        maxResponseWords: 100,
        temperature: 0.35,
        maxTokens: 320,
        model: "llama3.2",
      };

      const payload = {
        message: trimmedMessage,
        history: recentHistory,
        decisionMode: intakeDecisionMode,
        targetRole: intakeTargetRole || selectedCareer || undefined,
        primaryInterest: intakePrimaryInterest || selectedInterest || undefined,
        primaryField: intakePrimaryField || selectedSubfield || selectedCareer || undefined,
        backgroundLevel: intakeBackgroundLevel || undefined,
        timeline: intakeTimeline || undefined,
        skills: intakeSkillInput || undefined,
        recommendationSummary: intakeRecommendation?.summary,
        recommendedRoles: intakeRecommendation?.recommendedRoles?.slice(0, 4),
        ...aiOptions,
      };

      let streamedAnyChunk = false;

      await streamStudentAdvisorChat(payload, {
        onChunk: (chunk) => {
          streamedAnyChunk = true;
          setStudentChatMessages((prev) => prev.map((message) => (
            message.id === assistantMessageId
              ? { ...message, content: appendStreamChunk(message.content, chunk) }
              : message
          )));
        },
      });

      if (!streamedAnyChunk) {
        throw new Error("Empty stream response");
      }
    } catch (err: unknown) {
      try {
        const fallbackResponse = await chatWithStudentAdvisor({
          message: trimmedMessage,
          history: recentHistory,
          decisionMode: intakeDecisionMode,
          targetRole: intakeTargetRole || selectedCareer || undefined,
          primaryInterest: intakePrimaryInterest || selectedInterest || undefined,
          primaryField: intakePrimaryField || selectedSubfield || selectedCareer || undefined,
          backgroundLevel: intakeBackgroundLevel || undefined,
          timeline: intakeTimeline || undefined,
          skills: intakeSkillInput || undefined,
          recommendationSummary: intakeRecommendation?.summary,
          recommendedRoles: intakeRecommendation?.recommendedRoles?.slice(0, 4),
          ...aiOptions,
        });

        setStudentChatMessages((prev) => prev.map((message) => (
          message.id === assistantMessageId
            ? { ...message, content: fallbackResponse.reply }
            : message
        )));
      } catch {
        const fallbackMessage = "Student advisor chat is unavailable right now.";
        const message = (err as { response?: { data?: { errorMessage?: string } } })?.response?.data?.errorMessage ?? fallbackMessage;
        setStudentChatError(message);
        setStudentChatMessages((prev) => prev.filter((messageItem) => {
          if (messageItem.id !== assistantMessageId) {
            return true;
          }
          return messageItem.content.trim().length > 0;
        }));
      }
    } finally {
      setStudentChatLoading(false);
    }
  }

  function clearStudentAdvisorChat() {
    const welcomeMessage = buildStudentAdvisorGreeting();
    setStudentChatMessages([welcomeMessage]);
    setStudentChatError(null);
    setStudentChatInput("");
  }

  const scenarioRoadmapsB = useMemo(() => roadmapByInterest[scenarioInterestB] ?? [], [roadmapByInterest, scenarioInterestB]);
  const scenarioActiveRoadmapB = useMemo(() => {
    if (scenarioRoadmapsB.length === 0) {
      return null;
    }
    const byCareer = scenarioCareerB
      ? scenarioRoadmapsB.find((item) => item.career === scenarioCareerB)
      : scenarioRoadmapsB[0];
    return byCareer ?? scenarioRoadmapsB[0];
  }, [scenarioRoadmapsB, scenarioCareerB]);

  const countries = activeRoadmap?.topCountries ?? [];

  type CountryWeightKey = "demand" | "salary" | "visa" | "affordability";
  const [countryWeights, setCountryWeights] = useState<Record<CountryWeightKey, number>>({
    demand: 40,
    salary: 30,
    visa: 20,
    affordability: 10,
  });

  const totalCountryWeight = Math.max(1, Object.values(countryWeights).reduce((sum, value) => sum + value, 0));

  const countryInsights = countries.map((country, index) => {
    const budgetBands = [
      { tuition: "$22k", living: "$14k", total: "$36k/yr", affordabilityLabel: "Medium stretch", affordabilityPct: 64 },
      { tuition: "$18k", living: "$12k", total: "$30k/yr", affordabilityLabel: "Balanced", affordabilityPct: 72 },
      { tuition: "$16k", living: "$10k", total: "$26k/yr", affordabilityLabel: "Affordable", affordabilityPct: 84 },
      { tuition: "$24k", living: "$16k", total: "$40k/yr", affordabilityLabel: "High stretch", affordabilityPct: 58 },
    ] as const;

    const demandPct = Math.max(58, 92 - index * 7);
    const salaryPct = Math.max(60, 90 - index * 6);
    const visaPct = index <= 1 ? 58 : 84;
    const avgPackage = index === 0 ? "$120k+" : index === 1 ? "$105k+" : index === 2 ? "$95k+" : "$88k+";
    const visaEase = index <= 1 ? "Medium" : "High";
    const budget = budgetBands[index % budgetBands.length];

    const weightedScore = Math.round(
      (
        demandPct * countryWeights.demand +
        salaryPct * countryWeights.salary +
        visaPct * countryWeights.visa +
        budget.affordabilityPct * countryWeights.affordability
      ) / totalCountryWeight,
    );

    return {
      country,
      demandPct,
      salaryPct,
      visaPct,
      avgPackage,
      visaEase,
      budget,
      weightedScore,
    };
  });

  const [compareCountryA, setCompareCountryA] = useState<string>("");
  const [compareCountryB, setCompareCountryB] = useState<string>("");

  const compareCardA = countryInsights.find((item) => item.country === compareCountryA) ?? countryInsights[0] ?? null;
  const compareCardB = countryInsights.find((item) => item.country === compareCountryB) ?? countryInsights[1] ?? countryInsights[0] ?? null;
  const topCountryByWeightedScore = countryInsights.reduce((best, current) => (current.weightedScore > best.weightedScore ? current : best), countryInsights[0]);

  const wizardProgress = [
    Boolean(selectedInterest),
    Boolean(activeRoadmap?.career),
    Boolean(selectedSubfield),
    Boolean(countryInsights.length),
  ].filter(Boolean).length;

  const progressPct = Math.round((wizardProgress / 4) * 100);

  const smartSuggestions = useMemo(() => {
    const stream = selectedSubfield || activeRoadmap?.career || selectedInterest;
    const role = activeRoadmap?.career || "target role";
    const suggestions = [
      `Shortlist 3 ${stream} programs`,
      `Update profile target role to ${role}`,
      `Add 5 core ${stream} skills to profile`,
      `Compare tuition and visa requirements for top 2 countries`,
    ];
    const existing = new Set(checkItems.map((item) => item.text.trim().toLowerCase()));
    return suggestions.filter((item) => !existing.has(item.trim().toLowerCase()));
  }, [activeRoadmap?.career, checkItems, selectedInterest, selectedSubfield]);

  const milestoneStats = useMemo(() => {
    const groups = [
      {
        id: "profile",
        label: "Profile Ready",
        test: (value: string) => /profile|resume|cv|desired|target/i.test(value),
      },
      {
        id: "market",
        label: "Market Ready",
        test: (value: string) => /skill|country|compare|visa|program|tuition/i.test(value),
      },
      {
        id: "apply",
        label: "Application Ready",
        test: (value: string) => /job|apply|application|interview/i.test(value),
      },
    ];

    return groups.map((group) => {
      const tasks = checkItems.filter((item) => group.test(item.text));
      const total = tasks.length;
      const done = tasks.filter((item) => item.done).length;
      const pct = total === 0 ? 0 : Math.round((done / total) * 100);
      return { ...group, total, done, pct };
    });
  }, [checkItems]);

  const nextBestAction = useMemo(() => {
    const pending = checkItems.filter((item) => !item.done);
    if (!pending.length) {
      return null;
    }

    function scoreTask(item: CheckItem, index: number) {
      let score = 0;
      if (/profile|resume|cv/i.test(item.text)) score += 40;
      if (/skill/i.test(item.text)) score += 30;
      if (/country|visa|program|tuition/i.test(item.text)) score += 25;
      if (/job|apply|application|interview/i.test(item.text)) score += 20;
      if (item.priority === "high") score += 18;
      if (item.priority === "medium") score += 10;
      const dueUrgency = getDueMeta(item).urgency;
      if (dueUrgency === 0) score += 24;
      if (dueUrgency === 1) score += 16;
      score += Math.max(0, 20 - index * 2);
      return score;
    }

    return pending.reduce(
      (best, current, index) => {
        const currentScore = scoreTask(current, index);
        return currentScore > best.score ? { item: current, score: currentScore } : best;
      },
      { item: pending[0], score: scoreTask(pending[0], 0) },
    ).item;
  }, [checkItems]);

  const explainabilityReasons = useMemo(() => {
    if (!activeRoadmap) {
      return [] as string[];
    }
    const topCountries = activeRoadmap.topCountries.slice(0, 2).join(" and ");
    const firstRoles = activeRoadmap.entryRoles.slice(0, 2).join(" / ");
    return [
      `You selected ${selectedInterest}, and ${activeRoadmap.career} is one of the strongest mapped outcomes for that interest.`,
      `Entry roles like ${firstRoles || "beginner roles"} provide a realistic first step after graduation.`,
      `${topCountries || "Top destinations"} currently align with your selected path and salary band ${activeRoadmap.salaryRange}.`,
    ];
  }, [activeRoadmap, selectedInterest]);

  function buildScenarioScore(interest: string, roadmap: typeof activeRoadmap, subfield: string) {
    if (!roadmap) {
      return { total: 0, fit: 0, demand: 0, readiness: 0 };
    }
    const fit = Math.min(95, 62 + Math.max(1, interest.length % 6) * 5 + (subfield ? 8 : 0));
    const demand = Math.min(95, 58 + roadmap.topCountries.length * 8);
    const readiness = Math.min(95, 52 + roadmap.entryRoles.length * 9 + (subfield ? 7 : 0));
    const total = Math.round(fit * 0.35 + demand * 0.4 + readiness * 0.25);
    return { total, fit, demand, readiness };
  }

  const scenarioScoreA = buildScenarioScore(selectedInterest, activeRoadmap, selectedSubfield);
  const scenarioScoreB = buildScenarioScore(scenarioInterestB, scenarioActiveRoadmapB, scenarioSubfieldB);

  const comparisonWinner = scenarioScoreA.total === scenarioScoreB.total
    ? "Tie"
    : scenarioScoreA.total > scenarioScoreB.total
      ? "Scenario A"
      : "Scenario B";

  useEffect(() => {
    saveWizardState(selectedInterest, selectedCareer, selectedSubfield);
  }, [selectedInterest, selectedCareer, selectedSubfield]);

  useEffect(() => {
    if (!currentRoadmaps.length) {
      return;
    }
    if (selectedCareer && !currentRoadmaps.some((item) => item.career === selectedCareer)) {
      setSelectedCareer(currentRoadmaps[0]?.career ?? "");
    }
  }, [currentRoadmaps, selectedCareer]);

  useEffect(() => {
    if (!activeRoadmap) {
      return;
    }
    if (!selectedSubfield) {
      setSelectedSubfield(activeRoadmap.subfields[0] ?? "");
      return;
    }
    if (!activeRoadmap.subfields.includes(selectedSubfield)) {
      setSelectedSubfield(activeRoadmap.subfields[0] ?? "");
    }
  }, [activeRoadmap, selectedSubfield]);

  useEffect(() => {
    if (tabParam !== "students") {
      return;
    }

    const notes: string[] = [];
    if (qpInterest && matchedInterestFromQuery && qpInterest !== matchedInterestFromQuery) {
      notes.push(`interest adjusted to ${matchedInterestFromQuery}`);
    }
    if (qpInterest && !matchedInterestFromQuery) {
      notes.push("interest was unavailable");
    }

    if (qpCareer && activeRoadmap && !activeRoadmap.career.toLowerCase().includes(normalizeRoadmapToken(qpCareer))) {
      notes.push("career was unavailable");
    }

    if (qpSubfield && activeRoadmap && !activeRoadmap.subfields.some((item) => item.toLowerCase().includes(normalizeRoadmapToken(qpSubfield)))) {
      notes.push("subfield was unavailable");
    }

    if (notes.length > 0) {
      setDeepLinkNotice(`Saved link updated: ${notes.join(", ")}.`);
      return;
    }

    setDeepLinkNotice(null);
  }, [activeRoadmap, matchedInterestFromQuery, qpCareer, qpInterest, qpSubfield, tabParam]);

  useEffect(() => {
    if (!scenarioRoadmapsB.length) {
      return;
    }
    if (!scenarioCareerB) {
      setScenarioCareerB(scenarioRoadmapsB[0]?.career ?? "");
      return;
    }
    if (!scenarioRoadmapsB.some((item) => item.career === scenarioCareerB)) {
      setScenarioCareerB(scenarioRoadmapsB[0]?.career ?? "");
    }
  }, [scenarioCareerB, scenarioRoadmapsB]);

  useEffect(() => {
    if (!scenarioActiveRoadmapB) {
      return;
    }
    if (!scenarioSubfieldB) {
      setScenarioSubfieldB(scenarioActiveRoadmapB.subfields[0] ?? "");
      return;
    }
    if (!scenarioActiveRoadmapB.subfields.includes(scenarioSubfieldB)) {
      setScenarioSubfieldB(scenarioActiveRoadmapB.subfields[0] ?? "");
    }
  }, [scenarioActiveRoadmapB, scenarioSubfieldB]);

  useEffect(() => {
    if (countryInsights.length === 0) {
      setCompareCountryA("");
      setCompareCountryB("");
      return;
    }

    setCompareCountryA((current) => (current && countryInsights.some((item) => item.country === current) ? current : countryInsights[0]?.country ?? ""));
    setCompareCountryB((current) => {
      if (current && countryInsights.some((item) => item.country === current)) {
        return current;
      }
      return countryInsights[1]?.country ?? countryInsights[0]?.country ?? "";
    });
  }, [countryInsights]);

  useEffect(() => {
    if (tabParam !== "students" || !sectionParam) {
      return;
    }

    const sectionToElementId: Record<string, string> = {
      roadmap: "student-roadmap-wizard",
      "saved-goals": "student-saved-goals",
      "country-snapshot": "student-country-snapshot",
      "action-plan": "student-action-panel",
      "career-paths": "student-career-paths",
      advisor: "student-ai-advisor",
      pathway: "student-pathway",
      resources: "student-resources",
    };

    const elementId = sectionToElementId[sectionParam];
    if (!elementId) {
      return;
    }

    // Allow paint to settle before smooth scrolling to avoid layout jump.
    requestAnimationFrame(() => {
      document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [sectionParam, tabParam]);

  useEffect(() => {
    if (tabParam !== "students") {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set("tab", "students");
    next.set("section", sectionParam ?? "roadmap");
    if (selectedInterest) next.set("ri", selectedInterest); else next.delete("ri");
    if (selectedCareer) next.set("rc", selectedCareer); else next.delete("rc");
    if (selectedSubfield) next.set("rs", selectedSubfield); else next.delete("rs");

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, selectedCareer, selectedInterest, selectedSubfield, sectionParam, setSearchParams, tabParam]);

  function copyRoadmapLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "students");
    url.searchParams.set("section", "roadmap");
    if (selectedInterest) url.searchParams.set("ri", selectedInterest);
    if (selectedCareer) url.searchParams.set("rc", selectedCareer);
    if (selectedSubfield) url.searchParams.set("rs", selectedSubfield);

    void navigator.clipboard.writeText(url.toString()).then(() => {
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    });
  }

  function goToNextIntakeStep() {
    setIntakeStep((current) => Math.min(4, current + 1));
  }

  function goToPreviousIntakeStep() {
    setIntakeStep((current) => Math.max(1, current - 1));
  }

  function completeIntake() {
    setIntakeRecommendationError(null);
    setIntakeCompleted(true);
    setIntakeStep(1);
  }

  function resetIntake() {
    setIntakeCompleted(false);
    setIntakeStep(1);
    setIntakeDecisionMode("exploring");
    setIntakeTargetRole("");
    setIntakePrimaryInterest("");
    setIntakePrimaryField("");
    setIntakeBackgroundLevel("");
    setIntakeTimeline("");
    setIntakeSkillInput("");
    setIntakeRecommendation(null);
    setIntakeRecommendationError(null);
  }

  return (
    <div className="space-y-6">
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-700 via-fuchsia-700 to-indigo-700 text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-4 flex items-start gap-2">
            <Brain className="h-6 w-6 text-yellow-300" />
            <Badge className="border border-fuchsia-300/40 bg-fuchsia-500/20 text-fuchsia-100">{dashboard.hero.badge}</Badge>
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">{dashboard.hero.title}</h1>
          <p className="mb-6 text-base text-fuchsia-100/90 sm:text-lg">{dashboard.hero.description.replace("AI mentor", "smart guidance engine")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex w-full flex-1 items-center gap-2 rounded-lg border border-white/20 bg-white/95 px-4 py-3">
              <Search className="h-5 w-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchQueryChange(event.target.value)}
                placeholder={dashboard.hero.searchPlaceholder}
                className="h-auto border-0 p-0 text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button size="lg" onClick={onSearch} className="min-h-11 w-full bg-white text-purple-700 hover:bg-purple-50 sm:w-auto" disabled={searchLoading}>
              {searchLoading ? "Exploring..." : dashboard.hero.actionLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card id="student-intake" className="overflow-hidden border border-cyan-300/20 bg-cyan-500/10 shadow-xl ring-1 ring-cyan-300/20">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-cyan-300" />
              <CardTitle className="text-xl tracking-tight text-cyan-50">Personalization Setup</CardTitle>
            </div>
            <Badge className="border border-cyan-300/30 bg-cyan-500/15 text-cyan-100">
              {intakeCompleted ? "Profile Ready" : `Step ${intakeStep}/4`}
            </Badge>
          </div>
          <CardDescription className="text-cyan-100/80">
            We ask a few questions first, then tailor roadmap, career paths, and resources to your focus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!intakeCompleted && (
            <>
              {intakeStep === 1 && (
                <div className="space-y-3 rounded-xl border border-white/15 bg-white/[0.04] p-3">
                  <p className="text-sm font-semibold text-white">Do you already have a target role?</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setIntakeDecisionMode("determined")}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold ${intakeDecisionMode === "determined" ? "border-cyan-300/50 bg-cyan-500/20 text-cyan-100" : "border-white/15 bg-white/[0.03] text-slate-200"}`}
                    >
                      Yes, I am determined
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntakeDecisionMode("exploring")}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold ${intakeDecisionMode === "exploring" ? "border-cyan-300/50 bg-cyan-500/20 text-cyan-100" : "border-white/15 bg-white/[0.03] text-slate-200"}`}
                    >
                      Not sure yet, I am exploring
                    </button>
                  </div>
                </div>
              )}

              {intakeStep === 2 && (
                <div className="space-y-3 rounded-xl border border-white/15 bg-white/[0.04] p-3">
                  <p className="text-sm font-semibold text-white">Choose primary interest and field focus</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs uppercase tracking-[0.12em] text-slate-300">
                      Primary Interest
                      <select
                        value={intakePrimaryInterest}
                        onChange={(event) => setIntakePrimaryInterest(event.target.value)}
                        className="h-10 w-full rounded-lg border border-white/15 bg-slate-950/70 px-2 text-sm normal-case text-white"
                      >
                        <option value="">Select interest</option>
                        {intakeInterestOptions.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs uppercase tracking-[0.12em] text-slate-300">
                      Primary Field
                      <select
                        value={intakePrimaryField}
                        onChange={(event) => setIntakePrimaryField(event.target.value)}
                        className="h-10 w-full rounded-lg border border-white/15 bg-slate-950/70 px-2 text-sm normal-case text-white"
                      >
                        <option value="">Select field</option>
                        {intakeFieldOptions.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {intakeStep === 3 && (
                <div className="space-y-3 rounded-xl border border-white/15 bg-white/[0.04] p-3">
                  <p className="text-sm font-semibold text-white">Share your background and timeline</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs uppercase tracking-[0.12em] text-slate-300">
                      Background
                      <select
                        value={intakeBackgroundLevel}
                        onChange={(event) => setIntakeBackgroundLevel(event.target.value)}
                        className="h-10 w-full rounded-lg border border-white/15 bg-slate-950/70 px-2 text-sm normal-case text-white"
                      >
                        <option value="">Select background</option>
                        {intakeBackgroundOptions.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs uppercase tracking-[0.12em] text-slate-300">
                      Timeline
                      <select
                        value={intakeTimeline}
                        onChange={(event) => setIntakeTimeline(event.target.value)}
                        className="h-10 w-full rounded-lg border border-white/15 bg-slate-950/70 px-2 text-sm normal-case text-white"
                      >
                        <option value="">Select timeline</option>
                        {intakeTimelineOptions.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {intakeStep === 4 && (
                <div className="space-y-3 rounded-xl border border-white/15 bg-white/[0.04] p-3">
                  <p className="text-sm font-semibold text-white">Set target role and current skills</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs uppercase tracking-[0.12em] text-slate-300">
                      Target Role
                      <Input
                        value={intakeTargetRole}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setIntakeTargetRole(event.target.value)}
                        placeholder="Software Engineer"
                        className="h-10 border-white/15 bg-slate-950/70 text-white"
                      />
                    </label>
                    <label className="space-y-1 text-xs uppercase tracking-[0.12em] text-slate-300">
                      Current Skills
                      <Input
                        value={intakeSkillInput}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setIntakeSkillInput(event.target.value)}
                        placeholder="React, Java, SQL"
                        className="h-10 border-white/15 bg-slate-950/70 text-white"
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={goToPreviousIntakeStep} disabled={intakeStep === 1}>Back</Button>
                {intakeStep < 4 ? (
                  <Button type="button" onClick={goToNextIntakeStep}>Next</Button>
                ) : (
                  <Button
                    type="button"
                    onClick={completeIntake}
                    disabled={!intakePrimaryInterest || !intakePrimaryField || (intakeDecisionMode === "determined" && !intakeTargetRole.trim())}
                  >
                    Complete Setup
                  </Button>
                )}
              </div>
            </>
          )}

          {intakeCompleted && (
            <div className="space-y-3 rounded-xl border border-emerald-300/25 bg-emerald-500/10 p-3 text-emerald-100">
              <p className="text-sm font-semibold">Personalization is active.</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-emerald-300/30 bg-emerald-500/20 px-2 py-1">Mode: {intakeDecisionMode === "determined" ? "Determined" : "Exploring"}</span>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-500/20 px-2 py-1">Interest: {intakePrimaryInterest || "Not set"}</span>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-500/20 px-2 py-1">Field: {intakePrimaryField || "Not set"}</span>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-500/20 px-2 py-1">Role: {intakeTargetRole || "Exploring"}</span>
              </div>

              {intakeRecommendationLoading && (
                <p className="text-xs text-emerald-200">Generating personalized recommendations...</p>
              )}

              {intakeRecommendationError && (
                <p className="rounded-lg border border-amber-300/30 bg-amber-500/15 px-2 py-1 text-xs text-amber-100">{intakeRecommendationError}</p>
              )}

              {intakeRecommendation && (
                <div className="space-y-3 rounded-xl border border-emerald-300/25 bg-emerald-900/30 p-3">
                  <p className="text-sm font-semibold text-white">AI Recommendation</p>
                  <p className="text-xs text-emerald-100/90">{intakeRecommendation.summary}</p>
                  <div className="grid gap-2 text-xs sm:grid-cols-3">
                    <div className="rounded-lg border border-emerald-300/20 bg-emerald-500/10 p-2">
                      <p className="font-semibold text-emerald-100">Roles</p>
                      {intakeRecommendation.recommendedRoles.slice(0, 3).map((role) => {
                        const confidenceScore = Math.round(roleConfidenceScores[role] ?? 70);
                        const confidenceStyle = getConfidenceBadgeClasses(confidenceScore);

                        return (
                          <div key={role} className="mt-2 rounded-md border border-emerald-300/20 bg-emerald-950/40 p-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-emerald-50/95">• {role}</p>
                              <div className="flex items-center gap-1">
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${confidenceStyle}`}>
                                  {confidenceScore}% match
                                </span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100/85 transition hover:bg-emerald-500/20"
                                      aria-label={`How confidence is estimated for ${role}`}
                                    >
                                      <CircleHelp className="h-3 w-3" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8} className="max-w-[240px] bg-slate-900 text-slate-100">
                                    <p className="font-semibold text-slate-100">Confidence factors</p>
                                    <div className="mt-1 space-y-1 text-[11px] text-slate-200">
                                      {(roleConfidenceFactors[role] ?? ["Estimated from your intake profile fit and role alignment"]).map((factor) => (
                                        <p key={`${role}-factor-${factor}`}>- {factor}</p>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {(roleRecommendationReasons[role] ?? []).map((reason) => (
                                <span key={`${role}-${reason}`} className="rounded-full border border-emerald-300/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-100/90">
                                  Why: {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="rounded-lg border border-emerald-300/20 bg-emerald-500/10 p-2">
                      <p className="font-semibold text-emerald-100">Focus Areas</p>
                      {intakeRecommendation.focusAreas.slice(0, 3).map((focus) => (
                        <p key={focus} className="mt-1 text-emerald-50/90">• {focus}</p>
                      ))}
                    </div>
                    <div className="rounded-lg border border-emerald-300/20 bg-emerald-500/10 p-2">
                      <p className="font-semibold text-emerald-100">Next Steps</p>
                      {intakeRecommendation.nextSteps.slice(0, 3).map((step) => (
                        <p key={step} className="mt-1 text-emerald-50/90">• {step}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIntakeCompleted(false)}>Edit Answers</Button>
                <Button type="button" variant="destructive" onClick={resetIntake}>Reset</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {(activeSection === "roadmap" || activeSection === "saved-goals") && (
      <Card id="student-roadmap-wizard" className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-fuchsia-400" />
            <CardTitle className="text-xl tracking-tight text-white">Career Roadmap Wizard</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Interest → Career → Subfield → Country decision flow with colleges and salary outlook.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {intakeCompleted && (
            <div className={`rounded-xl border px-3 py-2 text-xs ${intakeDecisionMode === "determined" ? "border-cyan-300/25 bg-cyan-500/10 text-cyan-100" : "border-violet-300/25 bg-violet-500/10 text-violet-100"}`}>
              {intakeDecisionMode === "determined"
                ? `Focused mode: prioritizing ${intakeTargetRole || "your chosen role"} with ${intakePrimaryField || "selected field"} recommendations.`
                : `Exploration mode: showing broader pathways from ${intakePrimaryInterest || "your selected interest"} with guided comparisons.`}
            </div>
          )}

          {deepLinkNotice && (
            <div className="rounded-xl border border-amber-300/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              {deepLinkNotice}
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            <span>Progress: {wizardProgress}/4 steps completed</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]">
                <Sparkles className="h-3 w-3" />
                {progressPct}% ready
              </span>
              <button
                type="button"
                onClick={copyRoadmapLink}
                className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-100 hover:bg-cyan-500/30"
              >
                <Link2 className="h-3 w-3" />
                {shareCopied ? "Copied" : "Share"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-200">Step 1: Choose your interest</p>
            <div className="flex flex-wrap gap-2">
              {dashboard.advisor.interests.map((interest) => (
                <button
                  type="button"
                  key={interest}
                  onClick={() => {
                    setSelectedInterest(interest);
                    setSelectedCareer("");
                    setSelectedSubfield("");
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selectedInterest === interest
                      ? "border-fuchsia-300/60 bg-fuchsia-500/30 text-fuchsia-100"
                      : "border-white/15 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-200">Step 2: Pick a target career</p>
            <div className="flex flex-wrap gap-2">
              {currentRoadmaps.map((item) => (
                <button
                  type="button"
                  key={item.career}
                  onClick={() => {
                    setSelectedCareer(item.career);
                    setSelectedSubfield(item.subfields[0] ?? "");
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    (selectedCareer || activeRoadmap?.career) === item.career
                      ? "border-cyan-300/60 bg-cyan-500/25 text-cyan-100"
                      : "border-white/15 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                  }`}
                >
                  {item.career}
                </button>
              ))}
            </div>
          </div>

          {activeRoadmap && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-200">Step 3: Narrow by subfield</p>
                <div className="flex flex-wrap gap-2">
                  {activeRoadmap.subfields.map((subfield) => (
                    <button
                      type="button"
                      key={subfield}
                      onClick={() => setSelectedSubfield(subfield)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        selectedSubfield === subfield
                          ? "border-amber-300/60 bg-amber-500/25 text-amber-100"
                          : "border-white/15 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                      }`}
                    >
                      {subfield}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200/80">Top 10 Colleges in India</p>
                  <ul className="space-y-1 text-sm text-slate-200">
                    {(showAllIndiaColleges ? activeRoadmap.collegesIndia : activeRoadmap.collegesIndia.slice(0, 5)).map((college) => (
                      <li key={college}>- {college}</li>
                    ))}
                  </ul>
                  {activeRoadmap.collegesIndia.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllIndiaColleges((current) => !current)}
                      className="mt-2 text-xs font-semibold text-cyan-200 hover:text-cyan-100"
                    >
                      {showAllIndiaColleges ? "Show less" : "Show full top-10"}
                    </button>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-200/80">Top 10 Global Colleges</p>
                  <ul className="space-y-1 text-sm text-slate-200">
                    {(showAllGlobalColleges ? activeRoadmap.collegesGlobal : activeRoadmap.collegesGlobal.slice(0, 5)).map((college) => (
                      <li key={college}>- {college}</li>
                    ))}
                  </ul>
                  {activeRoadmap.collegesGlobal.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllGlobalColleges((current) => !current)}
                      className="mt-2 text-xs font-semibold text-fuchsia-200 hover:text-fuchsia-100"
                    >
                      {showAllGlobalColleges ? "Show less" : "Show full top-10"}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/80">Expected Salary Range</p>
                  <p className="text-lg font-bold text-emerald-100">{activeRoadmap.salaryRange}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-200/80">Suggested Entry Roles</p>
                  <p className="text-sm text-slate-200">{activeRoadmap.entryRoles.join(" • ")}</p>
                </div>
              </div>

              <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Why this recommendation</p>
                <ul className="space-y-1.5 text-sm text-cyan-50/90">
                  {explainabilityReasons.map((reason) => (
                    <li key={reason}>- {reason}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-200">Scenario Compare</p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Scenario A (Current)</p>
                    <p className="text-sm font-semibold text-white">{selectedInterest} → {activeRoadmap.career}{selectedSubfield ? ` / ${selectedSubfield}` : ""}</p>
                    <div className="space-y-1 text-xs text-slate-300">
                      <p>Fit: {scenarioScoreA.fit}%</p>
                      <p>Demand: {scenarioScoreA.demand}%</p>
                      <p>Readiness: {scenarioScoreA.readiness}%</p>
                    </div>
                    <p className="text-lg font-bold text-fuchsia-100">Total: {scenarioScoreA.total}</p>
                  </div>

                  <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Scenario B</p>
                    <div className="grid gap-2 md:grid-cols-3">
                      <select
                        value={scenarioInterestB}
                        onChange={(event) => setScenarioInterestB(event.target.value)}
                        className="rounded-lg border border-white/15 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none"
                      >
                        {dashboard.advisor.interests.map((interest) => (
                          <option key={`sb-i-${interest}`} value={interest}>{interest}</option>
                        ))}
                      </select>
                      <select
                        value={scenarioCareerB}
                        onChange={(event) => setScenarioCareerB(event.target.value)}
                        className="rounded-lg border border-white/15 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none"
                      >
                        {scenarioRoadmapsB.map((item) => (
                          <option key={`sb-c-${item.career}`} value={item.career}>{item.career}</option>
                        ))}
                      </select>
                      <select
                        value={scenarioSubfieldB}
                        onChange={(event) => setScenarioSubfieldB(event.target.value)}
                        className="rounded-lg border border-white/15 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none"
                      >
                        {(scenarioActiveRoadmapB?.subfields ?? []).map((subfield) => (
                          <option key={`sb-s-${subfield}`} value={subfield}>{subfield}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 text-xs text-slate-300">
                      <p>Fit: {scenarioScoreB.fit}%</p>
                      <p>Demand: {scenarioScoreB.demand}%</p>
                      <p>Readiness: {scenarioScoreB.readiness}%</p>
                    </div>
                    <p className="text-lg font-bold text-fuchsia-100">Total: {scenarioScoreB.total}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-200">Best current signal: {comparisonWinner}</p>
              </div>
            </>
          )}

          {/* ── Saved Goals CRUD ── */}
          <div id="student-saved-goals" className="rounded-2xl border border-violet-300/20 bg-violet-500/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-violet-100"><Save className="h-4 w-4" /> Saved Goals ({savedGoals.length})</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200/80">Sorted by favorite and recent use</p>
            </div>
            <div className="mb-3 flex gap-2">
              <input
                value={newGoalLabel}
                onChange={(e) => setNewGoalLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createGoal()}
                placeholder={`Label (e.g. "${selectedInterest} plan")…`}
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
              />
              <button
                type="button"
                onClick={createGoal}
                className="flex items-center gap-1 rounded-lg border border-violet-300/30 bg-violet-500/25 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/40"
              >
                <Plus className="h-3.5 w-3.5" /> Save
              </button>
            </div>
            {savedGoals.length === 0 && (
              <div className="rounded-xl border border-violet-300/25 bg-violet-500/15 p-4 text-sm text-violet-100">
                <p className="font-semibold">No saved goals yet</p>
                <p className="mt-1 text-xs text-violet-100/85">Create your first goal from the current roadmap selection so you can reopen and compare it later.</p>
                <button
                  type="button"
                  onClick={() => createGoal("My first goal")}
                  className="mt-3 inline-flex items-center gap-1 rounded-lg border border-violet-300/30 bg-violet-500/25 px-3 py-1.5 text-xs font-semibold text-violet-100 hover:bg-violet-500/40"
                >
                  <Plus className="h-3.5 w-3.5" /> Create first goal
                </button>
              </div>
            )}
            <div className="space-y-2">
              {sortedSavedGoals.map((goal) => (
                <div key={goal.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  {editingGoalId === goal.id ? (
                    <>
                      <input
                        value={editingGoalLabel}
                        onChange={(e) => setEditingGoalLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEditGoal(goal.id); if (e.key === "Escape") setEditingGoalId(null); }}
                        className="min-w-0 flex-1 rounded border border-white/15 bg-slate-900 px-2 py-1 text-xs text-white outline-none"
                        autoFocus
                      />
                      <button type="button" onClick={() => saveEditGoal(goal.id)} className="text-emerald-300 hover:text-emerald-100"><CheckCircle2 className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setEditingGoalId(null)} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => applyGoal(goal)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-xs font-semibold text-white">{goal.label}</p>
                        <p className="truncate text-[11px] text-slate-400">{goal.interest} → {goal.career}{goal.subfield ? ` / ${goal.subfield}` : ""}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-500">Last used {new Date(goal.lastUsedAt).toLocaleDateString()}</p>
                      </button>
                      <button type="button" onClick={() => toggleFavoriteGoal(goal.id)} className={`${goal.favorite ? "text-amber-300" : "text-slate-500 hover:text-amber-300"}`}>
                        <Star className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => startEditGoal(goal)} className="text-slate-500 hover:text-violet-300"><Pencil className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => deleteGoal(goal.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {activeSection === "country-snapshot" && (
      <Card id="student-country-snapshot" className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-fuchsia-400" />
            <CardTitle className="text-xl tracking-tight text-white">India vs Global Opportunity Snapshot</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Compare demand, salary, and visa effort before finalizing your study and career path.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-3">
            <div className="mb-2 flex items-center gap-2 text-cyan-100">
              <ArrowRightLeft className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">Quick Compare</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={compareCountryA}
                onChange={(event) => setCompareCountryA(event.target.value)}
                className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0"
              >
                {countryInsights.map((item) => (
                  <option key={`a-${item.country}`} value={item.country}>
                    {item.country}
                  </option>
                ))}
              </select>
              <select
                value={compareCountryB}
                onChange={(event) => setCompareCountryB(event.target.value)}
                className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0"
              >
                {countryInsights.map((item) => (
                  <option key={`b-${item.country}`} value={item.country}>
                    {item.country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-100">Decision Weights</p>
            <div className="grid gap-3 md:grid-cols-2">
              {([
                { key: "demand", label: "Demand" },
                { key: "salary", label: "Salary" },
                { key: "visa", label: "Visa Ease" },
                { key: "affordability", label: "Affordability" },
              ] as const).map((item) => (
                <label key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-fuchsia-100/90">
                    <span>{item.label}</span>
                    <span>{countryWeights[item.key]}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={countryWeights[item.key]}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setCountryWeights((previous) => ({ ...previous, [item.key]: value }));
                    }}
                    className="w-full accent-fuchsia-400"
                  />
                </label>
              ))}
            </div>
            {topCountryByWeightedScore && (
              <p className="mt-2 text-xs text-fuchsia-100/90">
                Top match with current weighting: <span className="font-semibold">{topCountryByWeightedScore.country}</span> ({topCountryByWeightedScore.weightedScore} pts)
              </p>
            )}
          </div>

          {watchlist.length > 0 && (
            <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-amber-200"><Star className="h-3.5 w-3.5" /> Watchlist ({watchlist.length})</p>
              <div className="flex flex-wrap gap-2">
                {watchlist.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-100">
                    {c}
                    <button type="button" onClick={() => toggleWatchlist(c)} className="ml-0.5 text-amber-300/60 hover:text-red-400"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {countryInsights.map((item) => {
              const pinned = watchlist.includes(item.country);
              return (
                <div key={item.country} className={`group rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5 ${
                  pinned ? "border-amber-300/40 bg-amber-500/10" : "border-white/10 bg-white/[0.03] hover:border-cyan-300/25"
                }`}>
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-white">{item.country}</p>
                    <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-100">
                      {item.weightedScore} pts
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-slate-300">Demand</p>
                    <button
                      type="button"
                      onClick={() => toggleWatchlist(item.country)}
                      title={pinned ? "Unpin" : "Pin to watchlist"}
                      className={`transition-colors ${ pinned ? "text-amber-300" : "text-slate-600 hover:text-amber-300" }`}
                    >
                      {pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-slate-300">
                      <span>Demand</span>
                      <span>{item.demandPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800/90">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all" style={{ width: `${item.demandPct}%` }} />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">Avg Package: {item.avgPackage}</p>
                  <p className="mt-1 text-xs text-slate-300">Visa Ease: {item.visaEase}</p>
                  <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] p-2 text-[11px] text-slate-300">
                    <p>Tuition: {item.budget.tuition}</p>
                    <p>Living: {item.budget.living}</p>
                    <p>Total: {item.budget.total}</p>
                    <p className="mt-1 font-semibold text-emerald-200">{item.budget.affordabilityLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {(compareCardA && compareCardB) && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Head-to-Head</p>
              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
                <div className="space-y-3">
                  <p className="text-sm font-bold text-white">{compareCardA.country}</p>
                  {[
                    { label: "Demand", pct: compareCardA.demandPct, color: "from-cyan-400 to-emerald-400" },
                    { label: "Salary", pct: compareCardA.salaryPct, color: "from-violet-400 to-fuchsia-400" },
                    { label: "Visa", pct: compareCardA.visaPct, color: "from-amber-400 to-orange-400" },
                    { label: "Afford", pct: compareCardA.budget.affordabilityPct, color: "from-emerald-400 to-lime-400" },
                  ].map((metric) => (
                    <div key={metric.label}>
                      <div className="mb-1 flex justify-between text-[11px] text-slate-400"><span>{metric.label}</span><span>{metric.pct}%</span></div>
                      <div className="h-1.5 rounded-full bg-slate-800"><div className={`h-1.5 rounded-full bg-gradient-to-r ${metric.color}`} style={{ width: `${metric.pct}%` }} /></div>
                    </div>
                  ))}
                  <p className="text-xs text-slate-400">Avg: {compareCardA.avgPackage}</p>
                  <p className="text-xs text-slate-400">Cost: {compareCardA.budget.total}</p>
                </div>
                <div className="flex flex-col items-center gap-1 pt-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.05]">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">vs</span>
                </div>
                <div className="space-y-3">
                  <p className="text-right text-sm font-bold text-white">{compareCardB.country}</p>
                  {[
                    { label: "Demand", pct: compareCardB.demandPct, color: "from-cyan-400 to-emerald-400" },
                    { label: "Salary", pct: compareCardB.salaryPct, color: "from-violet-400 to-fuchsia-400" },
                    { label: "Visa", pct: compareCardB.visaPct, color: "from-amber-400 to-orange-400" },
                    { label: "Afford", pct: compareCardB.budget.affordabilityPct, color: "from-emerald-400 to-lime-400" },
                  ].map((metric) => (
                    <div key={metric.label}>
                      <div className="mb-1 flex justify-between text-[11px] text-slate-400"><span>{metric.pct}%</span><span>{metric.label}</span></div>
                      <div className="h-1.5 rounded-full bg-slate-800"><div className={`ml-auto h-1.5 rounded-full bg-gradient-to-r ${metric.color}`} style={{ width: `${metric.pct}%` }} /></div>
                    </div>
                  ))}
                  <p className="text-right text-xs text-slate-400">Avg: {compareCardB.avgPackage}</p>
                  <p className="text-right text-xs text-slate-400">Cost: {compareCardB.budget.total}</p>
                </div>
              </div>
            </div>
          )}

          {(compareCardA && compareCardB) && (
            <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">Next Step Actions</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => createGoal(`Country compare: ${compareCardA.country} vs ${compareCardB.country}`)}
                  className="rounded-lg border border-violet-300/30 bg-violet-500/20 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/35"
                >
                  Save Comparison
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("student-action-panel")?.scrollIntoView({ behavior: "smooth" })}
                  className="rounded-lg border border-cyan-300/30 bg-cyan-500/20 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/35"
                >
                  Add to Action Plan
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="rounded-lg border border-amber-300/30 bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/35"
                >
                  Set Target Country
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/find-jobs")}
                  className="rounded-lg border border-emerald-300/30 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/35"
                >
                  Explore Matching Jobs
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {activeSection === "action-plan" && (
      <Card id="student-action-panel" className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-xl tracking-tight text-white">Your Next Action Plan</CardTitle>
            </div>
            <span className="text-xs text-slate-500">{checkItems.filter((t) => t.done).length}/{checkItems.length} done</span>
          </div>
          <CardDescription className="text-slate-400">Track your moves from exploring to ready.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">View</p>
            <div className="inline-flex rounded-lg border border-white/10 bg-slate-900/60 p-0.5">
              <button
                type="button"
                onClick={() => setActionView("list")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  actionView === "list" ? "bg-cyan-500/25 text-cyan-100" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setActionView("week")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  actionView === "week" ? "bg-cyan-500/25 text-cyan-100" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Week Board
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-rose-300/20 bg-rose-500/10 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-rose-200">Overdue</p>
                <p className="text-sm font-bold text-rose-100">{reminderStats.overdue}</p>
              </div>
              <div className="rounded-lg border border-amber-300/20 bg-amber-500/10 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-amber-200">Due Soon</p>
                <p className="text-sm font-bold text-amber-100">{reminderStats.dueSoon}</p>
              </div>
              <div className="rounded-lg border border-cyan-300/20 bg-cyan-500/10 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-cyan-200">This Week</p>
                <p className="text-sm font-bold text-cyan-100">{reminderStats.dueThisWeek}</p>
              </div>
              <div className="rounded-lg border border-fuchsia-300/20 bg-fuchsia-500/10 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-fuchsia-200">High Priority</p>
                <p className="text-sm font-bold text-fuchsia-100">{reminderStats.highPriority}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                { key: "all", label: "All" },
                { key: "overdue", label: "Overdue" },
                { key: "week", label: "This week" },
                { key: "high", label: "High" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActionFilter(filter.key as "all" | "overdue" | "week" | "high")}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                    actionFilter === filter.key
                      ? "border-cyan-300/35 bg-cyan-500/20 text-cyan-100"
                      : "border-white/15 bg-white/[0.04] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {nextBestAction && (
            <div className="rounded-xl border border-emerald-300/25 bg-emerald-500/10 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">Next Best Action</p>
              <p className="mt-1 text-sm font-semibold text-emerald-50">{nextBestAction.text}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleTask(nextBestAction.id)}
                  className="rounded-lg border border-emerald-300/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/35"
                >
                  Mark as done
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="rounded-lg border border-cyan-300/30 bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/35"
                >
                  Go to Profile
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">Milestones</p>
            <div className="space-y-2">
              {milestoneStats.map((milestone) => (
                <div key={milestone.id}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>{milestone.label}</span>
                    <span>{milestone.done}/{milestone.total || 0}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800/90">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-300" style={{ width: `${milestone.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {smartSuggestions.length > 0 && (
            <div className="rounded-xl border border-cyan-300/25 bg-cyan-500/10 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100">Smart Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {smartSuggestions.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => addSuggestedTask(item)}
                    className="rounded-full border border-cyan-300/30 bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/35"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {actionView === "list" ? (
            <div className="space-y-2">
              {filteredListItems.map((task) => {
                const dueMeta = getDueMeta(task);
                const isEditing = editingTaskId === task.id;
                return (
              <div
                key={task.id}
                className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-150 ${
                  task.done ? "border-emerald-300/20 bg-emerald-500/5" : "border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                <button type="button" onClick={() => toggleTask(task.id)} className="flex-shrink-0" disabled={isEditing}>
                  {task.done
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    : <Circle className="h-5 w-5 text-slate-600 group-hover:text-slate-400" />}
                </button>
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <input
                        value={editTaskText}
                        onChange={(event) => setEditTaskText(event.target.value)}
                        className="rounded-lg border border-white/15 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-100 outline-none sm:col-span-2"
                      />
                      <select
                        value={editTaskPriority}
                        onChange={(event) => setEditTaskPriority(event.target.value as TaskPriority)}
                        className="rounded-lg border border-white/15 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <input
                        type="date"
                        value={editTaskDueDate}
                        onChange={(event) => {
                          setEditTaskDueDate(event.target.value);
                          if (!editTaskPlanDay) {
                            setEditTaskPlanDay(derivePlanDay(event.target.value));
                          }
                        }}
                        className="rounded-lg border border-white/15 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                      />
                      <select
                        value={editTaskPlanDay}
                        onChange={(event) => setEditTaskPlanDay(event.target.value as PlanDay | "")}
                        className="rounded-lg border border-white/15 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                      >
                        <option value="">Auto day</option>
                        {WEEK_DAYS.map((day) => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className={`text-sm ${ task.done ? "text-slate-500 line-through" : "text-slate-100" }`}>{task.text}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      (isEditing ? editTaskPriority : task.priority) === "high"
                        ? "border-rose-300/30 bg-rose-500/20 text-rose-100"
                        : (isEditing ? editTaskPriority : task.priority) === "medium"
                          ? "border-amber-300/30 bg-amber-500/20 text-amber-100"
                          : "border-emerald-300/25 bg-emerald-500/20 text-emerald-100"
                    }`}
                    >
                      {isEditing ? editTaskPriority : task.priority}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${dueMeta.tone}`}>
                      {dueMeta.label}
                    </span>
                    {(isEditing ? editTaskDueDate : task.dueDate) && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <CalendarDays className="h-3 w-3" />
                        {isEditing ? editTaskDueDate : task.dueDate}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {isEditing ? (
                    <>
                      <button type="button" onClick={() => saveEditTask(task.id)} className="rounded-md border border-emerald-300/25 bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-100 hover:bg-emerald-500/30">
                        Save
                      </button>
                      <button type="button" onClick={cancelEditTask} className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-slate-300 hover:text-white">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => startEditTask(task)} className="text-slate-600 opacity-0 transition-opacity hover:text-cyan-300 group-hover:opacity-100" title="Edit task">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => deleteTask(task.id)} className="text-slate-700 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
                );
              })}
              {filteredListItems.length === 0 && (
                <p className="text-xs text-slate-500">No tasks in this filter.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto pb-1">
              <div className="grid min-w-[920px] grid-cols-7 gap-2">
                {weekBoard.map((column) => (
                  <div key={column.day} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">{column.day}</p>
                      <span className="text-[10px] text-slate-500">{column.tasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {column.tasks.length === 0 && (
                        <p className="text-[11px] text-slate-500">No tasks</p>
                      )}
                      {column.tasks.map((task) => {
                        const dueMeta = getDueMeta(task);
                        return (
                          <button
                            type="button"
                            key={task.id}
                            onClick={() => toggleTask(task.id)}
                            className={`w-full rounded-lg border p-2 text-left transition-colors ${
                              task.done
                                ? "border-emerald-300/25 bg-emerald-500/10"
                                : "border-white/10 bg-slate-900/60 hover:border-cyan-300/30"
                            }`}
                          >
                            <p className={`text-xs ${task.done ? "text-slate-400 line-through" : "text-slate-100"}`}>{task.text}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                                task.priority === "high"
                                  ? "border-rose-300/30 bg-rose-500/20 text-rose-100"
                                  : task.priority === "medium"
                                    ? "border-amber-300/30 bg-amber-500/20 text-amber-100"
                                    : "border-emerald-300/25 bg-emerald-500/20 text-emerald-100"
                              }`}
                              >
                                {task.priority}
                              </span>
                              <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${dueMeta.tone}`}>
                                {dueMeta.label}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2 pt-1 sm:grid-cols-2 lg:grid-cols-4">
            <input
              ref={checkInputRef}
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a custom task…"
              className="min-w-0 rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none sm:col-span-2"
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
              className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 outline-none"
            >
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => {
                setNewTaskDueDate(e.target.value);
                if (!newTaskPlanDay) {
                  setNewTaskPlanDay(derivePlanDay(e.target.value));
                }
              }}
              className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 outline-none"
            />
            <select
              value={newTaskPlanDay}
              onChange={(e) => setNewTaskPlanDay(e.target.value as PlanDay | "")}
              className="rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 outline-none"
            >
              <option value="">Auto day</option>
              {WEEK_DAYS.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addTask}
              className="flex items-center justify-center gap-1 rounded-xl border border-amber-300/30 bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/35 sm:col-span-2 lg:col-span-4"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>

          {orderedCheckItems.some((task) => getDueMeta(task).urgency === 0 && !task.done) && (
            <div className="rounded-xl border border-rose-300/20 bg-rose-500/10 p-2.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-100">
                <AlertTriangle className="h-3.5 w-3.5" />
                You have overdue tasks. Prioritize these before adding new goals.
              </p>
            </div>
          )}

          {checkItems.some((t) => t.done) && (
            <button
              type="button"
              onClick={() => { const next = checkItems.filter((t) => !t.done); setCheckItems(next); persistChecklist(next); }}
              className="text-xs text-slate-600 hover:text-red-400"
            >
              Clear completed
            </button>
          )}
        </CardContent>
      </Card>
      )}

      {activeSection === "career-paths" && (
      <Card id="student-career-paths" className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-fuchsia-400" />
              <CardTitle className="text-xl tracking-tight text-white">{dashboard.careers.title}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={careerSortBy}
                onChange={(event) => setCareerSortBy(event.target.value as "fit" | "salary" | "duration")}
                className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 outline-none"
              >
                <option value="fit">Sort: Best fit</option>
                <option value="salary">Sort: Salary</option>
                <option value="duration">Sort: Duration</option>
              </select>
              <select
                value={careerDurationFilter}
                onChange={(event) => setCareerDurationFilter(event.target.value as "all" | "short" | "mid" | "long")}
                className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 outline-none"
              >
                <option value="all">Duration: All</option>
                <option value="short">Duration: up to 2y</option>
                <option value="mid">Duration: 2-4y</option>
                <option value="long">Duration: 4y+</option>
              </select>
              <button
                type="button"
                onClick={() => setShowOnlyBookmarked((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  showOnlyBookmarked
                    ? "border-amber-300/40 bg-amber-500/20 text-amber-100"
                    : "border-white/15 bg-white/[0.04] text-slate-400 hover:border-amber-300/30 hover:text-amber-200"
                }`}
              >
                <Bookmark className="h-3.5 w-3.5" />
                {showOnlyBookmarked ? "All" : `Saved (${bookmarks.length})`}
              </button>
            </div>
          </div>
          <CardDescription className="text-slate-400">{dashboard.careers.description}</CardDescription>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
              skillSignalSource === "profile"
                ? "border-emerald-300/30 bg-emerald-500/20 text-emerald-100"
                : "border-amber-300/30 bg-amber-500/20 text-amber-100"
            }`}>
              Skill Source: {skillSignalSource === "profile" ? "Profile" : "Inferred"}
            </span>
            <span className="rounded-full border border-cyan-300/25 bg-cyan-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
              {learnerSkillSignals.length} signal{learnerSkillSignals.length === 1 ? "" : "s"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {compareCareers.length === 2 && (
            <div className="mb-4 rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100">Career Compare</p>
                <button
                  type="button"
                  onClick={() => setCareerCompare([])}
                  className="rounded-full border border-cyan-300/25 bg-cyan-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-cyan-100 hover:bg-cyan-500/30"
                >
                  Clear
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {compareCareers.map((career) => (
                  <div key={career.title} className="rounded-lg border border-white/10 bg-slate-900/60 p-2.5">
                    <p className="text-sm font-semibold text-white">{career.title}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-100">Fit {career.fitScore}%</span>
                      <span className="rounded-full border border-cyan-300/30 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">{career.learningPace}</span>
                      <span className="rounded-full border border-emerald-300/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">Demand {career.demandSignal}</span>
                      <span className="rounded-full border border-amber-300/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-100">Gap {career.missingSkills.length}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">Salary: {career.salary}</p>
                    <p className="mt-1 text-xs text-slate-400">Prep Duration: {career.duration}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => createGoal(`Career compare: ${compareCareers[0]?.title} vs ${compareCareers[1]?.title}`)}
                  className="rounded-lg border border-violet-300/30 bg-violet-500/20 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/35"
                >
                  Save Compare Goal
                </button>
                <button
                  type="button"
                  onClick={() => addSuggestedTask(`Pick one: ${compareCareers[0]?.title} or ${compareCareers[1]?.title}`)}
                  className="rounded-lg border border-amber-300/30 bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/35"
                >
                  Add Decision Task
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {(() => {
              if (visibleCareerInsights.length === 0) return <p className="text-sm text-slate-400">{showOnlyBookmarked ? "No bookmarked careers yet." : "No career paths matched your filters."}</p>;
              return visibleCareerInsights.map((career, index) => (
                <div key={career.title} className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-fuchsia-300/20 hover:bg-white/[.06] hover:shadow-xl">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400/30 to-pink-400/30 text-3xl">{career.icon}</div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200">
                        <TrendingUp className="h-3 w-3" /> #{index + 1} pick
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(career.title)}
                        title={bookmarks.includes(career.title) ? "Remove bookmark" : "Bookmark"}
                        className={`transition-colors ${ bookmarks.includes(career.title) ? "text-amber-300" : "text-slate-600 hover:text-amber-300" }`}
                      >
                        {bookmarks.includes(career.title) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCareerCompare(career.title)}
                        title={careerCompare.includes(career.title) ? "Remove from compare" : "Add to compare"}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                          careerCompare.includes(career.title)
                            ? "border-cyan-300/35 bg-cyan-500/20 text-cyan-100"
                            : "border-white/15 bg-white/[0.04] text-slate-400 hover:text-cyan-200"
                        }`}
                      >
                        Compare
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{career.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-200">
                        <DollarSign className="h-3 w-3" /> {career.salary}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-300/20 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-200">
                        <GraduationCap className="h-3 w-3" /> {career.duration}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-300/20 bg-fuchsia-500/10 px-2 py-0.5 text-[11px] text-fuchsia-100">
                        <Sparkles className="h-3 w-3" /> Fit {career.fitScore}%
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-100">
                        <TrendingUp className="h-3 w-3" /> {career.demandSignal} demand
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Pace: {career.learningPace}</p>
                    <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/60 p-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Skill Gap Lens</p>
                      {career.matchedSkills.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {career.matchedSkills.slice(0, 2).map((skill) => (
                            <span key={`${career.title}-match-${skill}`} className="rounded-full border border-emerald-300/25 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-100">
                              Matched: {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {career.missingSkills.slice(0, 3).map((skill) => (
                          <span key={`${career.title}-missing-${skill}`} className="rounded-full border border-amber-300/25 bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-100">
                            Learn: {skill}
                          </span>
                        ))}
                      </div>
                      {career.recommendedResources.length > 0 && (
                        <div className="mt-2 rounded-lg border border-cyan-300/15 bg-cyan-500/10 p-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">Recommended Resources</p>
                          <div className="mt-1 space-y-1">
                            {career.recommendedResources.slice(0, 2).map((resource) => (
                              <div key={`${career.title}-resource-${resource.title}`} className="flex items-center justify-between gap-2 rounded border border-white/10 bg-white/[0.03] px-2 py-1">
                                <span className="truncate text-[11px] text-slate-200">{resource.title}</span>
                                {resource.duration && (
                                  <span className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-300">
                                    {resource.duration}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => createGoal(`Track career path: ${career.title}`)}
                      className="rounded-lg border border-fuchsia-300/30 bg-fuchsia-500/15 px-3 py-1.5 text-xs font-semibold text-fuchsia-100 hover:bg-fuchsia-500/30"
                    >
                      Save as Goal
                    </button>
                    <button
                      type="button"
                      onClick={() => addSuggestedTask(`Research requirements for ${career.title}`)}
                      className="rounded-lg border border-cyan-300/30 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/30"
                    >
                      Add Action
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const skill = career.missingSkills[0];
                        if (skill) {
                          addSuggestedTask(`Build ${skill} for ${career.title}`);
                        }
                      }}
                      className="rounded-lg border border-amber-300/30 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
                    >
                      Learn Next Skill
                    </button>
                    <button
                      type="button"
                      onClick={() => document.getElementById("student-resources")?.scrollIntoView({ behavior: "smooth" })}
                      className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25"
                    >
                      Open Resources
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const topResource = career.recommendedResources[0]?.title;
                        if (topResource) {
                          addSuggestedTask(`Complete resource: ${topResource}`);
                        }
                      }}
                      className="rounded-lg border border-violet-300/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-100 hover:bg-violet-500/25"
                    >
                      Queue Top Resource
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>
      )}

      {activeSection === "advisor" && (
        <>
          <Card id="student-ai-advisor" className="overflow-hidden border border-cyan-300/20 bg-cyan-500/10 shadow-xl ring-1 ring-cyan-300/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 shadow-lg shadow-cyan-500/25">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-cyan-50">AI Career Advisor</p>
                    <p className="text-xs text-cyan-100/75">Get personalized guidance instantly</p>
                  </div>
                </div>
                <Button
                  onClick={() => setAdvisorChatModalOpen(true)}
                  className="min-h-10 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white hover:from-cyan-700 hover:to-fuchsia-700"
                >
                  Open Chat
                </Button>
              </div>
            </CardContent>
          </Card>

          {advisorChatModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#0f172a] shadow-2xl flex flex-col">
                <div className="sticky top-0 border-b border-white/10 bg-[#0f172a] px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">AI Career Advisor</h2>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10 h-8 px-2" onClick={clearStudentAdvisorChat} size="sm">
                      Clear
                    </Button>
                    <button
                      onClick={() => setAdvisorChatModalOpen(false)}
                      className="text-slate-400 hover:text-white"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
                  <div className="mt-2 flex flex-wrap gap-2 mb-4">
                    {advisorSuggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => {
                          setStudentChatInput(prompt);
                        }}
                        className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <ScrollArea className="flex-1 rounded-lg border border-white/10 bg-slate-950/30 p-4 mb-4">
                    <div className="space-y-3">
                      {studentChatMessages.map((message) => (
                        <div key={message.id} className={`flex min-w-0 items-start gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                          {message.role === "assistant" && (
                            <Avatar className="h-7 w-7 border border-cyan-300/20 bg-cyan-500/15 flex-shrink-0">
                              <AvatarFallback className="bg-cyan-500/20 text-cyan-50 text-xs">
                                <Brain className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[85%] break-words rounded-lg px-3 py-2 text-sm leading-relaxed ${message.role === "user" ? "bg-fuchsia-600/70 text-slate-50 rounded-br-none" : "bg-slate-800/60 text-slate-50 rounded-bl-none"}`}>
                            {message.content}
                          </div>
                          {message.role === "user" && (
                            <Avatar className="h-7 w-7 border border-fuchsia-300/20 bg-fuchsia-500/15 flex-shrink-0">
                              <AvatarFallback className="bg-fuchsia-500/20 text-fuchsia-50 text-xs">
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}

                      {studentChatLoading && (
                        <div className="flex items-start gap-2">
                          <Avatar className="h-7 w-7 border border-cyan-300/20 bg-cyan-500/15 flex-shrink-0">
                            <AvatarFallback className="bg-cyan-500/20 text-cyan-50 text-xs">
                              <Brain className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-slate-300">
                            Thinking...
                          </div>
                        </div>
                      )}
                      <div ref={studentChatBottomRef} />
                    </div>
                  </ScrollArea>

                  {studentChatError && (
                    <p className="mb-4 rounded-lg border border-amber-300/30 bg-amber-500/15 px-3 py-2 text-xs text-amber-100">{studentChatError}</p>
                  )}

                  <div className="space-y-2">
                    <Textarea
                      value={studentChatInput}
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setStudentChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void sendStudentAdvisorMessage();
                        }
                      }}
                      placeholder="Ask about skills, projects, roles, internships..."
                      className="min-h-20 max-h-32 resize-none border-white/15 bg-slate-950/70 text-white placeholder:text-slate-500 text-sm"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        className="min-h-9 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white hover:from-cyan-700 hover:to-fuchsia-700 text-sm"
                        onClick={() => {
                          void sendStudentAdvisorMessage();
                        }}
                        disabled={studentChatLoading || !studentChatInput.trim()}
                      >
                        Ask
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeSection === "pathway" && (
      <Card id="student-pathway" className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-fuchsia-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.pathway.title}</CardTitle>
          </div>
          <CardDescription className="text-slate-400">Structured track for {selectedSubfield || selectedInterest}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fuchsia-100">Track Presets</p>
              <span className="text-xs text-fuchsia-100">Pathway Progress: {pathwayProgressPct}%</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {pathwayTracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setSelectedPathwayTrack(track.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedPathwayTrack === track.id
                      ? "border-fuchsia-300/40 bg-fuchsia-500/25 text-fuchsia-50"
                      : "border-white/15 bg-white/[0.04] text-slate-300 hover:text-fuchsia-100"
                  }`}
                >
                  {track.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-300">{activePathwayTrack.cadence} • Focus: {activePathwayTrack.focus.join(" • ")}</p>
            <div className="mt-2 h-1.5 rounded-full bg-slate-900/70">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-300" style={{ width: `${pathwayProgressPct}%` }} />
            </div>

            <div className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-500/10 p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-100">Weekly Planner</p>
                <div className="flex items-center gap-2">
                  <select
                    value={plannerWeeks}
                    onChange={(event) => setPlannerWeeks(Number(event.target.value) || parseCadenceWeeks(activePathwayTrack.cadence))}
                    className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-200 outline-none"
                  >
                    {[3, 4, 6, 8].map((weeks) => (
                      <option key={weeks} value={weeks}>{weeks} weeks</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={queueWeeklyPlannerTasks}
                    className="rounded-full border border-cyan-300/30 bg-cyan-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-cyan-100 hover:bg-cyan-500/35"
                  >
                    Add to Action Plan
                  </button>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                {weeklyPlanBlueprint.slice(0, 3).map((item) => (
                  <div key={item.text} className="flex items-center justify-between rounded border border-white/10 bg-white/[0.03] px-2 py-1">
                    <span className="truncate text-[11px] text-slate-200">{item.text}</span>
                    <span className="ml-2 shrink-0 text-[10px] text-slate-400">{item.dueDate}</span>
                  </div>
                ))}
              </div>
              {plannerNotice && (
                <p className="mt-2 text-xs text-cyan-100">{plannerNotice}</p>
              )}
            </div>
          </div>

          <div className="relative pl-5">
            <div className="absolute left-[17px] top-4 h-[calc(100%-2rem)] w-px bg-gradient-to-b from-fuchsia-500/40 via-violet-500/20 to-transparent" />
            <div className="space-y-2">
              {dashboard.pathway.steps.map((step, index) => (
                <div key={step.title} className="group relative flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[.02] p-4 transition-all duration-200 hover:border-fuchsia-300/20 hover:bg-white/[.05]">
                  <button
                    type="button"
                    onClick={() => togglePathwayStep(step.title)}
                    className={`relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border shadow ${
                      completedPathwaySteps.includes(step.title)
                        ? "border-emerald-300/40 bg-emerald-500/25 text-emerald-100 shadow-emerald-500/20"
                        : "border-fuchsia-300/30 bg-gradient-to-br from-purple-500/30 to-fuchsia-600/30 text-fuchsia-200 shadow-fuchsia-500/10"
                    }`}
                  >
                    {completedPathwaySteps.includes(step.title) ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                  </button>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-semibold text-slate-100">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{step.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-100">
                        Focus Skill: {activePathwayTrack.focus[index % activePathwayTrack.focus.length]}
                      </span>
                      <button
                        type="button"
                        onClick={() => addSuggestedTask(`Pathway step ${index + 1}: ${step.title}`)}
                        className="rounded-full border border-amber-300/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-100 hover:bg-amber-500/20"
                      >
                        Add to Plan
                      </button>
                    </div>
                  </div>
                  <Trophy className="h-4 w-4 flex-shrink-0 self-center text-slate-700 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {activeSection === "resources" && (
      <Card id="student-resources" className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-fuchsia-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.resources.title}</CardTitle>
          </div>
          <CardDescription className="text-slate-400">{dashboard.resources.description}</CardDescription>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "All" },
                { id: "recommended", label: "Recommended" },
                { id: "skills", label: "Skills" },
                { id: "career", label: "Career" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setResourceTypeFilter(item.id as "all" | "skills" | "career" | "recommended")}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    resourceTypeFilter === item.id
                      ? "border-cyan-300/35 bg-cyan-500/20 text-cyan-100"
                      : "border-white/15 bg-white/[0.04] text-slate-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <select
              value={resourceDurationFilter}
              onChange={(event) => setResourceDurationFilter(event.target.value as "all" | "short" | "medium" | "long")}
              className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 outline-none"
            >
              <option value="all">Duration: All</option>
              <option value="short">Duration: up to 20m</option>
              <option value="medium">Duration: 20-45m</option>
              <option value="long">Duration: 45m+</option>
            </select>
          </div>
          <div className="mt-2 rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-2.5">
            <div className="mb-1 flex items-center justify-between text-xs text-emerald-100">
              <span>Learning Progress</span>
              <span>{resourceProgress.done}/{resourceProgress.total} completed</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-900/70">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" style={{ width: `${resourceProgress.pct}%` }} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {visibleResourceInsights.map((resource, index) => (
              <div key={resource.title} className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10">
                <img src={resource.imageUrl} alt={resource.alt} className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-white/10 shadow-lg backdrop-blur-sm transition-all duration-200 group-hover:scale-110 group-hover:bg-white/20">
                    <Play className="ml-1 h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute left-3 top-3">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                    {resource.kind === "career" ? "Career Guide" : "Skills"}
                  </span>
                </div>
                {resource.relevanceScore > 0 && (
                  <div className="absolute right-3 top-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-500/25 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">
                      Match {resource.relevanceScore}
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-semibold text-white">{resource.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-white/60">{resource.duration}</span>
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                    <span className="text-xs text-white/60">Free</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleResourceComplete(resource.title)}
                      className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                        completedResources.includes(resource.title)
                          ? "border-emerald-300/35 bg-emerald-500/20 text-emerald-100"
                          : "border-white/20 bg-white/10 text-slate-200 hover:bg-white/20"
                      }`}
                    >
                      {completedResources.includes(resource.title) ? "Completed" : "Mark Complete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => addSuggestedTask(`Watch resource: ${resource.title}`)}
                      className="rounded-md border border-violet-300/30 bg-violet-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-100 hover:bg-violet-500/35"
                    >
                      Add to Plan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {visibleResourceInsights.length === 0 && (
            <p className="mt-3 text-sm text-slate-400">No resources matched current filters. Try switching to All.</p>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}