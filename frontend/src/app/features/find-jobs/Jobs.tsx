
import Sort from "./Sort";
import JobCard from "./JobCard";
import { useEffect, useState } from "react";
import { getAllJobs } from "../../services/JobService";
import { useDispatch, useSelector } from "react-redux";
import { resetFilter } from "../../store/slices/FilterSlice";
import { resetSort } from "../../store/slices/SortSlice";
import { hideOverlay, showOverlay } from "../../store/slices/OverlaySlice";
import { Button } from "@mantine/core";
import { IconSparkles, IconX } from "@tabler/icons-react";
import { Link } from "react-router";

const Jobs = () => {
    const dispatch=useDispatch();
    const [jobList, setJobList] = useState([]);
    const filter=useSelector((state:any)=>state.filter);
    const sort=useSelector((state:any)=>state.sort);
    const [filteredJobs, setFilteredJobs] = useState<any>([]);
    
    useEffect(()=>{
        // dispatch(resetFilter());
        dispatch(resetSort());
        dispatch(showOverlay())
        getAllJobs().then((res)=>{
            setJobList(res.filter((job:any)=>job.jobStatus=="ACTIVE"));
        }).catch((err)=>console.log(err))
        .finally(()=>dispatch(hideOverlay()));
        return ()=>{
            if(!filter.page)dispatch(resetFilter());
          }
    }, [])
    useEffect(()=>{
        if(sort=="Most Recent"){
            setJobList([...jobList].sort((a: any, b: any) => new Date(b.postTime).getTime() - new Date(a.postTime).getTime()));
        }
        else if(sort=="Salary: Low to High"){
            setJobList([...jobList].sort((a: any, b: any) => a.packageOffered - b.packageOffered));
        }
        else if(sort=="Salary: High to Low"){
            setJobList([...jobList].sort((a: any, b: any) => b.packageOffered - a.packageOffered));
        }

    }, [sort])
    useEffect(()=>{
        let filtered = jobList;
        if(filter["Job Title"] && filter["Job Title"].length>0)filtered=filtered.filter((job:any)=>filter["Job Title"]?.some((x:any)=>job.jobTitle?.toLowerCase().includes(x.toLowerCase())));
        if(filter.Location && filter.Location.length>0)filtered=filtered.filter((job:any)=>filter.Location?.some((x:any)=>job.location?.toLowerCase().includes(x.toLowerCase())));
          if(filter.Experience && filter.Experience.length>0)filtered=filtered.filter((job:any)=>filter.Experience?.some((x:any)=>job.experience?.toLowerCase().includes(x.toLowerCase())));
          if(filter["Job Type"] && filter["Job Type"].length>0)filtered=filtered.filter((job:any)=>filter["Job Type"]?.some((x:any)=>job.jobType?.toLowerCase().includes(x.toLowerCase())));
          if(filter.salary && filter.salary.length>0)filtered=filtered.filter((jobs:any)=>filter.salary[0]<=jobs.packageOffered && jobs.packageOffered<=filter.salary[1]);
        setFilteredJobs(filtered);
    },[filter,jobList])
    return <div className="px-1 py-5 sm:px-2">
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-slate-400">Recommendations</div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-2xl font-semibold text-white xs-mx:text-xl">
                    Recommended Jobs
                    {Object.keys(filter).length>0&&<Button onClick={()=>dispatch(resetFilter())} className="font-body transition duration-300" size="compact-sm" leftSection={<IconX stroke={1.5} size={18}/>} variant="filled" color="brightSun.4" autoContrast >Clear Filters</Button>}
                </div>
                <div className="mt-2 inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                    {filteredJobs.length} role{filteredJobs.length === 1 ? "" : "s"} found
                </div>
            </div>
            <div className="flex items-center gap-3">
                {localStorage.getItem("accountType") === "APPLICANT" && (
                    <Link to="/swipe">
                        <Button size="compact-sm" variant="gradient" gradient={{ from: "brightSun.5", to: "pink.4", deg: 90 }} leftSection={<IconSparkles size={14} stroke={2}/>}> 
                            Swipe Mode
                        </Button>
                    </Link>
                )}
                <Sort sort="job" />
            </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {
                filteredJobs.length>0?filteredJobs.map((job:any, index:any) => <JobCard key={index} {...job} />):<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 font-medium text-lg text-mine-shaft-200">
                    No jobs found for the selected filters.
                </div>
            }
        </div>
    </div>
}
export default Jobs;