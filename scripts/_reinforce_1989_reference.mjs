/**
 * Refuerza en blog + estándar Genealogic la idea de que el patrón
 * racial de 1989 es, para muchos criadores serios, el original y la
 * referencia correcta frente a las revisiones posteriores del FCI.
 */
import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PDF_URL = 'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/standards/presa-canario-1989.pdf'

// ═══════════════════════════════════════════════════════════════════════════
// 1) Blog post — añadir párrafo destacado al principio + ajustar excerpt
// ═══════════════════════════════════════════════════════════════════════════
const NEW_EXCERPT =
  'Para muchos criadores serios del Presa Canario, el Patrón Racial de 1989 es el verdadero original y la referencia correcta de la raza — anterior al FCI y a sus revisiones posteriores. En Irema Curtó es el documento al que volvemos cuando hablamos de cómo debe ser un Presa Canario auténtico.'

const NEW_HTML = `<p class="lead"><strong>Para muchos criadores serios del Presa Canario, el Patrón Racial de 1989 es el verdadero original</strong> y la referencia que debe tomarse como correcta. Es el documento redactado antes del reconocimiento FCI (2001), cuando la raza se describía tal como la habían fijado generaciones de pastores y criadores canarios — sin las modificaciones que vinieron después.</p>

<p>En Irema Curtó consideramos que este es el documento al que hay que volver cuando hablamos de cómo debe ser un Presa Canario auténtico. Las revisiones posteriores del FCI han ido suavizando rasgos morfológicos y de presentación importantes; el de 1989 mantiene la descripción del Presa preselección moderna, con todo lo que eso implica.</p>

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

const newBodyText = NEW_HTML
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const { data: kennel } = await s.from('kennels').select('id').eq('slug', 'irema-curto').single()
const { error: postErr } = await s
  .from('kennel_posts')
  .update({
    excerpt: NEW_EXCERPT,
    body: { html: NEW_HTML },
    body_text: newBodyText,
    seo_description: NEW_EXCERPT.slice(0, 175),
    updated_at: new Date().toISOString(),
  })
  .eq('kennel_id', kennel.id)
  .eq('slug', 'estandar-del-perro-de-presa-canario-1989')
if (postErr) { console.error('Post error:', postErr); process.exit(1) }
console.log('✓ Blog post actualizado con párrafo destacado al inicio')

// ═══════════════════════════════════════════════════════════════════════════
// 2) genealogic_standard.info-general — añadir la postura editorial
// ═══════════════════════════════════════════════════════════════════════════
const { data: presa } = await s
  .from('breeds')
  .select('id, genealogic_standard')
  .eq('slug', 'presa-canario')
  .single()

const sections = [...(presa.genealogic_standard?.sections || [])]
const idx = sections.findIndex((sec) => sec.key === 'info-general')
if (idx === -1) { console.error('info-general section not found'); process.exit(1) }

sections[idx] = {
  ...sections[idx],
  content:
    'Origen: España (Islas Canarias). Reconocida desde el siglo XVI en los Acuerdos de los Cabildos de Tenerife y Fuerteventura, donde ya se cita la presencia de "perros de presa" en las islas.\n\n' +
    'El **Presa Canario moderno** se perfila a finales del siglo XIX con la influencia decisiva del **Perro de Ganado Majorero** (Bardino Majorero), que es lo que le confiere su tipología distintiva frente al resto de molosoides.\n\n' +
    'Sinónimos: en Tenerife también se le llama "Perro Basto" o "Berdino" (para los ejemplares de manto bardino o atigrado).\n\n' +
    'Patrón racial de referencia: **Patrón Racial del Presa Canario (1989)**. Para muchos criadores serios de la raza, este es el estándar **original** y la referencia que hay que tomar como correcta, anterior al reconocimiento FCI (2001) y a las revisiones posteriores que han ido suavizando rasgos morfológicos y de presentación importantes. La FCI publicó después el estándar vigente nº 346, con última revisión en 2023.',
}

const { error: bErr } = await s
  .from('breeds')
  .update({ genealogic_standard: { ...presa.genealogic_standard, sections } })
  .eq('id', presa.id)
if (bErr) { console.error('Breed error:', bErr); process.exit(1) }
console.log('✓ info-general del estándar Genealogic actualizado con la postura')
