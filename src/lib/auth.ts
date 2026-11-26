import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const COOKIE_SESION = "gestoria_sesion";
const DURACION_SESION_MS = 7 * 24 * 60 * 60 * 1000;

export type UsuarioSesion = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
};

export function hashPassword(contrasena: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(contrasena, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verificarPassword(contrasena: string, almacenado: string): boolean {
  const [salt, hash] = almacenado.split(":");
  if (!salt || !hash) return false;
  const candidato = scryptSync(contrasena, salt, 64);
  const original = Buffer.from(hash, "hex");
  return candidato.length === original.length && timingSafeEqual(candidato, original);
}

export async function crearSesion(usuarioId: number): Promise<{ token: string; expiraEn: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + DURACION_SESION_MS);
  await prisma.sesion.create({
    data: { id: token, usuarioId, expiraEn },
  });
  return { token, expiraEn };
}

export async function destruirSesion(token: string): Promise<void> {
  await prisma.sesion.deleteMany({ where: { id: token } });
}

export const getUsuarioActual = cache(async function (): Promise<UsuarioSesion | null> {
  const almacen = await cookies();
  const token = almacen.get(COOKIE_SESION)?.value;
  if (!token) return null;

  const sesion = await prisma.sesion.findUnique({
    where: { id: token },
    include: { usuario: true },
  });
  if (!sesion || sesion.expiraEn < new Date() || !sesion.usuario.activo) return null;

  return {
    id: sesion.usuario.id,
    nombre: sesion.usuario.nombre,
    email: sesion.usuario.email,
    rol: sesion.usuario.rol,
  };
});

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireApiUser(): Promise<UsuarioSesion> {
  const usuario = await getUsuarioActual();
  if (!usuario) throw new HttpError(401, "No autenticado");
  return usuario;
}

export async function requireApiRol(roles: string[]): Promise<UsuarioSesion> {
  const usuario = await requireApiUser();
  if (!roles.includes(usuario.rol)) {
    throw new HttpError(403, "No tienes permisos para esta acción");
  }
  return usuario;
}
