-- Modelo "Pro + extensiones" (Phase 1).
--
-- Se retira el tier Enterprise (kennel_pro 149€). Lo que daba — web del criadero
-- (editor + páginas públicas + dominio propio), emailbot y newsletter — pasa a
-- ser EXTENSIONES (add-ons) que se encienden por criadero, sobre el plan Pro.
--
-- Almacén Phase 1: una columna text[] en kennels. Sin facturación self-serve
-- todavía (las extensiones se conceden a mano); cuando se cablee Stripe
-- multi-item, el webhook sincronizará esta columna desde los items de la sub.

alter table public.kennels
  add column if not exists addons text[] not null default '{}';

comment on column public.kennels.addons is
  'Extensiones activas del criadero: web | emailbot | newsletter. Phase 1 manual; futuro: sync desde items de la suscripción Stripe.';

-- Migración de los 2 usuarios kennel_pro (Enterprise legacy — ambos internos:
-- founder + cuenta de screenshots) a kennel (Pro) + grant de TODAS las
-- extensiones, para que conserven exactamente el acceso que tenían.
update public.profiles
  set plan = 'kennel'
  where plan = 'kennel_pro';

update public.kennels
  set addons = array['web', 'emailbot', 'newsletter']
  where id in (
    '9675883f-f47e-4c51-bd5d-7fc2c6242963', -- Irema Curtó (founder)
    '229c3d87-7317-4333-9be7-112ae1abf35f'  -- _st Criadero del Mediterráneo (screenshots)
  );
