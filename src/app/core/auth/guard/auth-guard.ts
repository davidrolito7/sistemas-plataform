import { CanMatchFn, CanActivateFn, Router, UrlSegment } from '@angular/router';
import { inject } from '@angular/core';
import { TokenService } from '../service/token.service';

// ─────────────────────────────────────────────────────────────────────────────
// Clasifica la URL en una de las tres categorías del flujo de auth
// ─────────────────────────────────────────────────────────────────────────────
function classify(url: string): 'login2fase' | 'perfil' | 'protected' {
  if (url === '/login2fase' || url.startsWith('/login2fase/')) return 'login2fase';
  if (url === '/perfil'     || url.startsWith('/perfil/'))     return 'perfil';
  return 'protected';
}

async function checkAuth(
  tokenService: TokenService,
  router: Router,
  targetUrl: string
): Promise<true | ReturnType<Router['parseUrl']>> {

  const kind   = classify(targetUrl);
  const twoOk  = await tokenService.isTwoFactorValidated();

  // ── Login2fase ────────────────────────────────────────────────────────────
  if (kind === 'login2fase') {
    // Ya completó 2FA → saltar a perfil (o home si también completó perfil)
    if (twoOk) {
      const perfilOk = await tokenService.isPerfilCompleted();
      return router.parseUrl(perfilOk ? '/home' : '/perfil');
    }
    // No completó 2FA → dejar pasar
    return true;
  }

  // ── Perfil ────────────────────────────────────────────────────────────────
  if (kind === 'perfil') {
    // No completó 2FA → volver a segunda fase
    if (!twoOk) return router.parseUrl('/login2fase');
    // Ya completó perfil → saltar directo a home
    const perfilOk = await tokenService.isPerfilCompleted();
    if (perfilOk) return router.parseUrl('/home');
    // Completó 2FA pero no perfil → dejar pasar
    return true;
  }

  // ── Rutas protegidas (home, juicio-oral, etc.) ────────────────────────────
  // No completó 2FA → volver a segunda fase
  if (!twoOk) return router.parseUrl('/login2fase');
  // No completó perfil → seleccionar perfil primero
  const perfilOk = await tokenService.isPerfilCompleted();
  if (!perfilOk) return router.parseUrl('/perfil');
  // Todo ok → dejar pasar
  return true;
}

export const authMatchGuard: CanMatchFn = (_route, segments: UrlSegment[]) => {
  const tokenService = inject(TokenService);
  const router       = inject(Router);
  const url = '/' + (segments.map(s => s.path).join('/') || '');
  return checkAuth(tokenService, router, url);
};

export const authActivateGuard: CanActivateFn = (_route, state) => {
  const tokenService = inject(TokenService);
  const router       = inject(Router);
  return checkAuth(tokenService, router, state.url);
};