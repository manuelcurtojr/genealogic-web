import ComingSoon from '@/components/ui/coming-soon'

export const metadata = { title: 'Test Emailbot · Genealogic Pro' }

export default function EmailbotTestPage() {
  return (
    <ComingSoon
      title="Test del Emailbot"
      description="Playground para probar cómo responde tu bot antes de activarlo en producción. Escribe consultas tipo y ve la respuesta que daría con tu Biblioteca actual."
      features={[
        'Chat simulado con respuestas en tiempo real',
        'Cambio de contexto: nuevo lead, cliente en lista, ya con reserva',
        'Comparativa antes/después al editar la Biblioteca',
        'Test cases guardados para regresión',
      ]}
      backHref="/emailbot"
      backLabel="Volver a Emailbot"
    />
  )
}
