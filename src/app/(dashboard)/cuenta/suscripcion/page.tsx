import ComingSoon from '@/components/ui/coming-soon'

export const metadata = { title: 'Suscripción · Genealogic Pro' }

export default function SuscripcionPage() {
  return (
    <ComingSoon
      title="Suscripción"
      description="Gestión de tu plan Pro: pago, ciclo de facturación, upgrade a Premium, métricas de uso del tier."
      features={[
        'Plan actual y próximo cargo',
        'Cambio mensual ↔ anual (anual con 2 meses gratis)',
        'Upgrade a Premium (multi-kennel + API + verificaciones)',
        'Pausa de la suscripción',
        'Historial de cambios de plan',
      ]}
    />
  )
}
