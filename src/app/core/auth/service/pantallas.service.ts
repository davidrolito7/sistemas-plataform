import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { GenericResponse, SistemaModuloResponse } from '../interface/login.interfaces';
import { checkToken } from '../interceptor/token.interceptor';

@Injectable({ providedIn: 'root' })
export class PantallasService {
  private pantallas: SistemaModuloResponse[] | null = null;
  private readonly storageKey = 'pantallas_usuario';
  private lastSnapshot = '';
  private watcherStarted = false;

  constructor(private http: HttpClient) {}

  private get storage(): Storage {
    const recordar = localStorage.getItem('recordarUsuario') === 'true';
    return recordar ? localStorage : sessionStorage;
  }

  getPantallas(): SistemaModuloResponse[] | null {
    if (!this.pantallas && typeof window !== 'undefined') {
      const stored = this.storage.getItem(this.storageKey);
      if (stored) this.loadFromStorage(stored);
    }
    return this.pantallas;
  }

  cargarPantallas(): Observable<SistemaModuloResponse[]> {
    if (this.pantallas) return of(this.pantallas);

    if (typeof window !== 'undefined') {
      const stored = this.storage.getItem(this.storageKey);
      if (stored) {
        this.loadFromStorage(stored);
        return of(this.pantallas ?? []);
      }
    }

    return this.getPatallasUsuario().pipe(
      tap(res => {
        this.pantallas = res.data;
        if (typeof window !== 'undefined') {
          this.storage.setItem(this.storageKey, JSON.stringify(res.data));
          this.saveSnapshot();
        }
      }),
      map(res => res.data ?? [])
    );
  }

  getPatallasUsuario(): Observable<GenericResponse<SistemaModuloResponse[]>> {
    const url = `http://10.1.10.50:81/api/Permisos/ModulosYPantallas`;
    return this.http.get<GenericResponse<SistemaModuloResponse[]>>(url, { context: checkToken() });
  }

  setPantallas(data: SistemaModuloResponse[]) {
    this.pantallas = data;
    if (typeof window !== 'undefined') {
      this.storage.setItem(this.storageKey, JSON.stringify(data));
      this.saveSnapshot();
    }
  }

  limpiarPantallas() {
    this.pantallas = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
      sessionStorage.removeItem(this.storageKey);
      this.lastSnapshot = '';
    }
  }

  tienePermiso(rutaPantalla: string): boolean {
    const modulos = this.getPantallas();
    if (!modulos) return false;
    return modulos.some(modulo =>
      modulo.pantallas?.some(p => p.descripcion === rutaPantalla)
    );
  }

  startIntegrityWatcher(onTamper: () => void) {
    if (this.watcherStarted || typeof window === 'undefined') return;
    this.watcherStarted = true;

    // Escucha cambios desde otras pestañas
    window.addEventListener('storage', e => {
      if (e.key === this.storageKey) {
        if (!this.isSnapshotValid(e.newValue)) {
          onTamper();
        } else {
          this.lastSnapshot = e.newValue || '';
        }
      }
    });

    // Vigilancia local cada 2s — usa el storage correcto
    setInterval(() => {
      const current = this.storage.getItem(this.storageKey) || '';
      if (current !== this.lastSnapshot) {
        if (!this.isSnapshotValid(current)) {
          onTamper();
        } else {
          this.lastSnapshot = current;
        }
      }
    }, 2000);
  }

  private loadFromStorage(raw: string) {
    try {
      const parsed = JSON.parse(raw);
      if (this.isShapeValid(parsed)) {
        this.pantallas = parsed;
        this.lastSnapshot = raw;
      } else {
        this.pantallas = null;
      }
    } catch {
      this.pantallas = null;
    }
  }

  private saveSnapshot() {
    // Guarda el snapshot desde el storage correcto
    this.lastSnapshot = this.storage.getItem(this.storageKey) || '';
  }

  private isSnapshotValid(raw: string | null): boolean {
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      return this.isShapeValid(parsed);
    } catch {
      return false;
    }
  }

  private isShapeValid(obj: any): boolean {
    if (!Array.isArray(obj)) return false;
    return obj.every(it => typeof it === 'object' && it !== null);
  }
}