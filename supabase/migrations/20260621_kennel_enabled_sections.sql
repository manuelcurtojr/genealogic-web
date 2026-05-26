-- ═══════════════════════════════════════════════════════════════════════════
-- kennels.enabled_sections — qué secciones del perfil público están activas
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Concepto: el perfil público (/kennels/[slug]) es modular. Cada sección
-- (awards, blog, galería, faq, instalaciones…) puede activarse o desactivarse
-- por el criador desde su panel. Las "siempre visibles" (hero, sobre el
-- criadero, nuestros perros, contacto) NO viven aquí — siempre se muestran.
--
-- Las claves usadas hoy:
--   awards        → muestra logros de los perros del criadero (tabla awards)
--   gallery       → galería general (futuro: tabla kennel_photos)
--   facilities    → instalaciones (futuro: tabla kennel_photos)
--   blog          → últimos posts (tabla kennel_posts existente)
--   faq           → preguntas frecuentes (tabla knowledge_entries existente)
--
-- Default vacío = ninguna sección extra activa. La función `effective_enabled_sections`
-- en el código aplica auto-enable a "awards" si el criadero tiene awards públicos.
--
-- Para Irema (enterprise/founder): backfill activa TODAS las secciones para que
-- su perfil parezca una web real desde el primer minuto.
--
-- Gate de Kennel Pro: el toggle visible en el panel solo es accionable si el
-- user está en kennel_pro (o es enterprise). La capa de acceso vive en el
-- código, no en DB — facilita futuras pruebas/migraciones.

ALTER TABLE public.kennels
  ADD COLUMN IF NOT EXISTS enabled_sections jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.kennels.enabled_sections IS
  'Map de secciones activas en el perfil público. Ej: {"awards":true,"blog":false}. Las secciones base (hero/about/dogs/contact) NO viven aquí.';

-- Backfill Irema (kennel del fundador, enterprise) con todas las secciones on
-- para tener inmediatamente el "feel" de web completa.
UPDATE public.kennels
SET enabled_sections = jsonb_build_object(
  'awards',     true,
  'gallery',    true,
  'facilities', true,
  'blog',       true,
  'faq',        true
)
WHERE id = '9675883f-f47e-4c51-bd5d-7fc2c6242963';
