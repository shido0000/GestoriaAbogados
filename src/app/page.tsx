import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import FormularioLogin from "./FormularioLogin";

export const dynamic = "force-dynamic";

export default async function PaginaInicio() {
  const usuario = await getUsuarioActual();
  if (usuario) redirect("/panel");
  return <FormularioLogin />;
}
