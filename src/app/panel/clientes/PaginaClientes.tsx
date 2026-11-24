"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ETIQUETA_TIPO_CLIENTE, formatearFecha } from "@/lib/constantes";
import { llamarApi } from "@/lib/api-cliente";

type ClienteLista = {
  id: number;
  nombre: string;
  tipo: string;
  identificacion: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  notas: string | null;
  creadoEn: string;
  _count: { expedientes: number; documentos: number };
};

type ClienteFormulario = {
  id?: number;
  nombre: string;
  tipo: string;
  identificacion: string;
  email: string;
  telefono: string;
  direccion: string;
  notas: string;
};

const VACIO: ClienteFormulario = {
  nombre: "",
  tipo: "PARTICULAR",
  identificacion: "",
  email: "",
  telefono: "",
  direccion: "",
  notas: "",
};

export default function PaginaClientes({
  clientes,
  puedeEditar,
  puedeEliminar,
}: {
  clientes: ClienteLista[];
  puedeEditar: boolean;
  puedeEliminar: boolean;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [ abierto, setAbierto] = useState(false);
  const [formulario, setFormulario] = useState<ClienteFormulario>(VACIO);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.identificacion.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [clientes, busqueda]);

  function abrirNuevo() {
    setFormulario(VACIO);
    setError(null);
    setAbierto(true);
  }

  function abrirEdicion(c: ClienteLista) {
    setFormulario({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      identificacion: c.identificacion,
      email: c.email ?? "",
      telefono: c.telefono ?? "",
      direccion: c.direccion ?? "",
      notas: c.notas ?? "",
    });
    setError(null);
    setAbierto(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    const resultado = formulario.id
      ? await llamarApi(`/api/clientes/${formulario.id}`, "PUT", formulario)
      : await llamarApi("/api/clientes", "POST", formulario);
    setOcupado(false);
    if (!resultado.ok) {
      setError(resultado.error ?? "No se pudo guardar");
      return;
    }
    setAbierto(false);
    router.refresh();
  }

  async function eliminar(c: ClienteLista) {
    if (!confirm(`¿Eliminar a "${c.nombre}"? Esta acción no se puede deshacer.`)) return;
    const resultado = await llamarApi(`/api/clientes/${c.id}`, "DELETE");
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Clientes</h1>
          <div className="descripcion">{clientes.length} cliente(s) registrados</div>
        </div>
        {puedeEditar && (
          <button className="boton" onClick={abrirNuevo}>
            Nuevo cliente
          </button>
        )}
      </div>

      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar por nombre, DNI/NIF o email…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>DNI/NIF</th>
              <th>Contacto</th>
              <th>Alta</th>
              <th>Expedientes</th>
              <th className="celda-derecha">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/panel/clientes/${c.id}`}>
                    <strong>{c.nombre}</strong>
                  </Link>
                </td>
                <td>
                  <span className={c.tipo === "EMPRESA" ? "chip azul" : "chip neutro"}>
                    {ETIQUETA_TIPO_CLIENTE[c.tipo] ?? c.tipo}
                  </span>
                </td>
                <td>{c.identificacion}</td>
                <td>
                  {c.email ?? "—"}
                  <br />
                  <small>{c.telefono ?? ""}</small>
                </td>
                <td>{formatearFecha(c.creadoEn)}</td>
                <td>{c._count.expedientes}</td>
                <td className="celda-derecha">
                  {puedeEditar && (
                    <button className="boton secundario mini" onClick={() => abrirEdicion(c)}>
                      Editar
                    </button>
                  )}{" "}
                  {puedeEliminar && (
                    <button className="boton peligro mini" onClick={() => eliminar(c)}>
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
            <h2>{formulario.id ? "Editar cliente" : "Nuevo cliente"}</h2>
            {error && <div className="error-formulario">{error}</div>}
            <div className="rejilla-formulario">
              <label className="campo">
                <span className="etiqueta">Nombre completo / razón social</span>
                <input
                  type="text"
                  required
                  value={formulario.nombre}
                  onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                />
              </label>
              <label className="campo">
                <span className="etiqueta">Tipo</span>
                <select
                  value={formulario.tipo}
                  onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
                >
                  <option value="PARTICULAR">Particular</option>
                  <option value="EMPRESA">Empresa</option>
                </select>
              </label>
              <label className="campo">
                <span className="etiqueta">DNI / NIF</span>
                <input
                  type="text"
                  required
                  value={formulario.identificacion}
                  onChange={(e) => setFormulario({ ...formulario, identificacion: e.target.value })}
                />
              </label>
              <label className="campo">
                <span className="etiqueta">Email</span>
                <input
                  type="email"
                  value={formulario.email}
                  onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
                />
              </label>
              <label className="campo">
                <span className="etiqueta">Teléfono</span>
                <input
                  type="tel"
                  value={formulario.telefono}
                  onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
                />
              </label>
              <label className="campo campo-anchura">
                <span className="etiqueta">Dirección</span>
                <input
                  type="text"
                  value={formulario.direccion}
                  onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
                />
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
