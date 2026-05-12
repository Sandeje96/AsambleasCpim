import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/asambleas/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const asamblea = await prisma.asamblea.findUnique({
      where: { id: Number(id) },
      include: {
        fechasLegales: { orderBy: { orden: "asc" } },
        checklistItems: { orderBy: [{ etapa: "asc" }, { orden: "asc" }] },
        documentos: { orderBy: { subidoAt: "desc" } },
        alertas: { orderBy: { fechaEnvio: "asc" } },
      },
    });

    if (!asamblea) {
      return NextResponse.json({ error: "Asamblea no encontrada" }, { status: 404 });
    }

    return NextResponse.json(asamblea);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener la asamblea" }, { status: 500 });
  }
}

// PUT /api/asambleas/[id] — actualizar estado o email
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { estado, emailAlertas, notas } = body;

    const asamblea = await prisma.asamblea.update({
      where: { id: Number(id) },
      data: {
        ...(estado && { estado }),
        ...(emailAlertas !== undefined && { emailAlertas }),
        ...(notas !== undefined && { notas }),
      },
    });

    return NextResponse.json(asamblea);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar la asamblea" }, { status: 500 });
  }
}

// DELETE /api/asambleas/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.asamblea.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar la asamblea" }, { status: 500 });
  }
}
