import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESION, destruirSesion } from "@/lib/auth";

export async function POST(): Promise<Response> {
  const almacen = await cookies();
  const token = almacen.get(COOKIE_SESION)?.value;
  if (token) await destruirSesion(token);

  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_SESION, "", { httpOnly: true, path: "/", maxAge: 0 });
  return respuesta;
}
