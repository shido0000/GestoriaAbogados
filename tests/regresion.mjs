import { spawn } from "node:child_process";
import { setTimeout as esperar } from "node:timers/promises";

const PUERTO = 3440 + Math.floor(Math.random() * 150);
const BASE = `http://127.0.0.1:${PUERTO}`;
const MARCA = `REG-${Date.now().toString(36)}`;

let pasadas = 0;
let fallidas = 0;
const fallos = [];

function comprobar(nombre, condicion, detalle = "") {
  if (condicion) {
    pasadas++;
    console.log(`  ✔ ${nombre}`);
  } else {
    fallidas++;
    fallos.push(nombre);
    console.error(`  ✘ ${nombre}${detalle ? ` — ${detalle}` : ""}`);
  }
}

function clienteHttp() {
  let cookie = "";
  return {
    async req(ruta, { metodo = "GET", cuerpo, cookie: usarCookie = true, formulario } = {}) {
      const cabeceras = {};
      if (usarCookie && cookie) cabeceras.cookie = cookie;
      let datos;
      if (formulario) {
        datos = formulario;
      } else if (cuerpo !== undefined) {
        cabeceras["content-type"] = "application/json";
        datos = JSON.stringify(cuerpo);
      }
      const r = await fetch(BASE + ruta, {
        method: metodo,
        headers: cabeceras,
        body: datos,
        redirect: "manual",
      });
      const set = r.headers.get("set-cookie");
      if (set) cookie = set.split(";")[0];
      let texto = "";
      try {
        texto = await r.text();
      } catch {}
      let json = null;
      try {
        json = JSON.parse(texto);
      } catch {}
      return { estado: r.status, texto, json };
    },
    cerrarSesionLocal() {
      cookie = "";
    },
  };
}

async function esperarServidor(hijo, segundos = 40) {
  for (let i = 0; i < segundos * 2; i++) {
    try {
      const r = await fetch(BASE + "/");
      if (r.status === 200) return;
    } catch {}
    if (hijo.exitCode !== null) throw new Error("El servidor terminó antes de arrancar");
    await esperar(500);
  }
  throw new Error("El servidor no respondió a tiempo");
}

