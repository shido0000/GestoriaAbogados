"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ESTADOS_FACTURA,
  ETIQUETA_ESTADO_FACTURA,
  formatearDinero,
  formatearFecha,
  totalFactura,
} from "@/lib/constantes";
import { llamarApi } from "@/lib/api-cliente";

type FacturaItem = {
  id: number;
  numero: string;
  concepto: string;
  base: number;
  iva: number;
  emitidaEn: string | null;
  vencimientoEn: string | null;
  estado: string;
  clienteId: number;
  cliente: { nombre: string };
  expedienteId: number | null;
  expediente: { numero: string; titulo: string } | null;
};

const CHIP: Record<string, string> = {
  BORRADOR: "chip gris",
  EMITIDA: "chip azul",
  PAGADA: "chip verde",
  VENCIDA: "chip rojo",
};

export default function PaginaFacturas({
  facturas,
  clientes,
  expedientes,
  puedeGestionar,
}: {
  facturas: FacturaItem[];
  clientes: { id: number; nombre: string }[];
  expedientes: { id: number; numero: string; titulo: string }[];
  puedeGestionar: boolean;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    concepto: "",
    base: "",
    iva: "21",
    vencimientoEn: "",
    estado: "BORRADOR",
    clienteId: "",
    expedienteId: "",
  });

  const hoy = new Date();

  const filtradas = useMemo(() => facturas.filter((f) => !estado || f.estado === estado), [facturas, estado]);

  const resumen = useMemo(() => {
    let total = 0;
    let pendiente = 0;
    for (const f of facturas) {
      const totalConIva = totalFactura(f.base, f.iva);
      if (f.estado === "PAGADA") total += totalConIva;
      if (f.estado === "EMITIDA" || f.estado === "VENCIDA") pendiente += totalConIva;
    }
    return { total, pendiente };
  }, [facturas]);

  function marcarVencidasALVolar(): number {
    return facturas.filter(
      (f) => f.estado === "EMITIDA" && f.vencimientoEn && new Date(f.vencimientoEn) < hoy,
    ).length;
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    const resultado = await llamarApi("/api/facturas", "POST", {
      concepto: form.concepto,
      base: Number(form.base),
      iva: Number(form.iva),
      vencimientoEn: form.vencimientoEn || null,
      estado: form.estado,
      clienteId: Number(form.clienteId),
      expedienteId: form.expedienteId ? Number(form.expedienteId) : null,
    });
    setOcupado(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setAbierto(false);
    setForm({ concepto: "", base: "", iva: "21", vencimientoEn: "", estado: "BORRADOR", clienteId: "", expedienteId: "" });
    router.refresh();
  }

  async function cambiarEstado(f: FacturaItem, nuevoEstado: string) {
    const resultado = await llamarApi(`/api/facturas/${f.id}`, "PUT", { estado: nuevoEstado });
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  async function eliminar(f: FacturaItem) {
    if (!confirm(`¿Eliminar la factura ${f.numero}?`)) return;
    const resultado = await llamarApi(`/api/facturas/${f.id}`, "DELETE");
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Facturación</h1>
          <div className="descripcion">
            Cobrado: <strong>{formatearDinero(resumen.total)}</strong> · Pendiente de cobro:{" "}
            <strong>{formatearDinero(resumen.pendiente)}</strong>
          </div>
        </div>
        {puedeGestionar && (
          <button className="boton" onClick={() => { setAbierto(true); setError(null); }}>
            Nueva factura
          </button>
        )}
      </div>

      <div className="filtros">
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS_FACTURA.map((s) => (
            <option key={s} value={s}>
              {ETIQUETA_ESTADO_FACTURA[s]}
            </option>
          ))}
        </select>
        {marcarVencidasALVolar() > 0 && (
          <span className="texto-alerta">{marcarVencidasALVolar()} factura(s) emitidas con vencimiento superado</span>
        )}
      </div>

      <div className="tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Número</th>
              <th>Concepto</th>
              <th>Cliente</th>
              <th>Expediente</th>
              <th className="celda-derecha">Base</th>
              <th className="celda-derecha">IVA</th>
              <th className="celda-derecha">Total</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              {puedeGestionar && <th className="celda-derecha">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtradas.map((f) => (
              <tr key={f.id}>
                <td>
                  <strong>{f.numero}</strong>
                </td>
                <td>{f.concepto}</td>
                <td>{f.cliente.nombre}</td>
                <td>{f.expediente ? f.expediente.numero : "—"}</td>
                <td className="celda-derecha">{formatearDinero(f.base)}</td>
                <td className="celda-derecha">{f.iva}%</td>
                <td className="celda-derecha">
                  <strong>{formatearDinero(totalFactura(f.base, f.iva))}</strong>
                </td>
                <td>{f.vencimientoEn ? formatearFecha(f.vencimientoEn) : "—"}</td>
                <td>
                  <span className={CHIP[f.estado] ?? "chip neutro"}>
                    {ETIQUETA_ESTADO_FACTURA[f.estado] ?? f.estado}
                  </span>
                </td>
                {puedeGestionar && (
                  <td className="celda-derecha">
                    {f.estado !== "PAGADA" && (
                      <button className="boton secundario mini" onClick={() => cambiarEstado(f, "PAGADA")}>
                        Marcar pagada
                      </button>
                    )}{" "}
                    <button className="boton peligro mini" onClick={() => eliminar(f)}>
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtradas.length === 0 && <div className="vacio">Sin facturas.</div>}
      </div>

      {abierto && (
        <div className="dialogo-fondo">
          <form className="dialogo" onSubmit={guardar}>
            <h2>Nueva factura</h2>
            {error && <div className="error-formulario">{error}</div>}
            <label className="campo">
              <span className="etiqueta">Concepto</span>
              <input type="text" required value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} />
            </label>
            <div className="rejilla-formulario">
              <label className="campo">
                <span className="etiqueta">Base (€)</span>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={form.base}
                  onChange={(e) => setForm({ ...form, base: e.target.value })}
                />
              </label>
              <label className="campo">
                <span className="etiqueta">IVA (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.iva}
                  onChange={(e) => setForm({ ...form, iva: e.target.value })}
                />
              </label>
              <label className="campo">
                <span className="etiqueta">Vencimiento</span>
                <input
                  type="date"
                  value={form.vencimientoEn}
                  onChange={(e) => setForm({ ...form, vencimientoEn: e.target.value })}
                />
              </label>
              <label className="campo">
                <span className="etiqueta">Estado</span>
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                  {ESTADOS_FACTURA.map((s) => (
                    <option key={s} value={s}>
                      {ETIQUETA_ESTADO_FACTURA[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo campo-anchura">
                <span className="etiqueta">Cliente</span>
                <select required value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
                  <option value="">Seleccionar…</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo campo-anchura">
                <span className="etiqueta">Expediente (opcional)</span>
                <select value={form.expedienteId} onChange={(e) => setForm({ ...form, expedienteId: e.target.value })}>
                  <option value="">Sin expediente</option>
                  {expedientes.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.numero} — {x.titulo}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="pie-dialogo">
              <button type="button" className="boton secundario" onClick={() => setAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="boton" disabled={ocupado}>
                {ocupado ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
