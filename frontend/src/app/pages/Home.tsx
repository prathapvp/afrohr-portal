import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Award, Building2, ChevronRight, Globe, GraduationCap, Play, Sparkles, TrendingUp, Zap } from "lucide-react";
import PremiumNavbar from "../components/layout/PremiumNavbar";

type AudienceTab = "candidates" | "employers" | "students";

interface Branding {
  name: string;
  subtitle: string;
}

interface HomeHeroAction {
  label: string;
  tab: AudienceTab;
}

interface HomeHero {
  badge: string;
  title: string;
  highlight: string;
  description: string;
  primaryActions: HomeHeroAction[];
}

interface ChartSeries {
  key: "primary" | "secondary" | "tertiary";
  label: string;
}

interface ChartPoint {
  period: string;
  primary: number;
  secondary: number;
  tertiary: number;
}

interface CandidateEmployerCard {
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  chart: ChartPoint[];
  series: ChartSeries[];
}

interface WizardStep {
  label: string;
  options: string[];
}

interface StudentCard {
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  wizardSteps: WizardStep[];
}

interface CounterItem {
  value: number;
  label: string;
  suffix?: string;
}

interface GrowthSection {
  eyebrow: string;
  chartLabel?: string;
  title: string;
  highlight: string;
  description: string;
  points: string[];
  chart: Array<{ period: string; value: number }>;
}

interface CountriesSection {
  eyebrow: string;
  title: string;
  description: string;
  items: Array<{ flag: string; country: string; jobs: string; growth: string }>;
}

interface VideosSection {
  eyebrow: string;
  title: string;
  actionLabel?: string;
  items: Array<{ title: string; speaker: string; duration: string; imageUrl: string; alt: string }>;
}

interface CtaSection {
  badge: string;
  title: string;
  highlight: string;
  description: string;
  actionLabel: string;
}

interface HomePayload {
  countersTitle?: string;
  hero: HomeHero;
  cards: {
    candidates: CandidateEmployerCard;
    employers: CandidateEmployerCard;
    students: StudentCard;
  };
  counters: CounterItem[];
  growth: GrowthSection;
  countries: CountriesSection;
  videos: VideosSection;
  cta: CtaSection;
}

interface DashboardResponse {
  branding: Branding;
  home: HomePayload;
}

interface ApiJobItem {
  id?: number;
  title?: string;
  role?: string;
  company?: string;
  location?: string;
  salary?: string;
}

