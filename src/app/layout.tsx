import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestoría de Abogados",
  description: "Gestión integral de despachos: clientes, expedientes, plazos, tareas y facturación.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-tema="claro" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("tema");if(t!=="claro"&&t!=="oscuro"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"oscuro":"claro";}document.documentElement.dataset.tema=t;}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
