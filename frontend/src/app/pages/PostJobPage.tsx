import { Divider } from "@mantine/core";
import PostJob from "../features/post-job/PostJob";

const PostJobPage=()=>{
    return <div className="min-h-[90vh] bg-mine-shaft-950 font-['poppins']">
         <Divider size="xs" mx="md"/>
         <PostJob/>
    </div>
}
export default PostJobPage;