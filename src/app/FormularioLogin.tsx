"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FormularioLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@gestoria.es");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, contrasena }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo iniciar sesión");
        return;
      }
      router.replace("/panel");
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="pagina-login">
      <div className="tarjeta-login">
        <div className="escudo">G</div>
        <h1>Gestoría de Abogados</h1>
        <p className="subtitulo">Acceso al área privada del despacho</p>
        {error && <div className="error-formulario">{error}</div>}
        <form onSubmit={enviar}>
          <label className="campo">
            <span className="etiqueta">Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label className="campo">
            <span className="etiqueta">Contraseña</span>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button className="boton" type="submit" disabled={cargando}>
            {cargando ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <div className="ayuda-login">
          Usuario de demostración: <strong>admin@gestoria.es</strong> / <strong>Admin123!</strong>
        </div>
      </div>
    </div>
  );
}
