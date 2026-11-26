import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/auth";
import { puede } from "@/lib/constantes";
import PaginaUsuarios from "./PaginaUsuarios";

export const dynamic = "force-dynamic";

export default async function PaginaUsuariosServidor() {
  const usuario = await getUsuarioActual();
  if (!puede(usuario?.rol ?? "ASISTENTE", "usuarios")) redirect("/panel");

  const usuarios = await prisma.usuario.findMany({
    include: { _count: { select: { expedientes: true, tareas: true } } },
    orderBy: { nombre: "asc" },
  });

  return (
    <PaginaUsuarios
      usuarios={usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        activo: u.activo,
        creadoEn: u.creadoEn.toISOString(),
        expedientes: u._count.expedientes,
        tareas: u._count.tareas,
      }))}
      usuarioActualId={usuario?.id ?? 0}
    />
  );
}
