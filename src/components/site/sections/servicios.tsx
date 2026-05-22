import Link from 'next/link';

// ──────────────────────────────────────────────────────────────────────
// Sección: services-grid
// ──────────────────────────────────────────────────────────────────────
type Service = {
  icon?: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
};

export function ServicesGridSection({ services }: { services: Service[] }) {
  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <li
              key={i}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition hover:border-brand-400/40 hover:bg-white/[0.04]"
            >
              {s.icon && (
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-600/10 text-brand-400">
                  <ServiceIcon name={s.icon} />
                </div>
              )}
              <h3 data-pawdoq-edit={`services[${i}].title`} className="font-serif text-2xl text-white">{s.title}</h3>
              <p data-pawdoq-edit={`services[${i}].body`} className="mt-3 text-white/70 leading-relaxed flex-1">{s.body}</p>
              {s.cta && (
                <Link
                  href={s.cta.href}
                  className="mt-6 inline-flex self-start text-sm uppercase tracking-widest text-brand-400 hover:text-brand-300"
                >
                  {s.cta.label} →
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ServiceIcon({ name }: { name: string }) {
  // SVGs mínimos por nombre. Si llega uno desconocido, círculo.
  const common = 'w-6 h-6';
  if (name === 'horse')
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l3-3 3 3-1 4M14 21l3-7 3 1-3 6M5 14V8c0-2 1-4 3-4M21 8c-2 0-4 1-5 3M9 8c1 0 2-1 2-2M14 6c1 0 2 1 2 2" />
      </svg>
    );
  if (name === 'book')
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h11a4 4 0 014 4v12H8a4 4 0 01-4-4V4zM4 17h12" />
      </svg>
    );
  if (name === 'advice')
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 8v4M12 16h.01" />
      </svg>
    );
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}
