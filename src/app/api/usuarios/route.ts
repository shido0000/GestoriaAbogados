import { NextRequest, NextResponse } from "next/server";
import { hashPassword, requireApiRol } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deListado, manejarError, texto } from "@/lib/validacion";
import { ROLES } from "@/lib/constantes";

export async function GET(): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN", "ABOGADO"]);
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(usuarios);
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN"]);
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const contrasena = texto(cuerpo.contrasena, "contraseña");
    if (contrasena.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }
    const usuario = await prisma.usuario.create({
      data: {
        nombre: texto(cuerpo.nombre, "nombre"),
        email: texto(cuerpo.email, "email").toLowerCase(),
        passwordHash: hashPassword(contrasena),
        rol: deListado(cuerpo.rol, [...ROLES], "rol", "ASISTENTE"),
      },
      select: { id: true, nombre: true, email: true, rol: true, activo: true, creadoEn: true },
    });
    return NextResponse.json(usuario, { status: 201 });
  });
}
