import { IconArrowLeft } from "@tabler/icons-react"
import { SignUp, Login } from "../features/auth";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@mantine/core";

const SignUpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignupRoute = location.pathname === "/signup";
  return (
    <div className="premium-shell relative min-h-screen w-full overflow-x-hidden">
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-bright-sun-400/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-36 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
      {/* Centered card with forms */}
      <div className="auth-stage flex min-h-[calc(100vh-68px)] items-start justify-center px-3 py-4 sm:px-4 sm:py-8 sm:items-center">
        <div className="auth-card w-full max-w-5xl overflow-hidden rounded-3xl border border-white/20 bg-white/[0.08] shadow-[0_28px_70px_rgba(0,0,0,0.45)] backdrop-blur-md sm-mx:rounded-2xl">
          <div className="sm:hidden border-b border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-fuchsia-900/40 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{isSignupRoute ? "Create your AfroHR account" : "Welcome back to AfroHR"}</p>
                <p className="mt-0.5 text-[11px] text-slate-300">{isSignupRoute ? "Quick signup and email verification" : "Sign in and continue your journey"}</p>
              </div>
              <img src="/afro-hr-light.png" alt="Afro HR" className="h-7 w-auto opacity-90" />
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-300">
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5">5K+ Jobs</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5">2K+ Companies</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5">10K+ Hired</span>
            </div>
          </div>
          <div
            className={`relative flex [&>*]:flex-shrink-0 transition-all ease-in-out duration-700 ${
              isSignupRoute
                ? "-translate-x-1/2 sm-mx:-translate-x-full"
                : "translate-x-0"
            }`}
          >
            <Login />
            <div
              className={`auth-brand-panel hidden w-1/2 transition-all duration-700 sm:flex items-center gap-6 justify-center flex-col ${
                isSignupRoute
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
                className="auth-brand-logo h-20 w-auto drop-shadow-lg brightness-0 invert relative z-10"
              />
              <div className="auth-brand-title text-2xl bs-mx:text-xl md-mx:text-lg font-bold text-white text-center px-8 relative z-10">
                Find the job made for you
              </div>
              <p className="auth-brand-copy text-sm text-white/80 px-10 text-center relative z-10 max-w-xs">
                Join thousands of professionals building their careers with AFRO HR
              </p>
              <div className="auth-brand-stats flex gap-6 mt-2 relative z-10">
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
