/**
 * Renderer markdown minimalista para contratos.
 * Subset cubierto: H1-H3, **bold**, *italic*, listas (- y 1.), separador `---`,
 * párrafos, links [texto](url). Suficiente para contratos legales.
 *
 * Por qué no usar lib externa (marked/markdown-it):
 *  - Contratos no necesitan tablas/code blocks/etc.
 *  - Cero deps nuevas. Si más adelante el cliente necesita riqueza
 *    (color, tablas, imágenes), migramos a TipTap o marked.
 *
 * Escape XSS: escapamos HTML del input ANTES de aplicar las reglas (los
 * tokens markdown se reaplican como tags seguros).
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function inline(s: string): string {
  // Links primero (antes de bold/italic que tienen * **)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) => {
    const safeUrl = url.replace(/"/g, '%22')
    return `<a href="${safeUrl}" target="_blank" rel="noreferrer" class="underline">${text}</a>`
  })
  // Bold
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // Italic (después de bold para no chocar)
  s = s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  return s
}

export function renderContractMarkdown(input: string): string {
  if (!input) return ''
  const escaped = escapeHtml(input)
  const lines = escaped.split(/\r?\n/)
  const out: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    out.push(`<p>${inline(paragraph.join(' '))}</p>`)
    paragraph = []
  }
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`)
      listType = null
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (!line.trim()) {
      flushParagraph()
      closeList()
      continue
    }

    if (line.trim() === '---') {
      flushParagraph()
      closeList()
      out.push('<hr />')
      continue
    }

    const h3 = line.match(/^### (.+)/)
    const h2 = line.match(/^## (.+)/)
    const h1 = line.match(/^# (.+)/)
    if (h1) {
      flushParagraph(); closeList()
      out.push(`<h1>${inline(h1[1])}</h1>`)
      continue
    }
    if (h2) {
      flushParagraph(); closeList()
      out.push(`<h2>${inline(h2[1])}</h2>`)
      continue
    }
    if (h3) {
      flushParagraph(); closeList()
      out.push(`<h3>${inline(h3[1])}</h3>`)
      continue
    }

    const olItem = line.match(/^\s*\d+\.\s+(.+)/)
    const ulItem = line.match(/^\s*[-*]\s+(.+)/)
    if (ulItem) {
      flushParagraph()
      if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul' }
      out.push(`<li>${inline(ulItem[1])}</li>`)
      continue
    }
    if (olItem) {
      flushParagraph()
      if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol' }
      out.push(`<li>${inline(olItem[1])}</li>`)
      continue
    }

    closeList()
    paragraph.push(line.trim())
  }
  flushParagraph()
  closeList()

  return out.join('\n')
}

/**
 * Devuelve el texto plano (sin tokens markdown). Útil para `body_text`
 * search-friendly y para el snapshot del PDF.
 */
export function contractMarkdownToPlain(input: string): string {
  return input
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^---$/gm, '———')
    .trim()
}
