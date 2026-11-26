import { NextRequest, NextResponse } from "next/server";
import { requireApiRol, requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deListado, fecha, manejarError, numeroEntero, texto } from "@/lib/validacion";
import { ESTADOS_FACTURA } from "@/lib/constantes";

export async function GET(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    await requireApiUser();
    const sp = req.nextUrl.searchParams;
    const facturas = await prisma.factura.findMany({
      where: {
        estado: sp.get("estado") ?? undefined,
        clienteId: sp.get("clienteId") ? Number(sp.get("clienteId")) : undefined,
        expedienteId: sp.get("expedienteId") ? Number(sp.get("expedienteId")) : undefined,
      },
      include: {
        cliente: { select: { nombre: true } },
        expediente: { select: { numero: true, titulo: true } },
      },
      orderBy: { id: "desc" },
    });
    return NextResponse.json(facturas);
  });
}

async function generarNumeroFactura(): Promise<string> {
  const anio = new Date().getFullYear();
  const total = await prisma.factura.count({
    where: { numero: { startsWith: `FAC-${anio}-` } },
  });
  let secuencia = total;
  for (;;) {
    secuencia += 1;
    const candidato = `FAC-${anio}-${String(secuencia).padStart(4, "0")}`;
    const existente = await prisma.factura.findUnique({ where: { numero: candidato } });
    if (!existente) return candidato;
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO"]);
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const base = Number(cuerpo.base);
    if (!(base > 0)) return NextResponse.json({ error: "La base debe ser mayor que cero" }, { status: 400 });
    const iva = cuerpo.iva == null || cuerpo.iva === "" ? 21 : Number(cuerpo.iva);
    if (iva < 0 || iva > 100 || isNaN(iva)) {
      return NextResponse.json({ error: "El IVA debe estar entre 0 y 100" }, { status: 400 });
    }
    const factura = await prisma.factura.create({
      data: {
        numero: await generarNumeroFactura(),
        concepto: texto(cuerpo.concepto, "concepto"),
        base,
        iva,
        emitidaEn: cuerpo.estado === "EMITIDA" || cuerpo.estado === "PAGADA" ? new Date() : null,
        vencimientoEn: fecha(cuerpo.vencimientoEn, "vencimiento", false),
        estado: deListado(cuerpo.estado, [...ESTADOS_FACTURA], "estado", "BORRADOR"),
        expedienteId: numeroEntero(cuerpo.expedienteId, "expediente", { min: 1 }),
        clienteId: numeroEntero(cuerpo.clienteId, "cliente", { obligatorio: true, min: 1 }) ?? 0,
      },
      include: {
        cliente: { select: { nombre: true } },
        expediente: { select: { numero: true, titulo: true } },
      },
    });
    return NextResponse.json(factura, { status: 201 });
  });
}
