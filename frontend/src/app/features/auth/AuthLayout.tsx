/**
 * AuthLayout – lightweight provider for auth pages (signup/login).
 * Provides Redux store + Notification layer, no Header/Footer.
 * MantineProvider + theme are injected at root level (main.tsx).
 */
import { Outlet } from "react-router";
import { Notifications } from "@mantine/notifications";
import PremiumNavbar from "../../components/layout/PremiumNavbar";
import "@mantine/notifications/styles.css";

export default function AuthLayout() {
  return (
    <div className="premium-shell flex min-h-screen flex-col">
      <Notifications position="top-center" zIndex={2001} />
      <div className="relative z-50">
        <PremiumNavbar />
      </div>
      <div className="mx-auto w-full max-w-[1500px] flex-1 overflow-y-auto px-2 pb-4 pt-3 sm:px-4">
        <div className="premium-surface rounded-3xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
