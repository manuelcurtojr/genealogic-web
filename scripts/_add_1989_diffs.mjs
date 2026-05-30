/**
 * Añade la perspectiva del Patrón Racial 1989 a la tabla de "Diferencias
 * entre clubes" del Presa Canario:
 *   - En topics existentes donde 1989 difiere de FCI/UKC, añadir su row
 *   - Crear topics nuevos para rasgos exclusivos del 1989 (grupa más alta
 *     que la cruz, color negro, función ganadera, marcas blancas hasta 30%)
 */
import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const DIFFERENCES = [
  {
    topic: 'Nombre oficial',
    items: [
      {
        entity: 'Patrón Racial 1989',
        position:
          '**«Presa Canario»** — el documento original ya utiliza este nombre, sin "Perro de". Curioso porque la FCI tardó 34 años en volver a ese nombre tras pasar por "Dogo Canario" (2001) y "Perro de Presa Canario" (2018).',
      },
      {
        entity: 'FCI (2023)',
        position:
          '«Presa Canario» — el nombre oficial vigente desde la revisión 23/09/2023 ya NO incluye «Perro de». Antes era «Perro de Presa Canario» (2018) y antes «Dogo Canario» (2001-2018).',
      },
      {
        entity: 'UKC',
        position: '«Perro de Presa Canario» — mantiene el nombre largo histórico.',
      },
      {
        entity: 'AKC FSS',
        position: '«Presa Canario» como código de registro abreviado.',
      },
      { entity: 'Coloquial USA', position: 'A menudo abreviado como «Presa».' },
    ],
  },
  {
    topic: 'Reconocimiento internacional',
    items: [
      {
        entity: 'Patrón Racial 1989',
        position:
          'Documento previo a cualquier reconocimiento oficial internacional. Redactado en España por los criadores que mantenían la raza, antes de que la FCI la aceptase en 2001.',
      },
      {
        entity: 'FCI',
        position:
          'Reconocida plenamente (nº 346) desde 2001. País patronato España vía RSCE. Última revisión 23/09/2023.',
      },
      { entity: 'RSCE', position: 'Reconocida como raza autóctona española.' },
      { entity: 'UKC', position: 'Reconocida plenamente desde 2003.' },
      {
        entity: 'AKC',
        position:
          'Foundation Stock Service: NO elegible para registro AKC pleno. Solo companion events.',
      },
    ],
  },
  {
    topic: 'Mordida',
    items: [
      {
        entity: 'Patrón Racial 1989',
        position:
          '**Mordida en tenaza o en tijera. Generalmente NO presenta prognatismo.** Más estricto que las versiones posteriores: el 1989 NO admite prognatismo inferior como rasgo normal.',
      },
      {
        entity: 'FCI 2023',
        position:
          'Tijera (scissor) o **ligeramente prognática inferior (máx 2 mm)** — ambas aceptadas por igual. Pinza es falta LEVE. Diferencia importante con el 1989.',
      },
      {
        entity: 'UKC',
        position:
          'Tijera O TIJERA INVERTIDA (reverse scissor) preferidas. Nivel/pinza o ligeramente prognática inferior aceptables.',
      },
      {
        entity: 'Todos',
        position:
          'Prognatismo superior (overshot/enognatismo) DESCALIFICA en los tres estándares.',
      },
    ],
  },
  {
    topic: 'Altura a la cruz — tolerancia',
    items: [
      {
        entity: 'Patrón Racial 1989',
        position:
          'Machos 61-66 cm, hembras 57-62 cm. **Permite explícitamente rebasar el límite** si se mantiene "una correcta proporción entre la dimensión de las extremidades y el volumen del tronco". Más flexible que el FCI.',
      },
      {
        entity: 'FCI 2023',
        position:
          'Machos 61-66 cm, hembras 57-62 cm. NO se especifica tolerancia ni "altura ideal" en el estándar vigente.',
      },
      {
        entity: 'UKC',
        position:
          'Machos 23-26 in (58-66 cm), hembras 22-25 in (56-63,5 cm). Tolerancia explícita de 1 inch (~2,5 cm).',
      },
    ],
  },
  {
    topic: 'Peso',
    items: [
      {
        entity: 'Patrón Racial 1989',
        position: 'Machos 45-57 kg, hembras 40-50 kg.',
      },
      {
        entity: 'FCI 2023',
        position: 'Machos 45-57 kg, hembras 40-50 kg. Coincide con el 1989.',
      },
      {
        entity: 'UKC',
        position:
          'Machos 100-125 lbs (45-57 kg) — coincide. **Hembras 85-100 lbs (38,5-45 kg) — por debajo del rango FCI/1989**.',
      },
    ],
  },
  {
    topic: 'Grupa (rasgo característico del 1989)',
    items: [
      {
        entity: 'Patrón Racial 1989',
        position:
          '**La altura a la grupa presenta normalmente 1,5 cm de más en relación a la altura a la cruz.** Rasgo morfológico explícitamente recogido como característico del Presa tradicional.',
      },
      {
        entity: 'FCI 2023',
        position:
          'No menciona esa diferencia altura grupa-cruz como rasgo deseable. La igualdad grupa-cruz queda como falta leve, pero no se promueve activamente la grupa más alta.',
      },
    ],
  },
  {
    topic: 'Marcas blancas',
    items: [
      {
        entity: 'Patrón Racial 1989',
        position:
          'Manchas blancas alrededor del cuello, cráneo, extremidades y pecho son admisibles, "siendo deseable que la presencia del blanco sea lo más reducida posible". **DESCALIFICA si supera el 30 %** o si hay manchas en el dorso.',
      },
      {
        entity: 'FCI 2023',
        position:
          'Aceptables en pecho, cuello/garganta y pies, manteniéndolas al mínimo. **DESCALIFICA si supera el 20 %** — más estricto que el 1989.',
      },
      {
        entity: 'UKC',
        position: 'Mismo límite del 20 % — DESCALIFICA si se supera.',
      },
    ],
  },
  {
    topic: 'Color de capa',
    items: [
      {
        entity: 'Patrón Racial 1989',
        position:
          'Descripción de conjunto: **"Capa atigrada, leonada y negra"**. El detalle de colores admite atigrado (bardino) en toda su gama y leonados hasta arena. El negro se menciona en la descripción general — rasgo del Presa tradicional.',
      },
      {
        entity: 'FCI 2023',
        position:
          'Solo admite atigrado (bardino) en sus distintas tonalidades y leonado (fawn). **El negro NO es color admitido** en el estándar vigente — diferencia notable con el 1989.',
      },
    ],
  },
  {
    topic: 'Máscara',
    items: [
      {
        entity: 'Patrón Racial 1989',
        position:
          '"La máscara es siempre de color oscuro y puede alcanzar la altura de los ojos." Norma estética, no descalificante en sí.',
      },
      {
        entity: 'FCI 2023',
        position:
          'Máscara negra OBLIGATORIA en bardinos y leonados. NO debe extenderse por encima del nivel de los ojos. Su insuficiencia es falta grave.',
      },
      {
        entity: 'UKC',
        position:
          'Ausencia de máscara DESCALIFICA. Máscara que cubre menos del 50 % de la cara o que se extiende sobre los ojos es FALTA.',
      },
    ],
  },
  {
    topic: 'Orejas — amputación',
    items: [
      {
        entity: 'Patrón Racial 1989',
        position:
          '**"Si se recortan conforme a la tradición, quedan erectas y de forma triangular."** Acepta y describe el corte tradicional. Los ejemplares con orejas completas compiten en igualdad de condiciones que los recortados.',
      },
      {
        entity: 'FCI 2023',
        position:
          'Naturales (caídas o en rosa). En países donde la amputación es legal deben llevarse erguidas. En España, Francia, Alemania y la mayoría de la UE la amputación está PROHIBIDA por bienestar animal.',
      },
      {
        entity: 'UKC',
        position:
          'Permite explícitamente AMBAS: naturales (caídas/en rosa) o cortadas (erguidas).',
      },
    ],
  },
  {
    topic: 'Función / utilidad',
    items: [
      {
        entity: 'Patrón Racial 1989',
        position:
          'Triple función explícita: **guarda y defensa**, **conducción de ganado vacuno** y, "en el pasado", perro de combate. Aún reivindica el aspecto ganadero como uso real.',
      },
      {
        entity: 'FCI 2023',
        position:
          'Centrado en guarda y defensa. El aspecto de conducción de ganado vacuno queda suavizado. El uso como perro de combate, prohibido.',
      },
    ],
  },
  {
    topic: 'Cola',
    items: [
      {
        entity: 'Patrón Racial 1989',
        position:
          'Inserción alta, flexible, "en acción se eleva en forma de sable con la punta hacia adelante, sin enroscarse". NO se menciona la amputación.',
      },
      {
        entity: 'FCI 2023 y UKC',
        position: 'Cola amputada (cropped/docked tail) DESCALIFICA en ambos clubes.',
      },
    ],
  },
]

const { data: presa } = await s
  .from('breeds')
  .select('id, club_differences')
  .eq('slug', 'presa-canario')
  .single()

const newDiffs = { ...(presa.club_differences || {}), differences: DIFFERENCES }
const { error } = await s.from('breeds').update({ club_differences: newDiffs }).eq('id', presa.id)
if (error) { console.error('Error:', error); process.exit(1) }

console.log(`✓ Diferencias entre clubes actualizadas: ${DIFFERENCES.length} topics`)
DIFFERENCES.forEach((d) => {
  const has1989 = d.items.some((i) => i.entity.includes('1989'))
  console.log(`  ${has1989 ? '·' : ' '} ${d.topic}  (${d.items.length} entradas)${has1989 ? '  ← incluye 1989' : ''}`)
})
