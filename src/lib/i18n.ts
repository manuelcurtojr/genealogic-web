// Simple i18n system — keys are Spanish (default), translations map to other languages
// Usage: t('Mis Perros') → 'My Dogs' (if language is 'en')

const translations: Record<string, Record<string, string>> = {
  en: {
    // Nav
    'Escritorio': 'Dashboard', 'Mis Perros': 'My Dogs', 'Camadas': 'Litters',
    'Calendario': 'Calendar', 'Planificador': 'Planner', 'Veterinario': 'Veterinary',
    'Buscar': 'Search', 'Favoritos': 'Favorites',
    'Mi Criadero': 'My Kennel', 'Analíticas': 'Analytics', 'Contactos': 'Contacts',
    'Negocios': 'Deals', 'Ajustes': 'Settings', 'Cerrar sesión': 'Log out',
    // Common
    'Guardar': 'Save', 'Cancelar': 'Cancel', 'Editar': 'Edit',
    'Eliminar': 'Delete', 'Crear': 'Create', 'Ver': 'View', 'Añadir': 'Add',
    'Nuevo': 'New', 'Todos': 'All', 'Ninguno': 'None',
    // Dog
    'Macho': 'Male', 'Hembra': 'Female', 'Nombre': 'Name', 'Raza': 'Breed',
    'Color': 'Color', 'Nacimiento': 'Birth', 'Peso': 'Weight', 'Altura': 'Height',
    'Padre': 'Sire', 'Madre': 'Dam', 'Criadero': 'Kennel', 'Pedigree': 'Pedigree',
    'Salud': 'Health', 'Palmarés': 'Awards', 'Hermanos': 'Siblings', 'Descendientes': 'Offspring',
    // Litters
    'Planificada': 'Planned', 'Cubrición': 'Mated', 'Nacida': 'Born',
    'Cachorros': 'Puppies',
    // CRM
    'Pipeline': 'Pipeline', 'Etapa': 'Stage', 'Valor': 'Value', 'Contacto': 'Contact',
    // Settings
    'Perfil': 'Profile', 'Seguridad': 'Security', 'Plan': 'Plan',
    'Idioma y región': 'Language & Region', 'Notificaciones': 'Notifications',
    'Privacidad': 'Privacy', 'Datos': 'Data',
    // Auth
    'Iniciar sesión': 'Log in', 'Registrarse': 'Sign up',
    // Actions
    'Transferir': 'Transfer', 'Vender': 'Sell', 'Visible': 'Visible',
    'Reproductor': 'Breeding', 'En venta': 'For sale',
    'Pedir información': 'Request info',
    // Dashboard
    'Perros': 'Dogs', 'Revenue': 'Revenue', 'Solicitudes': 'Inquiries',
  },
  fr: {
    'Escritorio': 'Tableau de bord', 'Mis Perros': 'Mes Chiens', 'Camadas': 'Portées',
    'Calendario': 'Calendrier', 'Veterinario': 'Vétérinaire', 'Buscar': 'Rechercher',
    'Favoritos': 'Favoris', 'Mi Criadero': 'Mon Élevage',
    'Analíticas': 'Analytiques', 'Contactos': 'Contacts', 'Negocios': 'Affaires',
    'Ajustes': 'Paramètres', 'Cerrar sesión': 'Déconnexion',
    'Macho': 'Mâle', 'Hembra': 'Femelle', 'Nombre': 'Nom', 'Raza': 'Race',
    'Padre': 'Père', 'Madre': 'Mère', 'Criadero': 'Élevage',
    'Iniciar sesión': 'Se connecter', 'Registrarse': "S'inscrire",
    'Perros': 'Chiens', 'Cachorros': 'Chiots',
  },
  de: {
    'Escritorio': 'Dashboard', 'Mis Perros': 'Meine Hunde', 'Camadas': 'Würfe',
    'Calendario': 'Kalender', 'Veterinario': 'Tierarzt', 'Buscar': 'Suchen',
    'Favoritos': 'Favoriten', 'Mi Criadero': 'Meine Zucht',
    'Analíticas': 'Analytik', 'Contactos': 'Kontakte', 'Negocios': 'Geschäfte',
    'Ajustes': 'Einstellungen', 'Cerrar sesión': 'Abmelden',
    'Macho': 'Rüde', 'Hembra': 'Hündin', 'Nombre': 'Name', 'Raza': 'Rasse',
    'Padre': 'Vater', 'Madre': 'Mutter', 'Criadero': 'Zucht',
    'Iniciar sesión': 'Anmelden', 'Registrarse': 'Registrieren',
    'Perros': 'Hunde', 'Cachorros': 'Welpen',
  },
  pt: {
    'Escritorio': 'Painel', 'Mis Perros': 'Meus Cães', 'Camadas': 'Ninhadas',
    'Calendario': 'Calendário', 'Veterinario': 'Veterinário', 'Buscar': 'Pesquisar',
    'Favoritos': 'Favoritos', 'Mi Criadero': 'Meu Canil',
    'Analíticas': 'Análises', 'Contactos': 'Contactos', 'Negocios': 'Negócios',
    'Ajustes': 'Configurações', 'Cerrar sesión': 'Sair',
    'Macho': 'Macho', 'Hembra': 'Fêmea', 'Nombre': 'Nome', 'Raza': 'Raça',
    'Padre': 'Pai', 'Madre': 'Mãe', 'Criadero': 'Canil',
    'Iniciar sesión': 'Entrar', 'Registrarse': 'Registar',
    'Perros': 'Cães', 'Cachorros': 'Filhotes',
  },
  it: {
    'Escritorio': 'Pannello', 'Mis Perros': 'I miei cani', 'Camadas': 'Cucciolate',
    'Calendario': 'Calendario', 'Veterinario': 'Veterinario', 'Buscar': 'Cerca',
    'Favoritos': 'Preferiti', 'Mi Criadero': 'Il mio allevamento',
    'Analíticas': 'Analisi', 'Contactos': 'Contatti', 'Negocios': 'Affari',
    'Ajustes': 'Impostazioni', 'Cerrar sesión': 'Esci',
    'Macho': 'Maschio', 'Hembra': 'Femmina', 'Nombre': 'Nome', 'Raza': 'Razza',
    'Padre': 'Padre', 'Madre': 'Madre', 'Criadero': 'Allevamento',
    'Iniciar sesión': 'Accedi', 'Registrarse': 'Registrati',
    'Perros': 'Cani', 'Cachorros': 'Cuccioli',
  },
}

export function getTranslator(lang: string) {
  const dict = translations[lang] || {}
  return function t(key: string): string {
    if (lang === 'es') return key // Spanish is default
    return dict[key] || key // Fallback to Spanish key
  }
}

export function getAvailableLanguages() {
  return ['es', ...Object.keys(translations)]
}
