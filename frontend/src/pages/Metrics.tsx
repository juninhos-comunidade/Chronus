import { Activity, BarChart3, TrendingUp, type LucideIcon } from "lucide-react";

const metricCards: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: TrendingUp, value: "82%", label: "Entregas no prazo" },
  { icon: Activity, value: "37", label: "Pomodoros concluídos" },
  { icon: BarChart3, value: "59", label: "Tarefas finalizadas" },
];

function Metrics() {
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
