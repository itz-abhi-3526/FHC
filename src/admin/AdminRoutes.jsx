import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdmin } from "./components/RequireAdmin";
import { RequireAdminOnly } from "./components/RequireAdmin";
import AdminShell from "./components/AdminShell";

/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — nested route tree (lazy-loaded sections)

   RETAINED MODULES (backed by a real, required data pipeline):
   /admin              dashboard — live head-counts across real tables
   /admin/gallery      event-album media archive (ADMIN + MEDIA role)
   /admin/users        users + profiles        (ADMIN ONLY)
   /admin/applications join applications       (ADMIN ONLY)
   /admin/team         team roster             (ADMIN ONLY)
   /admin/settings     real system diagnostics + security audit (ADMIN ONLY)

   Removed modules (no table backs them in this project): events,
   activity (audit log), profiles (merged into users), projects, highlights,
   exports, content, system, site-content. Their paths now redirect to the
   closest live node instead of 404ing, and no admin UI issues requests for
   the missing tables.
   ════════════════════════════════════════════════════════════════════ */

const AdminDashboard = lazy(() => import("./pages/Dashboard"));
const AdminUsers = lazy(() => import("./pages/Users"));
const AdminApplications = lazy(() => import("./pages/Applications"));
const AdminTeam = lazy(() => import("./pages/Team"));
const AdminSettings = lazy(() => import("./pages/Settings"));
const AdminGallery = lazy(() => import("./pages/Gallery"));
const AdminGalleryAlbum = lazy(() => import("./pages/GalleryAlbum"));

function AdminNodeLoader() {
  return (
    <div className="ad-state" role="status" aria-live="polite">
      <span className="ad-spinner" aria-hidden="true" />
      <div className="ad-state-title ad-pixel">LOADING DATA NODE</div>
      <div className="ad-state-sub">MOUNTING ADMIN SECTION...</div>
    </div>
  );
}

export default function AdminRoutes() {
  return (
    <Suspense fallback={<AdminNodeLoader />}>
      <Routes>
        <Route element={<RequireAdmin />}>
          <Route element={<AdminShell />}>
            <Route index element={<AdminDashboard />} />
            {/* Gallery is visible to ADMIN + MEDIA roles. */}
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="gallery/:folderId" element={<AdminGalleryAlbum />} />
            {/* The rest of the control plane is ADMIN ONLY. */}
            <Route element={<RequireAdminOnly />}>
              <Route path="users" element={<AdminUsers />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/admin" replace />} />
            {/* Removed-module redirects (no 404s, no dead dangling URLs) */}
            <Route path="events" element={<Navigate to="/admin" replace />} />
            <Route path="activity" element={<Navigate to="/admin" replace />} />
            <Route path="profiles" element={<Navigate to="/admin/users" replace />} />
            <Route path="projects" element={<Navigate to="/admin" replace />} />
            <Route path="highlights" element={<Navigate to="/admin" replace />} />
            <Route path="exports" element={<Navigate to="/admin" replace />} />
            <Route path="system" element={<Navigate to="/admin/settings" replace />} />
            <Route path="content" element={<Navigate to="/admin/settings" replace />} />
            <Route path="site-content" element={<Navigate to="/admin/settings" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}