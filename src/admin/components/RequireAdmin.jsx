import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, AUTH_STATUS } from "../../context/AuthContext";

/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — route guards
   1. Waits for Supabase auth initialization (no blank screens).
   2. No session            → /auth (login terminal).
   3. Session but not admin → /dashboard (member area). MEDIA users are
      intentionally sent here too — they manage the gallery from the
      PUBLIC media console (/media), never inside the admin panel.
   4. admin                 → <Outlet /> (the nested /admin tree).
   5. RequireAdminOnly wraps the admin-only sub-tree.

   Frontend role checks gate visibility only; the database (RLS + secure
   RPCs like admin_set_user_role / admin_dashboard_stats) enforces the
   actual privileges — never the server keys.
   ════════════════════════════════════════════════════════════════════ */

function AccessLoader({ label = "FHC // VERIFYING ACCESS", sub = "CHECKING AUTH CREDENTIALS + ADMIN MASK..." }) {
  return (
    <div className="admin-root ad-scope" style={{ position: "fixed", inset: 0 }}>
      <div className="ad-bg-grid" aria-hidden="true" />
      <div className="ad-bg-scan" aria-hidden="true" />
      <div className="ad-state" style={{ position: "absolute", inset: 0 }}>
        <span className="ad-spinner" aria-hidden="true" />
        <div className="ad-state-title ad-pixel">
          {label}
        </div>
        <div className="ad-state-sub">{sub}</div>
      </div>
    </div>
  );
}

export function RequireAdmin() {
  const { user, status, isAdmin, canManageGallery } = useAuth();
  const location = useLocation();

  if (status === AUTH_STATUS.LOADING) {
    return <AccessLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin) {
    /* Authenticated but not a full ADMIN — send to the member dashboard.
       This is deliberately stricter than before: MEDIA users previously
       slipped into the /admin tree (as staff). They do NOT belong here —
       their workspace is the PUBLIC Media Console at /media, and the
       Dashboard owns its entry point. The admin panel stays admin-only. */
    return <Navigate to="/dashboard" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

/* Admin-only gate for the sub-tree (users, applications, team, settings).
   Media users keep the gallery; the rest of the control plane redirects
   them back to their allowed workspace. */
export function RequireAdminOnly() {
  const { status, isAdmin } = useAuth();
  const location = useLocation();

  if (status === AUTH_STATUS.LOADING) {
    return <AccessLoader />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/gallery" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export default RequireAdmin;