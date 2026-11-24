import { NextRequest, NextResponse } from "next/server";
import { requireApiRol, requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deListado, fecha, manejarError, numeroEntero, texto } from "@/lib/validacion";
import { ESTADOS_TAREA, PRIORIDADES } from "@/lib/constantes";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO", "ASISTENTE"]);
    const { id } = await params;
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const datos: Parameters<typeof prisma.tarea.update>[0]["data"] = {};
    if (cuerpo.titulo !== undefined) datos.titulo = texto(cuerpo.titulo, "título");
    if (cuerpo.descripcion !== undefined) datos.descripcion = texto(cuerpo.descripcion, "descripción", false) || null;
    if (cuerpo.estado !== undefined) datos.estado = deListado(cuerpo.estado, [...ESTADOS_TAREA], "estado", "PENDIENTE");
    if (cuerpo.prioridad !== undefined) datos.prioridad = deListado(cuerpo.prioridad, [...PRIORIDADES], "prioridad", "MEDIA");
    if (cuerpo.fechaVencimiento !== undefined) {
      datos.fechaVencimiento = fecha(cuerpo.fechaVencimiento, "fecha de vencimiento", false);
    }
    if (cuerpo.asignadoId !== undefined) {
      datos.asignadoId = numeroEntero(cuerpo.asignadoId, "asignado a", { obligatorio: true, min: 1 }) ?? 0;
    }
    const tarea = await prisma.tarea.update({
      where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 },
      data: datos,
      include: {
        asignado: { select: { nombre: true } },
        expediente: { select: { numero: true, titulo: true } },
      },
    });
    return NextResponse.json(tarea);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO", "ASISTENTE"]);
    const { id } = await params;
    await prisma.tarea.delete({ where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 } });
    return NextResponse.json({ ok: true });
  });
}
