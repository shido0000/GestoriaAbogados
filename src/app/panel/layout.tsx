import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { ETIQUETA_ROL } from "@/lib/constantes";
import CerrarSesion from "./CerrarSesion";
import Navegacion from "./Navegacion";

export const dynamic = "force-dynamic";

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/");

  return (
    <div className="panel">
      <aside className="barra-lateral">
        <div className="marca">
          <div className="titulo">Gestoría de Abogados</div>
          <div className="sub">Área privada del despacho</div>
        </div>
        <Navegacion rol={usuario.rol} />
        <div className="pie-sesion">
          <div className="datos-usuario">
            <strong>{usuario.nombre}</strong>
            <br />
            <span className="rol">{ETIQUETA_ROL[usuario.rol] ?? usuario.rol}</span>
          </div>
          <CerrarSesion />
        </div>
      </aside>
      <main className="contenido">{children}</main>
    </div>
  );
}
