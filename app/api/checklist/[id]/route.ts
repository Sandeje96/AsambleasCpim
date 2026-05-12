import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT /api/checklist/[id] — toggle completado + notas
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { completado, notas } = body;

    const item = await prisma.checklistItem.update({
      where: { id: Number(id) },
      data: {
        ...(completado !== undefined && {
          completado,
          fechaCompletado: completado ? new Date() : null,
        }),
        ...(notas !== undefined && { notas }),
      },
      include: { documentos: true },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar el ítem" }, { status: 500 });
  }
}
