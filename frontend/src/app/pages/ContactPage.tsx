const supportChannels = [
  {
    title: "General Support",
    detail: "For account, onboarding, and platform usage questions.",
    channel: "support@afrohr.in",
    response: "Typical response: within 24 business hours",
  },
  {
    title: "Employer Partnerships",
    detail: "For hiring plans, recruiting workflows, and enterprise use.",
    channel: "partnerships@afrohr.in",
    response: "Typical response: within 1 business day",
  },
  {
    title: "Candidate Guidance",
    detail: "For profile, applications, and career path support.",
    channel: "careers@afrohr.in",
    response: "Typical response: within 24-48 business hours",
  },
  {
    title: "WhatsApp Community",
    detail: "For broadcast updates and quick community updates.",
    channel: "https://chat.whatsapp.com/DBx7w0bIl5e8KQ4KqOnfS8?mode=gi_t",
    response: "Community updates are posted regularly",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Contact AfroHR</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Reach the right team faster</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
            Choose the channel that best matches your intent so we can route your request quickly and respond with the right context.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {supportChannels.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-bold">{item.title}</h2>
              <p className="mt-2 text-sm text-white/70">{item.detail}</p>
              <p className="mt-4 text-sm font-semibold text-orange-300 break-all">{item.channel}</p>
              <p className="mt-2 text-xs text-white/60">{item.response}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-black">Response Expectations</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>Business hours: Monday to Friday.</li>
            <li>High-priority employer requests are triaged first.</li>
            <li>For account security concerns, include the account email and issue timestamp.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
