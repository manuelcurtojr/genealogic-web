/**
 * AboutContent — render del about_md del criadero.
 *
 * Detecta automáticamente si el contenido tiene formato de "hitos"
 * (`**YYYY · Título**` seguido de descripción) y, si los hay, los
 * pinta como una timeline editorial vertical con el año destacado
 * a la izquierda y el evento a la derecha.
 *
 * Soporta:
 *  - Hitos tipo Markdown bold:
 *      **1975 · Se concede el afijo**
 *      El 4 de noviembre de 1975, ...
 *  - Párrafos normales (intro, secciones libres)
 *  - Negrita inline con **texto** en párrafos no-hito
 *  - Rangos de años: **1980-2000 · 20 años escribiendo...**
 *
 * NO soporta:
 *  - HTML arbitrario (defensivo)
 *  - Headings reales (#, ##), listas, código (no se necesitan)
 *
 * Usado tanto en el preview del editor como en la página pública.
 */
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'milestone'; year: string; title: string; body: string }

// **YYYY · Título** o **YYYY-YYYY · Título**.
// Sin anclas: lo aplicamos sobre la PRIMERA línea de cada párrafo.
const TIMELINE_HEADING_RE = /^\*\*(\d{4}(?:-\d{4})?)\s*[·•—-]\s*([^*\n]+?)\*\*\s*$/

function parseAboutMd(markdown: string): Block[] {
  const paragraphs = markdown.trim().split(/\n\n+/).filter(Boolean)
  const blocks: Block[] = []
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim()
    if (!p) continue

    // Caso A: el párrafo tiene el encabezado en la primera línea y el cuerpo
    // en las siguientes (más común — así escribe Irema):
    //   **1975 · Título**\nDescripción del hito
    const lines = p.split('\n')
    const firstLineHeading = lines[0].trim().match(TIMELINE_HEADING_RE)
    if (firstLineHeading) {
      const year = firstLineHeading[1]
      const title = firstLineHeading[2].trim()
      const body = lines.slice(1).join('\n').trim()
      blocks.push({ type: 'milestone', year, title, body })
      continue
    }

    // Caso B: el encabezado es un párrafo solo, y el siguiente párrafo es
    // su descripción. Soportado por si en el futuro alguien escribe así.
    const single = p.match(TIMELINE_HEADING_RE)
    if (single) {
      const year = single[1]
      const title = single[2].trim()
      const next = i + 1 < paragraphs.length ? paragraphs[i + 1].trim() : ''
      const isNextHeading = next.split('\n')[0].match(TIMELINE_HEADING_RE)
      const body = next && !isNextHeading ? next : ''
      if (body) i++
      blocks.push({ type: 'milestone', year, title, body })
      continue
    }

    // Caso C: párrafo normal (intro, transiciones, secciones libres)
    blocks.push({ type: 'paragraph', text: p })
  }
  return blocks
}

export default async function AboutContent({ markdown }: { markdown: string }) {
  const t = getTranslator(await getLocale())
  const blocks = parseAboutMd(markdown)
  const milestoneCount = blocks.filter(b => b.type === 'milestone').length
  // Solo activamos timeline si hay al menos 2 hitos. Con 0 ó 1 el render
  // plano queda mejor (no merece la pena el chrome de la línea).
  const useTimeline = milestoneCount >= 2

  if (!useTimeline) {
    return (
      <article className="space-y-4 text-[15px] sm:text-[16px] text-body leading-[1.65] max-w-prose">
        {blocks.map((b, i) => (
          <p key={i} className="whitespace-pre-line">{renderInline(b.type === 'milestone' ? `**${b.year} · ${b.title}**\n${b.body}` : b.text)}</p>
        ))}
      </article>
    )
  }

  // Separamos intro (párrafos sueltos al principio antes del primer hito)
  // del resto. La intro va con estilo lead grande; los hitos en timeline;
  // los párrafos sueltos entre hitos van como separadores narrativos.
  const firstMilestoneIdx = blocks.findIndex(b => b.type === 'milestone')
  const intro = blocks.slice(0, firstMilestoneIdx).filter(b => b.type === 'paragraph') as Array<{ type: 'paragraph'; text: string }>
  const rest = blocks.slice(firstMilestoneIdx)

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* Intro: párrafo lead grande, con drop-cap sutil en el primer carácter */}
      {intro.length > 0 && (
        <div className="space-y-4 max-w-prose">
          {intro.map((p, i) => (
            <p
              key={i}
              className={`whitespace-pre-line text-body leading-[1.6] ${
                i === 0
                  ? 'text-[17px] sm:text-[19px] text-ink/85 font-normal first-letter:text-[44px] sm:first-letter:text-[52px] first-letter:font-semibold first-letter:tracking-[-0.04em] first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:leading-[0.9] first-letter:text-[#FE6620]'
                  : 'text-[15px] sm:text-[16px]'
              }`}
            >
              {renderInline(p.text)}
            </p>
          ))}
        </div>
      )}

      {/* Timeline de hitos */}
      <section>
        <div className="mb-6 sm:mb-8">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#FE6620]">
            {t('Línea del tiempo')}
          </p>
          <h2 className="mt-1.5 text-[22px] sm:text-[28px] font-semibold tracking-[-0.03em] text-ink leading-[1.15]">
            {milestoneCount} {t('hitos que marcaron la historia')}
          </h2>
        </div>

        <ol className="relative">
          {/* Línea vertical continua. Posicionada en col de los años (~88px). */}
          <span
            aria-hidden
            className="absolute left-[7px] sm:left-[88px] top-2 bottom-2 w-px bg-hairline"
          />
          <div className="space-y-7 sm:space-y-8">
            {rest.map((b, i) => {
              if (b.type === 'paragraph') {
                // Párrafo de transición entre hitos — no muy común pero soportado
                return (
                  <li key={i} className="pl-7 sm:pl-[120px] text-body italic text-[14.5px] leading-[1.6]">
                    {renderInline(b.text)}
                  </li>
                )
              }
              return (
                <li key={i} className="relative grid grid-cols-1 sm:grid-cols-[88px_1fr] gap-x-8 gap-y-1 pl-7 sm:pl-0">
                  {/* Punto */}
                  <span
                    aria-hidden
                    className="absolute left-0 sm:left-[81px] top-[7px] h-3.5 w-3.5 rounded-full bg-canvas border-2 border-[#FE6620]"
                  />
                  {/* Año — col izquierda, alineado a la derecha en desktop */}
                  <p className="text-[14px] sm:text-[15px] font-bold tabular-nums tracking-[-0.01em] text-ink sm:text-right sm:leading-[1.4]">
                    {b.year}
                  </p>
                  {/* Hito */}
                  <div>
                    <h3 className="text-[15px] sm:text-[16.5px] font-semibold text-ink leading-snug tracking-[-0.015em]">
                      {b.title}
                    </h3>
                    {b.body && (
                      <p className="mt-1.5 text-[14px] sm:text-[15px] text-body leading-[1.6] whitespace-pre-line max-w-prose">
                        {renderInline(b.body)}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </div>
        </ol>
      </section>
    </div>
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
