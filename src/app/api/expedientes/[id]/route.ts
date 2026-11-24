import { NextRequest, NextResponse } from "next/server";
import { requireApiRol, requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deListado, manejarError, numeroEntero, texto } from "@/lib/validacion";
import { ESTADOS_EXPEDIENTE } from "@/lib/constantes";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiUser();
    const { id } = await params;
    const expediente = await prisma.expediente.findUnique({
      where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 },
      include: {
        cliente: true,
        responsable: { select: { id: true, nombre: true, email: true } },
        tareas: { include: { asignado: { select: { nombre: true } } }, orderBy: { creadaEn: "desc" } },
        audiencias: { orderBy: { fecha: "desc" } },
        notas: { include: { autor: { select: { nombre: true } } }, orderBy: { creadoEn: "desc" } },
        facturas: true,
        documentos: { orderBy: { subidoEn: "desc" } },
      },
    });
    if (!expediente) return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    return NextResponse.json(expediente);
  });
}

export async function PUT(req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO"]);
    const { id } = await params;
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const datos: Parameters<typeof prisma.expediente.update>[0]["data"] = {
      actualizadoEn: new Date(),
    };
    if (cuerpo.titulo !== undefined) datos.titulo = texto(cuerpo.titulo, "título");
    if (cuerpo.descripcion !== undefined) datos.descripcion = texto(cuerpo.descripcion, "descripción", false) || null;
    if (cuerpo.estado !== undefined) datos.estado = deListado(cuerpo.estado, [...ESTADOS_EXPEDIENTE], "estado", "ABIERTO");
    if (cuerpo.responsableId !== undefined) {
      const responsableId = numeroEntero(cuerpo.responsableId, "responsable", { obligatorio: true, min: 1 });
      datos.responsableId = responsableId ?? 0;
    }
    const expediente = await prisma.expediente.update({
      where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 },
      data: datos,
      include: { cliente: { select: { nombre: true } }, responsable: { select: { nombre: true } } },
    });
    return NextResponse.json(expediente);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO"]);
    const { id } = await params;
    await prisma.expediente.delete({ where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 } });
    return NextResponse.json({ ok: true });
  });
}
