"use client";

export async function llamarApi(
  url: string,
  metodo: "POST" | "PUT" | "DELETE",
  cuerpo?: unknown,
): Promise<{ ok: boolean; datos: any; error: string }> {
  const respuesta = await fetch(url, {
    method: metodo,
    headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  let datos: any = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }
  if (!respuesta.ok) {
    return { ok: false, datos, error: datos?.error ?? `Error ${respuesta.status}` };
  }
  return { ok: true, datos, error: "" };
}

export function valorFechaInput(fecha: string | Date | null | undefined): string {
  if (!fecha) return "";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const ajuste = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return ajuste.toISOString().slice(0, 16);
}
