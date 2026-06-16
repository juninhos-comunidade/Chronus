import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";

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
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
