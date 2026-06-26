import { CanMatchFn, Router, UrlSegment } from '@angular/router';
import { inject } from '@angular/core';
import { TokenService } from '../service/token.service';

export const redirectGuard: CanMatchFn = async (_route, _segments: UrlSegment[]) => {
  const tokenService = inject(TokenService);
  const router       = inject(Router);

  if (!tokenService.isValidToken()) return true;

  const twoOk = await tokenService.isTwoFactorValidated();
  if (!twoOk) return router.parseUrl('/login2fase');

  const perfilOk = await tokenService.isPerfilCompleted();
  return router.parseUrl(perfilOk ? '/home' : '/perfil');
};
