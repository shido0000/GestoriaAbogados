import { NextRequest, NextResponse } from "next/server";
import { requireApiRol, requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deListado, fecha, manejarError, numeroEntero, texto } from "@/lib/validacion";
import { ESTADOS_TAREA, PRIORIDADES } from "@/lib/constantes";

export async function GET(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    await requireApiUser();
    const sp = req.nextUrl.searchParams;
    const tareas = await prisma.tarea.findMany({
      where: {
        estado: sp.get("estado") ?? undefined,
        asignadoId: sp.get("asignadoId") ? Number(sp.get("asignadoId")) : undefined,
        expedienteId: sp.get("expedienteId") ? Number(sp.get("expedienteId")) : undefined,
      },
      include: {
        asignado: { select: { nombre: true } },
        expediente: { select: { numero: true, titulo: true } },
      },
      orderBy: [{ fechaVencimiento: "asc" }, { creadaEn: "desc" }],
    });
    return NextResponse.json(tareas);
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO", "ASISTENTE"]);
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const asignadoId = numeroEntero(cuerpo.asignadoId, "asignado a", { obligatorio: true, min: 1 });
    const tarea = await prisma.tarea.create({
      data: {
        titulo: texto(cuerpo.titulo, "título"),
        descripcion: texto(cuerpo.descripcion, "descripción", false) || null,
        estado: deListado(cuerpo.estado, [...ESTADOS_TAREA], "estado", "PENDIENTE"),
        prioridad: deListado(cuerpo.prioridad, [...PRIORIDADES], "prioridad", "MEDIA"),
        fechaVencimiento: fecha(cuerpo.fechaVencimiento, "fecha de vencimiento", false),
        expedienteId: numeroEntero(cuerpo.expedienteId, "expediente", { min: 1 }),
        asignadoId: asignadoId ?? 0,
      },
      include: {
        asignado: { select: { nombre: true } },
        expediente: { select: { numero: true, titulo: true } },
      },
    });
    return NextResponse.json(tarea, { status: 201 });
  });
}
