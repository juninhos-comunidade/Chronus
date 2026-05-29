import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "../hooks/useAuth";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { loading, isAuthenticated } = useAuth();

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
