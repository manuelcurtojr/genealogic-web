/**
 * Interpolación de plantillas de contrato — versión CLIENT-SAFE.
 *
 * `render.ts` es server-only porque hace lookups a BBDD. Para el preview en
 * vivo del lado cliente solo necesitamos la sustitución de `{{tokens}}`,
 * que es lógica pura. La sacamos aquí para que el componente
 * `ContractLivePreview` pueda usarla sin tirar del bundle servidor.
 *
 * Reglas:
 *   - `{{var}}` → vars[var] si está, string vacío si no
 *   - `{{ var }}` con espacios → tolerado
 *   - Tokens desconocidos → string vacío (NO los dejamos visibles como
 *     "{{foo}}" porque eso quedaría feo en el preview)
 *   - Para que el criador vea visualmente qué falta, llamar primero a
 *     `markEmptyAsBlanks(values)` que reemplaza undefined por BLANK_TOKEN.
 */

/** Marca visual de "campo sin rellenar" — igual que en las plantillas hardcoded. */
export const BLANK_TOKEN = '__________________'

/**
 * Filtra bloques condicionales `<!-- IF token -->...<!-- /IF -->` y
 * `<!-- IF_NOT token -->...<!-- /IF_NOT -->` según los valores actuales.
 *
 * Un valor "presente" es uno no nulo, no vacío, no solo espacios. Si el
 * token está vacío:
 *   - IF token       → bloque ELIMINADO
 *   - IF_NOT token   → bloque CONSERVADO (y los markers se quitan)
 * Si está rellenado, lo contrario.
 *
 * Se procesa ANTES de interpolar los {{tokens}} — así los tokens que solo
 * existen dentro de un bloque eliminado no llegan al interpolador.
 *
 * Soporta solo un nivel (no anidados). Múltiples bloques con el mismo
 * token funcionan.
 */
export function stripConditionalBlocks(
  body: string,
  vars: Record<string, string | undefined | null>,
): string {
  const isPresent = (token: string): boolean => {
    const v = vars[token]
    if (v == null) return false
    return String(v).trim() !== ''
  }
  // IF block
  let out = body.replace(
    /<!--\s*IF\s+([a-zA-Z0-9_]+)\s*-->([\s\S]*?)<!--\s*\/IF\s*-->/g,
    (_m, token: string, content: string) => (isPresent(token) ? content : ''),
  )
  // IF_NOT block
  out = out.replace(
    /<!--\s*IF_NOT\s+([a-zA-Z0-9_]+)\s*-->([\s\S]*?)<!--\s*\/IF_NOT\s*-->/g,
    (_m, token: string, content: string) => (isPresent(token) ? '' : content),
  )
  // Colapsar líneas vacías múltiples que queden tras quitar bloques
  return out.replace(/\n{3,}/g, '\n\n')
}

/**
 * Sustituye {{tokens}} por sus valores. Tokens sin valor → string vacío.
 *
 * Primero filtra bloques condicionales `<!-- IF/IF_NOT -->`, luego interpola
 * los tokens restantes. Así un token que solo aparece dentro de un bloque
 * descartado no aparece en el output.
 */
export function interpolateTemplate(
  body: string,
  vars: Record<string, string | undefined | null>,
): string {
  const stripped = stripConditionalBlocks(body, vars)
  return stripped.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const val = vars[key]
    return val == null ? '' : String(val)
  })
}

/**
 * Igual que interpolateTemplate pero los tokens sin valor se rellenan con
 * BLANK_TOKEN (`__________________`). Útil para el preview: el criador ve
 * dónde están los huecos por rellenar.
 */
export function interpolateTemplateWithBlanks(
  body: string,
  vars: Record<string, string | undefined | null>,
): string {
  const stripped = stripConditionalBlocks(body, vars)
  return stripped.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const val = vars[key]
    if (val == null || (typeof val === 'string' && val.trim() === '')) return BLANK_TOKEN
    return String(val)
  })
}

/**
 * Extrae el set de tokens `{{xxx}}` usados en un cuerpo de plantilla. Sirve
 * para que el formulario detecte automáticamente campos extra que el criador
 * añadió a su plantilla (variables custom no estándar).
 */
export function extractTokens(body: string): string[] {
  const set = new Set<string>()
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    set.add(m[1])
  }
  return Array.from(set)
}
