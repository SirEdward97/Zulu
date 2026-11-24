# Guía de acceso y uso · Eventos SENA

Bienvenido al sistema administrativo de **Eventos SENA — Bienestar al Aprendiz**, construido con **React**, **TypeScript**, **Three.js** y **Markdown**.

## 1. Cómo iniciar sesión

1. Escribe tu **Correo electrónico** institucional (por ejemplo, `admin@soy.sena.edu.co` o `correo@sena.gov.co`).
2. Ingresa tu **Contraseña** (mínimo 6 caracteres).
3. Pulsa **Iniciar sesión** para acceder al **Panel de Administración**.

Si necesitas actualizar tu clave, selecciona **Cambiar contraseña** en la parte inferior del formulario de acceso.

### Credenciales de prueba

| Campo | Valor |
| :--- | :--- |
| **Correo** | `admin@soy.sena.edu.co` |
| **Contraseña** | `Sena2026*` |

## 2. Crear un evento

Desde las pestañas **Resumen** o **Eventos**, pulsa **Crear evento** y completa el formulario:

- **Información base**: `Nombre del evento`, `Descripción (opcional)` (con soporte Markdown `.md` y vista previa) y `Lugar`.
- **Fechas y horarios**: `Inicio del evento`, `Fin del evento`, `Inscripciones abren` e `Inscripciones cierran`.
- **Cupo y acompañantes**: `Cupo máximo (personas totales)`, selección `¿Permite acompañantes?` (`Sí` / `No, el evento es de inscripción individual`) y `Máximo de acompañantes por inscripción` (hasta 10).
- **Logística y operación**: casillas `Incluye hotel` e `Incluye bus`, `Operador asignado`, estado de inscripciones (`Abiertas`/`Cerradas`) y lista de **Checkpoints**.

## 3. Crear y gestionar usuarios

En la pestaña **Usuarios**, pulsa **Crear usuario** para registrar nuevos administradores u operadores:

- **Rol**: `Operador` o `Administrador`.
- **Identificación y acceso**: `Nombre completo`, `Documento`, `Correo` y `Contraseña (la asigna el Administrador)` (mínimo 8 caracteres).
- **Vinculación**: `Tipo de afiliación` (`SENA` o `Externo`) y `Centro de formación` (opcional para Operadores).

Desde el directorio puedes filtrar por rol, buscar por nombre/documento/correo/centro, alternar el estado **Activo/Inactivo** o cambiar el rol (conservando siempre al menos un administrador activo).
