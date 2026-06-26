import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import { UserMenuStore } from '../../../layout/siderbar/user-menu.store';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TokenService } from '../../service/token.service';
import { AuthService } from '../../service/auth.service';
import { areasResponse, responseCatalogoPerfiles, usuarioAreas } from '../../interface/login.interfaces';
import { GenericResponse } from '../../interface/login.interfaces';
import { Spinner } from 'src/app/components/spinner/spinner';
import { PantallasService } from '../../service/pantallas.service';

const SISTEMA_ID = 4169;

interface PersistedSelection {
  recordar: boolean;
  areaId: number;
  perfilId: number;
  perfilDesc: string;
  subAreaId: number;
}

@Component({
  selector: 'app-perfil',
  imports: [
    CommonModule, FormsModule, SelectModule,
    ButtonModule, CheckboxModule, ToastModule, Spinner,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
})
export class Perfil {
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly menuStore = inject(UserMenuStore);
  private readonly pantallasService = inject(PantallasService);

  readonly isLoading = signal(false);

  readonly listaAreas = signal<areasResponse[]>([]);
  readonly perfiles = signal<responseCatalogoPerfiles[]>([]);
  readonly subAreas = signal<usuarioAreas[]>([]);

  readonly idGeneral = signal(0);
  readonly idAreaSistemaUsuario = signal(0);

  readonly areaSeleccionada = signal(0);
  readonly perfilSeleccionado = signal(0);
  readonly perfilNombreSeleccionado = signal('');
  readonly subAreaId = signal(0);
  readonly subAreaNombre = signal('');

  recordar = false;

  readonly abogadoNombre = signal<string>(sessionStorage.getItem('AbogadoNombre') ?? localStorage.getItem('AbogadoNombre') ?? '');
  readonly abogadoFotoBase64 = signal<string>(sessionStorage.getItem('AbogadoFotoBase64') ?? '');

  readonly canContinue = computed(
    () => this.areaSeleccionada() > 0 && this.perfilSeleccionado() > 0 && this.subAreaId() > 0
  );

  ngOnInit(): void {
    const persisted = this.readPersistedSelection();
    this.recordar = persisted.recordar;
    this.areaSeleccionada.set(persisted.areaId);
    this.perfilSeleccionado.set(persisted.perfilId);
    this.perfilNombreSeleccionado.set(persisted.perfilDesc);
    this.subAreaId.set(persisted.subAreaId);
    this.loadUserAndAreas(persisted.areaId, persisted.perfilId, persisted.subAreaId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVENTOS DE SELECCIÓN
  // ─────────────────────────────────────────────────────────────────────────

  onAreaChange(areaId: number): void {
    this.areaSeleccionada.set(areaId);
    this.perfilSeleccionado.set(0);
    this.perfilNombreSeleccionado.set('');
    this.perfiles.set([]);
    this.subAreaId.set(0);
    this.subAreaNombre.set('');
    this.subAreas.set([]);
    this.idAreaSistemaUsuario.set(0);
    if (areaId <= 0) return;
    this.isLoading.set(true);
    this.loadPerfilesForArea$(areaId, 0).pipe(
      switchMap(() => this.loadSubareas$(areaId)),
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar perfiles y subáreas.' });
        return of(null);
      }),
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  onPerfilChange(perfilId: number): void {
    this.perfilSeleccionado.set(perfilId);
    const selected = this.perfiles().find(p => p.idSistemaPerfil === perfilId);
    this.perfilNombreSeleccionado.set(selected?.descripcion ?? '');
  }

  onSubAreaChange(SubAreaId: number): void {
    this.subAreaId.set(SubAreaId);
    const selected = this.subAreas().find(p => p.idSubArea === SubAreaId);
    this.subAreaNombre.set(selected?.descripcion ?? '');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONTINUAR
  // ─────────────────────────────────────────────────────────────────────────

  continuar(): void {
    if (!this.canContinue()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Campos requeridos',
        detail: 'Debes seleccionar un área, un perfil y subarea',
      });
      return;
    }

    const request = {
      idSistema: SISTEMA_ID,
      idArea: this.areaSeleccionada(),
      idSistemaPerfil: this.perfilSeleccionado(),
      idSubArea: this.subAreaId(),
    };
    this.isLoading.set(true);

    this.authService.postLoginContexto(request, this.recordar).subscribe({
      next: async (response) => {
        if (!response.success) {
          this.messageService.add({
            severity: 'error',
            summary: 'Acceso denegado',
            detail: response.message ?? 'No se puede continuar.',
          });
          return;
        }

        this.guardarContextoStorage();

        await this.tokenService.setTwoFactorValidated(true);
        await this.tokenService.setPerfilCompleted(true);

        const perfilOk = await this.tokenService.isPerfilCompleted();
        if (!perfilOk) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al guardar la sesión, intente de nuevo.',
            life: 3000,
          });
          return;
        }

        this.isLoading.set(false);

        this.pantallasService.limpiarPantallas();

        this.menuStore.refresh()
          .pipe(
            catchError(() => of([])),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {
            this.router.navigate(['/test'], { replaceUrl: true });
          });
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STORAGE DE CONTEXTO
  // ─────────────────────────────────────────────────────────────────────────

  private guardarContextoStorage(): void {
    localStorage.setItem('recordarUsuario', this.recordar ? 'true' : 'false');

    const store = this.recordar ? localStorage : sessionStorage;
    const other = this.recordar ? sessionStorage : localStorage;

    store.setItem('areaSeleccionada', String(this.areaSeleccionada()));
    store.setItem('perfilSeleccionado', String(this.perfilSeleccionado()));
    store.setItem('perfilSeleccionadoDesc', this.perfilNombreSeleccionado());
    store.setItem('idAreaSistemaUsuario', String(this.idAreaSistemaUsuario()));
    store.setItem('SubAreaNombre', this.subAreaNombre());
    store.setItem('SubAreaId', String(this.subAreaId()));
    const areaObj = this.listaAreas().find(a => a.idArea === this.areaSeleccionada());
    store.setItem('AreaName', areaObj?.area ?? '');
    store.setItem('AbogadoNombre', this.abogadoNombre());
    sessionStorage.setItem('AbogadoFotoBase64', this.abogadoFotoBase64());

    const toRemove = [
      'areaSeleccionada', 'perfilSeleccionado', 'perfilSeleccionadoDesc',
      'idAreaSistemaUsuario', 'AreaName', 'AreaBd', 'AbogadoNombre',
      'pantallas_usuario', 'SubAreaNombre', 'SubAreaId',
    ];
    toRemove.forEach(k => other.removeItem(k));
    localStorage.removeItem('AbogadoFotoBase64');
  }

  onLogout(): void {
    this.tokenService.logout();
    this.pantallasService.limpiarPantallas();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CARGA DE DATOS
  // ─────────────────────────────────────────────────────────────────────────

  private loadUserAndAreas(restoreAreaId: number, restorePerfilId: number, restoreSubAreaId: number): void {
    const user = this.tokenService.getUserFromToken();
    if (!user?.idGeneral) {
      this.messageService.add({ severity: 'error', summary: 'Sesión inválida', detail: 'No se pudo obtener el usuario desde el token.' });
      return;
    }

    this.isLoading.set(true);

    this.authService.obtenerDatosUsuario(user.idGeneral).pipe(
      tap(resp => {
        const abogado = resp.data?.pD_Abogados?.[0];
        // Solo actualizamos signals; el storage ya viene de login2fase
        this.abogadoNombre.set((abogado?.nombre ?? '').toString().trim());
        this.abogadoFotoBase64.set((abogado?.foto ?? '').toString().trim());
      }),
      map(resp => resp.data?.pD_Abogados?.[0]?.idGeneral ?? 0),
      tap(idG => this.idGeneral.set(idG)),
      switchMap(idG => {
        if (!idG) return of<areasResponse[]>([]);
        return this.authService.getAreas(SISTEMA_ID, idG).pipe(map(r => (r.data ?? []) as areasResponse[]));
      }),
      tap(areas => {
        this.listaAreas.set(areas);
        const validArea = restoreAreaId > 0 && areas.some(a => a.idArea === restoreAreaId);
        this.areaSeleccionada.set(validArea ? restoreAreaId : 0);
        if (!validArea) {
          this.perfilSeleccionado.set(0);
          this.perfilNombreSeleccionado.set('');
          this.perfiles.set([]);
        }
      }),
      switchMap(areas => {
        if (!areas?.length) return of<usuarioAreas[]>([]);
        const area = areas.find(f => f.idArea === this.areaSeleccionada());
        if (area) {
          return this.authService.getSubAreas(area.idAreaSistema, this.idGeneral()).pipe(map(r => (r.data ?? []) as usuarioAreas[]));
        }
        return of<usuarioAreas[]>([]);
      }),
      tap(subareas => {
        this.subAreas.set(subareas);
        const validSubArea = restoreSubAreaId > 0 && subareas.some(sa => sa.idSubArea === restoreSubAreaId);
        this.subAreaId.set(validSubArea ? restoreSubAreaId : 0);
        const area = this.subAreas().find(f => f.idSubArea === this.subAreaId());
        this.subAreaNombre.set(area?.descripcion ?? '');
        if (!validSubArea) {
          this.perfilSeleccionado.set(0);
          this.perfilNombreSeleccionado.set('');
          this.perfiles.set([]);
          this.subAreaId.set(0);
          this.subAreaNombre.set('');
        }
      }),
      switchMap(() => {
        const areaId = this.areaSeleccionada();
        return areaId > 0 ? this.loadPerfilesForArea$(areaId, restorePerfilId) : of(null);
      }),
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar áreas/perfiles.' });
        return of(null);
      }),
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private loadSubareas(idArea: number): void {
    this.loadSubareas$(idArea).subscribe({
      error: e => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: e.message, life: 0 });
      },
    });
  }

  private loadSubareas$(idArea: number): Observable<usuarioAreas[]> {
    const area = this.listaAreas().find(f => f.idArea === idArea);
    if (!area?.idAreaSistema) return of([]);

    return this.authService.getSubAreas(area.idAreaSistema, this.idGeneral()).pipe(
      map((response: GenericResponse<usuarioAreas[]>) => {
        if (!response.success) {
          throw new Error(response.message ?? 'No se pudieron cargar las subáreas.');
        }
        return response.data ?? [];
      }),
      tap(subAreas => this.subAreas.set(subAreas))
    );
  }

  private loadPerfilesForArea(areaId: number, restorePerfilId: number): void {
    this.isLoading.set(true);
    this.loadPerfilesForArea$(areaId, restorePerfilId).pipe(
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar el catálogo de perfiles.' });
        return of(null);
      }),
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private loadPerfilesForArea$(areaId: number, restorePerfilId: number): Observable<responseCatalogoPerfiles[] | null> {
    const idG = this.idGeneral();
    if (!idG) return of(null);

    return this.authService.obtenerIdAreaSistemaUsuario(idG, SISTEMA_ID, areaId).pipe(
      map(r => r.data?.idAreaSistemaUsuario ?? 0),
      tap(idAreaSysUsr => this.idAreaSistemaUsuario.set(idAreaSysUsr)),
      switchMap(idAreaSysUsr => {
        if (!idAreaSysUsr) return of<responseCatalogoPerfiles[]>([]);
        return this.authService.GetPerfiles(idAreaSysUsr).pipe(
          map((r: GenericResponse<responseCatalogoPerfiles[]>) => r.data ?? [])
        );
      }),
      tap(perfiles => {
        this.perfiles.set(perfiles);
        const validPerfil = restorePerfilId > 0 && perfiles.some(p => p.idSistemaPerfil === restorePerfilId);
        const perfilId = validPerfil ? restorePerfilId : 0;
        this.perfilSeleccionado.set(perfilId);
        const sel = perfiles.find(p => p.idSistemaPerfil === perfilId);
        this.perfilNombreSeleccionado.set(sel?.descripcion ?? '');
      }),
      map(perfiles => perfiles)
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PERSISTENCIA
  // ─────────────────────────────────────────────────────────────────────────

  private readPersistedSelection(): PersistedSelection {
    const recordar = localStorage.getItem('recordarUsuario') === 'true';
    const primary = recordar ? localStorage : sessionStorage;
    const fallback = recordar ? sessionStorage : localStorage;

    const areaId = this.readNumber(primary, 'areaSeleccionada') || this.readNumber(fallback, 'areaSeleccionada');
    const perfilId = this.readNumber(primary, 'perfilSeleccionado') || this.readNumber(fallback, 'perfilSeleccionado');
    const perfilDesc = primary.getItem('perfilSeleccionadoDesc') ?? fallback.getItem('perfilSeleccionadoDesc') ?? '';
    const subAreaId = this.readNumber(primary, 'SubAreaId') || this.readNumber(fallback, 'SubAreaId');

    return { recordar, areaId, perfilId, perfilDesc, subAreaId };
  }

  private readNumber(storage: Storage, key: string): number {
    const raw = storage.getItem(key);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
}
