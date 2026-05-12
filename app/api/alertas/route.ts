import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enviarAlertaDeadlines, enviarAlertaTest } from "@/lib/email";
import { differenceInCalendarDays } from "date-fns";

// POST /api/alertas — enviar alerta de email con los deadlines próximos
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { asambleaId, tipo, email } = body;

    // Prueba de configuración
    if (tipo === "TEST") {
      await enviarAlertaTest(email);
      return NextResponse.json({ ok: true, mensaje: "Email de prueba enviado" });
    }

    // Alerta real: buscar fechas no completadas
    const asamblea = await prisma.asamblea.findUnique({
      where: { id: Number(asambleaId) },
      include: { fechasLegales: { orderBy: { orden: "asc" } } },
    });

    if (!asamblea) {
      return NextResponse.json({ error: "Asamblea no encontrada" }, { status: 404 });
    }

    const hoy = new Date();
    const destinatario = email || asamblea.emailAlertas;

    if (!destinatario) {
      return NextResponse.json(
        { error: "No hay email configurado para esta asamblea" },
        { status: 400 }
      );
    }

    // Filtrar fechas pendientes con ≤30 días
    const items = asamblea.fechasLegales
      .filter((f) => !f.completado)
      .map((f) => ({
        nombre: f.nombre,
        fechaPlanificada: f.fechaPlanificada,
        fechaEstricta: f.fechaEstricta,
        diasRestantes: differenceInCalendarDays(f.fechaPlanificada, hoy),
        urgente: differenceInCalendarDays(f.fechaEstricta, hoy) <= 7,
      }))
      .filter((f) => f.diasRestantes <= 30)
      .sort((a, b) => a.diasRestantes - b.diasRestantes);

    if (items.length === 0) {
      return NextResponse.json({
        ok: true,
        mensaje: "No hay fechas próximas a vencer (dentro de 30 días)",
      });
    }

    await enviarAlertaDeadlines({
      to: destinatario,
      asambleaAño: asamblea.anio,
      items,
    });

    // Registrar el envío
    await prisma.alerta.create({
      data: {
        asambleaId: Number(asambleaId),
        tipo: "RECORDATORIO",
        mensaje: `Recordatorio con ${items.length} fechas próximas`,
        fechaEnvio: new Date(),
        enviada: true,
        email: destinatario,
      },
    });

    return NextResponse.json({ ok: true, itemsEnviados: items.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al enviar la alerta" }, { status: 500 });
  }
}
