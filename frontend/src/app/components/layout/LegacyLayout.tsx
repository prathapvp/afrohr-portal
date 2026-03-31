/**
 * LegacyLayout – bridge component that provides Redux, Header, Footer,
 * loading overlay, and AOS init for all legacy portal routes.
 *
 * MantineProvider + theme are injected at root level (main.tsx).
 * Legacy routes are nested inside this layout via <Outlet />.
 */
import { createContext, useContext, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

/** Context so nested legacy pages can read colorScheme */
export const LegacyThemeCtx = createContext<"light" | "dark">("light");
export const useLegacyColorScheme = () => useContext(LegacyThemeCtx);
import { LoadingOverlay } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { Provider, useSelector } from "react-redux";
import "@mantine/core/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/tiptap/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import AOS from "aos";
import "aos/dist/aos.css";
import "../../App.css";
import "../../../styles/index.css";
import Store from "../../store";
import PremiumNavbar from "./PremiumNavbar";
import ErrorBoundary from "./common/ErrorBoundary";

function LegacyShell() {
  const overlay = useSelector((state: any) => state.overlay);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");
  const toggleColorScheme = () =>
    setColorScheme((prev) => (prev === "dark" ? "light" : "dark"));

  useEffect(() => {
    AOS.init({ offset: 0, duration: 800, easing: "ease-out" });
    AOS.refresh();
  }, []);

  return (
    <LegacyThemeCtx.Provider value={colorScheme}>
    <div data-mantine-color-scheme={colorScheme} className="premium-shell min-h-screen">
        <Notifications position="top-center" zIndex={2001} />
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-bright-sun-400/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-36 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-pink-500/15 blur-3xl" />
          {overlay && (
            <div className="fixed !z-[2000] w-full h-full flex items-center justify-center">
              <LoadingOverlay
                visible={overlay}
                zIndex={2000}
                overlayProps={{ radius: "sm", blur: 2 }}
                loaderProps={{ color: "brightSun.4", type: "bars" }}
              />
            </div>
          )}
          <PremiumNavbar />
          <div className="mx-auto w-full max-w-[1500px] px-2 pb-4 pt-3 sm:px-4">
            <div className="premium-surface overflow-hidden rounded-3xl">
              <Outlet />
            </div>
          </div>
        </div>
    </div>
    </LegacyThemeCtx.Provider>
  );
}

export default function LegacyLayout() {
  return (
    <ErrorBoundary>
      <Provider store={Store}>
        <LegacyShell />
      </Provider>
    </ErrorBoundary>
  );
}
