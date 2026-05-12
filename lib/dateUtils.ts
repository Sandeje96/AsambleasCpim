/**
 * Convierte un string ISO de fecha (ej: "2026-07-21T00:00:00.000Z") a un Date local
 * sin conversión de zona horaria. Evita el problema de "un día antes" en UTC-3.
 */
export function parseDate(str: string): Date {
  const part = str.split("T")[0]; // "2026-07-21"
  const [y, m, d] = part.split("-").map(Number);
  return new Date(y, m - 1, d); // Date local, sin UTC
}

/**
 * Para DateTimes con hora real (ej: subidoAt) — usa new Date() normal.
 */
export function parseDateTime(str: string): Date {
  return new Date(str);
}
