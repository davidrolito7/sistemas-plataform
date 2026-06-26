import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { tokenInterceptor } from './core/auth/interceptor/token.interceptor';
import { Custom } from './theme/cj';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    provideRouter(
      routes,
      withRouterConfig({
        urlUpdateStrategy: 'deferred',
        canceledNavigationResolution: 'computed',
      })
    ),
    provideAnimationsAsync(),

    providePrimeNG({
   //   translation: es.es,
      theme: {
        preset: Custom,
        options: {
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      }
    }),

    provideHttpClient(
      withInterceptors([tokenInterceptor]),
      withInterceptorsFromDi(),
    ),
  ]
};
