-- 20260725_onboarding_email_sync.sql
-- Sincroniza a public.profiles los campos de auth.users que los crons de email
-- necesitan: last_sign_in_at + email_confirmed_at.
--
-- Por qué: hasta ahora profiles.last_sign_in_at estaba SIEMPRE a NULL (nadie lo
-- poblaba), así que:
--   · /api/cron/re-engagement leía ese campo muerto y no enviaba NADA nunca.
--   · no había forma de detectar "confirmó su email pero jamás inició sesión"
--     (el caso que dispara el email de activación).
--
-- Aditivo e idempotente. NO borra datos.

alter table public.profiles
  add column if not exists email_confirmed_at timestamptz;

-- Vuelca auth.users → profiles. SECURITY DEFINER porque auth.users no es
-- accesible al rol del cron. Solo toca filas que cambiaron (is distinct from).
create or replace function public.sync_user_auth_to_profiles()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles p
     set last_sign_in_at    = u.last_sign_in_at,
         email_confirmed_at = u.email_confirmed_at
    from auth.users u
   where u.id = p.id
     and (p.last_sign_in_at    is distinct from u.last_sign_in_at
       or p.email_confirmed_at is distinct from u.email_confirmed_at);
$$;

grant execute on function public.sync_user_auth_to_profiles() to service_role;

-- Backfill inmediato de las filas existentes.
select public.sync_user_auth_to_profiles();
