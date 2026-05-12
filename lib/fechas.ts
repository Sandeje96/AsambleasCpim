import { addDays, subDays, isWeekend, isTuesday } from "date-fns";
import { esFeriado } from "./feriados";

export type CodigoFecha =
  | "CIERRE_EJERCICIO"
  | "PADRON"
  | "OBS_PADRON_FIN"
  | "CONVOCATORIA_CD"
  | "PRES_PERSONERIA_ANTES"
  | "EDICTOS_DIA1"
  | "EDICTOS_DIA2"
  | "PRESENTACION_LISTAS"
  | "JUNTA_ELECTORAL"
  | "ASAMBLEA"
  | "PRES_PERSONERIA_DESPUES";

export interface FechaLegalCalc {
  codigo: CodigoFecha;
  nombre: string;
  descripcion: string;
  referencia: string;
  tipo: "ANTES" | "FIJA" | "DESPUES";
  etapa: "PRE_ASAMBLEA" | "ASAMBLEA" | "POST_ASAMBLEA";
  fechaEstricta: Date;
  fechaPlanificada: Date;
  unidad: "HABILES" | "CORRIDOS" | "NA";
  diasBase: number;
  colorClase: string;
  orden: number;
}

export function calcularFechasLegales(
  fechaAsamblea: Date,
  feriados: Date[]
): FechaLegalCalc[] {
  const anio = fechaAsamblea.getFullYear();

  // 1. Cierre de ejercicio — 30 de abril fijo
  const cierreEjercicio = new Date(anio, 3, 30);

  // 2. Padrón — mínimo 45 días corridos antes (Art. 36)
  const padronEstricta = subDays(fechaAsamblea, 45);
  const padronPlanificada = subDays(fechaAsamblea, 60);

  // 3. Fin período de observaciones — 15 días corridos desde publicación del padrón (Art. 37)
  const obsPadronEstricta = addDays(padronEstricta, 15);
  const obsPadronPlanificada = addDays(padronPlanificada, 15);

  // 4. Convocatoria en CD (Art. 35) — mínimo 20 días corridos antes, debe ser martes
  const convEstricta = ultimoMartesConMinimoDias(fechaAsamblea, 20);
  const convPlanificada = ultimoMartesConMinimoDias(fechaAsamblea, 27);

  // 5. Presentación Personería ANTES — 15 días hábiles (Disp. 25 Art. 6)
  const presAntesEstricta = restarDiasHabiles(fechaAsamblea, 15, feriados);
  const presAntesPlanificada = restarDiasHabiles(fechaAsamblea, 20, feriados);

  // 6. Edictos — 2 publicaciones, última ≥15 días corridos antes (Disp. 25 Art. 7)
  const edictos2Estricta = subDays(fechaAsamblea, 15);
  const edictos2Planificada = subDays(fechaAsamblea, 17);
  const edictos1Estricta = subDays(edictos2Estricta, 1);
  const edictos1Planificada = subDays(edictos2Planificada, 1);

  // 7. Presentación de listas — 10 días corridos antes (Art. 41)
  const listasEstricta = subDays(fechaAsamblea, 10);
  const listasPlanificada = subDays(fechaAsamblea, 15);

  // 8. Junta Electoral — al día siguiente del cierre de listas.
  // NO debe caer en martes (día reservado para la CD). Si cae en martes, se corre al miércoles.
  const juntaEstricta = evitarMartes(addDays(listasEstricta, 1));
  const juntaPlanificada = evitarMartes(addDays(listasPlanificada, 1));

  // 9. Presentación Personería DESPUÉS — 15 días hábiles (Disp. 25 Art. 6)
  const presDespuesEstricta = sumarDiasHabiles(fechaAsamblea, 15, feriados);
  const presDespuesPlanificada = sumarDiasHabiles(fechaAsamblea, 10, feriados);

  return [
    {
      codigo: "CIERRE_EJERCICIO",
      nombre: "Cierre de Ejercicio Contable",
      descripcion:
        "Cierre del ejercicio económico del Consejo Profesional (30 de abril). " +
        "A partir de este día comienzan a correr los 60 días HÁBILES para realizar la Asamblea Ordinaria. " +
        "La fecha de asamblea debe ser un MARTES, ya que ese día sesiona la Comisión Directiva.",
      referencia: "Ley I-N°11 Art. 32",
      tipo: "FIJA",
      etapa: "PRE_ASAMBLEA",
      fechaEstricta: cierreEjercicio,
      fechaPlanificada: cierreEjercicio,
      unidad: "NA",
      diasBase: 0,
      colorClase: "gray",
      orden: 1,
    },
    {
      codigo: "PADRON",
      nombre: "Confección del Padrón General",
      descripcion:
        "El Consejo Directivo confecciona el Padrón General de matriculados con derecho a voto " +
        "(antigüedad mínima 6 meses), agrupados por título y especialidad. " +
        "Debe estar disponible en la sede para observaciones.",
      referencia: "Ley I-N°11 Art. 36 y 38",
      tipo: "ANTES",
      etapa: "PRE_ASAMBLEA",
      fechaEstricta: padronEstricta,
      fechaPlanificada: padronPlanificada,
      unidad: "CORRIDOS",
      diasBase: 45,
      colorClase: "blue",
      orden: 2,
    },
    {
      codigo: "OBS_PADRON_FIN",
      nombre: "Fin Período de Observaciones al Padrón",
      descripcion:
        "Vencimiento del plazo de 15 días corridos durante el cual los matriculados pueden " +
        "formular observaciones y tachas al padrón en la sede del Consejo.",
      referencia: "Ley I-N°11 Art. 37",
      tipo: "ANTES",
      etapa: "PRE_ASAMBLEA",
      fechaEstricta: obsPadronEstricta,
      fechaPlanificada: obsPadronPlanificada,
      unidad: "CORRIDOS",
      diasBase: 15,
      colorClase: "cyan",
      orden: 3,
    },
    {
      codigo: "CONVOCATORIA_CD",
      nombre: "Convocatoria en Orden del Día (CD – Martes)",
      descripcion:
        "La Comisión Directiva incluye la convocatoria a asamblea en el Orden del Día de su reunión " +
        "semanal de los martes y la aprueba mediante acta. Mínimo 20 días corridos antes de la asamblea. " +
        "No requiere que sea el mismo martes de la asamblea; puede ser cualquier martes con ≥20 días de anticipación.",
      referencia: "Ley I-N°11 Art. 35",
      tipo: "ANTES",
      etapa: "PRE_ASAMBLEA",
      fechaEstricta: convEstricta,
      fechaPlanificada: convPlanificada,
      unidad: "CORRIDOS",
      diasBase: 20,
      colorClase: "purple",
      orden: 4,
    },
    {
      codigo: "PRES_PERSONERIA_ANTES",
      nombre: "Presentación Digital Personería Jurídica (ANTES)",
      descripcion:
        "Primera presentación digital en el portal de trámites de Personería Jurídica: " +
        "(1) Nota de presentación, (2) Acta de reunión CD aprobando convocatoria, " +
        "(3) Nómina de socios completa y con derecho a voto, " +
        "(4) Estados Contables + Memoria + Informe de Fiscalización, " +
        "(5) Certificado de Entidad al día, (6) Comprobante de pago de tasas y aranceles.",
      referencia: "Disposición N°25 Art. 6",
      tipo: "ANTES",
      etapa: "PRE_ASAMBLEA",
      fechaEstricta: presAntesEstricta,
      fechaPlanificada: presAntesPlanificada,
      unidad: "HABILES",
      diasBase: 15,
      colorClase: "red",
      orden: 5,
    },
    {
      codigo: "EDICTOS_DIA1",
      nombre: "Publicación Edictos – 1° Día (Boletín Oficial Misiones)",
      descripcion:
        "Primera publicación en el Boletín Oficial de la Provincia de Misiones: " +
        "transcripción del Orden del Día, fecha, hora y lugar de la asamblea. " +
        "Presentar el texto al Boletín Oficial con 2-3 días hábiles de anticipación a la fecha deseada.",
      referencia: "Disposición N°25 Art. 7",
      tipo: "ANTES",
      etapa: "PRE_ASAMBLEA",
      fechaEstricta: edictos1Estricta,
      fechaPlanificada: edictos1Planificada,
      unidad: "CORRIDOS",
      diasBase: 16,
      colorClase: "orange",
      orden: 6,
    },
    {
      codigo: "EDICTOS_DIA2",
      nombre: "Publicación Edictos – 2° Día (Boletín Oficial Misiones)",
      descripcion:
        "Segunda y última publicación en el Boletín Oficial. " +
        "La fecha de esta última publicación debe ser mínimo 15 días corridos antes de la asamblea " +
        "(los 15 días se cuentan a partir de esta publicación).",
      referencia: "Disposición N°25 Art. 7",
      tipo: "ANTES",
      etapa: "PRE_ASAMBLEA",
      fechaEstricta: edictos2Estricta,
      fechaPlanificada: edictos2Planificada,
      unidad: "CORRIDOS",
      diasBase: 15,
      colorClase: "orange",
      orden: 7,
    },
    {
      codigo: "PRESENTACION_LISTAS",
      nombre: "Presentación de Listas de Candidatos",
      descripcion:
        "Las listas de candidatos deben presentarse al Consejo Directivo para su oficialización. " +
        "Requisitos: avaladas con firma de mínimo 20 matriculados. " +
        "Los candidatos deben tener ≥5 años de ejercicio profesional y ≥2 años de residencia en Misiones.",
      referencia: "Ley I-N°11 Art. 41 y 23",
      tipo: "ANTES",
      etapa: "PRE_ASAMBLEA",
      fechaEstricta: listasEstricta,
      fechaPlanificada: listasPlanificada,
      unidad: "CORRIDOS",
      diasBase: 10,
      colorClase: "yellow",
      orden: 8,
    },
    {
      codigo: "JUNTA_ELECTORAL",
      nombre: "Conformación Junta Electoral (3 titulares + 1 suplente)",
      descripcion:
        "Una vez cerrada la presentación de listas, se convoca a la Junta Electoral " +
        "(3 miembros titulares + 1 suplente). " +
        "La reunión NO se programa en martes para no coincidir con la sesión de la Comisión Directiva.",
      referencia: "Ley I-N°11",
      tipo: "ANTES",
      etapa: "PRE_ASAMBLEA",
      fechaEstricta: juntaEstricta,
      fechaPlanificada: juntaPlanificada,
      unidad: "NA",
      diasBase: 0,
      colorClase: "teal",
      orden: 9,
    },
    {
      codigo: "ASAMBLEA",
      nombre: "Asamblea Ordinaria (MARTES)",
      descripcion:
        "Celebración de la Asamblea Ordinaria: aprobación de Memoria y Balance, elección de consejeros " +
        "y demás puntos del Orden del Día. " +
        "DEBE realizarse en MARTES (día de sesión de la Comisión Directiva), " +
        "dentro de los 60 días HÁBILES desde el cierre del ejercicio (30/04). " +
        "Labrar acta con firmas de Presidente, Secretario y designados. " +
        "Registrar asistencia con nombre, apellido, DNI y firma.",
      referencia: "Ley I-N°11 Art. 32",
      tipo: "FIJA",
      etapa: "ASAMBLEA",
      fechaEstricta: fechaAsamblea,
      fechaPlanificada: fechaAsamblea,
      unidad: "NA",
      diasBase: 0,
      colorClase: "green",
      orden: 10,
    },
    {
      codigo: "PRES_PERSONERIA_DESPUES",
      nombre: "Presentación Digital Personería Jurídica (DESPUÉS)",
      descripcion:
        "Presentación post-asamblea: (1) Nota de presentación, " +
        "(2) Acta de Asamblea firmada (libro rubricado), " +
        "(3) Planilla de asistencia con nombre+DNI+firma, " +
        "(4) Nómina nuevas autoridades (si fueron renovadas), " +
        "(5) DDJJ de Persona Políticamente Expuesta con firma certificada, " +
        "(6) Ficha de datos filiatorios de autoridades renovadas, " +
        "(7) Estados Contables (si corresponde), " +
        "(8) Edictos publicados en el Boletín Oficial, (9) Comprobante de tasas.",
      referencia: "Disposición N°25 Art. 6",
      tipo: "DESPUES",
      etapa: "POST_ASAMBLEA",
      fechaEstricta: presDespuesEstricta,
      fechaPlanificada: presDespuesPlanificada,
      unidad: "HABILES",
      diasBase: 15,
      colorClase: "indigo",
      orden: 11,
    },
  ];
}

