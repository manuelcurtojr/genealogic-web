/**
 * Definición de los campos morfométricos de `dog_measurements` — datos puros,
 * compartidos por la UI del planificador (MeasurementsForecast) y el backend
 * (evaluador IA del cruce vs estándar de la raza). Tener una única fuente evita
 * que las etiquetas/columnas se desincronicen entre el frontend y el prompt.
 *
 * MANTENER EN SYNC con la migración 20260726_dog_measurements.sql: si añades una
 * columna numérica o cualitativa a la tabla, añádela también aquí.
 *
 * Sin 'use client': importable tanto desde componentes cliente como desde rutas
 * API (server).
 */

/** Numéricas — se promedian entre progenitores (mid-parent), por sección. */
export const NUMERIC_SECTIONS: { title: string; fields: { col: string; label: string }[] }[] = [
  {
    title: 'Generales',
    fields: [
      { col: 'weight_kg', label: 'Peso (kg)' },
      { col: 'height_withers_cm', label: 'Altura a la cruz (cm)' },
      { col: 'height_rump_cm', label: 'Altura a la grupa (cm)' },
    ],
  },
  {
    title: 'Cabeza',
    fields: [
      { col: 'skull_circumference_cm', label: 'Perímetro craneal (cm)' },
      { col: 'head_length_cm', label: 'Longitud total de cabeza (cm)' },
      { col: 'skull_length_cm', label: 'Longitud de cráneo (cm)' },
      { col: 'muzzle_length_cm', label: 'Longitud de morro (cm)' },
      { col: 'skull_width_cm', label: 'Ancho de cráneo (cm)' },
      { col: 'muzzle_width_cm', label: 'Ancho de morro (cm)' },
      { col: 'inner_canthi_distance_cm', label: 'Distancia entre lagrimales (cm)' },
      { col: 'ear_length_cm', label: 'Longitud de oreja (cm)' },
    ],
  },
  {
    title: 'Cuello',
    fields: [
      { col: 'neck_length_cm', label: 'Longitud de cuello (cm)' },
      { col: 'neck_circumference_cm', label: 'Perímetro de cuello (cm)' },
    ],
  },
  {
    title: 'Tronco',
    fields: [
      { col: 'body_length_cm', label: 'Longitud de tronco (cm)' },
      { col: 'chest_girth_cm', label: 'Perímetro torácico (cm)' },
      { col: 'abdominal_girth_cm', label: 'Perímetro estomacal (cm)' },
      { col: 'chest_width_cm', label: 'Ancho de pecho (cm)' },
      { col: 'shoulder_width_cm', label: 'Ancho de hombros (cm)' },
    ],
  },
  {
    title: 'Grupa',
    fields: [
      { col: 'rump_width_cm', label: 'Ancho de grupa (cm)' },
      { col: 'rump_length_cm', label: 'Longitud de grupa (cm)' },
    ],
  },
  {
    title: 'Miembro anterior',
    fields: [
      { col: 'elbow_to_wrist_cm', label: 'Codo a muñeca (cm)' },
      { col: 'wrist_to_ground_cm', label: 'Muñeca al suelo (cm)' },
    ],
  },
  {
    title: 'Miembro posterior',
    fields: [
      { col: 'thigh_length_cm', label: 'Longitud de muslo (cm)' },
      { col: 'hock_to_ground_cm', label: 'Corvejón al suelo (cm)' },
    ],
  },
  {
    title: 'Rabo',
    fields: [{ col: 'tail_length_cm', label: 'Longitud de rabo (cm)' }],
  },
]

/** Cualitativas — no se promedian; se comparan lado a lado. */
export const QUALITATIVE_FIELDS: { col: string; label: string }[] = [
  { col: 'dentition', label: 'Boca' },
  { col: 'bite', label: 'Mordida' },
  { col: 'hip_grade', label: 'Grado de cadera' },
  { col: 'elbow_grade', label: 'Grado de codos' },
  { col: 'laboklin', label: 'Laboklin' },
  { col: 'stop', label: 'Stop' },
  { col: 'aplomb', label: 'Aplomos' },
  { col: 'hocks', label: 'Corvejones' },
  { col: 'eyes', label: 'Ojos' },
  { col: 'nose', label: 'Trufa' },
  { col: 'lips', label: 'Belfos' },
  { col: 'angulations', label: 'Angulaciones' },
]
