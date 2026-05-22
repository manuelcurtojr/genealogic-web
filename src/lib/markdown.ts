/**
 * Mini-renderer Markdown → HTML server-side, sin dependencias.
 * Cubre lo básico para las páginas Pro del criador: headings, listas,
 * negrita, cursiva, links, líneas en blanco. Suficientemente seguro
 * porque solo lo edita el criador autenticado (no input público).
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
  // Escape primero
  let out = escapeHtml(s)
  // links [text](url) — solo http(s) y mailto
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
    (_m, text, url) => `<a href="${url}" class="text-ink underline hover:no-underline" rel="noopener noreferrer">${text}</a>`,
  )
  // negrita **x** o __x__
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
  // cursiva *x* o _x_
  out = out.replace(/(^|[^\*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  out = out.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')
  // inline code `x`
  out = out.replace(/`([^`\n]+)`/g, '<code class="bg-surface-card border border-hairline rounded px-1 text-[0.95em]">$1</code>')
  return out
}

export function renderMarkdown(md: string): string {
  if (!md) return ''
  const lines = md.split(/\r?\n/)
  const out: string[] = []
  let inUl = false
  let inOl = false
  let inP = false

  function closeLists() {
    if (inUl) { out.push('</ul>'); inUl = false }
    if (inOl) { out.push('</ol>'); inOl = false }
  }
  function closeP() {
    if (inP) { out.push('</p>'); inP = false }
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')
    if (!line.trim()) { closeP(); closeLists(); continue }

    // Headings
    const h = /^(#{1,4})\s+(.*)$/.exec(line)
    if (h) {
      closeP(); closeLists()
      const level = h[1].length
      const size = level === 1 ? 'text-4xl md:text-5xl font-bold mt-10 mb-4 tracking-tight'
        : level === 2 ? 'text-2xl md:text-3xl font-bold mt-8 mb-3 tracking-tight'
        : level === 3 ? 'text-xl font-bold mt-6 mb-2'
        : 'text-base font-semibold mt-4 mb-1'
      out.push(`<h${level} class="text-ink ${size}">${inline(h[2])}</h${level}>`)
      continue
    }

    // Unordered list
    const ul = /^[-*]\s+(.*)$/.exec(line)
    if (ul) {
      closeP()
      if (inOl) { out.push('</ol>'); inOl = false }
      if (!inUl) { out.push('<ul class="list-disc pl-6 space-y-1.5 text-body my-4">'); inUl = true }
      out.push(`<li>${inline(ul[1])}</li>`)
      continue
    }

    // Ordered list
    const ol = /^\d+\.\s+(.*)$/.exec(line)
    if (ol) {
      closeP()
      if (inUl) { out.push('</ul>'); inUl = false }
      if (!inOl) { out.push('<ol class="list-decimal pl-6 space-y-1.5 text-body my-4">'); inOl = true }
      out.push(`<li>${inline(ol[1])}</li>`)
      continue
    }

    // Blockquote
    if (/^>\s+/.test(line)) {
      closeP(); closeLists()
      out.push(`<blockquote class="border-l-2 border-ink pl-4 italic text-body my-4">${inline(line.replace(/^>\s+/, ''))}</blockquote>`)
      continue
    }

    // Paragraph
    closeLists()
    if (!inP) { out.push('<p class="text-body leading-relaxed my-3">'); inP = true; out.push(inline(line)) }
    else { out.push('<br>' + inline(line)) }
  }
  closeP(); closeLists()
  return out.join('\n')
}
