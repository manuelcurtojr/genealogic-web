/**
 * Lista de secciones del estándar Genealogic.
 *
 * Definida en un módulo neutro (sin 'use client') para que la pueda
 * importar tanto el sidebar (client component) como la página del
 * estándar (server component). Si la dejásemos sólo en el sidebar,
 * Next.js trataría la lista como una "client reference" y fallaría al
 * iterarla en el servidor.
 */
import {
  Info, Eye, Ruler, Heart, Smile, ArrowDownToDot,
  Anchor, Footprints, Activity, Palette, Scale, AlertTriangle,
  Sparkles, GitCompare,
} from 'lucide-react'

export const BREED_SECTIONS = [
  { id: 'info-general',        label: 'Información general', icon: Info },
  { id: 'apariencia',          label: 'Apariencia general', icon: Eye },
  { id: 'proporciones',        label: 'Proporciones',        icon: Ruler },
  { id: 'temperamento',        label: 'Temperamento',        icon: Heart },
  { id: 'cabeza',              label: 'Cabeza',              icon: Smile },
  { id: 'cuello-cuerpo',       label: 'Cuello y cuerpo',     icon: ArrowDownToDot },
  { id: 'cola',                label: 'Cola',                icon: Anchor },
  { id: 'extremidades',        label: 'Extremidades',        icon: Footprints },
  { id: 'movimiento',          label: 'Movimiento',          icon: Activity },
  { id: 'manto',               label: 'Manto y color',       icon: Palette },
  { id: 'tamano-peso',         label: 'Tamaño y peso',       icon: Scale },
  { id: 'faltas',              label: 'Faltas',              icon: AlertTriangle },
  { id: 'reinterpretacion',    label: 'Sobre este estándar', icon: Sparkles },
  { id: 'diferencias-clubes',  label: 'Diferencias entre clubes', icon: GitCompare },
] as const

export type BreedSectionId = typeof BREED_SECTIONS[number]['id']
