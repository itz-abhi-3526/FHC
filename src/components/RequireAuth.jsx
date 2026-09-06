import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="dash-loader">
        <div className="font-pixel text-[8px] tracking-[0.3em]" style={{ color: "#00E5FF" }}>
          <span className="dash-blink">█</span> VERIFYING MEMBER SESSION...
        </div>
      </div>
    );
  }

  if (status !== "authed") {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return children;
}