import { Divider } from "@mantine/core";
import SearchBar from "../features/find-jobs/SearchBar";
import Jobs from "../features/find-jobs/Jobs";

const FindJobsPage = () => {
    return (
        <div className="min-h-screen bg-mine-shaft-950 font-['poppins']">
            <Divider size="xs" mx="md"/>
            <SearchBar/>
            <Divider size="xs" mx="md"/>
            <Jobs/>
        </div>
    )
}
export default FindJobsPage;