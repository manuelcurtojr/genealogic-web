import ComingSoon from '@/components/ui/coming-soon'

export const metadata = { title: 'Emailbot · Genealogic Pro' }

export default function EmailbotPage() {
  return (
    <ComingSoon
      title="Emailbot"
      description="Tu chat AI respondiendo automáticamente las consultas de familias interesadas en cachorros. Aprende del estilo de tus respuestas, conoce tu lista de espera y deriva a humano cuando hace falta."
      features={[
        'Respuestas automáticas a consultas frecuentes (precio, disponibilidad, líneas)',
        'Toma datos del interesado y los añade a la lista de espera',
        'Tono y vocabulario aprendido de tu Biblioteca',
        'Derivación a ti cuando la conversación cambia de fase',
        'Métricas de respuestas, conversión a reserva, satisfacción',
      ]}
    />
  )
}
