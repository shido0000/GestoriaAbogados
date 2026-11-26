"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SelectorTema from "@/components/SelectorTema";

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
      <div className="contenedor-login">
        <div className="login-marca">
          <div className="marca-icono marca-icono-grande" aria-hidden="true">
            G
          </div>
          <h2>Gestoría de Abogados</h2>
          <p className="login-lema">
            La gestión integral de tu despacho: expedientes, plazos procesales, tareas del equipo,
            documentos y facturación en una única plataforma.
          </p>
          <ul className="login-virtudes">
            <li>
              <span className="punto-virtud" aria-hidden="true" />
              Expedientes con numeración y estados controlados
            </li>
            <li>
              <span className="punto-virtud" aria-hidden="true" />
              Audiencias y plazos con aviso a 14 días vista
            </li>
            <li>
              <span className="punto-virtud" aria-hidden="true" />
              Roles de equipo: admin, abogados y asistentes
            </li>
            <li>
              <span className="punto-virtud" aria-hidden="true" />
              Facturación con IVA y control de cobros
            </li>
          </ul>
          <div className="login-pie-marca">Diseño profesional · Modo claro y oscuro</div>
        </div>
        <div className="login-formulario">
          <div className="tarjeta-login">
            <div className="seccion-tema-login">
              <SelectorTema />
            </div>
            <h1>Acceso al área privada</h1>
            <p className="subtitulo">Introduce tus credenciales para continuar</p>
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
                  placeholder="nombre@despacho.es"
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
                  placeholder="••••••••"
                />
              </label>
              <button className="boton boton-anchura" type="submit" disabled={cargando}>
                {cargando ? "Entrando…" : "Entrar"}
              </button>
            </form>
            <div className="ayuda-login">
              Cuenta de demostración: <strong>admin@gestoria.es</strong> · <strong>Admin123!</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
