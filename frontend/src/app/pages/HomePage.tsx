
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
        <div className="min-h-screen bg-mine-shaft-950 font-['poppins']">
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