import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcularFechasLegales } from "@/lib/fechas";
import { getFeriadosNacionales } from "@/lib/feriados";
import { CHECKLIST_ANTES, CHECKLIST_DESPUES } from "@/lib/constants";

// GET /api/asambleas — lista todas las asambleas
export async function GET() {
  try {
    const asambleas = await prisma.asamblea.findMany({
      orderBy: { año: "desc" },
      include: {
        _count: {
          select: {
            checklistItems: true,
            fechasLegales: true,
            documentos: true,
          },
        },
        checklistItems: { select: { completado: true } },
        fechasLegales: { select: { completado: true } },
      },
    });
    return NextResponse.json(asambleas);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener asambleas" }, { status: 500 });
  }
}

// POST /api/asambleas — crea una nueva asamblea y calcula todas las fechas
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { año, fechaAsamblea, emailAlertas, notas } = body;

    if (!año || !fechaAsamblea) {
      return NextResponse.json(
        { error: "El año y la fecha de asamblea son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que no exista ya una asamblea para ese año
    const existe = await prisma.asamblea.findUnique({ where: { año: Number(año) } });
    if (existe) {
      return NextResponse.json(
        { error: `Ya existe una asamblea registrada para el año ${año}` },
        { status: 409 }
      );
    }

    // Fecha de asamblea y cierre de ejercicio
    const [y, m, d] = (fechaAsamblea as string).split("-").map(Number);
    const fechaAsambleaDate = new Date(y, m - 1, d);
    const fechaCierreEjercicio = new Date(Number(año), 3, 30); // 30 de abril

    // Obtener feriados del año para calcular días hábiles
    const feriados = await getFeriadosNacionales(Number(año));

    // Calcular todas las fechas legales
    const fechasCalc = calcularFechasLegales(fechaAsambleaDate, feriados);

    // Crear asamblea con fechas y checklist en una transacción
    const asamblea = await prisma.$transaction(async (tx) => {
      const nueva = await tx.asamblea.create({
        data: {
          año: Number(año),
          fechaCierreEjercicio,
          fechaAsamblea: fechaAsambleaDate,
          emailAlertas: emailAlertas ?? null,
          notas: notas ?? null,
          estado: "EN_PROCESO",
        },
      });

      // Guardar fechas legales calculadas
      await tx.fechaLegal.createMany({
        data: fechasCalc.map((f) => ({
          asambleaId: nueva.id,
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

      // Crear checklist de documentos (antes y después)
      await tx.checklistItem.createMany({
        data: [
          ...CHECKLIST_ANTES.map((item) => ({
            asambleaId: nueva.id,
            etapa: item.etapa,
            orden: item.orden,
            codigo: item.codigo,
            nombre: item.nombre,
            descripcion: item.descripcion,
            referencia: item.referencia,
          })),
          ...CHECKLIST_DESPUES.map((item) => ({
            asambleaId: nueva.id,
            etapa: item.etapa,
            orden: item.orden,
            codigo: item.codigo,
            nombre: item.nombre,
            descripcion: item.descripcion,
            referencia: item.referencia,
          })),
        ],
      });

      return nueva;
    });

    return NextResponse.json(asamblea, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear la asamblea" }, { status: 500 });
  }
}
