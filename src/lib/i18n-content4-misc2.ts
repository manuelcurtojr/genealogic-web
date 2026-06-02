// i18n — Fase 4 Wave 5 (cierre) · últimos componentes customer-facing sueltos.
// Cubre: components/breeds (directorio público de razas: breeds-directory +
//        breed-standard-sidebar, incl. labels de las 14 secciones del estándar),
//        components/early-access (coming-soon: pantalla "próximamente" + chip),
//        components/auth (auth-shell, live-stats-line — chrome del login/register).
//
// Clave = español EXACTO tal como aparece en el código (incl. puntuación, "…").
// 'es' es la clave base y no necesita diccionario.
//
// Glosario aplicado: breed/breeds (raza/razas), specimen (ejemplar), origin (origen),
// standard (estándar), sources (fuentes), search (buscar), clear (limpiar),
// no results (sin resultados), coming soon (próximamente). genealogy NUNCA pedigree.
// Marca "Genealogic", datos de BD (nombre de raza, origen, fci_number), "FCI"/"AKC",
// enum keys, slugs/URLs y className NO se traducen.
//
// NOTA: este archivo debe importarse y mezclarse en getTranslator() de i18n.ts
// (igual que los demás content4-*) para que las claves nuevas surtan efecto.

export const content4Misc2: Record<string, Record<string, string>> = {
  en: {
    // ─── breeds — directorio público (breeds-directory) ───
    'Buscar raza, origen, nº FCI…': 'Search breed, origin, FCI no.…',
    'Limpiar búsqueda': 'Clear search',
    'Todas': 'All',
    'Con estándar Genealogic': 'With Genealogic standard',
    'Con estándar': 'With standard',
    'Con ejemplares': 'With specimens',
    'Mostrando las': 'Showing all',
    'razas': 'breeds',
    'No hay razas que coincidan con tu búsqueda.': 'No breeds match your search.',
    'Limpiar filtros': 'Clear filters',
    'Sin imagen': 'No image',
    'Estándar Genealogic completo: estructura de 12 secciones reinterpretada': 'Complete Genealogic standard: reinterpreted 12-section structure',
    'Tiene enlaces a estándares oficiales (FCI, AKC…)': 'Has links to official standards (FCI, AKC…)',
    'Fuentes': 'Sources',
    'ejemplar': 'specimen',
    'ejemplares': 'specimens',

    // ─── breeds — sidebar del estándar (breed-standard-sidebar) ───
    'Secciones del estándar de raza': 'Breed standard sections',
    'Estándar Genealogic': 'Genealogic standard',
    '¿Estándar oficial?': 'Official standard?',
    'Este texto es una reinterpretación de las fuentes oficiales. Para uso oficial (jueces, expositores) consulta el PDF de la FCI o tu club nacional.':
      'This text is a reinterpretation of the official sources. For official use (judges, exhibitors) refer to the FCI PDF or your national club.',
    // labels de las secciones (de components/breeds/sections.ts, renderizados por el sidebar)
    'Información general': 'General information',
    'Apariencia general': 'General appearance',
    'Proporciones': 'Proportions',
    'Temperamento': 'Temperament',
    'Cabeza': 'Head',
    'Cuello y cuerpo': 'Neck and body',
    'Cola': 'Tail',
    'Extremidades': 'Limbs',
    'Movimiento': 'Movement',
    'Manto y color': 'Coat and colour',
    'Tamaño y peso': 'Size and weight',
    'Faltas': 'Faults',
    'Sobre este estándar': 'About this standard',
    'Diferencias entre clubes': 'Differences between clubs',

    // ─── early-access — coming-soon ───
    'Próximamente': 'Coming soon',
    'Esta función estará disponible para todos los criaderos en las':
      'This feature will be available to all kennels in the',
    'ETA:': 'ETA:',
    '← Volver al escritorio': '← Back to dashboard',
    '¿Quieres ser cobaya y probarlo antes? Escríbenos a':
      'Want to be a guinea pig and try it early? Write to us at',
    'disponible para todos en': 'available to everyone in',

    // ─── auth — auth-shell ───
    'Volver': 'Back',
    // tagline del copyright (el "© {año} Genealogic · " queda fuera de t(): año dinámico + marca)
    'El registro público mundial de perros con genealogía':
      'The worldwide public registry of dogs with genealogy',
    'Founder pricing · plazas limitadas': 'Founder pricing · limited spots',
    'La genealogía de tu perro, donde tiene que estar.': 'Your dog\'s genealogy, right where it belongs.',
    'El registro público de genealogías caninas. Para criadores que documentan su trabajo y propietarios que quieren tenerlo todo a mano.':
      'The public registry of canine genealogies. For breeders who document their work and owners who want everything in one place.',
    'Árbol genealógico verificable': 'Verifiable genealogy tree',
    'Genealogía completa sin límite de generaciones, COI automático.':
      'Complete genealogy with no generation limit, automatic COI.',
    'Importa genealogías con IA': 'Import genealogies with AI',
    'De una foto al árbol completo en 12 segundos.': 'From a photo to the full tree in 12 seconds.',
    'Indexable y trazable': 'Indexable and traceable',
    'Cada perro, perfil público y permanente en Google.': 'Every dog, a public and permanent profile on Google.',
    'Genealogía verificable. Para siempre.': 'Verifiable genealogy. Forever.',
    'Continuar con Google': 'Continue with Google',
    'Conectando…': 'Connecting…',
    'Cargando…': 'Loading…',
    'o continúa con email': 'or continue with email',

    // ─── auth — live-stats-line ───
    'perros': 'dogs',
    'criaderos': 'kennels',
  },
}
