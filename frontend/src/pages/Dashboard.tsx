import {
  BadgeCheck,
  CheckSquare,
  FilePenLine,
  MoreHorizontal,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import {
  getBadgesFromData,
  getCompletedPomodoros,
  getTasksWithStatus,
  selectActivePomodoroTask,
  useChronusStore,
} from "@/stores/useChronusStore";

const statusClass: Record<string, string> = {
  "Em Andamento": "bg-amber-600/70 text-amber-50",
  Backlog: "border border-blue-200/60 bg-white/20 text-white/80",
  "A Fazer": "bg-blue-300 text-black",
  "Concluído": "bg-green-600/70 text-green-50",
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function Dashboard() {
  const pomodoro = useChronusStore((state) => state.pomodoro);
  const columns = useChronusStore((state) => state.columns);
  const togglePomodoro = useChronusStore((state) => state.togglePomodoro);
  const tasks = useMemo(() => getTasksWithStatus(columns), [columns]);
  const activeTask = useChronusStore(selectActivePomodoroTask);
  const assignedTasks = tasks.filter((task) => task.status !== "Concluído");
  const doneTasks = tasks.filter((task) => task.status === "Concluído");
  const badges = useMemo(
    () => getBadgesFromData(columns, pomodoro.sessions),
    [columns, pomodoro.sessions],
  );
  const latestUnlockedBadge = badges.find((badge) => badge.unlocked);
  const completedPomodoros = useMemo(
    () => getCompletedPomodoros(columns),
    [columns],
  );
  const onTimePercentage = tasks.length
    ? Math.round((tasks.filter((task) => task.onTime).length / tasks.length) * 100)
    : 0;
  const overviewCards: { icon: LucideIcon; value: string; label: string }[] = [
    {
      icon: FilePenLine,
      value: String(tasks.filter((task) => task.dueToday).length),
      label: "Tarefas hoje",
    },
    {
      icon: CheckSquare,
      value: String(doneTasks.length),
      label: "Tarefas concluídas",
    },
    {
      icon: Target,
      value: `${onTimePercentage}%`,
      label: "Entregas no prazo",
    },
    {
      icon: BadgeCheck,
      value: String(completedPomodoros),
      label: "Pomodoros concluídos",
    },
  ];

  return (
    <section className="mx-auto flex max-w-[960px] flex-col gap-5">
      <h1 className="text-2xl font-semibold">Visão geral</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            {assignedTasks.map((task) => (
            <div
              key={task.id}
              className="grid grid-cols-[72px_1fr_auto_24px] items-center gap-3 py-2.5 text-sm"
            >
              <strong className="text-primary-yellow">{task.code}</strong>
              <span className="min-w-0 truncate text-white/80">
                {task.title}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs ${statusClass[task.status]}`}
              >
                {task.status}
              </span>
              <button
                type="button"
                className="text-white/40 transition-colors hover:text-white"
                aria-label={`Mais opções de ${task.code}`}
              >
                <MoreHorizontal size={20} />
              </button>
              </div>
            ))}
            {assignedTasks.length === 0 && (
              <p className="py-6 text-center text-sm text-white/55">
                Nenhuma tarefa em aberto. Adicione tarefas no Kanban para
                preencher esta lista.
              </p>
            )}
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
              {latestUnlockedBadge?.title ?? "Nenhuma conquista desbloqueada"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-center text-sm text-white/65">
              {latestUnlockedBadge?.description ??
                "Conclua tarefas e ciclos de pomodoro para desbloquear badges."}
            </p>
          </div>
        </article>

        <article>
          <h2 className="mb-4 text-xl font-semibold">Pomodoro</h2>
          <div className="rounded-lg border border-white/15 bg-[#17161b] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs text-white/70">
                {activeTask?.code ?? "Sem tarefa"}
              </span>
              <span className="text-sm text-primary-yellow">Tarefa</span>
            </div>
            <p className="text-center text-sm text-white/70">
              {activeTask?.title ?? "Adicione ou selecione uma tarefa no Kanban"}
            </p>
            <div className="mx-auto my-5 grid h-32 w-32 place-items-center rounded-full border-4 border-white/25 border-r-primary-yellow">
              <strong className="text-3xl font-semibold">
                {formatTime(pomodoro.secondsLeft)}
              </strong>
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={togglePomodoro}
                disabled={!activeTask}
                className="rounded-lg bg-primary-yellow/20 px-5 py-2 text-sm font-semibold text-primary-yellow transition-colors hover:bg-primary-yellow hover:text-black disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary-yellow/20 disabled:hover:text-primary-yellow"
              >
                {pomodoro.isRunning ? "Pausar" : "Iniciar"}
              </button>
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
