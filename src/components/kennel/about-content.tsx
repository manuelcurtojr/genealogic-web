/**
 * AboutContent — render conservador del about_md del criadero.
 *
 * Soporta:
 *  - Párrafos (doble salto de línea)
 *  - Negrita inline con **texto**
 *  - Saltos de línea simples dentro del párrafo
 *
 * NO soporta:
 *  - HTML arbitrario (defensivo: el contenido lo escribe el criador)
 *  - Headings, listas, código (no los necesitamos por ahora)
 *
 * Usado tanto en el preview del editor como en la página pública.
 */
export default function AboutContent({ markdown }: { markdown: string }) {
  const paragraphs = markdown.split(/\n\n+/)
  return (
    <article className="space-y-4 text-[15px] sm:text-[16px] text-body leading-[1.65] max-w-prose">
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">{renderInline(p)}</p>
      ))}
    </article>
  )
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const re = /\*\*([^*]+)\*\*/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index))
    parts.push(
      <strong key={key++} className="text-ink font-semibold">
        {m[1]}
      </strong>,
    )
    lastIndex = re.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length ? parts : text
}
