import ComingSoon from '@/components/ui/coming-soon'

export const metadata = { title: 'Biblioteca · Genealogic Pro' }

export default function ConocimientoPage() {
  return (
    <ComingSoon
      title="Biblioteca"
      description="Tu base de conocimiento: precio, política de reserva, filosofía de cría, FAQ, condiciones de entrega. El Emailbot se entrena con todo esto para responder con tu tono."
      features={[
        'Editor estructurado por categorías (precio, salud, reserva, entrega)',
        'Versionado: cada cambio queda guardado',
        'Importación desde documentos existentes (PDF, Markdown)',
        'Vista previa de cómo afecta a las respuestas del bot',
      ]}
    />
  )
}
