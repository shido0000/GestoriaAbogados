"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatearFecha, formatearTamano } from "@/lib/constantes";

type DocumentoItem = {
  id: number;
  nombre: string;
  mimeType: string;
  tamano: number;
  subidoEn: string;
  subido: { nombre: string };
  expediente: { id: number; numero: string; titulo: string } | null;
  cliente: { id: number; nombre: string } | null;
};

export default function PaginaDocumentos({
  documentos,
  expedientes,
  clientes,
  puedeEliminar,
}: {
  documentos: DocumentoItem[];
  expedientes: { id: number; numero: string }[];
  clientes: { id: number; nombre: string }[];
  puedeEliminar: boolean;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [destino, setDestino] = useState<{ tipo: "expediente" | "cliente"; id: string }>({
    tipo: "expediente",
    id: "",
  });
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return documentos;
    return documentos.filter((d) => d.nombre.toLowerCase().includes(q));
  }, [documentos, busqueda]);

  async function subir(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) return;
    setSubiendo(true);
    setError(null);
    const datos = new FormData();
    datos.append("archivo", archivo);
    if (destino.id) {
      datos.append(destino.tipo === "expediente" ? "expedienteId" : "clienteId", destino.id);
    }
    const respuesta = await fetch("/api/documentos", { method: "POST", body: datos });
    setSubiendo(false);
    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({}));
      setError(error.error ?? "No se pudo subir el documento");
      return;
    }
    setArchivo(null);
    router.refresh();
  }

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar este documento?")) return;
    const respuesta = await fetch(`/api/documentos/${id}`, { method: "DELETE" });
    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({}));
      alert(error.error ?? "No se pudo eliminar");
    }
    router.refresh();
  }

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Documentos</h1>
          <div className="descripcion">{documentos.length} documento(s) en el despacho</div>
        </div>
      </div>

      <div className="tarjeta">
        <h2>Subir documento</h2>
        <div className="cuerpo">
          {error && <div className="error-formulario">{error}</div>}
          <form className="filtros" onSubmit={subir} style={{ marginBottom: 0 }}>
            <input type="file" required onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
            <select
              value={destino.tipo}
              onChange={(e) => setDestino({ tipo: e.target.value as "expediente" | "cliente", id: "" })}
              style={{ width: "auto" }}
            >
              <option value="expediente">Vincular a expediente</option>
              <option value="cliente">Vincular a cliente</option>
            </select>
            <select
              value={destino.id}
              onChange={(e) => setDestino({ ...destino, id: e.target.value })}
              style={{ width: "auto" }}
            >
              <option value="">Sin vincular</option>
              {destino.tipo === "expediente"
                ? expedientes.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.numero}
                    </option>
                  ))
                : clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
            </select>
            <button className="boton" type="submit" disabled={subiendo || !archivo}>
              {subiendo ? "Subiendo…" : "Subir"}
            </button>
          </form>
        </div>
      </div>

      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar por nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Vinculado a</th>
              <th>Tamaño</th>
              <th>Subido</th>
              <th className="celda-derecha">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((d) => (
              <tr key={d.id}>
                <td>
                  <a href={`/api/documentos/${d.id}`} target="_blank" rel="noreferrer">
                    <strong>{d.nombre}</strong>
                  </a>
                </td>
                <td>
                  {d.expediente ? (
                    <Link href={`/panel/expedientes/${d.expediente.id}`}>{d.expediente.numero}</Link>
                  ) : d.cliente ? (
                    <Link href={`/panel/clientes/${d.cliente.id}`}>{d.cliente.nombre}</Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{formatearTamano(d.tamano)}</td>
                <td>
                  {d.subido.nombre} · {formatearFecha(d.subidoEn)}
                </td>
                <td className="celda-derecha">
                  {puedeEliminar && (
                    <button className="boton peligro mini" onClick={() => eliminar(d.id)}>
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <div className="vacio">Sin documentos.</div>}
      </div>
    </>
  );
}
