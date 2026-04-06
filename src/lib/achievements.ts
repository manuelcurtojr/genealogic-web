export interface Achievement {
  key: string
  title: string
  label: string
  icon: string       // Lucide icon name
  color: string      // hex
  desc: string       // unlock condition description
  unlocked: boolean
}

export const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlocked'>[] = [
  { key: 'primer_paso',     title: 'Primer Paso',      label: 'Inicio',       icon: 'PawPrint',        color: '#10B981', desc: 'Registra tu primer perro.' },
  { key: 'manada',          title: 'Manada',            label: 'Manada',       icon: 'Dog',             color: '#3B82F6', desc: 'Ten 5 o mas perros registrados.' },
  { key: 'alfa',            title: 'Alfa',              label: 'Alfa',         icon: 'Crown',           color: '#F59E0B', desc: 'Ten 20 o mas perros registrados.' },
  { key: 'rey_de_reyes',    title: 'Rey de Reyes',     label: 'Rey',          icon: 'Castle',          color: '#EF4444', desc: 'Ten 50 o mas perros registrados.' },
  { key: 'criador',         title: 'Criador',           label: 'Criador',      icon: 'Home',            color: '#8B5CF6', desc: 'Crea un criadero.' },
  { key: 'linaje',          title: 'Linaje',            label: 'Linaje',       icon: 'GitBranch',       color: '#06B6D4', desc: 'Registra un perro con padre y madre asignados.' },
  { key: 'arbol_completo',  title: 'Arbol Completo',   label: 'Arbol',        icon: 'TreePine',        color: '#059669', desc: 'Ten un perro con 3 generaciones completas de pedigree.' },
  { key: 'primera_camada',  title: 'Primera Camada',   label: 'Camada',       icon: 'Baby',            color: '#EC4899', desc: 'Registra tu primera camada.' },
  { key: 'veterano',        title: 'Veterano',          label: 'Veterano',     icon: 'Medal',           color: '#CD7F32', desc: 'Lleva mas de 1 ano como miembro.' },
  { key: 'leyenda',         title: 'Leyenda',           label: 'Leyenda',      icon: 'Star',            color: '#FFD700', desc: 'Lleva mas de 3 anos como miembro.' },
  { key: 'fotogenico',      title: 'Fotogenico',        label: 'Fotos',        icon: 'Camera',          color: '#14B8A6', desc: 'Sube fotos a 10 o mas perros.' },
  { key: 'explorador',      title: 'Explorador',        label: 'Explorador',   icon: 'Compass',         color: '#6366F1', desc: 'Anade perros de 3 o mas razas diferentes.' },
  { key: 'popular',         title: 'Popular',            label: 'Popular',      icon: 'Flame',           color: '#F97316', desc: 'Recibe 100 o mas visitas en tus perros.' },
  { key: 'estrella',        title: 'Estrella',           label: 'Estrella',     icon: 'Zap',             color: '#FBBF24', desc: 'Recibe 1000 o mas visitas en tus perros.' },
  { key: 'salud_primero',   title: 'Salud Primero',    label: 'Salud',        icon: 'HeartPulse',      color: '#EF4444', desc: 'Anade el primer registro veterinario.' },
  { key: 'campeon',         title: 'Campeon',            label: 'Campeon',      icon: 'Trophy',          color: '#D97706', desc: 'Registra el primer premio o titulo.' },
  { key: 'coleccionista',   title: 'Coleccionista',     label: 'Coleccion',    icon: 'Gem',             color: '#A855F7', desc: 'Desbloquea 10 o mas logros.' },
  { key: 'perfil_completo', title: 'Perfil Completo',  label: 'Perfil',       icon: 'UserCheck',       color: '#2563EB', desc: 'Completa todos los campos de tu perfil.' },
  { key: 'negociante',      title: 'Negociante',        label: 'Negocio',      icon: 'Handshake',       color: '#0EA5E9', desc: 'Crea tu primer negocio en el CRM.' },
  { key: 'benefactor',      title: 'Benefactor',        label: 'Benefactor',   icon: 'HeartHandshake',  color: '#E11D48', desc: 'Realiza tu primera compra de genes.' },
]

export interface EvalData {
  dogCount: number
  dogWithParentsCount: number
  dogWith3GenCount: number
  litterCount: number
  kennelCount: number
  dogsWithPhotosCount: number
  distinctBreedsCount: number
  totalVisits: number
  vetRecordsCount: number
  awardsCount: number
  dealsCount: number
  accountAgeYears: number
  profileComplete: boolean
  genesPurchased: boolean
}

export function evaluateAchievements(data: EvalData): Achievement[] {
  const results: Achievement[] = []

  for (const def of ACHIEVEMENT_DEFS) {
    let unlocked = false
    switch (def.key) {
      case 'primer_paso':     unlocked = data.dogCount >= 1; break
      case 'manada':          unlocked = data.dogCount >= 5; break
      case 'alfa':            unlocked = data.dogCount >= 20; break
      case 'rey_de_reyes':    unlocked = data.dogCount >= 50; break
      case 'criador':         unlocked = data.kennelCount >= 1; break
      case 'linaje':          unlocked = data.dogWithParentsCount >= 1; break
      case 'arbol_completo':  unlocked = data.dogWith3GenCount >= 1; break
      case 'primera_camada':  unlocked = data.litterCount >= 1; break
      case 'veterano':        unlocked = data.accountAgeYears >= 1; break
      case 'leyenda':         unlocked = data.accountAgeYears >= 3; break
      case 'fotogenico':      unlocked = data.dogsWithPhotosCount >= 10; break
      case 'explorador':      unlocked = data.distinctBreedsCount >= 3; break
      case 'popular':         unlocked = data.totalVisits >= 100; break
      case 'estrella':        unlocked = data.totalVisits >= 1000; break
      case 'salud_primero':   unlocked = data.vetRecordsCount >= 1; break
      case 'campeon':         unlocked = data.awardsCount >= 1; break
      case 'perfil_completo': unlocked = data.profileComplete; break
      case 'negociante':      unlocked = data.dealsCount >= 1; break
      case 'benefactor':      unlocked = data.genesPurchased; break
      // coleccionista evaluated after all others
    }
    results.push({ ...def, unlocked })
  }

  // Coleccionista: 10+ unlocked (excluding itself)
  const unlockedCount = results.filter(a => a.unlocked && a.key !== 'coleccionista').length
  const cIdx = results.findIndex(a => a.key === 'coleccionista')
  if (cIdx >= 0) results[cIdx].unlocked = unlockedCount >= 10

  return results
}
