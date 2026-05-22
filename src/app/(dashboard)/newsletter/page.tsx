import ComingSoon from '@/components/ui/coming-soon'

export const metadata = { title: 'Newsletter · Genealogic Pro' }

export default function NewsletterPage() {
  return (
    <ComingSoon
      title="Newsletter"
      description="Comunicación masiva controlada a tu lista de espera, suscriptores y clientes pasados. Avisos de camadas, noticias, hitos del kennel."
      features={[
        'Suscriptores con segmentación (lista de espera, clientes pasados, interesados)',
        'Editor de campañas con plantilla limpia',
        'Programación de envío',
        'Métricas: opens, clicks, bajas',
        'Anti-spam: doble opt-in obligatorio',
      ]}
    />
  )
}