function buildHomePayloadFromJobs(jobs: ApiJobItem[]): DashboardResponse {
  const totalJobs = jobs.length;
  const uniqueCompanies = new Set(jobs.map((job) => job.company).filter(Boolean)).size;
  const sampleTitles = jobs.slice(0, 3).map((job) => job.role || job.title || "Open Role");

  return {
    branding: {
      name: "AfroHR",
      subtitle: "Talent Network",
    },
    home: {
      countersTitle: "Real-time hiring pulse",
      hero: {
        badge: "Live Opportunities",
        title: "Discover your next",
        highlight: "career move",
        description: "Curated opportunities and hiring insights powered by live jobs data.",
        primaryActions: [
          { label: "Explore Jobs", tab: "candidates" },
          { label: "Hire Talent", tab: "employers" },
        ],
      },
      cards: {
        candidates: {
          badge: "Candidates",
          title: "Find open roles",
          subtitle: sampleTitles.length > 0 ? sampleTitles.join(" • ") : "Browse the latest openings from verified employers.",
          cta: "See opportunities",
          chart: [
            { period: "W1", primary: Math.max(totalJobs, 2), secondary: Math.max(uniqueCompanies, 1), tertiary: 1 },
            { period: "W2", primary: Math.max(totalJobs + 2, 3), secondary: Math.max(uniqueCompanies + 1, 2), tertiary: 2 },
            { period: "W3", primary: Math.max(totalJobs + 4, 4), secondary: Math.max(uniqueCompanies + 1, 2), tertiary: 2 },
            { period: "W4", primary: Math.max(totalJobs + 6, 5), secondary: Math.max(uniqueCompanies + 2, 3), tertiary: 3 },
          ],
          series: [
            { key: "primary", label: "Open Roles" },
            { key: "secondary", label: "Companies" },
            { key: "tertiary", label: "Matches" },
          ],
        },
        employers: {
          badge: "Employers",
          title: "Scale hiring fast",
          subtitle: "Track candidate flow and optimize postings with AI-assisted insights.",
          cta: "Open hiring dashboard",
          chart: [
            { period: "Q1", primary: 14, secondary: 9, tertiary: 5 },
            { period: "Q2", primary: 18, secondary: 11, tertiary: 7 },
            { period: "Q3", primary: 23, secondary: 14, tertiary: 9 },
            { period: "Q4", primary: 29, secondary: 18, tertiary: 12 },
          ],
          series: [
            { key: "primary", label: "Applications" },
            { key: "secondary", label: "Interviews" },
            { key: "tertiary", label: "Hires" },
          ],
        },
        students: {
          badge: "Students",
          title: "Build a winning path",
          subtitle: "Get career guidance with practical milestones.",
          cta: "Start pathway",
          wizardSteps: [
            { label: "What are you interested in?", options: ["Engineering", "Design", "Marketing"] },
            { label: "Preferred work style?", options: ["On-site", "Hybrid", "Remote"] },
            { label: "Target experience level?", options: ["Intern", "Junior", "Mid"] },
          ],
        },
      },
      counters: [
        { value: totalJobs, label: "Live Jobs" },
        { value: uniqueCompanies, label: "Hiring Companies" },
        { value: 94, label: "Match Score", suffix: "%" },
      ],
      growth: {
        eyebrow: "Market momentum",
        chartLabel: "Openings trend",
        title: "Hiring demand keeps",
        highlight: "rising",
        description: "Stay ahead with a live snapshot of active recruitment trends.",
        points: [
          "New jobs added daily",
          "Cross-industry demand visibility",
          "Candidate-employer match analytics",
        ],
        chart: [
          { period: "Jan", value: 18 },
          { period: "Feb", value: 22 },
          { period: "Mar", value: 27 },
          { period: "Apr", value: 31 },
        ],
      },
      countries: {
        eyebrow: "Global reach",
        title: "Opportunities across regions",
        description: "Explore jobs across fast-growing markets.",
        items: [
          { flag: "US", country: "United States", jobs: "1.2k", growth: "+14%" },
          { flag: "UK", country: "United Kingdom", jobs: "860", growth: "+11%" },
          { flag: "IN", country: "India", jobs: "1.8k", growth: "+19%" },
        ],
      },
      videos: {
        eyebrow: "Career stories",
        title: "Learn from top mentors",
        actionLabel: "View all",
        items: [
          { title: "Resume Secrets", speaker: "Talent Lead", duration: "08:12", imageUrl: "", alt: "Resume video" },
          { title: "Interview Prep", speaker: "Hiring Manager", duration: "10:34", imageUrl: "", alt: "Interview video" },
        ],
      },
      cta: {
        badge: "Get started",
        title: "Ready to grow your",
        highlight: "career or team?",
        description: "Join AfroHR to connect the right talent with the right opportunities.",
        actionLabel: "Open Dashboard",
      },
    },
  };
}

const pointIcons: ReactNode[] = [
  <Globe className="h-5 w-5 text-purple-400" />,
  <Zap className="h-5 w-5 text-orange-400" />,
  <Award className="h-5 w-5 text-green-400" />,
];

function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [duration, target]);

  return { value, ref };
}

function StatCounter({ target, label, suffix = "" }: { target: number; label: string; suffix?: string }) {
  const { value, ref } = useCountUp(target);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl font-black text-white">
        {value.toLocaleString()}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-white/70">{label}</p>
    </div>
  );
}

interface AudienceCardProps {
  color: string;
  iconBg: string;
  icon: ReactNode;
  badge: string;
  title: string;
  subtitle: string;
  chart: ReactNode;
  cta: string;
  audienceTab: AudienceTab;
}

