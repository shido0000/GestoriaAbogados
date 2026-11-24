"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CerrarSesion() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  return (
    <button
      className="boton secundario mini"
      disabled={cargando}
      onClick={async () => {
        setCargando(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/");
        router.refresh();
      }}
    >
      {cargando ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
