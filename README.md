# academic-system

Frontend del **Sistema Académico** (Ingeniería de Software II · CUL), hecho con Next.js 16, React 19 y Tailwind CSS 4.

Consume la API de `../back-academic-system`.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm run dev                   # http://localhost:3000
```

La API debe estar corriendo (ver el README del backend). Entra con los usuarios de prueba del seed, por ejemplo `docente@cul.edu.co` / `Docente2026*`.

## Qué hace cada rol

| Rol | Pantallas |
|---|---|
| Administrador | Facultades, programas, materias, sedes y aulas, periodos, usuarios y roles (activar, desbloquear, restablecer clave), coordinadores, docentes con materias habilitadas, estudiantes con carga masiva CSV, sensores (token y estado de conexión), auditoría |
| Coordinador | Tablero (asistencia, semáforo de planes, rendimiento por corte), carga académica con aviso de cruces en vivo, consulta de horarios, microcurrículos (unidades, niveles de desempeño, prerrequisitos, publicación), seguimiento de planes, estudiantes del programa, alertas y aprobación de cambios de nota |
| Docente | Clases de hoy, horario semanal, grupos con asistencia en vivo (sensor, manual y QR), registro de notas por corte y cierre, plan del periodo con avance, consolidado exportable y solicitudes de cambio de nota |
| Estudiante | Inscripción con créditos, cupo, cruces y prerrequisitos, horario semanal, asistencia con porcentaje de fallas y registro por código, notas por corte con definitiva y consulta del plan |

## Diseño

Identidad de la CUL: azul marino del escudo para la estructura, naranja para la acción principal y dorado para lo activo (el día de hoy en el horario y el foco del teclado). Tipografía única, Archivo, en corte expandido para los títulos como el logotipo. El horario semanal es la pieza central de docentes y estudiantes.

## Estructura

```
src/
  app/
    login/            inicio de sesión
    (panel)/admin/    páginas del administrador
    (panel)/coordinador/
    (panel)/docente/
    (panel)/estudiante/
    (panel)/cuenta/   cambio de contraseña
  components/         interfaz reutilizable (tablas, formularios, horario semanal, semáforo, plan)
  lib/                cliente de la API, sesión, tipos y formatos
```

La sesión se guarda en `localStorage` y todo lo autenticado se renderiza en el navegador (`use(browser())` dentro de `Suspense`), como recomienda Next 16 con Cache Components.
