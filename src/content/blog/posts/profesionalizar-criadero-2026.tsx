import { H2, P, Lead, Strong, PostCta } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'profesionalizar-criadero-2026',
  title: 'Del cuaderno al móvil: cómo profesionalizar tu criadero en 2026',
  excerpt:
    'Llevar el criadero de memoria y por WhatsApp tiene techo. Los pasos para profesionalizarlo: digitalizar la línea, centralizar la gestión y cuidar tu escaparate.',
  date: '2026-09-05',
  category: 'Plataforma',
  heroImage:
    '/blog/profesionalizar-criadero-2026.jpg',
  heroAlt: 'Un cuaderno de criadero junto a un móvil con la gestión digitalizada',
  readMinutes: 4,
  author: { name: 'Manuel Curtó', role: 'Criador y fundador de Genealogic' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Se puede criar muy bien con un cuaderno, una memoria de elefante y el grupo de WhatsApp.
        Durante un tiempo.
      </Lead>
      <P>
        El problema llega cuando creces: se te olvidan fechas, pierdes el hilo de quién reservó qué,
        la genealogía la tienes «más o menos» en la cabeza y, cuando un comprador serio pide papeles,
        vas corriendo. Profesionalizar no es complicarse: es dejar de depender de la memoria y la
        improvisación. Aquí van los tres pasos que marcan la diferencia.
      </P>

      <H2>1. Digitaliza tu línea</H2>
      <P>
        Tu activo más valioso es la genealogía de tus perros, y no puede vivir solo en tu cabeza o en
        fotos sueltas. Pásala a un sitio donde esté ordenada, con ascendencia, fotos y datos de cada
        ejemplar. Te sirve para criar mejor (ves de dónde vienes) y para vender (lo enseñas). El día
        que quieras ordenar el criadero —o dejárselo a alguien— lo agradecerás.
      </P>

      <H2>2. Centraliza la gestión</H2>
      <P>
        Camadas, reservas, señales, contratos, cobros: si cada cosa está en un sitio distinto —o en
        ninguno—, se te escapa dinero y tiempo. Tenerlo todo en <Strong>un solo lugar</Strong>, con
        su estado y sus fechas, es la diferencia entre ir apagando fuegos y llevar el criadero como
        un negocio. Porque es un negocio.
      </P>

      <H2>3. Cuida tu escaparate</H2>
      <P>
        Hoy el comprador te busca en internet antes de escribirte. Si al buscar tu criadero no
        aparece nada, o aparece desordenado, has perdido puntos antes de empezar. Una presencia
        cuidada —tus perros visibles, tus genealogías accesibles— trabaja por ti mientras duermes, y
        te posiciona en Google para quien busca la raza.
      </P>

      <H2>Todo esto, sin montar una empresa de tecnología</H2>
      <P>
        La pega de siempre: «eso está muy bien, pero yo no tengo tiempo ni idea de informática».
        Justo por eso existe Genealogic. Reúne las tres cosas en un sitio pensado para criadores: tus
        perros y <Strong>genealogías verificables</Strong>, la gestión de camadas y reservas, los
        contratos y los cobros, y una ficha pública de tu criadero que te posiciona en Google. Del
        cuaderno al móvil, sin curva de aprendizaje.
      </P>
      <P>
        Es, sin más, lo que usamos para llevar nuestros propios criaderos. Y la diferencia con los
        tiempos del cuaderno no tiene color.
      </P>

      <PostCta variant="pro" />
    </>
  )
}
