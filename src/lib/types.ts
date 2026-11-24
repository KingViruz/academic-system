export type Rol = 'ADMIN' | 'COORDINADOR' | 'DOCENTE' | 'ESTUDIANTE';

export interface UsuarioSesion {
  sub: number;
  rol: Rol;
  email: string;
  nombre: string;
  docenteId?: number;
  estudianteId?: number;
  programaId?: number;
}

export interface Usuario {
  id: number; tipoIdentificacion: string; identificacion: string; nombres: string; apellidos: string;
  email: string; celular: string | null; rol: Rol; activo: boolean; intentosFallidos: number;
  bloqueadoHasta: string | null; ultimoAcceso: string | null; createdAt: string;
}

export interface Facultad { id: number; codigo: string; nombre: string; activo: boolean; numeroProgramas?: number }
export interface Programa { id: number; codigo: string; nombre: string; creditos: number; facultadId: number; facultad?: Facultad; activo: boolean }
export interface Materia { id: number; codigo: string; nombre: string; creditos: number; activo: boolean }
export interface Sede { id: number; nombre: string; direccion: string | null; activo: boolean }
export interface Aula { id: number; sedeId: number; sede?: Sede; codigo: string; capacidad: number; activo: boolean }
export interface Periodo { id: number; codigo: string; fechaInicio: string; fechaFin: string; limiteCreditos: number; actual: boolean }

export interface Coordinador { id: number; usuarioId: number; usuario: Usuario; programaId: number; programa: Programa }
export interface Docente { id: number; usuarioId: number; usuario: Usuario; profesion: string | null; fechaNacimiento: string | null; direccion: string | null; materias: Materia[] }
export interface Estudiante {
  id: number; usuarioId: number; usuario: Usuario; codigoCarne: string; programaId: number; programa?: Programa; semestre: number;
  fechaNacimiento?: string; fechaExpedicion?: string; direccion?: string | null; acudienteNombre?: string | null; acudienteTelefono?: string | null;
  puntajeIcfes?: number | null; sisben?: string | null;
}

export interface Horario { id?: number; aulaId: number; aula?: Aula; dia: number; horaInicio: string; horaFin: string }
export interface Carga {
  id: number; periodoId: number; periodo?: Periodo; programaId: number; programa?: Programa; materiaId: number; materia: Materia;
  docenteId: number; docente: { id: number; usuario: Pick<Usuario, 'nombres' | 'apellidos' | 'email'> }; grupo: string; cupo: number;
  ultimoCorteCerrado: number; horarios: Horario[]; inscritos: number;
}

export interface Sesion {
  horarioId: number; cargaId: number; dia: number; horaInicio: string; horaFin: string;
  materia: string; materiaCodigo: string; grupo: string; aula: string; sede: string; docente: string;
}

export interface Unidad {
  id: number; microcurriculoId: number; numero: number; nombre: string; competenciaEspecifica: string; resultadoAprendizaje: string;
  nivelSuperior: string; nivelNormal: string; nivelBajo: string; nivelDeficiente: string;
}
export interface Microcurriculo {
  id: number; materiaId: number; materia: Materia; programaId: number; programa?: Programa;
  descripcion: string | null; objetivoGeneral: string | null; objetivosEspecificos: string | null; competenciasGenericas: string | null;
  estrategias: string | null; bibliografia: string | null; porcentajeP1: number; porcentajeP2: number; porcentajeP3: number;
  estado: 'BORRADOR' | 'PUBLICADO'; publicadoEn: string | null; unidades: Unidad[]; prerrequisitos: Materia[];
}

export type Semaforo = 'VERDE' | 'AMARILLO' | 'ROJO' | 'SIN_INICIAR';
export interface Avance {
  horasTotales: number; horasEjecutadas: number; horasPrevistasALaFecha: number; porcentajeTotal: number; porcentajeALaFecha: number;
  semaforo: Semaforo; atrasados: { id: number; semana: number; tema: string; fechaPlaneada: string }[];
}
export interface DetallePlan {
  id: number; planId: number; semana: number; unidadId: number; unidad?: Unidad; tema: string; actividad: string | null; horas: number;
  corte: number; fechaPlaneada: string; ejecutado: boolean; fechaEjecucion: string | null; observaciones: string | null;
}
export interface Plan {
  id: number; microcurriculoId: number; microcurriculo: Microcurriculo; cargaId: number; carga: Carga; fechaInicio: string; fechaFin: string;
  totalHoras: number; detalles: DetallePlan[]; avance: Avance; horasDetalle: number; horasCuadran: boolean;
}
export interface PlanResumen { id: number; cargaId: number; materia: string; grupo: string; docente: string; fechaInicio: string; fechaFin: string; totalHoras: number; avance: Avance }

export type EstadoAsistente = 'PRESENTE' | 'TARDE' | 'AUSENTE' | 'EXCUSADO';
export interface Asistencia {
  id: number; cargaId: number; carga?: Carga; aulaId: number; aula?: Aula; fecha: string; tema: string; horaApertura: string; toleranciaMin: number;
  estado: 'ABIERTA' | 'CERRADA'; cerradaEn: string | null;
}
export interface AsistenciaDetalle extends Asistencia {
  lista: { estudianteId: number; codigoCarne: string; nombre: string; detalleId: number | null; estado: EstadoAsistente | null; origen: string | null; horaRegistro: string | null; motivo: string | null }[];
  conteo: Record<string, number>;
  novedades: { id: number; codigoCarne: string; leidoEn: string; detalle: string | null }[];
  corregible: boolean; corregibleHasta: string;
}

export interface Alerta { id: number; tipo: 'INASISTENCIA' | 'NOTA_BAJA' | 'SENSOR' | 'SEGURIDAD'; mensaje: string; atendida: boolean; createdAt: string; cargaId: number | null; estudianteId: number | null }
export interface Solicitud {
  id: number; estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'; notaAnterior: number; notaNueva: number; motivo: string; comentario: string | null;
  createdAt: string; resueltaEn: string | null; corte: number; materia: string; grupo: string; estudiante: string; solicitante: string; aprobador: string | null;
}
export interface Sensor { id: number; codigo: string; aulaId: number; aula: Aula; ultimaSenal: string | null; activo: boolean; conectado: boolean; lecturasEnCola: number }
export interface Auditoria { id: string; usuarioId: number | null; accion: string; entidad: string; entidadId: string | null; valorAnterior: unknown; valorNuevo: unknown; ip: string | null; createdAt: string }
