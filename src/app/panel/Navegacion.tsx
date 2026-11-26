"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GRUPOS: { titulo: string; enlaces: { href: string; etiqueta: string; roles: string[] }[] }[] = [
  {
    titulo: "Operación",
    enlaces: [
      { href: "/panel", etiqueta: "Panel", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
      { href: "/panel/clientes", etiqueta: "Clientes", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
      { href: "/panel/expedientes", etiqueta: "Expedientes", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
      { href: "/panel/tareas", etiqueta: "Tareas", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
      { href: "/panel/audiencias", etiqueta: "Audiencias y plazos", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
      { href: "/panel/documentos", etiqueta: "Documentos", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
    ],
  },
  {
    titulo: "Gestión",
    enlaces: [
      { href: "/panel/facturas", etiqueta: "Facturación", roles: ["ADMIN", "ABOGADO"] },
      { href: "/panel/reportes", etiqueta: "Reportes", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
    ],
  },
  {
    titulo: "Administración",
    enlaces: [{ href: "/panel/usuarios", etiqueta: "Usuarios", roles: ["ADMIN"] }],
  },
];

export default function Navegacion({ rol }: { rol: string }) {
  const ruta = usePathname();

  return (
    <nav className="navegacion">
      {GRUPOS.map((grupo) => {
        const enlaces = grupo.enlaces.filter((e) => e.roles.includes(rol));
        if (enlaces.length === 0) return null;
        return (
          <div className="grupo-navegacion" key={grupo.titulo}>
            <div className="grupo-etiqueta">{grupo.titulo}</div>
            {enlaces.map((enlace) => {
              const activo =
                enlace.href === "/panel" ? ruta === "/panel" : ruta.startsWith(enlace.href);
              return (
                <Link key={enlace.href} href={enlace.href} className={activo ? "activo" : undefined}>
                  {enlace.etiqueta}
                  <span className="indicador-activo" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
