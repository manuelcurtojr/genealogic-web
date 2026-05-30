/**
 * Aplica al Presa Canario:
 *  1. genealogic_standard reescrito basado en el Patrón Racial de 1989
 *     (el tradicional, anterior al FCI 2023 con sus modificaciones).
 *  2. Añade la fuente "Estándar del Perro de Presa Canario 1989" al
 *     array standard_data.standards.
 *  3. Crea un post en el blog de Irema Curtó publicando el estándar
 *     completo como artículo divulgativo.
 *
 * Todas las cifras y descripciones técnicas vienen literalmente del PDF
 * subido a dog-photos/standards/presa-canario-1989.pdf.
 */
import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PDF_URL = 'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/standards/presa-canario-1989.pdf'

// ═══════════════════════════════════════════════════════════════════════════
// 1) genealogic_standard reescrito según patrón racial de 1989
// ═══════════════════════════════════════════════════════════════════════════
const SECTIONS = [
  {
    key: 'info-general',
    title: 'Información general',
    content:
      'Origen: España (Islas Canarias). Reconocida desde el siglo XVI en los Acuerdos de los Cabildos de Tenerife y Fuerteventura, donde ya se cita la presencia de "perros de presa" en las islas.\n\n' +
      'El **Presa Canario moderno** se perfila a finales del siglo XIX con la influencia decisiva del **Perro de Ganado Majorero** (Bardino Majorero), que es lo que le confiere su tipología distintiva frente al resto de molosoides.\n\n' +
      'Sinónimos: en Tenerife también se le llama "Perro Basto" o "Berdino" (para los ejemplares de manto bardino o atigrado).\n\n' +
      'Patrón racial de referencia: **Patrón Racial del Presa Canario (1989)** — el estándar tradicional, anterior al reconocimiento FCI de 2001 y sus revisiones posteriores. La FCI publicó la versión vigente nº 346 con última revisión en 2023.',
  },
  {
    key: 'apariencia',
    title: 'Apariencia general',
    content:
      'Perro **molosoide de talla media, eumétrico y de perfil recto**. Aspecto rústico y bien proporcionado. **Mesomorfo** cuyo tronco es más largo que su altura a la cruz. Las hembras suelen ser más longilíneas que los machos.\n\n' +
      'Su aspecto transmite **extraordinaria potencia**. Cabeza maciza de aspecto cuadrado y cráneo ancho. Hábil luchador por atavismo. Ladrido grave y profundo.',
  },
  {
    key: 'proporciones',
    title: 'Proporciones importantes',
    content:
      'Tronco más largo que la altura a la cruz en un **10-12 %**.\n\n' +
      'Proporción cráneo-cara: **6 a 4** (la cara representa aproximadamente el 40 % del total de la cabeza).\n\n' +
      'Perímetro torácico igual a la altura a la cruz más un tercio (**1/3**) de ésta, deseablemente superior.\n\n' +
      'Altura a la grupa: aproximadamente **1,5 cm más alta que la cruz** — característica del estándar tradicional.',
  },
  {
    key: 'temperamento',
    title: 'Comportamiento y temperamento',
    content:
      'De **temperamento firme** y mirada severa. Especialmente dotado para la función de **guarda y defensa** y para la **conducción de ganado vacuno**.\n\n' +
      '**Noble y manso en familia**, **desconfiado con los extraños**. Hábil luchador por atavismo. En el pasado se le utilizó frecuentemente como perro de combate, aunque esta función está actualmente prohibida.\n\n' +
      'Ladrido grave y profundo.',
  },
  {
    key: 'cabeza',
    title: 'Cabeza',
    content:
      'Tipo **braquicefálico**, con **tendencia cuboide**. Aspecto macizo. Longitud media: **25 cm**. Perímetro medio cefálico: **60 cm**. Depresión fronto-nasal poco pronunciada.\n\n' +
      '**Cráneo**: convexo en sentido anteroposterior y transversal. Hueso frontal plano. Arcada cigomática muy marcada, con gran desarrollo de los músculos temporales, maseteros y de la región suborbital. Cresta occipital prácticamente borrada por los músculos de la nuca.\n\n' +
      '**Hocico**: de menor longitud que el cráneo (≈40 % del total de la cabeza). Gran anchura, en prolongación del cráneo. Líneas craneofaciales rectas o ligeramente convergentes.\n\n' +
      '**Trufa**: ancha, fuertemente pigmentada en negro, con orificios bien abiertos.\n\n' +
      '**Labios**: medianamente gruesos y carnosos. El superior cubre al inferior formando, de frente, una V invertida. Mucosas de color oscuro (negro deseable, rosáceo admitido). Normalmente no babea.\n\n' +
      '**Ojos**: castaños, de tamaño medio.\n\n' +
      '**Mordida**: en **tenaza o en tijera**. Generalmente no presenta prognatismo. Incisivos y caninos bien alineados. Los caninos presentan amplia distancia transversal.\n\n' +
      '**Orejas**: colgantes cuando están completas, de arranque brusco y mediano tamaño, implantación alta. Se mantienen planas sobre el cráneo o plegadas en rosa. **Si se recortan conforme a la tradición**, quedan erectas y de forma triangular. Los ejemplares con orejas completas compiten en igualdad de condiciones que los de orejas recortadas.',
  },
  {
    key: 'cuello-cuerpo',
    title: 'Cuello, línea superior y cuerpo',
    content:
      '**Cuello**: cilíndrico, recto, macizo y muy musculoso, especialmente en la parte superior. Más bien corto (longitud media 18-20 cm). Borde inferior con piel floja que contribuye a una **doble papada no excesiva**, en sentido longitudinal.\n\n' +
      '**Pecho**: ancho y de gran amplitud, con músculos pectorales bien marcados. Visto lateralmente debe llegar como mínimo al codo. Costillas bien arqueadas. Conjunto torácico tendente a cilíndrico. Perímetro torácico medio: **88 cm**.\n\n' +
      '**Línea dorsolumbar**: recta, ascendiendo ligeramente hacia la grupa. Aparente ensillamiento detrás de la cruz.\n\n' +
      '**Grupa**: recta, de longitud media y ancha. Suele presentar **1,5 cm más de altura que la cruz** — rasgo característico del estándar 1989.\n\n' +
      '**Flancos**: poco marcados, sólo insinuados.\n\n' +
      '**Vientre**: moderadamente recogido, formando una línea arqueada prolongación del costillar.\n\n' +
      '**Órganos sexuales**: el macho debe presentar desarrollo completo y perfecto de ambos testículos. Escroto recogido.',
  },
  {
    key: 'cola',
    title: 'Cola',
    content:
      'De **inserción alta**, flexible, de nacimiento grueso y carnoso, **afinándose hacia la punta** hasta el corvejón. **En acción se eleva en forma de sable** con la punta hacia adelante, sin enroscarse.',
  },
  {
    key: 'extremidades',
    title: 'Extremidades',
    content:
      '**Anteriores**: perfectamente aplomadas, de huesos anchos y revestidas de musculatura potente y visible. Los codos no deben estar ni demasiado pegados al costillar ni abiertos. **Angulaciones pronunciadas** que garantizan buena amortiguación y trote largo. Longitud media del antebrazo: 23 cm. Caña anterior: 14 cm.\n\n' +
      '**Posteriores**: potentes y musculadas, correctamente aplomadas de frente y de perfil. Muslos largos y musculosos. **Angulaciones poco pronunciadas** (a diferencia de las anteriores). Corvejones sin desviaciones y bajos. Normalmente no presenta espolón. Su presencia no descalifica pero puede restar puntuación.\n\n' +
      '**Pies**: de gato. Uñas sólidas, negras o blancas en relación al color de la capa. El pie posterior es ligeramente más largo que el anterior.',
  },
  {
    key: 'movimiento',
    title: 'Movimiento',
    content:
      'Trote largo y suelto, garantizado por las angulaciones pronunciadas de las anteriores. Buena amortiguación. El conjunto debe transmitir potencia y funcionalidad — no se busca un perro de exhibición, sino un perro de trabajo capaz de cubrir distancias en finca.',
  },
  {
    key: 'manto',
    title: 'Manto y color',
    content:
      '**Pelo**: corto en toda su extensión, generalmente más espeso en la cruz, garganta y cresta de las nalgas. **Sin subpelo**. Compacto en la cola. De aspecto rústico, presenta cierta aspereza al tacto.\n\n' +
      '**Color**:\n' +
      '- **Atigrado (Bardino)** en toda su gama: desde el oscuro muy cálido hasta el gris neutro muy claro y rubio.\n' +
      '- **Leonados** en toda su gama, hasta el arena.\n\n' +
      '**Manchas blancas**: pueden aparecer alrededor del cuello (incluso prolongándose al cráneo) o en las extremidades, **siendo deseable que su presencia sea lo más reducida posible**. Es habitual una mancha blanca en el pecho, más o menos larga.\n\n' +
      '**Máscara**: siempre de color oscuro, puede alcanzar la altura de los ojos.',
  },
  {
    key: 'tamano-peso',
    title: 'Tamaño y peso',
    content:
      '**Alzada a la cruz**:\n' +
      '- Machos: **61 a 66 cm**.\n' +
      '- Hembras: **57 a 62 cm**.\n\n' +
      'En ejemplares que puedan rebasar el límite de alzada se les debe exigir una correcta proporción entre la dimensión de las extremidades y el volumen del tronco.\n\n' +
      '**Peso**:\n' +
      '- Machos: media de **45 a 57 kg**.\n' +
      '- Hembras: media de **40 a 50 kg**.',
  },
  {
    key: 'faltas',
    title: 'Faltas y descalificaciones',
    content:
      '**Faltas leves**:\n' +
      '- Igual altura grupa-cruz.\n' +
      '- Ligero prognatismo.\n' +
      '- Excesivas arrugas en la región cráneo-facial.\n' +
      '- Presencia de espolón.\n' +
      '- Ojos claros.\n' +
      '- Ladrido atípico.\n\n' +
      '**Faltas graves**:\n' +
      '- Escasa pigmentación de la trufa.\n' +
      '- Belfos excesivamente colgantes.\n' +
      '- Ojos de diferente tonalidad.\n' +
      '- Prognatismo excesivo.\n' +
      '- Aspecto ligeramente agalgado.\n' +
      '- Aplomos incorrectos o desviados.\n' +
      '- Ausencia de premolares.\n' +
      '- Desequilibrio de carácter, timidez.\n' +
      '- Apariencia frágil y pobreza de estructura.\n' +
      '- Cabeza que no cumple la proporción cráneo-cara.\n' +
      '- Cola enroscada, de igual grosor en toda su longitud, amputada o deforme.\n\n' +
      '**Descalificaciones (eliminatorios)**:\n' +
      '- Ejemplares monórquidos, criptórquidos o castrados.\n' +
      '- Manchados en blanco superior al **30 %**, o con manchas en el dorso.\n' +
      '- Enognatismo (prognatismo superior).\n' +
      '- Despigmentación total de trufa o mucosas.',
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// 2) Nueva fuente: Estándar 1989 (mantenemos las existentes)
// ═══════════════════════════════════════════════════════════════════════════
const NEW_SOURCE = {
  entity: 'Patrón Racial 1989',
  country: 'España',
  language: 'es',
  official: false, // No es FCI/RSCE — es el documento histórico de referencia
  url: PDF_URL,
  standard_number: null,
  date_valid: '1989',
  notes:
    'Patrón racial tradicional del Presa Canario, redactado antes del reconocimiento FCI (2001). Documento de referencia histórica que recoge la morfología y carácter del Presa "preselección moderna", incluido el corte de orejas tradicional. Diferencias notables con el FCI 2023 vigente.',
}

// ═══════════════════════════════════════════════════════════════════════════
// 3) Aplicar a breeds
// ═══════════════════════════════════════════════════════════════════════════
const { data: presa } = await s
  .from('breeds')
  .select('id, standard_data, genealogic_standard, club_differences')
  .eq('slug', 'presa-canario')
  .single()

const standards = presa.standard_data?.standards || []
const hasIt = standards.some((x) => x.url === PDF_URL || x.entity === NEW_SOURCE.entity)
const newStandards = hasIt ? standards : [...standards, NEW_SOURCE]

const newStandardData = { ...(presa.standard_data || {}), standards: newStandards }
const newGenealogic = { ...(presa.genealogic_standard || {}), sections: SECTIONS }

const { error: bErr } = await s
  .from('breeds')
  .update({
    genealogic_standard: newGenealogic,
    standard_data: newStandardData,
  })
  .eq('id', presa.id)
if (bErr) { console.error('Breed update error:', bErr); process.exit(1) }
console.log('✓ Presa Canario actualizado:')
console.log(`  · genealogic_standard: ${SECTIONS.length} secciones reescritas según 1989`)
console.log(`  · standard_data.standards: ${newStandards.length} fuentes (nueva: ${NEW_SOURCE.entity})`)

// ═══════════════════════════════════════════════════════════════════════════
// 4) Post de blog en Irema Curtó
// ═══════════════════════════════════════════════════════════════════════════
const { data: kennel } = await s.from('kennels').select('id, name').eq('slug', 'irema-curto').single()
console.log(`\nKennel: ${kennel.name} (${kennel.id})`)

const POST_SLUG = 'estandar-del-perro-de-presa-canario-1989'
const POST_TITLE = 'Estándar del Perro de Presa Canario 1989'
const POST_EXCERPT =
  'El Patrón Racial tradicional del Presa Canario, redactado en 1989 antes del reconocimiento FCI. Incluye orejas cortadas, mordida en tenaza o tijera y proporciones que se han ido modificando en revisiones posteriores. La referencia que en Irema Curtó consideramos correcta.'

// Body HTML del post — contenido completo del estándar formateado
const POST_HTML = `<p>En Irema Curtó consideramos que el <strong>Patrón Racial del Presa Canario de 1989</strong> es la referencia correcta de la raza. Es el documento que recoge al Presa antes de que la FCI lo reconociera (2001) y comenzaran las revisiones que han ido suavizando rasgos morfológicos y de presentación importantes.</p>

<p>A continuación reproducimos el estándar completo. Si quieres el documento original, puedes <a href="${PDF_URL}" target="_blank" rel="noopener">descargarlo en PDF aquí</a>.</p>

<h2>I. Denominación y sinonimia</h2>
<p><strong>Denominación:</strong> Presa Canario.</p>
<p><strong>Sinonimia:</strong> En Tenerife también se le suele llamar "Perro Basto" o "Berdino", este último para los ejemplares de manto bardino (atigrado).</p>

<h2>II. Orígenes y difusión de la raza</h2>
<p>Perro molosoide originario de las Islas Canarias. En los Acuerdos del Cabildo de Tenerife, en las Ordenanzas de Tenerife y en los Acuerdos del Cabildo de Fuerteventura, a partir del siglo XVI, ya se habla de "perros de presa". Lo más lógico es pensar que el can fue introducido en Canarias por los conquistadores y colonos españoles. Luego, con el tiempo y el aislamiento, pudo derivar en una raza completamente diferenciada.</p>

<p>En su evolución, a partir de finales del siglo XIX, lo que podríamos considerar el Presa moderno se perfila con <strong>influencia decisiva del Perro de Ganado Majorero (Bardino Majorero)</strong>, que es el que le confiere esa característica tan peculiar que hace que el Presa Canario se diferencie de las restantes razas molosoides.</p>

<p>Se le vino utilizando en el Archipiélago Canario para la guarda de las haciendas, para el cuidado del ganado vacuno y como auxiliar de carnicero en el sacrificio de las reses.</p>

<h2>III. Aspecto general y carácter</h2>
<h3>1. Descripción de conjunto</h3>
<p>Perro de talla media, <strong>eumétrico</strong>, de perfil recto. De aspecto rústico y bien proporcionado. Es un <strong>mesomorfo</strong> cuyo tronco es más largo que su altura a la cruz. Las hembras generalmente más longilíneas que los machos. Cabeza maciza, de aspecto cuadrado y cráneo ancho. Capa atigrada, leonada y negra. Máscara generalmente negra.</p>

<h3>2. Carácter y aptitud</h3>
<p>Su aspecto es de <strong>extraordinaria potencia</strong>. Mirada severa. Especialmente dotado para la función de <strong>guarda y defensa</strong> y para la <strong>conducción de ganado vacuno</strong>. De temperamento firme. Hábil luchador, tendencia que muestra por atavismo. Ladrido grave y profundo. <strong>Noble y manso en familia y desconfiado con los extraños</strong>.</p>

<h2>IV. Morfología externa</h2>

<h3>1. Alzada a la cruz</h3>
<ul>
  <li><strong>Machos:</strong> de 61 a 66 cm.</li>
  <li><strong>Hembras:</strong> de 57 a 62 cm.</li>
</ul>

<h3>2. Cabeza</h3>
<p>Tipo <strong>braquicefálica</strong>. Tendencia cuboide. Aspecto macizo. Proporción cráneo-cara de 6 a 4. La depresión fronto-nasal es poco pronunciada. Longitud media: 25 cm. Perímetro medio cefálico: 60 cm.</p>
<p><strong>Cráneo</strong> convexo en sentido anteroposterior y transversal. Hueso frontal plano. Arcada cigomática muy marcada, con gran desarrollo de los músculos temporales y maseteros y de la región suborbital.</p>
<p><strong>Cara u hocico</strong>: de menor longitud que el cráneo (40% del total). Gran anchura, en prolongación del cráneo. Líneas craneofaciales rectas o ligeramente convergentes.</p>
<p><strong>Trufa</strong> ancha, fuertemente pigmentada en negro, con orificios bien abiertos.</p>
<p><strong>Labios</strong> medianamente gruesos y carnosos. El superior cubre al inferior formando una V invertida vista de frente. Mucosas de color oscuro, negro deseable. Normalmente no babea.</p>
<p><strong>Maxilares y mordida</strong>: dientes con base de inserción muy fuertes y bien encajados. Generalmente no presenta prognatismo. <strong>Mordida en tenaza o en tijera</strong>. Caninos con amplia distancia transversal.</p>

<h3>4. Orejas</h3>
<p>Colgantes cuando están completas. De arranque brusco y mediano tamaño, implantación alta. Se mantienen planas sobre el cráneo o plegadas en rosa. <strong>Si se recortan conforme a la tradición, quedan erectas y de forma triangular</strong>. Los ejemplares con orejas completas competirán en las mismas condiciones que los de orejas recortadas.</p>

<h3>5. Cuello</h3>
<p>Cilíndrico, recto, macizo y muy musculoso, especialmente en la parte superior. Más bien corto. Borde inferior con piel floja que contribuye a la formación de <strong>doble papada no excesiva</strong>, en sentido longitudinal. Longitud media: entre 18 y 20 cm.</p>

<h3>6. Extremidades anteriores</h3>
<p>Perfectamente aplomadas, de huesos anchos y revestidos de musculatura potente y visible. Codos ni pegados al costillar ni abiertos. <strong>Pie de gato</strong>. Uñas sólidas, negras o blancas según la coloración del manto. Longitud media del antebrazo: 23 cm. Caña anterior: 14 cm.</p>

<h3>7. Tronco</h3>
<p>Su longitud supera normalmente la alzada a la cruz en un <strong>10-12 %</strong>. Pecho ancho y de gran amplitud. Visto lateralmente debe llegar como mínimo al codo. Perímetro torácico igual a la alzada más 1/3 de ésta, siendo deseable superarlo. Costillas bien arqueadas. Perímetro torácico medio: 88 cm.</p>
<p><strong>Línea dorsolumbar:</strong> recta, ascendiendo ligeramente hacia la grupa.</p>
<p><strong>Grupa:</strong> recta, de longitud media y ancha. La altura a la grupa presenta normalmente <strong>1,5 cm de más en relación a la altura a la cruz</strong>.</p>
<p><strong>Vientre:</strong> moderadamente recogido, formando una línea arqueada prolongación del costillar.</p>

<h3>8. Cola</h3>
<p>De inserción alta, flexible, de nacimiento grueso y carnoso, afinándose hacia la punta hasta el corvejón. <strong>En acción se eleva en forma de sable con la punta hacia adelante, sin enroscarse</strong>.</p>

<h3>9. Extremidades posteriores</h3>
<p>Potentes. Correctamente aplomadas de frente y de perfil. Muslos largos y musculosos. <strong>Angulaciones poco pronunciadas</strong>. Pie de gato. Normalmente no presenta espolón. Corvejones sin desviaciones y bajos.</p>

<h3>10. Manto</h3>
<p><strong>Pelo:</strong> corto en toda su extensión. Generalmente más espeso en la cruz, garganta y cresta de las nalgas. Sin subpelo. Compacto en la cola. De aspecto rústico, presenta cierta aspereza.</p>
<p><strong>Color:</strong></p>
<ul>
  <li><strong>Atigrado (Bardino)</strong> en toda su gama, desde el oscuro muy cálido al gris neutro muy claro y rubio.</li>
  <li><strong>Leonados</strong> en toda su gama, hasta el arena.</li>
</ul>
<p>Pueden aparecer manchas blancas alrededor del cuello (incluso prolongándose al cráneo) o en las extremidades, siendo deseable que la presencia del blanco sea lo más reducida posible. Es habitual una mancha blanca en el pecho. <strong>La máscara es siempre de color oscuro</strong> y puede alcanzar la altura de los ojos.</p>

<h3>11. Peso</h3>
<ul>
  <li><strong>Machos:</strong> de 45 a 57 kg.</li>
  <li><strong>Hembras:</strong> de 40 a 50 kg.</li>
</ul>

<h3>12. Defectos</h3>
<p><strong>Defectos leves:</strong> igual altura grupa-cruz; ligero prognatismo; excesivas arrugas en la región cráneo-facial; presencia de espolón; ojos claros; ladrido atípico.</p>
<p><strong>Defectos graves:</strong> escasa pigmentación de la trufa; belfos excesivamente colgantes; ojos de diferente tonalidad; prognatismo excesivo; aspecto ligeramente agalgado; aplomos incorrectos; ausencia de premolares; desequilibrio de carácter, timidez; apariencia frágil; cabeza que no cumple la proporción cráneo-cara; cola enroscada, de igual grosor en toda su longitud, amputada o deforme.</p>
<p><strong>Eliminatorios:</strong> ejemplares monórquidos, criptórquidos o castrados; manchados en blanco superior al 30 % o con manchas en el dorso; enognatismo; despigmentación total de trufa o mucosas.</p>

<hr/>
<p><em>Documento de referencia: Patrón Racial del Presa Canario (1989). <a href="${PDF_URL}" target="_blank" rel="noopener">Descargar el PDF original</a>.</em></p>`

// Texto plano (para body_text — usado en búsqueda + reading time)
const POST_TEXT = POST_HTML
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const readingMinutes = Math.max(1, Math.round(POST_TEXT.split(/\s+/).length / 200))

const postPayload = {
  kennel_id: kennel.id,
  slug: POST_SLUG,
  status: 'published',
  published_at: new Date().toISOString(),
  cover_image_url: null, // se queda sin cover por ahora; Irema puede añadir una luego
  cover_image_alt: 'Patrón racial del Presa Canario 1989',
  title: POST_TITLE,
  excerpt: POST_EXCERPT,
  body: { html: POST_HTML },
  body_text: POST_TEXT,
  author_name: 'Manuel Curtó Gracia',
  author_avatar_url: '/seed/irema/familia.jpg',
  reading_time_minutes: readingMinutes,
  category_slug: 'Raza',
  tags: ['presa canario', 'estándar', '1989', 'patrón racial', 'tradicional'],
  seo_title: 'Estándar del Perro de Presa Canario 1989 — Patrón Racial completo',
  seo_description: POST_EXCERPT.slice(0, 175),
}

// Upsert por slug + kennel_id (si existe, actualiza; si no, crea)
const { data: existing } = await s
  .from('kennel_posts')
  .select('id')
  .eq('kennel_id', kennel.id)
  .eq('slug', POST_SLUG)
  .maybeSingle()

if (existing) {
  const { error } = await s.from('kennel_posts').update(postPayload).eq('id', existing.id)
  if (error) { console.error('Post update error:', error); process.exit(1) }
  console.log(`✓ Post actualizado (ya existía): /kennels/irema-curto/blog/${POST_SLUG}`)
} else {
  const { error } = await s.from('kennel_posts').insert(postPayload)
  if (error) { console.error('Post insert error:', error); process.exit(1) }
  console.log(`✓ Post creado: /kennels/irema-curto/blog/${POST_SLUG}`)
}

console.log(`\n${readingMinutes} min de lectura. ${POST_TEXT.length} caracteres de texto plano.`)
