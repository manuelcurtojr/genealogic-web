// Simple i18n system — keys are Spanish (default), translations map to other languages
// Usage: t('Mis Perros') → 'My Dogs' (if language is 'en')

const translations: Record<string, Record<string, string>> = {
  en: {
    // ─── Nav ───
    'Escritorio': 'Dashboard', 'Mis Perros': 'My Dogs', 'Contribuciones': 'Contributions', 'Camadas': 'Litters',
    'Calendario': 'Calendar', 'Planificador': 'Planner', 'Veterinario': 'Veterinary',
    'Buscar': 'Search', 'Favoritos': 'Favorites',
    'Mi Criadero': 'My Kennel', 'Analíticas': 'Analytics', 'Contactos': 'Contacts',
    'Negocios': 'Deals', 'Ajustes': 'Settings', 'Cerrar sesión': 'Log out',

    // ─── Common actions ───
    'Guardar': 'Save', 'Cancelar': 'Cancel', 'Editar': 'Edit',
    'Eliminar': 'Delete', 'Crear': 'Create', 'Ver': 'View', 'Añadir': 'Add',
    'Nuevo': 'New', 'Todos': 'All', 'Ninguno': 'None',
    'Guardar cambios': 'Save changes', 'Guardando...': 'Saving...',
    'Creando...': 'Creating...', 'Eliminando...': 'Deleting...',
    'Buscando...': 'Searching...', 'Actualizar': 'Update',
    'Cerrar': 'Close', 'Reintentar': 'Retry', 'Cargando...': 'Loading...',
    'Confirmar': 'Confirm', 'Aceptar': 'Accept', 'Enviar': 'Send',

    // ─── Dog ───
    'Macho': 'Male', 'Hembra': 'Female', 'Nombre': 'Name', 'Raza': 'Breed',
    'Color': 'Color', 'Nacimiento': 'Birth', 'Peso': 'Weight', 'Altura': 'Height',
    'Padre': 'Sire', 'Madre': 'Dam', 'Criadero': 'Kennel', 'Pedigree': 'Pedigree',
    'Salud': 'Health', 'Palmarés': 'Awards', 'Hermanos': 'Siblings', 'Descendientes': 'Offspring',
    'Machos': 'Males', 'Hembras': 'Females',
    'Añadir perro': 'Add dog', 'Editar perro': 'Edit dog',
    'Crear perro': 'Create dog', 'Perros': 'Dogs',
    'perros registrados': 'registered dogs',
    'Sexo': 'Sex', 'Registro': 'Registration', 'Microchip': 'Microchip',
    'Peso (kg)': 'Weight (kg)', 'Altura (cm)': 'Height (cm)',
    'Fecha de nacimiento': 'Date of birth',
    'Datos basicos': 'Basic info', 'Clasificacion': 'Classification',
    'Identificacion': 'Identification', 'Medidas': 'Measurements',
    'Genealogia': 'Pedigree', 'Genealogia (de la camada)': 'Pedigree (from litter)',
    'Reproductor': 'Breeding', 'Reproductores': 'Breeders',
    'En venta': 'For sale', 'No en venta': 'Not for sale',
    'Publico': 'Public', 'Privado': 'Private',
    'Visible para otros': 'Visible to others', 'Solo tu': 'Only you',
    'Visible en perfil': 'Visible on profile',
    'Oculto del perfil publico': 'Hidden from public profile',
    'Perfil publico': 'Public profile',
    'Sin nombre': 'No name', 'Sin raza': 'No breed',
    'Galería': 'Gallery', 'Historial': 'History',
    'Número': 'Number', 'Plantilla (opcional)': 'Template (optional)',
    'Ver perfil': 'View profile',

    // ─── Litters ───
    'Planificada': 'Planned', 'Cubrición': 'Mated', 'Nacida': 'Born',
    'Cachorros': 'Puppies', 'Añadir camada': 'Add litter', 'Editar camada': 'Edit litter',
    'camadas': 'litters', 'Camada publica': 'Public litter',
    'Camada Hipotetica': 'Hypothetical Litter',
    'Padre (Macho)': 'Sire (Male)', 'Madre (Hembra)': 'Dam (Female)',
    'Seleccionar macho...': 'Select male...', 'Seleccionar hembra...': 'Select female...',
    'Publica': 'Public', 'Privada': 'Private',

    // ─── Calendar ───
    'Enero': 'January', 'Febrero': 'February', 'Marzo': 'March',
    'Abril': 'April', 'Mayo': 'May', 'Junio': 'June',
    'Julio': 'July', 'Agosto': 'August', 'Septiembre': 'September',
    'Octubre': 'October', 'Noviembre': 'November', 'Diciembre': 'December',
    'Lunes': 'Monday', 'Martes': 'Tuesday', 'Miércoles': 'Wednesday',
    'Jueves': 'Thursday', 'Viernes': 'Friday', 'Sábado': 'Saturday', 'Domingo': 'Sunday',
    'Lun': 'Mon', 'Mar': 'Tue', 'Mie': 'Wed', 'Jue': 'Thu', 'Vie': 'Fri', 'Sab': 'Sat', 'Dom': 'Sun',
    'Hoy': 'Today', 'Mes': 'Month', 'Semana': 'Week', 'Día': 'Day',
    'Evento': 'Event', 'Todo el día': 'All day',
    'Nuevo evento': 'New event', 'Editar evento': 'Edit event',
    'Sin eventos este día': 'No events this day',
    'Cría': 'Breeding', 'Parto': 'Birth', 'Expo': 'Show', 'Exposición': 'Exhibition',
    'Otro': 'Other',

    // ─── CRM ───
    'Pipeline': 'Pipeline', 'Etapa': 'Stage', 'Valor': 'Value', 'Contacto': 'Contact',
    'Nuevo contacto': 'New contact', 'Nuevo negocio': 'New deal',
    'contactos': 'contacts', 'negocios en': 'deals in',
    'Origen': 'Source', 'Notas': 'Notes',
    'Sin transacciones': 'No transactions',
    'Sin actividad registrada': 'No activity recorded',

    // ─── Vet ───
    'Nuevo recordatorio': 'New reminder', 'Editar recordatorio': 'Edit reminder',
    'Vacuna': 'Vaccine', 'Desparasitación': 'Deworming', 'Revisión': 'Checkup',
    'Personalizado': 'Custom', 'Completado': 'Completed', 'Completados': 'Completed',
    'Vencido': 'Overdue', 'Vencidos': 'Overdue', 'Próximo': 'Upcoming',
    'Todos los perros': 'All dogs', 'Sin plantillas': 'No templates',
    'No hay recordatorios': 'No reminders', 'Plantilla rapida': 'Quick template',
    'Primovacunación': 'First vaccination',

    // ─── Settings ───
    'Perfil': 'Profile', 'Seguridad': 'Security', 'Plan': 'Plan',
    'Idioma y región': 'Language & Region', 'Notificaciones': 'Notifications',
    'Privacidad': 'Privacy', 'Datos': 'Data',

    // ─── Auth ───
    'Iniciar sesión': 'Log in', 'Registrarse': 'Sign up',

    // ─── Filters ───
    'Todos los sexos': 'All sexes', 'Todas las razas': 'All breeds',
    'Ambos sexos': 'Both sexes', 'Todos los origenes': 'All sources',
    'Transferir': 'Transfer', 'Vender': 'Sell', 'Visible': 'Visible',
    'Pedir información': 'Request info', 'Consultar precio': 'Check price',

    // ─── Dashboard ───
    'Revenue': 'Revenue', 'Solicitudes': 'Inquiries',
    'Hola': 'Hello', 'Edad media': 'Average age',
    'Con padres': 'With parents', 'Salud Genetica': 'Genetic Health',

    // ─── Search ───
    'Buscar perros': 'Search dogs',
    'Buscar por nombre, raza, color...': 'Search by name, breed, color...',
    'Buscar por padre, madre o raza...': 'Search by sire, dam or breed...',
    'Buscar contacto...': 'Search contact...',
    'Buscar perro...': 'Search dog...',
    'Buscar raza...': 'Search breed...', 'Buscar color...': 'Search color...',
    'Buscar padre...': 'Search sire...', 'Buscar madre...': 'Search dam...',
    'Buscar criadero...': 'Search kennel...',
    'Buscar perro existente...': 'Search existing dog...',
    'No se encontraron resultados': 'No results found',

    // ─── Favorites ───
    'No tienes favoritos': 'You have no favorites',
    'Explorar perros': 'Explore dogs',
    'Quitar de favoritos': 'Remove from favorites',
    'Añadir a favoritos': 'Add to favorites',
    'perros guardados': 'saved dogs',
    'Pulsa el corazon en el perfil de un perro para guardarlo': 'Tap the heart on a dog profile to save it',

    // ─── Empty states ───
    'No tienes contactos': 'You have no contacts',
    'Sin resultados': 'No results', 'Sin especificar': 'Unspecified',
    'Sin titulos': 'No titles', 'Sin registros': 'No records',
    'No hay perros en este criadero': 'No dogs in this kennel',

    // ─── Health tabs ───
    'Tipo': 'Type', 'Fecha': 'Date', 'Descripcion': 'Description',
    'Resultado': 'Result', 'Tratamiento': 'Treatment',
    'Añadir registro': 'Add record',

    // ─── Planner ───
    'Planificador de Cruces': 'Breeding Planner',

    // ─── Kennel ───
    'EN VENTA': 'FOR SALE',

    // ─── Offline ───
    'Sin conexión': 'No connection',
    'Comprueba tu conexión a Internet e inténtalo de nuevo.': 'Check your internet connection and try again.',
  },

  fr: {
    // Nav
    'Escritorio': 'Tableau de bord', 'Mis Perros': 'Mes Chiens', 'Contribuciones': 'Contributions', 'Camadas': 'Portées',
    'Calendario': 'Calendrier', 'Planificador': 'Planificateur', 'Veterinario': 'Vétérinaire',
    'Buscar': 'Rechercher', 'Favoritos': 'Favoris',
    'Mi Criadero': 'Mon Élevage', 'Analíticas': 'Analytiques', 'Contactos': 'Contacts',
    'Negocios': 'Affaires', 'Ajustes': 'Paramètres', 'Cerrar sesión': 'Déconnexion',
    // Common
    'Guardar': 'Enregistrer', 'Cancelar': 'Annuler', 'Editar': 'Modifier',
    'Eliminar': 'Supprimer', 'Crear': 'Créer', 'Ver': 'Voir', 'Añadir': 'Ajouter',
    'Nuevo': 'Nouveau', 'Todos': 'Tous', 'Ninguno': 'Aucun',
    'Guardar cambios': 'Enregistrer', 'Guardando...': 'Enregistrement...',
    'Creando...': 'Création...', 'Eliminando...': 'Suppression...',
    'Buscando...': 'Recherche...', 'Actualizar': 'Mettre à jour',
    'Cerrar': 'Fermer', 'Reintentar': 'Réessayer', 'Cargando...': 'Chargement...',
    'Confirmar': 'Confirmer', 'Aceptar': 'Accepter', 'Enviar': 'Envoyer',
    // Dog
    'Macho': 'Mâle', 'Hembra': 'Femelle', 'Nombre': 'Nom', 'Raza': 'Race',
    'Color': 'Couleur', 'Nacimiento': 'Naissance', 'Peso': 'Poids', 'Altura': 'Taille',
    'Padre': 'Père', 'Madre': 'Mère', 'Criadero': 'Élevage', 'Pedigree': 'Pedigree',
    'Salud': 'Santé', 'Palmarés': 'Palmarès', 'Hermanos': 'Frères', 'Descendientes': 'Descendants',
    'Machos': 'Mâles', 'Hembras': 'Femelles',
    'Añadir perro': 'Ajouter un chien', 'Editar perro': 'Modifier le chien',
    'Crear perro': 'Créer un chien', 'Perros': 'Chiens',
    'perros registrados': 'chiens enregistrés',
    'Sexo': 'Sexe', 'Registro': 'Enregistrement', 'Microchip': 'Puce',
    'Peso (kg)': 'Poids (kg)', 'Altura (cm)': 'Taille (cm)',
    'Fecha de nacimiento': 'Date de naissance',
    'Datos basicos': 'Informations de base', 'Clasificacion': 'Classification',
    'Identificacion': 'Identification', 'Medidas': 'Mesures',
    'Genealogia': 'Généalogie', 'Reproductor': 'Reproducteur', 'Reproductores': 'Reproducteurs',
    'En venta': 'À vendre', 'No en venta': 'Pas à vendre',
    'Publico': 'Public', 'Privado': 'Privé',
    'Visible para otros': 'Visible par les autres', 'Solo tu': 'Vous seul',
    'Sin nombre': 'Sans nom', 'Sin raza': 'Sans race',
    'Galería': 'Galerie', 'Historial': 'Historique',
    'Ver perfil': 'Voir le profil',
    // Litters
    'Planificada': 'Planifiée', 'Cubrición': 'Saillie', 'Nacida': 'Née',
    'Cachorros': 'Chiots', 'Añadir camada': 'Ajouter une portée', 'Editar camada': 'Modifier la portée',
    'camadas': 'portées', 'Camada publica': 'Portée publique',
    'Camada Hipotetica': 'Portée Hypothétique',
    'Padre (Macho)': 'Père (Mâle)', 'Madre (Hembra)': 'Mère (Femelle)',
    'Seleccionar macho...': 'Sélectionner mâle...', 'Seleccionar hembra...': 'Sélectionner femelle...',
    'Publica': 'Publique', 'Privada': 'Privée',
    // Calendar
    'Enero': 'Janvier', 'Febrero': 'Février', 'Marzo': 'Mars',
    'Abril': 'Avril', 'Mayo': 'Mai', 'Junio': 'Juin',
    'Julio': 'Juillet', 'Agosto': 'Août', 'Septiembre': 'Septembre',
    'Octubre': 'Octobre', 'Noviembre': 'Novembre', 'Diciembre': 'Décembre',
    'Lunes': 'Lundi', 'Martes': 'Mardi', 'Miércoles': 'Mercredi',
    'Jueves': 'Jeudi', 'Viernes': 'Vendredi', 'Sábado': 'Samedi', 'Domingo': 'Dimanche',
    'Lun': 'Lun', 'Mar': 'Mar', 'Mie': 'Mer', 'Jue': 'Jeu', 'Vie': 'Ven', 'Sab': 'Sam', 'Dom': 'Dim',
    'Hoy': "Aujourd'hui", 'Mes': 'Mois', 'Semana': 'Semaine', 'Día': 'Jour',
    'Evento': 'Événement', 'Todo el día': 'Toute la journée',
    'Sin eventos este día': "Pas d'événements ce jour",
    'Cría': 'Élevage', 'Parto': 'Naissance', 'Expo': 'Expo', 'Exposición': 'Exposition', 'Otro': 'Autre',
    // CRM
    'Pipeline': 'Pipeline', 'Etapa': 'Étape', 'Valor': 'Valeur', 'Contacto': 'Contact',
    'Nuevo contacto': 'Nouveau contact', 'Nuevo negocio': 'Nouvelle affaire',
    'contactos': 'contacts', 'negocios en': 'affaires en',
    'Origen': 'Origine', 'Notas': 'Notes',
    // Vet
    'Nuevo recordatorio': 'Nouveau rappel', 'Editar recordatorio': 'Modifier le rappel',
    'Vacuna': 'Vaccin', 'Desparasitación': 'Vermifuge', 'Revisión': 'Contrôle',
    'Personalizado': 'Personnalisé', 'Completado': 'Terminé', 'Completados': 'Terminés',
    'Vencido': 'En retard', 'Vencidos': 'En retard', 'Próximo': 'Prochain',
    'Todos los perros': 'Tous les chiens', 'No hay recordatorios': 'Pas de rappels',
    'Plantilla rapida': 'Modèle rapide',
    // Settings
    'Perfil': 'Profil', 'Seguridad': 'Sécurité', 'Plan': 'Forfait',
    'Idioma y región': 'Langue et région', 'Notificaciones': 'Notifications',
    'Privacidad': 'Confidentialité', 'Datos': 'Données',
    // Auth
    'Iniciar sesión': 'Se connecter', 'Registrarse': "S'inscrire",
    // Filters
    'Todos los sexos': 'Tous les sexes', 'Todas las razas': 'Toutes les races',
    'Ambos sexos': 'Les deux sexes', 'Todos los origenes': 'Toutes les origines',
    'Transferir': 'Transférer', 'Vender': 'Vendre', 'Visible': 'Visible',
    'Pedir información': "Demander des infos", 'Consultar precio': 'Demander le prix',
    // Dashboard
    'Revenue': 'Revenus', 'Solicitudes': 'Demandes',
    'Hola': 'Bonjour', 'Edad media': 'Âge moyen',
    // Search
    'Buscar perros': 'Rechercher des chiens',
    'Buscar por nombre, raza, color...': 'Rechercher par nom, race, couleur...',
    'Buscar por padre, madre o raza...': 'Rechercher par père, mère ou race...',
    'Buscar contacto...': 'Rechercher un contact...',
    'Buscar perro...': 'Rechercher un chien...',
    'No se encontraron resultados': 'Aucun résultat trouvé',
    // Favorites
    'No tienes favoritos': "Vous n'avez pas de favoris",
    'Explorar perros': 'Explorer les chiens',
    'Quitar de favoritos': 'Retirer des favoris', 'Añadir a favoritos': 'Ajouter aux favoris',
    // Empty states
    'No tienes contactos': "Vous n'avez pas de contacts",
    'Sin resultados': 'Aucun résultat', 'Sin registros': 'Aucun enregistrement',
    // Health
    'Tipo': 'Type', 'Fecha': 'Date', 'Descripcion': 'Description',
    'Resultado': 'Résultat', 'Tratamiento': 'Traitement', 'Añadir registro': 'Ajouter un enregistrement',
    // Planner
    'Planificador de Cruces': 'Planificateur de croisements',
    'EN VENTA': 'À VENDRE',
    // Offline
    'Sin conexión': 'Hors connexion',
  },

  de: {
    // Nav
    'Escritorio': 'Dashboard', 'Mis Perros': 'Meine Hunde', 'Contribuciones': 'Beiträge', 'Camadas': 'Würfe',
    'Calendario': 'Kalender', 'Planificador': 'Planer', 'Veterinario': 'Tierarzt',
    'Buscar': 'Suchen', 'Favoritos': 'Favoriten',
    'Mi Criadero': 'Meine Zucht', 'Analíticas': 'Analytik', 'Contactos': 'Kontakte',
    'Negocios': 'Geschäfte', 'Ajustes': 'Einstellungen', 'Cerrar sesión': 'Abmelden',
    // Common
    'Guardar': 'Speichern', 'Cancelar': 'Abbrechen', 'Editar': 'Bearbeiten',
    'Eliminar': 'Löschen', 'Crear': 'Erstellen', 'Ver': 'Ansehen', 'Añadir': 'Hinzufügen',
    'Nuevo': 'Neu', 'Todos': 'Alle', 'Ninguno': 'Keine',
    'Guardar cambios': 'Änderungen speichern', 'Guardando...': 'Speichern...',
    'Creando...': 'Erstellen...', 'Eliminando...': 'Löschen...',
    'Buscando...': 'Suchen...', 'Actualizar': 'Aktualisieren',
    'Cerrar': 'Schließen', 'Reintentar': 'Erneut versuchen', 'Cargando...': 'Laden...',
    'Confirmar': 'Bestätigen', 'Aceptar': 'Akzeptieren', 'Enviar': 'Senden',
    // Dog
    'Macho': 'Rüde', 'Hembra': 'Hündin', 'Nombre': 'Name', 'Raza': 'Rasse',
    'Color': 'Farbe', 'Nacimiento': 'Geburt', 'Peso': 'Gewicht', 'Altura': 'Größe',
    'Padre': 'Vater', 'Madre': 'Mutter', 'Criadero': 'Zucht', 'Pedigree': 'Stammbaum',
    'Salud': 'Gesundheit', 'Palmarés': 'Auszeichnungen', 'Hermanos': 'Geschwister', 'Descendientes': 'Nachkommen',
    'Machos': 'Rüden', 'Hembras': 'Hündinnen',
    'Añadir perro': 'Hund hinzufügen', 'Editar perro': 'Hund bearbeiten',
    'Crear perro': 'Hund erstellen', 'Perros': 'Hunde',
    'perros registrados': 'registrierte Hunde',
    'Sexo': 'Geschlecht', 'Registro': 'Registrierung', 'Microchip': 'Mikrochip',
    'Peso (kg)': 'Gewicht (kg)', 'Altura (cm)': 'Größe (cm)',
    'Fecha de nacimiento': 'Geburtsdatum',
    'Datos basicos': 'Grunddaten', 'Clasificacion': 'Klassifizierung',
    'Identificacion': 'Identifikation', 'Medidas': 'Maße',
    'Genealogia': 'Stammbaum', 'Reproductor': 'Zuchthund', 'Reproductores': 'Zuchthunde',
    'En venta': 'Zu verkaufen', 'No en venta': 'Nicht zu verkaufen',
    'Publico': 'Öffentlich', 'Privado': 'Privat',
    'Visible para otros': 'Für andere sichtbar', 'Solo tu': 'Nur du',
    'Sin nombre': 'Kein Name', 'Sin raza': 'Keine Rasse',
    'Galería': 'Galerie', 'Historial': 'Verlauf',
    'Ver perfil': 'Profil ansehen',
    // Litters
    'Planificada': 'Geplant', 'Cubrición': 'Gedeckt', 'Nacida': 'Geboren',
    'Cachorros': 'Welpen', 'Añadir camada': 'Wurf hinzufügen', 'Editar camada': 'Wurf bearbeiten',
    'camadas': 'Würfe', 'Camada publica': 'Öffentlicher Wurf',
    'Camada Hipotetica': 'Hypothetischer Wurf',
    'Padre (Macho)': 'Vater (Rüde)', 'Madre (Hembra)': 'Mutter (Hündin)',
    'Seleccionar macho...': 'Rüde auswählen...', 'Seleccionar hembra...': 'Hündin auswählen...',
    'Publica': 'Öffentlich', 'Privada': 'Privat',
    // Calendar
    'Enero': 'Januar', 'Febrero': 'Februar', 'Marzo': 'März',
    'Abril': 'April', 'Mayo': 'Mai', 'Junio': 'Juni',
    'Julio': 'Juli', 'Agosto': 'August', 'Septiembre': 'September',
    'Octubre': 'Oktober', 'Noviembre': 'November', 'Diciembre': 'Dezember',
    'Lunes': 'Montag', 'Martes': 'Dienstag', 'Miércoles': 'Mittwoch',
    'Jueves': 'Donnerstag', 'Viernes': 'Freitag', 'Sábado': 'Samstag', 'Domingo': 'Sonntag',
    'Lun': 'Mo', 'Mar': 'Di', 'Mie': 'Mi', 'Jue': 'Do', 'Vie': 'Fr', 'Sab': 'Sa', 'Dom': 'So',
    'Hoy': 'Heute', 'Mes': 'Monat', 'Semana': 'Woche', 'Día': 'Tag',
    'Evento': 'Termin', 'Todo el día': 'Ganztägig',
    'Sin eventos este día': 'Keine Termine an diesem Tag',
    'Cría': 'Zucht', 'Parto': 'Geburt', 'Expo': 'Ausstellung', 'Exposición': 'Ausstellung', 'Otro': 'Sonstiges',
    // CRM
    'Pipeline': 'Pipeline', 'Etapa': 'Phase', 'Valor': 'Wert', 'Contacto': 'Kontakt',
    'Nuevo contacto': 'Neuer Kontakt', 'Nuevo negocio': 'Neues Geschäft',
    'contactos': 'Kontakte', 'negocios en': 'Geschäfte in',
    'Origen': 'Herkunft', 'Notas': 'Notizen',
    // Vet
    'Nuevo recordatorio': 'Neue Erinnerung', 'Editar recordatorio': 'Erinnerung bearbeiten',
    'Vacuna': 'Impfung', 'Desparasitación': 'Entwurmung', 'Revisión': 'Kontrolle',
    'Personalizado': 'Benutzerdefiniert', 'Completado': 'Abgeschlossen', 'Completados': 'Abgeschlossen',
    'Vencido': 'Überfällig', 'Vencidos': 'Überfällig', 'Próximo': 'Nächster',
    'Todos los perros': 'Alle Hunde', 'No hay recordatorios': 'Keine Erinnerungen',
    'Plantilla rapida': 'Schnellvorlage',
    // Settings
    'Perfil': 'Profil', 'Seguridad': 'Sicherheit', 'Plan': 'Plan',
    'Idioma y región': 'Sprache & Region', 'Notificaciones': 'Benachrichtigungen',
    'Privacidad': 'Datenschutz', 'Datos': 'Daten',
    // Auth
    'Iniciar sesión': 'Anmelden', 'Registrarse': 'Registrieren',
    // Filters
    'Todos los sexos': 'Alle Geschlechter', 'Todas las razas': 'Alle Rassen',
    'Ambos sexos': 'Beide Geschlechter', 'Todos los origenes': 'Alle Herkünfte',
    'Transferir': 'Übertragen', 'Vender': 'Verkaufen', 'Visible': 'Sichtbar',
    'Pedir información': 'Infos anfordern', 'Consultar precio': 'Preis anfragen',
    // Dashboard
    'Revenue': 'Umsatz', 'Solicitudes': 'Anfragen',
    'Hola': 'Hallo', 'Edad media': 'Durchschnittsalter',
    // Search
    'Buscar perros': 'Hunde suchen',
    'Buscar por nombre, raza, color...': 'Nach Name, Rasse, Farbe suchen...',
    'Buscar por padre, madre o raza...': 'Nach Vater, Mutter oder Rasse suchen...',
    'No se encontraron resultados': 'Keine Ergebnisse gefunden',
    // Favorites
    'No tienes favoritos': 'Du hast keine Favoriten',
    'Explorar perros': 'Hunde entdecken',
    'Quitar de favoritos': 'Aus Favoriten entfernen', 'Añadir a favoritos': 'Zu Favoriten hinzufügen',
    // Empty states
    'No tienes contactos': 'Du hast keine Kontakte',
    'Sin resultados': 'Keine Ergebnisse', 'Sin registros': 'Keine Einträge',
    // Health
    'Tipo': 'Typ', 'Fecha': 'Datum', 'Descripcion': 'Beschreibung',
    'Resultado': 'Ergebnis', 'Tratamiento': 'Behandlung', 'Añadir registro': 'Eintrag hinzufügen',
    // Planner
    'Planificador de Cruces': 'Zuchtplaner',
    'EN VENTA': 'ZU VERKAUFEN',
    'Sin conexión': 'Keine Verbindung',
  },

  pt: {
    // Nav
    'Escritorio': 'Painel', 'Mis Perros': 'Meus Cães', 'Contribuciones': 'Contribuições', 'Camadas': 'Ninhadas',
    'Calendario': 'Calendário', 'Planificador': 'Planificador', 'Veterinario': 'Veterinário',
    'Buscar': 'Pesquisar', 'Favoritos': 'Favoritos',
    'Mi Criadero': 'Meu Canil', 'Analíticas': 'Análises', 'Contactos': 'Contactos',
    'Negocios': 'Negócios', 'Ajustes': 'Configurações', 'Cerrar sesión': 'Sair',
    // Common
    'Guardar': 'Guardar', 'Cancelar': 'Cancelar', 'Editar': 'Editar',
    'Eliminar': 'Eliminar', 'Crear': 'Criar', 'Ver': 'Ver', 'Añadir': 'Adicionar',
    'Nuevo': 'Novo', 'Todos': 'Todos', 'Ninguno': 'Nenhum',
    'Guardar cambios': 'Guardar alterações', 'Guardando...': 'Guardando...',
    'Creando...': 'Criando...', 'Eliminando...': 'Eliminando...',
    'Buscando...': 'Pesquisando...', 'Actualizar': 'Atualizar',
    'Cerrar': 'Fechar', 'Reintentar': 'Tentar novamente', 'Cargando...': 'Carregando...',
    'Confirmar': 'Confirmar', 'Aceptar': 'Aceitar', 'Enviar': 'Enviar',
    // Dog
    'Macho': 'Macho', 'Hembra': 'Fêmea', 'Nombre': 'Nome', 'Raza': 'Raça',
    'Color': 'Cor', 'Nacimiento': 'Nascimento', 'Peso': 'Peso', 'Altura': 'Altura',
    'Padre': 'Pai', 'Madre': 'Mãe', 'Criadero': 'Canil', 'Pedigree': 'Pedigree',
    'Salud': 'Saúde', 'Palmarés': 'Prémios', 'Hermanos': 'Irmãos', 'Descendientes': 'Descendentes',
    'Machos': 'Machos', 'Hembras': 'Fêmeas',
    'Añadir perro': 'Adicionar cão', 'Editar perro': 'Editar cão',
    'Crear perro': 'Criar cão', 'Perros': 'Cães',
    'perros registrados': 'cães registados',
    'Sexo': 'Sexo', 'Registro': 'Registo', 'Microchip': 'Microchip',
    'Peso (kg)': 'Peso (kg)', 'Altura (cm)': 'Altura (cm)',
    'Fecha de nacimiento': 'Data de nascimento',
    'Datos basicos': 'Dados básicos', 'Clasificacion': 'Classificação',
    'Identificacion': 'Identificação', 'Medidas': 'Medidas',
    'Genealogia': 'Genealogia', 'Reproductor': 'Reprodutor', 'Reproductores': 'Reprodutores',
    'En venta': 'À venda', 'No en venta': 'Não à venda',
    'Publico': 'Público', 'Privado': 'Privado',
    'Sin nombre': 'Sem nome', 'Sin raza': 'Sem raça',
    'Galería': 'Galeria', 'Historial': 'Histórico',
    'Ver perfil': 'Ver perfil',
    // Litters
    'Planificada': 'Planeada', 'Cubrición': 'Cobrição', 'Nacida': 'Nascida',
    'Cachorros': 'Filhotes', 'Añadir camada': 'Adicionar ninhada', 'Editar camada': 'Editar ninhada',
    'camadas': 'ninhadas', 'Publica': 'Pública', 'Privada': 'Privada',
    'Padre (Macho)': 'Pai (Macho)', 'Madre (Hembra)': 'Mãe (Fêmea)',
    // Calendar
    'Enero': 'Janeiro', 'Febrero': 'Fevereiro', 'Marzo': 'Março',
    'Abril': 'Abril', 'Mayo': 'Maio', 'Junio': 'Junho',
    'Julio': 'Julho', 'Agosto': 'Agosto', 'Septiembre': 'Setembro',
    'Octubre': 'Outubro', 'Noviembre': 'Novembro', 'Diciembre': 'Dezembro',
    'Lunes': 'Segunda', 'Martes': 'Terça', 'Miércoles': 'Quarta',
    'Jueves': 'Quinta', 'Viernes': 'Sexta', 'Sábado': 'Sábado', 'Domingo': 'Domingo',
    'Lun': 'Seg', 'Mar': 'Ter', 'Mie': 'Qua', 'Jue': 'Qui', 'Vie': 'Sex', 'Sab': 'Sáb', 'Dom': 'Dom',
    'Hoy': 'Hoje', 'Mes': 'Mês', 'Semana': 'Semana', 'Día': 'Dia',
    'Evento': 'Evento', 'Todo el día': 'Dia inteiro',
    'Sin eventos este día': 'Sem eventos neste dia',
    'Cría': 'Criação', 'Parto': 'Parto', 'Expo': 'Expo', 'Exposición': 'Exposição', 'Otro': 'Outro',
    // CRM
    'Pipeline': 'Pipeline', 'Etapa': 'Etapa', 'Valor': 'Valor', 'Contacto': 'Contacto',
    'Nuevo contacto': 'Novo contacto', 'Nuevo negocio': 'Novo negócio',
    'contactos': 'contactos', 'Origen': 'Origem', 'Notas': 'Notas',
    // Vet
    'Nuevo recordatorio': 'Novo lembrete', 'Editar recordatorio': 'Editar lembrete',
    'Vacuna': 'Vacina', 'Desparasitación': 'Desparasitação', 'Revisión': 'Revisão',
    'Personalizado': 'Personalizado', 'Completado': 'Concluído', 'Completados': 'Concluídos',
    'Vencido': 'Vencido', 'Vencidos': 'Vencidos', 'Próximo': 'Próximo',
    'Todos los perros': 'Todos os cães', 'No hay recordatorios': 'Sem lembretes',
    // Settings
    'Perfil': 'Perfil', 'Seguridad': 'Segurança', 'Plan': 'Plano',
    'Idioma y región': 'Idioma e região', 'Notificaciones': 'Notificações',
    'Privacidad': 'Privacidade', 'Datos': 'Dados',
    // Auth
    'Iniciar sesión': 'Entrar', 'Registrarse': 'Registar',
    // Filters
    'Todos los sexos': 'Todos os sexos', 'Todas las razas': 'Todas as raças',
    'Transferir': 'Transferir', 'Pedir información': 'Pedir informação',
    // Dashboard
    'Revenue': 'Receita', 'Solicitudes': 'Pedidos', 'Hola': 'Olá',
    'Buscar perros': 'Pesquisar cães',
    'No tienes favoritos': 'Não tem favoritos', 'Explorar perros': 'Explorar cães',
    'Quitar de favoritos': 'Remover dos favoritos', 'Añadir a favoritos': 'Adicionar aos favoritos',
    'No tienes contactos': 'Não tem contactos',
    'Sin resultados': 'Sem resultados',
    'Planificador de Cruces': 'Planificador de cruzamentos',
    'EN VENTA': 'À VENDA', 'Sin conexión': 'Sem ligação',
    'Tipo': 'Tipo', 'Fecha': 'Data', 'Descripcion': 'Descrição',
  },

  it: {
    // Nav
    'Escritorio': 'Pannello', 'Mis Perros': 'I miei cani', 'Contribuciones': 'Contributi', 'Camadas': 'Cucciolate',
    'Calendario': 'Calendario', 'Planificador': 'Pianificatore', 'Veterinario': 'Veterinario',
    'Buscar': 'Cerca', 'Favoritos': 'Preferiti',
    'Mi Criadero': 'Il mio allevamento', 'Analíticas': 'Analisi', 'Contactos': 'Contatti',
    'Negocios': 'Affari', 'Ajustes': 'Impostazioni', 'Cerrar sesión': 'Esci',
    // Common
    'Guardar': 'Salva', 'Cancelar': 'Annulla', 'Editar': 'Modifica',
    'Eliminar': 'Elimina', 'Crear': 'Crea', 'Ver': 'Vedi', 'Añadir': 'Aggiungi',
    'Nuevo': 'Nuovo', 'Todos': 'Tutti', 'Ninguno': 'Nessuno',
    'Guardar cambios': 'Salva modifiche', 'Guardando...': 'Salvando...',
    'Creando...': 'Creando...', 'Eliminando...': 'Eliminando...',
    'Buscando...': 'Cercando...', 'Actualizar': 'Aggiorna',
    'Cerrar': 'Chiudi', 'Reintentar': 'Riprova', 'Cargando...': 'Caricamento...',
    'Confirmar': 'Conferma', 'Aceptar': 'Accetta', 'Enviar': 'Invia',
    // Dog
    'Macho': 'Maschio', 'Hembra': 'Femmina', 'Nombre': 'Nome', 'Raza': 'Razza',
    'Color': 'Colore', 'Nacimiento': 'Nascita', 'Peso': 'Peso', 'Altura': 'Altezza',
    'Padre': 'Padre', 'Madre': 'Madre', 'Criadero': 'Allevamento', 'Pedigree': 'Pedigree',
    'Salud': 'Salute', 'Palmarés': 'Palmares', 'Hermanos': 'Fratelli', 'Descendientes': 'Discendenti',
    'Machos': 'Maschi', 'Hembras': 'Femmine',
    'Añadir perro': 'Aggiungi cane', 'Editar perro': 'Modifica cane',
    'Crear perro': 'Crea cane', 'Perros': 'Cani',
    'perros registrados': 'cani registrati',
    'Sexo': 'Sesso', 'Registro': 'Registrazione', 'Microchip': 'Microchip',
    'Peso (kg)': 'Peso (kg)', 'Altura (cm)': 'Altezza (cm)',
    'Fecha de nacimiento': 'Data di nascita',
    'Datos basicos': 'Dati base', 'Clasificacion': 'Classificazione',
    'Identificacion': 'Identificazione', 'Medidas': 'Misure',
    'Genealogia': 'Genealogia', 'Reproductor': 'Riproduttore', 'Reproductores': 'Riproduttori',
    'En venta': 'In vendita', 'No en venta': 'Non in vendita',
    'Publico': 'Pubblico', 'Privado': 'Privato',
    'Sin nombre': 'Senza nome', 'Sin raza': 'Senza razza',
    'Galería': 'Galleria', 'Historial': 'Cronologia',
    'Ver perfil': 'Vedi profilo',
    // Litters
    'Planificada': 'Pianificata', 'Cubrición': 'Monta', 'Nacida': 'Nata',
    'Cachorros': 'Cuccioli', 'Añadir camada': 'Aggiungi cucciolata', 'Editar camada': 'Modifica cucciolata',
    'camadas': 'cucciolate', 'Publica': 'Pubblica', 'Privada': 'Privata',
    'Padre (Macho)': 'Padre (Maschio)', 'Madre (Hembra)': 'Madre (Femmina)',
    // Calendar
    'Enero': 'Gennaio', 'Febrero': 'Febbraio', 'Marzo': 'Marzo',
    'Abril': 'Aprile', 'Mayo': 'Maggio', 'Junio': 'Giugno',
    'Julio': 'Luglio', 'Agosto': 'Agosto', 'Septiembre': 'Settembre',
    'Octubre': 'Ottobre', 'Noviembre': 'Novembre', 'Diciembre': 'Dicembre',
    'Lunes': 'Lunedì', 'Martes': 'Martedì', 'Miércoles': 'Mercoledì',
    'Jueves': 'Giovedì', 'Viernes': 'Venerdì', 'Sábado': 'Sabato', 'Domingo': 'Domenica',
    'Lun': 'Lun', 'Mar': 'Mar', 'Mie': 'Mer', 'Jue': 'Gio', 'Vie': 'Ven', 'Sab': 'Sab', 'Dom': 'Dom',
    'Hoy': 'Oggi', 'Mes': 'Mese', 'Semana': 'Settimana', 'Día': 'Giorno',
    'Evento': 'Evento', 'Todo el día': 'Tutto il giorno',
    'Sin eventos este día': 'Nessun evento oggi',
    'Cría': 'Allevamento', 'Parto': 'Parto', 'Expo': 'Mostra', 'Exposición': 'Mostra', 'Otro': 'Altro',
    // CRM
    'Pipeline': 'Pipeline', 'Etapa': 'Fase', 'Valor': 'Valore', 'Contacto': 'Contatto',
    'Nuevo contacto': 'Nuovo contatto', 'Nuevo negocio': 'Nuovo affare',
    'contactos': 'contatti', 'Origen': 'Origine', 'Notas': 'Note',
    // Vet
    'Nuevo recordatorio': 'Nuovo promemoria', 'Editar recordatorio': 'Modifica promemoria',
    'Vacuna': 'Vaccino', 'Desparasitación': 'Sverminazione', 'Revisión': 'Controllo',
    'Personalizado': 'Personalizzato', 'Completado': 'Completato', 'Completados': 'Completati',
    'Vencido': 'Scaduto', 'Vencidos': 'Scaduti', 'Próximo': 'Prossimo',
    'Todos los perros': 'Tutti i cani', 'No hay recordatorios': 'Nessun promemoria',
    // Settings
    'Perfil': 'Profilo', 'Seguridad': 'Sicurezza', 'Plan': 'Piano',
    'Idioma y región': 'Lingua e regione', 'Notificaciones': 'Notifiche',
    'Privacidad': 'Privacy', 'Datos': 'Dati',
    // Auth
    'Iniciar sesión': 'Accedi', 'Registrarse': 'Registrati',
    // Filters
    'Todos los sexos': 'Tutti i sessi', 'Todas las razas': 'Tutte le razze',
    'Transferir': 'Trasferire', 'Pedir información': 'Richiedi info',
    // Dashboard
    'Revenue': 'Ricavi', 'Solicitudes': 'Richieste', 'Hola': 'Ciao',
    'Buscar perros': 'Cerca cani',
    'No tienes favoritos': 'Non hai preferiti', 'Explorar perros': 'Esplora cani',
    'Quitar de favoritos': 'Rimuovi dai preferiti', 'Añadir a favoritos': 'Aggiungi ai preferiti',
    'No tienes contactos': 'Non hai contatti',
    'Sin resultados': 'Nessun risultato',
    'Planificador de Cruces': 'Pianificatore accoppiamenti',
    'EN VENTA': 'IN VENDITA', 'Sin conexión': 'Senza connessione',
    'Tipo': 'Tipo', 'Fecha': 'Data', 'Descripcion': 'Descrizione',
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
