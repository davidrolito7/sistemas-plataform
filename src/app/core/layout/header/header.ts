import { DOCUMENT } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { AvatarModule } from 'primeng/avatar';
import { DrawerModule } from 'primeng/drawer';
import { Button } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { TokenService } from '../../../core/auth/service/token.service';
import { AuthService } from '../../../core/auth/service/auth.service';
import { DrawerService } from '../services/drawer.service';
// import { NotificacionesService } from '../../services/notificaciones.service';
// import { NotificacionResponse } from '../../interface/shared.interface';
// import { NotificacionToastComponent } from '../notificacion-toast/notificacion-toast';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    AvatarModule,
    DrawerModule,
    Button,
    CommonModule,
    BadgeModule,
    OverlayBadgeModule,
   // NotificacionToastComponent,
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideOutRight', [
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class Header implements OnInit {
  visibleDrawer = false;
  visibleNotificaciones = false;
  readonly temaOscuro = signal(false);
  readonly temaIcono = computed(() => this.temaOscuro() ? 'pi pi-sun' : 'pi pi-moon');
  readonly temaAriaLabel = computed(() => this.temaOscuro() ? 'Activar modo claro' : 'Activar modo oscuro');

 notificaciones = signal<any[]>([]);
  //notificacionToast = signal<NotificacionResponse | null>(null);
  pendientes = signal(0);
  cargandoNotificaciones = signal(false);
  drawerMobileTab: 'perfil' | 'notificaciones' = 'perfil';

  private socketSub?: Subscription;
  private readonly tokenService = inject(TokenService);
  //private readonly notificacionesService = inject(NotificacionesService);
  private readonly authService = inject(AuthService);
  readonly drawerService = inject(DrawerService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly marcandoLeida = new Set<number>();

  ngOnInit(): void {
    this.cargarTemaGuardado();

    // this.socketSub = this.notificacionesService.escucharNotificaciones().subscribe({
    //   next: (resp) => {
    //     this.agregarNotificacionSocket(resp.data);
    //   }
    // });

    // this.notificacionesService.conectarSocket();
   // this.cargarNotificaciones();
  }

  // ngOnDestroy(): void {
  //   this.socketSub?.unsubscribe();
  //   this.notificacionesService.desconectarSocket();
  // }

  toggleTema(): void {
    const switchTheme = (): void => {
      const esOscuro = !this.temaOscuro();
      this.temaOscuro.set(esOscuro);

      const root = this.document.documentElement;
      root.classList.toggle('dark', esOscuro);
      root.style.colorScheme = esOscuro ? 'dark' : 'light';
      this.document.defaultView?.localStorage.setItem('sijudi-theme', esOscuro ? 'dark' : 'light');
    };

    if (!this.document.startViewTransition) {
      switchTheme();
      return;
    }

    this.document.startViewTransition(switchTheme);
  }

  // cargarNotificaciones(): void {
  //   this.cargandoNotificaciones.set(true);

  //   this.notificacionesService.obtenerMisNotificaciones().subscribe({
  //     next: (resp) => {
  //       this.notificaciones.set((resp.data?.notificaciones ?? []).filter(n => !n.leida));
  //       this.pendientes.set(resp.data?.pendientes ?? 0);
  //       this.cargandoNotificaciones.set(false);
  //     },
  //     error: () => {
  //       this.cargandoNotificaciones.set(false);
  //     }
  //   });
  // }

  // marcarNotificacionLeida(notif: NotificacionResponse): void {
  //   if (!notif?.id || notif.leida || this.marcandoLeida.has(notif.id)) {
  //     return;
  //   }

  //   const notificacionesPrevias = this.notificaciones();
  //   const pendientesPrevios = this.pendientes();

  //   this.marcandoLeida.add(notif.id);

  //   this.notificaciones.update(n => n.filter(notif2 => notif2.id !== notif.id));
  //   this.pendientes.update(p => Math.max(0, p - 1));

  //   this.notificacionesService.marcarLeida(notif.id)
  //     .pipe(
  //       finalize(() => {
  //         this.marcandoLeida.delete(notif.id);
  //       })
  //     )
  //     .subscribe({
  //       error: () => {
  //         this.notificaciones.set(notificacionesPrevias);
  //         this.pendientes.set(pendientesPrevios);
  //       }
  //     });
  // }

  // onToastCerrada(): void {
  //   this.notificacionToast.set(null);
  // }

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

  get subAreaNombre(): string {
    return this.tokenService.getSubAreaNombre();
  }

  onLogout(): void {
    this.tokenService.logout();
    this.authService.vaciarPantallasUsuario();
    this.authService.setPantallasCargadas(false);
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  onChangeProfile(): void {
    this.tokenService.startProfileChange();
    this.router.navigate(['/perfil'], { replaceUrl: true });
  }

  verPerfil(): void {
    this.router.navigate(['/datos-personales'], { replaceUrl: true });
  }

  private cargarTemaGuardado(): void {
    const temaGuardado = this.document.defaultView?.localStorage.getItem('sijudi-theme') === 'dark';
    this.temaOscuro.set(temaGuardado);

    const root = this.document.documentElement;
    root.classList.toggle('dark', temaGuardado);
    root.style.colorScheme = temaGuardado ? 'dark' : 'light';
  }

  // private agregarNotificacionSocket(notif: NotificacionResponse): void {
  //   const nueva: NotificacionResponse = {
  //     ...notif,
  //     leida: notif.leida ?? false
  //   };

  //   if (nueva.leida) {
  //     this.notificaciones.update(n => n.filter(notificacion => notificacion.id !== nueva.id));
  //     return;
  //   }

  //   const yaExiste = this.notificaciones().some(n => n.id === nueva.id);
  //   if (yaExiste) {
  //     this.notificaciones.update(n =>
  //       n.map(notificacion =>
  //         notificacion.id === nueva.id ? { ...notificacion, ...nueva } : notificacion
  //       )
  //     );
  //     return;
  //   }

  //   this.notificaciones.update(n => [nueva, ...n]);
  //   this.pendientes.update(p => p + 1);
  //   this.notificacionToast.set({ ...nueva });
  // }
}

