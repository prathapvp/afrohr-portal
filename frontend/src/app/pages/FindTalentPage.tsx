import { Divider } from "@mantine/core";
import SearchBar from "../features/find-talent/SearchBar";
import Talents from "../features/find-talent/Talents";

const FindTalentPage=()=>{
    return <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,#060910_0%,#0b1324_58%,#05080f_100%)] font-['poppins']">
         <div className="pointer-events-none absolute -left-16 top-14 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
         <div className="pointer-events-none absolute right-0 top-36 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

         <div className="relative mx-auto w-full max-w-[1400px] px-3 pb-10 pt-3 sm:px-4">
            <div className="mb-4 rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-5 shadow-[0_22px_60px_rgba(0,0,0,0.38)] backdrop-blur-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200/80">Hiring Studio</div>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Find High-Quality Talent Faster</h1>
            </div>
         <Divider size="xs" mx="md"/>
            <SearchBar/>
            <Divider size="xs" mx="md"/>
            <Talents/>
         </div>
    </div>
}
export default FindTalentPage;