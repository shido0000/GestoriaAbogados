export const ROLES = ["ADMIN", "ABOGADO", "ASISTENTE"] as const;
export const ETIQUETA_ROL: Record<string, string> = {
  ADMIN: "Administrador",
  ABOGADO: "Abogado",
  ASISTENTE: "Asistente",
};

export const ESTADOS_EXPEDIENTE = ["ABIERTO", "EN_PROGRESO", "SUSPENDIDO", "CERRADO"] as const;
export const ETIQUETA_ESTADO_EXPEDIENTE: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_PROGRESO: "En progreso",
  SUSPENDIDO: "Suspendido",
  CERRADO: "Cerrado",
};

export const ESTADOS_TAREA = ["PENDIENTE", "EN_CURSO", "COMPLETADA"] as const;
export const ETIQUETA_ESTADO_TAREA: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_CURSO: "En curso",
  COMPLETADA: "Completada",
};

export const PRIORIDADES = ["BAJA", "MEDIA", "ALTA"] as const;
export const ETIQUETA_PRIORIDAD: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
};

export const TIPOS_AUDIENCIA = ["VISTA", "JUICIO", "VISTA_ORAL", "CONFERENCIA", "PLAZO"] as const;
export const ETIQUETA_TIPO_AUDIENCIA: Record<string, string> = {
  VISTA: "Vista",
  JUICIO: "Juicio",
  VISTA_ORAL: "Vista oral",
  CONFERENCIA: "Conferencia",
  PLAZO: "Plazo procesal",
};

export const ESTADOS_FACTURA = ["BORRADOR", "EMITIDA", "PAGADA", "VENCIDA"] as const;
export const ETIQUETA_ESTADO_FACTURA: Record<string, string> = {
  BORRADOR: "Borrador",
  EMITIDA: "Emitida",
  PAGADA: "Pagada",
  VENCIDA: "Vencida",
};

export const TIPOS_CLIENTE = ["PARTICULAR", "EMPRESA"] as const;
export const ETIQUETA_TIPO_CLIENTE: Record<string, string> = {
  PARTICULAR: "Particular",
  EMPRESA: "Empresa",
};

export function formatearDinero(valor: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(valor);
}

export function formatearFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    typeof fecha === "string" ? new Date(fecha) : fecha,
  );
}

export function formatearFechaHora(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(typeof fecha === "string" ? new Date(fecha) : fecha);
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function totalFactura(base: number, iva: number): number {
  return Math.round(base * (1 + iva / 100) * 100) / 100;
}

export function puede(
  rol: string,
  accion: "eliminar" | "facturas" | "usuarios" | "expedientes" | "escribir",
): boolean {
  if (rol === "ADMIN") return true;
  if (rol === "ABOGADO") return accion !== "usuarios";
  if (rol === "ASISTENTE") return !"eliminar facturas usuarios".includes(accion);
  return false;
}
