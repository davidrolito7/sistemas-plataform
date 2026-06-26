import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { Spinner } from 'src/app/components/spinner/spinner';
import { Header } from 'src/app/core/layout/header/header';
import { ApiService } from 'src/app/services/api.service';

interface TypeOption {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-crear-deploy',
  imports: [
    Header,
    NgClass,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    Spinner,
  ],
  providers: [MessageService],
  templateUrl: './crear-deploy.html',
  styleUrl: './crear-deploy.css',
})
export class CrearDeploy {
  private readonly apiService = inject(ApiService);
  private readonly messageService = inject(MessageService);

  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  typeOptions: TypeOption[] = [
    { label: 'Angular', value: 'angular', icon: 'pi pi-code' },
    { label: '.NET', value: 'dotnet', icon: 'pi pi-server' },
  ];

  selectedType = '';
  projectName = '';
  selectedFile: File | null = null;
  isDragOver = false;

  readonly isLoading = signal(false);
  readonly spinnerMessage = signal('Iniciando deploy...');
  readonly confirmDeployVisible = signal(false);
  readonly finalConfirmVisible = signal(false);

  get canSubmit(): boolean {
    return !!this.selectedType && !!this.projectName.trim() && !!this.selectedFile && !this.isLoading();
  }

  get selectedTypeLabel(): string {
    return this.typeOptions.find((option) => option.value === this.selectedType)?.label ?? 'Sin seleccionar';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.setFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.setFile(file);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }

  openConfirmDeploy(): void {
    if (!this.canSubmit) return;
    this.confirmDeployVisible.set(true);
  }

  proceedToFinalConfirm(): void {
    this.confirmDeployVisible.set(false);
    this.finalConfirmVisible.set(true);
  }

  closeDialogs(): void {
    this.confirmDeployVisible.set(false);
    this.finalConfirmVisible.set(false);
  }

  onSubmit(): void {
    if (!this.canSubmit) return;

    this.closeDialogs();
    this.spinnerMessage.set(`Desplegando ${this.projectName.trim()}...`);
    this.isLoading.set(true);

    this.apiService
      .uploadDeploy(this.selectedType, this.projectName.trim(), this.selectedFile!)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response?.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Deploy exitoso',
              detail: response.message ?? `El proyecto "${this.projectName}" fue desplegado correctamente.`,
              life: 5000,
            });
            this.resetForm();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error en el deploy',
              detail: response.message ?? 'Ocurrio un error al desplegar el proyecto.',
              life: 5000,
            });
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error de conexion',
            detail: 'No se pudo conectar con el servidor. Intenta de nuevo.',
            life: 5000,
          });
        },
      });
  }

  downloadWebConfig(): void {
    const projectUrl = this.projectName.trim() ? `/${this.projectName.trim()}/` : '/TU-PROYECTO/';
    const content = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Angular Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="${projectUrl}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`;
    const blob = new Blob([content], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'web.config';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  clearFile(): void {
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private setFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Archivo no valido',
        detail: 'Solo se permiten archivos .zip',
        life: 4000,
      });
      this.clearFile();
      return;
    }

    this.selectedFile = file;
  }

  private resetForm(): void {
    this.selectedType = '';
    this.projectName = '';
    this.clearFile();
  }
}
