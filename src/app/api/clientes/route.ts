import { NextRequest, NextResponse } from "next/server";
import { requireApiRol, requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deListado, manejarError, texto } from "@/lib/validacion";
import { TIPOS_CLIENTE } from "@/lib/constantes";

export async function GET(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    await requireApiUser();
    const busqueda = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const clientes = await prisma.cliente.findMany({
      where: busqueda
        ? {
            OR: [
              { nombre: { contains: busqueda } },
              { identificacion: { contains: busqueda } },
              { email: { contains: busqueda } },
            ],
          }
        : undefined,
      include: { _count: { select: { expedientes: true, documentos: true } } },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(clientes);
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO"]);
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const cliente = await prisma.cliente.create({
      data: {
        nombre: texto(cuerpo.nombre, "nombre"),
        tipo: deListado(cuerpo.tipo, [...TIPOS_CLIENTE], "tipo", "PARTICULAR"),
        identificacion: texto(cuerpo.identificacion, "DNI/NIF"),
        email: texto(cuerpo.email, "email", false) || null,
        telefono: texto(cuerpo.telefono, "teléfono", false) || null,
        direccion: texto(cuerpo.direccion, "dirección", false) || null,
        notas: texto(cuerpo.notas, "notas", false) || null,
      },
    });
    return NextResponse.json(cliente, { status: 201 });
  });
}
