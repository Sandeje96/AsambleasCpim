import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { completado, notas, fechaPlanificada } = body;

    // Parsear fecha planificada sin conversión de zona horaria
    let fechaPlanificadaDate: Date | undefined;
    if (fechaPlanificada) {
      const [y, m, d] = (fechaPlanificada as string).split("-").map(Number);
      fechaPlanificadaDate = new Date(y, m - 1, d);
    }

    const fecha = await prisma.fechaLegal.update({
      where: { id: Number(id) },
      data: {
        ...(completado !== undefined && {
          completado,
          fechaCompletado: completado ? new Date() : null,
        }),
        ...(notas !== undefined && { notas }),
        ...(fechaPlanificadaDate && { fechaPlanificada: fechaPlanificadaDate }),
      },
    });

    return NextResponse.json(fecha);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar la fecha" }, { status: 500 });
  }
}
