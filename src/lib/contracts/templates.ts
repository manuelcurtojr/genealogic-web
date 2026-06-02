/**
 * Plantillas base de contrato. Dos tipos:
 *  - kind 'reservation' → Contrato de RESERVA de cachorro (con señal).
 *  - kind 'delivery'    → Contrato de COMPRAVENTA Y ENTREGA definitiva.
 *
 * Calcadas de los contratos reales (Irema Curtó), con los datos rellenados
 * dinámicamente desde la reserva, el cachorro asignado y la entidad legal del
 * criadero. Los campos sin dato salen con una línea en blanco para rellenar a mano.
 */

export type ContractKind = 'reservation' | 'delivery'

export type ContractTemplateVars = {
  // Criador (entidad legal)
  legalName: string //   razón social (MANUEL CURTÓ SL) — fallback al nombre del criadero
  legalId?: string //    CIF/NIF
  legalAddress?: string //domicilio fiscal
  representative?: string //   D. Manuel Curtó Richini-Fuster
  representativeId?: string // DNI del representante
  signCity?: string //   ciudad de firma
  jurisdiction?: string //tribunales competentes
  // Cliente
  clientName: string
  clientEmail: string
  clientId?: string //   DNI/NIE/Pasaporte
  clientAddress?: string
  // Preferencias de la reserva (contrato de reserva)
  breed?: string
  sex?: string //        Macho / Hembra / Indistinto
  color?: string
  purpose?: string //    Compañía / Cría / ...
  preferences?: string
  // Cachorro asignado (contrato de entrega)
  dogName?: string
  birthDate?: string
  microchip?: string
  registration?: string
  // Económico
  totalPrice?: string
  depositAmount?: string
  finalAmount?: string
  // Fechas
  todayDate: string
  reservationDate?: string
}

const BLANK = '__________________'
const v = (x: string | undefined, fallback = BLANK) => (x && x.trim() ? x : fallback)

const partesReunidas = (d: ContractTemplateVars) => `**REUNIDOS**

De una parte, **${v(d.legalName)}**, con CIF/NIF ${v(d.legalId)}, y domicilio fiscal en ${v(d.legalAddress)}, representada en este acto por D./Dª ${v(d.representative)}, con DNI ${v(d.representativeId)}, en calidad de administrador (en adelante, el **Criador**).

Y de otra parte, D./Dª **${v(d.clientName)}**, con DNI/NIE/Pasaporte nº ${v(d.clientId)}, y domicilio en ${v(d.clientAddress)}${d.clientEmail ? `, email ${d.clientEmail}` : ''} (en adelante, el **Cliente**).

Ambas partes, reconociéndose capacidad legal suficiente,`

