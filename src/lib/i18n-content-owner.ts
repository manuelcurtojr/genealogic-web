// i18n content pack — pivote OWNER-FIRST (home rediseñada owner-first, pricing
// sin límite de perros, copy de "perros ilimitados"). Clave = español EXACTO.
// (EN consistente con el posicionamiento: usamos "family tree"/"genealogy",
//  evitamos "pedigree" también en inglés, igual que en español.)

export const contentOwner: Record<string, Record<string, string>> = {
  en: {
    // ── Home: HERO ───────────────────────────────────────────────────
    'Toda la vida de tu perro,': "Your dog's whole life,",
    'en un solo sitio.': 'all in one place.',
    'Su perfil, su genealogía, la cartilla veterinaria con recordatorios y las reservas con tu criador. Gratis para siempre, sin límite de perros.':
      'Their profile, their family tree, the vet record with reminders, and the bookings with your breeder. Free forever, with no limit on the number of dogs.',
    'Crear mi cuenta gratis': 'Create my free account',
    '¿Eres criador? →': 'Are you a breeder? →',

    // ── Home: DOS CAMINOS ────────────────────────────────────────────
    'Para ti': 'For you',
    'Genealogic es de tu perro. Y es gratis.': "Genealogic belongs to your dog. And it's free.",
    'Documenta a tus perros sin límite y sin coste. ¿Tienes criadero? También te cubrimos — con un panel completo en Genealogic Breeders.':
      "Document your dogs with no limits and at no cost. Run a kennel? We've got you covered too — with a full dashboard in Genealogic Breeders.",
    'Gratis siempre · Sin límite': 'Always free · No limits',
    'Su ficha con galería, su genealogía sin límite de generaciones, la cartilla veterinaria con recordatorios y las reservas con tu criador. Sin coste, para siempre y sin límite de perros.':
      'Their profile with a gallery, their family tree with no generation limit, the vet record with reminders, and the bookings with your breeder. Free, forever, and with no limit on the number of dogs.',
    'Ficha con galería': 'Profile with gallery',
    'Genealogía sin límite': 'Unlimited family tree',
    'Recordatorios de vacunas': 'Vaccine reminders',
    'Reservas con tu criador': 'Bookings with your breeder',
    'Privado por defecto': 'Private by default',
    'Genealogic Breeders': 'Genealogic Breeders',
    'Genealogías con COI, calendario de celos y partos, camadas con un click, pipeline de reservas que no se pierde un lead, contratos y pagos integrados. Todo desde un único panel.':
      'Family trees with COI, a heat and whelping calendar, litters in one click, a booking pipeline that never drops a lead, and built-in contracts and payments. All from a single dashboard.',
    'Ver Genealogic Breeders →': 'See Genealogic Breeders →',

    // ── Home: CÓMO FUNCIONA ──────────────────────────────────────────
    'De cero a tu perro documentado en 5 minutos.': 'From zero to your dog documented in 5 minutes.',
    'Email + contraseña. Sin tarjeta, sin formularios largos. Empieza gratis y listo.':
      "Email + password. No card, no long forms. Start free and you're set.",
    'Añade a tu perro': 'Add your dog',
    'Manual, reclamándolo del catálogo o pegando la URL de Dogsfiles/K9data — nuestro importador con IA extrae toda la genealogía en 30 segundos.':
      'Manually, by claiming it from the catalog, or by pasting a Dogsfiles/K9data URL — our AI importer pulls the entire family tree in 30 seconds.',
    'Sube fotos, sigue la cartilla veterinaria con recordatorios, gestiona las reservas con tu criador y comparte su ficha con un link. Todo desde el primer día.':
      'Upload photos, keep the vet record with reminders, manage the bookings with your breeder, and share their profile with a link. All from day one.',

    // ── Home: PRODUCTO / BENTO ───────────────────────────────────────
    'La ficha de tu perro, su árbol genealógico y tus reservas — todo operativo desde el momento que entras.':
      "Your dog's profile, their family tree, and your bookings — all up and running the moment you log in.",
    'Sin límite de generaciones · navegable · exportable.': 'No generation limit · navigable · exportable.',

    // ── Home: BANDA / PRICING POINTER ────────────────────────────────
    'Gratis para siempre': 'Free forever',
    'Para propietarios, Genealogic es gratis para siempre, sin límite de perros.':
      'For owners, Genealogic is free forever, with no limit on the number of dogs.',
    '¿Tienes criadero? Genealogic Breeders te da camadas, pipeline de reservas, contratos y web propia.':
      'Run a kennel? Genealogic Breeders gives you litters, a booking pipeline, contracts, and your own website.',

    // ── Home: FAQ ────────────────────────────────────────────────────
    'Sí. Si eres propietario, Genealogic es gratis para siempre y sin límite de perros: ficha con galería, genealogía, cartilla veterinaria con recordatorios y reservas con tu criador. No pedimos tarjeta. Solo los criaderos que quieren el panel profesional (camadas, pipeline, web propia) pasan a un plan de pago en Genealogic Breeders.':
      "Yes. If you're an owner, Genealogic is free forever and with no limit on the number of dogs: profile with gallery, family tree, vet record with reminders, and bookings with your breeder. We don't ask for a card. Only kennels that want the professional dashboard (litters, pipeline, own website) move to a paid plan in Genealogic Breeders.",
    '¿Puedo reclamar un perro que ya está en el catálogo?': "Can I claim a dog that's already in the catalog?",
    'Sí. Hemos importado miles de perros de clubes y federaciones. Búscalo por nombre, microchip o afijo, pulsa «Reclamar» y sube tus papeles. Un humano lo revisa en menos de 72h y te transfiere la titularidad.':
      'Yes. We\'ve imported thousands of dogs from clubs and federations. Search by name, microchip, or kennel name, click "Claim," and upload your papers. A human reviews it in under 72h and transfers ownership to you.',
    'Sin límite de generaciones por perro. El COI (coeficiente de consanguinidad) se calcula sobre toda la profundidad disponible, no las 4-5 típicas de los certificados de los clubs.':
      'No generation limit per dog. The COI (coefficient of inbreeding) is calculated over all available depth, not the typical 4-5 generations of club certificates.',
    '«Importé 200 genealogías de Dogsfiles en una tarde con la URL. El COI por camada me ha hecho replantear varios cruces.»':
      '"I imported 200 family trees from Dogsfiles in one afternoon with the URL. The per-litter COI made me rethink several pairings."',
    'No. Si están en Dogsfiles, Presadb, K9data, Working-dog o Breedarchive, pegas la URL y nuestro importador con IA extrae la genealogía completa en 30 segundos. También aceptamos PDFs y capturas de pantalla.':
      'No. If they\'re on Dogsfiles, Presadb, K9data, Working-dog, or Breedarchive, paste the URL and our AI importer pulls the full family tree in 30 seconds. We also accept PDFs and screenshots.',

    // ── Home: CTA FINAL ──────────────────────────────────────────────
    'Tu perro empieza a tener su historia': 'Your dog starts building their story',
    'hoy.': 'today.',
    'Crea tu cuenta en 30 segundos. Gratis para siempre, sin límite de perros.':
      'Create your account in 30 seconds. Free forever, with no limit on the number of dogs.',

    // ── Pricing: planes sin límite de perros ─────────────────────────
    'Perros ilimitados, gratis para siempre': 'Unlimited dogs, free forever',
    'Para documentar tus perros': 'To document your dogs',
    'Afijo, contactos y gestión de criadero casero': 'Kennel name, contacts and hobby-breeder management',
    'Perros ilimitados en todos los planes': 'Unlimited dogs on every plan',
    'Sube todos los perros que quieras —reproductores, camadas, retirados o fallecidos— sin límite ni coste extra, incluso en Owner y Kennel Free. No cobramos por perro: pagas por las':
      "Add as many dogs as you want —studs, litters, retired or deceased— with no limit or extra cost, even on Owner and Kennel Free. We don't charge per dog: you pay for the",
    'herramientas de criadero': 'kennel tools',
    ' (embudo, contratos, web, emailbot, simulador de cruces, genotipos y estadísticas). El propietario es gratis para siempre.':
      ' (funnel, contracts, website, emailbot, mating simulator, genotypes and analytics). The owner is free forever.',
    'Sí. Owner y Kennel Free no caducan ni piden tarjeta. La diferencia entre planes está en las herramientas (criadero, web, emailbot…), no en cuántos perros tienes — eso es ilimitado en todos. Cuando necesites más herramientas, te ofrecemos subir, pero nunca te empujamos.':
      "Yes. Owner and Kennel Free never expire and never ask for a card. The difference between plans is the tools (kennel, website, emailbot…), not how many dogs you have — that's unlimited on all of them. When you need more tools, we offer an upgrade, but we never push you.",
    'Cuando marcas un perro como fallecido (In Memoriam), Genealogic conserva su ficha con toda su genealogía, fotos y palmarés, y la oculta del directorio público. No hay ningún límite del que descontar: tienes perros ilimitados en todos los planes. Útil para propietarios que han tenido varios perros a lo largo de su vida y quieren documentarlos a todos. Los perros con más de 20 años se marcan automáticamente como fallecidos (puedes contradecirlo en los 30 días siguientes).':
      "When you mark a dog as deceased (In Memoriam), Genealogic keeps its profile with all its genealogy, photos and awards, and hides it from the public directory. There's no limit to count against: you have unlimited dogs on every plan. Handy for owners who've had several dogs over their lifetime and want to document them all. Dogs over 20 years old are marked deceased automatically (you can override it within the next 30 days).",
    'Ambos son gratis y con perros ilimitados — la diferencia son las herramientas de criadero. Owner es para el particular que documenta a sus perros: ficha, genealogía, cartilla y galería. Kennel Free es para el criador casero que además gestiona camadas, reservas y contratos (afijo, pipeline, CRM y stud-book privado). Si tienes un macho semental y una hembra y os llega una camada, Free.':
      'Both are free and with unlimited dogs — the difference is the kennel tools. Owner is for the individual documenting their dogs: profile, family tree, health record and gallery. Kennel Free is for the hobby breeder who also manages litters, bookings and contracts (kennel name, pipeline, CRM and a private stud-book). If you have a stud male and a female and a litter is on the way, go Free.',

    // ── Register + dog-form (perros ilimitados) ──────────────────────
    'Tu plan Owner es gratis para siempre, con perros ilimitados. Crea tu cuenta y empieza a documentar a tus perros.':
      'Your Owner plan is free forever, with unlimited dogs. Create your account and start documenting your dogs.',
    'Tu plan Kennel Free es gratis para siempre, con perros ilimitados. Crea tu cuenta para registrar tu criadero y empezar a publicar tus perros.':
      'Your Kennel Free plan is free forever, with unlimited dogs. Create your account to register your kennel and start publishing your dogs.',
    'Plan Owner · Gratis para siempre · Perros ilimitados': 'Owner plan · Free forever · Unlimited dogs',
    'Plan Kennel Free · Gratis para siempre · Perros ilimitados': 'Kennel Free plan · Free forever · Unlimited dogs',
    'Su ficha y genealogía se conservan; se oculta del directorio público.':
      "Their profile and family tree are kept; it's hidden from the public directory.",
    'aparecerá como «En memoria». Su ficha, genealogía, fotos y palmarés se conservan, pero se oculta del directorio público.':
      'will appear as "In memoriam." Their profile, family tree, photos and awards are kept, but it\'s hidden from the public directory.',

    // ── Footer: banda descarga app iOS ───────────────────────────────
    'La app de Genealogic, ya en iOS': 'The Genealogic app, now on iOS',
    'La ficha y la cartilla veterinaria de tu perro en el bolsillo. La genealogía y los recordatorios, contigo siempre — y la cartilla disponible offline cuando el vet la pida.':
      "Your dog's profile and vet record in your pocket. Their family tree and reminders, with you always — and the vet record available offline whenever the vet asks for it.",
    'Descargar en la App Store': 'Download on the App Store',
    'Descárgalo en la': 'Download on the',
    'Vacunas al día': 'Vaccines up to date',
    'Genealogía 5 gen': '5-gen family tree',

    // ── Home: ÁRBOL GENEALÓGICO (sección destacada owner) ─────────────
    'Su linaje': 'Their lineage',
    'El árbol genealógico de tu perro, sin límite de generaciones.':
      "Your dog's family tree, with no generation limit.",
    'Cada ancestro con su foto y un enlace al criadero de origen. Constrúyelo a mano o pega la URL de Dogsfiles, K9data o el club: nuestro importador con IA extrae toda la línea en 30 segundos.':
      'Every ancestor with their photo and a link to the kennel of origin. Build it by hand or paste a Dogsfiles, K9data or club URL: our AI importer pulls the whole line in 30 seconds.',
    'Generaciones ilimitadas, navegables y exportables.':
      'Unlimited generations, navigable and exportable.',
    'Ancestros con foto y enlace a su criadero de origen.':
      'Ancestors with a photo and a link to their kennel of origin.',
    'Importa la genealogía desde Dogsfiles, K9data y más con IA.':
      'Import the family tree from Dogsfiles, K9data and more with AI.',

    // ── Home: PILARES DEL PROPIETARIO (bento) ────────────────────────
    'Todo en un sitio': 'All in one place',
    'Todo lo que tu perro necesita, en su ficha.':
      "Everything your dog needs, on their profile.",
    'Su ficha con galería': 'Their profile with a gallery',
    'Fotos y vídeos, microchip, color, peso y alzada. Toda la identidad de tu perro en un perfil cuidado, tan completo como tú quieras.':
      "Photos and videos, microchip, color, weight and height. Your dog's whole identity in a polished profile, as complete as you want it.",
    'Salud con recordatorios': 'Health with reminders',
    'Cartilla, vacunas, desparasitaciones y visitas — con avisos automáticos.':
      'Health record, vaccines, deworming and visits — with automatic alerts.',
    'Calendario del perro': "The dog's calendar",
    'Sus citas y avisos, para que no se te pase ni una.':
      "Their appointments and alerts, so you never miss one.",
    'Sigue el estado, firma el contrato, paga y recibe sus documentos.':
      'Track the status, sign the contract, pay, and receive their documents.',
    'Papeles siempre a mano': 'Papers always on hand',
    'Cartilla, contrato y microchip digitalizados — incluso sin cobertura en el vet.':
      'Health record, contract and microchip digitized — even with no signal at the vet.',
    '¿Ya está importado de un club? Búscalo y reclámalo como tuyo.':
      'Already imported from a club? Find it and claim it as yours.',
    'Compártelo con un link': 'Share it with a link',
    'Un perfil público opcional para enseñar a tu perro. Privado por defecto.':
      'An optional public profile to show off your dog. Private by default.',
    'Tuyo y privado': 'Yours and private',
    'Privado por defecto, exportable y borrable. Perros ilimitados, gratis.':
      'Private by default, exportable and deletable. Unlimited dogs, free.',
    'Ver todas las funciones': 'See all features',

    // ── Home: TESTIMONIOS (propietario) ──────────────────────────────
    'Lo dice gente real': 'Real people say it',
    'Propietaria': 'Owner',
    '«Tengo la cartilla de mi perro siempre en el móvil y los recordatorios de vacunas me avisan solos. En el vet ya no busco papeles.»':
      '"I keep my dog\'s health record on my phone at all times, and the vaccine reminders alert me on their own. At the vet I no longer dig for papers."',
    '«Pegué la URL de la genealogía que me pasó mi criador y se montó el árbol entero con fotos. Ahora comparto la ficha de mi perra con un link.»':
      '"I pasted the genealogy URL my breeder gave me and the whole tree was built with photos. Now I share my dog\'s profile with a link."',

    // ── Home: FAQ (propietario) ──────────────────────────────────────
    '¿Mis datos son míos? ¿Es privado?': 'Is my data mine? Is it private?',
    'Sí. Tu perro es privado por defecto: solo lo ves tú salvo que actives su perfil público. Servidores en la UE, RGPD por defecto e histórico completo de cambios. Exportas su ficha y genealogía a PDF en un click y, si te vas, te llevas tus datos o los borras.':
      "Yes. Your dog is private by default: only you see it unless you turn on its public profile. Servers in the EU, GDPR by default, and a full change history. You export its profile and family tree to PDF in one click and, if you leave, you take your data with you or delete it.",
    '¿Puedo tener varios perros?': 'Can I have several dogs?',
    'Sí. Perros ilimitados, gratis para siempre. Documenta a todos los que tengas —y también a los que ya no están, con In Memoriam, que conserva su ficha y su genealogía intactas.':
      'Yes. Unlimited dogs, free forever. Document all the ones you have —and the ones who are no longer here too, with In Memoriam, which keeps their profile and family tree intact.',
    '¿Y los papeles de mi perro?': "And my dog's papers?",
    'Digitalizas la cartilla, el contrato, el certificado y el microchip una vez y los tienes siempre a mano —incluso sin cobertura en el veterinario. Se acabó buscar carpetas.':
      'You digitize the health record, the contract, the certificate and the microchip once and keep them on hand forever —even with no signal at the vet. No more digging through folders.',
    '¿Tengo que montar la genealogía de mi perro yo mismo?':
      "Do I have to build my dog's family tree myself?",
    'No. Si está en Dogsfiles, Presadb, K9data, Working-dog o Breedarchive, pegas la URL y nuestro importador con IA extrae la genealogía completa en 30 segundos. También aceptamos PDFs y capturas de pantalla.':
      'No. If it\'s on Dogsfiles, Presadb, K9data, Working-dog or Breedarchive, paste the URL and our AI importer pulls the full family tree in 30 seconds. We also accept PDFs and screenshots.',

    // ── Home: mockup ficha (sin SEO) ─────────────────────────────────
    'Ficha del perro': "Dog's profile",
    'Comparte su ficha con un link': 'Share their profile with a link',

    // ── /criadores: coherencia perros ilimitados ─────────────────────
    'Perros ilimitados · Criador casero': 'Unlimited dogs · Hobby breeder',
    'Owner es para propietarios particulares que documentan a sus perros (su mascota o las que han tenido a lo largo de la vida). Kennel Free es para el criador casero o aficionado que ya maneja camadas, reservas, contratos y CRM de clientes. Ambos son gratis para siempre y con perros ilimitados — la diferencia son las herramientas de criadero.':
      "Owner is for individual owners documenting their dogs (their pet or the ones they've had over a lifetime). Kennel Free is for the hobby or amateur breeder who already handles litters, bookings, contracts and a client CRM. Both are free forever and with unlimited dogs — the difference is the kennel tools.",
    'Todo Kennel Free + COI Wright explicado (lista de ancestros duplicados, comparativa con la raza), simulador de cruces con COI proyectado y predicción de color por genotipos, pagos integrados con Stripe Connect (cobras señas y entregas), registro de visitas al criadero y soporte prioritario en menos de 24 horas.':
      'Everything in Kennel Free + explained Wright COI (list of duplicated ancestors, breed comparison), a mating simulator with projected COI and color prediction from genotypes, integrated payments with Stripe Connect (collect deposits and final payments), kennel visit tracking, and priority support in under 24 hours.',
  },
}
