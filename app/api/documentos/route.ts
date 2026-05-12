import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/documentos — subir un archivo PDF/documento
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const archivo = formData.get("archivo") as File | null;
    const asambleaId = formData.get("asambleaId") as string;
    const checklistItemId = formData.get("checklistItemId") as string | null;
    const nombre = (formData.get("nombre") as string) || archivo?.name || "documento";

    if (!archivo || !asambleaId) {
      return NextResponse.json(
        { error: "Archivo y asambleaId son requeridos" },
        { status: 400 }
      );
    }

    // Límite de 10 MB
    if (archivo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo supera los 10 MB" }, { status: 400 });
    }

    // Directorio de uploads
    const uploadDir =
      process.env.UPLOAD_DIR
        ? path.resolve(process.env.UPLOAD_DIR, asambleaId)
        : path.join(process.cwd(), "uploads", asambleaId);

    await mkdir(uploadDir, { recursive: true });

    // Nombre único para evitar colisiones
    const ext = path.extname(archivo.name);
    const baseName = path.basename(archivo.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueName = `${Date.now()}_${baseName}${ext}`;
    const rutaAbsoluta = path.join(uploadDir, uniqueName);
    const rutaRelativa = path.join(asambleaId, uniqueName);

    // Guardar en disco
    const buffer = Buffer.from(await archivo.arrayBuffer());
    await writeFile(rutaAbsoluta, buffer);

    // Registrar en base de datos
    const doc = await prisma.documento.create({
      data: {
        asambleaId: Number(asambleaId),
        checklistItemId: checklistItemId ? Number(checklistItemId) : null,
        nombre,
        nombreOriginal: archivo.name,
        rutaArchivo: rutaRelativa,
        mimeType: archivo.type,
        tamaño: archivo.size,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al subir el documento" }, { status: 500 });
  }
}
