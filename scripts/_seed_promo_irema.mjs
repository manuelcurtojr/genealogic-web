/**
 * Seed promotional_content para las 2 razas que cría Irema Curtó:
 * Presa Canario + Perro de Ganado Majorero.
 *
 * Tono: cálido pero técnico. Sin tópicos cursi-pet. Equilibra seducción
 * con datos reales del estándar y de la historia de la raza.
 */
import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PRESA_CANARIO = {
  tagline:
    'El moloso canario por excelencia: poder, presencia y un instinto guardián que no se aprende, se hereda.',
  intro:
    'El Presa Canario es la raza autóctona más reconocible del archipiélago. Desarrollada durante siglos en Tenerife y Gran Canaria como perro de boyero y guardián de fincas, combina la fuerza física de los molosos antiguos con una funcionalidad real que se ha perdido en muchas razas similares. No es un perro de exposición disfrazado: es un perro de trabajo que sigue haciendo su trabajo cuando se le da la oportunidad.\n\nReconocido por la FCI desde 2001 (estándar nº 346, última revisión en 2023), bajo esa ficha técnica hay un perro que en la práctica se mueve, observa y decide con una calma que sorprende a quien lo ve por primera vez.',
  virtues: [
    {
      title: 'Guardián territorial sin entrenamiento',
      body: 'El Presa no necesita cursos para vigilar una propiedad. Su instinto de territorialidad está fijado por selección desde hace generaciones; aprende los límites de tu casa y los hace suyos.',
    },
    {
      title: 'Equilibrio extraordinario en familia',
      body: 'Pese a su porte, es notablemente paciente con los niños de su núcleo. Distingue entre miembros de la familia y desconocidos con una claridad que pocas razas igualan.',
    },
    {
      title: 'Salud robusta de raza autóctona',
      body: 'Al haber sido seleccionado por funcionalidad durante siglos antes de su reconocimiento FCI, conserva una rusticidad genética que se traduce en menos problemas estructurales que en muchos molosos modernos.',
    },
    {
      title: 'Manto bardino o leonado, estética inconfundible',
      body: 'El atigrado característico (bardino) en sus distintas tonalidades, con máscara negra obligatoria, hace que un Presa Canario adulto no se confunda con ninguna otra raza.',
    },
  ],
  temperament:
    'Confiado, sereno y observador. No es un perro nervioso ni explosivo: actúa cuando lee una situación real. Esa lectura emocional del entorno es probablemente lo que más sorprende a sus propietarios primerizos.',
  ideal_for:
    'Hogares con espacio exterior, idealmente con jardín o finca. Personas con experiencia previa en razas grandes, o dispuestas a invertir en socialización temprana y educación coherente. No es la raza para apartamento pequeño ni para primer perro.',
  daily_life:
    'Necesita actividad física diaria moderada — paseos largos, salida controlada en finca, juego con su gente. No es un atleta extremo como un Malinois, pero sí un perro funcional que se aburre si pasa la vida tumbado. Su pelaje corto le hace cómodo el clima cálido y le penaliza el frío extremo.',
  considerations:
    'Su tamaño y carácter dominante requieren mano firme y serena. Mal socializado o mal liderado, un Presa puede ser muchísimo perro. Bien gestionado, es uno de los compañeros más fiables que existen. Comprueba siempre la legislación local: en algunos países está en lista de razas potencialmente peligrosas y requiere licencia y seguro.',
  closing:
    'Si buscas un perro que sea presencia, lealtad y un vínculo real de trabajo, el Presa Canario es difícil de superar. Habla con un criador que conozca de verdad la raza, incluyendo lo bueno y lo exigente.',
}

const MAJORERO = {
  tagline:
    'El pastor canario de Fuerteventura: el perro de trabajo más austero de las islas, hecho a la medida de su tierra.',
  intro:
    'El Perro de Ganado Majorero es la raza autóctona menos conocida de Canarias y, paradójicamente, una de las más antiguas del archipiélago. Durante siglos guardó el ganado caprino en las majadas de Fuerteventura sin estándar escrito, sin libro genealógico y sin más selección que la supervivencia útil. Recibió reconocimiento oficial por la RSCE como raza autóctona española en 1994; la FCI todavía no lo ha admitido.\n\nNo verás un Majorero ganando concursos internacionales: la raza se mantiene por el ojo de los pastores y los pocos criadores que entienden lo que representa. Eso le ha permitido conservar la funcionalidad que otras razas han perdido al pasar por el ring.',
  virtues: [
    {
      title: 'Perro de trabajo de verdad',
      body: 'El Majorero sigue trabajando con cabras y ovejas en Fuerteventura. No es una raza recuperada ni reconstruida: es una raza que nunca dejó de hacer su oficio.',
    },
    {
      title: 'Resistencia al clima árido',
      body: 'Seleccionado durante siglos en uno de los climas más exigentes de España — sol, viento y sequía — un Majorero soporta condiciones que ahogarían a otras razas.',
    },
    {
      title: 'Carácter equilibrado, sin estridencias',
      body: 'Es un perro tranquilo, atento, que vigila sin ladrar de más. La función de pastoreo y guarda ha seleccionado individuos serenos y decididos a partes iguales.',
    },
    {
      title: 'Manto atigrado característico',
      body: 'El verdino (atigrado canario) en sus tonos sobre fondo leonado o grisáceo es la seña visual de la raza, y le da una imagen sobria y funcional muy distinta a la de cualquier moloso.',
    },
  ],
  temperament:
    'Vigilante sin agresividad, leal a su gente, reservado con los extraños. No es un perro efusivo ni un guardián exhibicionista: es un perro que observa, calcula y solo entra en acción cuando hay motivo.',
  ideal_for:
    'Quien valora el carácter rústico y funcional de un perro autóctono. Personas con espacio rural, finca o entorno semi-rural. Quienes quieren un perro de trabajo real, no un perro de salón disfrazado de "raza original".',
  daily_life:
    'Necesita espacio para moverse y un trabajo que le dé sentido, aunque sea improvisado: vigilancia, paseo largo, contacto con ganado o tareas de finca. Su pelaje doble corto le hace muy cómodo el clima mediterráneo y canario. No es un perro urbano.',
  considerations:
    'Raza minoritaria — encontrar un ejemplar de buen origen requiere paciencia y red de contactos. Aún hay debate técnico sobre su tipo ideal entre criadores. Comprar de un criador serio (no de afición improvisada) es clave para no diluir lo poco que queda de raza pura.',
  closing:
    'Si te interesa lo autóctono, lo funcional y lo poco visto, el Majorero es una de las razas más auténticas de España. Apoyar a sus criadores es, literalmente, ayudar a que la raza siga existiendo.',
}

const SEEDS = [
  { slug: 'presa-canario', content: PRESA_CANARIO },
  { slug: 'perro-de-ganado-majorero', content: MAJORERO },
]

for (const seed of SEEDS) {
  const { error } = await s
    .from('breeds')
    .update({ promotional_content: seed.content })
    .eq('slug', seed.slug)
  if (error) {
    console.error(`✗ ${seed.slug}:`, error.message)
  } else {
    const sectionsCount = Object.keys(seed.content).length
    console.log(`✓ ${seed.slug}: ${sectionsCount} secciones aplicadas`)
  }
}

// Verificar
console.log()
const { data } = await s
  .from('breeds')
  .select('slug, name, promotional_content')
  .in('slug', SEEDS.map(s => s.slug))
for (const b of data || []) {
  console.log(`${b.name}: tagline = "${b.promotional_content?.tagline?.slice(0, 70)}..."`)
}
