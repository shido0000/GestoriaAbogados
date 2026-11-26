import { NextResponse } from "next/server";
import { HttpError } from "./auth";

export function esRol(rol: string): boolean {
  return ["ADMIN", "ABOGADO", "ASISTENTE"].includes(rol);
}

export type Cuerpo = Record<string, unknown>;

export function texto(valor: unknown, campo: string, obligatorio = true, max = 500): string {
  if (valor == null || (typeof valor === "string" && valor.trim() === "")) {
    if (obligatorio) throw new HttpError(400, `El campo "${campo}" es obligatorio`);
    return "";
  }
  if (typeof valor !== "string") throw new HttpError(400, `El campo "${campo}" debe ser texto`);
  const recortado = valor.trim();
  if (recortado.length > max) throw new HttpError(400, `El campo "${campo}" supera ${max} caracteres`);
  return recortado;
}

export function numeroEntero(valor: unknown, campo: string, opciones?: { obligatorio?: boolean; min?: number }): number | null {
  if (valor == null || valor === "") {
    if (opciones?.obligatorio) throw new HttpError(400, `El campo "${campo}" es obligatorio`);
    return null;
  }
  const n = Number(valor);
  if (!Number.isInteger(n)) throw new HttpError(400, `El campo "${campo}" debe ser un número entero`);
  if (opciones?.min !== undefined && n < opciones.min) {
    throw new HttpError(400, `El campo "${campo}" debe ser ≥ ${opciones.min}`);
  }
  return n;
}

export function deListado(valor: unknown, permitidos: string[], campo: string, porDefecto: string): string {
  if (valor == null || valor === "") return porDefecto;
  if (!permitidos.includes(String(valor))) {
    throw new HttpError(400, `El campo "${campo}" debe ser uno de: ${permitidos.join(", ")}`);
  }
  return String(valor);
}

export function fecha(valor: unknown, campo: string, obligatorio = true): Date | null {
  if (valor == null || valor === "") {
    if (obligatorio) throw new HttpError(400, `El campo "${campo}" es obligatorio`);
    return null;
  }
  const d = new Date(String(valor));
  if (isNaN(d.getTime())) throw new HttpError(400, `El campo "${campo}" no es una fecha válida`);
  return d;
}

export async function manejarError(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const mensaje =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "Ya existe un registro con ese valor único"
        : "Error interno del servidor";
    console.error(error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