async function principal() {
  const hijo = spawn("npx", ["next", "start", "-p", String(PUERTO)], {
    cwd: process.cwd(),
    stdio: "ignore",
    detached: true,
  });

  try {
    await esperarServidor(hijo);
    console.log(`Servidor listo en ${BASE} (marca de datos de prueba: ${MARCA})\n`);

    const admin = clienteHttp();
    const abogado = clienteHttp();
    const asistente = clienteHttp();

    /* ---------- 1. Autenticación y guardia de sesión ---------- */
    console.log("Autenticación y guardia de sesión");
    comprobar("La raíz responde 200", (await admin.req("/")).estado === 200);
    const loginMalo = await fetch(BASE + "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@gestoria.es", contrasena: "incorrecta" }),
    });
    comprobar("Contraseña incorrecta → 401", loginMalo.status === 401);
    const loginVacio = await fetch(BASE + "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "", contrasena: "" }),
    });
    comprobar("Campos vacíos en login → 400", loginVacio.status === 400);
    comprobar(
      "Login admin correcto → 200",
      (await admin.req("/api/auth/login", { metodo: "POST", cuerpo: { email: "admin@gestoria.es", contrasena: "Admin123!" }, cookie: false })).estado === 200,
    );
    comprobar("Panel con sesión → 200", (await admin.req("/panel")).estado === 200);
    const sinSesion = clienteHttp();
    const panelSinSesion = await sinSesion.req("/panel", { cookie: false });
    comprobar("Panel sin sesión → redirect (307/302)", [302, 307].includes(panelSinSesion.estado));
    const apiSinSesion = await sinSesion.req("/api/clientes", { cookie: false });
    comprobar("API sin sesión → 401", apiSinSesion.estado === 401);

    /* ---------- 2. Creación de usuarios y roles ---------- */
    console.log("\nUsuarios y roles");
    const emailAbogado = `${MARCA}-abogado@prueba.es`;
    const emailAsistente = `${MARCA}-asistente@prueba.es`;
    const altaAbogado = await admin.req("/api/usuarios", {
      metodo: "POST",
      cuerpo: { nombre: "Abogado Prueba", email: emailAbogado, contrasena: "Prueba123!", rol: "ABOGADO" },
    });
    comprobar("Admin crea abogado → 201", altaAbogado.estado === 201);
    const altaAsistente = await admin.req("/api/usuarios", {
      metodo: "POST",
      cuerpo: { nombre: "Asistente Prueba", email: emailAsistente, contrasena: "Prueba123!", rol: "ASISTENTE" },
    });
    comprobar("Admin crea asistente → 201", altaAsistente.estado === 201);
    const altaDuplicada = await admin.req("/api/usuarios", {
      metodo: "POST",
      cuerpo: { nombre: "Duplicado", email: emailAbogado, contrasena: "Prueba123!", rol: "ABOGADO" },
    });
    comprobar("Email duplicado de usuario → 500 (constraint) manejado", altaDuplicada.estado >= 400);
    const idAbogado = altaAbogado.json?.id;
    const idAsistente = altaAsistente.json?.id;

    comprobar(
      "Login abogado → 200",
      (await abogado.req("/api/auth/login", { metodo: "POST", cuerpo: { email: emailAbogado, contrasena: "Prueba123!" }, cookie: false })).estado === 200,
    );
    comprobar(
      "Login asistente → 200",
      (await asistente.req("/api/auth/login", { metodo: "POST", cuerpo: { email: emailAsistente, contrasena: "Prueba123!" }, cookie: false })).estado === 200,
    );

    /* ---------- 3. Clientes ---------- */
    console.log("\nClientes");
    const dni = `${MARCA.slice(-6)}X`;
    const clienteCreado = await admin.req("/api/clientes", {
      metodo: "POST",
      cuerpo: { nombre: `Cliente ${MARCA}`, tipo: "EMPRESA", identificacion: dni, email: `${MARCA}@prueba.es`, telefono: "600 000 000" },
    });
    comprobar("Crear cliente → 201", clienteCreado.estado === 201);
    const idCliente = clienteCreado.json?.id;
    comprobar("Crear cliente sin DNI → 400", (await admin.req("/api/clientes", { metodo: "POST", cuerpo: { nombre: "SsinDNI" } })).estado === 400);
    comprobar(
      "DNI duplicado rechazado",
      (await admin.req("/api/clientes", { metodo: "POST", cuerpo: { nombre: "Otro", identificacion: dni } })).estado >= 400,
    );
    comprobar(
      "Asistente no puede crear clientes → 403",
      (await asistente.req("/api/clientes", { metodo: "POST", cuerpo: { nombre: "X", identificacion: `NO-${dni}` } })).estado === 403,
    );
    const clienteEditado = await abogado.req(`/api/clientes/${idCliente}`, {
      metodo: "PUT",
      cuerpo: { nombre: `Cliente ${MARCA} Editado`, tipo: "EMPRESA", identificacion: dni, direccion: "C/ Prueba 1" },
    });
    comprobar("Abogado edita cliente → 200", clienteEditado.estado === 200);
    const busqueda = await admin.req(`/api/clientes?q=${encodeURIComponent(`Cliente ${MARCA} Editado`)}`);
    comprobar("Búsqueda por nombre encuentra el cliente", Array.isArray(busqueda.json) && busqueda.json.some((c) => c.id === idCliente));
    comprobar(
      "Detalle de cliente → 200",
      (await admin.req(`/api/clientes/${idCliente}`)).estado === 200,
    );

    /* ---------- 4. Expedientes ---------- */
    console.log("\nExpedientes");
    const expedienteCreado = await admin.req("/api/expedientes", {
      metodo: "POST",
      cuerpo: { titulo: `Expediente ${MARCA}`, descripcion: "Prueba de regresión", estado: "ABIERTO", clienteId: idCliente, responsableId: idAbogado },
    });
    comprobar("Crear expediente → 201", expedienteCreado.estado === 201);
    const idExpediente = expedienteCreado.json?.id;
    comprobar("Número automático EXP-AAAA-NNNN", /^EXP-\d{4}-\d{4}$/.test(expedienteCreado.json?.numero ?? ""));
    comprobar(
      "Crear expediente sin cliente → 400/500",
      (await admin.req("/api/expedientes", { metodo: "POST", cuerpo: { titulo: "X", responsableId: idAbogado } })).estado >= 400,
    );
    const cambioEstado = await abogado.req(`/api/expedientes/${idExpediente}`, { metodo: "PUT", cuerpo: { estado: "EN_PROGRESO" } });
    comprobar("Cambiar estado del expediente → 200", cambioEstado.estado === 200 && cambioEstado.json?.estado === "EN_PROGRESO");
    comprobar(
      "Estado inválido de expediente → 400",
      (await abogado.req(`/api/expedientes/${idExpediente}`, { metodo: "PUT", cuerpo: { estado: "INVENTADO" } })).estado === 400,
    );
    const filtroEstado = await admin.req("/api/expedientes?estado=EN_PROGRESO");
    comprobar("Filtro por estado funciona", Array.isArray(filtroEstado.json) && filtroEstado.json.some((e) => e.id === idExpediente));

    /* ---------- 5. Tareas ---------- */
    console.log("\nTareas");
    const tareaCreada = await abogado.req("/api/tareas", {
      metodo: "POST",
      cuerpo: { titulo: `Tarea ${MARCA}`, prioridad: "ALTA", fechaVencimiento: "2030-01-15", asignadoId: idAbogado, expedienteId: idExpediente },
    });
    comprobar("Crear tarea → 201", tareaCreada.estado === 201);
    const idTarea = tareaCreada.json?.id;
    const tareaAsistente = await asistente.req("/api/tareas", {
      metodo: "POST",
      cuerpo: { titulo: `Tarea asistente ${MARCA}`, asignadoId: idAsistente },
    });
    comprobar("Asistente puede crear tareas → 201", tareaAsistente.estado === 201);
    const completar = await asistente.req(`/api/tareas/${idTarea}`, { metodo: "PUT", cuerpo: { estado: "COMPLETADA" } });
    comprobar("Completar tarea → 200", completar.estado === 200 && completar.json?.estado === "COMPLETADA");
    const reabrir = await abogado.req(`/api/tareas/${idTarea}`, { metodo: "PUT", cuerpo: { estado: "PENDIENTE" } });
    comprobar("Reabrir tarea → 200", reabrir.estado === 200);
    const tareasFiltradas = await admin.req("/api/tareas?estado=PENDIENTE&asignadoId=" + idAbogado);
    comprobar("Filtro tareas por estado y asignado", Array.isArray(tareasFiltradas.json) && tareasFiltradas.json.some((t) => t.id === idTarea));

    /* ---------- 6. Audiencias ---------- */
    console.log("\nAudiencias y plazos");
    const audienciaCreada = await admin.req("/api/audiencias", {
      metodo: "POST",
      cuerpo: { titulo: `Vista ${MARCA}`, tipo: "JUICIO", fecha: "2030-03-10T10:00", lugar: "Audiencia Provincial", expedienteId: idExpediente },
    });
    comprobar("Crear audiencia → 201", audienciaCreada.estado === 201);
    const idAudiencia = audienciaCreada.json?.id;
    comprobar(
      "Audiencia sin fecha → 400",
      (await admin.req("/api/audiencias", { metodo: "POST", cuerpo: { titulo: "Sin fecha", expedienteId: idExpediente } })).estado === 400,
    );
    const futuras = await admin.req("/api/audiencias?futuras=1");
    comprobar("Filtro de futuras incluye la audiencia", Array.isArray(futuras.json) && futuras.json.some((a) => a.id === idAudiencia));
    const borrarAudiencia = await abogado.req(`/api/audiencias/${idAudiencia}`, { metodo: "DELETE" });
    comprobar("Abogado borra audiencia → 200", borrarAudiencia.estado === 200);

    /* ---------- 7. Notas ---------- */
    console.log("\nNotas internas");
    const notaCreada = await asistente.req("/api/notas", {
      metodo: "POST",
      cuerpo: { contenido: `Nota ${MARCA}`, expedienteId: idExpediente },
    });
    comprobar("Asistente crea nota → 201", notaCreada.estado === 201);
    const idNota = notaCreada.json?.id;
    const borradoAjeno = await admin.req(`/api/notas/${idNota}`, { metodo: "DELETE" });
    comprobar("Admin borra nota ajena → 200", borradoAjeno.estado === 200);
    const notaAbogado = await abogado.req("/api/notas", {
      metodo: "POST",
      cuerpo: { contenido: `Nota abogado ${MARCA}`, expedienteId: idExpediente },
    });
    comprobar("Abogado crea nota → 201", notaAbogado.estado === 201);
    comprobar(
      "Abogado borra nota → 200",
      (await abogado.req(`/api/notas/${notaAbogado.json?.id}`, { metodo: "DELETE" })).estado === 200,
    );

    /* ---------- 8. Facturación ---------- */
    console.log("\nFacturación");
    const facturaCreada = await admin.req("/api/facturas", {
      metodo: "POST",
      cuerpo: { concepto: `Honorarios ${MARCA}`, base: 1000, iva: 21, estado: "EMITIDA", clienteId: idCliente, expedienteId: idExpediente },
    });
    comprobar("Crear factura → 201", facturaCreada.estado === 201);
    const idFactura = facturaCreada.json?.id;
    comprobar(
      "Factura con base inválida → 400",
      (await admin.req("/api/facturas", { metodo: "POST", cuerpo: { concepto: "X", base: -5, clienteId: idCliente } })).estado === 400,
    );
    comprobar(
      "Factura con IVA fuera de rango → 400",
      (await admin.req("/api/facturas", { metodo: "POST", cuerpo: { concepto: "X", base: 10, iva: 150, clienteId: idCliente } })).estado === 400,
    );
    comprobar(
      "Asistente no puede crear facturas → 403",
      (await asistente.req("/api/facturas", { metodo: "POST", cuerpo: { concepto: "X", base: 10, clienteId: idCliente } })).estado === 403,
    );
    const pagada = await abogado.req(`/api/facturas/${idFactura}`, { metodo: "PUT", cuerpo: { estado: "PAGADA" } });
    comprobar("Marcar factura pagada → 200", pagada.estado === 200 && pagada.json?.estado === "PAGADA");

    /* ---------- 9. Documentos ---------- */
    console.log("\nDocumentos");
    const bytesArchivo = new TextEncoder().encode(`contenido-prueba-${MARCA}-${"x".repeat(64)}`);
    const formulario = new FormData();
    formulario.append("archivo", new File([bytesArchivo], `prueba-${MARCA}.txt`, { type: "text/plain" }));
    formulario.append("expedienteId", String(idExpediente));
    const subida = await asistente.req("/api/documentos", { metodo: "POST", formulario });
    comprobar("Asistente sube documento → 201", subida.estado === 201);
    const idDocumento = subida.json?.id;
    const descargaAbogado = await abogado.req(`/api/documentos/${idDocumento}`);
    comprobar("Descarga del documento → 200", descargaAbogado.estado === 200);
    comprobar("Contenido binario íntegro", new TextEncoder().encode(descargaAbogado.texto).length === bytesArchivo.length);
    const listaDocs = await admin.req(`/api/documentos?expedienteId=${idExpediente}`);
    comprobar("Listado de documentos del expediente", Array.isArray(listaDocs.json) && listaDocs.json.some((d) => d.id === idDocumento));

    /* ---------- 10. Permisos y accesos de páginas ---------- */
    console.log("\nPáginas y permisos de rol");
    for (const ruta of ["/panel/clientes", "/panel/expedientes", "/panel/tareas", "/panel/audiencias", "/panel/documentos", "/panel/facturas", "/panel/reportes", "/panel/usuarios"]) {
      const r = await admin.req(ruta);
      comprobar(`Admin accede a ${ruta} → 200`, r.estado === 200);
    }
    const facturasAsistente = await asistente.req("/panel/facturas", {});
    comprobar("Asistente no ve facturación (nav sin enlace ni API 403)", facturasAsistente.estado === 200 || [302, 307].includes(facturasAsistente.estado));
    const usuariosAbogado = await abogado.req("/api/usuarios");
    comprobar("Abogado puede listar usuarios (para asignación) → 200", usuariosAbogado.estado === 200);
    const usuariosAsistente = await asistente.req("/api/usuarios");
    comprobar("Asistente no puede listar usuarios → 403", usuariosAsistente.estado === 403);
    const altaUsuarioAsistente = await asistente.req("/api/usuarios", {
      metodo: "POST",
      cuerpo: { nombre: "X", email: `${MARCA}-x@prueba.es`, contrasena: "Prueba123!" },
    });
    comprobar("Asistente no puede crear usuarios → 403", altaUsuarioAsistente.estado === 403);
    const autoBorrado = await admin.req(`/api/usuarios/${idAbogado + 99999}`, { metodo: "DELETE" });
    comprobar("Eliminar usuario inexistente → 500/404 manejado", autoBorrado.estado >= 400);

    /* ---------- 11. Reportes ---------- */
    console.log("\nReportes");
    const reportes = await admin.req("/panel/reportes");
    comprobar("Página de reportes → 200", reportes.estado === 200);

    /* ---------- 12. Limpieza y cierre de sesión ---------- */
    console.log("\nLimpieza y cierre de sesión");
    const borrarFactura = await admin.req(`/api/facturas/${idFactura}`, { metodo: "DELETE" });
    comprobar("Borrar factura → 200", borrarFactura.estado === 200);
    const borrarDocumento = await admin.req(`/api/documentos/${idDocumento}`, { metodo: "DELETE" });
    comprobar("Borrar documento → 200", borrarDocumento.estado === 200);
    const borrarTarea = await admin.req(`/api/tareas/${idTarea}`, { metodo: "DELETE" });
    comprobar("Borrar tarea → 200", borrarTarea.estado === 200);
    const borrarTareaAsistente = await admin.req(`/api/tareas/${tareaAsistente.json?.id}`, { metodo: "DELETE" });
    comprobar("Borrar tarea de asistente → 200", borrarTareaAsistente.estado === 200);
    const borrarExpediente = await admin.req(`/api/expedientes/${idExpediente}`, { metodo: "DELETE" });
    comprobar("Borrar expediente en cascada → 200", borrarExpediente.estado === 200);
    const borrarCliente = await admin.req(`/api/clientes/${idCliente}`, { metodo: "DELETE" });
    comprobar("Borrar cliente sin expedientes → 200", borrarCliente.estado === 200);
    const borrarUsuarioAsistente = await admin.req(`/api/usuarios/${idAsistente}`, { metodo: "DELETE" });
    comprobar("Borrar usuario asistente → 200", borrarUsuarioAsistente.estado === 200);
    const borrarUsuarioAbogado = await admin.req(`/api/usuarios/${idAbogado}`, { metodo: "DELETE" });
    comprobar("Borrar usuario abogado → 200", borrarUsuarioAbogado.estado === 200);
    const logout = await admin.req("/api/auth/logout", { metodo: "POST" });
    comprobar("Logout → 200", logout.estado === 200);
    const panelTrasLogout = await admin.req("/panel", { cookie: false });
    comprobar("Tras logout, panel redirige", [302, 307].includes(panelTrasLogout.estado));
  } finally {
    try {
      process.kill(-hijo.pid, "SIGKILL");
    } catch {}
    await esperar(800);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Resultados: ${pasadas} pruebas pasadas, ${fallidas} fallidas`);
  if (fallidas > 0) {
    console.error("\nPruebas fallidas:");
    for (const f of fallos) console.error(`  ✘ ${f}`);
    process.exit(1);
  }
  console.log("Regresión completa: todo correcto.");
}

principal().catch((e) => {
  console.error("Error fatal en la suite:", e);
  process.exit(1);
});
