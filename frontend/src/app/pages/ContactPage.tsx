import PremiumNavbar from "../components/layout/PremiumNavbar";
import PublicSiteFooter from "../components/layout/PublicSiteFooter";

const officeLocations = [
  {
    company: "Afro Management Services DMCC",
    location: "Dubai, United Arab Emirates",
    address: "2404, 24th Floor, Swiss Tower, Cluster Y, Jumeirah Lake Towers, Dubai, UAE",
    phone: ["+971 45 703 561", "+971 55 709 7543"],
    email: "harish@afrogroup.in",
  },
  {
    company: "Afro Financial Consultants LLP",
    location: "Mumbai, India",
    address: "Goregoan (East), Mumbai, India-400063",
    phone: ["+91 7900 187 908", "+91 7306 653 617", "+232 30 207 822"],
    email: "harish@afrogroup.in",
  },
  {
    company: "Afro Search International Pvt. Ltd.",
    location: "Mumbai, India",
    address: "Goregoan (East), Mumbai, India-400063",
    phone: ["+91 7900 187 908", "+91 7306 653 617"],
    email: "harish@afrogroup.in",
  },
  {
    company: "Nuvo Agro Ventures LLP",
    location: "Kerala, India",
    address: "Kaithapram, Mathamangalam (PO), Kannur (Dist.), Kerala, INDIA-670306",
    phone: ["+91 7900 187 908", "+91 7306 653 617"],
    email: "aarushi@afrogroup.in",
  },
];

const supportChannels = [
  {
    title: "General Support",
    detail: "For account, onboarding, and platform usage questions.",
    channel: "info@afrohr.in",
    response: "Typical response: within 24 business hours",
  },
  {
    title: "Employer Partnerships",
    detail: "For hiring plans, recruiting workflows, and enterprise use.",
    channel: "info@afrohr.in",
    response: "Typical response: within 1 business day",
  },
  {
    title: "Candidate Guidance",
    detail: "For profile, applications, and career path support.",
    channel: "info@afrohr.in",
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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <PremiumNavbar />
      <main className="relative px-4 py-24">
      <div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-56 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />

      <div className="relative mx-auto max-w-6xl space-y-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-900/30 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.14),transparent_40%),radial-gradient(circle_at_85%_70%,rgba(251,146,60,0.14),transparent_45%)]" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Get In Touch</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Our Global Offices</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
              Reach out to our teams across Dubai, India, and beyond. We're here to support your recruitment and career needs.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {officeLocations.map((office, idx) => (
            <article key={idx} className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/70 p-5">
              <h3 className="text-lg font-bold text-orange-300">{office.company}</h3>
              <p className="mt-1 text-sm font-semibold text-white">{office.location}</p>
              <p className="mt-2 text-xs text-white/60">{office.address}</p>
              <div className="mt-3 space-y-1">
                {office.phone.map((ph, pidx) => (
                  <p key={pidx} className="text-sm text-white/70">{ph}</p>
                ))}
              </div>
              <p className="mt-2 text-sm text-orange-300 break-all">{office.email}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest text-orange-300">Primary SLA</p>
            <p className="mt-2 text-2xl font-black">24 Hours</p>
            <p className="mt-1 text-sm text-white/65">General support response target</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest text-orange-300">Business Desk</p>
            <p className="mt-2 text-2xl font-black">Partnerships</p>
            <p className="mt-1 text-sm text-white/65">Employer onboarding and commercial requests</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest text-orange-300">Community</p>
            <p className="mt-2 text-2xl font-black">WhatsApp</p>
            <p className="mt-1 text-sm text-white/65">Quick updates and community interaction</p>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {supportChannels.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/70 p-5">
              <h2 className="text-lg font-bold">{item.title}</h2>
              <p className="mt-2 text-sm text-white/70">{item.detail}</p>
              {item.title === "WhatsApp Community" ? (
                <a
                  href={item.channel}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-orange-300 hover:text-orange-200 transition-colors"
                >
                  Join Us
                </a>
              ) : (
                <p className="mt-4 text-sm font-semibold text-orange-300 break-all">{item.channel}</p>
              )}
              <p className="mt-2 text-xs text-white/60">{item.response}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-black">Response Expectations</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>Business hours: Monday to Saturday.</li>
            <li>Office timing: 9 am to 6 pm UAE Time (Monday to Friday), 9 am to 3 pm UAE Time (Saturday).</li>
          </ul>
        </section>
      </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
