"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

interface ChecklistItem {
  id: number;
  etapa: string;
  orden: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  referencia: string;
  completado: boolean;
  fechaCompletado: string | null;
  notas: string | null;
  documentos: { id: number; nombre: string; nombreOriginal: string; subidoAt: string }[];
}

interface Asamblea {
  id: number;
  anio: number;
  fechaAsamblea: string;
  checklistItems: ChecklistItem[];
}

export default function ChecklistPage() {
  const { id } = useParams<{ id: string }>();
  const [asamblea, setAsamblea] = useState<Asamblea | null>(null);
  const [loading, setLoading] = useState(true);
  const [editNota, setEditNota] = useState<{ id: number; texto: string } | null>(null);
  const [subiendo, setSubiendo] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/asambleas/${id}`);
    const data = await res.json();
    setAsamblea(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  async function toggleItem(itemId: number, actual: boolean) {
    await fetch(`/api/checklist/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completado: !actual }),
    });
    cargar();
  }

  async function guardarNota(itemId: number, notas: string) {
    await fetch(`/api/checklist/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notas }),
    });
    setEditNota(null);
    cargar();
  }

  async function subirArchivo(itemId: number, file: File) {
    setSubiendo(itemId);
    const fd = new FormData();
    fd.append("archivo", file);
    fd.append("asambleaId", String(id));
    fd.append("checklistItemId", String(itemId));
    fd.append("nombre", file.name);
    await fetch("/api/documentos", { method: "POST", body: fd });
    setSubiendo(null);
    cargar();
  }

  async function eliminarDoc(docId: number) {
    if (!confirm("¿Eliminar este documento?")) return;
    await fetch(`/api/documentos/${docId}`, { method: "DELETE" });
    cargar();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>;
  }
  if (!asamblea) return null;

  const etapas = [
    {
      key: "ANTES_ASAMBLEA",
      label: "Documentos a presentar ANTES de la Asamblea",
      subtitulo: "Presentación digital en Personería Jurídica – 15 días hábiles antes",
      color: "blue",
    },
    {
      key: "DESPUES_ASAMBLEA",
      label: "Documentos a presentar DESPUÉS de la Asamblea",
      subtitulo: "Presentación digital en Personería Jurídica – 15 días hábiles después",
      color: "indigo",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Checklist de Documentos — {asamblea.anio}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Disposición N°25 Art. 6 de Personería Jurídica de Misiones
          </p>
        </div>
        <Link href={`/asamblea/${id}`} className="btn-secondary">
          ← Volver al Calendario
        </Link>
      </div>

      {etapas.map(({ key, label, subtitulo }) => {
        const items = asamblea.checklistItems
          .filter((i) => i.etapa === key)
          .sort((a, b) => a.orden - b.orden);

        const completados = items.filter((i) => i.completado).length;
        const progreso = items.length > 0 ? Math.round((completados / items.length) * 100) : 0;

        return (
          <div key={key} className="card overflow-hidden">
            {/* Header de etapa */}
            <div
              className={`px-6 py-4 ${
                key === "ANTES_ASAMBLEA" ? "bg-blue-700" : "bg-indigo-700"
              }`}
            >
              <h2 className="text-white font-bold text-base">{label}</h2>
              <p className="text-blue-200 text-xs mt-0.5">{subtitulo}</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${progreso}%` }}
                  />
                </div>
                <span className="text-white text-xs font-medium shrink-0">
                  {completados}/{items.length}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className={`px-6 py-4 ${item.completado ? "bg-green-50" : "bg-white"}`}>
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleItem(item.id, item.completado)}
                      className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        item.completado
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 hover:border-green-400"
                      }`}
                    >
                      {item.completado && (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {/* Título */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-gray-400 mr-2">
                            {item.orden}.
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              item.completado ? "line-through text-gray-400" : "text-gray-800"
                            }`}
                          >
                            {item.nombre}
                          </span>
                          {item.completado && item.fechaCompletado && (
                            <span className="ml-2 text-xs text-green-600">
                              ✓ {format(new Date(item.fechaCompletado), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 italic">
                          {item.referencia}
                        </span>
                      </div>

                      {/* Descripción */}
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {item.descripcion}
                      </p>

                      {/* Notas */}
                      <div className="mt-2">
                        {editNota?.id === item.id ? (
                          <div className="flex gap-2">
                            <textarea
                              rows={2}
                              className="input text-xs flex-1 resize-none"
                              placeholder="Notas internas..."
                              value={editNota.texto}
                              onChange={(e) =>
                                setEditNota({ id: item.id, texto: e.target.value })
                              }
                            />
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => guardarNota(item.id, editNota.texto)}
                                className="btn-primary text-xs px-3 py-1"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditNota(null)}
                                className="btn-secondary text-xs px-3 py-1"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            {item.notas && (
                              <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 flex-1">
                                📝 {item.notas}
                              </p>
                            )}
                            <button
                              onClick={() =>
                                setEditNota({ id: item.id, texto: item.notas ?? "" })
                              }
                              className="text-xs text-blue-500 hover:underline shrink-0"
                            >
                              {item.notas ? "Editar nota" : "+ Nota"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Documentos adjuntos */}
                      <div className="mt-3 space-y-1.5">
                        {item.documentos.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-1.5"
                          >
                            <span className="text-gray-400">📄</span>
                            <a
                              href={`/api/documentos/${doc.id}`}
                              target="_blank"
                              className="text-xs text-blue-600 hover:underline flex-1 truncate"
                            >
                              {doc.nombreOriginal}
                            </a>
                            <span className="text-xs text-gray-400 shrink-0">
                              {format(new Date(doc.subidoAt), "dd/MM/yy")}
                            </span>
                            <button
                              onClick={() => eliminarDoc(doc.id)}
                              className="text-xs text-red-400 hover:text-red-600 shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        {/* Subir archivo */}
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) subirArchivo(item.id, file);
                              e.target.value = "";
                            }}
                          />
                          {subiendo === item.id ? (
                            <span className="text-gray-500">Subiendo...</span>
                          ) : (
                            <>
                              <span>📎</span>
                              <span className="underline">Adjuntar documento</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
