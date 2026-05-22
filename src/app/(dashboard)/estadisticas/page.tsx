import ComingSoon from '@/components/ui/coming-soon'

export const metadata = { title: 'Estadísticas · Genealogic Pro' }

export default function EstadisticasPage() {
  return (
    <ComingSoon
      title="Estadísticas"
      description="Métricas reales del impacto de tu perfil público y tu mini-sitio: visitas, origen, conversión a inquiries, conversión a reserva."
      features={[
        'Pageviews por página y por perro',
        'Origen del tráfico (orgánico Google, redes, directo, referrals)',
        'Conversión visita → inquiry → reserva',
        'Top perros más visitados / más solicitados',
        'Comparativa mes a mes',
      ]}
    />
  )
}
