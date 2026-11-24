"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ETIQUETA_ROL, ROLES, formatearFecha } from "@/lib/constantes";
import { llamarApi } from "@/lib/api-cliente";

type UsuarioItem = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  creadoEn: string;
  expedientes: number;
  tareas: number;
};

const VACIO = { nombre: "", email: "", contrasena: "", rol: "ASISTENTE" };

export default function PaginaUsuarios({
  usuarios,
  usuarioActualId,
}: {
  usuarios: UsuarioItem[];
  usuarioActualId: number;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(VACIO);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    const resultado = await llamarApi("/api/usuarios", "POST", form);
    setOcupado(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setAbierto(false);
    setForm(VACIO);
    router.refresh();
  }

  async function alternarActivo(u: UsuarioItem) {
    const resultado = await llamarApi(`/api/usuarios/${u.id}`, "PUT", { activo: !u.activo });
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  async function cambiarRol(u: UsuarioItem, nuevoRol: string) {
    const resultado = await llamarApi(`/api/usuarios/${u.id}`, "PUT", { rol: nuevoRol });
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  async function eliminar(u: UsuarioItem) {
    if (!confirm(`¿Eliminar la cuenta de "${u.nombre}"?`)) return;
    const resultado = await llamarApi(`/api/usuarios/${u.id}`, "DELETE");
    if (!resultado.ok) alert(resultado.error);
    router.refresh();
  }

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Usuarios</h1>
          <div className="descripcion">{usuarios.length} usuario(s) del despacho</div>
        </div>
        <button className="boton" onClick={() => { setAbierto(true); setError(null); }}>
          Nuevo usuario
        </button>
      </div>

      <div className="tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Activo</th>
              <th>Alta</th>
              <th>Carga</th>
              <th className="celda-derecha">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.nombre}</strong>
                  {u.id === usuarioActualId ? " (tú)" : ""}
                </td>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.rol}
                    onChange={(e) => cambiarRol(u, e.target.value)}
                    disabled={u.id === usuarioActualId}
                    style={{ width: "auto", padding: "3px 6px", fontSize: 13 }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ETIQUETA_ROL[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className={u.activo ? "chip verde" : "chip gris"}>
                    {u.activo ? "Activo" : "Desactivado"}
                  </span>
                </td>
                <td>{formatearFecha(u.creadoEn)}</td>
                <td>
                  <small>
                    {u.expedientes} exp. · {u.tareas} tareas
                  </small>
                </td>
                <td className="celda-derecha">
                  {u.id !== usuarioActualId && (
                    <>
                      <button className="boton secundario mini" onClick={() => alternarActivo(u)}>
                        {u.activo ? "Desactivar" : "Activar"}
                      </button>{" "}
                      <button className="boton peligro mini" onClick={() => eliminar(u)}>
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {abierto && (
        <div className="dialogo-fondo">
          <form className="dialogo" onSubmit={guardar}>
            <h2>Nuevo usuario</h2>
            {error && <div className="error-formulario">{error}</div>}
            <div className="rejilla-formulario">
              <label className="campo">
                <span className="etiqueta">Nombre</span>
                <input type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </label>
              <label className="campo">
                <span className="etiqueta">Email</span>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="campo">
                <span className="etiqueta">Contraseña (mín. 8 caracteres)</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.contrasena}
                  onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
                />
              </label>
              <label className="campo">
                <span className="etiqueta">Rol</span>
                <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ETIQUETA_ROL[r]}
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
                {ocupado ? "Creando…" : "Crear usuario"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
