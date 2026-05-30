-- ═══════════════════════════════════════════════════════════════════════════
-- breeds.promotional_content — contenido marketing por raza
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Distinto de:
--   · description           → meta tag SEO (1 frase, 150-180c)
--   · genealogic_standard   → ficha técnica del estándar (público en /razas)
--   · standard_data         → datos estructurados FCI/AKC
--
-- Este campo guarda el contenido PROMOCIONAL/MARKETING que aparece en las
-- webs Pro de los criaderos cuando crían esa raza. Tono cálido pero técnico
-- (no cursi). Estructura:
--   {
--     tagline:        '1 frase emocional pero precisa',
--     intro:          '2-3 párrafos de seducción con base real',
--     virtues:        [{ title, body }, ...] (3-5 cualidades distintivas),
--     temperament:    'descripción de carácter, sin tópicos',
--     ideal_for:      'a qué tipo de persona/hogar le pega',
--     daily_life:     'cómo es vivir con un ejemplar',
--     considerations: 'lo honesto que hay que saber antes',
--     closing:        'frase de cierre que invita a contactar al criador'
--   }
--
-- Nullable: si null, la raza no se muestra como "Nuestra raza" en el menú
-- del kennel aunque tenga reproductores de ella.

ALTER TABLE breeds
  ADD COLUMN IF NOT EXISTS promotional_content jsonb;

COMMENT ON COLUMN breeds.promotional_content IS
  'Contenido promocional para webs Pro de criaderos. Distinto de genealogic_standard (técnico) y description (SEO meta).';
