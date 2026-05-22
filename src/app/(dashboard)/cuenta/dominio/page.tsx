import ComingSoon from '@/components/ui/coming-soon'

export const metadata = { title: 'Dominio · Genealogic Pro' }

export default function DominioPage() {
  return (
    <ComingSoon
      title="Dominio personalizado"
      description="Conecta tu dominio propio a tu perfil de criador. Pasa de irema.genealogic.io a iremacurto.com en cinco minutos."
      features={[
        'Wizard guiado de conexión de dominio',
        'Verificación DNS automática',
        'Certificado SSL gestionado',
        'Soporte de subdominios (www, perros.midominio.com)',
        'Redirección 301 desde el subdominio Genealogic',
      ]}
    />
  )
}
