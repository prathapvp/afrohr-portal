import { jobList } from "../../data/JobsData";
import JobCard from "../find-jobs/JobCard";

const CompanyJobs=()=>{
    return <div className="flex mt-10 flex-wrap gap-5">
    {
        jobList.map((job, index) => <JobCard key={index} {...job} />)
    }
</div>
}
export default CompanyJobs;