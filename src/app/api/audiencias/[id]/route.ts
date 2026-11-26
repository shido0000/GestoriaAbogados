import { NextRequest, NextResponse } from "next/server";
import { requireApiRol } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deListado, fecha, manejarError, numeroEntero, texto } from "@/lib/validacion";
import { TIPOS_AUDIENCIA } from "@/lib/constantes";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO", "ASISTENTE"]);
    const { id } = await params;
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const datos: Parameters<typeof prisma.audiencia.update>[0]["data"] = {};
    if (cuerpo.titulo !== undefined) datos.titulo = texto(cuerpo.titulo, "título");
    if (cuerpo.tipo !== undefined) datos.tipo = deListado(cuerpo.tipo, [...TIPOS_AUDIENCIA], "tipo", "VISTA");
    if (cuerpo.fecha !== undefined) datos.fecha = fecha(cuerpo.fecha, "fecha", true) as Date;
    if (cuerpo.lugar !== undefined) datos.lugar = texto(cuerpo.lugar, "lugar", false) || null;
    if (cuerpo.notas !== undefined) datos.notas = texto(cuerpo.notas, "notas", false) || null;
    const audiencia = await prisma.audiencia.update({
      where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 },
      data: datos,
    });
    return NextResponse.json(audiencia);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO"]);
    const { id } = await params;
    await prisma.audiencia.delete({ where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 } });
    return NextResponse.json({ ok: true });
  });
}
