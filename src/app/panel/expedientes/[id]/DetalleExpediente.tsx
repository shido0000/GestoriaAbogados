"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ESTADOS_EXPEDIENTE,
  ESTADOS_TAREA,
  ETIQUETA_ESTADO_EXPEDIENTE,
  ETIQUETA_ESTADO_TAREA,
  ETIQUETA_PRIORIDAD,
  ETIQUETA_TIPO_AUDIENCIA,
  TIPOS_AUDIENCIA,
  formatearDinero,
  formatearFecha,
  formatearFechaHora,
  formatearTamano,
  totalFactura,
  puede,
} from "@/lib/constantes";
import { llamarApi, valorFechaInput } from "@/lib/api-cliente";

type TareaItem = {
  id: number;
  titulo: string;
  estado: string;
  prioridad: string;
  fechaVencimiento: string | null;
  asignado: { id: number; nombre: string };
};

type AudienciaItem = {
  id: number;
  titulo: string;
  tipo: string;
  fecha: string;
  lugar: string | null;
};

type NotaItem = {
  id: number;
  contenido: string;
  autorId: number;
  autor: { nombre: string };
  creadoEn: string;
};

type DocumentoItem = {
  id: number;
  nombre: string;
  tamano: number;
  subido: { nombre: string };
  subidoEn: string;
};

type FacturaItem = {
  id: number;
  numero: string;
  concepto: string;
  base: number;
  iva: number;
  estado: string;
};

type ExpedienteCompleto = {
  id: number;
  numero: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  clienteId: number;
  cliente: { id: number; nombre: string; identificacion: string };
  responsable: { id: number; nombre: string };
  creadoEn: string;
  actualizadoEn: string;
  tareas: TareaItem[];
  audiencias: AudienciaItem[];
  notas: NotaItem[];
  facturas: FacturaItem[];
  documentos: DocumentoItem[];
};

