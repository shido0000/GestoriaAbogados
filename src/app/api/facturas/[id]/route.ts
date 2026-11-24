import { NextRequest, NextResponse } from "next/server";
import { requireApiRol } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deListado, fecha, manejarError, numeroEntero, texto } from "@/lib/validacion";
import { ESTADOS_FACTURA } from "@/lib/constantes";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO"]);
    const { id } = await params;
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const datos: Parameters<typeof prisma.factura.update>[0]["data"] = {};
    if (cuerpo.concepto !== undefined) datos.concepto = texto(cuerpo.concepto, "concepto");
    if (cuerpo.base !== undefined) {
      const base = Number(cuerpo.base);
      if (!(base > 0)) return NextResponse.json({ error: "La base debe ser mayor que cero" }, { status: 400 });
      datos.base = base;
    }
    if (cuerpo.iva !== undefined) {
      const iva = Number(cuerpo.iva);
      if (iva < 0 || iva > 100 || isNaN(iva)) {
        return NextResponse.json({ error: "El IVA debe estar entre 0 y 100" }, { status: 400 });
      }
      datos.iva = iva;
    }
    if (cuerpo.estado !== undefined) {
      const estado = deListado(cuerpo.estado, [...ESTADOS_FACTURA], "estado", "BORRADOR");
      datos.estado = estado;
      if (estado === "EMITIDA" || estado === "PAGADA") datos.emitidaEn = new Date();
    }
    if (cuerpo.vencimientoEn !== undefined) datos.vencimientoEn = fecha(cuerpo.vencimientoEn, "vencimiento", false);
    const factura = await prisma.factura.update({
      where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 },
      data: datos,
      include: {
        cliente: { select: { nombre: true } },
        expediente: { select: { numero: true, titulo: true } },
      },
    });
    return NextResponse.json(factura);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO"]);
    const { id } = await params;
    await prisma.factura.delete({ where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 } });
    return NextResponse.json({ ok: true });
  });
}
