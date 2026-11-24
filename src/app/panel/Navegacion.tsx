"use client";

import { usePathname } from "next/navigation";

const ENLACES = [
  { href: "/panel", etiqueta: "Panel", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
  { href: "/panel/clientes", etiqueta: "Clientes", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
  { href: "/panel/expedientes", etiqueta: "Expedientes", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
  { href: "/panel/tareas", etiqueta: "Tareas", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
  { href: "/panel/audiencias", etiqueta: "Audiencias y plazos", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
  { href: "/panel/documentos", etiqueta: "Documentos", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
  { href: "/panel/facturas", etiqueta: "Facturación", roles: ["ADMIN", "ABOGADO"] },
  { href: "/panel/reportes", etiqueta: "Reportes", roles: ["ADMIN", "ABOGADO", "ASISTENTE"] },
  { href: "/panel/usuarios", etiqueta: "Usuarios", roles: ["ADMIN"] },
];

export default function Navegacion({ rol }: { rol: string }) {
  const ruta = usePathname();

  return (
    <nav className="navegacion">
      {ENLACES.filter((e) => e.roles.includes(rol)).map((enlace) => {
        const activo = enlace.href === "/panel" ? ruta === "/panel" : ruta.startsWith(enlace.href);
        return (
          <a key={enlace.href} href={enlace.href} className={activo ? "activo" : undefined}>
            {enlace.etiqueta}
          </a>
        );
      })}
    </nav>
  );
}
