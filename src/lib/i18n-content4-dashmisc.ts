// Fase 4 · Wave 4 — Diccionario ES→EN de tres carpetas de dashboard que se
// saltaron olas previas:
//   · components/pedigree/**      (ÁRBOL GENEALÓGICO — en UI: "genealogy",
//                                  NUNCA "pedigree": pedigree-tree · pedigree-editor
//                                  + textos de coi-calculator traducidos en el call-site)
//   · components/analytics/**     (analytics-dashboard · analytics-subnav · range-chips)
//   · components/conocimiento/**  (knowledge-page-client · knowledge-form-panel ·
//                                  knowledge-importer — la "Biblioteca"/knowledge base)
//
// Las claves son el español EXACTO pasado a t(). Duplicados con otros content
// dicts (i18n.ts base, content/2/3, otros content4) son inofensivos: getTranslator
// cascadea y devuelve el primer match. 'es' no necesita entradas (es la clave base).
//
// OJO con los caracteres especiales: '…' es el carácter elipsis (U+2026), distinto
// de '...' (tres puntos ASCII). '—' es em dash (U+2014). '¿' '·' se conservan byte a
// byte para que la clave haga match. Algunas frases de COI vienen SIN tildes en el
// origen ("genetica", "precaucion", "geneticos") — se copian tal cual.
//
// Glosario aplicado: genealogy / genealogy tree (jamás "pedigree" en UI), sire (padre),
// dam (madre), generations, ancestors, analytics, knowledge base, dog, kennel, breed.