// ─────────────────────────── RESERVA ───────────────────────────
export const CONTRACT_TEMPLATE_RESERVATION = (d: ContractTemplateVars) => `# Contrato de reserva de cachorro

En ${v(d.signCity)}, a ${d.todayDate}

${partesReunidas(d)}

**EXPONEN**

1. Que el Criador desarrolla un programa de cría profesional y es propietario legítimo de los perros reproductores y de las camadas presentes o futuras derivadas de dicho programa.
2. Que el Cliente manifiesta su interés en **reservar un cachorro**, ya sea de una camada futura o de una camada existente aún no entregada.
3. Que ambas partes son conscientes de que la reproducción y desarrollo de animales vivos está sujeta a factores biológicos no totalmente previsibles.

En virtud de lo anterior, **ACUERDAN**:

---

## 1. Objeto del contrato

El presente contrato tiene por objeto regular exclusivamente la reserva de un cachorro, sin que exista todavía transmisión de la propiedad ni entrega del animal, las cuales se formalizarán mediante **Contrato de Compraventa Definitivo** en el momento de la recogida o envío del cachorro.

## 2. Características orientativas del cachorro reservado

El Cliente manifiesta su interés en un cachorro con las siguientes características orientativas:

- **Raza:** ${v(d.breed)}
- **Sexo:** ${v(d.sex, 'Indistinto')}
- **Color / Capa:** ${v(d.color)}
- **Función prevista:** ${v(d.purpose, 'Compañía')}
- **Preferencias adicionales:** ${v(d.preferences, '—')}

El Cliente acepta expresamente que, al tratarse de animales vivos, no puede garantizarse de forma absoluta la concurrencia exacta de todas las características solicitadas.

## 3. Precio y reserva

- **Precio total estimado del cachorro:** ${v(d.totalPrice)}
- **Importe entregado en concepto de reserva:** ${v(d.depositAmount)}

La cantidad entregada tiene carácter de **reserva**, será descontada del precio final y **no es reembolsable**, salvo pacto expreso por escrito. El importe restante se abonará conforme se establezca en el Contrato de Compraventa Definitivo, que deberá estar íntegramente satisfecho antes de la entrega del cachorro.

## 4. Asignación del cachorro

La selección y asignación concreta del cachorro corresponderá exclusivamente al Criador, quien tendrá en cuenta las preferencias del Cliente siempre que sea posible, priorizando el bienestar del animal y su correcta adecuación al futuro propietario. La identificación definitiva del cachorro (fecha de nacimiento, microchip, etc.) se realizará únicamente en el Contrato de Compraventa Definitivo.

## 5. Plazos y disponibilidad

El Cliente acepta que los plazos de espera son aproximados, al depender de factores biológicos propios de la reproducción animal. El Criador se compromete a informar al Cliente de forma razonable sobre la evolución de la reserva y las camadas previstas.

## 6. Fallecimiento, indisponibilidad o fuerza mayor

En caso de fallecimiento del cachorro asignado antes de la entrega, o de imposibilidad objetiva de entrega por causas biológicas o veterinarias, la reserva se mantendrá activa para futuras camadas, sin derecho a devolución ni indemnización. El Criador no será responsable por retrasos o incumplimientos derivados de causas de fuerza mayor ajenas a su control razonable.

## 7. Desistimiento del Cliente

En caso de desistimiento voluntario por parte del Cliente, este perderá íntegramente las cantidades entregadas en concepto de reserva, sin derecho a reclamación alguna.

## 8. Naturaleza del contrato

El presente contrato no constituye una compraventa, ni implica entrega, transmisión de propiedad, ni activación de garantías sanitarias o genéticas, las cuales se regularán exclusivamente en el Contrato de Compraventa Definitivo.

## 9. Legislación y jurisdicción

El presente contrato se rige por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de ${v(d.jurisdiction)}, sin perjuicio de los derechos que pudieran corresponder al Cliente conforme a la normativa de consumidores.

## 10. Aceptación

Leído el presente contrato y encontrándolo conforme, ambas partes lo firman electrónicamente a través de la plataforma Genealogic.
`