function AudienceCard({ color, iconBg, icon, badge, title, subtitle, chart, cta, audienceTab }: AudienceCardProps) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? "translateY(-6px) scale(1.01)" : "translateY(0) scale(1)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        boxShadow: hovered ? "0 24px 48px -8px rgba(0,0,0,0.25)" : "0 4px 16px -4px rgba(0,0,0,0.10)",
      }}
      className={`flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br ${color}`}
    >
      <div className="px-6 pt-6 pb-4">
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">{badge}</span>
        </div>
        <h3 className="text-2xl font-black leading-tight text-white">{title}</h3>
        <p className="mt-2 text-sm text-white/75">{subtitle}</p>
      </div>

      <div className="flex-1 px-4 py-2">{chart}</div>

      <div className="px-6 pb-6 pt-4">
        <button
          onClick={() => void navigate(`/dashboard?tab=${audienceTab}`)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/30"
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CareerWizard({ card }: { card: StudentCard }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<string[]>([]);

  const current = card.wizardSteps[step];

  function select(option: string) {
    const next = [...selections];
    next[step] = option;
    setSelections(next);
    if (step < card.wizardSteps.length - 1) {
      setTimeout(() => setStep((value) => value + 1), 220);
    }
  }

  const done = selections.length === card.wizardSteps.length && selections.every(Boolean);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 to-fuchsia-600" style={{ boxShadow: "0 4px 16px -4px rgba(0,0,0,0.10)" }}>
      <div className="px-6 pt-6 pb-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">{card.badge}</span>
        </div>
        <h3 className="text-2xl font-black leading-tight text-white">{card.title}</h3>
        <p className="mt-2 text-sm text-white/75">{card.subtitle}</p>
      </div>

      {!done && current ? (
        <div className="flex-1 px-6 pb-4">
          <div className="mb-4 flex gap-1">
            {card.wizardSteps.map((_, index) => (
              <div key={index} className={`h-1.5 flex-1 rounded-full transition-all ${index <= step ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
          <p className="mb-3 text-sm font-semibold text-white/90">{current.label}</p>
          <div className="flex flex-wrap gap-2">
            {current.options.map((option) => (
              <button
                key={option}
                onClick={() => select(option)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  selections[step] === option ? "bg-white text-violet-700" : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-4 text-center">
          <div className="mb-2 text-4xl">🎯</div>
          <p className="text-lg font-bold text-white">Your profile is ready!</p>
          <p className="mt-1 text-sm text-white/70">{selections.join(" · ")}</p>
        </div>
      )}

      <div className="px-6 pb-6 pt-2">
        <button
          onClick={() => void navigate("/dashboard?tab=students")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/30"
        >
          {done ? card.cta : "Explore All Careers"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm uppercase tracking-widest text-orange-400">Loading</p>
        <h1 className="mt-3 text-2xl font-black">Fetching career intelligence</h1>
        <p className="mt-3 text-sm text-white/60">The Home page is waiting for live backend content.</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-md rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center">
        <p className="text-sm uppercase tracking-widest text-red-300">Backend Error</p>
        <h1 className="mt-3 text-2xl font-black">Unable to load Home data</h1>
        <p className="mt-3 text-sm text-white/70">{message}</p>
        <button onClick={onRetry} className="mt-6 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-white/90">
          Retry
        </button>
      </div>
    </div>
  );
}


export default function Home() {
  const navigate = useNavigate();
  const [payload, setPayload] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Keep Home fully static/public with no backend dependency on initial load.
    setLoading(true);
    setError(null);
    setPayload(buildHomePayloadFromJobs([]));
    setLoading(false);
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !payload) {
    return <ErrorState message={error ?? "Missing home payload"} onRetry={() => window.location.reload()} />;
  }

  const { branding, home } = payload;
  const candidateCard = home.cards.candidates;
  const employerCard = home.cards.employers;
  const studentCard = home.cards.students;
  const currentYear = new Date().getFullYear();

  const candidateChart = (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={candidateCard.chart} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <XAxis dataKey="period" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={false} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "rgba(30,41,59,0.9)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.07)" }} />
        <Bar dataKey="primary" fill="rgba(255,255,255,0.9)" radius={[4, 4, 0, 0]} name={candidateCard.series[0]?.label ?? "Primary"} />
        <Bar dataKey="secondary" fill="rgba(255,255,255,0.5)" radius={[4, 4, 0, 0]} name={candidateCard.series[1]?.label ?? "Secondary"} />
        <Bar dataKey="tertiary" fill="rgba(255,255,255,0.3)" radius={[4, 4, 0, 0]} name={candidateCard.series[2]?.label ?? "Tertiary"} />
      </BarChart>
    </ResponsiveContainer>
  );

  const employerChart = (
    <ResponsiveContainer width="100%" height={130}>
      <LineChart data={employerCard.chart} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <XAxis dataKey="period" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={false} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "rgba(30,41,59,0.9)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }}
          formatter={(value: number) => [`$${value}k`, ""]}
          cursor={{ stroke: "rgba(255,255,255,0.3)" }}
        />
        <Line dataKey="primary" stroke="rgba(255,255,255,0.95)" strokeWidth={2.5} dot={false} name={employerCard.series[0]?.label ?? "Primary"} />
        <Line dataKey="secondary" stroke="rgba(255,255,255,0.6)" strokeWidth={2} dot={false} name={employerCard.series[1]?.label ?? "Secondary"} />
        <Line dataKey="tertiary" stroke="rgba(255,255,255,0.35)" strokeWidth={2} dot={false} name={employerCard.series[2]?.label ?? "Tertiary"} />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className="premium-shell relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-bright-sun-400/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-52 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
      <PremiumNavbar />

      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute top-10 right-1/4 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-orange-400">
            <Sparkles className="h-3.5 w-3.5" />
            {home.hero.badge}
          </div>
          <h1 className="mb-6 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {home.hero.title}{" "}
            <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">{home.hero.highlight}</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl">{home.hero.description}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {home.hero.primaryActions.map((action) => (
              <button
                key={action.tab}
                onClick={() => void navigate(`/dashboard?tab=${action.tab}`)}
                className={`flex items-center gap-2 rounded-2xl px-6 py-3.5 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 ${
                  action.tab === "candidates"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:shadow-blue-500/30"
                    : action.tab === "employers"
                      ? "bg-gradient-to-r from-green-600 to-emerald-500 hover:shadow-green-500/30"
                      : "bg-gradient-to-r from-purple-600 to-pink-500 hover:shadow-purple-500/30"
                }`}
              >
                {action.label}
                <ArrowRight className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AudienceCard color="from-blue-700 to-cyan-600" iconBg="bg-white/20" icon={<TrendingUp className="h-6 w-6 text-white" />} badge={candidateCard.badge} title={candidateCard.title} subtitle={candidateCard.subtitle} chart={candidateChart} cta={candidateCard.cta} audienceTab="candidates" />
            <AudienceCard color="from-emerald-700 to-teal-600" iconBg="bg-white/20" icon={<Building2 className="h-6 w-6 text-white" />} badge={employerCard.badge} title={employerCard.title} subtitle={employerCard.subtitle} chart={employerChart} cta={employerCard.cta} audienceTab="employers" />
            <CareerWizard card={studentCard} />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="mb-10 text-center text-xs font-bold uppercase tracking-widest text-orange-400">{home.countersTitle ?? "Growing Every Day"}</p>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {home.counters.map((counter) => (
              <StatCounter key={counter.label} target={counter.value} label={counter.label} suffix={counter.suffix} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">{home.growth.eyebrow}</span>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                {home.growth.title}
                <br />
                <span className="text-purple-400">{home.growth.highlight}</span>
              </h2>
              <p className="mt-4 leading-relaxed text-white/60">{home.growth.description}</p>
              <div className="mt-6 flex flex-col gap-3">
                {home.growth.points.map((point, index) => (
                  <div key={point} className="flex items-center gap-3 text-sm text-white/80">
                    {pointIcons[index] ?? <Sparkles className="h-5 w-5 text-orange-400" />}
                    {point}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="mb-4 text-sm font-semibold text-white/70">{home.growth.chartLabel ?? "Monthly Active Users"}</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={home.growth.chart} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${value / 1000}k`} />
                  <Tooltip contentStyle={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={(value: number) => [value.toLocaleString(), "Users"]} />
                  <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2.5} fill="url(#growthGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-green-400">{home.countries.eyebrow}</span>
            <h2 className="mt-2 text-3xl font-black">{home.countries.title}</h2>
            <p className="mt-2 text-sm text-white/50">{home.countries.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {home.countries.items.map((country) => (
              <div key={country.country} className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-4 transition-colors hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{country.flag}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{country.country}</p>
                    <p className="text-xs text-white/50">{country.jobs} jobs</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-green-400">{country.growth}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-slate-900 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400">{home.videos.eyebrow}</span>
              <h2 className="mt-2 text-3xl font-black">{home.videos.title}</h2>
            </div>
            <button onClick={() => void navigate("/dashboard")} className="hidden items-center gap-1 text-sm text-white/50 transition-colors hover:text-white sm:flex">
              {home.videos.actionLabel ?? "View all"} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {home.videos.items.map((video) => (
              <div key={video.title} className="group relative cursor-pointer overflow-hidden rounded-2xl" style={{ aspectRatio: "16/9" }}>
                <img src={video.imageUrl} alt={video.alt} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                  <div className="flex h-12 w-12 scale-50 items-center justify-center rounded-full bg-white/90 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                    <Play className="ml-1 h-5 w-5 text-slate-900" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-sm font-bold leading-tight text-white">{video.title}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-white/60">{video.speaker}</p>
                    <span className="text-xs text-white/60">{video.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/3 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-pink-500/15 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-orange-400">
            <Sparkles className="h-3.5 w-3.5" />
            {home.cta.badge}
          </div>
          <h2 className="mb-6 text-4xl font-black leading-tight sm:text-5xl">
            {home.cta.title}
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">{home.cta.highlight}</span>
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-white/60">{home.cta.description}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => void navigate("/dashboard")} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-orange-500/30">
              {home.cta.actionLabel}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-pink-500">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-black">
              {branding.name.slice(0, Math.max(branding.name.length - 2, 0))}
              <span className="text-orange-400">{branding.name.slice(-2)}</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <button onClick={() => void navigate("/dashboard?tab=candidates")} className="transition-colors hover:text-white/70">Candidates</button>
            <button onClick={() => void navigate("/dashboard?tab=employers")} className="transition-colors hover:text-white/70">Employers</button>
            <button onClick={() => void navigate("/dashboard?tab=students")} className="transition-colors hover:text-white/70">Students</button>
          </div>
          <p className="text-xs text-white/30">© {currentYear} {branding.name} · {branding.subtitle}</p>
        </div>
      </footer>
    </div>
  );
}
