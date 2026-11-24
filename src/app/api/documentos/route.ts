import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { requireApiRol, requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { manejarError } from "@/lib/validacion";

const TAMANO_MAXIMO = 20 * 1024 * 1024;
const CARPETA_UPLOADS = path.join(process.cwd(), "uploads");

export async function GET(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    await requireApiUser();
    const sp = req.nextUrl.searchParams;
    const documentos = await prisma.documento.findMany({
      where: {
        expedienteId: sp.get("expedienteId") ? Number(sp.get("expedienteId")) : undefined,
        clienteId: sp.get("clienteId") ? Number(sp.get("clienteId")) : undefined,
      },
      include: {
        subido: { select: { nombre: true } },
        expediente: { select: { numero: true, titulo: true } },
        cliente: { select: { nombre: true } },
      },
      orderBy: { subidoEn: "desc" },
    });
    return NextResponse.json(documentos);
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    const usuario = await requireApiRol(["ADMIN", "ABOGADO", "ASISTENTE"]);
    const formulario = await req.formData();
    const archivo = formulario.get("archivo");
    if (!(archivo instanceof File) || archivo.size === 0) {
      return NextResponse.json({ error: "Debes seleccionar un archivo" }, { status: 400 });
    }
    if (archivo.size > TAMANO_MAXIMO) {
      return NextResponse.json({ error: "El archivo supera el límite de 20 MB" }, { status: 400 });
    }

    const expedienteId = formulario.get("expedienteId") ? Number(formulario.get("expedienteId")) : null;
    const clienteId = formulario.get("clienteId") ? Number(formulario.get("clienteId")) : null;

    await mkdir(CARPETA_UPLOADS, { recursive: true });
    const seguro = archivo.name.replace(/[^\w.\-áéíóúñÁÉÍÓÚÑ ]/g, "_").slice(-120);
    const rutaDisco = `${randomBytes(8).toString("hex")}-${seguro}`;
    await writeFile(path.join(CARPETA_UPLOADS, rutaDisco), Buffer.from(await archivo.arrayBuffer()));

    const documento = await prisma.documento.create({
      data: {
        nombre: archivo.name,
        ruta: rutaDisco,
        mimeType: archivo.type || "application/octet-stream",
        tamano: archivo.size,
        expedienteId,
        clienteId,
        subidoId: usuario.id,
      },
      include: {
        subido: { select: { nombre: true } },
        expediente: { select: { numero: true, titulo: true } },
        cliente: { select: { nombre: true } },
      },
    });
    return NextResponse.json(documento, { status: 201 });
  });
}
