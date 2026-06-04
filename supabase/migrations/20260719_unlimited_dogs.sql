-- Perros ilimitados para TODOS los usuarios (owner, free, pro, enterprise).
-- Decisión de producto 2026-06-04: el criador paga por las HERRAMIENTAS
-- (embudo, contratos, web, emailbot), no por número de perros. El propietario
-- es gratis para siempre y sin límite. Quitamos el enforcement duro.
--
-- Se conserva la función dog_limit_for_owner() por compatibilidad (deja de
-- usarse en enforcement), pero el trigger desaparece.
drop trigger if exists trg_enforce_dog_limit on public.dogs;
