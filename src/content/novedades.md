# Novedades · Eventos SENA

Resumen de las capacidades implementadas en la versión actual de **Bienestar al Aprendiz**.

## Incluido en esta versión

- [x] **Identidad visual renovada**: fondo principal `#014446`, nodos luminosos `#A4CF63`, formularios y botones translúcidos tipo vidrio esmerilado y tipografía blanca de alto contraste.
- [x] **Acceso interactivo 3D**: escenario WebGL con la letra **S** rotable, objetos 3D de Bienestar al Aprendiz, inicio de sesión y cambio de contraseña.
- [x] **Formulario completo de Crear Evento**: lugar, inicio/fin del evento, apertura/cierre de inscripciones, cupo máximo, acompañantes (hasta 10 o inscripción individual), `Incluye hotel`, `Incluye bus`, operador asignado, checkpoints y descripción en **Markdown (GFM)** con vista previa.
- [x] **Formulario completo de Crear Usuario**: rol (`Operador`/`Administrador`), nombre completo, documento, correo, contraseña asignada por el administrador (mín. 8 caracteres), tipo de afiliación (`SENA`/`Externo`) y centro de formación.
- [x] **Directorios con búsqueda y gestión en vivo**: filtros por estado y rol, inspección detallada de eventos y edición inmediata de checkpoints.

```ts
export type AdminTab = 'resumen' | 'eventos' | 'usuarios';
export type UserRole = 'Administrador' | 'Operador';
export type AffiliationType = 'SENA' | 'Externo';
```
