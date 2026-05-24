/**
 * Plantillas iniciales para contratos. Se ofrece al criador al crear contrato
 * para no empezar de cero. Sustituye las variables con datos de la reserva.
 */

export type ContractTemplateVars = {
  kennelName: string
  kennelAddress?: string
  clientName: string
  clientEmail: string
  clientId?: string
  clientAddress?: string
  dogName?: string
  breed?: string
  birthDate?: string
  microchip?: string
  registration?: string
  totalPrice?: string
  depositAmount?: string
  todayDate: string
}

export const CONTRACT_TEMPLATE_BREEDING = (v: ContractTemplateVars) => `# Contrato de compraventa de cachorro

**Entre:**

- **VENDEDOR**: ${v.kennelName}${v.kennelAddress ? `, con domicilio en ${v.kennelAddress}` : ''}.
- **COMPRADOR**: ${v.clientName}${v.clientId ? `, con DNI/NIE ${v.clientId}` : ''}${v.clientAddress ? `, con domicilio en ${v.clientAddress}` : ''}, email ${v.clientEmail}.

Reunidos en la fecha **${v.todayDate}**, las partes acuerdan los siguientes términos.

---

## 1. Objeto

El VENDEDOR transfiere al COMPRADOR la propiedad del cachorro con los siguientes datos:

- **Nombre**: ${v.dogName || '—'}
- **Raza**: ${v.breed || '—'}
- **Fecha de nacimiento**: ${v.birthDate || '—'}
- **Microchip**: ${v.microchip || '—'}
- **Inscripción / LOE**: ${v.registration || '—'}

## 2. Precio y forma de pago

El precio total de venta es **${v.totalPrice || '—'}**. ${v.depositAmount ? `El COMPRADOR ya ha abonado una señal de **${v.depositAmount}**, que se descuenta del precio total.` : ''}

El pago se realizará según el calendario acordado en el panel de pagos de la plataforma Genealogic.

## 3. Garantías sanitarias

El VENDEDOR garantiza que el cachorro:

- Ha pasado revisión veterinaria previa a la entrega
- Está identificado con microchip
- Cuenta con cartilla sanitaria al día y vacunaciones correspondientes a su edad
- Ha sido desparasitado (interna y externamente)

El VENDEDOR garantiza la ausencia de enfermedades infecto-contagiosas y hereditarias detectables en el momento de la entrega, durante un periodo de **15 días** desde la misma.

## 4. Obligaciones del comprador

El COMPRADOR se compromete a:

1. Proporcionar al cachorro un entorno adecuado, alimentación equilibrada y atención veterinaria regular
2. Seguir el calendario de vacunaciones y desparasitaciones
3. No abandonar al animal bajo ningún concepto. Si por circunstancias sobrevenidas no pudiera mantenerlo, deberá notificarlo al VENDEDOR, quien tendrá derecho preferente de recuperación
4. No revender el cachorro a terceros con fines comerciales sin acuerdo previo

## 5. Pedigree y documentación

El VENDEDOR entregará al COMPRADOR:

- Pedigree oficial (cuando esté disponible)
- Cartilla sanitaria
- Cartilla de vacunaciones
- Una copia firmada de este contrato

## 6. Jurisdicción

Para cualquier controversia derivada del presente contrato, las partes se someten a la jurisdicción de los tribunales correspondientes al domicilio del VENDEDOR.

---

*Firma del vendedor y comprador al pie del documento, vía la plataforma Genealogic.*
`

export const CONTRACT_TEMPLATE_DEPOSIT = (v: ContractTemplateVars) => `# Contrato de reserva con señal

Entre **${v.kennelName}** (en adelante, el VENDEDOR) y **${v.clientName}** (en adelante, el COMPRADOR), con email ${v.clientEmail}, en fecha ${v.todayDate}.

## 1. Objeto

El COMPRADOR reserva un cachorro${v.breed ? ` de raza ${v.breed}` : ''}${v.dogName ? ` con nombre tentativo "${v.dogName}"` : ''} mediante el pago de una **señal de ${v.depositAmount || '—'}**.

## 2. Naturaleza de la señal

La señal forma parte del precio total acordado (${v.totalPrice || '—'}) y se descontará del pago final al momento de la entrega.

## 3. Condiciones

- La señal **no es reembolsable** si el COMPRADOR decide cancelar la reserva sin causa justificada
- Si el cachorro no llega a estar disponible por causas imputables al VENDEDOR (camada fallida, problemas sanitarios, etc.), la señal se reembolsará íntegramente
- El VENDEDOR no podrá asignar el cachorro reservado a un tercero mientras la reserva esté activa

## 4. Contrato definitivo

A la asignación del cachorro concreto se firmará un contrato definitivo de compraventa que incluirá los datos completos del animal (microchip, LOE, fecha de nacimiento) y las garantías sanitarias.

---

*Documento firmado electrónicamente a través de Genealogic.*
`

export const CONTRACT_TEMPLATES = [
  { id: 'breeding', label: 'Compraventa estándar', body: CONTRACT_TEMPLATE_BREEDING },
  { id: 'deposit', label: 'Reserva con señal', body: CONTRACT_TEMPLATE_DEPOSIT },
] as const

export type ContractTemplateId = (typeof CONTRACT_TEMPLATES)[number]['id']
