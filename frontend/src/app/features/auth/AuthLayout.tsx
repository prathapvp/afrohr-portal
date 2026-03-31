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
    <div className="premium-shell min-h-screen">
      <Notifications position="top-center" zIndex={2001} />
      <PremiumNavbar />
      <div className="mx-auto w-full max-w-[1500px] px-2 pb-4 pt-3 sm:px-4">
        <div className="premium-surface rounded-3xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
