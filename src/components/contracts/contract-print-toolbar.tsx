'use client'
/**
 * Barra superior de la vista de impresión: auto-abre el diálogo de impresión
 * y permite re-lanzarlo. Se oculta al imprimir (data-noprint + @media print).
 * Recibe labels ya traducidos por props (no depende del LocaleProvider, porque
 * la ruta /contrato-print vive fuera del layout del dashboard).
 */
import { useEffect } from 'react'

export function ContractPrintToolbar({ saveLabel }: { saveLabel: string }) {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 500)
    return () => clearTimeout(id)
  }, [])
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: '@media print { [data-noprint] { display: none !important; } }',
        }}
      />
      <div
        data-noprint
        style={{
          position: 'sticky',
          top: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '12px 16px',
          background: '#fafafa',
          borderBottom: '1px solid #eee',
        }}
      >
        <button
          onClick={() => window.print()}
          style={{
            background: '#D74709',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 20px',
            minHeight: 44,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {saveLabel}
        </button>
      </div>
    </>
  )
}
