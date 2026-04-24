import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Loader } from "./Loader";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, setupComplete, authenticated } = useAuth();

  if (loading) {
    return <Loader fullPage />;
  }
  if (!setupComplete) {
    return <Navigate to="/setup" replace />;
  }
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
