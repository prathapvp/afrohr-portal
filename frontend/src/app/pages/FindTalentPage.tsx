import { Divider } from "@mantine/core";
import SearchBar from "../features/find-talent/SearchBar";
import Talents from "../features/find-talent/Talents";

const FindTalentPage=()=>{
    return <div className="min-h-screen bg-mine-shaft-950 font-['poppins']">
         <Divider size="xs" mx="md"/>
            <SearchBar/>
            <Divider size="xs" mx="md"/>
            <Talents/>
    </div>
}
export default FindTalentPage;