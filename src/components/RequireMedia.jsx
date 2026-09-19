import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, AUTH_STATUS } from "../context/AuthContext";

/* ════════════════════════════════════════════════════════════════════
   FHC // MEDIA — route guard (symmetrical to RequireAdmin)
   1. Waits for Supabase auth initialization.
   2. No session            → /auth (login terminal).
   3. Session, not media    → /dashboard (member area).
   4. media | admin         → <Outlet /> (the /media console).
   ════════════════════════════════════════════════════════════════════ */

export default function RequireMedia() {
  const { status, user, isMedia, isAdmin } = useAuth();
  const location = useLocation();

  if (status === AUTH_STATUS.LOADING) {
    return (
      <div className="mc-authgf" style={{ position: "fixed", inset: 0 }}>
        <div className="gf-state" aria-live="polite" aria-busy="true" role="status">
          <span className="gf-state-spin" aria-hidden="true" />
          <p className="gf-state-title">VERIFYING MEDIA ACCESS...</p>
          <p className="gf-state-sub">CHECKING AUTH CREDENTIALS + MEDIA MASK</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (!isMedia && !isAdmin) {
    return <Navigate to="/dashboard" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
