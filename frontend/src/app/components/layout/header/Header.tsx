import { Avatar, Burger, Button, Drawer, Indicator } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import NavLinks from "./NavLinks";
import ProfileMenu from "./ProfileMenu";
import { Link, useLocation, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { getCurrentUser } from "../../../services/auth-service";
import { getMyProfile } from "../../../services/profile-service";
import { setProfile } from "../../../store/slices/ProfileSlice";
import NotiMenu from "./NotiMenu";
import { setUser } from "../../../store/slices/UserSlice";
import { setupResponseInterceptor } from "../../../interceptor/AxiosInterceptor";
import { useDisclosure } from "@mantine/hooks";
import { getBrandLogoSrc } from "../../../utils/brandLogo";

const allLinks = [
  { name: "Find Jobs", url: "find-jobs" },
  { name: "Find Talent", url: "find-talent" },
  { name: "Post Job", url: "post-job/0" },
  { name: "Posted Jobs", url: "posted-jobs/0" },
  { name: "Job History", url: "job-history" },
];

const Header = ({
  colorScheme,
  toggleColorScheme,
}: {
  colorScheme: string;
  toggleColorScheme: () => void;
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user);
  const profile = useSelector((state: any) => state.profile);
  const token = useSelector((state: any) => state.jwt);
  const location = useLocation();
  const navigate = useNavigate();
  const logoSrc = getBrandLogoSrc();
  const profileFetchedRef = useRef(false);

  useEffect(() => {
    setupResponseInterceptor(navigate, dispatch);
  }, [navigate, dispatch]);

  useEffect(() => {
    if (token && localStorage.getItem("token")) {
      if (!user) {
        getCurrentUser().then((currentUser) => {
          dispatch(setUser(currentUser));
        }).catch(() => {
          // Response interceptor handles invalid sessions.
        });
      }
    }
  }, [token, user, dispatch]);

  // Fetch profile only once when user is available and profile hasn't been loaded
  useEffect(() => {
    if (user && !profile?.id && !profileFetchedRef.current) {
      profileFetchedRef.current = true;
      getMyProfile()
        .then((res) => dispatch(setProfile(res)))
        .catch((err) => {
          console.log(err);
          profileFetchedRef.current = false; // Reset on error to allow retry
        });
    }
  }, [user, profile?.id, dispatch]);

  if (location.pathname === "/signup" || location.pathname === "/login")
    return <></>;

  // --- Filter links based on account type ---
  const accountType = user?.accountType;
  let filteredLinks = allLinks;

  if (accountType === "EMPLOYER") {
    filteredLinks = allLinks.filter(
      (link) => link.name !== "Find Jobs" && link.name !== "Job History"
    );
  } else if (accountType !== "EMPLOYER") {
    filteredLinks = allLinks.filter(
      (link) =>
        link.name !== "Find Talent" &&
        link.name !== "Post Job" &&
        link.name !== "Posted Jobs"
    );
  }

  const handleClick = (url: string) => {
    navigate(url);
    close();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0e1a]/95 shadow-[0_4px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      {/* Animated gradient border */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 animate-gradient-x" />
      <div className="mx-auto flex min-h-[68px] flex-wrap items-center justify-between gap-3 px-5 py-2.5 sm:px-8 lg:px-10 relative">
        {/* Brand Logo & badge */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate("/")}> 
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-400/20 via-orange-500/20 to-pink-500/20 blur-sm" />
            <img
              src={logoSrc}
              alt="AfroHR"
              className="relative h-11 w-auto drop-shadow-md"
            />
          </div>
          <div className="hidden h-8 w-px bg-gradient-to-b from-transparent via-amber-400/40 to-transparent sm:block" />
          <span className="hidden bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-[10px] font-bold uppercase tracking-[0.25em] text-transparent sm:block">
            Talent Network
          </span>
        </div>
        {/* Navigation Links */}
        <NavLinks links={filteredLinks} />
        {/* Profile / Login / Notifications / Burger */}
        <div className="flex gap-3 items-center">
          {user ? (
            <ProfileMenu colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
          ) : (
            <Link to="/login">
              <button className="min-h-10 rounded-lg border border-white/15 px-5 text-[13px] font-medium tracking-wide text-slate-200 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white">
                Login
              </button>
            </Link>
          )}
          {user && <NotiMenu />}
          {/* Mobile Burger */}
          <Burger className="bs:hidden" opened={opened} onClick={open} aria-label="Toggle navigation" />
          {/* Mobile Drawer */}
          <Drawer
            size="xs"
            overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
            position="right"
            opened={opened}
            onClose={close}
            closeButtonProps={{ icon: <IconX size={30} /> }}
          >
            <div className="flex flex-col gap-6 items-center">
              {filteredLinks.map((link, index) => (
                <div key={index} className="h-full flex items-center">
                  <div
                    className="hover:text-amber-400 text-xl transition-colors duration-200"
                    onClick={() => handleClick(link.url)}
                  >
                    {link.name}
                  </div>
                </div>
              ))}
            </div>
          </Drawer>
        </div>
      </div>
      {/* Shimmer animation */}
      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s linear infinite;
        }
      `}</style>
    </nav>
  );
};

export default Header;
