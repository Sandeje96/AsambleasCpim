import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcularFechasLegales } from "@/lib/fechas";
import { getFeriadosNacionales } from "@/lib/feriados";
import { CHECKLIST_ANTES, CHECKLIST_DESPUES } from "@/lib/constants";

export async function GET() {
  try {
    const asambleas = await prisma.asamblea.findMany({
      orderBy: { anio: "desc" },
      include: {
        _count: { select: { checklistItems: true, fechasLegales: true, documentos: true } },
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { anio, fechaAsamblea, emailAlertas, notas } = body;

    if (!anio || !fechaAsamblea) {
      return NextResponse.json(
        { error: "El año y la fecha de asamblea son requeridos" },
        { status: 400 }
      );
    }

    const existe = await prisma.asamblea.findUnique({ where: { anio: Number(anio) } });
    if (existe) {
      return NextResponse.json(
        { error: `Ya existe una asamblea registrada para el año ${anio}` },
        { status: 409 }
      );
    }

    const [y, m, d] = (fechaAsamblea as string).split("-").map(Number);
    const fechaAsambleaDate = new Date(y, m - 1, d);
    const fechaCierreEjercicio = new Date(Number(anio), 3, 30);

    const feriados = await getFeriadosNacionales(Number(anio));
    const fechasCalc = calcularFechasLegales(fechaAsambleaDate, feriados);

    const asamblea = await prisma.$transaction(async (tx) => {
      const nueva = await tx.asamblea.create({
        data: {
          anio: Number(anio),
          fechaCierreEjercicio,
          fechaAsamblea: fechaAsambleaDate,
          emailAlertas: emailAlertas ?? null,
          notas: notas ?? null,
          estado: "EN_PROCESO",
        },
      });

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
