"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

interface Documento {
  id: number;
  nombre: string;
  nombreOriginal: string;
  mimeType: string;
  tamaño: number;
  subidoAt: string;
  checklistItemId: number | null;
}

interface Asamblea {
  id: number;
  anio: number;
  documentos: Documento[];
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocIcon({ mimeType }: { mimeType: string }) {
  if (mimeType?.includes("pdf")) return <span className="text-2xl">📕</span>;
  if (mimeType?.includes("word") || mimeType?.includes("document"))
    return <span className="text-2xl">📘</span>;
  if (mimeType?.includes("image")) return <span className="text-2xl">🖼️</span>;
  return <span className="text-2xl">📄</span>;
}

export default function DocumentosPage() {
  const { id } = useParams<{ id: string }>();
  const [asamblea, setAsamblea] = useState<Asamblea | null>(null);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [nombreCustom, setNombreCustom] = useState("");
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/asambleas/${id}`);
    const data = await res.json();
    setAsamblea(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  async function subirArchivo(file: File, nombre?: string) {
    setSubiendo(true);
    const fd = new FormData();
    fd.append("archivo", file);
    fd.append("asambleaId", String(id));
    fd.append("nombre", nombre || file.name);
    await fetch("/api/documentos", { method: "POST", body: fd });
    setSubiendo(false);
    setArchivoSeleccionado(null);
    setNombreCustom("");
    cargar();
  }

  async function eliminar(docId: number) {
    if (!confirm("¿Eliminar este documento?")) return;
    await fetch(`/api/documentos/${docId}`, { method: "DELETE" });
    cargar();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) setArchivoSeleccionado(file);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>;
  }
  if (!asamblea) return null;

  const docsLibres = asamblea.documentos.filter((d) => !d.checklistItemId);
  const docsChecklist = asamblea.documentos.filter((d) => d.checklistItemId !== null);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Archivos PDF — {asamblea.anio}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Repositorio central de documentos de la asamblea
          </p>
        </div>
        <Link href={`/asamblea/${id}`} className="btn-secondary">
          ← Volver
        </Link>
      </div>

      {/* Zona de upload */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Subir Documento</h2>

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            drag ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          {archivoSeleccionado ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                📄 {archivoSeleccionado.name}{" "}
                <span className="text-gray-400 font-normal">
                  ({formatBytes(archivoSeleccionado.size)})
                </span>
              </p>
              <input
                type="text"
                placeholder="Nombre descriptivo (opcional)"
                className="input max-w-sm mx-auto"
                value={nombreCustom}
                onChange={(e) => setNombreCustom(e.target.value)}
              />
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => subirArchivo(archivoSeleccionado, nombreCustom || undefined)}
                  className="btn-primary"
                  disabled={subiendo}
                >
                  {subiendo ? "Subiendo..." : "Confirmar upload"}
                </button>
                <button
                  onClick={() => setArchivoSeleccionado(null)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-4xl mb-2">📁</p>
              <p className="text-sm text-gray-600 mb-3">
                Arrastrá un archivo aquí, o hacé click para seleccionar
              </p>
              <label className="btn-secondary cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setArchivoSeleccionado(f);
                  }}
                />
                Seleccionar archivo
              </label>
              <p className="text-xs text-gray-400 mt-2">
                PDF, Word, imagen — máx. 10 MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Documentos libres (no asociados a checklist) */}
      {docsLibres.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 bg-gray-700">
            <h2 className="text-white font-semibold">Documentos Generales</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {docsLibres.map((doc) => (
              <div key={doc.id} className="px-6 py-3 flex items-center gap-4">
                <DocIcon mimeType={doc.mimeType} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {doc.nombreOriginal} · {formatBytes(doc.tamano ?? 0)} ·{" "}
                    {format(new Date(doc.subidoAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/api/documentos/${doc.id}`}
                    target="_blank"
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Descargar
                  </a>
                  <button onClick={() => eliminar(doc.id)} className="btn-danger">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documentos del checklist */}
      {docsChecklist.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 bg-blue-700">
            <h2 className="text-white font-semibold">Documentos del Checklist</h2>
            <p className="text-blue-200 text-xs mt-0.5">
              Subidos desde el checklist de documentos
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {docsChecklist.map((doc) => (
              <div key={doc.id} className="px-6 py-3 flex items-center gap-4">
                <DocIcon mimeType={doc.mimeType} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {doc.nombreOriginal} · {formatBytes(doc.tamano ?? 0)} ·{" "}
                    {format(new Date(doc.subidoAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/api/documentos/${doc.id}`}
                    target="_blank"
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Descargar
                  </a>
                  <button onClick={() => eliminar(doc.id)} className="btn-danger">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {asamblea.documentos.length === 0 && (
        <div className="card p-8 text-center text-gray-400">
          <p className="text-4xl mb-2">📂</p>
          <p>Todavía no hay documentos subidos.</p>
          <p className="text-sm mt-1">
            Podés subir documentos aquí o directamente desde el{" "}
            <Link href={`/asamblea/${id}/checklist`} className="text-blue-500 underline">
              checklist
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
