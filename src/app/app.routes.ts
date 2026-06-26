import { Routes } from '@angular/router';
import { Home } from './views/home/home';
import { Test } from './views/test/test';
import { Login } from './core/auth/component/login/login';
import { authMatchGuard } from './core/auth/guard/auth-guard';
import { Perfil } from './core/auth/component/perfil/perfil';
import { redirectGuard } from './core/auth/guard/redirect-guard';
import { Siderbar } from './core/layout/siderbar/siderbar';
import { CrearDeploy } from './views/crear-deploy/crear-deploy';


export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: Home
  },
  { path: 'login', component: Login, canMatch: [redirectGuard] },
  {
    path: 'login2fase',
    loadComponent: () =>
      import('./core/auth/component/login2fase/login2fase')
        .then(m => m.Login2),
    canMatch: [authMatchGuard],
  },

  { path: 'perfil', component: Perfil, canMatch: [authMatchGuard] },
  {
    path: '',
    component: Siderbar,
    canMatch: [authMatchGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'test' },
      { path: 'test', component: Test },
      { path: 'deploy', component: CrearDeploy }
    ]
  }
];
