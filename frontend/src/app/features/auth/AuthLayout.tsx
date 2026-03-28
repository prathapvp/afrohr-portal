/**
 * AuthLayout – lightweight provider for auth pages (signup/login).
 * Provides Redux store + Notification layer, no Header/Footer.
 * MantineProvider + theme are injected at root level (main.tsx).
 */
import { Outlet } from "react-router-dom";
import { Notifications } from "@mantine/notifications";
import { Provider } from "react-redux";
import PremiumNavbar from "../../components/layout/PremiumNavbar";
import "@mantine/notifications/styles.css";
import Store from "../../store";

export default function AuthLayout() {
  return (
    <Provider store={Store}>
      <Notifications position="top-center" zIndex={2001} />
      <PremiumNavbar />
      <Outlet />
    </Provider>
  );
}
