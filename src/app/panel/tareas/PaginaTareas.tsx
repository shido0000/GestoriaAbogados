"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ESTADOS_TAREA,
  ETIQUETA_ESTADO_TAREA,
  ETIQUETA_PRIORIDAD,
  formatearFecha,
} from "@/lib/constantes";
import { llamarApi, valorFechaInput } from "@/lib/api-cliente";

type TareaItem = {
  id: number;
  titulo: string;
  descripcion: string | null;
  estado: string;
  prioridad: string;
  fechaVencimiento: string | null;
  asignadoId: number;
  asignado: { id: number; nombre: string };
  expedienteId: number | null;
  expediente: { id: number; numero: string; titulo: string } | null;
};

type ExpedienteOpcion = { id: number; numero: string; titulo: string };

export default function PaginaTareas({
  tareas,
  usuarios,
  expedientes,
  usuarioId,
}: {
  tareas: TareaItem[];
  usuarios: { id: number; nombre: string }[];
  expedientes: ExpedienteOpcion[];
  usuarioId: number;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState("");
  const [soloMias, setSoloMias] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    prioridad: "MEDIA",
    fechaVencimiento: "",
    asignadoId: String(usuarioId),
    expedienteId: "",
  });

  const hoy = new Date();
  hoy.setHours(23, 59, 59);

  const filtradas = useMemo(
    () =>
      tareas.filter((t) => {
        if (estado && t.estado !== estado) return false;
        if (soloMias && t.asignadoId !== usuarioId) return false;
        return true;
      }),
    [tareas, estado, soloMias, usuarioId],
  );

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    const resultado = await llamarApi("/api/tareas", "POST", {
      titulo: form.titulo,
      descripcion: form.descripcion,
      prioridad: form.prioridad,
      fechaVencimiento: form.fechaVencimiento || null,
      asignadoId: Number(form.asignadoId),
      expedienteId: form.expedienteId ? Number(form.expedienteId) : null,
    });
    setOcupado(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setAbierto(false);
    setForm({ titulo: "", descripcion: "", prioridad: "MEDIA", fechaVencimiento: "", asignadoId: String(usuarioId), expedienteId: "" });
    router.refresh();
  }

  async function cambiarEstado(t: TareaItem, nuevoEstado: string) {
    const resultado = await llamarApi(`/api/tareas/${t.id}`, "PUT", { estado: nuevoEstado });
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Tareas</h1>
          <div className="descripcion">{tareas.length} tarea(s) en total</div>
        </div>
        <button className="boton" onClick={() => { setAbierto(true); setError(null); }}>
          Nueva tarea
        </button>
      </div>

      <div className="filtros">
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS_TAREA.map((s) => (
            <option key={s} value={s}>
              {ETIQUETA_ESTADO_TAREA[s]}
            </option>
          ))}
        </select>
        <label style={{ fontSize: 14 }}>
          <input
            type="checkbox"
            checked={soloMias}
            onChange={(e) => setSoloMias(e.target.checked)}
            style={{ width: "auto", marginRight: 6 }}
          />
          Solo asignadas a mí
        </label>
      </div>

      <div className="tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Expediente</th>
              <th>Prioridad</th>
              <th>Vencimiento</th>
              <th>Asignada a</th>
              <th>Estado</th>
              <th className="celda-derecha">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((t) => {
              const vencida =
                t.fechaVencimiento && new Date(t.fechaVencimiento) < hoy && t.estado !== "COMPLETADA";
              return (
                <tr key={t.id}>
                  <td>
                    {t.titulo}
                    {t.descripcion ? (
                      <small style={{ display: "block", color: "var(--tinta-suave)" }}>{t.descripcion}</small>
                    ) : null}
                  </td>
                  <td>
                    {t.expediente ? (
                      <Link href={`/panel/expedientes/${t.expediente.id}`}>{t.expediente.numero}</Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        t.prioridad === "ALTA" ? "chip rojo" : t.prioridad === "MEDIA" ? "chip ambar" : "chip gris"
                      }
                    >
                      {ETIQUETA_PRIORIDAD[t.prioridad] ?? t.prioridad}
                    </span>
                  </td>
                  <td className={vencida ? "texto-alerta" : undefined}>
                    {t.fechaVencimiento ? formatearFecha(t.fechaVencimiento) : "—"}
                    {vencida ? " (vencida)" : ""}
                  </td>
                  <td>{t.asignado.nombre}</td>
                  <td>
                    <span className={t.estado === "COMPLETADA" ? "chip verde" : t.estado === "EN_CURSO" ? "chip azul" : "chip neutro"}>
                      {ETIQUETA_ESTADO_TAREA[t.estado] ?? t.estado}
                    </span>
                  </td>
                  <td className="celda-derecha">
                    {t.estado !== "COMPLETADA" ? (
                      <button className="boton secundario mini" onClick={() => cambiarEstado(t, "COMPLETADA")}>
                        Completar
                      </button>
                    ) : (
                      <button className="boton secundario mini" onClick={() => cambiarEstado(t, "PENDIENTE")}>
                        Reabrir
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtradas.length === 0 && <div className="vacio">Sin tareas.</div>}
      </div>

      {abierto && (
        <div className="dialogo-fondo">
          <form className="dialogo" onSubmit={guardar}>
            <h2>Nueva tarea</h2>
            {error && <div className="error-formulario">{error}</div>}
            <label className="campo">
              <span className="etiqueta">Título</span>
              <input type="text" required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </label>
            <label className="campo">
              <span className="etiqueta">Descripción</span>
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </label>
            <div className="rejilla-formulario">
              <label className="campo">
                <span className="etiqueta">Prioridad</span>
                <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
                  {["BAJA", "MEDIA", "ALTA"].map((p) => (
                    <option key={p} value={p}>
                      {ETIQUETA_PRIORIDAD[p]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span className="etiqueta">Vencimiento</span>
                <input
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                />
              </label>
              <label className="campo">
                <span className="etiqueta">Asignar a</span>
                <select required value={form.asignadoId} onChange={(e) => setForm({ ...form, asignadoId: e.target.value })}>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span className="etiqueta">Expediente</span>
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
