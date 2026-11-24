import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/auth";
import {
  ETIQUETA_PRIORIDAD,
  ETIQUETA_TIPO_AUDIENCIA,
  formatearDinero,
  formatearFecha,
} from "@/lib/constantes";

export const dynamic = "force-dynamic";

function chipPrioridad(prioridad: string): string {
  if (prioridad === "ALTA") return "chip rojo";
  if (prioridad === "MEDIA") return "chip ambar";
  return "chip gris";
}

export default async function PaginaPanel() {
  const usuario = await getUsuarioActual();
  const hoy = new Date();
  const en14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const [totalClientes, expedientesAbiertos, tareasAbiertas, tareasVencidas, audienciasProximas, facturasEmitidasAgno] =
    await Promise.all([
      prisma.cliente.count(),
      prisma.expediente.count({ where: { estado: { in: ["ABIERTO", "EN_PROGRESO"] } } }),
      prisma.tarea.count({ where: { estado: { not: "COMPLETADA" } } }),
      prisma.tarea.count({ where: { estado: { not: "COMPLETADA" }, fechaVencimiento: { lt: hoy } } }),
      prisma.audiencia.findMany({
        where: { fecha: { gte: hoy, lte: en14 } },
        include: { expediente: { select: { numero: true, titulo: true } } },
        orderBy: { fecha: "asc" },
        take: 8,
      }),
      prisma.factura.aggregate({
        where: { estado: { in: ["EMITIDA", "PAGADA"] }, emitidaEn: { gte: new Date(`${hoy.getFullYear()}-01-01`) } },
        _sum: { base: true },
      }),
    ]);

  const tareasProximas = await prisma.tarea.findMany({
    where: { estado: { not: "COMPLETADA" } },
    include: { asignado: { select: { nombre: true } }, expediente: { select: { numero: true } } },
    orderBy: [{ fechaVencimiento: "asc" }, { prioridad: "asc" }],
    take: 6,
  });

  const metricas = [
    { valor: String(totalClientes), etiqueta: "Clientes" },
    { valor: String(expedientesAbiertos), etiqueta: "Expedientes activos" },
    { valor: String(tareasAbiertas), etiqueta: "Tareas abiertas" },
    { valor: String(audienciasProximas.length), etiqueta: "Audiencias/próximos 14 días" },
    {
      valor: formatearDinero(facturasEmitidasAgno._sum.base ?? 0),
      etiqueta: "Facturado este año (bases)",
    },
  ];

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Bienvenido, {usuario?.nombre}</h1>
          <div className="descripcion">Resumen de la actividad del despacho</div>
        </div>
      </div>

      <div className="tarjetas-metricas">
        {metricas.map((m) => (
          <div className="tarjeta-metrica" key={m.etiqueta}>
            <div className="valor">{m.valor}</div>
            <div className="etiqueta">{m.etiqueta}</div>
          </div>
        ))}
      </div>

      <div className="rejilla-dos">
        <div className="tarjeta">
          <h2>Próximas audiencias y plazos (14 días)</h2>
          {audienciasProximas.length === 0 ? (
            <div className="vacio">Sin audiencias ni plazos en los próximos 14 días.</div>
          ) : (
            <ul className="lista-compacta">
              {audienciasProximas.map((a) => (
                <li key={a.id}>
                  <span>
                    {formatearFecha(a.fecha)} · <strong>{ETIQUETA_TIPO_AUDIENCIA[a.tipo] ?? a.tipo}</strong>{" "}
                    — {a.titulo}
                    <br />
                    <small>
                      <Link href={`/panel/expedientes/${a.expedienteId}`}>{a.expediente.numero}</Link>
                    </small>
                  </span>
                  <Link href="/panel/audiencias" className="boton secundario mini">
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="tarjeta">
          <h2>Tareas próximas</h2>
          {tareasProximas.length === 0 ? (
            <div className="vacio">Sin tareas abiertas.</div>
          ) : (
            <ul className="lista-compacta">
              {tareasProximas.map((t) => (
                <li key={t.id}>
                  <span className={t.fechaVencimiento && t.fechaVencimiento < hoy ? "texto-alerta" : undefined}>
                    {t.titulo}
                    <br />
                    <small>
                      {t.expediente ? `${t.expediente.numero} · ` : ""}
                      {t.asignado.nombre}
                      {t.fechaVencimiento ? ` · vence ${formatearFecha(t.fechaVencimiento)}` : ""}
                    </small>
                  </span>
                  <span>
                    <span className={chipPrioridad(t.prioridad)}>
                      {ETIQUETA_PRIORIDAD[t.prioridad] ?? t.prioridad}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {tareasVencidas > 0 && (
            <div className="cuerpo" style={{ borderTop: "1px solid var(--borde)" }}>
              <span className="texto-alerta">
                {tareasVencidas} tarea(s) vencida(s) sin completar.
              </span>{" "}
              <Link href="/panel/tareas">Revisar</Link>
            </div>
          )}
        </div>
      </div>

      <div className="tarjeta">
        <h2>Accesos rápidos</h2>
        <div className="cuerpo acciones-en-linea">
          <Link className="boton secundario" href="/panel/clientes">
            Clientes
          </Link>
          <Link className="boton secundario" href="/panel/expedientes">
            Expedientes
          </Link>
          <Link className="boton secundario" href="/panel/tareas">
            Tareas
          </Link>
          <Link className="boton secundario" href="/panel/facturas">
            Facturación
          </Link>
          <Link className="boton secundario" href="/panel/reportes">
            Reportes
          </Link>
        </div>
      </div>
    </>
  );
}
