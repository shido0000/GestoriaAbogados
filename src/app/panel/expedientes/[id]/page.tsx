import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/auth";
import { puede } from "@/lib/constantes";
import DetalleExpediente from "./DetalleExpediente";

export const dynamic = "force-dynamic";

export default async function PaginaDetalleExpediente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await getUsuarioActual();
  const expediente = await prisma.expediente.findUnique({
    where: { id: Number(id) },
    include: {
      cliente: true,
      responsable: { select: { id: true, nombre: true } },
      tareas: { include: { asignado: { select: { id: true, nombre: true } } }, orderBy: { creadaEn: "desc" } },
      audiencias: { orderBy: { fecha: "desc" } },
      notas: { include: { autor: { select: { nombre: true } } }, orderBy: { creadoEn: "desc" } },
      facturas: { orderBy: { id: "desc" } },
      documentos: { include: { subido: { select: { nombre: true } } }, orderBy: { subidoEn: "desc" } },
    },
  });
  if (!expediente) notFound();

  const usuarios = await prisma.usuario.findMany({
    where: { activo: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <DetalleExpediente
      expediente={{
        ...expediente,
        creadoEn: expediente.creadoEn.toISOString(),
        actualizadoEn: expediente.actualizadoEn.toISOString(),
        tareas: expediente.tareas.map((t) => ({
          ...t,
          fechaVencimiento: t.fechaVencimiento ? t.fechaVencimiento.toISOString() : null,
          creadaEn: t.creadaEn.toISOString(),
        })),
        audiencias: expediente.audiencias.map((a) => ({ ...a, fecha: a.fecha.toISOString() })),
        notas: expediente.notas.map((n) => ({ ...n, creadoEn: n.creadoEn.toISOString() })),
        facturas: expediente.facturas.map((f) => ({
          ...f,
          emitidaEn: f.emitidaEn ? f.emitidaEn.toISOString() : null,
          vencimientoEn: f.vencimientoEn ? f.vencimientoEn.toISOString() : null,
        })),
        documentos: expediente.documentos.map((d) => ({ ...d, subidoEn: d.subidoEn.toISOString() })),
      }}
      usuarios={usuarios}
      rol={usuario?.rol ?? "ASISTENTE"}
      usuarioId={usuario?.id ?? 0}
    />
  );
}
