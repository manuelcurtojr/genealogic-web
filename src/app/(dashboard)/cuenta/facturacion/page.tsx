import ComingSoon from '@/components/ui/coming-soon'

export const metadata = { title: 'Facturación · Genealogic Pro' }

export default function FacturacionPage() {
  return (
    <ComingSoon
      title="Facturación"
      description="Facturas, recibos, método de pago y datos fiscales del kennel. Todo descargable en PDF para tu contabilidad."
      features={[
        'Historial de facturas con descarga PDF',
        'Cambio de método de pago (Stripe)',
        'Datos fiscales del criadero',
        'Recibos de verificaciones oficiales pagadas',
        'Resumen anual exportable',
      ]}
    />
  )
}
