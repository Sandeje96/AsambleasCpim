"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, isWeekend, isTuesday } from "date-fns";

// Suma N días hábiles (lunes-viernes, sin feriados).
// Sin lista de feriados: cálculo aproximado, válido para mostrar referencia en UI.
function sumarDiasHabilesAprox(fecha: Date, dias: number): Date {
  let resultado = new Date(fecha);
  let contados = 0;
  while (contados < dias) {
    resultado = addDays(resultado, 1);
    if (!isWeekend(resultado)) contados++;
  }
  return resultado;
}

export default function NuevaAsambleaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const fechaPropuesta = new Date(anioActual, 6, 29); // 29 julio como punto de partida

  const [form, setForm] = useState({
    anio: String(anioActual),
    fechaAsamblea: format(fechaPropuesta, "yyyy-MM-dd"),
    emailAlertas: "",
    notas: "",
  });

  // Límite legal: 60 días HÁBILES desde el cierre del ejercicio (30 de abril)
  const cierreEjercicio = new Date(Number(form.anio), 3, 30);
  const limiteLegalHabiles = sumarDiasHabilesAprox(cierreEjercicio, 60);

  const fechaAsambleaDate = new Date(form.fechaAsamblea + "T00:00:00");
  const superaLimite = fechaAsambleaDate > limiteLegalHabiles;
  const noEsMartes = form.fechaAsamblea !== "" && !isTuesday(fechaAsambleaDate);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (noEsMartes) {
      setError("La fecha de asamblea debe ser un MARTES (día de sesión de la Comisión Directiva).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/asambleas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anio: Number(form.anio),
          fechaAsamblea: form.fechaAsamblea,
          emailAlertas: form.emailAlertas || null,
          notas: form.notas || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error desconocido");
      }
      const asamblea = await res.json();
      router.push(`/asamblea/${asamblea.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la asamblea");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Asamblea Ordinaria</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ingresá la fecha de la asamblea y el sistema calculará automáticamente todas las
          fechas legales.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Año */}
        <div>
          <label className="label" htmlFor="anio">Año de la Asamblea</label>
          <input
            id="anio"
            type="number"
            min="2024"
            max="2040"
            className="input"
            value={form.anio}
            onChange={(e) => setForm((f) => ({ ...f, anio: e.target.value }))}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Ejercicio cerrado el 30/04/{form.anio} · Límite legal (aprox.):{" "}
            <strong>{format(limiteLegalHabiles, "dd/MM/yyyy")}</strong>{" "}
            <span className="text-gray-400">(60 días hábiles desde el cierre, sin contar feriados)</span>
          </p>
        </div>

        {/* Fecha de asamblea */}
        <div>
          <label className="label" htmlFor="fecha">
            Fecha de la Asamblea{" "}
            <span className="text-red-600 font-semibold">— debe ser MARTES</span>
          </label>
          <input
            id="fecha"
            type="date"
            className={`input ${noEsMartes ? "border-red-400 bg-red-50" : ""}`}
            value={form.fechaAsamblea}
            min={`${form.anio}-05-01`}
            max={`${form.anio}-12-31`}
            onChange={(e) => setForm((f) => ({ ...f, fechaAsamblea: e.target.value }))}
            required
          />

          {/* Error: no es martes */}
          {noEsMartes && (
            <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-xs text-red-700 font-semibold">
                ✗ La fecha seleccionada no es martes. La asamblea debe realizarse el día que
                sesiona la Comisión Directiva (Ley I-N°11 Art. 32).
              </p>
            </div>
          )}

          {/* Advertencia: supera el límite de 60 días hábiles */}
          {!noEsMartes && superaLimite && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>⚠️ Atención:</strong> La fecha supera los 60 días hábiles desde el
                cierre del ejercicio ({format(limiteLegalHabiles, "dd/MM/yyyy")} aprox., sin contar
                feriados). Verificá con Personería Jurídica antes de confirmar esta fecha.
              </p>
            </div>
          )}

          {/* OK: es martes y dentro del límite */}
          {!noEsMartes && !superaLimite && form.fechaAsamblea && (
            <p className="text-xs text-green-600 mt-1 font-medium">
              ✓ Martes · dentro del plazo legal
            </p>
          )}
        </div>

        {/* Email alertas */}
        <div>
          <label className="label" htmlFor="email">Email para Alertas y Recordatorios</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="ejemplo@cpim.org.ar"
            value={form.emailAlertas}
            onChange={(e) => setForm((f) => ({ ...f, emailAlertas: e.target.value }))}
          />
          <p className="text-xs text-gray-500 mt-1">
            Recibirás recordatorios automáticos antes de cada vencimiento.
          </p>
        </div>

        {/* Notas */}
        <div>
          <label className="label" htmlFor="notas">Notas adicionales (opcional)</label>
          <textarea
            id="notas"
            rows={3}
            className="input resize-none"
            placeholder="Ej: Renovación de presidente, tesorero y 2 vocales..."
            value={form.notas}
            onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 space-y-1">
          <p className="font-semibold text-blue-800">El sistema calculará automáticamente:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Padrón de matriculados (45 días corridos antes)</li>
            <li>Período de observaciones al Padrón (15 días)</li>
            <li>Convocatoria en CD — último martes con ≥ 20 días de anticipación</li>
            <li>Presentación Personería antes — 15 días <strong>hábiles</strong> (sin sábados, domingos ni feriados)</li>
            <li>Publicación de edictos — 2 días en el Boletín Oficial con ≥ 15 días corridos de anticipación</li>
            <li>Presentación de listas (10 días corridos antes)</li>
            <li>Junta Electoral — día siguiente al cierre de listas, evitando martes</li>
            <li>Presentación Personería después — 15 días <strong>hábiles</strong> post-asamblea</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="btn-primary flex-1 justify-center"
            disabled={loading || noEsMartes}
          >
            {loading ? "Calculando fechas..." : "Crear Asamblea y Calcular Fechas"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.push("/")}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
