import { Link } from "react-router";

const timeline = [
  { year: "2023", title: "AfroHR Foundation", detail: "Started with a focused mission to simplify hiring for fast-moving teams and career seekers." },
  { year: "2024", title: "Multi-Audience Platform", detail: "Expanded workflows for Applicants, Employers, Students, and Admin operations." },
  { year: "2025", title: "Smarter Matching", detail: "Introduced profile-driven candidate-job matching and streamlined talent operations." },
  { year: "2026", title: "Brand Growth Sprint", detail: "Strengthened public brand presence, entity SEO, and trust signals across channels." },
];

const trustSignals = [
  "Role-based workflows for candidates, employers, students, and administrators.",
  "Secure account flows with authenticated dashboard operations.",
  "Live content architecture built for continuous improvement and measurement.",
  "Consistent AfroHR identity across website, schema, and social presence.",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl space-y-12">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">About AfroHR</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Mission-driven hiring and careers platform</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
            AfroHR helps people and organizations move faster with hiring and career decisions. We unify opportunity discovery,
            applicant workflows, employer hiring operations, and student career guidance in one connected platform.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/contact" className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-400">
              Contact AfroHR
            </Link>
            <Link to="/team" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold text-white/85 transition-colors hover:border-white/40 hover:text-white">
              Meet the Team
            </Link>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black">Our Mission</h2>
            <p className="mt-3 text-white/70">
              Build a dependable talent network where candidates find meaningful opportunities and employers hire with clarity,
              speed, and confidence.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-black">Our Principles</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>Clarity before complexity.</li>
              <li>Trust through consistent identity and communication.</li>
              <li>Outcome-oriented product decisions.</li>
              <li>Continuous learning from real hiring behavior.</li>
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-black">Timeline</h2>
          <div className="mt-5 space-y-4">
            {timeline.map((item) => (
              <article key={item.year} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-orange-300">{item.year}</p>
                <p className="mt-1 text-lg font-bold">{item.title}</p>
                <p className="mt-1 text-sm text-white/70">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-2xl font-black">Trust Signals</h2>
          <ul className="mt-4 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
            {trustSignals.map((signal) => (
              <li key={signal} className="rounded-xl border border-white/10 bg-slate-900/60 p-3">{signal}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
