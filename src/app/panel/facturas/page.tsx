import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/auth";
import { puede } from "@/lib/constantes";
import PaginaFacturas from "./PaginaFacturas";

export const dynamic = "force-dynamic";

export default async function PaginaFacturasServidor() {
  const usuario = await getUsuarioActual();
  const [facturas, clientes, expedientes] = await Promise.all([
    prisma.factura.findMany({
      include: {
        cliente: { select: { nombre: true } },
        expediente: { select: { numero: true, titulo: true } },
      },
      orderBy: { id: "desc" },
    }),
    prisma.cliente.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prisma.expediente.findMany({ select: { id: true, numero: true, titulo: true }, orderBy: { numero: "asc" } }),
  ]);

  return (
    <PaginaFacturas
      facturas={facturas.map((f) => ({
        ...f,
        emitidaEn: f.emitidaEn ? f.emitidaEn.toISOString() : null,
        vencimientoEn: f.vencimientoEn ? f.vencimientoEn.toISOString() : null,
      }))}
      clientes={clientes}
      expedientes={expedientes}
      puedeGestionar={puede(usuario?.rol ?? "ASISTENTE", "facturas")}
    />
  );
}
