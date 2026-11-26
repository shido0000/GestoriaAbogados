import { NextRequest, NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { requireApiRol, requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { manejarError, numeroEntero } from "@/lib/validacion";

type Params = { params: Promise<{ id: string }> };
const CARPETA_UPLOADS = path.join(process.cwd(), "uploads");

export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiUser();
    const { id } = await params;
    const documento = await prisma.documento.findUnique({
      where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 },
    });
    if (!documento) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

    const archivo = await import("node:fs/promises").then((fs) => fs.readFile(path.join(CARPETA_UPLOADS, documento.ruta)));
    return new NextResponse(new Uint8Array(archivo), {
      headers: {
        "Content-Type": documento.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(documento.nombre)}"`,
      },
    });
  });
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO"]);
    const { id } = await params;
    const documento = await prisma.documento.findUnique({
      where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 },
    });
    if (!documento) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    await unlink(path.join(CARPETA_UPLOADS, documento.ruta)).catch(() => {});
    await prisma.documento.delete({ where: { id: documento.id } });
    return NextResponse.json({ ok: true });
  });
}
