import { ModulosUsuario, Pantallas } from "../../../auth/interface/login.interfaces";

const PANTALLA_SVG_BY_IMAGEN: Record<string, string> = {
  'svg-ex-crear': 'crear.svg',
  'svg-ex-recibido': 'exhortoRecibido.svg',
  'svg-ex-enviado': 'exhortoEnviado.svg',
  //'svg-ex-ambito': 'exhortoAmbito.svg',
  //amparos
  'svg-amp-recibido': 'amparoRecibido.svg',
  'svg-amp-iniciaracuerdo':'acuerdo.svg',
  //JOP
  'svg-jop-promociones':'promociones.svg',
  'svg-jop-crear':'crear.svg'
};

const MODULO_SVG_BY_ID: Record<number, string> = {
  3360: 'amparoElectronico.svg',    //amparos
  3361: 'exhortoElectronico.svg',   //exhortos
  3392: 'juicioOral.svg',           //juicio oral penal
  3394: 'oficialiaComun.svg',        //oficilia 1 instancia
  3395: 'tramites.svg',             //terminos
  3393: 'exhortoElectronico.svg', //juicio en linea
};

export function svgSrcForModulo(m: ModulosUsuario): string {
  const id = Number(m.idSistemaModulo);
  const file = MODULO_SVG_BY_ID[id] ?? 'default.svg';
  return `icons/${file}`;
}

export function svgSrcForPantalla(p: Pantallas): string {
  const key = (p.imagen ?? '').trim();
  const file = PANTALLA_SVG_BY_IMAGEN[key] ?? 'oficialiaComun.svg';
  return `icons/${file}`;
}

