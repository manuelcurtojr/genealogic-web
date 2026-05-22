// Re-export del dispatcher de secciones para que pueda usarse desde otras
// rutas (ej. /admin/web-preview) sin tener que importar el archivo entero
// de PageRenderer.
export { renderSection as renderSectionByType } from './PageRenderer';
