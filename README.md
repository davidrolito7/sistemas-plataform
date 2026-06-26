# CumpleDev Website

Sitio Angular + TypeScript + Tailwind CSS para mostrar los próximos cumpleaños del área de Desarrollo de Sistemas.

> Nota: Angular 18 usa Vite internamente en el servidor de desarrollo, pero este proyecto evita `@analogjs/vite-plugin-angular` porque causaba errores de compatibilidad en Windows.

## Instalación limpia

En PowerShell, dentro de la carpeta del proyecto:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
npm run dev
```

Luego abre:

```text
http://localhost:5173
```

## Editar cumpleaños

Los datos están en:

```text
src/app/data/birthdays.ts
```
