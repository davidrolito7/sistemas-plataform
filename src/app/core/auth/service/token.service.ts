import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { Router } from '@angular/router';

// ─────────────────────────────────────────────────────────────────────────────
// HMAC-SHA256 con Web Crypto API
// ─────────────────────────────────────────────────────────────────────────────

function fallbackSign(secret: string, data: string): string {
  const input = `${secret}|${data}`;
  const seeds = [0x811c9dc5, 0x12345678, 0x9e3779b9, 0x85ebca6b];

  return seeds
    .map((seed) => {
      let hash = seed >>> 0;
      for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return (hash >>> 0).toString(16).padStart(8, '0');
    })
    .join('');
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return fallbackSign(secret, data);
  }

  try {
    const enc = new TextEncoder();
    const key = await subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await subtle.sign('HMAC', key, enc.encode(data));
    return Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return fallbackSign(secret, data);
  }
}

async function hmacVerify(secret: string, data: string, expected: string): Promise<boolean> {
  try {
    const actual = await hmacSign(secret, data);
    if (actual.length !== expected.length) return false;
    // Comparación en tiempo constante para evitar timing attacks
    let diff = 0;
    for (let i = 0; i < actual.length; i++) {
      diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class TokenService {

  // Públicos para compatibilidad con el interceptor
  readonly nameToken = 'token_TE_PJO';
  readonly nameRefreshToken = 'refreshT_TE_PJO';

  // Claves de HMAC en sessionStorage
  private readonly TWO_FACTOR_KEY = '_tf_sig';
  private readonly PERFIL_KEY = '_pf_sig';
  private readonly PANTALLAS_KEY = 'pantallas_usuario';

  private readonly router = inject(Router);

  private sessionExpiredSubject = new BehaviorSubject<boolean>(false);
  sessionExpired$ = this.sessionExpiredSubject.asObservable();

  notifySessionExpired(): void { this.sessionExpiredSubject.next(true); }

  // ─────────────────────────────────────────────────────────────────────────
  // TOKEN PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────

  saveToken(token: string, remember: boolean): void {
    localStorage.removeItem(this.nameToken);
    sessionStorage.removeItem(this.nameToken);
    remember
      ? localStorage.setItem(this.nameToken, token)
      : sessionStorage.setItem(this.nameToken, token);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.nameToken)
      || localStorage.getItem(this.nameToken);
  }

  removeToken(): void {
    localStorage.removeItem(this.nameToken);
    sessionStorage.removeItem(this.nameToken);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REFRESH TOKEN
  // ─────────────────────────────────────────────────────────────────────────

  saveRefreshToken(refreshToken: string, remember: boolean): void {
    localStorage.removeItem(this.nameRefreshToken);
    sessionStorage.removeItem(this.nameRefreshToken);
    remember
      ? localStorage.setItem(this.nameRefreshToken, refreshToken)
      : sessionStorage.setItem(this.nameRefreshToken, refreshToken);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.nameRefreshToken)
      || localStorage.getItem(this.nameRefreshToken);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VALIDACIÓN JWT
  // ─────────────────────────────────────────────────────────────────────────

  isValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const { exp } = jwtDecode<JwtPayload>(token);
      if (!exp) return false;
      return new Date(exp * 1000).getTime() > Date.now();
    } catch {
      return false;
    }
  }

  getUserFromToken(): any | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      const raw = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/userdata'];
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CLAVE DE FIRMA
  //* Usa el payload del JWT como secreto → si el token cambia o expira,
  // Todos los HMAC anteriores quedan inválidos automáticamente.
  // ─────────────────────────────────────────────────────────────────────────

  private getSigningSecret(): string {
    const token = this.getToken();
    if (!token) return '';
    return token.split('.')[1] ?? '';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TWO FACTOR
  // Fuente de verdad: HMAC en sessionStorage verificado contra el JWT.
  // Sin flags en memoria → sin condición de carrera.
  // ─────────────────────────────────────────────────────────────────────────

  async setTwoFactorValidated(value: boolean): Promise<void> {
    if (!value) {
      sessionStorage.removeItem(this.TWO_FACTOR_KEY);
      return;
    }
    const secret = this.getSigningSecret();
    if (!secret) return;
    const sig = await hmacSign(secret, 'twoFactor:true');
    sessionStorage.setItem(this.TWO_FACTOR_KEY, sig);
  }

  async isTwoFactorValidated(): Promise<boolean> {
    const sig = sessionStorage.getItem(this.TWO_FACTOR_KEY);
    if (!sig) return false;
    const secret = this.getSigningSecret();
    if (!secret) return false;
    return hmacVerify(secret, 'twoFactor:true', sig);
  }

  clearTwoFactorValidated(): void {
    sessionStorage.removeItem(this.TWO_FACTOR_KEY);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PERFIL COMPLETADO
  // ─────────────────────────────────────────────────────────────────────────

  async setPerfilCompleted(value: boolean): Promise<void> {
    if (!value) {
      sessionStorage.removeItem(this.PERFIL_KEY);
      return;
    }
    const secret = this.getSigningSecret();
    if (!secret) return;
    const sig = await hmacSign(secret, 'perfil:true');
    sessionStorage.setItem(this.PERFIL_KEY, sig);
  }

  async isPerfilCompleted(): Promise<boolean> {
    const sig = sessionStorage.getItem(this.PERFIL_KEY);
    if (!sig) return false;
    const secret = this.getSigningSecret();
    if (!secret) return false;
    return hmacVerify(secret, 'perfil:true', sig);
  }

  clearPerfilCompleted(): void {
    sessionStorage.removeItem(this.PERFIL_KEY);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RE-FIRMA tras refresh de token
  //* El secreto HMAC es el payload del JWT; cuando el token rota por refresh,
  //* las firmas anteriores quedan inválidas. Este método las re-firma con el
  //* nuevo secreto solo si ya existían
  // ─────────────────────────────────────────────────────────────────────────

  async resignSessionSigsAfterRefresh(): Promise<void> {
    const secret = this.getSigningSecret();
    if (!secret) return;

    if (sessionStorage.getItem(this.TWO_FACTOR_KEY) !== null) {
      sessionStorage.setItem(this.TWO_FACTOR_KEY, await hmacSign(secret, 'twoFactor:true'));
    }
    if (sessionStorage.getItem(this.PERFIL_KEY) !== null) {
      sessionStorage.setItem(this.PERFIL_KEY, await hmacSign(secret, 'perfil:true'));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DATOS DE PERFIL
  // ─────────────────────────────────────────────────────────────────────────

  private readRemembered(key: string): string {
    const recordar = localStorage.getItem('recordarUsuario') === 'true';
    const primary = recordar ? localStorage : sessionStorage;
    const fallback = recordar ? sessionStorage : localStorage;
    return primary.getItem(key) ?? fallback.getItem(key) ?? '';
  }

  getAbogadoNombre(): string { return this.readRemembered('AbogadoNombre'); }
  getAreaNombre(): string { return this.readRemembered('AreaName'); }
  getPerfilNombre(): string { return this.readRemembered('perfilSeleccionadoDesc'); }
  getSubAreaNombre(): string { return this.readRemembered('SubAreaNombre'); }

  getAbogadoFotoUrl(): string {
    const b64 = sessionStorage.getItem('AbogadoFotoBase64') ?? '';
    return b64 ? `data:image/jpeg;base64,${b64}` : '';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────────────────

  logout(): void {
    this.removeToken();
    this.clearTwoFactorValidated();
    this.clearPerfilCompleted();
    this.limpiarPantallas();
    this.limpiarDatosSesion();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  startProfileChange(): void {
    this.clearPerfilCompleted();
  }

  limpiarPantallas(): void {
    localStorage.removeItem(this.PANTALLAS_KEY);
  }
  
  private limpiarDatosSesion(): void {
    const recordar = localStorage.getItem('recordarUsuario') === 'true';
    const keys = [
      'AbogadoNombre',
      'AreaName',
      'SubAreaNombre',
      'SubAreaId',
      'idAreaSistemaUsuario',
      'perfilSeleccionado',
      'perfilSeleccionadoDesc',
      'areaSeleccionada',
      'AbogadoFotoBase64',
      'recordarUsuario',
    ];

    if (recordar) {
      // Si se recuerda, solo limpiamos sessionStorage (datos temporales)
      keys.forEach(key => sessionStorage.removeItem(key));
    } else {
      // Si no se recuerda, limpiamos ambos para eliminar cualquier rastro de datos de sesión
      keys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    }
  }
}