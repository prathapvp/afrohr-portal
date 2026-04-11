import { Avatar, Divider, Tabs } from "@mantine/core";
import { IconMapPin, IconBuildingSkyscraper, IconSparkles } from "@tabler/icons-react";
import AboutComp from "./AboutComp";
import CompanyJobs from "./CompanyJobs";
import CompanyEmployees from "./CompanyEmployees";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { getAllJobs } from "../../services/job-service";
import { getAllProfiles } from "../../services/profile-service";
import { CompanyEmployee, CompanyJob } from "./types";
import { useAppSelector } from "../../store";

const COMPANY_CACHE_TTL_MS = 5 * 60 * 1000;

type SourceCache = {
    jobs: CompanyJob[];
    profiles: CompanyEmployee[];
    ts: number;
};

type CompanyViewCache = {
    jobs: CompanyJob[];
    employees: CompanyEmployee[];
    location: string;
    ts: number;
};

let sourceCache: SourceCache | null = null;
const companyViewCache = new Map<string, CompanyViewCache>();

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

function toProfileImageUri(rawValue?: string | null): string {
    if (typeof rawValue !== "string") {
        return "";
    }

    const cleanValue = rawValue.trim();
    if (!cleanValue) {
        return "";
    }

    if (cleanValue.startsWith("data:image/")) {
        return cleanValue;
    }

    const mime = cleanValue.startsWith("/9j/") ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${cleanValue}`;
}

const deriveCompanyView = (companyName: string, jobs: CompanyJob[], profiles: CompanyEmployee[]) => {
    const key = normalize(companyName);

    const companyJobs = jobs.filter((job) => normalize(String(job?.company || "")).includes(key));
    const companyEmployees = profiles.filter((profile) => normalize(String(profile?.company || "")).includes(key));

    const location =
        companyJobs.find((job) => job?.location)?.location ||
        companyEmployees.find((profile) => profile?.location)?.location ||
        "Location not specified";

    return {
        jobs: companyJobs,
        employees: companyEmployees,
        location,
    };
};

const Company = () => {
    const section = ["About", "Jobs", "Employees"];
    const { name } = useParams();
    const companyName = decodeURIComponent(name || "Google");
    const user = useAppSelector((state) => state.user as { accountType?: string } | null);
    const profile = useAppSelector((state) => state.profile as { company?: string; picture?: string | null; banner?: string | null });

    const profileCompanyName = typeof profile.company === "string" ? profile.company : "";
    const isEmployerSession = String(user?.accountType ?? localStorage.getItem("accountType") ?? "").toUpperCase() === "EMPLOYER";
    const isOwnCompanyPage = isEmployerSession && normalize(profileCompanyName) === normalize(companyName);

    const profileLogo = toProfileImageUri(profile.picture);
    const profileBanner = toProfileImageUri(profile.banner);

    const companyLogo = isOwnCompanyPage && profileLogo ? profileLogo : `/Icons/${companyName}.png`;
    const companyBanner = isOwnCompanyPage && profileBanner ? profileBanner : "/Profile/banner.svg";
    const [companyJobs, setCompanyJobs] = useState<CompanyJob[]>([]);
    const [companyEmployees, setCompanyEmployees] = useState<CompanyEmployee[]>([]);
    const [location, setLocation] = useState("Location not specified");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const key = normalize(companyName);
        const now = Date.now();

        const applyView = (view: { jobs: CompanyJob[]; employees: CompanyEmployee[]; location: string }) => {
            if (!mounted) return;
            setCompanyJobs(view.jobs);
            setCompanyEmployees(view.employees);
            setLocation(view.location);
        };

        const cachedView = companyViewCache.get(key);
        if (cachedView && now - cachedView.ts < COMPANY_CACHE_TTL_MS) {
            applyView(cachedView);
            setLoading(false);
        }

        if (sourceCache && now - sourceCache.ts < COMPANY_CACHE_TTL_MS) {
            const view = deriveCompanyView(companyName, sourceCache.jobs, sourceCache.profiles);
            companyViewCache.set(key, { ...view, ts: Date.now() });
            applyView(view);
            setLoading(false);
            return () => {
                mounted = false;
            };
        }

        Promise.all([getAllJobs(), getAllProfiles()])
            .then(([jobsRes, profilesRes]) => {
                if (!mounted) return;
                const allJobs = Array.isArray(jobsRes) ? (jobsRes as CompanyJob[]) : [];
                const allProfiles = Array.isArray(profilesRes) ? (profilesRes as CompanyEmployee[]) : [];

                sourceCache = {
                    jobs: allJobs,
                    profiles: allProfiles,
                    ts: Date.now(),
                };

                const view = deriveCompanyView(companyName, allJobs, allProfiles);
                companyViewCache.set(key, { ...view, ts: Date.now() });
                applyView(view);
            })
            .catch(() => {
                if (!mounted) return;
                if (!cachedView) {
                    setCompanyJobs([]);
                    setCompanyEmployees([]);
                    setLocation("Location not specified");
                }
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [companyName]);

    return <div className="w-full">
        <div className="overflow-hidden rounded-3xl border border-white/12 bg-[linear-gradient(180deg,rgba(17,24,39,0.92),rgba(2,6,23,0.96))] shadow-[0_22px_62px_rgba(0,0,0,0.42)]">
            <div className="relative">
            <img className="h-[200px] w-full object-cover" src={companyBanner} alt="Company Banner" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/Profile/banner.svg"; }} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/55 via-transparent to-cyan-500/25" />
                <div className="absolute right-4 top-4 rounded-full border border-bright-sun-400/35 bg-bright-sun-400/15 px-3 py-1 text-xs font-semibold text-bright-sun-200">
                    Premium Company Profile
                </div>

                <div className="absolute -bottom-12 left-6">
                    <div className="flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-[#060910] bg-[#060910] p-2 shadow-[0_12px_28px_rgba(0,0,0,0.45)] sm:h-32 sm:w-32">
                        <img className="h-full w-full rounded-2xl object-contain" src={companyLogo} alt={companyName} onError={(e) => { (e.currentTarget as HTMLImageElement).src = `/Icons/${companyName}.png`; }} />
                    </div>
                </div>
            </div>

            <div className="px-6 pb-5 pt-14 sm:px-7 sm:pt-16">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="flex items-center gap-2 text-3xl font-semibold text-white sm:text-4xl">
                            <IconBuildingSkyscraper className="h-7 w-7 text-cyan-300" stroke={1.6} />
                            {companyName}
                        </h1>
                        <div className="mt-2 flex items-center gap-1 text-sm text-mine-shaft-300 sm:text-base">
                            <IconMapPin className="h-5 w-5" stroke={1.5} /> {location}
                        </div>
                    </div>

                    <Avatar.Group>
                        <Avatar src="/avatar.svg" />
                        <Avatar src="/avatar1.png" />
                        <Avatar src="/avatar2.png" />
                        <Avatar className="[&>span]:!text-xs">{companyEmployees.length > 0 ? `${companyEmployees.length}+` : "+0"}</Avatar>
                    </Avatar.Group>
                </div>
            </div>
        </div>

        <Divider my="lg" color="rgba(255,255,255,0.14)" />

        <div className="rounded-3xl border border-white/12 bg-white/[0.03] p-3 shadow-[0_20px_52px_rgba(0,0,0,0.34)]">
            <Tabs variant="outline" radius="xl" defaultValue={section[0].toLowerCase()}>
            <Tabs.List className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-1 font-semibold [&_button]:!rounded-xl [&_button]:!text-sm sm:[&_button]:!text-base [&_button[data-active='true']]:!border-transparent [&_button[data-active='true']]:!bg-bright-sun-400/15 [&_button[data-active='true']]:!text-bright-sun-300">
                    {
                        section.map((item, index) => <Tabs.Tab key={index} value={item.toLowerCase()} >
                            <div className="flex items-center gap-1.5">
                                <IconSparkles size={14} className="text-bright-sun-300/90" />
                                {item}
                            </div>
                        </Tabs.Tab>)
                    }

                </Tabs.List>
                <Tabs.Panel value="about">
                    <AboutComp companyName={companyName} jobs={companyJobs} employees={companyEmployees} loading={loading} />
                </Tabs.Panel>

                <Tabs.Panel value="jobs">
                    <CompanyJobs jobs={companyJobs} loading={loading} />
                </Tabs.Panel>

                <Tabs.Panel value="employees">
                    <CompanyEmployees employees={companyEmployees} loading={loading} />
                </Tabs.Panel>
            </Tabs>
        </div>
    </div>
}
export default Company;