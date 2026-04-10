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

const C = {
  bg:       [10, 15, 30] as const,       // dark navy
  card:     [20, 28, 50] as const,       // card bg
  cardAlt:  [15, 22, 42] as const,       // alternate card
  primary:  [215, 71, 9] as const,       // #D74709
  white:    [255, 255, 255] as const,
  text:     [220, 225, 235] as const,    // light text
  muted:    [130, 140, 160] as const,    // muted text
  dim:      [80, 90, 110] as const,      // very muted
  border:   [40, 50, 75] as const,       // subtle border
  male:     [59, 130, 246] as const,     // blue
  female:   [236, 72, 153] as const,    // pink
  green:    [34, 197, 94] as const,
}

type RGB = readonly [number, number, number]

export function generatePedigreePdf(dogData: DogData, tree: TreeNode | null) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pw = 297, ph = 210

  const docId = 'GEN-' + hashStr(dogData.name + (dogData.microchip || '')).slice(0, 8).toUpperCase()
  const dateGen = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // === BACKGROUND ===
  doc.setFillColor(...C.bg)
  doc.rect(0, 0, pw, ph, 'F')

  // === HEADER BAR ===
  doc.setFillColor(...C.card)
  doc.rect(0, 0, pw, 18, 'F')

  // Bottom border of header
  doc.setDrawColor(...C.primary)
  doc.setLineWidth(0.6)
  doc.line(0, 18, pw, 18)

  // Brand text
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('GENEALOGIC', 12, 11.5)

  // Dot in brand color
  doc.setFillColor(...C.primary)
  doc.circle(12 + doc.getTextWidth('GENEALOGI') + 1.5, 9, 1.2, 'F')

  // Subtitle
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.muted)
  doc.text('Certificado de Pedigree Digital', 12, 15.5)

  // Doc ID + date right
  doc.setFontSize(6.5)
  doc.setTextColor(...C.dim)
  doc.text(`${docId}  ·  ${dateGen}`, pw - 12, 11, { align: 'right' })
  doc.setFontSize(5.5)
  doc.text('genealogic.io', pw - 12, 15, { align: 'right' })

  let y = 24

  // === DOG NAME SECTION ===
  doc.setFillColor(...C.card)
  roundRect(doc, 10, y, pw - 20, 22, 3)

  // Sex color bar on left
  const sexColor: RGB = dogData.sex === 'male' ? C.male : C.female
  doc.setFillColor(...sexColor)
  doc.rect(10, y, 1.5, 22, 'F')

  // Dog name
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text(dogData.name.toUpperCase(), 18, y + 9)

  // Sex icon
  const sexIcon = dogData.sex === 'male' ? '♂' : '♀'
  doc.setFontSize(12)
  doc.setTextColor(...sexColor)
  const nameW = doc.getTextWidth(dogData.name.toUpperCase())
  doc.setFontSize(16)
  doc.setFontSize(11)
  doc.text(sexIcon, 18 + nameW + 3, y + 9)

  // Breed + Color
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.muted)
  const infoLine = [dogData.breed, dogData.color].filter(Boolean).join('  ·  ')
  doc.text(infoLine, 18, y + 15)

  // Right side info
  const rightX = pw - 16
  doc.setFontSize(6.5)
  doc.setTextColor(...C.dim)
  doc.text('Criadero', rightX, y + 6, { align: 'right' })
  doc.setTextColor(...C.text)
  doc.setFont('helvetica', 'bold')
  doc.text(dogData.kennel || '—', rightX, y + 10, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.dim)
  doc.text('Propietario', rightX, y + 15, { align: 'right' })
  doc.setTextColor(...C.text)
  doc.setFont('helvetica', 'bold')
  doc.text(dogData.owner, rightX, y + 19, { align: 'right' })

  y += 26

  // === INFO CHIPS ===
  const chips = [
    { lbl: 'Nacimiento', val: dogData.birth_date || '—' },
    { lbl: 'Padre', val: dogData.father },
    { lbl: 'Madre', val: dogData.mother },
    { lbl: dogData.microchip ? 'Microchip' : 'Registro', val: dogData.microchip || dogData.registration || docId },
  ]
  const chipW = (pw - 20 - 6) / 4
  chips.forEach((chip, i) => {
    const cx = 10 + i * (chipW + 2)
    doc.setFillColor(...C.cardAlt)
    roundRect(doc, cx, y, chipW, 10, 2)
    doc.setFontSize(5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.dim)
    doc.text(chip.lbl.toUpperCase(), cx + 3, y + 3.5)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.text)
    const val = chip.val.length > 24 ? chip.val.slice(0, 22) + '…' : chip.val
    doc.text(val, cx + 3, y + 8)
  })

  y += 14

  // === SECTION TITLE ===
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('GENEALOGÍA — 4 GENERACIONES', 12, y + 1)
  y += 4

  // === PEDIGREE TABLE ===
  const tableX = 10
  const tableW = pw - 20
  const tableH = ph - y - 14
  const numRows = 8
  const rh = tableH / numRows

  const colWidths = [tableW * 0.17, tableW * 0.22, tableW * 0.28, tableW * 0.33]

  // Build generations
  const gen1: (TreeNode | null)[] = [tree?.father || null, tree?.mother || null]
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

    if (row === 0) drawCell(doc, cx, y, colWidths[0], rh * 8, tree, 0)
    cx += colWidths[0]

    if (row === 0) drawCell(doc, cx, y, colWidths[1], rh * 4, gen1[0], 1)
    if (row === 4) drawCell(doc, cx, y + rh * 4, colWidths[1], rh * 4, gen1[1], 1)
    cx += colWidths[1]

    if (row % 2 === 0) drawCell(doc, cx, y + rh * row, colWidths[2], rh * 2, gen2[row / 2], 2)
    cx += colWidths[2]

    drawCell(doc, cx, y + rh * row, colWidths[3], rh, gen3[row], 3)
  }

  y += tableH + 4

  // === FOOTER ===
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.1)
  doc.line(12, y, pw - 12, y)
  y += 3

  doc.setFontSize(5.5)
  doc.setFont('helvetica', 'normal')

  // Legend
  doc.setFillColor(...C.male)
  doc.rect(12, y - 1.2, 3, 1.5, 'F')
  doc.setTextColor(...C.muted)
  doc.text('Macho', 17, y)
  doc.setFillColor(...C.female)
  doc.rect(30, y - 1.2, 3, 1.5, 'F')
  doc.text('Hembra', 35, y)

  // Center
  doc.setTextColor(...C.dim)
  doc.text('Generado por ', pw / 2 - 15, y)
  doc.setTextColor(...C.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('Genealogic', pw / 2 - 15 + doc.getTextWidth('Generado por '), y)

  // Right
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.dim)
  doc.text('Documento informativo — No sustituye un pedigree oficial', pw - 12, y, { align: 'right' })

  doc.save(`Pedigree-${dogData.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
}

function drawCell(doc: jsPDF, x: number, y: number, w: number, h: number, node: TreeNode | null, gen: number) {
  const bgs: RGB[] = [C.card, C.cardAlt, [18, 25, 45], [14, 20, 38]]
  doc.setFillColor(...bgs[gen])
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.1)
  doc.rect(x, y, w, h, 'FD')

  if (!node) {
    doc.setFontSize(6)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...C.dim)
    doc.text('—', x + w / 2, y + h / 2 + 1, { align: 'center' })
    return
  }

  // Sex bar
  const sexColor: RGB = node.sex === 'Male' || node.sex === 'male' ? C.male : C.female
  doc.setFillColor(...sexColor)
  doc.rect(x, y, 0.7, h, 'F')

  const isRoot = gen === 0
  const fs = isRoot ? 9 : gen === 3 ? 6.5 : 7.5
  const maxLen = gen === 3 ? 30 : 38

  doc.setFontSize(fs)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)

  const name = node.name.length > maxLen ? node.name.slice(0, maxLen - 2) + '…' : node.name
  const textX = x + 3
  const textY = y + h / 2 - (node.breed || node.born_date ? 1.5 : 0)
  doc.text(name, textX, textY)

  const meta = [node.breed, node.born_date].filter(Boolean).join(' · ')
  if (meta) {
    doc.setFontSize(gen === 3 ? 4.5 : 5.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.muted)
    const maxMeta = gen === 3 ? 38 : 50
    doc.text(meta.length > maxMeta ? meta.slice(0, maxMeta - 2) + '…' : meta, textX, textY + (isRoot ? 4 : 3.5))
  }
}

function roundRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number) {
  doc.roundedRect(x, y, w, h, r, r, 'F')
}

function hashStr(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h).toString(16).padStart(8, '0')
}
