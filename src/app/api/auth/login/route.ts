import { NextRequest, NextResponse } from "next/server";
import { COOKIE_SESION, crearSesion, verificarPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { manejarError, texto } from "@/lib/validacion";

export async function POST(req: NextRequest): Promise<Response> {
  return manejarError(async () => {
    const cuerpo = (await req.json()) as Record<string, unknown>;
    const email = texto(cuerpo.email, "email");
    const contrasena = texto(cuerpo.contrasena, "contraseña");

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.activo || !verificarPassword(contrasena, usuario.passwordHash)) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    const { token, expiraEn } = await crearSesion(usuario.id);
    const respuesta = NextResponse.json({
      ok: true,
      rol: usuario.rol,
      nombre: usuario.nombre,
    });
    respuesta.cookies.set(COOKIE_SESION, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: expiraEn,
    });
    return respuesta;
  });
}
