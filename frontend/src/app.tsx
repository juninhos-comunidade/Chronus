import { useLocation } from "react-router-dom";
import { AppRoutes } from "./routes";
import { ToastContainer, toast } from "react-toastify";
import { Sidebar } from "./components/Sidebar";

export function App() {
  const location = useLocation();
  const hideSidebar = location.pathname === "/login";

  return (
    <div className="flex min-h-screen bg-[#090712]">
      {!hideSidebar && <Sidebar />}

      <main className="flex-1 overflow-y-auto">
        <AppRoutes />
      </main>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}
