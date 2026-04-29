import { Link } from "react-router";
import PremiumNavbar from "../components/layout/PremiumNavbar";
import PublicSiteFooter from "../components/layout/PublicSiteFooter";

const impactStats = [
  { label: "Presence", value: "40+ Countries" },
  { label: "Team", value: "Expert Recruiters" },
  { label: "Focus", value: "Excellence & Reliability" },
];

const directorMessage = `Welcome to Afro HR. Afro HR is a Dubai-based recruitment and consulting firm with a strong presence across India, Africa, and the Middle East. Since our inception in 2018, we have grown into a multifaceted organization offering specialized services in HR consultancy, international talent acquisition, executive search, organizational development, and staffing solutions across various sectors, including finance, healthcare, engineering, manufacturing and IT.`;

const whyChooseUs = [
  {
    title: "Client-Centric Collaboration",
    detail: "We engage in multiple meetings with clients to help shape detailed specifications that consider transferable skills and competencies—ensuring the identification of the most suitable leaders."
  },
  {
    title: "Broad Industry Reach",
    detail: "With a strong presence across various industries, functions, and locations—both through our center and online—Afro Management Services DMCC efficiently screens and validates candidates, eliminating unsuitable applicants and saving valuable client time."
  },
  {
    title: "Timely and Accurate Execution",
    detail: "We deliver assignments within demanding deadlines. Candidates are thoroughly briefed on the company and role, ensuring smooth integration into the client organization."
  },
  {
    title: "Specialized Executive Search",
    detail: "Our executive search services are ideal when hiring top-tier, highly qualified professionals is essential to meeting specific business challenges."
  },
  {
    title: "Systematic Candidate Interview",
    detail: "Our structured interview process ensures fairness and consistency by using standardized questions and evaluation criteria, minimizing bias and supporting data-driven hiring decisions."
  },
];

const services = [
  "HR Consultancy & Organizational Development",
  "International Talent Acquisition",
  "Executive Search Services",
  "Staffing Solutions",
  "Multi-sector expertise: Finance, Healthcare, Engineering, Manufacturing, IT"
];

const operatingRegions = [
  "Pan India Operations",
  "Africa Operations",
  "Middle East (UAE based)",
  "Serving multiple industrial verticals",
  "Small to large scale enterprises"
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <PremiumNavbar />
      <main className="relative px-4 py-24">
      <div className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-56 h-80 w-80 rounded-full bg-pink-500/15 blur-3xl" />

      <div className="relative mx-auto max-w-6xl space-y-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-900/30 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,146,60,0.18),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.14),transparent_45%)]" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Director's Message</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:text-4xl">
              Welcome to Afro HR
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
              {directorMessage}
            </p>
            <p className="mt-4 text-sm font-semibold text-orange-300">Warm regards,<br/>Harish Kumar Madamana<br/>Afro Management Services DMCC</p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {impactStats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <p className="text-2xl font-black text-orange-300">{stat.value}</p>
              <p className="mt-1 text-sm text-white/70">{stat.label}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black">Our Services</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {services.map((service) => (
                <li key={service} className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">▸</span>
                  {service}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-black">Operating Regions</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {operatingRegions.map((region) => (
                <li key={region} className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">◆</span>
                  {region}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-black">Why Choose Afro HR</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {whyChooseUs.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-4">
                <p className="font-bold text-orange-300">{item.title}</p>
                <p className="mt-2 text-sm text-white/70">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
