import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT /api/fechas/[id] — marcar una fecha legal como completada o actualizar notas
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { completado, notas } = body;

    const fecha = await prisma.fechaLegal.update({
      where: { id: Number(id) },
      data: {
        ...(completado !== undefined && {
          completado,
          fechaCompletado: completado ? new Date() : null,
        }),
        ...(notas !== undefined && { notas }),
      },
    });

    return NextResponse.json(fecha);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar la fecha" }, { status: 500 });
  }
}
