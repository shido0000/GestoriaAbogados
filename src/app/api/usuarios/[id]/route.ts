import { NextRequest, NextResponse } from "next/server";
import { hashPassword, requireApiRol } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deListado, manejarError, numeroEntero, texto } from "@/lib/validacion";
import { ROLES } from "@/lib/constantes";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    await requireApiRol(["ADMIN"]);
    const { id } = await params;
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const datos: Parameters<typeof prisma.usuario.update>[0]["data"] = {};
    if (cuerpo.nombre !== undefined) datos.nombre = texto(cuerpo.nombre, "nombre");
    if (cuerpo.email !== undefined) datos.email = texto(cuerpo.email, "email").toLowerCase();
    if (cuerpo.rol !== undefined) datos.rol = deListado(cuerpo.rol, [...ROLES], "rol", "ASISTENTE");
    if (cuerpo.activo !== undefined) datos.activo = Boolean(cuerpo.activo);
    if (cuerpo.contrasena) {
      const contrasena = texto(cuerpo.contrasena, "contraseña");
      if (contrasena.length < 8) {
        return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
      }
      datos.passwordHash = hashPassword(contrasena);
    }
    const usuario = await prisma.usuario.update({
      where: { id: numeroEntero(id, "id", { obligatorio: true }) ?? 0 },
      data: datos,
      select: { id: true, nombre: true, email: true, rol: true, activo: true, creadoEn: true },
    });
    return NextResponse.json(usuario);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  return manejarError(async () => {
    const admin = await requireApiRol(["ADMIN"]);
    const { id } = await params;
    const usuarioId = numeroEntero(id, "id", { obligatorio: true }) ?? 0;
    if (usuarioId === admin.id) {
      return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 });
    }
    await prisma.usuario.delete({ where: { id: usuarioId } });
    return NextResponse.json({ ok: true });
  });
}
