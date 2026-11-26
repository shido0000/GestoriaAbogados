import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { manejarError, numeroEntero } from "@/lib/validacion";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    const usuario = await requireApiUser();
    const { id } = await params;
    const notaId = numeroEntero(id, "id", { obligatorio: true }) ?? 0;
    const nota = await prisma.nota.findUnique({ where: { id: notaId } });
    if (!nota) return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    const esAdminAbogado = ["ADMIN", "ABOGADO"].includes(usuario.rol);
    if (!esAdminAbogado && nota.autorId !== usuario.id) {
      return NextResponse.json({ error: "Solo puedes eliminar tus propias notas" }, { status: 403 });
    }
    await prisma.nota.delete({ where: { id: notaId } });
    return NextResponse.json({ ok: true });
  });
}
