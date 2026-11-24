"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ETIQUETA_TIPO_AUDIENCIA, TIPOS_AUDIENCIA, formatearFechaHora } from "@/lib/constantes";
import { llamarApi } from "@/lib/api-cliente";

type ExpedienteRef = { id: number; numero: string; titulo: string; cliente: { nombre: string } };

type AudienciaItem = {
  id: number;
  titulo: string;
  tipo: string;
  fecha: string;
  lugar: string | null;
  notas: string | null;
  expediente: ExpedienteRef;
};

export default function PaginaAudiencias({
  audiencias,
  expedientes,
  puedeEliminar,
}: {
  audiencias: AudienciaItem[];
  expedientes: { id: number; numero: string; titulo: string }[];
  puedeEliminar: boolean;
}) {
  const router = useRouter();
  const [ventana, setVentana] = useState<"proximas" | "quincena" | "pasadas">("proximas");
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ titulo: "", tipo: "VISTA", fecha: "", lugar: "", notas: "", expedienteId: "" });

  const ahora = new Date();
  const en14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const filtradas = useMemo(
    () =>
      audiencias.filter((a) => {
        const fecha = new Date(a.fecha);
        if (ventana === "proximas") return fecha >= ahora;
        if (ventana === "quincena") return fecha >= ahora && fecha <= en14;
        return fecha < ahora;
      }),
    [audiencias, ventana],
  );

  const proximas = filtradas.filter((a) => new Date(a.fecha) >= ahora);
  const pasadas = filtradas.filter((a) => new Date(a.fecha) < ahora);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    const resultado = await llamarApi("/api/audiencias", "POST", {
      titulo: form.titulo,
      tipo: form.tipo,
      fecha: form.fecha,
      lugar: form.lugar,
      notas: form.notas,
      expedienteId: Number(form.expedienteId),
    });
    setOcupado(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setAbierto(false);
    setForm({ titulo: "", tipo: "VISTA", fecha: "", lugar: "", notas: "", expedienteId: "" });
    router.refresh();
  }

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar esta audiencia o plazo?")) return;
    const resultado = await llamarApi(`/api/audiencias/${id}`, "DELETE");
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  function fila(a: AudienciaItem) {
    const futura = new Date(a.fecha) >= ahora;
    return (
      <tr key={a.id} className={futura ? undefined : "hielo-tr"}>
        <td>{formatearFechaHora(a.fecha)}</td>
        <td>
          <span className={a.tipo === "PLAZO" ? "chip ambar" : "chip azul"}>
            {ETIQUETA_TIPO_AUDIENCIA[a.tipo] ?? a.tipo}
          </span>
        </td>
        <td>{a.titulo}</td>
        <td>
          <Link href={`/panel/expedientes/${a.expediente.id}`}>{a.expediente.numero}</Link>
          <small style={{ display: "block" }}>{a.expediente.cliente.nombre}</small>
        </td>
        <td>{a.lugar ?? "—"}</td>
        <td className="celda-derecha">
          {puedeEliminar && (
            <button className="boton peligro mini" onClick={() => eliminar(a.id)}>
              Eliminar
            </button>
          )}
        </td>
      </tr>
    );
  }

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Audiencias y plazos procesales</h1>
          <div className="descripcion">{proximas.length} evento(s) futuros en esta vista</div>
        </div>
        <button className="boton" onClick={() => { setAbierto(true); setError(null); }}>
          Nueva audiencia / plazo
        </button>
      </div>

      <div className="filtros">
        <select value={ventana} onChange={(e) => setVentana(e.target.value as typeof ventana)}>
          <option value="proximas">Todos los futuros</option>
          <option value="quincena">Próximos 14 días</option>
          <option value="pasadas">Pasados</option>
        </select>
      </div>

      <div className="tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Título</th>
              <th>Expediente</th>
              <th>Lugar</th>
              <th className="celda-derecha">Acciones</th>
            </tr>
          </thead>
          <tbody>{[...proximas, ...pasadas].map(fila)}</tbody>
        </table>
        {proximas.length === 0 && pasadas.length === 0 && (
          <div className="vacio">Sin eventos en esta vista.</div>
        )}
      </div>

      {abierto && (
        <div className="dialogo-fondo">
          <form className="dialogo" onSubmit={guardar}>
            <h2>Nueva audiencia o plazo</h2>
            {error && <div className="error-formulario">{error}</div>}
            <label className="campo">
              <span className="etiqueta">Título</span>
              <input type="text" required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </label>
            <div className="rejilla-formulario">
              <label className="campo">
                <span className="etiqueta">Tipo</span>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
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
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </label>
              <label className="campo campo-anchura">
                <span className="etiqueta">Expediente</span>
                <select
                  required
                  value={form.expedienteId}
                  onChange={(e) => setForm({ ...form, expedienteId: e.target.value })}
                >
                  <option value="">Seleccionar…</option>
                  {expedientes.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.numero} — {x.titulo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo campo-anchura">
                <span className="etiqueta">Lugar</span>
                <input type="text" value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} />
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
