import ComingSoon from '@/components/ui/coming-soon'

export const metadata = { title: 'Hilos reales · Genealogic Pro' }

export default function EmailbotHilosPage() {
  return (
    <ComingSoon
      title="Hilos reales"
      description="Historial de conversaciones que el Emailbot ha mantenido con familias interesadas, ordenado por estado y fecha. Útil para auditar respuestas y mejorar la Biblioteca."
      features={[
        'Listado completo de hilos por estado (activo, derivado, cerrado)',
        'Vista detallada de cada conversación con timeline',
        'Marcado de respuestas problemáticas para revisión',
        'Exportar a CSV',
      ]}
      backHref="/emailbot"
      backLabel="Volver a Emailbot"
    />
  )
}
