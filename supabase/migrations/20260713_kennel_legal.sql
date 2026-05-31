-- ─────────────────────────────────────────────────────────────────────────
-- Sistema legal de las webs de criadero (compliance bajo dominio propio)
-- ─────────────────────────────────────────────────────────────────────────
-- Cuando la web del criadero se sirve bajo su dominio propio (iremacurto.com)
-- sin chrome de Genealogic, necesita SUS PROPIOS documentos legales:
-- aviso legal (LSSI), política de privacidad (RGPD), cookies y términos.
--
-- Modelo RGPD: el CRIADERO es el responsable del tratamiento de los datos de
-- sus visitantes (formulario de contacto, newsletter); Genealogic (Manuel
-- Curtó SL) es el ENCARGADO del tratamiento / proveedor de la plataforma.
--
-- Arquitectura: plantillas GLOBALES por defecto (kennel_id NULL, editables
-- por super-admin) + OVERRIDES por criadero (kennel_id = X). El resolver coge
-- el override si existe, si no la global. Los textos llevan placeholders
-- {{...}} que se rellenan en runtime con los datos del criadero.

-- 1) Datos legales del criadero — alimentan los placeholders dinámicos.
--    Si están vacíos, el resolver usa fallbacks (nombre comercial, ubicación,
--    email del owner) y marca con [corchetes] lo que falta por completar.
ALTER TABLE kennels ADD COLUMN IF NOT EXISTS legal_name text;
ALTER TABLE kennels ADD COLUMN IF NOT EXISTS legal_id text;
ALTER TABLE kennels ADD COLUMN IF NOT EXISTS legal_address text;
ALTER TABLE kennels ADD COLUMN IF NOT EXISTS legal_email text;

COMMENT ON COLUMN kennels.legal_name IS 'Razón social / titular legal del criadero (para aviso legal LSSI art.10). Fallback: name.';
COMMENT ON COLUMN kennels.legal_id IS 'NIF / CIF / DNI del titular del criadero.';
COMMENT ON COLUMN kennels.legal_address IS 'Domicilio legal del criadero (LSSI art.10). Fallback: city + country.';
COMMENT ON COLUMN kennels.legal_email IS 'Email de contacto legal del criadero (RGPD/derechos). Fallback: email del owner.';

-- 2) Documentos legales: globales (kennel_id NULL) + overrides (kennel_id X).
CREATE TABLE IF NOT EXISTS kennel_legal_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL = plantilla GLOBAL por defecto; UUID = OVERRIDE de ese criadero.
  kennel_id uuid REFERENCES kennels(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('aviso_legal','privacidad','cookies','terminos')),
  title text NOT NULL,
  body_md text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Una sola plantilla GLOBAL por tipo (índice parcial: kennel_id IS NULL).
CREATE UNIQUE INDEX IF NOT EXISTS kennel_legal_docs_global_uniq
  ON kennel_legal_docs (doc_type) WHERE kennel_id IS NULL;
-- Un solo OVERRIDE por (criadero, tipo).
CREATE UNIQUE INDEX IF NOT EXISTS kennel_legal_docs_kennel_uniq
  ON kennel_legal_docs (kennel_id, doc_type) WHERE kennel_id IS NOT NULL;

