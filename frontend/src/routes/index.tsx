import { Navigate, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Dashboard from "@/pages/Dashboard";
import Kanban from "@/pages/Kanban";
import Metrics from "@/pages/Metrics";
import Pomodoro from "@/pages/Pomodoro";
import Badges from "@/pages/Badges";

import { AuthGuard } from "@/guards/AuthGuard";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* <Route
        path="/"
        element={
          <AuthGuard>
            <Home />
          </AuthGuard>
        }
      /> */}
      <Route path="/" element={<Home />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="kanban" element={<Kanban />} />
        <Route path="metricas" element={<Metrics />} />
        <Route path="pomodoro" element={<Pomodoro />} />
        <Route path="badges" element={<Badges />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
