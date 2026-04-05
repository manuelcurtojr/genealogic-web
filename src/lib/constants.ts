export const BRAND = {
  name: 'Genealogic',
  primary: '#D74709',
  primaryHover: '#c03d07',
  primaryLight: '#f8e8e0',
  male: '#017DFA',
  female: '#e84393',
  success: '#27ae60',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#3498db',
} as const

export const ROLES = {
  FREE: 'free',
  PRO: 'pro',
  ADMIN: 'admin',
} as const

export const NAV_ITEMS = [
  { label: 'Mis Perros', href: '/dogs', icon: 'Dog' },
  { label: 'Camadas', href: '/litters', icon: 'Baby' },
  { label: 'Calendario', href: '/calendar', icon: 'Calendar' },
  { label: 'Importar', href: '/import', icon: 'FileInput' },
  { label: 'Favoritos', href: '/favorites', icon: 'Heart' },
] as const

export const PRO_NAV_ITEMS = [
  { label: 'Contactos', href: '/crm/contacts', icon: 'Users' },
  { label: 'Negocios', href: '/crm/deals', icon: 'HandCoins' },
] as const
