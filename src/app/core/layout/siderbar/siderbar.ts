import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { svgSrcForPantalla, svgSrcForModulo } from './icon/menu-icons.map';

import { UserMenuStore } from './user-menu.store';
import { ModulosUsuario } from '../../auth/interface/login.interfaces';
import { TokenService } from '../../auth/service/token.service';
import { AuthService } from '../../auth/service/auth.service';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { AppIcon } from "./icon/app-icon.component";
import { StyleClassModule } from 'primeng/styleclass';
import { RippleModule } from 'primeng/ripple';
import { DrawerService } from '../services/drawer.service';
//import { ContadoresService } from '../../../juicio-oral/services/contadores.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

export const sidebarAnimations = [
  trigger('sidebarWidth', [
    state('expanded', style({ width: '17rem' })),
    state('collapsed', style({ width: '5rem' })),
    transition('expanded <=> collapsed', [
      animate('280ms cubic-bezier(0.4, 0, 0.2, 1)'),
    ]),
  ]),

  trigger('fadeText', [
    state('visible', style({ opacity: 1, maxWidth: '14rem' })),
    state('hidden', style({ opacity: 0, maxWidth: '0px' })),
    transition('hidden => visible', [animate('220ms 60ms ease-out')]),
    transition('visible => hidden', [animate('150ms ease-in')]),
  ]),

  trigger('accordion', [
    state('closed', style({ height: '0px', opacity: 0 })),
    state('open', style({ height: '*', opacity: 1 })),
    transition('closed => open', [
      animate('220ms cubic-bezier(0.4, 0, 0.2, 1)'),
    ]),
    transition('open => closed', [
      animate('180ms cubic-bezier(0.4, 0, 0.2, 1)'),
    ]),
  ]),

  trigger('chevronRotate', [
    state('closed', style({ transform: 'rotate(0deg)' })),
    state('open', style({ transform: 'rotate(180deg)' })),
    transition('closed <=> open', [animate('200ms ease')]),
  ]),

  trigger('railScale', [
    state('off', style({ transform: 'scaleY(0)' })),
    state('on', style({ transform: 'scaleY(1)' })),
    transition('off <=> on', [animate('180ms ease')]),
  ]),
];

