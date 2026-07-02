import { Activity, BarChart3, TrendingUp, type LucideIcon } from "lucide-react";
import { useMemo } from "react";

import { getTasksWithStatus, useChronusStore } from "@/stores/useChronusStore";

function Metrics() {
  const columns = useChronusStore((state) => state.columns);
  const tasks = useMemo(() => getTasksWithStatus(columns), [columns]);
  const completedPomodoros = useChronusStore(
    (state) => state.pomodoro.completedTotal,
  );
  const onTimePercentage = tasks.length
    ? Math.round((tasks.filter((task) => task.onTime).length / tasks.length) * 100)
    : 0;
  const metricCards: { icon: LucideIcon; value: string; label: string }[] = [
    {
      icon: TrendingUp,
      value: `${onTimePercentage}%`,
      label: "Entregas no prazo",
    },
    {
      icon: Activity,
      value: String(completedPomodoros),
      label: "Pomodoros concluídos",
    },
    {
      icon: BarChart3,
      value: String(tasks.filter((task) => task.status === "Concluído").length),
      label: "Tarefas finalizadas",
    },
  ];

  return (
    <section className="mx-auto max-w-[960px]">
      <h1 className="mb-5 text-2xl font-semibold">Métricas</h1>
      <div className="grid gap-3 md:grid-cols-3">
        {metricCards.map(({ icon: Icon, value, label }) => (
          <article
            key={label}
            className="rounded-lg border border-white/15 bg-[#17161b] p-4"
          >
            <Icon className="mb-4 text-primary-yellow" size={28} />
            <strong className="block text-3xl">{value}</strong>
            <span className="mt-1.5 block text-sm text-white/65">{label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Metrics;
