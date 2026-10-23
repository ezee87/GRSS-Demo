# GRSS — demo estática para Vercel

Copia estática de lectura de Guati Rojo Abogados, S.C. No requiere WordPress, PHP, MySQL ni proceso de compilación en Vercel.

## Vista local

Desde esta carpeta, iniciar el servidor de prueba incluido (sin dependencias):

```powershell
node .\scripts\server.mjs
```

Después abrir `http://127.0.0.1:4173/`.

## Validación

Con el servidor local activo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\validate.ps1
```

## Actualizar desde WordPress

Con el sitio local de GRSS activo y sin iniciar sesión en la solicitud de exportación:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\export.ps1
```

El script sólo lee WordPress y escribe dentro de este proyecto.

## Publicar en Vercel

1. Crear un proyecto nuevo cuyo directorio raíz sea esta carpeta.
2. Seleccionar “Other” como framework.
3. No configurar comando de build.
4. Usar `.` como directorio de salida.
5. Revisar el preview antes de promoverlo a producción.

No conectar un dominio ni modificar proyectos existentes sin autorización.

## Tipografías

El CSS original declara Inter y Manrope con Arial como fallback, pero WordPress no registra archivos web para esas familias. La demo conserva exactamente ese comportamiento para no alterar anchos, saltos de línea ni alturas respecto del sitio aprobado.
