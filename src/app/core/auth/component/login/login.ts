import { CommonModule } from '@angular/common';
import { Component, OnInit, HostListener, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Router } from '@angular/router';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';

import { AuthService } from '../../service/auth.service';
import { TokenService } from '../../service/token.service';
import { MessageService } from 'primeng/api';
import { Spinner } from 'src/app/components/spinner/spinner';
import { environment } from 'src/app/environments/environment';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    CheckboxModule,
    ToastModule,
    Spinner,
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  usuario: string     = '';
  contrasenia: string = '';
  idSistema: number   = environment.ConstantsService.idSistema;
  recordar: boolean   = false;
  verPassword: boolean = false;
  isLoading: boolean  = false;

  @ViewChild('passwordInput') passwordInput!: ElementRef;

  constructor(
    private authService: AuthService,
    private router: Router,
    private el: ElementRef,
    private tokenService: TokenService,
    private mensaje: MessageService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {}

  forgotPassword() {
    window.open('https://virtual.tribunaloaxaca.gob.mx/ForgotPassword', '_blank');
  }

  passwordFocus() {
    if (this.usuario?.trim()) {
      this.passwordInput.nativeElement.focus();
    }
  }

  passwordEnter() {
    if (!this.contrasenia?.trim()) {
      this.mensaje.add({ severity: 'error', summary: 'Error', detail: 'Por favor, ingrese su contraseña.', life: 3000 });
      return;
    }
    this.validarUsuario();
  }

  togglePassword() {
    this.verPassword = !this.verPassword;
  }

  validarUsuario() {
    if (!this.usuario?.trim()) {
      this.mensaje.add({ severity: 'error', summary: 'Error', detail: 'Por favor, ingrese su usuario.', life: 3000 });
      return;
    }
    if (!this.contrasenia?.trim()) {
      this.mensaje.add({ severity: 'error', summary: 'Error', detail: 'Por favor, ingrese su contraseña.', life: 3000 });
      return;
    }

    this.isLoading = true;
    this.cd.detectChanges();

    this.authService.login(this.usuario, this.contrasenia, this.idSistema, this.recordar).subscribe({
      next: async (response) => {
        if (response.success) {
          this.authService.actualizaPerfilSeleccionado('');

          if (environment.DEV_SKIP_2FA && environment.DEV_SKIP_PERFIL) {
            // Ambos activos: login2fase detecta tipo persona 1 y completa el contexto automáticamente
            this.router.navigate(['login2fase']);
          } else if (environment.DEV_SKIP_2FA) {
            // Solo 2FA: salta al perfil directamente
            await this.tokenService.setTwoFactorValidated(true);
            this.router.navigate(['/perfil']);
          } else {
            this.tokenService.setTwoFactorValidated(false);
            this.router.navigate(['login2fase']);
          }
        } else {
          this.mensaje.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Usuario o contraseña incorrectos.',
            life: 3000,
          });
        }
      },
      error: () => {
        this.mensaje.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al intentar ingresar.', life: 3000 });
        this.isLoading = false;
        this.cd.detectChanges();
      },
      complete: () => {
        this.isLoading = false;
        this.cd.detectChanges();
      },
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  clearSession(_event: Event) {
    if (!localStorage.getItem('userSession')) {
      sessionStorage.removeItem('userSession');
    }
  }
}