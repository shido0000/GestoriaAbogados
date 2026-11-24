import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestoría de Abogados",
  description: "Gestión integral de despachos: clientes, expedientes, plazos, tareas y facturación.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
