import { companyData } from "../../data/Company";
import { CompanyEmployee, CompanyJob } from "./types";

interface AboutCompProps {
    companyName: string;
    jobs: CompanyJob[];
    employees: CompanyEmployee[];
    loading?: boolean;
}

const AboutComp = ({ companyName, jobs, employees, loading }: AboutCompProps) => {
    const dynamicSpecialties = Array.from(
        new Set(
            jobs
                .flatMap((job) => (Array.isArray(job?.skillsRequired) ? job.skillsRequired : []))
                .map((skill) => String(skill).trim())
                .filter(Boolean)
        )
    ).slice(0, 10);

    const company: Record<string, string | string[]> = {
        Name: companyName,
        Overview:
            jobs.find((job) => typeof job?.about === "string" && job.about.trim().length > 0)?.about ||
            `${companyName} is actively hiring through AfroHR. Explore open roles, team profiles, and opportunities to connect with their talent network.`,
        Industry: jobs.find((job) => job?.industry)?.industry || companyData.Industry,
        Website:
            companyName.toLowerCase() === String(companyData.Name).toLowerCase()
                ? companyData.Website
                : "Not provided",
        Size: employees.length > 0 ? `${employees.length}+ Employees on AfroHR` : "Not specified",
        Headquarters:
            jobs.find((job) => job?.location)?.location ||
            employees.find((profile) => profile?.location)?.location ||
            "Not specified",
        Specialties: dynamicSpecialties.length > 0 ? dynamicSpecialties : companyData.Specialties,
    };

    if (loading) {
        return <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4 text-sm text-mine-shaft-300">Loading company details...</div>;
    }

    return <div className="grid grid-cols-1 gap-4">
        {
            Object.keys(company).map((key, index) =>key!="Name"&& <div key={index} className="rounded-2xl border border-white/10 bg-slate-900/45 p-4 shadow-[0_10px_26px_rgba(0,0,0,0.25)]">
            <div className="mb-2 text-base font-semibold text-white sm:text-lg">{key}</div>
            {key!="Website" && <div className="text-sm leading-6 text-mine-shaft-300 text-justify">
                {key!="Specialties"?company[key]:company[key].map((item: string, index: number) => <span key={index}> &bull; {item}</span>)}
                </div>}
            {key=="Website" && company[key] !== "Not provided" && <a target="_blank" href={company[key]} className="text-sm font-medium text-bright-sun-300 hover:text-bright-sun-200">{company[key]}</a>}
            {key=="Website" && company[key] === "Not provided" && <div className="text-sm text-mine-shaft-300">Not provided</div>}
        </div> )
        }
        
    </div>
}
export default AboutComp;