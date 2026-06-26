import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, UrlSegment } from '@angular/router';
import { filter, Subscription } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  routerLink?: string;
}

@Component({
  selector: 'app-breadcrub',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrub.html',
  styleUrl: './breadcrub.css',
})
export class Breadcrub implements OnInit, OnDestroy {
  breadcrumbs: BreadcrumbItem[] = [];

  private sub?: Subscription;
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  ngOnInit(): void {
    this.buildBreadcrumbs();

    this.sub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => this.buildBreadcrumbs());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private buildBreadcrumbs(): void {
    const routeChain = this.getRouteChain();
    const crumbs: BreadcrumbItem[] = [];
    const moduleRoute = routeChain[0];
    const leafRoute = routeChain[routeChain.length - 1];
    const sectionRoute = routeChain.length > 2 ? routeChain[routeChain.length - 2] : undefined;

    if (moduleRoute) {
      crumbs.push({
        label: this.getDisplayLabel(moduleRoute),
        routerLink: moduleRoute.routerLink,
      });
    }

    if (this.isDetailRoute(leafRoute, sectionRoute, moduleRoute) && sectionRoute && moduleRoute) {
      crumbs.push({
        label: `Listar ${this.toSingular(this.getDisplayLabel(sectionRoute))}`.trim(),
        routerLink: `${moduleRoute.routerLink}/${sectionRoute.path}/listar`,
      });

      crumbs.push({
        label: 'Detalle',
        routerLink: leafRoute.routerLink,
      });

      this.breadcrumbs = crumbs;
      return;
    }

    if (leafRoute && leafRoute !== moduleRoute) {
      const leafLabel = this.buildLeafLabel(leafRoute, sectionRoute, moduleRoute);

      if (leafLabel && leafLabel !== crumbs[crumbs.length - 1]?.label) {
          crumbs.push({
          label: leafLabel,
          routerLink: leafRoute.routerLink,
        });
      }
    }

    this.breadcrumbs = crumbs;
  }

  private getRouteChain(): RouteInfo[] {
    const chain: RouteInfo[] = [];
    let route: ActivatedRoute | null = this.activatedRoute.root;
    let url = '';

    while (route) {
      const children: ActivatedRoute[] = route.children;
      if (!children.length) {
        break;
      }

      let found = false;
      for (const child of children) {
        const segment = child.snapshot.url.map((s: UrlSegment) => s.path).join('/');
        if (segment) {
          url += '/' + segment;
        }

        const title = child.snapshot.data?.['title'] ?? child.snapshot.title ?? null;
        const routePath = child.routeConfig?.path ?? null;
        const label = typeof title === 'string' ? title : null;

        if (segment || label || routePath) {
          chain.push({
            label,
            path: segment || routePath || '',
            routerLink: url,
          });
        }

        route = child;
        found = true;
        break;
      }

      if (!found) {
        break;
      }
    }

    return chain.filter((item) => item.path || item.label);
  }

  private buildLeafLabel(
    leafRoute: RouteInfo,
    sectionRoute?: RouteInfo,
    moduleRoute?: RouteInfo,
  ): string {
    const leafBase = this.getDisplayLabel(leafRoute);
    const moduleLabel = moduleRoute ? this.normalizeLabel(moduleRoute.label) : '';
    const sectionLabel = sectionRoute ? this.normalizeLabel(sectionRoute.label) : '';
    const leafAction = this.normalizeAction(leafRoute.label || leafRoute.path);

    if (leafAction && sectionLabel) {
      return `${leafAction} ${this.toSingular(sectionLabel)}`.trim();
    }

    if (leafBase === moduleLabel && leafRoute.path) {
      return this.formatSegment(leafRoute.path);
    }

    return leafBase;
  }

  private isDetailRoute(
    leafRoute?: RouteInfo,
    sectionRoute?: RouteInfo,
    moduleRoute?: RouteInfo,
  ): boolean {
    if (!leafRoute || !sectionRoute || !moduleRoute) {
      return false;
    }

    return this.normalizeAction(leafRoute.label || leafRoute.path) === 'Detalle';
  }

  private getDisplayLabel(route: RouteInfo): string {
    return this.normalizeLabel(route.label) || this.formatSegment(route.path);
  }

  private normalizeAction(value: string): string | null {
    const normalized = this.normalizeLabel(value).toLowerCase();
    const actionMap: Record<string, string> = {
      listar: 'Listar',
      crear: 'Crear',
      detalle: 'Detalle',
      turnar: 'Turnar',
      buscar: 'Buscar',
      buscarpromocion: 'Buscar',
      nuevapromocion: 'Nueva',
      recibir: 'Recibir',
    };

    return actionMap[normalized.replace(/\s+/g, '')] ?? null;
  }

  private normalizeLabel(value?: string | null): string {
    return (value ?? '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatSegment(segment?: string | null): string {
    if (!segment) return '';

    return segment
      .split('/')
      .map((part) => part.replace(/([a-z])([A-Z])/g, '$1 $2'))
      .join(' ')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private toSingular(value: string): string {
    const singularMap: Record<string, string> = {
      Demandas: 'Demanda',
      Expedientes: 'Expediente',
      Audiencias: 'Audiencia',
      Requerimientos: 'Requerimiento',
      Solicitudes: 'Solicitud',
      Trámites: 'Trámite',
      Acuerdos: 'Acuerdo',
    };

    return singularMap[value] ?? value.replace(/s$/i, '');
  }
}

interface RouteInfo {
  label: string | null;
  path: string;
  routerLink: string;
}
