import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DrawerService {
  readonly visible = signal(false);
  open() { this.visible.set(true); }
  close() { this.visible.set(false); }
}