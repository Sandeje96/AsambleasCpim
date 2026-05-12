import { isSameDay } from "date-fns";

// Feriados nacionales 2026 (fallback si la API no responde)
const FERIADOS_2026: string[] = [
  "2026-01-01", // Año Nuevo
  "2026-02-16", // Carnaval
  "2026-02-17", // Carnaval
  "2026-03-23", // Feriado puente (si aplica)
  "2026-03-24", // Día Nacional de la Memoria
  "2026-04-02", // Día del Veterano y Caídos en Malvinas
  "2026-04-03", // Viernes Santo
  "2026-05-01", // Día del Trabajador
  "2026-05-25", // Día de la Revolución de Mayo
  "2026-06-17", // Paso a la Inmortalidad del Gral. Güemes
  "2026-06-20", // Día de la Bandera (no laborable)
  "2026-07-09", // Día de la Independencia
  "2026-08-17", // Paso a la Inmortalidad del Gral. San Martín
  "2026-10-12", // Día del Respeto a la Diversidad Cultural
  "2026-11-20", // Día de la Soberanía Nacional
  "2026-12-08", // Inmaculada Concepción de María
  "2026-12-25", // Navidad
];

const FERIADOS_2025: string[] = [
  "2025-01-01",
  "2025-03-03",
  "2025-03-04",
  "2025-03-24",
  "2025-04-02",
  "2025-04-18",
  "2025-05-01",
  "2025-05-25",
  "2025-06-16",
  "2025-06-20",
  "2025-07-09",
  "2025-08-17",
  "2025-10-13",
  "2025-11-21",
  "2025-12-08",
  "2025-12-25",
];

const FALLBACK: Record<number, string[]> = {
  2025: FERIADOS_2025,
  2026: FERIADOS_2026,
};

export async function getFeriadosNacionales(año: number): Promise<Date[]> {
  try {
    const res = await fetch(
      `https://api.argentinadatos.com/v1/feriados/${año}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error("API no disponible");
    const data: { fecha: string; nombre: string }[] = await res.json();
    return data.map((f) => parseFecha(f.fecha));
  } catch {
    const fallback = FALLBACK[año] ?? [];
    return fallback.map(parseFecha);
  }
}

function parseFecha(fecha: string): Date {
  const [year, month, day] = fecha.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function esFeriado(fecha: Date, feriados: Date[]): boolean {
  return feriados.some((f) => isSameDay(f, fecha));
}
