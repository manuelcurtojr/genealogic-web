'use client'

import jsPDF from 'jspdf'

interface DogData {
  name: string
  breed: string
  color: string
  sex: string
  birth_date: string
  microchip: string
  registration: string
  father: string
  mother: string
  kennel: string
  owner: string
}

interface TreeNode {
  name: string
  breed: string
  sex: string
  born_date: string
  father: TreeNode | null
  mother: TreeNode | null
}

const COLORS = {
  dark: [30, 41, 59],       // #1e293b
  primary: [215, 71, 9],    // #D74709
  slate400: [148, 163, 184],// #94a3b8
  slate500: [100, 116, 139],// #64748b
  border: [203, 213, 225],  // #cbd5e1
  borderLight: [226, 232, 240], // #e2e8f0
  bgLight: [248, 250, 252], // #f8fafc
  bgMed: [241, 245, 249],   // #f1f5f9
  white: [255, 255, 255],
  male: [26, 86, 219],      // #1a56db
  female: [192, 38, 211],   // #c026d3
} as const

type RGB = readonly [number, number, number]

export function generatePedigreePdf(dogData: DogData, tree: TreeNode | null) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pw = 297, ph = 210
  const mx = 12, my = 10
  const cw = pw - mx * 2, ch = ph - my * 2

  const docId = 'GEN-' + hashStr(dogData.name + (dogData.microchip || '')).slice(0, 8).toUpperCase()
  const dateGen = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // === OUTER FRAME ===
  doc.setDrawColor(...COLORS.dark)
  doc.setLineWidth(0.5)
  doc.rect(mx, my, cw, ch)
  doc.setDrawColor(...COLORS.slate400)
  doc.setLineWidth(0.15)
  doc.rect(mx + 1.5, my + 1.5, cw - 3, ch - 3)

  let y = my + 5

  // === HEADER ===
  // Doc ID - right aligned
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.slate400)
  doc.text(`N\u00ba ${docId}`, pw - mx - 4, y + 2, { align: 'right' })

  // Brand
  doc.setFontSize(22)
  doc.setTextColor(...COLORS.dark)
  doc.setFont('helvetica', 'bold')
  const brand = 'GENEALOGIC'
  const bw = doc.getTextWidth(brand)
  const bx = pw / 2 - bw / 2
  doc.text('GENEAL', bx, y + 4)
  const oX = bx + doc.getTextWidth('GENEAL')
  doc.setTextColor(...COLORS.primary)
  doc.text('O', oX, y + 4)
  const gX = oX + doc.getTextWidth('O')
  doc.setTextColor(...COLORS.dark)
  doc.text('GIC', gX, y + 4)

  y += 8
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.slate500)
  doc.setFont('helvetica', 'normal')
  doc.text('CERTIFICADO DE PEDIGREE DIGITAL', pw / 2, y, { align: 'center' })

  y += 4
  doc.setDrawColor(...COLORS.dark)
  doc.setLineWidth(0.4)
  doc.line(mx + 4, y, pw - mx - 4, y)

  y += 4

  // === DOG NAME BANNER ===
  const bannerH = 12
  doc.setFillColor(...COLORS.dark)
  doc.rect(mx + 4, y, cw - 8, bannerH, 'F')

  const sexIcon = dogData.sex === 'male' ? '\u2642' : '\u2640'
  const sexColor: RGB = dogData.sex === 'male' ? COLORS.male : COLORS.female

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.white)
  const nameStr = dogData.name.toUpperCase()
  doc.text(nameStr, pw / 2 - 4, y + bannerH / 2 + 1.5, { align: 'center' })

  // Sex icon
  const nameW = doc.getTextWidth(nameStr)
  doc.setFontSize(12)
  doc.setTextColor(...sexColor)
  doc.text(sexIcon, pw / 2 + nameW / 2, y + bannerH / 2 + 1)

  // Breed below name
  if (dogData.breed) {
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.slate400)
    doc.setFont('helvetica', 'normal')
    doc.text(dogData.breed, pw / 2, y + bannerH - 1.5, { align: 'center' })
  }

  y += bannerH + 4

  // === INFO GRID ===
  const gridRows = [
    [
      { lbl: 'Nacimiento', val: dogData.birth_date || '\u2014' },
      { lbl: 'Sexo', val: dogData.sex === 'male' ? 'Macho' : 'Hembra' },
      { lbl: 'Color', val: dogData.color || '\u2014' },
    ],
    [
      { lbl: 'Padre', val: dogData.father || 'Desconocido' },
      { lbl: 'Madre', val: dogData.mother || 'Desconocido' },
      { lbl: 'Criadero', val: dogData.kennel || '\u2014' },
    ],
    [
      { lbl: 'Propietario', val: dogData.owner, colspan: 2 },
      { lbl: dogData.microchip ? 'Microchip' : 'Registro', val: dogData.microchip || docId },
    ],
  ]

  const gridX = mx + 4
  const gridW = cw - 8
  const colW = gridW / 6
  const rowH = 7
  const lblW = 18

  gridRows.forEach((row, ri) => {
    let cx = gridX
    row.forEach((cell, ci) => {
      const span = (cell as any).colspan || 1
      const cellW = span === 2 ? colW * 4 : colW * 2

      // Label bg
      doc.setFillColor(...COLORS.bgLight)
      doc.setDrawColor(...COLORS.borderLight)
      doc.setLineWidth(0.15)
      doc.rect(cx, y, lblW, rowH, 'FD')

      // Label text
      doc.setFontSize(5.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.slate500)
      doc.text(cell.lbl.toUpperCase(), cx + 2, y + rowH / 2 + 0.8)

      // Value cell
      doc.setFillColor(...COLORS.white)
      doc.rect(cx + lblW, y, cellW - lblW, rowH, 'FD')

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      doc.text(cell.val, cx + lblW + 2, y + rowH / 2 + 0.8)

      cx += cellW
    })
    y += rowH
  })

  y += 4

  // === SECTION TITLE ===
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.slate500)
  doc.text('GENEALOGIA \u2014 4 GENERACIONES', mx + 4, y + 1)
  y += 3
  doc.setDrawColor(...COLORS.borderLight)
  doc.setLineWidth(0.15)
  doc.line(mx + 4, y, pw - mx - 4, y)
  y += 2

  // === PEDIGREE TABLE ===
  // 8 rows × 4 columns (root=col0 rowspan8, gen1=col1 rowspan4, gen2=col2 rowspan2, gen3=col3 rowspan1)
  const tableX = mx + 4
  const tableW = cw - 8
  const tableH = ph - my - 1.5 - y - 10 // leave room for footer
  const numRows = 8
  const rh = tableH / numRows

  // Column widths: root wider, then decreasing
  const colWidths = [tableW * 0.18, tableW * 0.22, tableW * 0.28, tableW * 0.32]

  // Build tree arrays
  const gen1: (TreeNode | null)[] = [
    tree?.father || null,
    tree?.mother || null,
  ]
  const gen2: (TreeNode | null)[] = [
    gen1[0]?.father || null, gen1[0]?.mother || null,
    gen1[1]?.father || null, gen1[1]?.mother || null,
  ]
  const gen3: (TreeNode | null)[] = []
  for (let i = 0; i < 4; i++) {
    gen3.push(gen2[i]?.father || null)
    gen3.push(gen2[i]?.mother || null)
  }

  // Draw cells
  for (let row = 0; row < 8; row++) {
    let cx = tableX

    // Col 0 - root (only on row 0, spans 8)
    if (row === 0) {
      drawPedCell(doc, cx, y, colWidths[0], rh * 8, tree, 'root')
    }
    cx += colWidths[0]

    // Col 1 - gen1 (row 0 and 4, span 4)
    if (row === 0) drawPedCell(doc, cx, y, colWidths[1], rh * 4, gen1[0], 'gen1')
    if (row === 4) drawPedCell(doc, cx, y + rh * 4, colWidths[1], rh * 4, gen1[1], 'gen1')
    cx += colWidths[1]

    // Col 2 - gen2 (rows 0,2,4,6, span 2)
    if (row % 2 === 0) {
      const idx = row / 2
      drawPedCell(doc, cx, y + rh * row, colWidths[2], rh * 2, gen2[idx], 'gen2')
    }
    cx += colWidths[2]

    // Col 3 - gen3 (every row, span 1)
    drawPedCell(doc, cx, y + rh * row, colWidths[3], rh, gen3[row], 'gen3')
  }

  y += tableH + 3

  // === FOOTER ===
  doc.setDrawColor(...COLORS.borderLight)
  doc.setLineWidth(0.15)
  doc.line(mx + 4, y, pw - mx - 4, y)
  y += 3

  doc.setFontSize(5.5)
  doc.setFont('helvetica', 'normal')

  // Left - legend
  doc.setFillColor(...COLORS.male)
  doc.rect(mx + 5, y - 1.2, 4, 1.5, 'F')
  doc.setTextColor(...COLORS.slate400)
  doc.text('Macho', mx + 11, y)
  doc.setFillColor(...COLORS.female)
  doc.rect(mx + 25, y - 1.2, 4, 1.5, 'F')
  doc.text('Hembra', mx + 31, y)

  // Center
  doc.setTextColor(...COLORS.slate400)
  const footerCenter = `Generado por `
  const footerCW = doc.getTextWidth(footerCenter)
  doc.text(footerCenter, pw / 2 - footerCW / 2 - 5, y)
  doc.setTextColor(...COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('Genealogic', pw / 2 - footerCW / 2 - 5 + footerCW, y)
  const genW = doc.getTextWidth('Genealogic')
  doc.setTextColor(...COLORS.slate400)
  doc.setFont('helvetica', 'normal')
  doc.text(` \u2014 ${dateGen}`, pw / 2 - footerCW / 2 - 5 + footerCW + genW, y)

  // Right
  doc.text('Documento informativo \u2014 No sustituye un pedigree oficial', pw - mx - 5, y, { align: 'right' })

  // Save
  const filename = `Pedigree-${dogData.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  doc.save(filename)
}

function drawPedCell(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  node: TreeNode | null,
  gen: 'root' | 'gen1' | 'gen2' | 'gen3'
) {
  const bgColors: Record<string, RGB> = {
    root: COLORS.dark,
    gen1: COLORS.bgMed,
    gen2: COLORS.bgLight,
    gen3: COLORS.white,
  }

  // Fill
  doc.setFillColor(...bgColors[gen])
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.15)
  doc.rect(x, y, w, h, 'FD')

  if (!node) {
    // Unknown
    doc.setFillColor(250, 250, 250)
    doc.rect(x, y, w, h, 'FD')
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(203, 213, 225)
    doc.text('\u2014', x + w / 2, y + h / 2 + 1, { align: 'center' })
    return
  }

  // Sex indicator - left border
  const sexColor: RGB = node.sex === 'Male' || node.sex === 'male' ? COLORS.male : COLORS.female
  doc.setFillColor(...sexColor)
  doc.rect(x, y, 0.8, h, 'F')

  // Text
  const isRoot = gen === 'root'
  const nameColor: RGB = isRoot ? COLORS.white : COLORS.dark
  const metaColor: RGB = isRoot ? COLORS.slate400 : COLORS.slate400
  const nameFontSize = isRoot ? 8.5 : gen === 'gen3' ? 7 : 7.5

  doc.setFontSize(nameFontSize)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...nameColor)

  const nameText = node.name.length > (gen === 'gen3' ? 28 : 35)
    ? node.name.slice(0, gen === 'gen3' ? 26 : 33) + '...'
    : node.name

  const textX = x + 3
  const textY = y + h / 2 - (node.breed || node.born_date ? 1 : 0)
  doc.text(nameText, textX, textY)

  // Meta line
  const metaParts: string[] = []
  if (node.breed) metaParts.push(node.breed)
  if (node.born_date) metaParts.push(node.born_date)
  if (metaParts.length > 0) {
    const metaStr = metaParts.join(' \u00B7 ')
    const maxMeta = gen === 'gen3' ? 35 : 45
    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...metaColor)
    doc.text(metaStr.length > maxMeta ? metaStr.slice(0, maxMeta - 2) + '...' : metaStr, textX, textY + 3.5)
  }
}

function hashStr(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(16).padStart(8, '0')
}
