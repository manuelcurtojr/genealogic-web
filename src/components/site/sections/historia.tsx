import { HeroBackground } from './common';

// ──────────────────────────────────────────────────────────────────────
// Sección: story-hero
// ──────────────────────────────────────────────────────────────────────
export function StoryHeroSection({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative isolate">
      <HeroBackground />
      <div className="mx-auto max-w-3xl px-6 pt-32 pb-20 text-center">
        {eyebrow && (
          <p data-pawdoq-edit="eyebrow" className="text-sm tracking-[0.3em] uppercase text-brand-400/80">{eyebrow}</p>
        )}
        <h1 data-pawdoq-edit="title" className="mt-6 font-serif text-5xl md:text-7xl leading-[1.05]">{title}</h1>
        {subtitle && (
          <p data-pawdoq-edit="subtitle" className="mt-8 text-lg text-white/80 leading-relaxed">{subtitle}</p>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sección: timeline
// ──────────────────────────────────────────────────────────────────────
type Milestone = { year: string; title: string; body: string };

export function TimelineSection({ milestones }: { milestones: Milestone[] }) {
  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <ol className="relative border-l border-white/15 pl-8 space-y-14">
          {milestones.map((m, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[37px] top-2 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-black" />
              <p data-pawdoq-edit={`milestones[${i}].year`} className="text-brand-400 text-sm tracking-widest uppercase">{m.year}</p>
              <h2 data-pawdoq-edit={`milestones[${i}].title`} className="mt-2 font-serif text-2xl md:text-3xl">{m.title}</h2>
              <p data-pawdoq-edit={`milestones[${i}].body`} className="mt-3 text-white/70 leading-relaxed">{m.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sección: team
// ──────────────────────────────────────────────────────────────────────
type Member = { name: string; role: string; bio: string; photo?: string };

export function TeamSection({
  eyebrow,
  title,
  members,
}: {
  eyebrow?: string;
  title?: string;
  members: Member[];
}) {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-4xl px-6 py-24">
        {(eyebrow || title) && (
          <div className="text-center mb-16">
            {eyebrow && (
              <p data-pawdoq-edit="eyebrow" className="text-sm tracking-[0.3em] uppercase text-brand-400/80">{eyebrow}</p>
            )}
            {title && (
              <h2 data-pawdoq-edit="title" className="mt-4 font-serif text-4xl md:text-5xl">{title}</h2>
            )}
          </div>
        )}
        <div className="space-y-20">
          {members.map((m, i) => (
            <article key={m.name} className="border-b border-white/10 pb-20 last:border-0">
              <p data-pawdoq-edit={`members[${i}].role`} className="text-brand-400 text-sm tracking-widest uppercase">{m.role}</p>
              <h3 data-pawdoq-edit={`members[${i}].name`} className="mt-3 font-serif text-4xl md:text-5xl">{m.name}</h3>
              <p data-pawdoq-edit={`members[${i}].bio`} className="mt-6 text-white/75 leading-relaxed text-lg">{m.bio}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
