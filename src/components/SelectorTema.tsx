"use client";

import { useEffect, useState } from "react";

type Tema = "claro" | "oscuro";

export default function SelectorTema() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    setTema(document.documentElement.dataset.tema === "oscuro" ? "oscuro" : "claro");
  }, []);

  function alternar() {
    const nuevo: Tema = tema === "oscuro" ? "claro" : "oscuro";
    document.documentElement.dataset.tema = nuevo;
    try {
      localStorage.setItem("tema", nuevo);
    } catch {}
    setTema(nuevo);
  }

  return (
    <button
      type="button"
      className="boton secundario mini selector-tema"
      onClick={alternar}
      aria-label="Cambiar entre modo claro y oscuro"
      title={tema === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {tema === null ? "" : tema === "oscuro" ? "☀ Modo claro" : "☾ Modo oscuro"}
    </button>
  );
}
