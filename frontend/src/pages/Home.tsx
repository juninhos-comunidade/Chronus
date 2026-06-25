import HeaderApp from "../components/HeaderApp";
import { Sidebar } from "@/components/Sidebar";
import { Outlet } from "react-router-dom";

function Home() {
  return (
    <div className="flex min-h-screen bg-[#090712] text-[var(--color-white)]">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-hidden">
        <HeaderApp />
        <div className="h-[calc(100vh-60px)] overflow-auto px-5 pb-6 lg:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Home;
