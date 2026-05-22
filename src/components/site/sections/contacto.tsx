// ──────────────────────────────────────────────────────────────────────
// Sección: contact-form
// ──────────────────────────────────────────────────────────────────────
export function ContactFormSection({
  headline = 'Cuéntanos',
  subjectOptions,
}: {
  headline?: string;
  subjectOptions?: string[];
}) {
  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-2xl px-6 py-24">
        <h2 data-pawdoq-edit="headline" className="font-serif text-4xl mb-8 text-center">{headline}</h2>
        <form
          action="/api/contact"
          method="post"
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-5"
        >
          <Field name="full_name" label="Nombre" required />
          <Field name="email" label="Email" type="email" required />
          <Field name="phone" label="Teléfono (opcional)" type="tel" />
          {subjectOptions && subjectOptions.length > 0 && (
            <label className="block">
              <span className="text-xs font-mono uppercase tracking-widest text-brand-400/80">
                Tema
              </span>
              <select
                name="subject"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-brand-400/40"
              >
                {subjectOptions.map((s) => (
                  <option key={s} value={s} className="bg-neutral-900">
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="text-xs font-mono uppercase tracking-widest text-brand-400/80">
              Mensaje
            </span>
            <textarea
              name="message"
              required
              rows={5}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-400/40"
              placeholder="Cuéntanos lo que necesites — cachorro, raza, visita, etc."
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-brand-300 transition"
          >
            Enviar mensaje
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-widest text-brand-400/80">
        {label}
        {required && <span className="ml-1 text-brand-300">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-400/40"
      />
    </label>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sección: contact-info
// ──────────────────────────────────────────────────────────────────────
export function ContactInfoSection({
  address,
  phone,
  email,
  hours,
}: {
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
}) {
  const items: { label: string; value: string }[] = [];
  if (address) items.push({ label: 'Dirección', value: address });
  if (phone) items.push({ label: 'Teléfono', value: phone });
  if (email) items.push({ label: 'Email', value: email });
  if (hours) items.push({ label: 'Horario', value: hours });
  if (items.length === 0) return null;

  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-3xl px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {items.map((it) => (
          <div key={it.label}>
            <p className="text-xs font-mono uppercase tracking-widest text-white/40">
              {it.label}
            </p>
            <p className="mt-2 text-white/85 text-sm leading-relaxed">{it.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sección: map-embed
// ──────────────────────────────────────────────────────────────────────
export function MapEmbedSection({
  address,
}: {
  address: string;
}) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  return (
    <section className="border-t border-white/10">
      <div className="aspect-[16/9] w-full bg-neutral-900">
        <iframe
          src={src}
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Mapa"
        />
      </div>
    </section>
  );
}
