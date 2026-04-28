const teamMembers = [
  {
    name: "Leadership Team",
    role: "Strategy & Operations",
    summary: "Drives platform direction, delivery cadence, and partner outcomes across audiences.",
  },
  {
    name: "Talent Advisory",
    role: "Candidate & Employer Success",
    summary: "Supports role matching quality, interview readiness, and employer hiring throughput.",
  },
  {
    name: "Product Engineering",
    role: "Platform Experience",
    summary: "Builds secure workflows, dashboard experiences, and continuous improvements for reliability.",
  },
];

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Team AfroHR</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">People behind the AfroHR platform</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
            AfroHR combines hiring, career guidance, and operations into a single product experience. The team focuses on speed,
            clarity, and measurable outcomes for both talent and employers.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {teamMembers.map((member) => (
            <article key={member.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-lg font-bold">{member.name}</p>
              <p className="mt-1 text-sm font-semibold text-orange-300">{member.role}</p>
              <p className="mt-3 text-sm text-white/70">{member.summary}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
