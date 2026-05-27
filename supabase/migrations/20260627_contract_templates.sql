-- ═══════════════════════════════════════════════════════════════════════════
-- contract_templates — plantillas de contrato reutilizables del criador
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Hasta ahora los contratos por reserva (reservation_contracts) partían de
-- un template hardcoded único (lib/contracts/templates.ts). Si un criador
-- quería reusar el mismo modelo para varias reservas, tenía que re-escribir
-- a mano cada vez.
--
-- Esta tabla permite al criador guardar sus propios modelos en /contratos
-- y elegir uno al crear contrato para una reserva. El criador puede tener
-- N plantillas (ej. "Compraventa cachorro", "Reserva con depósito", "Co-
-- propiedad reproductora") y marcar UNA como default — esa se pre-selecciona
-- al crear un contrato nuevo.
--
-- Sin scope global: cada plantilla es propiedad de UN kennel. Sin sharing
-- entre kennels — los modelos son IP del criador.

CREATE TABLE IF NOT EXISTS public.contract_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id   uuid NOT NULL REFERENCES public.kennels(id) ON DELETE CASCADE,
  name        text NOT NULL,
  body_md     text NOT NULL DEFAULT '',
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contract_templates_kennel_idx
  ON public.contract_templates (kennel_id, updated_at DESC);

-- Solo UNA plantilla puede estar marcada como default por kennel.
-- El índice parcial filtra is_default=true, así que múltiples filas con
-- is_default=false no chocan.
CREATE UNIQUE INDEX IF NOT EXISTS contract_templates_one_default_per_kennel
  ON public.contract_templates (kennel_id) WHERE is_default;

-- updated_at automático
CREATE OR REPLACE FUNCTION public.contract_templates_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contract_templates_touch ON public.contract_templates;
CREATE TRIGGER contract_templates_touch
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.contract_templates_touch_updated_at();

-- ─── RLS ───────────────────────────────────────────────────────────────────
-- Solo el owner del kennel puede ver / modificar sus plantillas. Sin lectura
-- pública (las plantillas son privadas del criador).

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contract_templates_owner_all" ON public.contract_templates;
CREATE POLICY "contract_templates_owner_all"
  ON public.contract_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kennels k
      WHERE k.id = contract_templates.kennel_id
        AND k.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kennels k
      WHERE k.id = contract_templates.kennel_id
        AND k.owner_id = auth.uid()
    )
  );
