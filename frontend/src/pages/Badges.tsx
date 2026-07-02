import { BadgeCheck, Medal, ShieldCheck, type LucideIcon } from "lucide-react";

import { useChronusStore, type BadgeIcon } from "@/stores/useChronusStore";

const badgeIcons: Record<BadgeIcon, LucideIcon> = {
  badgeCheck: BadgeCheck,
  medal: Medal,
  shieldCheck: ShieldCheck,
};

function Badges() {
  const badges = useChronusStore((state) => state.badges);

  return (
    <section className="mx-auto max-w-[960px]">
      <h1 className="mb-5 text-2xl font-semibold">Badges</h1>
      <div className="grid gap-3 md:grid-cols-3">
        {badges.map(({ icon, title, description }) => {
          const Icon = badgeIcons[icon];

          return (
            <article
              key={title}
              className="rounded-lg border border-white/15 bg-[#17161b] p-4 text-center"
            >
              <Icon className="mx-auto mb-4 text-primary-yellow" size={40} />
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm text-white/65">{description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Badges;
