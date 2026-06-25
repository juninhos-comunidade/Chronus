import {
  BadgeCheck,
  CheckSquare,
  FilePenLine,
  MoreHorizontal,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

const assignedTasks = [
  ["ID 203", "Levantar requisitos do sistema", "Em andamento"],
  ["ID 243", "Elaborar documentação da API", "Backlog"],
  ["ID 222", "Definir identidade visual do projeto", "Revisão"],
  ["ID 237", "Implementar autenticação de usuários", "Em andamento"],
];

const overviewCards: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: FilePenLine, value: "6", label: "Tarefas hoje" },
  { icon: CheckSquare, value: "59", label: "Tarefas concluídas" },
  { icon: Target, value: "82%", label: "Entregas no prazo" },
];

const statusClass: Record<string, string> = {
  "Em andamento": "bg-amber-600/70 text-amber-50",
  Backlog: "border border-blue-200/60 bg-white/20 text-white/80",
  Revisão: "bg-blue-300 text-black",
};

function Dashboard() {
  return (
    <section className="mx-auto flex max-w-[960px] flex-col gap-5">
      <h1 className="text-2xl font-semibold">Visão geral</h1>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {overviewCards.map(({ icon: Icon, value, label }) => (
          <article
            key={label}
            className="rounded-lg border border-white/15 bg-[#17161b] p-4"
          >
            <Icon className="mb-4 text-primary-yellow" size={28} />
            <strong className="block text-3xl font-semibold">{value}</strong>
            <span className="mt-1.5 block text-xs font-semibold uppercase text-white/70">
              {label}
            </span>
          </article>
        ))}
      </div>

      <article className="rounded-lg border border-white/15 bg-[#17161b] p-5">
        <h2 className="mb-5 text-xl font-semibold">
          Tarefas atribuídas à você
        </h2>

        <div className="divide-y divide-white/10">
          {assignedTasks.map(([id, title, status]) => (
            <div
              key={id}
              className="grid grid-cols-[72px_1fr_auto_24px] items-center gap-3 py-2.5 text-sm"
            >
              <strong className="text-primary-yellow">{id}</strong>
              <span className="min-w-0 truncate text-white/80">{title}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs ${statusClass[status]}`}
              >
                {status}
              </span>
              <button
                type="button"
                className="text-white/40 transition-colors hover:text-white"
                aria-label={`Mais opções de ${id}`}
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
          ))}
        </div>
      </article>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
        <article>
          <h2 className="mb-4 text-xl font-semibold">Conquistas recentes</h2>
          <div className="rounded-lg border border-white/15 bg-[#17161b] p-5">
            <div className="mb-5 grid h-18 place-items-center rounded-lg bg-[linear-gradient(90deg,rgba(255,255,255,0.14),rgba(255,214,49,0.10))]">
              <BadgeCheck size={48} className="text-primary-yellow" />
            </div>
            <h3 className="text-center text-lg font-semibold">
              Mestre Cronista
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-center text-sm text-white/65">
              Sua produtividade já deixa registros dignos da história.
            </p>
          </div>
        </article>

        <article>
          <h2 className="mb-4 text-xl font-semibold">Pomodoro</h2>
          <div className="rounded-lg border border-white/15 bg-[#17161b] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs text-white/70">
                ID 203
              </span>
              <span className="text-sm text-primary-yellow">Tarefa</span>
            </div>
            <p className="text-center text-sm text-white/70">
              Sprint 3: Levantar requisitos do sistema
            </p>
            <div className="mx-auto my-5 grid h-32 w-32 place-items-center rounded-full border-4 border-white/25 border-r-primary-yellow">
              <strong className="text-3xl font-semibold">12:50</strong>
            </div>
            <div className="flex justify-center gap-3">
              <Link
                to="/pomodoro"
                className="rounded-lg bg-primary-yellow/20 px-5 py-2 text-sm font-semibold text-primary-yellow transition-colors hover:bg-primary-yellow hover:text-black"
              >
                Pausar
              </Link>
              <Link
                to="/pomodoro"
                className="rounded-lg bg-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/30 hover:text-white"
              >
                Abrir
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default Dashboard;