// ─────────────────────────── ENTREGA ───────────────────────────
export const CONTRACT_TEMPLATE_DELIVERY = (d: ContractTemplateVars) => `# Contrato definitivo de compraventa y entrega de cachorro

En ${v(d.signCity)}, a ${d.todayDate}

${partesReunidas(d)}

**EXPONEN**

- Que con fecha ${v(d.reservationDate, d.todayDate)} ambas partes formalizaron un Contrato de Reserva, habiéndose cumplido las condiciones establecidas en el mismo.
- Que el Criador es propietario legítimo del cachorro objeto del presente contrato.
- Que el Cliente ha tenido oportunidad de informarse adecuadamente sobre la raza, características y necesidades del animal.

En virtud de lo anterior, **ACUERDAN**:

---

## 1. Objeto del contrato

El presente contrato tiene por objeto la compraventa y entrega definitiva del cachorro que se identifica a continuación, produciéndose en este acto la transmisión de la propiedad al Cliente.

## 2. Identificación del cachorro

- **Nombre:** ${v(d.dogName, '—')}
- **Raza:** ${v(d.breed)}
- **Sexo:** ${v(d.sex)}
- **Color / Capa:** ${v(d.color)}
- **Fecha de nacimiento:** ${v(d.birthDate)}
- **Microchip nº:** ${v(d.microchip)}
- **Nº de registro / LOE (si procede):** ${v(d.registration, '—')}

El Cliente declara recibir el cachorro en buen estado aparente y acorde a su edad.

## 3. Precio y forma de pago

- **Precio total del cachorro:** ${v(d.totalPrice)}
- **Importe abonado en concepto de reserva:** ${v(d.depositAmount)}
- **Importe final abonado el día de la recogida:** ${v(d.finalAmount)}

El Cliente declara haber abonado la totalidad del precio, no quedando cantidad alguna pendiente.

## 4. Entrega y transmisión de responsabilidad

La entrega del cachorro se realiza en este acto / mediante envío acordado entre las partes. Desde el momento de la entrega, la responsabilidad legal, civil y sanitaria del cachorro recae íntegramente sobre el Cliente, quedando el Criador exento de cualquier responsabilidad derivada de la tenencia, custodia o uso del animal.

## 5. Condiciones sanitarias y documentación

El cachorro se entrega conforme a la legislación vigente, acompañado de: microchip identificativo, cartilla veterinaria o pasaporte sanitario, vacunas y desparasitaciones acordes a su edad, certificado veterinario general de salud y documentación de origen o registro, si procede.

## 6. Garantía frente a enfermedades víricas

El Criador garantiza que el cachorro se encuentra libre de enfermedades víricas graves en el momento de la entrega. Se establece un plazo de garantía de **10 días naturales** desde la entrega, siempre que el Cliente comunique la incidencia por escrito dentro de dicho plazo y aporte informe veterinario oficial emitido por profesional colegiado. La garantía dará derecho, a elección exclusiva del Criador, a la sustitución del cachorro por otro de características similares cuando exista disponibilidad, sin devolución económica. Quedan excluidos gastos veterinarios, tratamientos, desplazamientos e indemnizaciones, así como enfermedades derivadas de negligencia, accidentes, estrés, mala alimentación, incumplimiento de pautas veterinarias o falta de vacunación posterior a la entrega.

## 7. Garantía genética

El Criador ofrece una garantía genética de hasta **tres (3) años**, limitada exclusivamente a enfermedades hereditarias graves diagnosticadas por veterinario especialista, confirmadas mediante pruebas oficiales, que comprometan gravemente la calidad de vida del animal o provoquen su fallecimiento. Quedan excluidas taras o defectos estéticos, enfermedades multifactoriales, patologías propias de la raza, la evolución natural del animal y los resultados derivados de manejo, alimentación o ejercicio inadecuados. En caso de aplicación, el Criador ofrecerá un cachorro de reemplazo sin devolución económica cuando exista disponibilidad.

## 8. Cesión, cría y derecho preferente

El Cliente se compromete a no ceder el perro a terceros criadores ni instituciones de cría sin consentimiento previo y por escrito del Criador, y a notificar al Criador cualquier imposibilidad de continuar con la tenencia. El Criador ostentará derecho preferente de recompra en caso de transmisión del animal.

## 9. Uso de imagen y seguimiento

El Cliente autoriza al Criador a utilizar imágenes y material audiovisual del perro con fines promocionales o informativos, sin compensación económica adicional, y acepta un seguimiento razonable del bienestar del animal.

## 10. Legislación aplicable y jurisdicción

El presente contrato se rige por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de ${v(d.jurisdiction)}, sin perjuicio de los derechos que pudieran corresponder al Cliente conforme a la normativa de consumidores.

## 11. Aceptación

Leído el presente contrato y encontrándolo conforme, ambas partes lo firman electrónicamente a través de la plataforma Genealogic.
`

export const CONTRACT_TEMPLATES = [
  {
    id: 'reservation',
    kind: 'reservation' as ContractKind,
    label: 'Contrato de reserva',
    body: CONTRACT_TEMPLATE_RESERVATION,
  },
  {
    id: 'delivery',
    kind: 'delivery' as ContractKind,
    label: 'Contrato de compraventa y entrega',
    body: CONTRACT_TEMPLATE_DELIVERY,
  },
] as const

export type ContractTemplateId = (typeof CONTRACT_TEMPLATES)[number]['id']
