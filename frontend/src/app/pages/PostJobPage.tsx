import { Divider } from "@mantine/core";
import PostJob from "../features/post-job/PostJob";

const PostJobPage=()=>{
    return <div className="relative min-h-[90vh] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_34%),linear-gradient(180deg,#060910_0%,#0b1324_58%,#05080f_100%)] font-['poppins']">
         <div className="pointer-events-none absolute -left-16 top-16 h-60 w-60 rounded-full bg-cyan-400/16 blur-3xl" />
         <div className="pointer-events-none absolute right-0 top-32 h-72 w-72 rounded-full bg-bright-sun-400/16 blur-3xl" />

         <div className="relative mx-auto w-full max-w-[1400px] px-3 pb-8 pt-3 sm:px-4">
            <div className="mb-4 rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 shadow-[0_16px_44px_rgba(0,0,0,0.3)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">Hiring Workflow</div>
                <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">Create a High-Converting Job Posting</h1>
            </div>
            <Divider size="xs" mx="md"/>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_20px_52px_rgba(0,0,0,0.32)]">
                <PostJob/>
            </div>
         </div>
    </div>
}
export default PostJobPage;