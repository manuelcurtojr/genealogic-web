import { H2, P, Lead, UL, LI, Strong, Callout, PostCta } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'vender-cachorros-con-confianza',
  title: 'Cómo vender cachorros con más confianza: la ficha que cierra la venta',
  excerpt:
    'La confianza es lo que vende un cachorro. Así una ficha completa y verificable —de cualquier raza— convierte las dudas del comprador en una venta.',
  date: '2026-09-05',
  category: 'Para criadores',
  heroImage:
    '/blog/vender-cachorros-con-confianza.jpg',
  heroAlt: 'Un criador enseña la ficha de un cachorro a un comprador en el móvil',
  readMinutes: 4,
  author: { name: 'Manuel Curtó', role: 'Criador y fundador de Genealogic' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Cualquiera que lleve años criando lo sabe: el comprador serio no pregunta primero por el
        precio. Pregunta por la confianza.
      </Lead>
      <P>
        ¿Es el perro lo que dices que es? ¿De dónde viene? ¿Está sano? En cualquier raza con
        demanda circulan camadas sin papeles, orígenes inflados y vendedores de humo, así que la
        desconfianza del comprador es la norma, no la excepción. Y esa desconfianza es lo que te
        tumba ventas.
      </P>
      <P>
        Da igual que críes Presa Canario, Galgo Italiano, Cocker Spaniel o la raza que sea: la
        confianza no se promete, se demuestra. Y se demuestra con una cosa muy concreta —
        <Strong>una ficha completa del cachorro y de su línea</Strong>— antes incluso de que el
        comprador la pida.
      </P>

      <H2>Qué convierte una duda en una venta</H2>
      <P>
        Cuando alguien está a punto de gastarse lo que cuesta un buen cachorro, necesita pruebas,
        no palabras. Una ficha que cierra ventas tiene esto:
      </P>
      <UL>
        <LI>
          <Strong>La genealogía, hasta donde puedas.</Strong> No un nombre suelto, sino la
          ascendencia real: padres, abuelos, bisabuelos. Cuanto más atrás y más verificable, más
          tranquilo se queda el comprador.
        </LI>
        <LI>
          <Strong>Fotos de los progenitores.</Strong> Que vea de dónde sale su cachorro. Un padre y
          una madre con buena expresión valen más que mil adjetivos.
        </LI>
        <LI>
          <Strong>Datos de salud.</Strong> Las pruebas que apliquen a tu raza, si las tienes. Aquí
          la transparencia es oro.
        </LI>
        <LI>
          <Strong>Datos objetivos del ejemplar.</Strong> Fecha de nacimiento, chip,
          características. Nada de ambigüedades.
        </LI>
      </UL>

      <H2>El truco: enséñala antes de que te la pidan</H2>
      <P>
        La mayoría de criadores esperan a que el comprador desconfíe para empezar a justificar.
        Dale la vuelta: <Strong>manda la ficha completa de entrada</Strong>, en un enlace, el mismo
        día que alguien se interesa. El mensaje que transmites no es «cómprame», es «no tengo nada
        que esconder». Eso, en cualquier raza, es una ventaja competitiva enorme.
      </P>
      <Callout kind="tip" title="Efecto secundario">
        El comprador que recibe una ficha seria la comparte con su familia, con el amigo que sabe
        de perros, con quien tenga que convencer. Estás vendiendo por él.
      </Callout>

      <H2>Cómo lo hace fácil Genealogic</H2>
      <P>
        Montar esa ficha a mano —buscar la genealogía, las fotos, ordenarlo todo— es un trabajo que
        pocos hacen porque lleva tiempo. En Genealogic la ficha de cada perro ya está construida: su{' '}
        <Strong>genealogía verificable</Strong>, sus fotos, su ascendencia y sus datos, en una
        página que compartes con un enlace en un momento. El comprador la abre desde el móvil y ve
        exactamente de dónde viene el animal.
      </P>
      <P>
        Es, literalmente, lo que usamos en nuestros propios criaderos. La conversación deja de ser
        «confía en mí» y pasa a ser «míralo tú mismo». Y ahí las ventas se cierran solas.
      </P>

      <PostCta variant="register" />
    </>
  )
}
