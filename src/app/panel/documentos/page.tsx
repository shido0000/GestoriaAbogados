import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/auth";
import { puede } from "@/lib/constantes";
import PaginaDocumentos from "./PaginaDocumentos";

export const dynamic = "force-dynamic";

export default async function PaginaDocumentosServidor() {
  const usuario = await getUsuarioActual();
  const [documentos, expedientes, clientes] = await Promise.all([
    prisma.documento.findMany({
      include: {
        subido: { select: { nombre: true } },
        expediente: { select: { id: true, numero: true, titulo: true } },
        cliente: { select: { id: true, nombre: true } },
      },
      orderBy: { subidoEn: "desc" },
    }),
    prisma.expediente.findMany({ select: { id: true, numero: true }, orderBy: { numero: "asc" } }),
    prisma.cliente.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
  ]);

  return (
    <PaginaDocumentos
      documentos={documentos.map((d) => ({ ...d, subidoEn: d.subidoEn.toISOString() }))}
      expedientes={expedientes}
      clientes={clientes}
      puedeEliminar={puede(usuario?.rol ?? "ASISTENTE", "eliminar")}
    />
  );
}
