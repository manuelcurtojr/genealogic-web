-- Trigger handle_new_user mejorado para extraer nombre y avatar del meta de OAuth.
--
-- Antes: copiaba el email a display_name por defecto, así que los users que
-- entraban con Google aparecían como "manuelcurtojr@gmail.com" en el dashboard.
--
-- Ahora: prioriza el full_name del perfil de Google (Supabase lo guarda en
-- auth.users.raw_user_meta_data como 'full_name' / 'name'), también copia el
-- avatar_url si viene. Fallback: parte local del email antes de la '@'.
--
-- Las claves de meta que ponemos en COALESCE cubren los tres flujos:
--  - Google OAuth      → 'full_name', 'name', 'avatar_url'
--  - Email/password    → 'display_name' (que ponemos manualmente en signUp)
--  - Sin metadata      → split_part(email, '@', 1)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    avatar_url   = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);
  RETURN NEW;
END;
$$;

-- Backfill: arregla los users OAuth ya existentes cuyo display_name quedó
-- como email completo. Solo toca filas donde:
--   - el display_name actual ES literalmente el email, o NULL
--   - hay un full_name disponible en raw_user_meta_data
-- así no pisamos display_name editados manualmente por el user.

UPDATE public.profiles p
SET
  display_name = COALESCE(
    NULLIF(u.raw_user_meta_data->>'full_name', ''),
    NULLIF(u.raw_user_meta_data->>'name', ''),
    split_part(u.email, '@', 1)
  ),
  avatar_url = COALESCE(p.avatar_url, NULLIF(u.raw_user_meta_data->>'avatar_url', ''))
FROM auth.users u
WHERE p.id = u.id
  AND (p.display_name = u.email OR p.display_name IS NULL)
  AND u.raw_user_meta_data ? 'full_name';
