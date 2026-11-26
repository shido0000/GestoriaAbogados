import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { ETIQUETA_ROL } from "@/lib/constantes";
import CerrarSesion from "./CerrarSesion";
import Navegacion from "./Navegacion";
import SelectorTema from "@/components/SelectorTema";

export const dynamic = "force-dynamic";

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/");

  const iniciales = usuario.nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) =>parte[0]!.toUpperCase())
    .join("");

  return (
    <div className="panel">
      <aside className="barra-lateral">
        <div className="marca">
          <div className="marca-icono" aria-hidden="true">
            G
          </div>
          <div>
            <div className="titulo">Gestoría</div>
            <div className="sub">Despacho de abogados</div>
          </div>
        </div>
        <Navegacion rol={usuario.rol} />
        <div className="pie-sesion">
          <div className="datos-usuario">
            <div className="avatar" aria-hidden="true">
              {iniciales}
            </div>
            <div>
              <strong>{usuario.nombre}</strong>
              <br />
              <span className="rol">{ETIQUETA_ROL[usuario.rol] ?? usuario.rol}</span>
            </div>
          </div>
          <div className="fila-tema">
            <SelectorTema />
            <CerrarSesion />
          </div>
        </div>
      </aside>
      <main className="contenido">{children}</main>
    </div>
  );
}
