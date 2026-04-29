import PremiumNavbar from "../components/layout/PremiumNavbar";
import PublicSiteFooter from "../components/layout/PublicSiteFooter";

const recruitmentStages = [
  {
    stage: "Client Engagement",
    detail: "We prioritize strong, collaborative relationships with our clients throughout the recruitment journey. From initial consultation to final placement, we work closely to understand business needs, company culture, and hiring goals. Our team ensures consistent communication, tailored recruitment strategies, and fast, efficient candidate delivery."
  },
  {
    stage: "Planning & Strategy",
    detail: "Following client engagement, our team initiates strategic planning to ensure alignment with recruitment objectives. This includes detailed internal discussions to analyze requirements, define job specifications, and identify key success factors. Tasks are carefully allocated across our recruitment specialists, ensuring each phase is handled with precision."
  },
  {
    stage: "Sourcing Candidate",
    detail: "With a clear strategy, we source candidates using our extensive in-house database and leading global talent acquisition platforms. Our recruiters leverage smart technology, industry networks, and targeted outreach to identify high-potential candidates who match the client's criteria. This multi-channel approach ensures access to top-tier talent across regions and sectors."
  },
  {
    stage: "Initial Candidate Assessment",
    detail: "We conduct thorough assessments to evaluate qualifications, experience, and alignment with client requirements. This includes resume screening, preliminary interviews, and skills validation to streamline selection and ensure only suitable profiles advance. Our goal is to present candidates who are both technically qualified and culturally aligned."
  },
  {
    stage: "Client Approval",
    detail: "We present the most qualified and vetted candidates to clients for review. Based on detailed profiles and assessment reports, clients provide feedback and select preferred candidates for final interviews or direct placement."
  },
  {
    stage: "Candidate Evaluation",
    detail: "Post-interview, we collect and analyze feedback from both the client and our internal panel to assess each candidate's performance, suitability, and alignment with the role and company culture."
  },
  {
    stage: "Offer Negotiation",
    detail: "We facilitate smooth and transparent offer negotiations between client and candidate, ensuring alignment on compensation, role expectations, and joining timelines for a successful acceptance."
  },
  {
    stage: "Onboard Support",
    detail: "We assist both client and candidate throughout onboarding to ensure a seamless transition. Our dedicated team handles documentation, orientation coordination, and follow-up support for early integration and long-term success."
  },
  {
    stage: "Follow Up",
    detail: "After successful onboarding, we provide continued follow-up support for a specified period to ensure smooth integration and address any concerns that may arise during the transition into the role."
  },
];

const teamMembers = [
  {
    name: "HR Consultancy Team",
    role: "Strategy & Operations",
    summary: "Drives organizational development strategies and HR consultancy services, ensuring our clients receive comprehensive talent solutions aligned with their business objectives.",
    focus: "Execution excellence, strategic priorities, and measurable talent outcomes."
  },
  {
    name: "Talent Acquisition",
    role: "Candidate & Employer Success",
    summary: "Specializes in sourcing and placing top-tier talent across sectors. Supports role matching quality, interview readiness, and employer hiring throughput.",
    focus: "Improving hiring outcomes with practical, results-driven recruitment strategies."
  },
  {
    name: "Executive Search",
    role: "Senior Leadership",
    summary: "Focuses on specialized executive search for top-tier, highly qualified professionals essential to meeting specific business challenges.",
    focus: "Identifying and placing senior-level talent that drives organizational success."
  },
];

const teamValues = [
  "Client-centric collaboration and partnership.",
  "Timely and accurate execution of recruitment outcomes.",
  "Systematic, fair, and data-driven assessment processes.",
  "Building lasting relationships and trust with clients and candidates.",
  "Continuous improvement and learning from every engagement.",
];

export default function TeamPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <PremiumNavbar />
      <main className="relative px-4 py-24">
      <div className="pointer-events-none absolute -left-20 top-6 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-48 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />

      <div className="relative mx-auto max-w-6xl space-y-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-fuchsia-900/25 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,70,239,0.14),transparent_40%),radial-gradient(circle_at_85%_70%,rgba(251,146,60,0.14),transparent_45%)]" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Team AfroHR</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Recruitment Excellence Through Our People</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
              Our team of HR professionals, recruiters, and industry specialists bring expertise, dedication, and a client-centric approach to every recruitment engagement. We transform hiring challenges into successful outcomes.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {teamMembers.map((member) => (
            <article key={member.name} className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/70 p-5">
              <p className="text-lg font-bold">{member.name}</p>
              <p className="mt-1 text-sm font-semibold text-orange-300">{member.role}</p>
              <p className="mt-3 text-sm text-white/70">{member.summary}</p>
              <p className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65">{member.focus}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-black">Our Recruitment Process</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {recruitmentStages.map((item) => (
              <article key={item.stage} className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-4">
                <p className="font-bold text-orange-300">{item.stage}</p>
                <p className="mt-2 text-sm text-white/70">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-2xl font-black">Our Core Values</h2>
          <ul className="mt-4 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
            {teamValues.map((value) => (
              <li key={value} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">✓</span>
                {value}
              </li>
            ))}
          </ul>
        </section>
      </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