-- RLS: SELECT público (los documentos legales son públicos por definición).
-- Las escrituras van por server actions con service_role, que verifican
-- super-admin (globales) u owner del kennel (overrides). Sin policies de
-- escritura → ningún cliente anónimo/autenticado puede INSERT/UPDATE/DELETE.
ALTER TABLE kennel_legal_docs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'kennel_legal_docs' AND policyname = 'legal_docs_select_public'
  ) THEN
    CREATE POLICY legal_docs_select_public ON kennel_legal_docs
      FOR SELECT USING (true);
  END IF;

  -- Super-admin gestiona las plantillas GLOBALES (kennel_id IS NULL).
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'kennel_legal_docs' AND policyname = 'legal_docs_admin_global'
  ) THEN
    CREATE POLICY legal_docs_admin_global ON kennel_legal_docs
      FOR ALL
      USING (
        kennel_id IS NULL
        AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
      WITH CHECK (
        kennel_id IS NULL
        AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;

  -- El owner del criadero gestiona SUS overrides (kennel_id = su kennel).
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'kennel_legal_docs' AND policyname = 'legal_docs_owner_override'
  ) THEN
    CREATE POLICY legal_docs_owner_override ON kennel_legal_docs
      FOR ALL
      USING (
        kennel_id IS NOT NULL
        AND EXISTS (SELECT 1 FROM kennels k WHERE k.id = kennel_legal_docs.kennel_id AND k.owner_id = auth.uid())
      )
      WITH CHECK (
        kennel_id IS NOT NULL
        AND EXISTS (SELECT 1 FROM kennels k WHERE k.id = kennel_legal_docs.kennel_id AND k.owner_id = auth.uid())
      );
  END IF;
END $$;

-- 3) Seed de las 4 plantillas GLOBALES por defecto (idempotente).
--    Placeholders disponibles (resueltos en runtime por src/lib/kennel/legal.ts):
--      {{kennel_name}} {{kennel_legal_name}} {{kennel_legal_id}}
--      {{kennel_legal_address}} {{kennel_legal_email}} {{kennel_location}}
--      {{site_domain}} {{platform}} {{platform_legal}} {{platform_email}} {{date}}
INSERT INTO kennel_legal_docs (kennel_id, doc_type, title, body_md)
SELECT NULL, v.doc_type, v.title, v.body_md
FROM (VALUES
  (
    'aviso_legal',
    'Aviso legal',
    E'## 1. Titular del sitio web\n\nEn cumplimiento del artículo 10 de la Ley 34/2002 de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de que el titular de este sitio web es:\n\n- **Titular:** {{kennel_legal_name}}\n- **NIF/CIF:** {{kennel_legal_id}}\n- **Domicilio:** {{kennel_legal_address}}\n- **Email de contacto:** {{kennel_legal_email}}\n- **Sitio web:** {{site_domain}}\n\n## 2. Objeto\n\nEste sitio web tiene por objeto dar a conocer la actividad de cría de {{kennel_name}}, mostrar sus ejemplares y facilitar el contacto con personas interesadas. La navegación por el sitio atribuye la condición de usuario e implica la aceptación de las condiciones recogidas en este Aviso Legal.\n\n## 3. Plataforma tecnológica\n\nEste sitio web está creado y alojado sobre la plataforma **{{platform}}**, titularidad de {{platform_legal}}, que actúa como proveedor del servicio y encargado del tratamiento de los datos por cuenta del titular del sitio. Más información en {{platform_email}}.\n\n## 4. Propiedad intelectual\n\nLos contenidos de este sitio (textos, fotografías, logotipos, genealogías y demás material) son titularidad de {{kennel_name}} o de {{platform_legal}}, y están protegidos por la normativa de propiedad intelectual. Queda prohibida su reproducción, distribución o transformación sin autorización expresa.\n\n## 5. Responsabilidad\n\nEl titular no se hace responsable del mal uso que se realice de los contenidos del sitio, siendo responsabilidad exclusiva de la persona que accede a ellos o los utiliza.\n\n## 6. Legislación aplicable\n\nEste Aviso Legal se rige por la legislación española. Para la resolución de cualquier controversia, las partes se someten a los juzgados y tribunales del domicilio del titular.\n\n_Última actualización: {{date}}._'
  ),
  (
    'privacidad',
    'Política de privacidad',
    E'## 1. Responsable del tratamiento\n\nEl responsable del tratamiento de los datos personales recogidos en este sitio web es:\n\n- **Responsable:** {{kennel_legal_name}}\n- **NIF/CIF:** {{kennel_legal_id}}\n- **Domicilio:** {{kennel_legal_address}}\n- **Email:** {{kennel_legal_email}}\n\n## 2. Encargado del tratamiento\n\nEste sitio funciona sobre la plataforma **{{platform}}** ({{platform_legal}}), que presta el servicio de alojamiento y gestión de la web actuando como encargado del tratamiento por cuenta del responsable, conforme al artículo 28 del RGPD.\n\n## 3. ¿Qué datos tratamos y con qué finalidad?\n\nTratamos los datos que nos facilitas voluntariamente a través del formulario de contacto o de la suscripción a la newsletter:\n\n- **Formulario de contacto:** nombre, email, teléfono y el mensaje o preferencias que nos indiques, con la finalidad de atender tu solicitud de información sobre nuestros ejemplares.\n- **Newsletter:** tu email, con la finalidad de enviarte novedades, próximas camadas y eventos. Puedes darte de baja en cualquier momento.\n\n## 4. Base legal\n\nLa base legal es tu **consentimiento**, que prestas al enviar el formulario o suscribirte, y el **interés legítimo** del responsable en atender tus solicitudes.\n\n## 5. ¿Cuánto tiempo conservamos tus datos?\n\nConservamos tus datos durante el tiempo necesario para atender tu solicitud y, posteriormente, durante los plazos legalmente exigibles. En el caso de la newsletter, hasta que solicites la baja.\n\n## 6. Destinatarios\n\nTus datos se alojan en la infraestructura de la plataforma {{platform}} y sus proveedores tecnológicos (alojamiento y envío de email), con los que existen los correspondientes contratos de encargo de tratamiento. No se ceden datos a terceros salvo obligación legal.\n\n## 7. Tus derechos\n\nPuedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a **{{kennel_legal_email}}**. También puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).\n\n_Última actualización: {{date}}._'
  ),
  (
    'cookies',
    'Política de cookies',
    E'## 1. ¿Qué es una cookie?\n\nUna cookie es un pequeño archivo de texto que un sitio web guarda en tu navegador para que el sitio funcione o funcione mejor.\n\n## 2. ¿Qué cookies usa este sitio?\n\nEste sitio, creado sobre la plataforma **{{platform}}**, utiliza **únicamente cookies técnicas necesarias** para su funcionamiento:\n\n- **Sesión y seguridad:** mantener la navegación y proteger frente a usos fraudulentos.\n- **Preferencias:** recordar ajustes básicos como el aviso de cookies ya aceptado.\n- **Analítica propia agregada:** medición de visitas sin identificarte personalmente ni compartir datos con terceros.\n\n**No utilizamos cookies de publicidad ni de analítica de terceros** (Google Analytics, píxeles de redes sociales, etc.).\n\n## 3. Base legal\n\nAl tratarse exclusivamente de cookies técnicas estrictamente necesarias, conforme al artículo 22.2 de la LSSI y a la guía de la AEPD, su uso no requiere consentimiento previo; basta con informarte, como hacemos en este documento y en el aviso inicial.\n\n## 4. Cómo gestionarlas\n\nPuedes bloquear o eliminar las cookies desde la configuración de tu navegador. Ten en cuenta que desactivar las cookies técnicas puede afectar al funcionamiento del sitio.\n\n## 5. Responsable\n\nResponsable del sitio: {{kennel_legal_name}} ({{kennel_legal_email}}). Plataforma: {{platform}} — {{platform_legal}}.\n\n_Última actualización: {{date}}._'
  ),
  (
    'terminos',
    'Términos y condiciones',
    E'## 1. Aceptación\n\nEl acceso y uso de este sitio web ({{site_domain}}), titularidad de {{kennel_name}}, implica la aceptación de los presentes Términos y Condiciones. Si no estás de acuerdo, te rogamos que no utilices el sitio.\n\n## 2. Uso del sitio\n\nTe comprometes a hacer un uso lícito del sitio y a no emplearlo para fines contrarios a la ley, la moral o el orden público. La información sobre ejemplares, camadas y disponibilidad es orientativa y puede cambiar sin previo aviso.\n\n## 3. Información sobre los animales\n\nLa información publicada sobre los perros (genealogías, características, disponibilidad y precios) tiene carácter informativo. Cualquier reserva, compraventa o entrega se formalizará mediante el contrato específico que acuerden las partes, ajeno a este sitio web.\n\n## 4. Contacto y solicitudes\n\nLos formularios de contacto sirven para solicitar información. El envío de un formulario no constituye reserva ni obligación de compra, ni genera derecho alguno sobre un ejemplar concreto.\n\n## 5. Propiedad intelectual\n\nLos contenidos del sitio están protegidos. No está permitida su reproducción sin autorización de {{kennel_name}} o de {{platform_legal}}, titular de la plataforma.\n\n## 6. Limitación de responsabilidad\n\n{{kennel_name}} no garantiza la disponibilidad permanente del sitio ni se responsabiliza de los daños derivados de su uso, de errores en los contenidos o de interrupciones del servicio prestado por la plataforma {{platform}}.\n\n## 7. Legislación y jurisdicción\n\nEstos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales del domicilio del titular del sitio.\n\n_Última actualización: {{date}}._'
  )
) AS v(doc_type, title, body_md)
WHERE NOT EXISTS (
  SELECT 1 FROM kennel_legal_docs k
  WHERE k.kennel_id IS NULL AND k.doc_type = v.doc_type
);
