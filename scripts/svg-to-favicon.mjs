import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import pngToIco from 'png-to-ico'

const svg = readFileSync('public/icon.svg')

// Generar varios PNGs (16, 32, 48, 64) y empaquetar en ICO
const sizes = [16, 32, 48, 64]
const pngs = await Promise.all(
  sizes.map(s => sharp(svg).resize(s, s, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer())
)

const ico = await pngToIco(pngs)
writeFileSync('src/app/favicon.ico', ico)
console.log('✓ favicon.ico generado:', ico.length, 'bytes')

// Y también un PNG 512 para apple-touch-icon
const apple = await sharp(svg).resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer()
writeFileSync('public/apple-touch-icon.png', apple)
console.log('✓ apple-touch-icon.png generado:', apple.length, 'bytes')
