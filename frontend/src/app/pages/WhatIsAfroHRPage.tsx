export default function WhatIsAfroHRPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Brand Explainer</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">What is AfroHR?</h1>
          <p className="mt-4 text-base leading-7 text-white/70">
            AfroHR is a talent and hiring platform that connects candidates, employers, students, and admins through one coordinated
            digital workflow.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-2xl font-black">What AfroHR does</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>Helps candidates discover opportunities and manage applications.</li>
            <li>Helps employers post roles, track applicants, and accelerate hiring.</li>
            <li>Helps students explore guided pathways toward job readiness.</li>
            <li>Helps admins maintain consistency across hiring and account operations.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-black">Why AfroHR matters</h2>
          <p className="mt-3 text-sm leading-7 text-white/75">
            Hiring and career journeys are usually fragmented across disconnected tools. AfroHR creates a shared system where role
            discovery, profile readiness, and recruitment workflows are aligned, measurable, and easier to improve over time.
          </p>
        </section>
      </div>
    </main>
  );
}
