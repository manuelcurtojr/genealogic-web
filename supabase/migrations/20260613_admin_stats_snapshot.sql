-- ═══════════════════════════════════════════════════════════════════════════
-- admin_stats_snapshot() — RPC que devuelve TODAS las estadísticas en JSON
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Resuelve el problema de tablas grandes (dogs > 16k filas): si cargas
-- todo en memoria el cliente Supabase trunca a 1000 filas y los counts
-- salen mal. Aquí todo el conteo se hace SQL-side y devolvemos solo el
-- agregado.
--
-- SECURITY DEFINER + check de role admin para evitar exfiltración.

CREATE OR REPLACE FUNCTION public.admin_stats_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  iso_30 timestamptz := now() - interval '30 days';
  iso_60 timestamptz := now() - interval '60 days';
  iso_7 timestamptz := now() - interval '7 days';
  iso_1 timestamptz := now() - interval '1 day';
BEGIN
  -- Solo admins pueden llamar
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH
  -- ─── HERO ───
  hero AS (
    SELECT
      (SELECT count(*) FROM profiles) AS users_total,
      (SELECT count(*) FROM profiles WHERE created_at >= iso_30) AS users_last30,
      (SELECT count(*) FROM profiles WHERE created_at >= iso_60 AND created_at < iso_30) AS users_prev30,
      (SELECT count(*) FROM dogs) AS dogs_total,
      (SELECT count(*) FROM dogs WHERE created_at >= iso_30) AS dogs_last30,
      (SELECT count(*) FROM kennels) AS kennels_total,
      (SELECT count(*) FROM kennels WHERE owner_id IS NOT NULL) AS kennels_claimed,
      (SELECT count(*) FROM profiles WHERE plan IS NOT NULL AND plan <> 'free') AS paid_users_count
  ),
  -- ─── PLAN COUNTS ───
  plan_counts AS (
    SELECT
      count(*) FILTER (WHERE plan = 'free' OR plan IS NULL) AS free,
      count(*) FILTER (WHERE plan = 'starter') AS starter,
      count(*) FILTER (WHERE plan = 'pro') AS pro,
      count(*) FILTER (WHERE plan = 'premium') AS premium
    FROM profiles
  ),
  -- ─── DISTRIBUCIONES ───
  role_dist AS (
    SELECT
      count(*) FILTER (WHERE role = 'owner') AS owner,
      count(*) FILTER (WHERE role = 'breeder') AS breeder,
      count(*) FILTER (WHERE role = 'admin') AS admin
    FROM profiles
  ),
  intent_dist AS (
    SELECT
      count(*) FILTER (WHERE onboarding_intent = 'breeder') AS breeder,
      count(*) FILTER (WHERE onboarding_intent = 'owner') AS owner,
      count(*) FILTER (WHERE onboarding_intent IS NULL) AS null_intent
    FROM profiles
  ),
  sex_dist AS (
    SELECT
      count(*) FILTER (WHERE sex = 'male') AS male,
      count(*) FILTER (WHERE sex = 'female') AS female,
      count(*) FILTER (WHERE sex IS NULL OR sex NOT IN ('male', 'female')) AS unknown
    FROM dogs
  ),
  litter_dist AS (
    SELECT
      count(*) FILTER (WHERE status = 'planned') AS planned,
      count(*) FILTER (WHERE status = 'mated') AS mated,
      count(*) FILTER (WHERE status = 'born') AS born,
      count(*) FILTER (WHERE status = 'delivered') AS delivered,
      count(*) AS total
    FROM litters
  ),
  -- ─── CATÁLOGO (ratios) ───
  catalog AS (
    SELECT
      (SELECT count(*) FROM dogs) AS dogs_total,
      (SELECT count(*) FROM dogs WHERE thumbnail_url IS NOT NULL) AS dogs_with_photo,
      (SELECT count(*) FROM dogs WHERE father_id IS NOT NULL OR mother_id IS NOT NULL) AS dogs_with_parents,
      (SELECT count(*) FROM dogs WHERE is_for_sale = true) AS dogs_for_sale,
      (SELECT count(*) FROM dogs WHERE is_public = true) AS dogs_public,
      (SELECT count(*) FROM dogs WHERE is_reproductive = true) AS dogs_reproductive,
      (SELECT count(*) FROM dogs WHERE imported_from IS NOT NULL) AS dogs_imported,
      (SELECT count(*) FROM dogs WHERE owner_id IS NULL) AS dogs_unclaimed,
      (SELECT count(*) FROM kennels) AS kennels_total,
      (SELECT count(*) FROM kennels WHERE owner_id IS NULL) AS kennels_unclaimed,
      (SELECT count(*) FROM kennels WHERE logo_url IS NOT NULL) AS kennels_with_logo,
      (SELECT count(*) FROM kennels WHERE custom_domain IS NOT NULL) AS kennels_with_domain,
      (SELECT count(DISTINCT kennel_id) FROM kennel_pages WHERE enabled = true) AS kennels_with_published_web,
      (SELECT count(*) FROM breeds) AS breeds_total,
      (SELECT count(*) FROM litters) AS litters_total
  ),
  -- ─── OPERACIONES (admin_requests) ───
  ops AS (
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE status = 'pending') AS pending,
      count(*) FILTER (WHERE status = 'reviewing') AS reviewing,
      count(*) FILTER (WHERE status = 'approved') AS approved,
      count(*) FILTER (WHERE status = 'rejected') AS rejected,
      count(*) FILTER (WHERE type = 'support') AS type_support,
      count(*) FILTER (WHERE type = 'claim_dog') AS type_claim_dog,
      count(*) FILTER (WHERE type = 'claim_kennel') AS type_claim_kennel,
      count(*) FILTER (WHERE priority = 'urgent' AND status NOT IN ('approved', 'rejected', 'cancelled')) AS urgent,
      COALESCE(round(avg(extract(epoch FROM (resolved_at - created_at)) / 3600.0)
        FILTER (WHERE resolved_at IS NOT NULL))::int, 0) AS avg_resolution_hours
    FROM admin_requests
  ),
  -- ─── ENGAGEMENT ───
  engagement AS (
    SELECT
      (SELECT count(*) FROM genos_conversations) AS genos_convs,
      (SELECT count(*) FROM genos_messages WHERE role = 'user') AS genos_user_msgs,
      (SELECT count(*) FROM genos_messages WHERE role = 'assistant') AS genos_assistant_msgs,
      (SELECT count(*) FROM genos_conversations WHERE escalated_to_request_id IS NOT NULL) AS genos_escalated,
      (SELECT COALESCE(sum(COALESCE(tokens_in, 0) + COALESCE(tokens_out, 0)), 0) FROM genos_messages) AS genos_total_tokens,
      (SELECT count(*) FROM page_views WHERE created_at >= iso_30) AS page_views_30,
      (SELECT count(*) FROM notifications WHERE created_at >= iso_30) AS notifications_30,
      (SELECT count(*) FROM notifications WHERE is_read = false) AS notifications_unread,
      (SELECT count(*) FROM vet_records) AS vet_records_total,
      (SELECT count(*) FROM emailbot_threads) AS emailbot_threads,
      (SELECT count(*) FROM profiles WHERE last_sign_in_at >= iso_1) AS dau,
      (SELECT count(*) FROM profiles WHERE last_sign_in_at >= iso_7) AS wau,
      (SELECT count(*) FROM profiles WHERE last_sign_in_at >= iso_30) AS mau
  ),
  -- ─── FUNNEL ───
  funnel AS (
    SELECT
      (SELECT count(*) FROM profiles) AS signup,
      (SELECT count(*) FROM profiles WHERE onboarding_intent IS NOT NULL) AS chose_role,
      (SELECT count(DISTINCT owner_id) FROM (
        SELECT owner_id FROM kennels WHERE owner_id IS NOT NULL
        UNION
        SELECT owner_id FROM dogs WHERE owner_id IS NOT NULL
      ) AS u) AS has_kennel_or_dog,
      (SELECT count(*) FROM profiles WHERE plan IS NOT NULL AND plan <> 'free') AS paid
  ),
  -- ─── GROWTH MENSUAL ───
  months AS (
    SELECT generate_series(
      date_trunc('month', now() - interval '11 months'),
      date_trunc('month', now()),
      interval '1 month'
    ) AS month_start
  ),
  users_monthly AS (
    SELECT m.month_start,
      to_char(m.month_start, 'Mon YY') AS label,
      (SELECT count(*) FROM profiles WHERE created_at >= m.month_start AND created_at < m.month_start + interval '1 month') AS count,
      (SELECT count(*) FROM profiles WHERE created_at < m.month_start + interval '1 month') AS cumulative
    FROM months m ORDER BY m.month_start
  ),
  dogs_monthly AS (
    SELECT m.month_start,
      to_char(m.month_start, 'Mon YY') AS label,
      (SELECT count(*) FROM dogs WHERE created_at >= m.month_start AND created_at < m.month_start + interval '1 month') AS count,
      (SELECT count(*) FROM dogs WHERE created_at < m.month_start + interval '1 month') AS cumulative
    FROM months m ORDER BY m.month_start
  ),
  kennels_monthly AS (
    SELECT m.month_start,
      to_char(m.month_start, 'Mon YY') AS label,
      (SELECT count(*) FROM kennels WHERE created_at >= m.month_start AND created_at < m.month_start + interval '1 month') AS count,
      (SELECT count(*) FROM kennels WHERE created_at < m.month_start + interval '1 month') AS cumulative
    FROM months m ORDER BY m.month_start
  ),
  reservations_monthly AS (
    SELECT m.month_start,
      to_char(m.month_start, 'Mon YY') AS label,
      (SELECT count(*) FROM puppy_reservations WHERE created_at >= m.month_start AND created_at < m.month_start + interval '1 month') AS count,
      (SELECT count(*) FROM puppy_reservations WHERE created_at < m.month_start + interval '1 month') AS cumulative
    FROM months m ORDER BY m.month_start
  ),
  -- ─── PAGE VIEWS POR DÍA (últimos 30) ───
  days AS (
    SELECT generate_series(
      date_trunc('day', now() - interval '29 days'),
      date_trunc('day', now()),
      interval '1 day'
    ) AS day_start
  ),
  pv_daily AS (
    SELECT d.day_start,
      to_char(d.day_start, 'DD Mon') AS label,
      (SELECT count(*) FROM page_views WHERE created_at >= d.day_start AND created_at < d.day_start + interval '1 day') AS count
    FROM days d ORDER BY d.day_start
  ),
  -- ─── TOPS ───
  top_breeds AS (
    SELECT b.name, count(d.id) AS value
    FROM dogs d
    JOIN breeds b ON b.id = d.breed_id
    GROUP BY b.id, b.name
    ORDER BY value DESC
    LIMIT 10
  ),
  top_countries AS (
    SELECT country AS name, count(*) AS value
    FROM profiles
    WHERE country IS NOT NULL
    GROUP BY country
    ORDER BY value DESC
    LIMIT 10
  ),
  top_kennels AS (
    SELECT k.name, k.id, count(d.id) AS value
    FROM dogs d
    JOIN kennels k ON k.id = d.kennel_id
    WHERE d.kennel_id IS NOT NULL
    GROUP BY k.id, k.name
    ORDER BY value DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'hero', (SELECT to_jsonb(h) FROM hero h),
    'plan_counts', (SELECT to_jsonb(p) FROM plan_counts p),
    'role', (SELECT to_jsonb(r) FROM role_dist r),
    'intent', (SELECT to_jsonb(i) FROM intent_dist i),
    'sex', (SELECT to_jsonb(s) FROM sex_dist s),
    'litter', (SELECT to_jsonb(l) FROM litter_dist l),
    'catalog', (SELECT to_jsonb(c) FROM catalog c),
    'ops', (SELECT to_jsonb(o) FROM ops o),
    'engagement', (SELECT to_jsonb(e) FROM engagement e),
    'funnel', (SELECT to_jsonb(f) FROM funnel f),
    'users_monthly', (SELECT jsonb_agg(jsonb_build_object('month', label, 'count', count, 'cumulative', cumulative)) FROM users_monthly),
    'dogs_monthly', (SELECT jsonb_agg(jsonb_build_object('month', label, 'count', count, 'cumulative', cumulative)) FROM dogs_monthly),
    'kennels_monthly', (SELECT jsonb_agg(jsonb_build_object('month', label, 'count', count, 'cumulative', cumulative)) FROM kennels_monthly),
    'reservations_monthly', (SELECT jsonb_agg(jsonb_build_object('month', label, 'count', count, 'cumulative', cumulative)) FROM reservations_monthly),
    'pv_daily', (SELECT jsonb_agg(jsonb_build_object('day', label, 'count', count)) FROM pv_daily),
    'top_breeds', (SELECT jsonb_agg(jsonb_build_object('name', name, 'value', value)) FROM top_breeds),
    'top_countries', (SELECT jsonb_agg(jsonb_build_object('name', name, 'value', value)) FROM top_countries),
    'top_kennels', (SELECT jsonb_agg(jsonb_build_object('name', name, 'value', value)) FROM top_kennels)
  ) INTO result;

  RETURN result;
END $$;

COMMENT ON FUNCTION public.admin_stats_snapshot() IS
  'Snapshot completo de métricas admin en JSON. Solo admins (check inline).';

-- Permitir que authenticated llame (la función misma checkea admin role)
GRANT EXECUTE ON FUNCTION public.admin_stats_snapshot() TO authenticated;
