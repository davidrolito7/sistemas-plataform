import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { AuthService } from '../../auth/service/auth.service';
import { ModulosUsuario } from '../../auth/interface/login.interfaces';
import { GenericResponse } from '../../auth/interface/login.interfaces';

@Injectable({ providedIn: 'root' })
export class UserMenuStore {
    private readonly auth = inject(AuthService);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    private readonly _modulos = signal<ModulosUsuario[]>([]);
    readonly modulos = this._modulos.asReadonly();

    private readonly _loaded = signal(false);
    readonly loaded = this._loaded.asReadonly();

    private request$?: Observable<ModulosUsuario[]>;

    ensureLoaded(): Observable<ModulosUsuario[]> {
        if (this._loaded()) return of(this._modulos());

        this.request$ ??= this.fetchMenus().pipe(
            tap((mods) => {
                this._modulos.set(mods);
                this._loaded.set(true);
            }),
            shareReplay(1),
        );

        return this.request$;
    }

    refresh(): Observable<ModulosUsuario[]> {
        this._loaded.set(false);
        this.request$ = undefined;
        return this.ensureLoaded();
    }

    private fetchMenus(): Observable<ModulosUsuario[]> {
        const idArea = this.readStorage('idAreaSistemaUsuario');
        const perfil = this.readStorage('perfilSeleccionado');

        if (!idArea || !perfil) return of([]);

        return this.auth.GetModulosUsuario(idArea, perfil).pipe(
            map((res: GenericResponse<ModulosUsuario[]>) => res.data ?? []),
            map((mods) =>
                mods.map((m) => ({
                    ...m,
                    pantallas: (m.pantallas ?? []).slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
                })),
            ),
        );
    }

    private readStorage(key: string): string {
        if (!this.isBrowser) return '';

        // recordarUsuario SIEMPRE lo guardas en localStorage
        const recordar = localStorage.getItem('recordarUsuario') === 'true';

        const primary = recordar ? localStorage : sessionStorage;
        const fallback = recordar ? sessionStorage : localStorage;

        return primary.getItem(key) ?? fallback.getItem(key) ?? '';
    }
}
