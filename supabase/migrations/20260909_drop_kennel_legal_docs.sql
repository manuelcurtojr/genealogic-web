-- Elimina la tabla de páginas legales por criadero (aviso legal / privacidad /
-- cookies / términos de la web pública del criadero). Era el resto del "perfil
-- avanzado / web builder" del criadero, que ya no existe. El editor, la ruta
-- pública /kennels/[id]/legal/[doc] y el admin de plantillas se han eliminado
-- del código en el mismo cambio.
--
-- OJO: NO afecta a los DATOS legales del criadero para contratos, que viven en
-- columnas de `kennels` (legal_name, legal_id, legal_address, …) y se siguen
-- usando en /kennel/legal y en la generación de contratos.

DROP TABLE IF EXISTS kennel_legal_docs;
