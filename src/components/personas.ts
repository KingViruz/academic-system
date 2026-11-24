import type { CampoDef } from './crud';

/** Campos comunes de una persona (se guardan en la tabla usuario). */
export const camposPersona: CampoDef[] = [
  { nombre: 'tipoIdentificacion', label: 'Tipo de documento', tipo: 'select', requerido: true, opciones: [{ value: 'CC', label: 'Cédula de ciudadanía' }, { value: 'TI', label: 'Tarjeta de identidad' }, { value: 'CE', label: 'Cédula de extranjería' }, { value: 'PA', label: 'Pasaporte' }] },
  { nombre: 'identificacion', label: 'Número de documento', requerido: true },
  { nombre: 'nombres', label: 'Nombres', requerido: true },
  { nombre: 'apellidos', label: 'Apellidos', requerido: true },
  { nombre: 'email', label: 'Correo institucional', tipo: 'email', requerido: true },
  { nombre: 'celular', label: 'Celular', placeholder: '3001234567' },
  { nombre: 'password', label: 'Contraseña inicial', tipo: 'password', soloCrear: true, ayuda: 'Si la dejas vacía, la contraseña inicial es el número de documento.' },
];

export const aPersona = (u: { tipoIdentificacion: string; identificacion: string; nombres: string; apellidos: string; email: string; celular: string | null }) => ({
  tipoIdentificacion: u.tipoIdentificacion, identificacion: u.identificacion, nombres: u.nombres, apellidos: u.apellidos, email: u.email, celular: u.celular ?? '',
});
