export interface ChecklistItemDef {
  codigo: string;
  etapa: "ANTES_ASAMBLEA" | "DESPUES_ASAMBLEA";
  orden: number;
  nombre: string;
  descripcion: string;
  referencia: string;
}

export const CHECKLIST_ANTES: ChecklistItemDef[] = [
  {
    codigo: "ANTES_1",
    etapa: "ANTES_ASAMBLEA",
    orden: 1,
    nombre: "Nota de Presentación",
    descripcion:
      "Nota de presentación ante Personería Jurídica solicitando el trámite previo a la asamblea.",
    referencia: "Disp. N°25 Art. 6 – ítem 1",
  },
  {
    codigo: "ANTES_2",
    etapa: "ANTES_ASAMBLEA",
    orden: 2,
    nombre: "Acta de CD – Convocatoria a Asamblea",
    descripcion:
      "Acta íntegra de la reunión de la Comisión Directiva en la que se resolvió convocar la asamblea y se aprobó el Orden del Día, plasmada en libro rubricado por el órgano competente.",
    referencia: "Disp. N°25 Art. 6 – ítem 2",
  },
  {
    codigo: "ANTES_3",
    etapa: "ANTES_ASAMBLEA",
    orden: 3,
    nombre: "Nómina de Matriculados",
    descripcion:
      "Nómina de Socios/Matriculados completa Y nómina de socios/matriculados con derecho a voto (antigüedad mínima 6 meses).",
    referencia: "Disp. N°25 Art. 6 – ítem 3",
  },
  {
    codigo: "ANTES_4",
    etapa: "ANTES_ASAMBLEA",
    orden: 4,
    nombre: "Estados Contables + Memoria + Informe de Fiscalización",
    descripcion:
      "Un ejemplar de los Estados Contables certificados por la autoridad de contralor, la Memoria del ejercicio e Informe del Órgano de Fiscalización.",
    referencia: "Disp. N°25 Art. 6 – ítem 4",
  },
  {
    codigo: "ANTES_5",
    etapa: "ANTES_ASAMBLEA",
    orden: 5,
    nombre: "Certificado de Entidad al Día / Informe de Estado de Situación",
    descripcion:
      "Informe de Estado de Situación y/o Certificado de Entidad al Día vigente emitido por Personería Jurídica.",
    referencia: "Disp. N°25 Art. 6 – ítem 5",
  },
  {
    codigo: "ANTES_6",
    etapa: "ANTES_ASAMBLEA",
    orden: 6,
    nombre: "Comprobante de Pago de Tasas y Aranceles",
    descripcion:
      "Comprobante de pago de tasas y aranceles correspondientes a la presentación previa.",
    referencia: "Disp. N°25 Art. 6 – ítem 6",
  },
];

export const CHECKLIST_DESPUES: ChecklistItemDef[] = [
  {
    codigo: "DESPUES_1",
    etapa: "DESPUES_ASAMBLEA",
    orden: 1,
    nombre: "Nota de Presentación",
    descripcion:
      "Nota de presentación ante Personería Jurídica solicitando el trámite posterior a la asamblea.",
    referencia: "Disp. N°25 Art. 6 – ítem 1",
  },
  {
    codigo: "DESPUES_2",
    etapa: "DESPUES_ASAMBLEA",
    orden: 2,
    nombre: "Acta de Asamblea",
    descripcion:
      "Acta de la Asamblea firmada por quienes ocuparon la Presidencia y Secretaría, y por las personas designadas para firmar el Acta, plasmada en el correspondiente libro rubricado.",
    referencia: "Disp. N°25 Art. 6 – ítem 2",
  },
  {
    codigo: "DESPUES_3",
    etapa: "DESPUES_ASAMBLEA",
    orden: 3,
    nombre: "Planilla de Asistencia",
    descripcion:
      "Registro o planilla de asistencia firmada por el Presidente, con nombre completo, apellido, DNI y firma de cada asistente.",
    referencia: "Disp. N°25 Art. 6 – ítem 3",
  },
  {
    codigo: "DESPUES_4",
    etapa: "DESPUES_ASAMBLEA",
    orden: 4,
    nombre: "Nómina de Nuevas Autoridades (si fueron renovadas)",
    descripcion:
      "Nómina de miembros de la Comisión Directiva y Revisora de Cuentas si fueron renovadas en la asamblea.",
    referencia: "Disp. N°25 Art. 6 – ítem 4",
  },
  {
    codigo: "DESPUES_5",
    etapa: "DESPUES_ASAMBLEA",
    orden: 5,
    nombre: "DDJJ – Personas Políticamente Expuestas",
    descripcion:
      "Formulario Declaración Jurada de Persona Políticamente Expuesta de todos los miembros de los órganos directivos y fiscalizadores, con firma certificada por autoridad competente.",
    referencia: "Disp. N°25 Art. 6 – ítem 5",
  },
  {
    codigo: "DESPUES_6",
    etapa: "DESPUES_ASAMBLEA",
    orden: 6,
    nombre: "Ficha de Datos Filiatorios – Nuevas Autoridades (si renovadas)",
    descripcion:
      "Ficha de datos filiatorios de los miembros de la Comisión Directiva y Revisora de Cuentas si fueron renovadas.",
    referencia: "Disp. N°25 Art. 6 – ítem 6",
  },
  {
    codigo: "DESPUES_7",
    etapa: "DESPUES_ASAMBLEA",
    orden: 7,
    nombre: "Estados Contables + Memoria + Fiscalización (si corresponde)",
    descripcion:
      "En su caso, un ejemplar de los Estados Contables certificados, Memoria e Informe del Órgano de Fiscalización.",
    referencia: "Disp. N°25 Art. 6 – ítem 7",
  },
  {
    codigo: "DESPUES_8",
    etapa: "DESPUES_ASAMBLEA",
    orden: 8,
    nombre: "Edictos Publicados en el Boletín Oficial",
    descripcion:
      "Copia de los edictos publicados en el Boletín Oficial de la Provincia de Misiones (ambas publicaciones).",
    referencia: "Disp. N°25 Art. 6 – ítem 8",
  },
  {
    codigo: "DESPUES_9",
    etapa: "DESPUES_ASAMBLEA",
    orden: 9,
    nombre: "Comprobante de Pago de Tasas y Aranceles",
    descripcion:
      "Comprobante de pago de tasas y aranceles correspondientes a la presentación posterior a la asamblea.",
    referencia: "Disp. N°25 Art. 6 – ítem 9",
  },
];

export const COLOR_CLASSES: Record<
  string,
  { bg: string; text: string; border: string; badge: string }
> = {
  gray: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-300",
    badge: "bg-gray-100 text-gray-600",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-300",
    badge: "bg-blue-100 text-blue-700",
  },
  cyan: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-300",
    badge: "bg-cyan-100 text-cyan-700",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-300",
    badge: "bg-purple-100 text-purple-700",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-300",
    badge: "bg-red-100 text-red-700",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-300",
    badge: "bg-orange-100 text-orange-700",
  },
  yellow: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-300",
    badge: "bg-yellow-100 text-yellow-700",
  },
  teal: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-300",
    badge: "bg-teal-100 text-teal-700",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-300",
    badge: "bg-green-100 text-green-700",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-300",
    badge: "bg-indigo-100 text-indigo-700",
  },
};
