export default function AfroHRForEmployersCandidatesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-700/30 to-teal-700/20 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">For Employers</p>
          <h1 className="mt-3 text-3xl font-black leading-tight">AfroHR for hiring teams</h1>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>Publish roles and improve applicant quality with consistent workflows.</li>
            <li>Track candidate status and hiring progress with a clear decision path.</li>
            <li>Reduce time-to-hire by centralizing recruitment operations.</li>
            <li>Support team collaboration with role-based dashboard access.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-700/30 to-cyan-700/20 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">For Candidates</p>
          <h2 className="mt-3 text-3xl font-black leading-tight">AfroHR for career growth</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>Discover relevant opportunities in one place.</li>
            <li>Build stronger profiles and improve discoverability.</li>
            <li>Track applications and progress with less friction.</li>
            <li>Get practical support for interviews and career decisions.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
