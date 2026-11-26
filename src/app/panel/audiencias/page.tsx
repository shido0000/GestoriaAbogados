import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/auth";
import { puede } from "@/lib/constantes";
import PaginaAudiencias from "./PaginaAudiencias";

export const dynamic = "force-dynamic";

export default async function PaginaAudienciasServidor() {
  const usuario = await getUsuarioActual();
  const [audiencias, expedientes] = await Promise.all([
    prisma.audiencia.findMany({
      include: {
        expediente: {
          select: { id: true, numero: true, titulo: true, cliente: { select: { nombre: true } } },
        },
      },
      orderBy: { fecha: "asc" },
    }),
    prisma.expediente.findMany({
      select: { id: true, numero: true, titulo: true },
      orderBy: { numero: "asc" },
    }),
  ]);

  return (
    <PaginaAudiencias
      audiencias={audiencias.map((a) => ({ ...a, fecha: a.fecha.toISOString() }))}
      expedientes={expedientes}
      puedeEliminar={puede(usuario?.rol ?? "ASISTENTE", "eliminar")}
    />
  );
}
