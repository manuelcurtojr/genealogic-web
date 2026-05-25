# Stripe — Setup completo para suscripciones SaaS

Esta guía cubre TODO lo necesario para que los criadores puedan pagar
Pro/Premium desde `/pricing` con tarjeta y todo el ciclo de vida
funcione (welcome email, facturas, cambios de plan, cancelaciones).

## 1) Activar Stripe en producción

En tu cuenta Stripe ya activada (live mode):

1. Asegúrate de tener configurado **business profile** y **bank account**
   (los payouts requieren ambos).
2. Activa **Customer Portal**: Dashboard → Settings → Customer Portal
   → toggle ON. Allí defines qué puede hacer el user (cambiar plan,
   cancelar, actualizar tarjeta, ver facturas).

## 2) Crear los productos + precios en Stripe

Crea **2 productos** desde Dashboard → Products:

### Producto 1: Genealogic Pro
- **Name**: Genealogic Pro
- **Description**: Pipeline de reservas, web pública, emailbot y contratos
- **Pricing**:
  - **Mensual**: 39.00 € recurring monthly
  - **Anual** (opcional): 390.00 € recurring yearly (descuento del 17%)

### Producto 2: Genealogic Premium
- **Name**: Genealogic Premium
- **Description**: Todo lo de Pro + multi-kennel, API B2B, soporte prioritario
- **Pricing**:
  - **Mensual**: 149.00 € recurring monthly
  - **Anual** (opcional): 1490.00 € recurring yearly

Tras crear cada precio, copia su `price_xxx` ID.

## 3) Configurar variables de entorno

En **Vercel → Settings → Environment Variables**, añade:

```bash
# Server-side
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # se obtiene en paso 4

# Price IDs (obligatorios para que el checkout funcione)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...        # opcional
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_ANNUAL=price_...    # opcional

# Cliente
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Sin los `STRIPE_PRICE_*` el botón "Empezar Pro" muestra mensaje
"Pagos online próximamente" en vez de romper.

## 4) Crear los webhooks en Stripe

Necesitas **DOS endpoints** porque Genealogic tiene dos flujos
distintos:

### Webhook A — Suscripciones SaaS

- **URL**: `https://genealogic.io/api/billing/webhook`
- **Events**:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
- Copia el **Signing secret** → ENV `STRIPE_WEBHOOK_SECRET`

### Webhook B — Connect + pagos de reservas

- **URL**: `https://genealogic.io/api/stripe/webhook`
- **Events**:
  - `account.updated`
  - `checkout.session.completed`
  - `payment_intent.succeeded`
- Mismo signing secret (Stripe firma cada endpoint igual).

> **Importante**: ambos endpoints comparten `STRIPE_WEBHOOK_SECRET`
> porque Stripe genera UN secret distinto por endpoint. Si lo prefieres
> separado, crea `STRIPE_WEBHOOK_SECRET_BILLING` y
> `STRIPE_WEBHOOK_SECRET_CONNECT` y modifica cada handler. Por ahora
> compartido para simplificar.

## 5) Probar el flujo end-to-end

En modo test (Stripe → toggle View test data → ON):

1. **Crear productos test** (idénticos a producción)
2. **Env vars con `sk_test_*` + `pk_test_*` + price IDs test**
3. Abrir `/pricing` → "Empezar Pro" → checkout
4. Pagar con `4242 4242 4242 4242` exp `12/40` CVC `123`
5. Verificar:
   - Redirige a `/cuenta/facturacion?status=success`
   - `profiles.plan` cambió a `pro`
   - `email_log` tiene entry `subscription_activated` status `sent`
   - Llega email "Genealogic Pro activado" al inbox
   - `plan_invoices` tiene 1 row

## 6) Stripe CLI para webhooks en local

Para probar webhooks contra `localhost:3000`:

```bash
# Instalar
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks a tu local
stripe listen --forward-to localhost:3000/api/billing/webhook

# El CLI te da un whsec_xxx temporal → ponlo en .env.local
```

Para disparar un evento manualmente:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

## 7) Emails que dispara cada evento

| Evento Stripe                    | Email enviado            | Cuándo |
|----------------------------------|--------------------------|--------|
| `checkout.session.completed`     | `subscription_activated` | 1ª vez que se activa el plan |
| `customer.subscription.deleted`  | `subscription_cancelled` | Al cancelar (manual o forzada) |
| `invoice.payment_failed`         | `payment_failed`         | Cuando falla cobro recurrente |
| `invoice.paid`                   | _(ninguno actualmente)_  | Solo guarda la factura |

Si quieres email de "factura disponible" en `invoice.paid`, añade
`template: 'invoice_paid'` siguiendo el patrón de los otros emails.

## 8) Customer Portal — qué puede hacer el user

Desde `/cuenta/facturacion` → "Gestionar mi suscripción", el user
abre el Customer Portal de Stripe donde puede:

- Cambiar de plan (Pro ↔ Premium)
- Cancelar al final del periodo
- Actualizar tarjeta
- Descargar facturas PDF
- Actualizar datos de facturación

Configura los permisos exactos en
Dashboard → Settings → Customer Portal.

## 9) Migración aplicada

`supabase/migrations/20260616_stripe_events_log.sql` crea la tabla
`stripe_events` que da idempotencia al webhook (evita procesar el
mismo evento 2 veces si Stripe reintenta por timeout).
