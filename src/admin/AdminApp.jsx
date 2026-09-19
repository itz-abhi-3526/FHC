import { AdminToastProvider } from "./lib/toast";
import AdminRoutes from "./AdminRoutes";
import "./admin.css";

/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — standalone full-screen app
   Mounted by App.jsx whenever the URL starts with /admin. Owns its own
   toast system and runs WITHOUT the public Navbar/Footer chrome.
   ════════════════════════════════════════════════════════════════════ */

export default function AdminApp() {
  return (
    <AdminToastProvider>
      <AdminRoutes />
    </AdminToastProvider>
  );
}