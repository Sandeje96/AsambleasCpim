"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";

export default function NuevaAsambleaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Valores por defecto: Asamblea 2026 = 29 de julio (mismo patrón que 2025)
  const hoy = new Date();
  const añoActual = hoy.getFullYear();
  const fechaPropuesta = new Date(añoActual, 6, 29); // 29 julio

  const [form, setForm] = useState({
    año: String(añoActual),
    fechaAsamblea: format(fechaPropuesta, "yyyy-MM-dd"),
    emailAlertas: "",
    notas: "",
  });

  // Calcular fecha límite legal: 60 días de corrido desde el cierre (30 abril)
  const cierreEjercicio = new Date(Number(form.año), 3, 30);
  const limiteLegal = addDays(cierreEjercicio, 60);
  const fechaAsambleaSeleccionada = new Date(form.fechaAsamblea + "T00:00:00");
  const superaLimite = fechaAsambleaSeleccionada > limiteLegal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/asambleas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          año: Number(form.año),
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
          <label className="label" htmlFor="año">
            Año de la Asamblea
          </label>
          <input
            id="año"
            type="number"
            min="2024"
            max="2040"
            className="input"
            value={form.año}
            onChange={(e) => setForm((f) => ({ ...f, año: e.target.value }))}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Ejercicio cerrado el 30/04/{form.año} (Ley I-N°11 Art. 32)
          </p>
        </div>

        {/* Fecha de asamblea */}
        <div>
          <label className="label" htmlFor="fecha">
            Fecha de la Asamblea
          </label>
          <input
            id="fecha"
            type="date"
            className="input"
            value={form.fechaAsamblea}
            min={`${form.año}-05-01`}
            max={`${form.año}-12-31`}
            onChange={(e) => setForm((f) => ({ ...f, fechaAsamblea: e.target.value }))}
            required
          />
          {/* Advertencia si supera el límite legal */}
          {superaLimite && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>⚠️ Atención:</strong> La fecha de asamblea supera los 60 días corridos
                desde el cierre del ejercicio ({format(limiteLegal, "dd/MM/yyyy")} según
                Art. 32). Verificá la interpretación legal aplicable.
              </p>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Límite legal de referencia (60 días desde cierre):{" "}
            <strong>{format(limiteLegal, "dd/MM/yyyy")}</strong>
          </p>
        </div>

        {/* Email alertas */}
        <div>
          <label className="label" htmlFor="email">
            Email para Alertas y Recordatorios
          </label>
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
          <label className="label" htmlFor="notas">
            Notas adicionales (opcional)
          </label>
          <textarea
            id="notas"
            rows={3}
            className="input resize-none"
            placeholder="Ej: Elección de presidente, tesorero y 2 vocales..."
            value={form.notas}
            onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Resumen de lo que se va a calcular */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-2">
            El sistema calculará automáticamente:
          </p>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>Fecha de confección del Padrón (45 días antes)</li>
            <li>Período de observaciones al Padrón (15 días)</li>
            <li>Convocatoria en orden del día de la CD (último martes ≥ 20 días antes)</li>
            <li>Presentación en Personería Jurídica antes (15 días hábiles)</li>
            <li>Publicación de edictos en el Boletín Oficial (2 días, con ≥ 15 días de anticipación)</li>
            <li>Presentación de listas de candidatos (10 días antes)</li>
            <li>Conformación de la Junta Electoral</li>
            <li>Presentación en Personería Jurídica después (15 días hábiles post-asamblea)</li>
            <li>Checklist completo de documentos pre y post asamblea</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
            {loading ? "Calculando fechas..." : "Crear Asamblea y Calcular Fechas"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push("/")}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
