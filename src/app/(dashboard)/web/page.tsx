import ComingSoon from '@/components/ui/coming-soon'

export const metadata = { title: 'Web pública · Genealogic Pro' }

export default function WebPage() {
  return (
    <ComingSoon
      title="Web pública"
      description="Convierte tu perfil de criador en un sitio web en condiciones, con custom domain. Páginas pre-hechas (home, perros, historia, instalaciones, blog, contacto) que editas como un documento."
      features={[
        'Editor WYSIWYG con bloques pre-hechos',
        'Plantillas curadas (no Wix — barras estrechas, marca cuidada)',
        'Custom domain (manuelcurtokennel.com → tu perfil)',
        'SEO automático con schema.org Animal y Person',
        'Páginas: home, perros, historia, instalaciones, blog, contacto, raza',
      ]}
    />
  )
}