@Component({
  selector: 'app-siderbar',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TooltipModule,
    DividerModule,
    AvatarModule,
    DrawerModule,
    ButtonModule,
    StyleClassModule,
    RippleModule,
    BadgeModule,
    OverlayBadgeModule,

  ],
  templateUrl: './siderbar.html',
  styleUrl: './siderbar.css',
  animations: sidebarAnimations,
})
export class Siderbar {
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);
  private readonly menuStore = inject(UserMenuStore);
  readonly drawerService = inject(DrawerService);

  visibleDrawer: boolean = false;

  readonly svgSrcForPantalla = svgSrcForPantalla;
  readonly svgSrcForModulo = svgSrcForModulo;


  readonly modulos = this.menuStore.modulos;
  readonly showMenu = signal(true);
  readonly activePantallaRoute = signal<string | null>(null);
  readonly selectedModuloId = signal<number | null>(null);
  readonly expandedModuloIds = signal<number[]>([]);

  readonly selectedModulo = computed(() =>
    this.modulos().find((m) => m.idSistemaModulo === this.selectedModuloId()) ?? null
  );

  readonly pantallasVisibles = computed(() => {
    const mod = this.selectedModulo();
    if (!mod) return [];
    return (mod.pantallas ?? []).filter((p) => p.visibleMenu);
  });

  constructor() {
    this.syncSelectedModuloFromRoute();

    this.router.events
      .pipe(
        filter((event: unknown): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.syncSelectedModuloFromRoute());

    this.menuStore
      .ensureLoaded()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.syncSelectedModuloFromRoute();
        },
      });
  }

  // ngOnInit(): void {
  //   this.contadoresService.cargarContadores();
  // }

  // ngOnDestroy(): void {
  //   this.contadoresService.detenerPolling();
  // }


  onLogout(): void {
    this.tokenService.logout();

    // limpia datos en memoria
    this.authService.vaciarPantallasUsuario();
    this.authService.setPantallasCargadas(false);

    // oculta menú lateral si estuviera abierto
    this.showMenu.set(false);

    this.router.navigate(['/login'], { replaceUrl: true });
  }

  onChangeProfile(): void {
    // mantiene tokens y 2FA, pero obliga a completar perfil de nuevo
    this.tokenService.startProfileChange();

    // limpia estado del menú
    this.showMenu.set(false);

    this.router.navigate(['/perfil'], { replaceUrl: true });
  }

  toggleSidebar(): void {
    const nextState = !this.showMenu();
    this.showMenu.set(nextState);
  }

  toggleModulo(mod: ModulosUsuario): void {
    if (!this.showMenu()) {
      this.showMenu.set(true);
    }

    this.toggleExpandedModulo(mod.idSistemaModulo);
  }

  closeMenu(): void {
    this.showMenu.set(false);
  }
  // Agrega junto a los otros métodos
  pantallasDeModulo(mod: ModulosUsuario) {
    return (mod.pantallas ?? []).filter((p) => p.visibleMenu);
  }

  get abogadoNombre(): string {
    return this.tokenService.getAbogadoNombre() || 'Abogado';
  }

  get abogadoFotoUrl(): string {
    return this.tokenService.getAbogadoFotoUrl();
  }

  get areaNombre(): string {
    return this.tokenService.getAreaNombre();
  }

  get perfilNombre(): string {
    return this.tokenService.getPerfilNombre();
  }
  // getBadge(IdPantalla: number): Observable<number | null> {
  //   return this.contadoresService.getContadorParaPantalla(IdPantalla);
  // }

  isModuloActive(moduloId: number | null | undefined): boolean {
    return moduloId != null && this.selectedModuloId() === moduloId;
  }

  isModuloExpanded(moduloId: number | null | undefined): boolean {
    if (moduloId == null) {
      return false;
    }

    return this.expandedModuloIds().includes(moduloId);
  }

  private toggleExpandedModulo(moduloId: number | null | undefined): void {
    if (moduloId == null) {
      return;
    }

    this.expandedModuloIds.update((ids) =>
      ids.includes(moduloId)
        ? ids.filter((id) => id !== moduloId)
        : [...ids, moduloId]
    );
  }

  private ensureExpandedModulo(moduloId: number | null | undefined): void {
    if (moduloId == null || this.expandedModuloIds().includes(moduloId)) {
      return;
    }

    this.expandedModuloIds.update((ids) => [...ids, moduloId]);
  }

  private syncSelectedModuloFromRoute(): void {
    const currentUrl = this.normalizeRoute(this.router.url);
    if (!currentUrl) {
      this.activePantallaRoute.set(null);
      this.selectedModuloId.set(null);
      return;
    }

    let matchedModuloId: number | null = null;
    let matchedPantallaRoute: string | null = null;
    let longestMatch = -1;

    for (const modulo of this.modulos()) {
      for (const pantalla of modulo.pantallas ?? []) {
        const pantallaRoute = this.normalizeRoute(pantalla.descripcion);
        if (!pantallaRoute || !this.isCurrentRouteForPantalla(currentUrl, pantallaRoute)) {
          continue;
        }

        if (pantallaRoute.length > longestMatch) {
          longestMatch = pantallaRoute.length;
          matchedModuloId = modulo.idSistemaModulo ?? null;
          matchedPantallaRoute = pantallaRoute;
        }
      }
    }

    this.activePantallaRoute.set(matchedPantallaRoute);
    this.selectedModuloId.set(matchedModuloId);

    if (matchedModuloId !== null) {
      this.ensureExpandedModulo(matchedModuloId);
    }
  }

  private isCurrentRouteForPantalla(currentUrl: string, pantallaRoute: string): boolean {
    return currentUrl === pantallaRoute || currentUrl.startsWith(`${pantallaRoute}/`);
  }

  private normalizeRoute(route: string | null | undefined): string {
    return (route ?? '')
      .split('?')[0]
      .split('#')[0]
      .replace(/^\/+/, '')
      .trim();
  }
}
