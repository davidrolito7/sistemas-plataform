import { Injectable,Inject, PLATFORM_ID} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, fromEvent, merge, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private onlineSubject = new BehaviorSubject<boolean>(true); // ✅ Inicia en `true` por defecto

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    // ✅ Verificamos si estamos en el navegador antes de acceder a `navigator`
    if (isPlatformBrowser(this.platformId)) {
      const online$ = fromEvent(window, 'online').pipe(map(() => true));
      const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

      this.onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);

      merge(online$, offline$).subscribe(status => {
        this.onlineSubject.next(status);
        //console.log(status ? "✅ Conexión restablecida" : "⚠️ Sin conexión a Internet");
      });
    }
  }

  isOnline(): Observable<boolean> {
    return this.onlineSubject.asObservable();
  }
}