export default function DetalleExpediente({
  expediente,
  usuarios,
  rol,
  usuarioId,
}: {
  expediente: ExpedienteCompleto;
  usuarios: { id: number; nombre: string }[];
  rol: string;
  usuarioId: number;
}) {
  const router = useRouter();
  const puedeEditarEstado = ["ADMIN", "ABOGADO"].includes(rol);
  const puedeEliminar = puede(rol, "eliminar");
  const puedeFacturar = puede(rol, "facturas");

  const [errorTarea, setErrorTarea] = useState<string | null>(null);
  const [ocupadoTarea, setOcupadoTarea] = useState(false);
  const [tarea, setTarea] = useState({ titulo: "", prioridad: "MEDIA", fechaVencimiento: "", asignadoId: String(usuarioId) });

  const [audiencia, setAudiencia] = useState({ titulo: "", tipo: "VISTA", fecha: "", lugar: "" });
  const [errorAudiencia, setErrorAudiencia] = useState<string | null>(null);

  const [nota, setNota] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const hoy = new Date();

  async function crearTarea(e: React.FormEvent) {
    e.preventDefault();
    setOcupadoTarea(true);
    setErrorTarea(null);
    const resultado = await llamarApi("/api/tareas", "POST", {
      titulo: tarea.titulo,
      prioridad: tarea.prioridad,
      fechaVencimiento: tarea.fechaVencimiento || null,
      asignadoId: Number(tarea.asignadoId),
      expedienteId: expediente.id,
    });
    setOcupadoTarea(false);
    if (!resultado.ok) {
      setErrorTarea(resultado.error);
      return;
    }
    setTarea({ titulo: "", prioridad: "MEDIA", fechaVencimiento: "", asignadoId: String(usuarioId) });
    router.refresh();
  }

  async function estadoTarea(id: number, estado: string) {
    const resultado = await llamarApi(`/api/tareas/${id}`, "PUT", { estado });
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  async function crearAudiencia(e: React.FormEvent) {
    e.preventDefault();
    setErrorAudiencia(null);
    const resultado = await llamarApi("/api/audiencias", "POST", {
      titulo: audiencia.titulo,
      tipo: audiencia.tipo,
      fecha: audiencia.fecha,
      lugar: audiencia.lugar,
      expedienteId: expediente.id,
    });
    if (!resultado.ok) {
      setErrorAudiencia(resultado.error);
      return;
    }
    setAudiencia({ titulo: "", tipo: "VISTA", fecha: "", lugar: "" });
    router.refresh();
  }

  async function borrarAudiencia(id: number) {
    if (!confirm("¿Eliminar esta audiencia o plazo?")) return;
    const resultado = await llamarApi(`/api/audiencias/${id}`, "DELETE");
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  async function crearNota(e: React.FormEvent) {
    e.preventDefault();
    if (!nota.trim()) return;
    const resultado = await llamarApi("/api/notas", "POST", {
      contenido: nota,
      expedienteId: expediente.id,
    });
    if (!resultado.ok) {
      alert(resultado.error);
      return;
    }
    setNota("");
    router.refresh();
  }

  async function borrarNota(id: number) {
    if (!confirm("¿Eliminar esta nota?")) return;
    const resultado = await llamarApi(`/api/notas/${id}`, "DELETE");
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  async function subirDocumento(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) return;
    setSubiendo(true);
    const datos = new FormData();
    datos.append("archivo", archivo);
    datos.append("expedienteId", String(expediente.id));
    const respuesta = await fetch("/api/documentos", { method: "POST", body: datos });
    setSubiendo(false);
    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({}));
      alert(error.error ?? "No se pudo subir el documento");
      return;
    }
    setArchivo(null);
    router.refresh();
  }

  async function borrarDocumento(id: number) {
    if (!confirm("¿Eliminar este documento?")) return;
    const resultado = await llamarApi(`/api/documentos/${id}`, "DELETE");
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  return (
    <>
      <div className="barra-cabecera">
        <Link href="/panel/expedientes">← Volver a expedientes</Link>
      </div>

      <div className="cabecera-pagina">
        <div>
          <h1>
            {expediente.numero} — {expediente.titulo}
          </h1>
          <div className="descripcion">
            Cliente:{" "}
            <Link href={`/panel/clientes/${expediente.clienteId}`}>
              <strong>{expediente.cliente.nombre}</strong>
            </Link>
          </div>
        </div>
        <div className="acciones-en-linea">
          {puedeEditarEstado && (
            <select
              value={expediente.estado}
              onChange={async (e) => {
                const resultado = await llamarApi(`/api/expedientes/${expediente.id}`, "PUT", { estado: e.target.value });
                if (!resultado.ok) alert(resultado.error);
                router.refresh();
              }}
              style={{ width: "auto" }}
            >
              {ESTADOS_EXPEDIENTE.map((s) => (
                <option key={s} value={s}>
                  {ETIQUETA_ESTADO_EXPEDIENTE[s]}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="rejilla-dos">
        <div className="tarjeta">
          <h2>Ficha del expediente</h2>
          <div className="cuerpo ficha">
            <dl>
              <dt>Descripción</dt>
              <dd>{expediente.descripcion ?? "—"}</dd>
              <dt>Responsable</dt>
              <dd>{expediente.responsable.nombre}</dd>
              <dt>Estado</dt>
              <dd>{ETIQUETA_ESTADO_EXPEDIENTE[expediente.estado] ?? expediente.estado}</dd>
              <dt>Creado / Última modificación</dt>
              <dd>
                {formatearFecha(expediente.creadoEn)} / {formatearFecha(expediente.actualizadoEn)}
              </dd>
            </dl>
          </div>
        </div>

        <div className="tarjeta">
          <h2>Facturación del expediente</h2>
          {expediente.facturas.length === 0 ? (
            <div className="vacio">Sin facturas. Se pueden crear desde la sección Facturación.</div>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {expediente.facturas.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <Link href="/panel/facturas">{f.numero}</Link>
                    </td>
                    <td>{formatearDinero(totalFactura(f.base, f.iva))}</td>
                    <td>{f.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="tarjeta">
        <h2>Tareas</h2>
        <div className="cuerpo">
          <form onSubmit={crearTarea} className="rejilla-formulario">
            {errorTarea && <div className="error-formulario campo-anchura">{errorTarea}</div>}
            <label className="campo campo-anchura">
              <span className="etiqueta">Nueva tarea</span>
              <input
                type="text"
                required
                placeholder="Descripción de la tarea"
                value={tarea.titulo}
                onChange={(e) => setTarea({ ...tarea, titulo: e.target.value })}
              />
            </label>
            <label className="campo">
              <span className="etiqueta">Prioridad</span>
              <select value={tarea.prioridad} onChange={(e) => setTarea({ ...tarea, prioridad: e.target.value })}>
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
                value={tarea.fechaVencimiento}
                onChange={(e) => setTarea({ ...tarea, fechaVencimiento: e.target.value })}
              />
            </label>
            <label className="campo">
              <span className="etiqueta">Asignar a</span>
              <select value={tarea.asignadoId} onChange={(e) => setTarea({ ...tarea, asignadoId: e.target.value })}>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo" style={{ alignSelf: "end" }}>
              <button className="boton" type="submit" disabled={ocupadoTarea}>
                Añadir tarea
              </button>
            </label>
          </form>
        </div>
        {expediente.tareas.length === 0 ? (
          <div className="vacio">Sin tareas.</div>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Prioridad</th>
                <th>Vence</th>
                <th>Asignada a</th>
                <th>Estado</th>
                <th className="celda-derecha">Acción</th>
              </tr>
            </thead>
            <tbody>
              {expediente.tareas.map((t) => (
                <tr key={t.id}>
                  <td>{t.titulo}</td>
                  <td>
                    <span className={t.prioridad === "ALTA" ? "chip rojo" : t.prioridad === "MEDIA" ? "chip ambar" : "chip gris"}>
                      {ETIQUETA_PRIORIDAD[t.prioridad] ?? t.prioridad}
                    </span>
                  </td>
                  <td className={t.fechaVencimiento && new Date(t.fechaVencimiento) < hoy && t.estado !== "COMPLETADA" ? "texto-alerta" : undefined}>
                    {t.fechaVencimiento ? formatearFecha(t.fechaVencimiento) : "—"}
                  </td>
                  <td>{t.asignado.nombre}</td>
                  <td>
                    <span className={t.estado === "COMPLETADA" ? "chip verde" : "chip neutro"}>
                      {ETIQUETA_ESTADO_TAREA[t.estado] ?? t.estado}
                    </span>
                  </td>
                  <td className="celda-derecha">
                    {t.estado !== "COMPLETADA" ? (
                      <button className="boton secundario mini" onClick={() => estadoTarea(t.id, "COMPLETADA")}>
                        Completar
                      </button>
                    ) : (
                      <button className="boton secundario mini" onClick={() => estadoTarea(t.id, "PENDIENTE")}>
                        Reabrir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rejilla-dos">
        <div className="tarjeta">
          <h2>Audiencias y plazos</h2>
          <div className="cuerpo">
            <form onSubmit={crearAudiencia} className="rejilla-formulario">
              {errorAudiencia && <div className="error-formulario campo-anchura">{errorAudiencia}</div>}
              <label className="campo campo-anchura">
                <span className="etiqueta">Título</span>
                <input
                  type="text"
                  required
                  value={audiencia.titulo}
                  onChange={(e) => setAudiencia({ ...audiencia, titulo: e.target.value })}
                />
              </label>
              <label className="campo">
                <span className="etiqueta">Tipo</span>
                <select value={audiencia.tipo} onChange={(e) => setAudiencia({ ...audiencia, tipo: e.target.value })}>
                  {TIPOS_AUDIENCIA.map((t) => (
                    <option key={t} value={t}>
                      {ETIQUETA_TIPO_AUDIENCIA[t]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span className="etiqueta">Fecha y hora</span>
                <input
                  type="datetime-local"
                  required
                  value={audiencia.fecha}
                  onChange={(e) => setAudiencia({ ...audiencia, fecha: e.target.value })}
                />
              </label>
              <label className="campo campo-anchura">
                <span className="etiqueta">Lugar</span>
                <input
                  type="text"
                  value={audiencia.lugar}
                  onChange={(e) => setAudiencia({ ...audiencia, lugar: e.target.value })}
                />
              </label>
              <button className="boton" type="submit">
                Añadir
              </button>
            </form>
          </div>
          {expediente.audiencias.length === 0 ? (
            <div className="vacio">Sin audiencias ni plazos.</div>
          ) : (
            <ul className="lista-compacta">
              {expediente.audiencias.map((a) => {
                const futura = new Date(a.fecha) >= hoy;
                return (
                  <li key={a.id}>
                    <span className={futura ? undefined : "texto-alerta"}>
                      {formatearFechaHora(a.fecha)} · {ETIQUETA_TIPO_AUDIENCIA[a.tipo] ?? a.tipo} —{" "}
                      {a.titulo}
                      {a.lugar ? <small> · {a.lugar}</small> : null}
                    </span>
                    {puedeEliminar && (
                      <button className="boton peligro mini" onClick={() => borrarAudiencia(a.id)}>
                        ✕
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="tarjeta">
          <h2>Notas internas</h2>
          <div className="cuerpo">
            <form onSubmit={crearNota}>
              <textarea
               required
                placeholder="Escribe una nota…"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
              <div className="pie-dialogo" style={{ marginTop: 10 }}>
                <button className="boton" type="submit">
                  Guardar nota
                </button>
              </div>
            </form>
          </div>
          {expediente.notas.length === 0 ? (
            <div className="vacio">Sin notas todavía.</div>
          ) : (
            <ul className="lista-compacta">
              {expediente.notas.map((n) => (
                <li key={n.id} style={{ alignItems: "flex-start" }}>
                  <span>
                    {n.contenido}
                    <br />
                    <small>
                      {n.autor.nombre} · {formatearFechaHora(n.creadoEn)}
                    </small>
                  </span>
                  {(rol === "ADMIN" || ["ADMIN", "ABOGADO"].includes(rol) || n.autorId === usuarioId) && (
                    <button className="boton peligro mini" onClick={() => borrarNota(n.id)}>
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="tarjeta">
        <h2>Documentos</h2>
        <div className="cuerpo">
          <form onSubmit={subirDocumento} className="filtros" style={{ marginBottom: 0 }}>
            <input
              type="file"
              required
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              style={{ width: "auto" }}
            />
            <button className="boton" type="submit" disabled={subiendo || !archivo}>
              {subiendo ? "Subiendo…" : "Subir documento"}
            </button>
          </form>
        </div>
        {expediente.documentos.length === 0 ? (
          <div className="vacio">Sin documentos adjuntos.</div>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tamaño</th>
                <th>Subido</th>
                <th className="celda-derecha">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expediente.documentos.map((d) => (
                <tr key={d.id}>
                  <td>
                    <a href={`/api/documentos/${d.id}`} target="_blank" rel="noreferrer">
                      {d.nombre}
                    </a>
                  </td>
                  <td>{formatearTamano(d.tamano)}</td>
                  <td>
                    {d.subido.nombre} · {formatearFecha(d.subidoEn)}
                  </td>
                  <td className="celda-derecha">
                    {puedeEliminar && (
                      <button className="boton peligro mini" onClick={() => borrarDocumento(d.id)}>
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
