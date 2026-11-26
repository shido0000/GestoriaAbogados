import { NextRequest, NextResponse } from "next/server";
import { requireApiRol, requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deListado, manejarError, numeroEntero, texto } from "@/lib/validacion";
import { TIPOS_CLIENTE } from "@/lib/constantes";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiUser();
    const { id } = await params;
    const cliente = await prisma.cliente.findUnique({
      where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 },
      include: {
        expedientes: { orderBy: { creadoEn: "desc" } },
        _count: { select: { documentos: true, facturas: true } },
      },
    });
    if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    return NextResponse.json(cliente);
  });
}

export async function PUT(req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO"]);
    const { id } = await params;
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const cliente = await prisma.cliente.update({
      where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 },
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
    return NextResponse.json(cliente);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN"]);
    const { id } = await params;
    const idCliente = numeroEntero(id, "id", { obligatorio: true }) ?? 0;
    const hayExpedientes = await prisma.expediente.count({ where: { clienteId: idCliente } });
    if (hayExpedientes > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un cliente con expedientes asociados" },
        { status: 409 },
      );
    }
    await prisma.cliente.delete({ where: { id: idCliente } });
    return NextResponse.json({ ok: true });
  });
}
