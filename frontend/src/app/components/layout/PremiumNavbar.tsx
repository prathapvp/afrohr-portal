import { useLocation, useNavigate } from "react-router";
import { removeUser } from "../../store/slices/UserSlice";
import { removeJwt } from "../../store/slices/JwtSlice";
import { clearProfile } from "../../store/slices/ProfileSlice";
import { useAppDispatch, useAppSelector } from "../../store";
import { selectIsAuthenticated } from "../../store/selectors/authSelectors";

function PremiumNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const showHomeButton = location.pathname !== "/";
  const showProfileButton = location.pathname !== "/profile";

  const handleLogout = () => {
    // Ensure Redux and persisted auth/profile state are fully cleared.
    dispatch(clearProfile());
    dispatch(removeUser());
    dispatch(removeJwt());

    localStorage.removeItem("afrohr:viewed-job-ids");
    sessionStorage.removeItem("afrohr:unauthorized-employer-redirect");

    void navigate("/login", { replace: true });
  };

  return (
    <nav className="premium-enter sticky top-0 z-50 border-b border-white/10 bg-[#0a0e1a]/95 shadow-[0_4px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500" />
      <div className="mx-auto flex min-h-[68px] flex-wrap items-center justify-between gap-3 px-5 py-2.5 sm:px-8 lg:px-10">
        {/* Brand Logo */}
        <div className="flex cursor-pointer items-center gap-3" onClick={() => void navigate("/")}>
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-400/20 via-orange-500/20 to-pink-500/20 blur-sm transition duration-300" />
            <img
              src="/afro-hr-light.png"
              alt="AfroHR"
              className="relative h-11 w-auto drop-shadow-md brightness-0 invert"
            />
          </div>
          <div className="hidden h-8 w-px bg-gradient-to-b from-transparent via-amber-400/40 to-transparent sm:block" />
          <span className="hidden bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-[10px] font-bold uppercase tracking-[0.25em] text-transparent sm:block">
            Talent Network
          </span>
        </div>
        {/* Nav Actions */}
        <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:w-auto sm:gap-2">
          {showHomeButton && (
            <>
              <button
                onClick={() => void navigate("/")}
                className="premium-card-hover min-h-10 rounded-lg px-4 text-[13px] font-medium tracking-wide text-slate-300 hover:bg-white/10 hover:text-white"
              >
                Home
              </button>
              <div className="mx-1 hidden h-6 w-px bg-white/15 sm:block" />
            </>
          )}
          {!isAuthenticated && (
            <>
              <button
                onClick={() => void navigate("/login")}
                className="premium-card-hover premium-pill min-h-10 rounded-lg px-5 text-[13px] font-medium tracking-wide text-slate-200 hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Login
              </button>
              <button
                onClick={() => void navigate("/signup")}
                className="premium-card-hover min-h-10 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 px-6 text-[13px] font-semibold tracking-wide text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:brightness-110"
              >
                Sign Up
              </button>
            </>
          )}
          {isAuthenticated && (
            <>
              {showProfileButton && (
                <button
                  onClick={() => void navigate("/profile")}
                  className="premium-card-hover min-h-10 rounded-lg px-4 text-[13px] font-medium tracking-wide text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  Profile
                </button>
              )}
              <button
                onClick={handleLogout}
                className="premium-card-hover min-h-10 rounded-lg bg-gradient-to-r from-rose-500 to-red-500 px-6 text-[13px] font-semibold tracking-wide text-white shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 hover:brightness-110"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default PremiumNavbar;
