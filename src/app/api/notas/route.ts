import { NextRequest, NextResponse } from "next/server";
import { requireApiRol, requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { manejarError, numeroEntero, texto } from "@/lib/validacion";

export async function GET(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    await requireApiUser();
    const expedienteId = req.nextUrl.searchParams.get("expedienteId");
    if (!expedienteId) return NextResponse.json({ error: "Falta expedienteId" }, { status: 400 });
    const notas = await prisma.nota.findMany({
      where: { expedienteId: Number(expedienteId) },
      include: { autor: { select: { nombre: true } } },
      orderBy: { creadoEn: "desc" },
    });
    return NextResponse.json(notas);
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    const usuario = await requireApiRol(["ADMIN", "ABOGADO", "ASISTENTE"]);
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const nota = await prisma.nota.create({
      data: {
        contenido: texto(cuerpo.contenido, "contenido"),
        expedienteId: numeroEntero(cuerpo.expedienteId, "expediente", { obligatorio: true, min: 1 }) ?? 0,
        autorId: usuario.id,
      },
      include: { autor: { select: { nombre: true } } },
    });
    return NextResponse.json(nota, { status: 201 });
  });
}
