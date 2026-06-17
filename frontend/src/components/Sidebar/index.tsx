import {
  LayoutDashboard,
  KanbanSquare,
  LineChart,
  Timer,
  BadgeCheck,
  ChevronDown,
  Plus,
  Settings,
  X,
} from "lucide-react";

type Workspace = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  {
    label: "Kanban",
    icon: KanbanSquare,
  },
  {
    label: "Métricas",
    icon: LineChart,
  },
  {
    label: "Pomodoro",
    icon: Timer,
  },
  {
    label: "Badges",
    icon: BadgeCheck,
  },
];

const workspaces: Workspace[] = [
  {
    id: "1",
    name: "Equipe Gerencia",
    initials: "EG",
    color: "bg-[var(--color-primary-yellow)] text-[var(--color-black)]",
  },
  {
    id: "2",
    name: "Equipe Projeto",
    initials: "EP",
    color: "bg-[var(--color-gray-mid)] text-[var(--color-white)]",
  },
];

export function Sidebar() {
  return (
    <aside className="w-65 min-h-screen shrink-0 border-r border-white/10 flex flex-col justify-between bg-gray-dark text-white">
      <div className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-center px-6 py-6">
          <img
            src="/images/logo-chronus.svg"
            alt="Logo Chronus"
            className="h-8"
          />
        </header>

        <nav className="mt-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors text-white/80 hover:text-[var(--color-white)] hover:bg-white/5 ${
                  item.active
                    ? "bg-[rgba(255,214,49,0.12)] text-primary-yellow border-l-4 border-primary-yellow"
                    : ""
                }`}
              >
                <Icon size={18} />

                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-3 px-4">
            <span className="text-xs text-[var(--color-white)]/60">
              Área de trabalho
            </span>

            <div className="flex items-center gap-2">
              <button className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[var(--color-white)]/70 hover:bg-white/20 transition-colors">
                <Plus size={14} />
              </button>

              <button className="text-[var(--color-primary-yellow)] hover:text-[var(--color-white)] transition-colors">
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          <div className="h-px bg-white/10 mb-4" />

          <div className="flex flex-col gap-3">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                className="flex items-center gap-3 px-4 py-1 text-sm text-[var(--color-white)]/80 hover:text-[var(--color-white)] hover:bg-white/5 transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold ${workspace.color}`}
                >
                  {workspace.initials}
                </div>

                <span>{workspace.name}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="https://i.pravatar.cc/100"
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover"
            />

            <div>
              <strong className="block text-sm text-[var(--color-white)]">
                Username
              </strong>
              <span className="text-xs text-[var(--color-white)]/60">
                example@gmail.com
              </span>
            </div>
          </div>

          <button className="text-[var(--color-white)]/70 hover:text-[var(--color-white)] transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </footer>
    </aside>
  );
}
