
import Footer from "../components/layout/footer/Footer";
import Header from "../components/layout/header/Header";
import Companies from "../features/landing-page/Companies";
import DreamJob from "../features/landing-page/DreamJob";
import JobCategory from "../features/landing-page/JobCategory";
import Subscribe from "../features/landing-page/Subscribe";
import Testimonials from "../features/landing-page/Testimonials";
import Working from "../features/landing-page/Working";

const HomePage=()=>{
    return (
        <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_30%),linear-gradient(180deg,#060910_0%,#0b1324_55%,#05080f_100%)] font-['poppins']">
            <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-bright-sun-400/20 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-28 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative mx-auto w-full max-w-[1400px] px-4 pt-5 sm:px-6">
                <div className="rounded-3xl border border-white/12 bg-white/[0.04] p-5 shadow-[0_20px_56px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/75">Talent Hub</div>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Your Personalized Job Discovery Space</h1>
                </div>
            </div>
            <DreamJob/>
            <Companies/>
            <JobCategory/>
            <Working/>
            <Testimonials/>
            <Subscribe/>
        </div>
    )
}
export default HomePage;