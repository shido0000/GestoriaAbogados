"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ESTADOS_EXPEDIENTE,
  ETIQUETA_ESTADO_EXPEDIENTE,
  formatearFecha,
} from "@/lib/constantes";
import { llamarApi } from "@/lib/api-cliente";

type ExpedienteLista = {
  id: number;
  numero: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  clienteId: number;
  cliente: { nombre: string };
  responsableId: number;
  responsable: { nombre: string };
  creadoEn: string;
  _count: { tareas: number; audiencias: number; documentos: number; facturas: number };
};

const CHIP_ESTADO: Record<string, string> = {
  ABIERTO: "chip verde",
  EN_PROGRESO: "chip azul",
  SUSPENDIDO: "chip ambar",
  CERRADO: "chip gris",
};

export default function PaginaExpedientes({
  expedientes,
  clientes,
  usuarios,
  rol,
  usuarioId,
  puedeEditar,
  puedeEliminar,
}: {
  expedientes: ExpedienteLista[];
  clientes: { id: number; nombre: string }[];
  usuarios: { id: number; nombre: string }[];
  rol: string;
  usuarioId: number;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState("");
  const [soloMios, setSoloMios] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    estado: "ABIERTO",
    clienteId: "",
    responsableId: String(usuarioId),
  });

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return expedientes.filter((e) => {
      if (estado && e.estado !== estado) return false;
      if (soloMios && e.responsableId !== usuarioId) return false;
      if (q && !`${e.numero} ${e.titulo} ${e.cliente.nombre}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [expedientes, estado, soloMios, busqueda, usuarioId]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    const resultado = await llamarApi("/api/expedientes", "POST", {
      titulo: form.titulo,
      descripcion: form.descripcion,
      estado: form.estado,
      clienteId: Number(form.clienteId),
      responsableId: Number(form.responsableId),
    });
    setOcupado(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setAbierto(false);
    setForm({ titulo: "", descripcion: "", estado: "ABIERTO", clienteId: "", responsableId: String(usuarioId) });
    router.refresh();
  }

  async function cambiarEstado(e: ExpedienteLista, nuevoEstado: string) {
    const resultado = await llamarApi(`/api/expedientes/${e.id}`, "PUT", { estado: nuevoEstado });
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  async function eliminar(e: ExpedienteLista) {
    if (!confirm(`¿Eliminar el expediente ${e.numero}? Se eliminarán también sus tareas, audiencias, notas y documentos.`)) return;
    const resultado = await llamarApi(`/api/expedientes/${e.id}`, "DELETE");
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Expedientes</h1>
          <div className="descripcion">{expedientes.length} expediente(s)</div>
        </div>
        {puedeEditar && (
          <button className="boton" onClick={() => { setAbierto(true); setError(null); }}>
            Nuevo expediente
          </button>
        )}
      </div>

      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar por número, título o cliente…"
          value={busqueda}
          onChange={(e2) => setBusqueda(e2.target.value)}
        />
        <select value={estado} onChange={(e2) => setEstado(e2.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS_EXPEDIENTE.map((s) => (
            <option key={s} value={s}>
              {ETIQUETA_ESTADO_EXPEDIENTE[s]}
            </option>
          ))}
        </select>
        <label style={{ fontSize: 14 }}>
          <input
            type="checkbox"
            checked={soloMios}
            onChange={(e2) => setSoloMios(e2.target.checked)}
            style={{ width: "auto", marginRight: 6 }}
          />
          Solo mis expedientes
        </label>
      </div>

      <div className="tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Número</th>
              <th>Título</th>
              <th>Cliente</th>
              <th>Responsable</th>
              <th>Estado</th>
              <th>Actividad</th>
              <th className="celda-derecha">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link href={`/panel/expedientes/${e.id}`}>
                    <strong>{e.numero}</strong>
                  </Link>
                </td>
                <td>{e.titulo}</td>
                <td>
                  <Link href={`/panel/clientes/${e.clienteId}`}>{e.cliente.nombre}</Link>
                </td>
                <td>{e.responsable.nombre}</td>
                <td>
                  {puedeEditar ? (
                    <select
                      value={e.estado}
                      onChange={(e2) => cambiarEstado(e, e2.target.value)}
                      style={{ width: "auto", padding: "3px 6px", fontSize: 13 }}
                    >
                      {ESTADOS_EXPEDIENTE.map((s) => (
                        <option key={s} value={s}>
                          {ETIQUETA_ESTADO_EXPEDIENTE[s]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={CHIP_ESTADO[e.estado] ?? "chip neutro"}>
                      {ETIQUETA_ESTADO_EXPEDIENTE[e.estado] ?? e.estado}
                    </span>
                  )}
                </td>
                <td>
                  <small>
                    {e._count.tareas} tareas · {e._count.audiencias} audi. · {e._count.documentos} docs ·{" "}
                    {e._count.facturas} fact.
                  </small>
                </td>
                <td className="celda-derecha">
                  <Link className="boton secundario mini" href={`/panel/expedientes/${e.id}`}>
                    Abrir
                  </Link>{" "}
                  {puedeEliminar && (
                    <button className="boton peligro mini" onClick={() => eliminar(e)}>
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <div className="vacio">Sin resultados.</div>}
      </div>

      {abierto && (
        <div className="dialogo-fondo">
          <form className="dialogo" onSubmit={guardar}>
            <h2>Nuevo expediente</h2>
            {error && <div className="error-formulario">{error}</div>}
            <label className="campo">
              <span className="etiqueta">Título</span>
              <input
                type="text"
                required
                value={form.titulo}
                onChange={(e2) => setForm({ ...form, titulo: e2.target.value })}
              />
            </label>
            <div className="rejilla-formulario">
              <label className="campo">
                <span className="etiqueta">Cliente</span>
                <select
                  required
                  value={form.clienteId}
                  onChange={(e2) => setForm({ ...form, clienteId: e2.target.value })}
                >
                  <option value="">Seleccionar…</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span className="etiqueta">Responsable</span>
                <select
                  required
                  value={form.responsableId}
                  onChange={(e2) => setForm({ ...form, responsableId: e2.target.value })}
                >
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span className="etiqueta">Estado inicial</span>
                <select value={form.estado} onChange={(e2) => setForm({ ...form, estado: e2.target.value })}>
                  {ESTADOS_EXPEDIENTE.map((s) => (
                    <option key={s} value={s}>
                      {ETIQUETA_ESTADO_EXPEDIENTE[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="campo campo-anchura">
              <span className="etiqueta">Descripción</span>
              <textarea
                value={form.descripcion}
                onChange={(e2) => setForm({ ...form, descripcion: e2.target.value })}
              />
            </label>
            <div className="pie-dialogo">
              <button type="button" className="boton secundario" onClick={() => setAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="boton" disabled={ocupado}>
                {ocupado ? "Creando…" : "Crear expediente"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
