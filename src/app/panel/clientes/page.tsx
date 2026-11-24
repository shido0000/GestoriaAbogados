import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/auth";
import { puede } from "@/lib/constantes";
import PaginaClientes from "./PaginaClientes";

export const dynamic = "force-dynamic";

export default async function PaginaClientesServidor() {
  const usuario = await getUsuarioActual();
  const clientes = await prisma.cliente.findMany({
    include: { _count: { select: { expedientes: true, documentos: true } } },
    orderBy: { nombre: "asc" },
  });

  return (
    <PaginaClientes
      clientes={clientes.map((c) => ({
        ...c,
        creadoEn: c.creadoEn.toISOString(),
      }))}
      puedeEditar={puede(usuario?.rol ?? "ASISTENTE", "escribir")}
      puedeEliminar={puede(usuario?.rol ?? "ASISTENTE", "eliminar")}
    />
  );
}
