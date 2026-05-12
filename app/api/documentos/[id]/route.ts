import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unlink, readFile } from "fs/promises";
import path from "path";

// GET /api/documentos/[id] — descargar un archivo
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const doc = await prisma.documento.findUnique({ where: { id: Number(id) } });
    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    const uploadBase =
      process.env.UPLOAD_DIR
        ? path.resolve(process.env.UPLOAD_DIR)
        : path.join(process.cwd(), "uploads");

    const rutaAbsoluta = path.join(uploadBase, doc.rutaArchivo);
    const buffer = await readFile(rutaAbsoluta);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.mimeType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.nombreOriginal)}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al descargar el documento" }, { status: 500 });
  }
}

// DELETE /api/documentos/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const doc = await prisma.documento.findUnique({ where: { id: Number(id) } });
    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    // Eliminar archivo físico
    const uploadBase =
      process.env.UPLOAD_DIR
        ? path.resolve(process.env.UPLOAD_DIR)
        : path.join(process.cwd(), "uploads");

    try {
      await unlink(path.join(uploadBase, doc.rutaArchivo));
    } catch {
      // Si el archivo no existe físicamente, continuar igual
    }

    await prisma.documento.delete({ where: { id: Number(id) } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar el documento" }, { status: 500 });
  }
}
