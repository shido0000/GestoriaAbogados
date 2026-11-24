import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/auth";
import { puede } from "@/lib/constantes";
import PaginaExpedientes from "./PaginaExpedientes";

export const dynamic = "force-dynamic";

export default async function PaginaExpedientesServidor() {
  const usuario = await getUsuarioActual();
  const [expedientes, clientes, usuarios] = await Promise.all([
    prisma.expediente.findMany({
      include: {
        cliente: { select: { nombre: true } },
        responsable: { select: { nombre: true } },
        _count: { select: { tareas: true, audiencias: true, documentos: true, facturas: true } },
      },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.cliente.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prisma.usuario.findMany({
      where: { rol: { in: ["ADMIN", "ABOGADO"] }, activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <PaginaExpedientes
      expedientes={expedientes.map((e) => ({ ...e, creadoEn: e.creadoEn.toISOString() }))}
      clientes={clientes}
      usuarios={usuarios}
      rol={usuario?.rol ?? "ASISTENTE"}
      usuarioId={usuario?.id ?? 0}
      puedeEditar={puede(usuario?.rol ?? "ASISTENTE", "expedientes")}
      puedeEliminar={puede(usuario?.rol ?? "ASISTENTE", "eliminar")}
    />
  );
}
