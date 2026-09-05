import { H2, P, Lead, UL, LI, Strong, Callout, PostCta } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'calendario-reproductivo-celos-partos',
  title: 'Celos, montas y partos bajo control: el calendario reproductivo',
  excerpt:
    'El ciclo de una hembra no perdona. Registras el celo y la monta y Genealogic te calcula la ventana fértil, la fecha de parto y el próximo celo, con avisos.',
  date: '2026-09-05',
  category: 'Salud',
  heroImage: '/blog/calendario-reproductivo-celos-partos.jpg',
  heroAlt: 'Ilustración de un calendario reproductivo canino con las fases del ciclo',
  readMinutes: 4,
  author: { name: 'Manuel Curtó', role: 'Criador y fundador de Genealogic' },
}

export default function Post() {
  return (
    <>
      <Lead>
        En la cría, el calendario manda. Un celo que se te pasa es una monta perdida y medio año de
        espera. Llevarlo «en la cabeza» funciona con una hembra; con varias, es cuestión de tiempo
        que se te escape algo.
      </Lead>

      <H2>Registras dos cosas, el resto lo calcula Genealogic</H2>
      <P>
        Apuntas el <Strong>inicio del celo</Strong> y, si la hay, la <Strong>monta</Strong>. A partir
        de ahí la herramienta te dibuja todo el ciclo:
      </P>
      <UL>
        <LI><Strong>La ventana fértil</Strong>: los días de mayor probabilidad dentro del celo, con la ovulación estimada.</LI>
        <LI><Strong>La fecha de parto prevista</Strong>: contando la gestación desde la monta.</LI>
        <LI><Strong>Cuándo confirmar la preñez</Strong>: el momento para la ecografía.</LI>
        <LI><Strong>El próximo celo previsto</Strong>: para que planifiques con meses de antelación.</LI>
      </UL>

      <Callout kind="info" title="Basado en el ciclo real de la perra">
        Ciclo de unos 21 días (con la fase fértil hacia la mitad), gestación de 63 días y un
        intervalo típico de medio año entre celos. Genealogic aplica estos tiempos a tus fechas y te
        avisa de los partos y celos que se acercan.
      </Callout>

      <H2>Y los recordatorios veterinarios, en el mismo sitio</H2>
      <P>
        Vacunas, desparasitaciones, revisiones: los programas una vez y aparecen en tu calendario
        cuando toca. Dejas de fiarlo a la memoria y de acordarte tarde.
      </P>

      <H2>Para cualquier criador</H2>
      <P>
        El calendario reproductivo no es una función de pago: cualquier criador con sus hembras
        reproductoras en Genealogic puede llevarlo. Es, sencillamente, dejar de perseguir fechas.
      </P>

      <PostCta variant="register" />
    </>
  )
}
