import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/auth";
import PaginaTareas from "./PaginaTareas";

export const dynamic = "force-dynamic";

export default async function PaginaTareasServidor() {
  const usuario = await getUsuarioActual();
  const [tareas, usuarios, expedientes] = await Promise.all([
    prisma.tarea.findMany({
      include: {
        asignado: { select: { id: true, nombre: true } },
        expediente: { select: { id: true, numero: true, titulo: true } },
      },
      orderBy: [{ fechaVencimiento: "asc" }, { creadaEn: "desc" }],
    }),
    prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prisma.expediente.findMany({ select: { id: true, numero: true, titulo: true }, orderBy: { numero: "asc" } }),
  ]);

  return (
    <PaginaTareas
      tareas={tareas.map((t) => ({
        ...t,
        fechaVencimiento: t.fechaVencimiento ? t.fechaVencimiento.toISOString() : null,
        creadaEn: t.creadaEn.toISOString(),
      }))}
      usuarios={usuarios}
      expedientes={expedientes}
      usuarioId={usuario?.id ?? 0}
    />
  );
}
