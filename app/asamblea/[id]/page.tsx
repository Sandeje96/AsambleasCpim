"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { COLOR_CLASSES } from "@/lib/constants";

interface FechaLegal {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  referencia: string;
  tipo: string;
  etapa: string;
  fechaEstricta: string;
  fechaPlanificada: string;
  unidad: string;
  diasBase: number;
  colorClase: string;
  orden: number;
  completado: boolean;
  fechaCompletado: string | null;
  notas: string | null;
}

interface Asamblea {
  id: number;
  anio: number;
  fechaCierreEjercicio: string;
  fechaAsamblea: string;
  emailAlertas: string | null;
  estado: string;
  notas: string | null;
  fechasLegales: FechaLegal[];
}

function getUrgencia(diasRestantes: number, diasEstricta: number, completado: boolean) {
  if (completado) return { color: "text-green-600", texto: "Completado ✓", icono: "✅" };
  if (diasEstricta < 0) return { color: "text-red-700 font-bold", texto: `VENCIDA hace ${Math.abs(diasEstricta)}d`, icono: "🚨" };
  if (diasEstricta === 0) return { color: "text-red-700 font-bold", texto: "Vence HOY", icono: "🚨" };
  if (diasEstricta <= 3) return { color: "text-red-600 font-semibold", texto: `${diasEstricta}d para vencer`, icono: "⚠️" };
  if (diasRestantes <= 7) return { color: "text-orange-600 font-semibold", texto: `Planif. en ${diasRestantes}d`, icono: "📅" };
  if (diasRestantes <= 20) return { color: "text-yellow-600", texto: `Planif. en ${diasRestantes}d`, icono: "📋" };
  return { color: "text-gray-500", texto: `Planif. en ${diasRestantes}d`, icono: "🔵" };
}

function BadgeDias({
  unidad,
  diasBase,
  tipo,
}: {
  unidad: string;
  diasBase: number;
  tipo: string;
}) {
  if (unidad === "NA" || diasBase === 0) return null;
  const dir = tipo === "DESPUES" ? "+" : "-";
  const label = unidad === "HABILES" ? "hábiles" : "corridos";
  return (
    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      {dir}{diasBase}d {label}
    </span>
  );
}

