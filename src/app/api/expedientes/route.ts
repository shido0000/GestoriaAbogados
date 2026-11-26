import { NextRequest, NextResponse } from "next/server";
import { requireApiRol, requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deListado, manejarError, numeroEntero, texto } from "@/lib/validacion";
import { ESTADOS_EXPEDIENTE } from "@/lib/constantes";

export async function GET(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    await requireApiUser();
    const sp = req.nextUrl.searchParams;
    const estado = sp.get("estado");
    const clienteId = sp.get("clienteId");
    const expedientes = await prisma.expediente.findMany({
      where: {
        estado: estado ?? undefined,
        clienteId: clienteId ? Number(clienteId) : undefined,
      },
      include: {
        cliente: { select: { nombre: true } },
        responsable: { select: { nombre: true } },
        _count: { select: { tareas: true, audiencias: true, documentos: true, facturas: true } },
      },
      orderBy: { creadoEn: "desc" },
    });
    return NextResponse.json(expedientes);
  });
}

async function generarNumeroExpediente(): Promise<string> {
  const anio = new Date().getFullYear();
  const total = await prisma.expediente.count({
    where: { numero: { startsWith: `EXP-${anio}-` } },
  });
  let secuencia = total;
  for (;;) {
    secuencia += 1;
    const candidato = `EXP-${anio}-${String(secuencia).padStart(4, "0")}`;
    const existente = await prisma.expediente.findUnique({ where: { numero: candidato } });
    if (!existente) return candidato;
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO"]);
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const clienteId = numeroEntero(cuerpo.clienteId, "cliente", { obligatorio: true, min: 1 });
    const responsableId = numeroEntero(cuerpo.responsableId, "responsable", { obligatorio: true, min: 1 });
    if (clienteId !== null) {
      const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
      if (!cliente) throw new Error("Cliente no encontrado");
    }
    if (responsableId !== null) {
      const responsable = await prisma.usuario.findUnique({ where: { id: responsableId } });
      if (!responsable) throw new Error("Responsable no encontrado");
    }
    const expediente = await prisma.expediente.create({
      data: {
        numero: await generarNumeroExpediente(),
        titulo: texto(cuerpo.titulo, "título"),
        descripcion: texto(cuerpo.descripcion, "descripción", false) || null,
        estado: deListado(cuerpo.estado, [...ESTADOS_EXPEDIENTE], "estado", "ABIERTO"),
        clienteId: clienteId ?? 0,
        responsableId: responsableId ?? 0,
      },
      include: { cliente: { select: { nombre: true } }, responsable: { select: { nombre: true } } },
    });
    return NextResponse.json(expediente, { status: 201 });
  });
}
