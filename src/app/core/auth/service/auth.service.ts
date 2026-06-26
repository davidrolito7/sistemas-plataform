import { signal, Injectable, Inject, PLATFORM_ID, } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/app/environments/environment';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { TokenService } from './token.service';
import { responseLogin, areasResponse, twoAccess, usuarioAreas } from '../interface/login.interfaces';
import { GenericResponse } from '../interface/login.interfaces';
import { checkToken, tokenInterceptor } from '../interceptor/token.interceptor';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constService = environment.ConstantsService
  private perfilSeleccionado = signal('');
  idperfil = signal('');
  private areaSeleccionado = signal('');
  idarea = signal('');
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  pantallasUsuario = signal<string[]>([]);
  pantallaBusqueda = signal<string>('');
  pantallasCargadas = signal(false);
  isBrowser: boolean = false;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  setPantallasUsuario(pantallas: any[]) {
    this.pantallasUsuario.set(pantallas);
  }

  setPantallasCargadas(valor: boolean) {
    this.pantallasCargadas.set(valor);
  }


  getIsRefreshing(): boolean {
    return this.isRefreshing;
  }

  setIsRefreshing(value: boolean) {
    this.isRefreshing = value;
  }

  getRefreshTokenSubject(): BehaviorSubject<string | null> {
    return this.refreshTokenSubject;
  }

  marcarPantallasComoCargadas() {
    this.pantallasCargadas.set(true);
  }

  //SERVICIO GET
  getRequest = (url: string, customheaders?: Object) => this.http.get(`${this.constService.ruta}${url}`);
  //SERVICIO POST
  //postRequest = (url: string, parametros?: Object, customheaders?: Object) => this.http.post(`${this.constService.ruta}${url}`, parametros);
  //SERVICIO PUT
  //putRequest = (url: string, parametros?: Object, customheaders?: Object) => this.http.put(`${this.constService.ruta}${url}`, parametros);

  //putRequestBody = (url: string, parametros?: Object, customheaders?: Object) => this.http.request('put',`${this.constService.ruta}${url}`, { body: parametros });

  //SERVICIO DELETE
  //deleteRequest = (url: string, parametros?: Object, customheaders?: Object) => this.http.delete(`${this.constService.ruta}${url}`, parametros);

  //deleteRequestBody = (url: string, parametros?: Object, customheaders?: Object) => this.http.request('delete',`${this.constService.ruta}${url}`,{ body: parametros} );

  login(usuario: string, contrasenia: string, idSistema: number, remember: boolean): Observable<GenericResponse<responseLogin>> {
    const url = '/api/AuthJWT/Login';
    const body = { usuario, contrasenia, idSistema };
    return this.http.post<GenericResponse<responseLogin>>(`${this.constService.ruta}${url}`, body, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response.success) {
            this.tokenService.saveToken(response.data.access_token, remember);
            //this.tokenService.saveRefreshToken(response.data.refresh_token, remember);
          }
        })
      );
  }
  obtenerIdAreaSistemaUsuario(idGeneral: number, idSistema: number, idArea: number): Observable<any> {
    const url = `${this.constService.ruta}/api/Permisos/AreaSistemaUsuario?idSistema=${idSistema}&idGeneral=${idGeneral}&idArea=${idArea}`;
    return this.http.post(url, null, { context: checkToken() });
  }
  //Por default TipoBusqueda=4 para buscar por numero de empleado
  //1= por idGeneral
  //2= por folio rune
  //3= por codigo llave
  //4= por numero de empleado
  obtenerDatosUsuario(idUsuario: string, tipoBusqueda: number = 1): Observable<any> {
    const url = `${this.constService.ruta}/api/Permisos/DatosUsuario?Usuario=${idUsuario}&TipoBusqueda=${tipoBusqueda}`;

    //const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    //const headers = new HttpHeaders({
    //  'Authorization': `Bearer ${authToken}`,
    //  'accept': '*/*'
    //});

    return this.http.post(url, null, { context: checkToken() });
  }

  validarToken(token: string): Observable<any> {
    const url = `${this.constService.ruta}/api/AuthJWT/ValidaTokenExpire?token=${token}`;
    /*const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });*/

    return this.http.post(url, null);
  }

  /*refresToken(access_token: string, refresh_token: string, remember: boolean): Observable<GenericResponse<responseLogin>> {
    const url = `${this.constService.ruta}/api/AuthJWT/RefreshToken`;
    const body = { access_token, refresh_token };

    return this.http.post<GenericResponse<responseLogin>>(url, body)
      .pipe(
        tap(response => {
          if (response.success) {
            this.tokenService.saveToken(response.data.access_token, remember);
            this.tokenService.saveRefreshToken(response.data.refresh_token, remember);
          }
        })
      );
  }*/
  //ahora el refresh token se almacena en el cookie del back y no se expone en el fron por seguridad
  refresToken(remember: boolean): Observable<GenericResponse<responseLogin>> {
    const url = `${this.constService.ruta}/api/AuthJWT/RefreshToken`;
    return this.http.post<GenericResponse<responseLogin>>(url, {}, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response.success) {
            this.tokenService.saveToken(response.data.access_token, remember);
          }
        })
      );
  }
  getRoleNameUsuario(): string {
    // Simulando los roles que el usuario tiene asignados
    //const rolesUsuario: string = 'Oficialia'; // Puedes cambiarlo para 'oficialia' u otros roles para ver otras vistas
    var rolesUsuario = null;
    if (this.isBrowser) {
      const recordarUsuario = localStorage.getItem('recordarUsuario');
      if (recordarUsuario === 'true')
        rolesUsuario = localStorage.getItem("perfilSeleccionadoDesc");
      else
        rolesUsuario = sessionStorage.getItem("perfilSeleccionadoDesc");
    }
    return rolesUsuario!;
  }
  getDateTime(): Observable<any> {
    const url = `${this.constService.ruta}/api/AuthJWT/getDateTime`;
    return this.http.get<any>(url);
  }
  GetRootURL() { return this.constService.ruta; }

  GetPerfiles(idAreaSistemaUsuario: number): Observable<any> {
    //const url = `${this.constService.ruta}/api/Permisos/PerfilesUsuario?Usuario=${"5"}`;
    const url = `${this.constService.ruta}/api/Permisos/PerfilesUsuario?IdAreaSistemaUsuario=${idAreaSistemaUsuario}`;

    //const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    //const headers = new HttpHeaders({
    //  'Authorization': `Bearer ${authToken}`,
    //  'accept': '*/*'
    //});

    return this.http.post(url, null, { context: checkToken() });
  }

  GetidAreaSistemaUsuario(idSistema: number, idGeneral: string): Observable<any> {
    const url = `${this.constService.ruta}/api/Permisos/AreaSistemaUsuario?idSistema=${idSistema}&idGeneral=${idGeneral}`;
    return this.http.post(url, null, { context: checkToken() });
  }

  GetModulosUsuario(idAreaSistemaUsuario: string, IdPerfilUsuario: string): Observable<any> {
    const url = `${this.constService.ruta}/api/Permisos/ObtenerModulosPantasUsuario?IdAreaSistemaUsuario=${idAreaSistemaUsuario}&IdPerfilUsuario=${IdPerfilUsuario}`;
    return this.http.post(url, null, { context: checkToken() });
  }

  get perfil_Seleccionado() {
    return this.perfilSeleccionado.asReadonly();
  }

  get area_Seleccionada() {
    return this.areaSeleccionado.asReadonly();
  }
  /*get area_Seleccionado(){
    return this.areaSeleccionado.asReadonly();
  }*/

  actualizaPerfilSeleccionado(perfil: any) {
    //this.perfilSeleccionado = perfil;
    this.perfilSeleccionado.set(perfil);
  }

  ActualizaAreaSeleccionado(area: any) {
    this.areaSeleccionado.set(area);
  }

  // Método para agregar pantalla
  agregarPantalla(nuevaPantalla: string) {
    if (nuevaPantalla.trim()) {
      this.pantallasUsuario.update(f => [...f, nuevaPantalla.trim()]);
    }
  }

  vaciarPantallasUsuario() {
    this.pantallasUsuario.set([]);
  }

  // Método para actualizar el término de búsqueda
  buscarPantallaPermiso(valor: any) {
    //this.pantallaBusqueda.set(valor);
    return this.pantallasUsuario().filter(descripcion =>
      descripcion.toLowerCase().includes(valor.toLowerCase())
    );
  }
  getAreas(idSistema: number, idGeneral: number): Observable<GenericResponse<areasResponse[]>> {
    const url = `${this.constService.ruta}/api/Permisos/AreasUsuarioSistema?idsistema=${idSistema}&idgeneral=${idGeneral}`;
    return this.http.post<GenericResponse<areasResponse[]>>(url, null, { context: checkToken() });
  }
  getAreaUsuario(): string {
    var idAreaUsuario = null;
    if (this.isBrowser) {
      const recordarUsuario = localStorage.getItem('recordarUsuario');
      if (recordarUsuario === 'true')
        idAreaUsuario = localStorage.getItem("areaSeleccionada");
      else
        idAreaUsuario = sessionStorage.getItem("areaSeleccionada");
    }
    return idAreaUsuario!;
  }
  getAreaName(): string {
    var areaName = null;
    if (this.isBrowser) {
      const recordarUsuario = localStorage.getItem('recordarUsuario');
      if (recordarUsuario === 'true')
        areaName = localStorage.getItem('AreaName');
      else {
        areaName = sessionStorage.getItem('AreaName');
      }
    }
    return areaName!;
  }
  getAreaSistemaUsuario(): string {
    var areaName = null;
    if (this.isBrowser) {
      const recordarUsuario = localStorage.getItem('recordarUsuario');
      if (recordarUsuario === 'true')
        areaName = localStorage.getItem('idAreaSistemaUsuario');
      else {
        areaName = sessionStorage.getItem('idAreaSistemaUsuario');
      }
    }
    return areaName!;
  }
  getPerfilSeleccionado(): string {
    var areaName = null;
    if (this.isBrowser) {
      const recordarUsuario = localStorage.getItem('recordarUsuario');
      if (recordarUsuario === 'true')
        areaName = localStorage.getItem('perfilSeleccionado');
      else {
        areaName = sessionStorage.getItem('perfilSeleccionado');
      }
    }
    return areaName!;
  }
  GetSeccionesUsuario(idAreaSistemaUsuario: string | null, IdPantalla: string, idPerfil: string | null): Observable<any> {
    const url = `${this.constService.ruta}/api/Permisos/ObtenerSeccionesUsuario?IdAreaSistemaUsuario=${idAreaSistemaUsuario}&IdPantalla=${IdPantalla}&idPerfil=${idPerfil}`;
    return this.http.post(url, null, { context: checkToken() });
  }


  GetTwoValidation(): Observable<GenericResponse<twoAccess>> {
    const url = `/api/Permisos/getEncodeAuthenticator`;
    //       const headers = new HttpHeaders({
    //   'Authorization': `Bearer ${this.tokenService.getToken()}`,
    //   'Content-Type': 'application/json'
    // });


    return this.http.get<GenericResponse<twoAccess>>(`${this.constService.ruta}${url}`, { context: checkToken() });

  }

  postSendTwoFactorCodeAuthenticator(codigo: string): Observable<any> {
    const url = `${this.constService.ruta}/api/Permisos/SendTwoFactorCodeAuthenticator`;
    return this.http.post<any>(
      url,
      null,
      {
        params: { codigo },  // => ?codigo=497251
        context: checkToken()
      });
  }

  postValidaPrivateKey(formData: FormData, password: string): Observable<GenericResponse<any>> {
    const url = `${this.constService.ruta}/api/Permisos/ValidaPrivateKey`;
    return this.http.post<GenericResponse<any>>(
      url,
      formData,
      {
        params: { password },
        context: checkToken()
      }
    );
  }
  getSubAreas(idAreaSistema: number, idGeneral: number): Observable<GenericResponse<usuarioAreas[]>> {
    const url = `${this.constService.ruta}/api/Permisos/SubAreasUsuario?idAreaSistema=${idAreaSistema}&idgeneral=${idGeneral}`;
    return this.http.post<GenericResponse<usuarioAreas[]>>(url, null, { context: checkToken() });
  }

  //endpoint para agregar contexto al token 
postLoginContexto(request: any, remember: boolean): Observable<GenericResponse<any>> {
  const url = `${this.constService.ruta}/api/AuthJWT/LoginContexto`;
  return this.http.post<GenericResponse<any>>(url, request, { context: checkToken() })
    .pipe(
      tap(response => {
        if (response.success && response.data?.access_token) {
          this.tokenService.saveToken(response.data.access_token, remember);
        }
      }),
      catchError((err: HttpErrorResponse) => {
        const body = err.error as GenericResponse<any>;
        if (body?.message) return of(body);
        return throwError(() => err);
      })
    );
}
}
