export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";

function getEstadoBadge(diasRestantes: number, completado: boolean) {
  if (completado) return { clase: "badge-completado", texto: "Completado" };
  if (diasRestantes < 0) return { clase: "badge-vence-hoy", texto: `Vencida hace ${Math.abs(diasRestantes)}d` };
  if (diasRestantes === 0) return { clase: "badge-vence-hoy", texto: "Vence HOY" };
  if (diasRestantes <= 5) return { clase: "badge-urgente", texto: `${diasRestantes}d restantes` };
  if (diasRestantes <= 15) return { clase: "badge-proximo", texto: `${diasRestantes}d restantes` };
  return { clase: "badge-ok", texto: `${diasRestantes}d restantes` };
}

export default async function DashboardPage() {
  const asambleas = await prisma.asamblea.findMany({
    orderBy: { anio: "desc" },
    include: {
      fechasLegales: {
        orderBy: { orden: "asc" },
      },
      checklistItems: { select: { completado: true } },
    },
  });

  const hoy = new Date();

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {format(hoy, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <Link href="/asamblea/nueva" className="btn-primary">
          + Nueva Asamblea
        </Link>
      </div>

      {asambleas.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No hay asambleas registradas
          </h2>
          <p className="text-gray-500 mb-6">
            Crea la primera asamblea para comenzar a gestionar las fechas y documentos.
          </p>
          <Link href="/asamblea/nueva" className="btn-primary mx-auto">
            Crear Asamblea 2026
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {asambleas.map((asamblea) => {
            const hoy = new Date();
            const fechaAsamblea = new Date(asamblea.fechaAsamblea);
            const diasParaAsamblea = differenceInCalendarDays(fechaAsamblea, hoy);

            // Próximas fechas pendientes
            const fechasPendientes = asamblea.fechasLegales
              .filter((f) => !f.completado)
              .map((f) => ({
                ...f,
                diasRestantes: differenceInCalendarDays(new Date(f.fechaPlanificada), hoy),
                diasRestantesEstricta: differenceInCalendarDays(new Date(f.fechaEstricta), hoy),
              }))
              .sort((a, b) => a.diasRestantes - b.diasRestantes);

            const totalItems = asamblea.checklistItems.length;
            const completadosItems = asamblea.checklistItems.filter((c) => c.completado).length;
            const totalFechas = asamblea.fechasLegales.length;
            const completadasFechas = asamblea.fechasLegales.filter((f) => f.completado).length;
            const progresoFechas = totalFechas > 0 ? Math.round((completadasFechas / totalFechas) * 100) : 0;
            const progresoChecklist = totalItems > 0 ? Math.round((completadosItems / totalItems) * 100) : 0;

            const urgentes = fechasPendientes.filter((f) => f.diasRestantesEstricta <= 7).length;

            return (
              <div key={asamblea.id} className="card overflow-hidden">
                {/* Header */}
                <div className="bg-cpim-blue px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-white font-bold text-lg">
                      Asamblea Ordinaria {asamblea.anio}
                    </h2>
                    <p className="text-blue-200 text-sm">
                      {format(fechaAsamblea, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                      {diasParaAsamblea > 0
                        ? ` — faltan ${diasParaAsamblea} días`
                        : diasParaAsamblea === 0
                        ? " — ¡HOY!"
                        : ` — hace ${Math.abs(diasParaAsamblea)} días`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {urgentes > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        ⚠️ {urgentes} urgentes
                      </span>
                    )}
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        asamblea.estado === "REALIZADA"
                          ? "bg-green-500 text-white"
                          : asamblea.estado === "CANCELADA"
                          ? "bg-red-500 text-white"
                          : "bg-yellow-400 text-yellow-900"
                      }`}
                    >
                      {asamblea.estado === "EN_PROCESO"
                        ? "En Proceso"
                        : asamblea.estado === "REALIZADA"
                        ? "Realizada"
                        : "Cancelada"}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Progreso */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                      Progreso
                    </h3>
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Fechas completadas</span>
                        <span className="font-medium">{completadasFechas}/{totalFechas}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cpim-blue rounded-full transition-all"
                          style={{ width: `${progresoFechas}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Documentos completos</span>
                        <span className="font-medium">{completadosItems}/{totalItems}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${progresoChecklist}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Próximas fechas */}
                  <div className="lg:col-span-2">
                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
                      Próximas Fechas Pendientes
                    </h3>
                    {fechasPendientes.length === 0 ? (
                      <p className="text-green-600 text-sm font-medium">
                        ✓ Todas las fechas están completadas
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {fechasPendientes.slice(0, 5).map((f) => {
                          const badge = getEstadoBadge(f.diasRestantes, false);
                          return (
                            <div
                              key={f.id}
                              className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0"
                            >
                              <span className="text-gray-700 truncate pr-4">{f.nombre}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-gray-400 text-xs">
                                  {format(new Date(f.fechaPlanificada), "dd/MM/yyyy")}
                                </span>
                                <span className={badge.clase}>{badge.texto}</span>
                              </div>
                            </div>
                          );
                        })}
                        {fechasPendientes.length > 5 && (
                          <p className="text-gray-400 text-xs">
                            + {fechasPendientes.length - 5} más...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2">
                  <Link href={`/asamblea/${asamblea.id}`} className="btn-primary text-xs px-3 py-1.5">
                    Ver Calendario
                  </Link>
                  <Link href={`/asamblea/${asamblea.id}/checklist`} className="btn-secondary text-xs px-3 py-1.5">
                    Checklist Documentos
                  </Link>
                  <Link href={`/asamblea/${asamblea.id}/documentos`} className="btn-secondary text-xs px-3 py-1.5">
                    Archivos PDF
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
