import { BadgeCheck, Medal, ShieldCheck, type LucideIcon } from "lucide-react";

const badgeCards: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: BadgeCheck,
    title: "Mestre Cronista",
    description: "Produtividade constante.",
  },
  {
    icon: Medal,
    title: "Sprint de Ouro",
    description: "Todas as entregas no prazo.",
  },
  {
    icon: ShieldCheck,
    title: "Guardião do Foco",
    description: "Ciclos pomodoro completos.",
  },
];

function Badges() {
  return (
    <section className="mx-auto max-w-[960px]">
      <h1 className="mb-5 text-2xl font-semibold">Badges</h1>
      <div className="grid gap-3 md:grid-cols-3">
        {badgeCards.map(({ icon: Icon, title, description }) => (
          <article
            key={title}
            className="rounded-lg border border-white/15 bg-[#17161b] p-4 text-center"
          >
            <Icon className="mx-auto mb-4 text-primary-yellow" size={40} />
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1.5 text-sm text-white/65">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Badges;
