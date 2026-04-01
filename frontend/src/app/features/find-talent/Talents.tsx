import { useEffect, useState } from "react";
import { talents } from "../../data/TalentData";
import Sort from "../find-jobs/Sort";
import TalentCard from "./TalentCard";
import { getAllProfiles } from "../../services/profile-service";
import { useAppDispatch, useAppSelector } from "../../store";
import { resetFilter } from "../../store/slices/FilterSlice";
import { hideOverlay, showOverlay } from "../../store/slices/OverlaySlice";

interface TalentProfile {
    id?: number;
    applicantId?: number;
    name?: string;
    jobTitle?: string;
    location?: string;
    skills?: string[];
    totalExp?: number;
}

interface TalentFilter {
    name?: string;
    "Job Title"?: string[];
    Location?: string[];
    Skills?: string[];
    exp?: [number, number];
}

const Talents=()=>{
    const dispatch = useAppDispatch();
    const [talents, setTalents] = useState<TalentProfile[]>([]);
    const filter = useAppSelector((state) => state.filter as TalentFilter);
    const sort = useAppSelector((state) => state.sort as string);
    const [filteredTalents, setFilteredTalents] = useState<TalentProfile[]>([]);
    useEffect(() => {
        dispatch(resetFilter());
        dispatch(showOverlay());
        getAllProfiles().then((res) => {
            setTalents(Array.isArray(res) ? (res as TalentProfile[]) : []);
        }).catch((err) => console.log(err))
        .finally(() => dispatch(hideOverlay()));
    }, []);
    useEffect(()=>{
        if (sort === "Experience: Low to High") {
            setTalents([...talents].sort((a, b) => (a.totalExp ?? 0) - (b.totalExp ?? 0)));
        }
        else if (sort === "Experience: High to Low") {
            setTalents([...talents].sort((a, b) => (b.totalExp ?? 0) - (a.totalExp ?? 0)));
        }

    }, [sort]);
    useEffect(()=>{
        let filtered = talents;
        
        if (filter.name) {
            const nameQuery = filter.name.toLowerCase();
            filtered = filtered.filter((talent) => (talent.name ?? "").toLowerCase().includes(nameQuery));
        }
        if (filter["Job Title"] && filter["Job Title"].length > 0) {
            filtered = filtered.filter((talent) => filter["Job Title"]?.some((jobTitle) => (talent.jobTitle ?? "").toLowerCase().includes(jobTitle.toLowerCase())));
        }
        if (filter.Location && filter.Location.length > 0) {
            filtered = filtered.filter((talent) => filter.Location?.some((location) => (talent.location ?? "").toLowerCase().includes(location.toLowerCase())));
        }
        if (filter.Skills && filter.Skills.length > 0) {
            filtered = filtered.filter((talent) => filter.Skills?.some((skill) => (talent.skills ?? []).some((talentSkill) => talentSkill.toLowerCase().includes(skill.toLowerCase()))));
        }
        if (filter.exp && filter.exp.length > 0) {
            filtered = filtered.filter((talent) => filter.exp![0] <= (talent.totalExp ?? 0) && (talent.totalExp ?? 0) <= filter.exp![1]);
        }
        setFilteredTalents(filtered);
    }, [filter, talents]);
    return <div className="px-5 py-5">
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-emerald-200/75">Discovery</div>
            <div className="text-2xl font-semibold text-white">Talents</div>
        </div>
        <Sort />
    </div>
    <div className="mt-8 grid grid-cols-1 gap-5 bs-mx:grid-cols-2">
        {
            filteredTalents.map((talent, index) => <TalentCard key={talent.id ?? talent.applicantId ?? index} {...talent}  />)
        }
    </div>
</div>
}
export default Talents;