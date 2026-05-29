import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard"; // Página criada para teste do AuthGuard, sinta-se livre para excluir ou modificar
import Login from "../pages/Login";

import { AuthGuard } from "@/guards/AuthGuard";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard" // Rota criada para teste do AuthGuard, sinta-se livre para excluir ou modificar
        element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        }
      />
    </Routes>
  );
}
