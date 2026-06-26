export interface GenericResponse<T>{
    success:boolean;
    status?: number;
    message?: string;
    mensaje?: string;
    errors: string[];
    data:T;
}

export interface responseLogin {
  access_token: string;
  refresh_token: string
}

export interface responseCatalogoPerfiles {
  idSistemaPerfil: number;
  descripcion: string
}
export interface areasResponse {
  idAreaSistema: number;
  area: string;
  idArea: number;
  //nombreConexionBd:string;
}

export interface secciones {
  IdSeccion: number;
  descripcion: string;
  //Pantallas : boton[];
}
export interface boton {
  Idboton: number;
  Descripcion: string;
}
export interface ModulosUsuario {
  idSistemaModulo: number;
  nombre: string;
  descripcion: string;
  ejecutable: string;
  pantallas: Pantallas[];
}

export interface Pantallas {
  idPantalla: 14158;
  nombre: string;
  descripcion: string;
  idSistemaModulo: string;
  tipoCatalogo: string;
  idCatalogo: string;
  ejecutable: string;
  valores: string;
  exe: string;
  imagen: string;
  Acceso: string;
  orden: number; // para que (a.orden ?? 0) no truene si viene string
  visibleMenu: boolean;
  //FechaProduccion  : string;
}


export interface UsrProfile {
  userId: number,
  userName: string,
  idGeneral: number,
  creationDate: Date,
  isActive: boolean,
  isAdmin: boolean,
  isRoot: boolean,
  token: string,
  password: string,
  passwordQuestion: string,
  passwordAnswer: string,
  isApproved: boolean,
  digitalCert: boolean,
  use2FAToken: boolean
}

export interface UsrAbogado {
  idGeneral: number,
  folio: string,
  nombre: string,
  idTitulo: number,
  curp: string,
  direccion: string,
  direccionPart: string,
  correo: string,
  correoAlterno: string,
  celular: string,
  telefono: string,
  idBarra: number,
  idEstatus: number,
  observaciones: string,
  idTipoPersona: number,
  fechaAlta: Date,
  noEmpleado: number,
  correoVerificado: true,
  direccionNoExt: string,
  direccionNoInt: string,
  direccionCP: string,
  direccionColonia: string,
  direccionMunicipio: string,
  direccionEstado: string,
  direccionPartNoExt: string,
  direccionPartNoInt: string,
  direccionPartCP: string,
  direccionPartColonia: string,
  direccionPartMunicipio: string,
  direccionPartEstado: string,
  activo: boolean,
  foto: string
}




export interface twoAccess {
  activo: boolean,
  encodedSecret: string,
  user: string,
  lastLoginUTC: Date
}
export interface usuarioAreas{
  idSubArea: number;
  descripcion:string;
}



// ========================================
// 1️⃣2️⃣ SISTEMA & PANTALLAS
// ========================================

export interface SistemaModuloResponse {
    idSistemaModulo: number;
    nombre: string;
    descripcion: string;
    ejecutable: string;
    pantallas: Pantalla[];
}

export interface Pantalla {
    idPantalla: number;
    nombre: string;
    descripcion: string;
    idSistemaModulo: number;
    tipoCatalogo: number | null;
    idCatalogo: number | null;
    ejecutable: string;
    valores: string;
    exe: string;
    imagen: string;
    acceso: string;
    orden: number;
    fechaProduccion: string;
    visibleMenu: boolean;
}
