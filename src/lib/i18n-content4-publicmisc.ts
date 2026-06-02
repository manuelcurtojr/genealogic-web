// i18n — Fase 4 Wave 4 · carpetas PÚBLICAS varias (chrome, NO cuerpo de contenido)
// Cubre: components/kennels (directorio), components/features-page (landing chrome),
//        components/blog (chrome de lectura: pedigree-preview + post CTA),
//        components/inquiry (formulario "pedir información"),
//        components/feedback (botón + modal de feedback).
//
// Clave = español EXACTO tal como aparece en el código (incl. puntuación, "…", "...").
// 'es' es la clave base y no necesita diccionario.
//
// Glosario aplicado: genealogy (NUNCA pedigree en UI), kennel, breeder, founded in,
// no results, send, feedback. Marca "Genealogic", planes ("Kennel Pro", "Pro"),
// nombres de producto y datos de BD NO se traducen.
//
// NOTA: este archivo debe importarse y mezclarse en getTranslator() de i18n.ts
// (igual que los demás content4-*) para que las claves nuevas surtan efecto.

export const content4PublicMisc: Record<string, Record<string, string>> = {
  en: {
    // ─── kennels — directorio público de criaderos ───
    'Buscar criadero...': 'Search kennel...',
    'No se encontraron criaderos': 'No kennels found',
    'criadero': 'kennel',
    'criaderos': 'kennels',
    'Fundado en': 'Founded in',
    'Has visto los': 'You\'ve seen all',

    // ─── features-page — landing de características (chrome) ───
    'Problema': 'Problem',
    'Y además': 'And more',
    'Explorar features': 'Explore features',
    '¿Listo?': 'Ready?',
    'Empieza gratis. Kennel Pro 7 días de prueba sin tarjeta.': 'Start free. Kennel Pro 7-day trial, no card required.',
    'Crear cuenta': 'Create account',

    // ─── blog — chrome de lectura (pedigree-preview) ───
    'Genealogía': 'Genealogy',
    '3 generaciones': '3 generations',
    'El perro': 'The dog',
    'Padre': 'Sire',
    'Madre': 'Dam',
    'Abuelo paterno': 'Paternal grandsire',
    'Abuela paterna': 'Paternal granddam',
    'Abuelo materno': 'Maternal grandsire',
    'Abuela materna': 'Maternal granddam',
    'Desconocido': 'Unknown',
    'Ver la genealogía completa de': 'See the full genealogy of',

    // ─── blog — CTA de cierre de post (prose.tsx) ───
    'Empieza gratis en Genealogic': 'Start free on Genealogic',
    'El registro público mundial de perros con genealogía. Crea cuenta, importa tus perros y publica tu árbol verificable en minutos.': 'The worldwide public registry of dogs with genealogy. Create an account, import your dogs and publish your verifiable tree in minutes.',
    'Crear cuenta gratis': 'Create a free account',
    '¿Listo para profesionalizar tu criadero?': 'Ready to professionalize your kennel?',
    'Pipeline de reservas, CRM de clientes, web pública con dominio propio y emailbot. Precio Founder por vida si te subes ahora.': 'Reservation pipeline, client CRM, public website with your own domain and emailbot. Lifetime Founder price if you join now.',
    'Ver tier Pro': 'See Pro tier',
    'Importa tu genealogía con IA': 'Import your genealogy with AI',
    'Sube una foto de una genealogía existente y obtén el árbol completo en segundos. Funciona con cualquier formato: FCI, RSCE, AKC, manuscrito.': 'Upload a photo of an existing genealogy and get the full tree in seconds. Works with any format: FCI, RSCE, AKC, handwritten.',
    'Probar la importación': 'Try the import',

    // ─── inquiry — formulario "pedir información" ───
    'Apuntarme a la lista de espera': 'Join the waiting list',
    '¡Recibido!': 'Received!',
    'Tu mensaje ha llegado al criador. Te responderá personalmente lo antes posible.': 'Your message has reached the breeder. They will reply to you personally as soon as possible.',
    'Cerrar': 'Close',
    'Lista de espera': 'Waiting list',
    'Déjanos tus datos y te contactaremos antes de la próxima camada.': 'Leave us your details and we\'ll contact you before the next litter.',
    'Tu nombre completo *': 'Your full name *',
    'Email': 'Email',
    'Teléfono': 'Phone',
    '¿Algo que quieras contarnos? Sexo preferido, fechas, etc.': 'Anything you\'d like to tell us? Preferred sex, dates, etc.',
    'Cancelar': 'Cancel',
    'Enviando…': 'Sending…',
    'Enviar': 'Send',

    // ─── feedback — botón + modal ───
    '¿Algo ha salido mal?': 'Something went wrong?',
    'Cuéntanos qué ha pasado': 'Tell us what happened',
    'Zona:': 'Area:',
    'Tu feedback acaba de llegar al equipo. Lo revisamos a menudo (suele ser en menos de 24h) y si necesitamos más detalle te escribimos al email.': 'Your feedback has just reached the team. We review it often (usually within 24h) and if we need more detail we\'ll email you.',
    'Ticket:': 'Ticket:',
    '¿Preguntar primero a la IA?': 'Ask the AI first?',
    '(opcional)': '(optional)',
    'Ocultar': 'Hide',
    'Probar': 'Try',
    'Si tu problema es común te lo resolvemos al instante. Si no, manda el ticket abajo y lo miramos nosotros.': 'If your problem is common we\'ll solve it instantly. If not, send the ticket below and we\'ll look into it.',
    'Pensando...': 'Thinking...',
    'Ej: el importador no detecta este perro': 'E.g.: the importer doesn\'t detect this dog',
    'Preguntar': 'Ask',
    'Describe el problema': 'Describe the problem',
    'Qué intentabas hacer, qué pasó y qué esperabas. Cuanto más concreto, antes lo arreglamos.': 'What you were trying to do, what happened and what you expected. The more specific, the sooner we fix it.',
    'Estaba subiendo una foto al perro Rocky y me sale \'error al guardar\'. La foto pesa 2MB y es JPG. Ya lo intenté 3 veces.': 'I was uploading a photo to the dog Rocky and I get \'error saving\'. The photo is 2MB and JPG. I\'ve already tried 3 times.',
    'Capturamos automáticamente la página y el navegador. No subimos contraseñas ni datos de tarjeta — esto solo lo ve el equipo de Genealogic.': 'We automatically capture the page and the browser. We don\'t upload passwords or card details — only the Genealogic team sees this.',
    'Enviar feedback': 'Send feedback',
    'Cerrar modal': 'Close modal',
    'Escribe al menos unos detalles sobre lo que ha pasado.': 'Write at least a few details about what happened.',
    'No he podido procesar tu pregunta. Mándalo abajo como feedback.': 'I couldn\'t process your question. Send it below as feedback.',
    'No he podido conectar. Escribe el problema abajo y lo revisamos en menos de 24h.': 'I couldn\'t connect. Write the problem below and we\'ll review it within 24h.',
    'No se pudo enviar el feedback. Inténtalo de nuevo.': 'The feedback couldn\'t be sent. Please try again.',
  },
}
