'use client'

/**
 * GoogleTranslate — apaño de traducción on-the-fly.
 *
 * La web se renderiza en español (base limpia, ver FORCE_SPANISH_ONLY en
 * lib/locale.ts). Este widget de Google Translate traduce la página al idioma
 * que el visitante elija en el LanguageSwitcher, que escribe la cookie
 * `googtrans=/es/<idioma>` y recarga; el widget la lee al cargar y traduce.
 *
 * Se monta SOLO en contextos anónimos/estáticos (home, marketing, legal) vía
 * MarketingFooter `enableTranslate`, NUNCA en el dashboard (React interactivo +
 * mutación del DOM por GT = riesgo de crash). Es temporal: cuando el i18n propio
 * esté completo, se retira y se pone FORCE_SPANISH_ONLY = false.
 */
import { useEffect } from 'react'

export default function GoogleTranslate() {
  useEffect(() => {
    if (document.getElementById('google-translate-script')) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).googleTranslateElementInit = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google
      if (g?.translate?.TranslateElement) {
        new g.translate.TranslateElement(
          { pageLanguage: 'es', autoDisplay: false },
          'google_translate_element',
        )
      }
    }
    const s = document.createElement('script')
    s.id = 'google-translate-script'
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    s.async = true
    document.body.appendChild(s)
  }, [])

  return (
    <>
      <div id="google_translate_element" aria-hidden style={{ display: 'none' }} />
      {/* Oculta el banner/marco que GT inyecta arriba y resetea el offset del body. */}
      <style
        dangerouslySetInnerHTML={{
          __html: [
            '.goog-te-banner-frame.skiptranslate{display:none!important}',
            '.goog-te-gadget-icon{display:none!important}',
            'body{top:0!important;position:static!important}',
            '#google_translate_element{display:none!important}',
            '.goog-tooltip,.goog-tooltip *{display:none!important}',
            '.goog-text-highlight{background:none!important;box-shadow:none!important}',
          ].join(''),
        }}
      />
    </>
  )
}
