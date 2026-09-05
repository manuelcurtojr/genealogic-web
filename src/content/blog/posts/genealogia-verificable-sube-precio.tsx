import { H2, P, Lead, Strong, PostCta } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'genealogia-verificable-sube-precio',
  title: 'Por qué una genealogía verificable sube el precio de tus cachorros',
  excerpt:
    'En un mercado lleno de dudas, lo que se puede comprobar vale más. Así una genealogía verificable diferencia tu criadero y justifica un precio más alto, en cualquier raza.',
  date: '2026-09-05',
  category: 'Para criadores',
  heroImage:
    '/blog/genealogia-verificable-sube-precio.jpg',
  heroAlt: 'Una genealogía verificable mostrada en un móvil junto a un cachorro',
  readMinutes: 4,
  author: { name: 'Manuel Curtó', role: 'Criador y fundador de Genealogic' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Dos cachorros de la misma raza, misma edad, aspecto parecido. Uno se vende por X; el otro,
        por bastante más. ¿La diferencia? Muchas veces no está en el perro, está en lo que el criador
        puede demostrar de él.
      </Lead>
      <P>
        En un mercado donde abunda el «dime que es de raza y ya», lo verificable se convierte en el
        argumento de venta más fuerte que tienes. Y sí, se paga.
      </P>

      <H2>Confianza = precio</H2>
      <P>
        El comprador no paga por un cachorro, paga por la <Strong>tranquilidad</Strong> de saber qué
        se lleva. Cuando puedes enseñar la ascendencia real, las pruebas de salud y la trayectoria de
        la línea —y que cualquiera lo compruebe—, desaparece el regateo del «¿y cómo sé yo que…?». Le
        estás quitando el riesgo de encima, y por quitarle riesgo, paga más a gusto.
      </P>

      <H2>Te diferencia del criador de al lado</H2>
      <P>
        La mayoría vende con fotos bonitas y una historia. Tú puedes vender con{' '}
        <Strong>datos comprobables</Strong>. Esa es una línea que separa al criador serio del que
        improvisa, y el comprador que busca calidad la ve enseguida. No compites en precio hacia
        abajo; compites en confianza hacia arriba.
      </P>
      <P>
        Y vale igual críes lo que críes: en una raza popular con mucha competencia te separa del
        criador de garaje; en una minoritaria, justifica por qué tu línea es la que merece la pena.
      </P>

      <H2>Atrae al comprador que quieres</H2>
      <P>
        Bajar el listón de la transparencia atrae a quien solo mira el precio. Subirlo atrae a quien
        valora la cría bien hecha —el que cuida al perro, el que quizá vuelve a por otro, el que te
        recomienda—. La genealogía verificable es un filtro que te trae mejores clientes.
      </P>

      <H2>Hazla pública y comprobable</H2>
      <P>
        De poco sirve tener la mejor línea del mundo si vive en una carpeta en tu casa. El valor
        aparece cuando es accesible y verificable: una ficha que el comprador abre, mira y contrasta.
        Eso es exactamente lo que hace Genealogic: convierte la línea de tu criadero en{' '}
        <Strong>genealogías verificables</Strong> y públicas, con fotos y ascendencia, que compartes
        en un enlace. Dejas de «contar» tu trabajo de años y pasas a <Strong>demostrarlo</Strong>. Y
        lo que se demuestra, se paga mejor.
      </P>

      <PostCta variant="register" />
    </>
  )
}
