/**
 * Extracción de texto de PDFs y documentos Office para alimentar la biblioteca.
 *
 * - PDF: pdf-parse (puro JS, sin binaries)
 * - DOC/DOCX: mammoth (convierte a HTML/texto plano)
 * - TXT/MD: directo
 *
 * Errores comunes (PDF escaneado sin OCR, contraseña, etc.) se devuelven
 * como Error con mensaje legible.
 */
import 'server-only'

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

export type ParseResult = {
  filename: string
  mimeType: string
  text: string
  pages?: number
}

export async function parseFile(args: {
  filename: string
  mimeType: string
  buffer: Buffer | Uint8Array
}): Promise<ParseResult> {
  const buf = Buffer.isBuffer(args.buffer) ? args.buffer : Buffer.from(args.buffer)
  if (buf.byteLength > MAX_BYTES) {
    throw new Error(`Archivo demasiado grande (${(buf.byteLength / 1024 / 1024).toFixed(1)} MB > 20 MB)`)
  }
  const lower = args.filename.toLowerCase()
  const mt = args.mimeType.toLowerCase()

  if (mt === 'application/pdf' || lower.endsWith('.pdf')) {
    return parsePdf(args.filename, buf)
  }
  if (
    mt === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mt === 'application/msword' ||
    lower.endsWith('.docx') ||
    lower.endsWith('.doc')
  ) {
    return parseDoc(args.filename, mt, buf)
  }
  if (mt.startsWith('text/') || lower.endsWith('.txt') || lower.endsWith('.md')) {
    return parseText(args.filename, mt, buf)
  }
  throw new Error(`Tipo de archivo no soportado: ${args.mimeType || lower.split('.').pop()}`)
}

async function parsePdf(filename: string, buf: Buffer): Promise<ParseResult> {
  // pdf-parse v2: API basada en clase PDFParse({ data }).getText()
  const { PDFParse } = await import('pdf-parse')
  try {
    const parser = new PDFParse({ data: new Uint8Array(buf) })
    const result = await parser.getText()
    const text = (result.text || '').trim()
    if (!text) {
      throw new Error('No se pudo extraer texto. ¿Es un PDF escaneado sin OCR?')
    }
    return {
      filename,
      mimeType: 'application/pdf',
      text,
      pages: result.total ?? undefined,
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('Invalid PDF')) {
      throw new Error('El archivo no parece un PDF válido')
    }
    if (e instanceof Error && e.message.toLowerCase().includes('password')) {
      throw new Error('El PDF está protegido con contraseña')
    }
    throw e
  }
}

async function parseDoc(filename: string, mimeType: string, buf: Buffer): Promise<ParseResult> {
  // mammoth maneja .docx; los .doc legacy también pero con menos calidad
  const mammoth = await import('mammoth')
  try {
    const res = await mammoth.extractRawText({ buffer: buf })
    const text = (res.value || '').trim()
    if (!text) {
      throw new Error('Documento vacío o sin texto extraíble')
    }
    return { filename, mimeType, text }
  } catch (e) {
    if (e instanceof Error && e.message.includes('zip')) {
      throw new Error('Formato no soportado. Usa .docx (no .doc antiguo)')
    }
    throw e
  }
}

async function parseText(filename: string, mimeType: string, buf: Buffer): Promise<ParseResult> {
  const text = buf.toString('utf8').trim()
  return { filename, mimeType, text }
}
