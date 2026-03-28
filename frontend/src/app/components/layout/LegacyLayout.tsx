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
    <div data-mantine-color-scheme={colorScheme} className="min-h-screen">
        <Notifications position="top-center" zIndex={2001} />
        <div className="relative overflow-hidden">
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
          <Outlet />
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
