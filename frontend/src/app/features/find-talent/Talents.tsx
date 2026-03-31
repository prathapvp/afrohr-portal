import { useEffect, useState } from "react";
import { talents } from "../../data/TalentData";
import Sort from "../find-jobs/Sort";
import TalentCard from "./TalentCard";
import { getAllProfiles } from "../../services/ProfileService";
import { useDispatch, useSelector } from "react-redux";
import { resetFilter } from "../../store/slices/FilterSlice";
import { hideOverlay, showOverlay } from "../../store/slices/OverlaySlice";

const Talents=()=>{
    const dispatch=useDispatch();
    const [talents, setTalents] = useState<any>([]);
    const filter=useSelector((state:any)=>state.filter);
    const sort=useSelector((state:any)=>state.sort);
    const [filteredTalents, setFilteredTalents] = useState<any>([]);
    useEffect(() => {
        dispatch(resetFilter());
        dispatch(showOverlay())
        getAllProfiles().then((res) => {
            setTalents(res);
        }).catch((err) => console.log(err))
        .finally(()=>dispatch(hideOverlay()))
    },[])
    useEffect(()=>{
        if(sort=="Experience: Low to High"){
            setTalents([...talents].sort((a: any, b: any) => a.totalExp - b.totalExp));
        }
        else if(sort=="Experience: High to Low"){
            setTalents([...talents].sort((a: any, b: any) => b.totalExp - a.totalExp));
        }

    }, [sort])
    useEffect(()=>{
        let filtered = talents;
        
        if(filter.name)filtered=filtered.filter((talent:any)=>talent.name.toLowerCase().includes(filter.name.toLowerCase()));
        if(filter["Job Title"] && filter["Job Title"].length>0)filtered=filtered.filter((talent:any)=>filter["Job Title"]?.some((x:any)=>talent.jobTitle?.toLowerCase().includes(x.toLowerCase())));
        if(filter.Location && filter.Location.length>0)filtered=filtered.filter((talent:any)=>filter.Location?.some((x:any)=>talent.location?.toLowerCase().includes(x.toLowerCase())));
          if(filter.Skills && filter.Skills.length>0)filtered=filtered.filter((talent:any)=>filter.Skills?.some((x:any)=>talent.skills?.some((y:any)=>y.toLowerCase().includes(x.toLowerCase()))));
          if(filter.exp && filter.exp.length>0)filtered=filtered.filter((talent:any)=>filter.exp[0]<=talent.totalExp && talent.totalExp<=filter.exp[1]);
        setFilteredTalents(filtered);
    },[filter,talents])
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
            filteredTalents.map((talent:any, index:any) => <TalentCard key={index} {...talent}  />)
        }
    </div>
</div>
}
export default Talents;