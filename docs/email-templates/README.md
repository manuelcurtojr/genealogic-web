# Auth email templates · Supabase

Estos 6 HTML están pensados para pegar en
**Supabase Dashboard → Authentication → Email Templates**.

Reemplazan los defaults feos de Supabase con un diseño branded que matchea
el estilo Cal del resto de Genealogic (Inter, paleta ink/canvas, accent
naranja `#FE6620`).

## Cómo aplicar

Para cada template, en el dashboard de Supabase (proyecto Genealogic
`elhwppumacnyhovkapeb`):

1. Authentication → Emails → Templates
2. Selecciona la pestaña correspondiente
3. Borra el contenido por defecto
4. Copia y pega el HTML del archivo
5. (Opcional) Cambia el **Subject** según la sugerencia de cada archivo
6. Save

## Variables que usa cada template

Supabase sustituye estas variables al enviar:

| Variable                | Disponible en                                              |
| ----------------------- | ---------------------------------------------------------- |
| `{{ .ConfirmationURL }}` | confirm signup, reset password, magic link, email change, invite |
| `{{ .Token }}`          | todas (código 6 dígitos alternativo al link)               |
| `{{ .TokenHash }}`      | URLs custom (verify endpoint)                              |
| `{{ .SiteURL }}`        | siempre (URL base del proyecto Supabase)                   |
| `{{ .Email }}`          | siempre                                                    |
| `{{ .Data.display_name }}` | si pasaste `data: { display_name }` en signUp           |
| `{{ .RedirectTo }}`     | si lo pasaste en options                                   |

## Subjects sugeridos

- **Confirm signup**: `Confirma tu cuenta en Genealogic`
- **Reset password**: `Restablece tu contraseña de Genealogic`
- **Magic link**: `Tu enlace para entrar en Genealogic`
- **Email change**: `Confirma tu nuevo email en Genealogic`
- **Invite user**: `Te han invitado a Genealogic`
- **Reauthentication**: `Código de verificación: {{ .Token }}`

## Tip

Si quieres editar el HTML, mantén:
- Anchuras inline en `<table>` (Gmail/Outlook ignoran CSS externo)
- Sin `<style>` blocks (algunos clientes los strippean)
- Colores hex literales (no variables CSS)
- Botón principal como `<table>` por compat Outlook
