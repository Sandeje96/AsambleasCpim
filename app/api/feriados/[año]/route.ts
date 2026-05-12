import { NextResponse } from "next/server";
import { getFeriadosNacionales } from "@/lib/feriados";
import { format } from "date-fns";

// GET /api/feriados/[año]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ año: string }> }
) {
  const { año } = await params;
  try {
    const feriados = await getFeriadosNacionales(Number(año));
    return NextResponse.json(
      feriados.map((f) => ({ fecha: format(f, "yyyy-MM-dd") }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener feriados" }, { status: 500 });
  }
}
