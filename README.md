# Gestoría de Abogados

Aplicación web fullstack para la gestión integral de un despacho de abogados:
clientes, expedientes, tareas, plazos y audiencias, facturación, documentos,
usuarios con roles y reportes.

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Prisma** + **SQLite** (base de datos autonoma, sin servicios externos)
- Autenticación por sesiones en cookie httpOnly (hash de contraseñas con `scrypt`)
- UI propia en CSS (en español), sin librerías de interfaz externas

## Funcionalidades

- **Dashboard**: métricas del despacho, próximos plazos y tareas vencidas.
- **Clientes**: particulares y empresas, con documentos asociados.
- **Expedientes**: numeración automática (`EXP-AAAA-NNNN`), estado, responsable, notas internas.
- **Tareas**: prioridad, vencimientos, asignación a usuarios.
- **Audiencias y plazos procesales**: fecha, lugar, tipo, control de próximos 14 días.
- **Facturación**: líneas con base, IVA y total; estados borrador / emitida / pagada / vencida.
- **Documentos**: adjuntos binarios guardados en `uploads/` (por expediente o cliente).
- **Usuarios y roles**: ADMIN, ABOGADO, ASISTENTE (solo ADMIN gestiona usuarios).
- **Reportes**: expedientes por estado, ingresos por mes, carga de trabajo por abogado.

## Puesta en marcha

```bash
npm install
npm run db:push   # crea prisma/dev.db con el esquema
npm run db:seed   # usuario admin + datos de demostración
npm run dev       # http://localhost:3000
```

Credenciales iniciales (de la semilla):

| Usuario | Email | Contraseña |
|---|---|---|
| Admin | `admin@gestoria.es` | `Admin123!` |

## Roles y permisos

- **ADMIN**: acceso completo, incluida la gestión de usuarios.
- **ABOGADO**: gestión de clientes, expedientes, tareas, audiencias, facturas y documentos.
- **ASISTENTE**: consulta y alta de tareas/notas/documentos; no elimina registros ni gestiona facturas.

## Estructura

```
prisma/schema.prisma      módulo de datos
prisma/seed.mjs           datos iniciales
src/lib/                  prisma, auth, permisos, utilidades
src/app/api/              API REST (JSON) con control de sesión y roles
src/app/(auth)/página /   login
src/app/panel/            aplicación privada (dashboard y módulos)
uploads/                  documentos adjuntos
```