// ─── Funciones auxiliares ────────────────────────────────────────────────────

function restarDiasHabiles(fecha: Date, dias: number, feriados: Date[]): Date {
  let resultado = new Date(fecha);
  let contados = 0;
  while (contados < dias) {
    resultado = subDays(resultado, 1);
    if (!isWeekend(resultado) && !esFeriado(resultado, feriados)) {
      contados++;
    }
  }
  return resultado;
}

function sumarDiasHabiles(fecha: Date, dias: number, feriados: Date[]): Date {
  let resultado = new Date(fecha);
  let contados = 0;
  while (contados < dias) {
    resultado = addDays(resultado, 1);
    if (!isWeekend(resultado) && !esFeriado(resultado, feriados)) {
      contados++;
    }
  }
  return resultado;
}

// Último martes que esté al menos `diasMinimos` días corridos antes de `fecha`
function ultimoMartesConMinimoDias(fecha: Date, diasMinimos: number): Date {
  let limite = subDays(fecha, diasMinimos);
  while (!isTuesday(limite)) {
    limite = subDays(limite, 1);
  }
  return limite;
}

// Si la fecha cae en martes, la corre al miércoles (para no coincidir con la CD)
function evitarMartes(fecha: Date): Date {
  if (isTuesday(fecha)) {
    return addDays(fecha, 1);
  }
  return fecha;
}
