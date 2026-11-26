import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ETIQUETA_ESTADO_EXPEDIENTE,
  ETIQUETA_TIPO_CLIENTE,
  formatearDinero,
  formatearFecha,
  totalFactura,
} from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function DetalleCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({
    where: { id: Number(id) },
    include: {
      expedientes: {
        include: { responsable: { select: { nombre: true } } },
        orderBy: { creadoEn: "desc" },
      },
      facturas: { orderBy: { id: "desc" } },
      documentos: { orderBy: { subidoEn: "desc" } },
    },
  });
  if (!cliente) notFound();

  const totalPendiente = cliente.facturas
    .filter((f) => f.estado === "EMITIDA" || f.estado === "VENCIDA")
    .reduce((suma, f) => suma + totalFactura(f.base, f.iva), 0);

  return (
    <>
      <div className="barra-cabecera">
        <Link href="/panel/clientes">← Volver a clientes</Link>
      </div>
      <div className="cabecera-pagina">
        <div>
          <h1>{cliente.nombre}</h1>
          <div className="descripcion">
            <span className={cliente.tipo === "EMPRESA" ? "chip azul" : "chip neutro"}>
              {ETIQUETA_TIPO_CLIENTE[cliente.tipo] ?? cliente.tipo}
            </span>{" "}
            {cliente.identificacion} · Cliente desde {formatearFecha(cliente.creadoEn)}
          </div>
        </div>
      </div>

      <div className="rejilla-dos">
        <div className="tarjeta">
          <h2>Datos de contacto</h2>
          <div className="cuerpo ficha">
            <dl>
              <dt>Email</dt>
              <dd>{cliente.email ?? "—"}</dd>
              <dt>Teléfono</dt>
              <dd>{cliente.telefono ?? "—"}</dd>
              <dt>Dirección</dt>
              <dd>{cliente.direccion ?? "—"}</dd>
              <dt>Notas</dt>
              <dd>{cliente.notas ?? "—"}</dd>
            </dl>
          </div>
        </div>
        <div className="tarjeta">
          <h2>Situación económica</h2>
          <div className="cuerpo ficha">
            <dl>
              <dt>Facturas emitidas</dt>
              <dd>{cliente.facturas.length}</dd>
              <dt>Pendiente de cobro (IVA incluido)</dt>
              <dd>
                <strong className={totalPendiente > 0 ? "texto-alerta" : undefined}>
                  {formatearDinero(totalPendiente)}
                </strong>
              </dd>
              <dt>Documentos</dt>
              <dd>{cliente.documentos.length}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="tarjeta">
        <h2>Expedientes del cliente</h2>
        {cliente.expedientes.length === 0 ? (
          <div className="vacio">Sin expedientes.</div>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Número</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {cliente.expedientes.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/panel/expedientes/${e.id}`}>{e.numero}</Link>
                  </td>
                  <td>{e.titulo}</td>
                  <td>
                    <span
                      className={
                        e.estado === "CERRADO"
                          ? "chip gris"
                          : e.estado === "SUSPENDIDO"
                            ? "chip ambar"
                            : "chip verde"
                      }
                    >
                      {ETIQUETA_ESTADO_EXPEDIENTE[e.estado] ?? e.estado}
                    </span>
                  </td>
                  <td>{e.responsable.nombre}</td>
                  <td>{formatearFecha(e.actualizadoEn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
