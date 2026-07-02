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
  Menu,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

import { useChronusStore } from "@/stores/useChronusStore";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Kanban",
    icon: KanbanSquare,
    path: "/kanban",
  },
  {
    label: "Métricas",
    icon: LineChart,
    path: "/metricas",
  },
  {
    label: "Pomodoro",
    icon: Timer,
    path: "/pomodoro",
  },
  {
    label: "Badges",
    icon: BadgeCheck,
    path: "/badges",
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const workspaces = useChronusStore((state) => state.workspaces);
  const currentUser = useChronusStore((state) => state.currentUser);

  return (
    <aside
      className={`min-h-screen shrink-0 border-r border-white/10 bg-gray-dark text-white transition-[width] duration-300 ${
        collapsed ? "w-[72px]" : "w-56"
      } flex flex-col justify-between`}
    >
      <div className="flex-1 overflow-y-auto">
        <header
          className={`flex items-center px-1 py-4 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed && (
            <img
              src="/images/logo-chronus.svg"
              alt="Logo Chronus"
              className="ml-4 h-7"
            />
          )}

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <Menu size={22} /> : <X size={17} />}
          </button>
        </header>

        <nav className="mt-1 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5 ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "border-l-4 border-primary-yellow bg-[rgba(255,214,49,0.12)] text-primary-yellow"
                      : "border-l-4 border-transparent text-white/80 hover:text-white"
                  }`
                }
              >
                <Icon size={17} />

                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* {!collapsed && (
          <section className="mt-6">
            <div className="mb-2 flex items-center justify-between px-4">
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

            <div className="mb-3 h-px bg-white/10" />

            <div className="flex flex-col gap-2">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  className="flex items-center gap-2.5 px-4 py-1 text-sm text-[var(--color-white)]/80 transition-colors hover:bg-white/5 hover:text-[var(--color-white)]"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold ${workspace.color}`}
                  >
                    {workspace.initials}
                  </div>

                  <span>{workspace.name}</span>
                </button>
              ))}
            </div>
          </section>
        )} */}
      </div>

      <footer className="border-t border-white/10 bg-[rgba(255,255,255,0.04)] p-3">
        <div
          className={`flex items-center gap-3 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl}
              alt="Avatar"
              className="h-9 w-9 rounded-full object-cover"
            />

            {!collapsed && (
              <div>
                <strong className="block text-sm text-[var(--color-white)]">
                  {currentUser.name}
                </strong>
                <span className="text-xs text-[var(--color-white)]/60">
                  {currentUser.email}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button className="text-[var(--color-white)]/70 hover:text-[var(--color-white)] transition-colors">
              <Settings size={18} />
            </button>
          )}
        </div>
      </footer>
    </aside>
  );
}
