import { PrismaClient } from "@prisma/client";
import { calcularFechasLegales } from "../lib/fechas";
import { getFeriadosNacionales } from "../lib/feriados";
import { CHECKLIST_ANTES, CHECKLIST_DESPUES } from "../lib/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding: Asamblea 2026...");

  const existe = await prisma.asamblea.findUnique({ where: { año: 2026 } });
  if (existe) {
    console.log("Ya existe la asamblea 2026. Seed omitido.");
    return;
  }

  // Fecha de asamblea: 29 de julio de 2026
  const fechaAsamblea = new Date(2026, 6, 29);
  const fechaCierre = new Date(2026, 3, 30);
  const feriados = await getFeriadosNacionales(2026);

  const asamblea = await prisma.asamblea.create({
    data: {
      año: 2026,
      fechaCierreEjercicio: fechaCierre,
      fechaAsamblea,
      emailAlertas: null,
      estado: "EN_PROCESO",
      notas: "Renovación parcial de autoridades – año 2026",
    },
  });

  const fechasCalc = calcularFechasLegales(fechaAsamblea, feriados);

  await prisma.fechaLegal.createMany({
    data: fechasCalc.map((f) => ({
      asambleaId: asamblea.id,
      codigo: f.codigo,
      nombre: f.nombre,
      descripcion: f.descripcion,
      referencia: f.referencia,
      tipo: f.tipo,
      etapa: f.etapa,
      fechaEstricta: f.fechaEstricta,
      fechaPlanificada: f.fechaPlanificada,
      unidad: f.unidad,
      diasBase: f.diasBase,
      colorClase: f.colorClase,
      orden: f.orden,
    })),
  });

  await prisma.checklistItem.createMany({
    data: [
      ...CHECKLIST_ANTES.map((item) => ({
        asambleaId: asamblea.id,
        etapa: item.etapa,
        orden: item.orden,
        codigo: item.codigo,
        nombre: item.nombre,
        descripcion: item.descripcion,
        referencia: item.referencia,
      })),
      ...CHECKLIST_DESPUES.map((item) => ({
        asambleaId: asamblea.id,
        etapa: item.etapa,
        orden: item.orden,
        codigo: item.codigo,
        nombre: item.nombre,
        descripcion: item.descripcion,
        referencia: item.referencia,
      })),
    ],
  });

  console.log(`✅ Asamblea 2026 creada (id: ${asamblea.id}) con ${fechasCalc.length} fechas y ${CHECKLIST_ANTES.length + CHECKLIST_DESPUES.length} ítems de checklist.`);

  // Mostrar tabla de fechas
  console.log("\n📅 Fechas calculadas para Asamblea 29/07/2026:");
  console.log("─".repeat(80));
  for (const f of fechasCalc) {
    const planStr = f.fechaPlanificada.toLocaleDateString("es-AR");
    const estrictaStr = f.fechaEstricta.toLocaleDateString("es-AR");
    console.log(`${String(f.orden).padStart(2)}. ${f.nombre.padEnd(50)} Plan: ${planStr}  Límite: ${estrictaStr}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
