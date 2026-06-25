import { Bell } from "lucide-react";

function HeaderApp() {
  return (
    <header className="flex h-[60px] items-center justify-end gap-4 px-5 lg:px-6">
      <button
        type="button"
        className="relative text-primary-yellow transition-colors hover:text-white"
        aria-label="Notificações"
      >
        <Bell size={22} />
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          12
        </span>
      </button>
    </header>
  );
}

export default HeaderApp;
