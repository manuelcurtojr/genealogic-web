// Fase 4 · Wave 3 — i18n content para el módulo EMAILBOT.
//
// Cubre la herramienta que el criador configura para responder leads:
//   - src/components/emailbot/**            (config, playground, hilos, test suite)
//   - src/app/(dashboard)/emailbot/**       (páginas y gates)
//
// Clave = español EXACTO tal como aparece en el código (mismos acentos, mismos
// puntos suspensivos `…` vs `...`, mismas comillas «» y dos puntos `:`).
// Glosario: emailbot, lead, reply (respuesta), auto-reply (respuesta automática),
// inbox (bandeja), tone (tono), knowledge/context (conocimiento), draft (borrador),
// template (plantilla), breeder, kennel, reservation, waiting list.
//
// NO traducir: datos BD, nombres de plan, marca Genealogic/Emailbot, URLs,
// enum keys de lógica, className, tokens {{variable}}, nombres de modelo IA.
// Algunos términos llevan números/valores dinámicos delante o detrás (la frase
// se troceó para no interpolar en t()): aquí se traduce solo el fragmento fijo.
// Apóstrofes del inglés escapados con \'.

export const content4Emailbot: Record<string, Record<string, string>> = {
  en: {
    // ─── Subnav (tabs + hints) ───
    'Configuración': 'Configuration',
    'Activación, tono, reglas y stats del bot': 'Activation, tone, rules and bot stats',
    'Hilos': 'Threads',
    'Conversaciones reales del bot con contactos': 'Real bot conversations with contacts',
    'Probar': 'Test',
    'Playground 1-shot para testear una respuesta del bot': '1-shot playground to test a bot reply',
    'Suite tests': 'Test suite',
    'Bate 16 perfiles ficticios contra tu bot y evalúa calidad (con coste)':
      'Run 16 fictional profiles against your bot and assess quality (paid)',
    'Biblioteca': 'Library',
    'Entradas de conocimiento que alimentan al bot': 'Knowledge entries that power the bot',

    // ─── Config · header ───
    'Tu asistente de email para responder consultas con tu Biblioteca como contexto.':
      'Your email assistant for answering inquiries with your Library as context.',
    'Test': 'Test',

    // ─── Config · stats boxes ───
    'Hilos totales': 'Total threads',
    'Activos (30d)': 'Active (30d)',
    'Escalados': 'Escalated',
    'derivados a ti': 'handed off to you',
    'entradas activas': 'active entries',
    'en Biblioteca': 'in Library',

    // ─── Config · knowledge prerequisite ───
    'La Biblioteca está vacía.': 'The Library is empty.',
    'Para activar el bot necesitas al menos una entrada en la':
      'To activate the bot you need at least one entry in the',
    'El bot responde basándose en lo que tú le hayas dicho — sin entradas, responde demasiado genérico.':
      'The bot answers based on what you have told it — with no entries, it answers too generically.',

    // ─── Config · AI model ───
    'Modelo de IA': 'AI model',
    'guardando...': 'saving...',
    'Elige el modelo que usará el bot para responder. Cuesta más calidad, menos coste por email. Genealogic se encarga de las APIs — tu plan cubre el uso normal.':
      'Choose the model the bot will use to reply. Higher quality costs more, lower cost per email. Genealogic handles the APIs — your plan covers normal usage.',
    'Modelo activo:': 'Active model:',

    // ─── Config · enable toggle ───
    'Auto-responder activo': 'Auto-reply active',
    'Cuando está activo, el bot responde automáticamente a emails entrantes en la dirección de abajo. Cuando está apagado, los emails se guardan pero no se responden.':
      'When active, the bot automatically replies to incoming emails at the address below. When off, emails are stored but not answered.',
    'Desactivar': 'Deactivate',
    'Activar bot': 'Activate bot',

    // ─── Config · inbound address ───
    'Dirección de recepción': 'Inbound address',
    'Los emails que lleguen a esta dirección se procesan automáticamente. Reenvía aquí desde tu inbox real (o configura un alias) para que el bot tome el control.':
      'Emails arriving at this address are processed automatically. Forward here from your real inbox (or set up an alias) so the bot takes over.',
    'Copiado': 'Copied',
    'Copiar': 'Copy',

    // ─── Config · reply identity ───
    'Identidad de respuesta': 'Reply identity',
    'Cómo aparece el remitente cuando el bot responde. Usa tu dominio personal si quieres que vaya en tu nombre.':
      'How the sender appears when the bot replies. Use your own domain if you want it to go out in your name.',
    'Nombre': 'Name',
    'Email': 'Email',

    // ─── Config · signature + escalation ───
    'Firma (se añade al final de cada respuesta)': 'Signature (added to the end of every reply)',
    'Derivar a humano después de N respuestas automáticas': 'Hand off to a human after N automatic replies',
    'Último email recibido:': 'Last email received:',

    // ─── Config · setup notes ───
    'Setup técnico (una sola vez)': 'Technical setup (one-time)',
    'Configura el dominio inbound en Resend (o el provider que prefieras) — p.ej.':
      'Set up the inbound domain in Resend (or the provider you prefer) — e.g.',
    'Añade los registros MX que indique Resend.': 'Add the MX records Resend indicates.',
    'En Resend crea una Inbound webhook apuntando a': 'In Resend create an Inbound webhook pointing to',
    'con header': 'with header',
    'En Vercel define las env vars': 'In Vercel define the env vars',
    'y': 'and',
    'Confirma que la dirección de arriba aparece en el campo «to» del webhook de Resend.':
      'Confirm the address above appears in the "to" field of the Resend webhook.',

    // ─── Config · quota card ───
    'Uso este mes · plan': 'Usage this month · plan',
    'respuesta del bot': 'bot reply',
    'respuestas del bot': 'bot replies',
    'Subir de plan': 'Upgrade plan',
    'Ilimitado': 'Unlimited',
    'respuestas restantes': 'replies remaining',
    'Cuota agotada': 'Quota used up',
    'Tu plan': 'Your',
    'no incluye el emailbot. El emailbot está en Kennel Pro (próximamente). Apúntate a la lista de espera en /pricing.':
      'plan does not include the emailbot. The emailbot is on Kennel Pro (coming soon). Join the waiting list at /pricing.',
    'Has agotado las respuestas del mes. El bot dejará de contestar emails hasta el día 1. Los emails entrantes siguen guardándose en /emailbot/hilos para que respondas tú.':
      'You have used up this month\'s replies. The bot will stop answering emails until the 1st. Incoming emails keep being stored in /emailbot/hilos so you can answer them yourself.',
    'Te quedan': 'You have',
    'respuestas este mes. Considera subir de plan si tu volumen crece.':
      'replies left this month. Consider upgrading if your volume grows.',
    'Detalles e historial en': 'Details and history at',
    'Solo cuentan las respuestas reales del bot; el playground y los imports no consumen cuota.':
      'Only real bot replies count; the playground and imports do not consume quota.',

    // ─── Chat playground ───
    'Test del Emailbot': 'Emailbot Test',
    'Simula consultas reales para ver cómo respondería tu bot con la Biblioteca actual.':
      'Simulate real inquiries to see how your bot would reply with the current Library.',
    'Limpiar': 'Clear',
    'La': 'The',
    'está vacía. El bot responderá de forma genérica hasta que añadas precio, política de reserva, etc.':
      'is empty. The bot will answer generically until you add price, reservation policy, etc.',
    'Escribe una consulta o prueba un ejemplo:': 'Type an inquiry or try an example:',
    'Escribe una consulta como si fueras una familia interesada…':
      'Type an inquiry as if you were an interested family…',
    'Enviar': 'Send',
    'Error en el bot': 'Bot error',
    // Playground scenarios (label + help)
    'Nuevo lead': 'New lead',
    'Persona que escribe por primera vez interesada en cachorros':
      'Person writing for the first time interested in puppies',
    'En lista de espera': 'On the waiting list',
    'Ya está en tu lista de espera, pregunta cuándo hay camada':
      'Already on your waiting list, asks when there is a litter',
    'Con reserva': 'With a reservation',
    'Ya tiene cachorro asignado, pregunta sobre entrega o documentos':
      'Already has a puppy assigned, asks about delivery or documents',
    // Playground example messages (new_lead)
    'Hola, estoy interesado en uno de vuestros cachorros. ¿Cuándo tendréis próxima camada?':
      'Hi, I\'m interested in one of your puppies. When will you have your next litter?',
    '¿Cuánto cuesta un cachorro? ¿Cómo funciona la reserva?':
      'How much does a puppy cost? How does the reservation work?',
    '¿Hacéis envíos fuera de España?': 'Do you ship outside Spain?',
    // Playground example messages (waitlist)
    'Hola, llevo unos meses en la lista de espera. ¿Hay alguna novedad?':
      'Hi, I\'ve been on the waiting list for a few months. Any news?',
    '¿Cuándo creéis que nacerá la próxima camada?': 'When do you think the next litter will be born?',
    '¿Puedo cambiar mi preferencia de sexo de macho a hembra?':
      'Can I change my sex preference from male to female?',
    // Playground example messages (reservation)
    '¿Qué documentación recibiré con el cachorro?': 'What documentation will I receive with the puppy?',
    '¿Cuándo puedo ir a conocer a mi cachorro?': 'When can I come and meet my puppy?',
    '¿Qué pienso recomendáis para las primeras semanas?': 'What food do you recommend for the first weeks?',

    // ─── Threads list ───
    'hilo': 'thread',
    'hilos': 'threads',
    'activo': 'active',
    'activos': 'active',
    'derivado': 'handed off',
    'derivados': 'handed off',
    'Todos': 'All',
    'Activos': 'Active',
    'Derivados': 'Handed off',
    'Cerrados': 'Closed',
    'Buscar email, nombre o asunto…': 'Search email, name or subject…',
    'Aún no hay hilos. Cuando el Emailbot reciba un email, aparecerá aquí.':
      'No threads yet. When the Emailbot receives an email, it will appear here.',
    'Ningún hilo coincide con el filtro.': 'No thread matches the filter.',
    'Activo': 'Active',
    'Derivado': 'Handed off',
    'Cerrado': 'Closed',
    'ahora': 'now',

    // ─── Thread detail panel ───
    'Asunto:': 'Subject:',
    'Inicio:': 'Started:',
    'Email:': 'Email:',
    'Estado:': 'Status:',
    'Reabrir': 'Reopen',
    'Derivar a mí': 'Hand off to me',
    'Cerrar hilo': 'Close thread',
    'Conversación': 'Conversation',
    'Cargando…': 'Loading…',
    'Sin mensajes en este hilo todavía.': 'No messages in this thread yet.',
    'Cliente': 'Client',
    'Bot · escalado': 'Bot · escalated',
    'Bot': 'Bot',
    'Motivo:': 'Reason:',
    '(sin contenido)': '(no content)',
    'Error al actualizar': 'Error updating',

    // ─── Errors + actions (shared) ───
    'Error al guardar modelo': 'Error saving model',
    'Error al guardar': 'Error saving',
    'Cancelar': 'Cancel',

    // ─── Test suite · launcher (client) ───
    'Sin perfiles de cliente todavía': 'No client profiles yet',
    'Te sembramos 16 perfiles default (6 happy path, 4 con objeción, 4 casos límite, 2 de seguridad) para que empieces a probar tu bot. Después podrás editarlos o añadir los tuyos.':
      'We\'ll seed 16 default profiles (6 happy path, 4 with objections, 4 edge cases, 2 security) so you can start testing your bot. You can then edit them or add your own.',
    'Sembrar 16 perfiles default': 'Seed 16 default profiles',
    'Error al sembrar perfiles': 'Error seeding profiles',
    'Error al lanzar test': 'Error launching test',
    'Tu biblioteca está vacía': 'Your library is empty',
    'El bot responderá demasiado genérico (sin precio, sin política, sin garantías) y la mayoría de los tests fallarán. Añade al menos 4-5 entradas en la':
      'The bot will answer too generically (no price, no policy, no guarantees) and most tests will fail. Add at least 4-5 entries to the',
    'antes de lanzar el test.': 'before launching the test.',
    'Perfiles activos': 'Active profiles',
    'Entradas biblioteca': 'Library entries',
    'Modelo del bot': 'Bot model',
    'Coste estimado': 'Estimated cost',
    'Ver / editar perfiles': 'View / edit profiles',
    'Procesando': 'Processing',
    'conversaciones...': 'conversations...',
    'Lanzar test': 'Launch test',
    'conv.': 'conv.',
    'Tarda ~1-2 minutos. Te redirigimos al detalle cuando termine.':
      'Takes ~1-2 minutes. We\'ll redirect you to the details when it finishes.',
    'Confirma el lanzamiento': 'Confirm the launch',
    'Vas a lanzar un test con': 'You are about to launch a test with',
    'conversaciones': 'conversations',
    'contra tu bot': 'against your bot',
    'Duración:': 'Duration:',
    '~1-2 minutos': '~1-2 minutes',
    'Coste estimado:': 'Estimated cost:',
    '(se carga a tu cuenta como uso de IA)': '(charged to your account as AI usage)',
    'No afecta a la cuota mensual de respuestas reales del bot':
      'Does not affect the monthly quota of real bot replies',
    'Verás transcript completo + scoring de cada conversación':
      'You\'ll see the full transcript + scoring of each conversation',
    'Para bajar el coste, cambia a un modelo más barato en':
      'To lower the cost, switch to a cheaper model in',
    'configuración del bot': 'bot configuration',
    'antes de lanzar (Haiku/GPT-4o mini/Gemini Flash bajan el coste 10x).':
      'before launching (Haiku/GPT-4o mini/Gemini Flash cut the cost 10x).',
    'Sí, lanzar y cargar coste': 'Yes, launch and charge cost',

    // ─── Test suite · conversation card ───
    'esperado:': 'expected:',
    'real:': 'actual:',
    'error': 'error',
    'turnos': 'turns',
    'Error en la conversación:': 'Error in the conversation:',
    'Análisis del evaluador': 'Evaluator analysis',
    'Bugs detectados': 'Bugs detected',
    'Transcript': 'Transcript',
    'mensajes': 'messages',
    'Cliente simulado': 'Simulated client',
    'Sistema': 'System',
    'Tokens:': 'Tokens:',
    'Coste:': 'Cost:',
    // Outcome labels (test suite)
    'Cierre con seña': 'Closed with deposit',
    'Escala a humano': 'Escalate to human',
    'Lista de espera': 'Waiting list',
    'Sin compra': 'No purchase',
    'Bloqueado': 'Blocked',

    // ─── Test suite · main page ───
    'Necesitas un criadero registrado.': 'You need a registered kennel.',
    'Bate 16 perfiles ficticios contra tu bot y obtén scoring + bugs detectados. Llegará para todos cuando tengamos sistema de cuotas y pago por uso.':
      'Run 16 fictional profiles against your bot and get scoring + detected bugs. Coming to everyone once we have a quota system and pay-per-use.',
    '← Volver al Emailbot': '← Back to Emailbot',
    'Suite de tests': 'Test suite',
    'Probar el bot con': 'Test the bot with',
    'perfiles ficticios': 'fictional profiles',
    'Lanza una batería de conversaciones simuladas con perfiles de cliente diversos (familias, criadores, abogados, intentos de fraude). Un evaluador puntúa cada hilo y detecta bugs como alucinaciones, descuentos no autorizados o filtraciones de datos.':
      'Launch a battery of simulated conversations with diverse client profiles (families, breeders, lawyers, fraud attempts). An evaluator scores each thread and detects bugs like hallucinations, unauthorized discounts or data leaks.',
    'Herramienta potente con coste real': 'Powerful tool with real cost',
    'Cada test lanza ~': 'Each test launches ~',
    'conversaciones contra IAs reales (modelo del bot + simulador del cliente + evaluador). El gasto se carga a tu cuenta de Genealogic y aparece en':
      'conversations against real AIs (bot model + client simulator + evaluator). The cost is charged to your Genealogic account and shows up at',
    'como uso de IA fuera de la cuota de respuestas del bot.':
      'as AI usage outside the bot reply quota.',
    'Coste estimado por test completo:': 'Estimated cost per full test:',
    'con tu modelo actual (': 'with your current model (',
    '). Cambia a un modelo más barato en': '). Switch to a cheaper model in',
    'la configuración del bot': 'the bot configuration',
    'si quieres bajar el coste.': 'if you want to lower the cost.',
    'Historial de tests': 'Test history',
    'Aún no has lanzado ningún test. Pulsa el botón de arriba para empezar.':
      'You haven\'t launched any test yet. Press the button above to start.',
    'Fecha': 'Date',
    'Estado': 'Status',
    'Conv.': 'Conv.',
    'Pass rate': 'Pass rate',
    'Duración': 'Duration',
    'Coste': 'Cost',
    'Modelo': 'Model',
    'Ver': 'View',
    'Ejecutando': 'Running',
    'Completado': 'Completed',
    'Falló': 'Failed',

    // ─── Test suite · profiles page ───
    'Volver al test suite': 'Back to test suite',
    'Perfiles': 'Profiles',
    'Cada perfil define una persona + objetivo + mensaje inicial + outcome esperado. El runner ejecuta una conversación por perfil activo cuando lanzas un test.':
      'Each profile defines a persona + goal + opening message + expected outcome. The runner runs one conversation per active profile when you launch a test.',
    'Sin perfiles todavía': 'No profiles yet',
    'Te sembramos 16 perfiles default (6 happy path, 4 con objeción, 4 casos límite, 2 de seguridad). Cubren la mayoría de los casos reales.':
      'We\'ll seed 16 default profiles (6 happy path, 4 with objections, 4 edge cases, 2 security). They cover most real cases.',
    'Persona ·': 'Persona ·',
    'Objetivo ·': 'Goal ·',
    // Category labels (test suite profiles)
    'Compra esperada (happy path)': 'Expected purchase (happy path)',
    'Objeciones / dudas': 'Objections / questions',
    'Casos límite': 'Edge cases',
    'Seguridad / fraude': 'Security / fraud',

    // ─── Test suite · run detail page ───
    'Volver al historial': 'Back to history',
    'Test run': 'Test run',
    'Ejecutando…': 'Running…',
    'Test falló': 'Test failed',
    'pass rate': 'pass rate',
    'El run sigue ejecutando. Las conversaciones aparecen abajo a medida que terminan. Esta página se refresca sola cada 5 segundos.':
      'The run is still executing. Conversations appear below as they finish. This page refreshes itself every 5 seconds.',
    'Notas del run': 'Run notes',
    'Conversaciones': 'Conversations',
    'Pasaron': 'Passed',
    'Fallaron': 'Failed',
    'Coste total': 'Total cost',
    'Esperando primera conversación…': 'Waiting for the first conversation…',
    'Sin conversaciones': 'No conversations',

    // ─── Layout gate (ComingSoon) ───
    'Asistente IA que responde por email a consultas de cachorros usando la biblioteca de tu criadero. Disponible próximamente para todos.':
      'AI assistant that answers puppy inquiries by email using your kennel\'s library. Coming soon for everyone.',
    '← Volver al dashboard': '← Back to dashboard',
  },
}
