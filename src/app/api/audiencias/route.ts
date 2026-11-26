import { NextRequest, NextResponse } from "next/server";
import { requireApiRol, requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deListado, fecha, manejarError, numeroEntero, texto } from "@/lib/validacion";
import { TIPOS_AUDIENCIA } from "@/lib/constantes";

export async function GET(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    await requireApiUser();
    const sp = req.nextUrl.searchParams;
    const audiencias = await prisma.audiencia.findMany({
      where: {
        expedienteId: sp.get("expedienteId") ? Number(sp.get("expedienteId")) : undefined,
        fecha: sp.get("futuras") === "1" ? { gte: new Date() } : undefined,
      },
      include: {
        expediente: {
          select: { numero: true, titulo: true, cliente: { select: { nombre: true } } },
        },
      },
      orderBy: { fecha: "asc" },
    });
    return NextResponse.json(audiencias);
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO", "ASISTENTE"]);
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const audiencia = await prisma.audiencia.create({
      data: {
        titulo: texto(cuerpo.titulo, "título"),
        tipo: deListado(cuerpo.tipo, [...TIPOS_AUDIENCIA], "tipo", "VISTA"),
        fecha: fecha(cuerpo.fecha, "fecha", true) as Date,
        lugar: texto(cuerpo.lugar, "lugar", false) || null,
        notas: texto(cuerpo.notas, "notas", false) || null,
        expedienteId: numeroEntero(cuerpo.expedienteId, "expediente", { obligatorio: true, min: 1 }) ?? 0,
      },
      include: {
        expediente: {
          select: { numero: true, titulo: true, cliente: { select: { nombre: true } } },
        },
      },
    });
    return NextResponse.json(audiencia, { status: 201 });
  });
}
