import { prisma } from "@/lib/prisma";
import {
  ETIQUETA_ESTADO_EXPEDIENTE,
  ESTADOS_EXPEDIENTE,
  formatearDinero,
  totalFactura,
} from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function PaginaReportes() {
  const [porEstado, porResponsable, facturas, clientesPorTipo] = await Promise.all([
    prisma.expediente.groupBy({ by: ["estado"], _count: { _all: true } }),
    prisma.expediente.groupBy({ by: ["responsableId"], _count: { _all: true } }),
    prisma.factura.findMany({
      where: { estado: { in: ["EMITIDA", "PAGADA"] } },
      select: { emitidaEn: true, base: true, iva: true, estado: true },
    }),
    prisma.cliente.groupBy({ by: ["tipo"], _count: { _all: true } }),
  ]);

  const usuarios = await prisma.usuario.findMany({ select: { id: true, nombre: true } });
  const nombreUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nombre ?? `#${id}`;

  const porMes = new Map<string, { base: number; cobrado: number }>();
  for (const f of facturas) {
    const fecha = f.emitidaEn ?? new Date();
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    const actual = porMes.get(clave) ?? { base: 0, cobrado: 0 };
    actual.base += f.base;
    if (f.estado === "PAGADA") actual.cobrado += totalFactura(f.base, f.iva);
    porMes.set(clave, actual);
  }
  const meses = [...porMes.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Reportes</h1>
          <div className="descripcion">Indicadores del despacho</div>
        </div>
      </div>

      <div className="rejilla-dos">
        <div className="tarjeta">
          <h2>Expedientes por estado</h2>
          <table className="tabla">
            <thead>
              <tr>
                <th>Estado</th>
                <th className="celda-derecha">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {ESTADOS_EXPEDIENTE.map((estado) => (
                <tr key={estado}>
                  <td>{ETIQUETA_ESTADO_EXPEDIENTE[estado]}</td>
                  <td className="celda-derecha">
                    {porEstado.find((p) => p.estado === estado)?._count._all ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tarjeta">
          <h2>Clientes por tipo</h2>
          <table className="tabla">
            <thead>
              <tr>
                <th>Tipo</th>
                <th className="celda-derecha">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {["PARTICULAR", "EMPRESA"].map((tipo) => (
                <tr key={tipo}>
                  <td>{tipo === "PARTICULAR" ? "Particulares" : "Empresas"}</td>
                  <td className="celda-derecha">
                    {clientesPorTipo.find((p) => p.tipo === tipo)?._count._all ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tarjeta">
        <h2>Expedientes por responsable</h2>
        <table className="tabla">
          <thead>
            <tr>
              <th>Abogado/a</th>
              <th className="celda-derecha">Expedientes</th>
            </tr>
          </thead>
          <tbody>
            {porResponsable.map((r) => (
              <tr key={r.responsableId}>
                <td>{nombreUsuario(r.responsableId)}</td>
                <td className="celda-derecha">{r._count._all}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {porResponsable.length === 0 && <div className="vacio">Sin datos.</div>}
      </div>

      <div className="tarjeta">
        <h2>Facturación por mes (últimos 12 meses con actividad)</h2>
        <table className="tabla">
          <thead>
            <tr>
              <th>Mes</th>
              <th className="celda-derecha">Base facturada</th>
              <th className="celda-derecha">Cobrado (IVA incl.)</th>
            </tr>
          </thead>
          <tbody>
            {meses.map(([clave, valores]) => (
              <tr key={clave}>
                <td>{clave}</td>
                <td className="celda-derecha">{formatearDinero(valores.base)}</td>
                <td className="celda-derecha">{formatearDinero(valores.cobrado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {meses.length === 0 && <div className="vacio">Sin facturas emitidas todavía.</div>}
      </div>
    </>
  );
}
