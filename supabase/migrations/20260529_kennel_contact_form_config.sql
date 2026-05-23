-- Constructor de formulario de contacto configurable por criador.
-- El criador edita los campos en /kennel → "Formulario de contacto" y la
-- config se usa tanto en /kennels/[slug] (perfil estándar) como en
-- /c/[slug] (web custom). Mismo motor de envío en ambos sitios.

-- Config del formulario por kennel. Estructura JSON:
-- {
--   "template": "generic" | "breeding" | "custom",
--   "title": "Contactar con [Kennel]",
--   "subtitle": "...",
--   "submit_label": "Enviar solicitud",
--   "success_message": "¡Gracias! Te responderemos pronto.",
--   "fields": [
--     { "id": "name", "type": "text", "label": "Nombre", "required": true, "placeholder": "...", "map_to": "applicant_name" },
--     { "id": "email", "type": "email", "label": "Email", "required": true, "map_to": "applicant_email" },
--     { "id": "phone", "type": "tel", "label": "Teléfono", "required": false, "map_to": "applicant_phone" },
--     { "id": "puppy_sex", "type": "radio", "label": "Sexo preferido", "options": ["Macho","Hembra","Indiferente"], "map_to": "preference_sex" },
--     { "id": "purpose", "type": "select", "label": "Función", "options": ["Familia","Guarda y defensa","Trabajo intensivo"], "map_to": "applicant_purpose" },
--     { "id": "message", "type": "textarea", "label": "Mensaje", "required": true, "rows": 4, "map_to": "applicant_message" }
--   ]
-- }
ALTER TABLE kennels
  ADD COLUMN IF NOT EXISTS contact_form_config jsonb;

-- Datos adicionales del formulario que no mapean a columnas existentes.
-- (Ej: campos custom que el criador haya añadido tipo "¿Tienes hijos pequeños?")
ALTER TABLE puppy_reservations
  ADD COLUMN IF NOT EXISTS applicant_extra_data jsonb;

COMMENT ON COLUMN kennels.contact_form_config IS
  'Config del formulario de contacto público (campos, plantilla, etc.). NULL = usar default genérico.';

COMMENT ON COLUMN puppy_reservations.applicant_extra_data IS
  'Datos del formulario que no mapean a columnas estándar (campos custom añadidos por el criador).';