export const content4DashMisc: Record<string, Record<string, string>> = {
  en: {
    // ─── ÁRBOL GENEALÓGICO · editor (pedigree-editor) ───
    'Genealogía de': 'Genealogy of',
    'Guardado': 'Saved',
    'Listo': 'Done',
    'Sin datos de genealogía': 'No genealogy data',
    'Añadir': 'Add',
    'a': 'to',
    'Se buscará/creará como macho': 'Will be searched/created as male',
    'Se buscará/creará como hembra': 'Will be searched/created as female',
    'Sin resultados': 'No results',
    'Crear nuevo': 'Create new',
    'Macho': 'Male',
    'Hembra': 'Female',
    'Vinculado como': 'Linked as',
    'de': 'of',
    'Ver perfil completo': 'View full profile',
    'Desconectando...': 'Disconnecting...',
    'Desconectar de este nodo': 'Disconnect from this node',
    'Ancestros faltantes:': 'Missing ancestors:',
    'Añadir padre': 'Add sire',
    'Añadir madre': 'Add dam',
    'Buscar macho existente...': 'Search existing male...',
    'Buscar hembra existente...': 'Search existing female...',
    // role words (genealogy editor) — sire/dam per glossary
    'padre': 'sire',
    'madre': 'dam',
    'perro': 'dog',
    'perra': 'dog',

    // ─── ÁRBOL GENEALÓGICO · árbol + panel COI (pedigree-tree) ───
    'Salud genética': 'Genetic health',
    'Coeficiente de consanguinidad': 'Inbreeding coefficient',
    'Comparativa con la raza': 'Comparison with the breed',
    'Calculando media de la raza…': 'Calculating breed average…',
    'Este perro': 'This dog',
    'Media de la raza': 'Breed average',
    'Por debajo de la media de la raza (más diversidad genética que el promedio).':
      'Below the breed average (more genetic diversity than the average).',
    'Por encima de la media de la raza. Considera abrir la línea en futuros cruces.':
      'Above the breed average. Consider outcrossing the line in future matings.',
    'En la media de la raza.': 'In line with the breed average.',
    'Muestra de': 'Sample of',
    'perros.': 'dogs.',
    'Aún no hay datos suficientes de la raza para comparar.':
      'Not enough breed data yet to compare.',
    'Calculado con 10 generaciones.': 'Calculated with 10 generations.',
    'Generaciones': 'Generations',
    'Perro oculto a petición del titular o por moderación':
      'Dog hidden at the owner\'s request or by moderation',
    'Perro oculto': 'Hidden dog',
    'Retirado a petición': 'Removed on request',
    'desconocido': 'unknown',
    // COI interpretation (coi-calculator.ts, traducido en el call-site con t()).
    // El origen viene sin tildes: "genetica" / "precaucion" / "geneticos".
    'Nivel de consanguinidad bajo. La diversidad genetica es adecuada.':
      'Low inbreeding level. Genetic diversity is adequate.',
    'Nivel de consanguinidad moderado. Se recomienda precaucion en futuros cruces.':
      'Moderate inbreeding level. Caution is recommended in future matings.',
    'Nivel de consanguinidad alto. Riesgo elevado de problemas geneticos hereditarios.':
      'High inbreeding level. Elevated risk of hereditary genetic problems.',

    // ─── ANALÍTICAS · dashboard (analytics-dashboard) ───
    'Sin raza': 'No breed',
    'Resumen': 'Summary',
    'Reproducción': 'Reproduction',
    'Criadero': 'Kennel',
    'Métricas': 'Metrics',
    'Analíticas': 'Analytics',
    'Perros': 'Dogs',
    'Camadas': 'Litters',
    'En venta': 'For sale',
    'Registros vet.': 'Vet records',
    'Logros': 'Awards',
    'Distribución por raza': 'Distribution by breed',
    'Camadas totales': 'Total litters',
    'Cachorros': 'Puppies',
    'Promedio cachorros': 'Average puppies',
    'Reproductores': 'Breeding dogs',
    'Camadas por año': 'Litters per year',
    'Top reproductores': 'Top breeding dogs',
    'camadas': 'litters',
    'Total perros': 'Total dogs',
    'Retenidos': 'Retained',
    'Transferidos': 'Transferred',
    'Con genealogía': 'With genealogy',
    'Machos': 'Males',
    'Hembras': 'Females',
    'Edad promedio': 'Average age',
    'años': 'years',

    // ─── ANALÍTICAS · subnav (analytics-subnav) ───
    'Negocio': 'Business',
    'Perros, camadas, palmarés, salud — analítica del criadero':
      'Dogs, litters, awards, health — kennel analytics',
    'Operativa': 'Operations',
    'Reservas, clientes, biblioteca, newsletter — resumen ejecutivo':
      'Reservations, clients, knowledge base, newsletter — executive summary',
    'Estadísticas web': 'Web stats',
    'Tráfico de tu web pública — visitantes, fuentes, países, dispositivos':
      'Your public website traffic — visitors, sources, countries, devices',

    // ─── ANALÍTICAS · chips de rango (range-chips) ───
    'Hoy': 'Today',
    'Semana': 'Week',
    'Mes': 'Month',
    'Año': 'Year',

    // ─── CONOCIMIENTO · listado (knowledge-page-client) ───
    'Biblioteca': 'Library',
    'Importar con IA': 'Import with AI',
    'Nueva entrada': 'New entry',
    'Las entradas de la Biblioteca son lo que el':
      'The Library entries are what the',
    'usa como contexto para responder. Estructura tu información como entradas independientes (precio del cachorro, política de reserva, qué incluye la entrega…) — el bot elegirá las más relevantes para cada consulta.':
      'uses as context to reply. Structure your information as independent entries (puppy price, deposit policy, what delivery includes…) — the bot will pick the most relevant ones for each query.',
    'Todas': 'All',
    'Buscar en título o contenido…': 'Search in title or content…',
    'Aún no tienes entradas. Empieza añadiendo precio, política de reserva y filosofía.':
      'You don\'t have any entries yet. Start by adding price, deposit policy and philosophy.',
    'Ninguna entrada coincide con el filtro.': 'No entry matches the filter.',
    'Crear primera entrada': 'Create first entry',
    'Inactiva': 'Inactive',
    // plurales de entrada/activa (knowledge-page-client)
    'entrada': 'entry',
    'entradas': 'entries',
    'activa': 'active',
    'activas': 'active',
    // categorías (CATEGORIES — traducidas en el call-site con t(c.label))
    'General': 'General',
    'Precio': 'Price',
    'Salud': 'Health',
    'Reserva': 'Reservation',
    'Entrega': 'Delivery',
    'Filosofía de cría': 'Breeding philosophy',
    'FAQ': 'FAQ',
    'Condiciones': 'Terms',

    // ─── CONOCIMIENTO · formulario (knowledge-form-panel) ───
    'Título y contenido son obligatorios': 'Title and content are required',
    'Error al guardar': 'Error saving',
    '¿Eliminar esta entrada? El Emailbot dejará de usarla como contexto.':
      'Delete this entry? The Emailbot will stop using it as context.',
    'Error al eliminar': 'Error deleting',
    'Editar entrada': 'Edit entry',
    'Categoría': 'Category',
    'Título *': 'Title *',
    'Precio del cachorro · Política de reserva · ¿Qué incluye la entrega?':
      'Puppy price · Deposit policy · What does delivery include?',
    'Contenido *': 'Content *',
    'Cuenta aquí todo lo que el Emailbot necesita saber sobre este tema. Sé natural, en tu tono. Puedes usar varias líneas.':
      'Tell here everything the Emailbot needs to know about this topic. Be natural, in your tone. You can use several lines.',
    'caracteres': 'characters',
    'Activa — el Emailbot la usa como contexto':
      'Active — the Emailbot uses it as context',
    'Eliminando…': 'Deleting…',
    'Eliminar': 'Delete',
    'Cancelar': 'Cancel',
    'Guardando…': 'Saving…',
    'Guardar': 'Save',
    'Crear': 'Create',

    // ─── CONOCIMIENTO · importador IA (knowledge-importer) ───
    'Error de red': 'Network error',
    'Desde URL': 'From URL',
    'Desde archivo': 'From file',
    'Pega la URL de tu web (página de inicio, condiciones, FAQ…). La IA extraerá la información relevante y la añadirá a la biblioteca como entradas categorizadas.':
      'Paste your website URL (home page, terms, FAQ…). The AI will extract the relevant information and add it to the library as categorized entries.',
    'URL': 'URL',
    'Coste estimado: ~0,01-0,05 USD por página. Se carga a tu cuenta de Genealogic (no necesitas tu propia API de IA).':
      'Estimated cost: ~0.01-0.05 USD per page. It is charged to your Genealogic account (you don\'t need your own AI API).',
    'Importar página': 'Import page',
    'Sube un PDF, Word (.docx) o texto plano (.txt/.md) con información del criadero (condiciones, contrato, FAQ, manual de bienvenida…).':
      'Upload a PDF, Word (.docx) or plain text (.txt/.md) with kennel information (terms, contract, FAQ, welcome manual…).',
    'Archivo (max 20 MB)': 'File (max 20 MB)',
    'PDFs escaneados sin OCR no funcionan (la IA necesita el texto). Coste estimado: ~0,01-0,10 USD según número de páginas.':
      'Scanned PDFs without OCR won\'t work (the AI needs the text). Estimated cost: ~0.01-0.10 USD depending on the number of pages.',
    'Importar archivo': 'Import file',
    'Procesando con IA...': 'Processing with AI...',
    'Error al importar': 'Error importing',
    'Error desconocido': 'Unknown error',
    'Cerrar': 'Close',
    'Sin información útil': 'No useful information',
    'La IA no encontró nada estructurado para añadir.':
      'The AI didn\'t find anything structured to add.',
    'Coste de la consulta:': 'Query cost:',
    'págs': 'pgs',
    'Vista previa (primeras 3)': 'Preview (first 3)',
    'Ver biblioteca actualizada': 'View updated library',
    // plurales de entrada/añadida (knowledge-importer success view)
    'añadida': 'added',
    'añadidas': 'added',
  },
}
