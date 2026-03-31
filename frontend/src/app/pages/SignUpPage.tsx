import { IconArrowLeft } from "@tabler/icons-react"
import { SignUp, Login } from "../features/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@mantine/core";

const SignUpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="premium-shell relative min-h-screen w-full overflow-hidden">
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-bright-sun-400/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-36 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
      {/* Centered card with forms */}
      <div className="flex min-h-[calc(100vh-68px)] items-center justify-center px-4 py-8 sm-mx:py-4">
        <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/20 bg-white/[0.08] shadow-[0_28px_70px_rgba(0,0,0,0.45)] backdrop-blur-md sm-mx:rounded-2xl">
          <div
            className={`flex [&>*]:flex-shrink-0 transition-all relative ease-in-out duration-700 ${
              location.pathname === "/signup"
                ? "-translate-x-1/2 sm-mx:-translate-x-full"
                : "translate-x-0"
            }`}
          >
            <Login />
            <div
              className={`w-1/2 min-h-[560px] sm-mx:hidden transition-all duration-700 flex items-center gap-6 justify-center flex-col ${
                location.pathname === "/signup"
                  ? "rounded-r-[200px]"
                  : "rounded-l-[200px]"
              } bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 relative overflow-hidden`}
            >
              {/* Decorative circles */}
              <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-white/10" />
              <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-white/10" />
              <div className="absolute top-1/3 right-10 h-24 w-24 rounded-full bg-white/5" />

              <img
                src="/afro-hr-light.png"
                alt="Afro HR"
                className="h-20 w-auto drop-shadow-lg brightness-0 invert relative z-10"
              />
              <div className="text-2xl bs-mx:text-xl md-mx:text-lg font-bold text-white text-center px-8 relative z-10">
                Find the job made for you
              </div>
              <p className="text-sm text-white/80 px-10 text-center relative z-10 max-w-xs">
                Join thousands of professionals building their careers with AFRO HR
              </p>
              <div className="flex gap-6 mt-2 relative z-10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">5K+</div>
                  <div className="text-xs text-white/70">Active Jobs</div>
                </div>
                <div className="h-10 w-px bg-white/30" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">2K+</div>
                  <div className="text-xs text-white/70">Companies</div>
                </div>
                <div className="h-10 w-px bg-white/30" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">10K+</div>
                  <div className="text-xs text-white/70">Hired</div>
                </div>
              </div>
            </div>
            <SignUp />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