export default function AsambleaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [asamblea, setAsamblea] = useState<Asamblea | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editNota, setEditNota] = useState<{ id: number; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/asambleas/${id}`);
    if (!res.ok) { router.push("/"); return; }
    const data = await res.json();
    setAsamblea(data);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { cargar(); }, [cargar]);

  async function toggleCompletado(fechaId: number, actual: boolean) {
    await fetch(`/api/fechas/${fechaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completado: !actual }),
    });
    cargar();
  }

  async function guardarNota(fechaId: number, notas: string) {
    await fetch(`/api/fechas/${fechaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notas }),
    });
    setEditNota(null);
    cargar();
  }

  async function marcarRealizada() {
    if (!confirm("¿Marcar esta asamblea como REALIZADA?")) return;
    await fetch(`/api/asambleas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "REALIZADA" }),
    });
    cargar();
  }

  async function enviarAlerta() {
    if (!asamblea?.emailAlertas) {
      setEmailMsg("⚠️ Configurá primero un email en la asamblea.");
      return;
    }
    setEnviandoEmail(true);
    setEmailMsg("");
    const res = await fetch("/api/alertas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asambleaId: id, tipo: "RECORDATORIO" }),
    });
    const data = await res.json();
    setEmailMsg(res.ok ? `✓ ${data.mensaje ?? "Email enviado correctamente"}` : `✗ ${data.error}`);
    setEnviandoEmail(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!asamblea) return null;

  const hoy = new Date();
  const fechaAsamblea = new Date(asamblea.fechaAsamblea);
  const diasParaAsamblea = differenceInCalendarDays(fechaAsamblea, hoy);

  const etapas = [
    { key: "PRE_ASAMBLEA", label: "Pre-Asamblea" },
    { key: "ASAMBLEA", label: "Asamblea" },
    { key: "POST_ASAMBLEA", label: "Post-Asamblea" },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="card overflow-hidden">
        <div className="bg-cpim-blue px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-xl font-bold">
              Asamblea Ordinaria {asamblea.anio}
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              {format(fechaAsamblea, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
              {diasParaAsamblea > 0
                ? ` — faltan ${diasParaAsamblea} días`
                : diasParaAsamblea === 0
                ? " — ¡HOY es la asamblea!"
                : ` — realizada hace ${Math.abs(diasParaAsamblea)} días`}
            </p>
            {asamblea.notas && (
              <p className="text-blue-300 text-xs mt-1">{asamblea.notas}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                asamblea.estado === "REALIZADA"
                  ? "bg-green-500 text-white"
                  : "bg-yellow-400 text-yellow-900"
              }`}
            >
              {asamblea.estado === "REALIZADA" ? "✓ Realizada" : "En Proceso"}
            </span>
            {asamblea.estado !== "REALIZADA" && (
              <button onClick={marcarRealizada} className="btn-secondary text-xs px-3 py-1.5">
                Marcar como Realizada
              </button>
            )}
          </div>
        </div>

        {/* Sub-nav */}
        <div className="px-6 py-3 bg-white border-b border-gray-200 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-700">← Dashboard</Link>
            <span className="text-gray-300">|</span>
            <Link href={`/asamblea/${id}/checklist`} className="btn-secondary text-xs px-3 py-1.5">
              📋 Checklist Documentos
            </Link>
            <Link href={`/asamblea/${id}/documentos`} className="btn-secondary text-xs px-3 py-1.5">
              📁 Archivos
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {emailMsg && <span className="text-xs text-gray-600">{emailMsg}</span>}
            <button
              onClick={enviarAlerta}
              disabled={enviandoEmail}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {enviandoEmail ? "Enviando..." : "📧 Enviar Alerta Email"}
            </button>
          </div>
        </div>
      </div>

      {/* Timeline por etapas */}
      {etapas.map(({ key, label }) => {
        const fechas = asamblea.fechasLegales.filter((f) => f.etapa === key);
        if (fechas.length === 0) return null;

        return (
          <div key={key}>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
              {label}
            </h2>
            <div className="space-y-3">
              {fechas.map((fecha) => {
                const diasPlan = differenceInCalendarDays(new Date(fecha.fechaPlanificada), hoy);
                const diasEstricta = differenceInCalendarDays(new Date(fecha.fechaEstricta), hoy);
                const urgencia = getUrgencia(diasPlan, diasEstricta, fecha.completado);
                const colors = COLOR_CLASSES[fecha.colorClase] ?? COLOR_CLASSES.blue;
                const estaExpandido = expandedId === fecha.id;

                return (
                  <div
                    key={fecha.id}
                    className={`card border-l-4 ${colors.border} overflow-hidden transition-all`}
                  >
                    {/* Fila principal */}
                    <div className="px-5 py-4 flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleCompletado(fecha.id, fecha.completado)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          fecha.completado
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-green-400"
                        }`}
                      >
                        {fecha.completado && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                          </svg>
                        )}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start gap-2">
                          <h3
                            className={`font-semibold text-sm ${
                              fecha.completado ? "line-through text-gray-400" : "text-gray-800"
                            }`}
                          >
                            {urgencia.icono} {fecha.nombre}
                          </h3>
                          <BadgeDias unidad={fecha.unidad} diasBase={fecha.diasBase} tipo={fecha.tipo} />
                          <span className="text-xs text-gray-400 italic">{fecha.referencia}</span>
                        </div>

                        {/* Fechas */}
                        <div className="flex flex-wrap gap-4 mt-2">
                          <div>
                            <p className="text-xs text-gray-400">Fecha planificada</p>
                            <p className="text-sm font-medium text-gray-700">
                              {format(new Date(fecha.fechaPlanificada), "dd/MM/yyyy")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Fecha límite legal</p>
                            <p className="text-sm font-medium text-gray-700">
                              {format(new Date(fecha.fechaEstricta), "dd/MM/yyyy")}
                            </p>
                          </div>
                          {fecha.completado && fecha.fechaCompletado && (
                            <div>
                              <p className="text-xs text-gray-400">Completado el</p>
                              <p className="text-sm font-medium text-green-600">
                                {format(new Date(fecha.fechaCompletado), "dd/MM/yyyy")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Estado + expandir */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-xs ${urgencia.color}`}>{urgencia.texto}</span>
                        <button
                          onClick={() => setExpandedId(estaExpandido ? null : fecha.id)}
                          className="text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                          {estaExpandido ? "Ocultar" : "Ver detalle"}
                        </button>
                      </div>
                    </div>

                    {/* Panel expandido */}
                    {estaExpandido && (
                      <div className={`px-5 pb-4 ${colors.bg} border-t border-gray-100`}>
                        <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                          {fecha.descripcion}
                        </p>

                        {/* Notas */}
                        <div className="mt-3">
                          {editNota?.id === fecha.id ? (
                            <div className="flex gap-2">
                              <textarea
                                rows={2}
                                className="input text-xs flex-1 resize-none"
                                value={editNota.texto}
                                onChange={(e) =>
                                  setEditNota({ id: fecha.id, texto: e.target.value })
                                }
                              />
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => guardarNota(fecha.id, editNota.texto)}
                                  className="btn-primary text-xs px-3 py-1"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setEditNota(null)}
                                  className="btn-secondary text-xs px-3 py-1"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                {fecha.notas ? (
                                  <p className="text-xs text-gray-600 bg-white rounded px-3 py-2 border border-gray-200">
                                    📝 {fecha.notas}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-400 italic">Sin notas</p>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  setEditNota({ id: fecha.id, texto: fecha.notas ?? "" })
                                }
                                className="text-xs text-blue-600 hover:text-blue-800 underline shrink-0"
                              >
                                {fecha.notas ? "Editar nota" : "Agregar nota"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
