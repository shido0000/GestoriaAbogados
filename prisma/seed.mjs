import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hash(contrasena) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(contrasena, salt, 64).toString("hex")}`;
}

const dias = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function principal() {
  const existe = await prisma.usuario.count();
  if (existe > 0) {
    console.log("La base de datos ya tiene usuarios; se omite la semilla.");
    return;
  }

  const admin = await prisma.usuario.create({
    data: { nombre: "Admin", email: "admin@gestoria.es", passwordHash: hash("Admin123!"), rol: "ADMIN" },
  });
  const laura = await prisma.usuario.create({
    data: { nombre: "Laura Ferrer", email: "laura@gestoria.es", passwordHash: hash("Abogado123!"), rol: "ABOGADO" },
  });
  const carlos = await prisma.usuario.create({
    data: { nombre: "Carlos Ruiz", email: "carlos@gestoria.es", passwordHash: hash("Asistente123!"), rol: "ASISTENTE" },
  });

  const cliente1 = await prisma.cliente.create({
    data: {
      nombre: "María López García",
      tipo: "PARTICULAR",
      identificacion: "12345678Z",
      email: "maria.lopez@ejemplo.es",
      telefono: "600 111 222",
      direccion: "C/ Mayor 1, Madrid",
      notas: "Cliente de divorcios y familia.",
    },
  });
  const cliente2 = await prisma.cliente.create({
    data: {
      nombre: "Construcciones Tarifa S.L.",
      tipo: "EMPRESA",
      identificacion: "B87654321",
      email: "juridico@tarifa-sl.es",
      telefono: "910 555 444",
      direccion: "Av. de la Industria 40, Madrid",
      notas: "Contratos laborales y subcontratas.",
    },
  });
  const cliente3 = await prisma.cliente.create({
    data: {
      nombre: "Jorge Márquez Peña",
      tipo: "PARTICULAR",
      identificacion: "87654321X",
      email: "jorge.marquez@ejemplo.es",
      telefono: "620 333 555",
    },
  });

  const exp1 = await prisma.expediente.create({
    data: {
      numero: "EXP-2025-0001",
      titulo: "Divorcio contencioso — Custodia e hijos menores",
      descripcion: "Procedimiento de divorcio contencioso con custodia compartida solicitada.",
      estado: "EN_PROGRESO",
      clienteId: cliente1.id,
      responsableId: laura.id,
    },
  });
  const exp2 = await prisma.expediente.create({
    data: {
      numero: "EXP-2025-0002",
      titulo: "Reclamación de cantidad — Obra Ronda de Sant Pere",
      descripcion: "Impago de 85.000 € pendientes de la última certificación de obra.",
      estado: "ABIERTO",
      clienteId: cliente2.id,
      responsableId: admin.id,
    },
  });
  const exp3 = await prisma.expediente.create({
    data: {
      numero: "EXP-2025-0003",
      titulo: "Expediente de extranjería — Renovación de permiso",
      descripcion: "Renovación de autorización de residencia y trabajo por cuenta ajena.",
      estado: "ABIERTO",
      clienteId: cliente3.id,
      responsableId: laura.id,
    },
  });

  await prisma.tarea.createMany({
    data: [
      {
        titulo: "Preparar escrito de contestación a la demanda",
        estado: "EN_CURSO",
        prioridad: "ALTA",
        fechaVencimiento: dias(3),
        expedienteId: exp1.id,
        asignadoId: laura.id,
      },
      {
        titulo: "Recabar facturas y albaranes de la obra",
        estado: "PENDIENTE",
        prioridad: "MEDIA",
        fechaVencimiento: dias(7),
        expedienteId: exp2.id,
        asignadoId: carlos.id,
      },
      {
        titulo: "Renovar precinto de folios del expediente 0003",
        estado: "PENDIENTE",
        prioridad: "BAJA",
        expedienteId: exp3.id,
        asignadoId: carlos.id,
      },
      {
        titulo: "Revisar propuesta de convenio regulador",
        estado: "COMPLETADA",
        prioridad: "MEDIA",
        fechaVencimiento: dias(-4),
        expedienteId: exp1.id,
        asignadoId: laura.id,
      },
    ],
  });

  await prisma.audiencia.createMany({
    data: [
      {
        titulo: "Vista previa Juzgado de Familia n.º 4",
        tipo: "VISTA",
        fecha: dias(5),
        lugar: "Plaza de Villa de París, Madrid",
        expedienteId: exp1.id,
      },
      {
        titulo: "Juicio verbal — Reclamación 85.000 €",
        tipo: "JUICIO",
        fecha: dias(12),
        lugar: "Audiencia Provincial, Sala 3",
        expedienteId: exp2.id,
      },
      {
        titulo: "Plazo de alegaciones Oficina de Extranjería",
        tipo: "PLAZO",
        fecha: dias(2),
        expedienteId: exp3.id,
      },
    ],
  });

  await prisma.nota.create({
    data: {
      contenido: "La clienta aporta nueva documentación médica relevante para la custodia.",
      expedienteId: exp1.id,
      autorId: laura.id,
    },
  });

  await prisma.factura.createMany({
    data: [
      {
        numero: "FAC-2025-0001",
        concepto: "Provisión de fondos divorcio contencioso",
        base: 1800,
        iva: 21,
        emitidaEn: dias(-30),
        vencimientoEn: dias(2),
        estado: "EMITIDA",
        clienteId: cliente1.id,
        expedienteId: exp1.id,
      },
      {
        numero: "FAC-2025-0002",
        concepto: "Asesoría laboral mensual — marzo",
        base: 650,
        iva: 21,
        emitidaEn: dias(-45),
        estado: "PAGADA",
        clienteId: cliente2.id,
      },
    ],
  });
}

principal()
  .then(() => console.log("Semilla completada."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
