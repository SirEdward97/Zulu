# Eventos SENA · Bienestar al Aprendiz

Aplicación web frontend en **React + TypeScript + Tailwind CSS + Three.js + Markdown** para la gestión administrativa de eventos de **Bienestar al Aprendiz (SENA)**. Incluye pantalla de acceso con composición 3D interactiva, fondo generativo WebGL en ondas con nodos luminosos, panel de administración con métricas en tiempo real, formularios completos de **Crear Evento** y **Crear Usuario**, gestión de checkpoints y visor integrado de documentación Markdown.

---

## Tabla de contenidos

1. [Características principales](#características-principales)
2. [Identidad visual y diseño](#identidad-visual-y-diseño)
3. [Tecnologías y dependencias](#tecnologías-y-dependencias)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Vistas y funcionalidades](#vistas-y-funcionalidades)
6. [Modelos de datos](#modelos-de-datos)
7. [Instalación y ejecución](#instalación-y-ejecución)
8. [Acceso de prueba](#acceso-de-prueba)
9. [Documentación integrada](#documentación-integrada)
10. [Notas de arquitectura y alcance](#notas-de-arquitectura-y-alcance)

---

## Características principales

- **Autenticación y cambio de clave**: inicio de sesión con validación en vivo, opción para mostrar/ocultar contraseña y flujo de actualización de clave.
- **Escenario 3D interactivo**: letra **S** metálica central arrastrable en 3D acompañada por cuatro modelos de Bienestar al Aprendiz (guitarra, balón de fútbol, rompecabezas y pesas) con iluminación PBR y parallax al cursor.
- **Fondo generativo WebGL (GLSL)**: campo de ondas con **9,424 nodos luminosos** (`124 × 76`) y **26 cintas de contorno** reactivas al puntero, con pausa automática al abrir modales o cambiar de pestaña y soporte para `prefers-reduced-motion`.
- **Panel de Administración (3 pestañas)**:
  - **Resumen**: indicadores en vivo, actividad reciente inspeccionable, equipo operativo y estado general de la plataforma.
  - **Eventos**: filtros por estado (`Todos`, `Abiertos`, `Cerrados`), búsqueda por evento/sede/operador/checkpoint, apertura/cierre rápido de inscripciones y edición de checkpoints en vivo.
  - **Usuarios**: creación de cuentas con rol, documento, correo, contraseña asignada, tipo de afiliación y centro de formación, más filtros, búsqueda, cambio de rol y estado activo/inactivo.
- **Creación de eventos completa**: horarios de inicio/fin del evento, ventana de apertura/cierre de inscripciones, cupo máximo, acompañantes configurables (hasta 10 o inscripción individual), servicios incluidos (`Hotel`, `Bus`), operador asignado, checkpoints y descripción en **Markdown (GFM)** con vista previa.
- **Visor de documentación integrado**: cajón lateral (`MarkdownDrawer`) con pestañas navegables, vista renderizada / código `.md` y copia rápida al portapapeles.

---

## Identidad visual y diseño

| Elemento | Valor / Estilo |
| :--- | :--- |
| **Fondo principal** | `#014446` (petróleo oscuro) |
| **Iluminación de nodos y acentos** | `#A4CF63` (verde lima luminoso) |
| **Formularios y contenedores** | Vidrio esmerilado translúcido (`bg-[#01282a]/52–68`, `backdrop-blur-xl/2xl`, bordes `border-white/22–25`) |
| **Campos de entrada** | Translúcidos (`bg-[#011d1f]/45`, foco en `#A4CF63`, placeholders blancos legibles) |
| **Botones** | Translúcidos con borde degradado luminoso (`he-cta` / `he-cta-neutral`) y sombra suave para mantener contraste sobre `#014446` |
| **Tipografía** | `Inter` (interfaz) y `JetBrains Mono` (etiquetas técnicas y metadatos) en blanco de alto contraste |

---

## Tecnologías y dependencias

- **React** `19.1.1` + **React DOM** `19.1.1`
- **TypeScript** `~5.8.3`
- **Vite** `^7.1.5`
- **Tailwind CSS** `^4.1.13` (`@tailwindcss/vite`)
- **Three.js** `^0.187.0` (`@types/three`)
- **Lucide React** `^0.542.0`
- **React Markdown** `^10.1.0` + **remark-gfm** `^4.0.1`

---

## Estructura del proyecto

```text
├── index.html                           # Documento base, fuentes Inter/JetBrains Mono y fondo #014446
├── package.json                         # Dependencias y scripts npm
├── vite.config.ts                       # Configuración de Vite + React + Tailwind
├── public/
│   ├── logoSenaNaranja.png              # Favicon e ícono institucional
│   └── models/                          # Modelos 3D (.glb) servidos en tiempo de ejecución
│       ├── letter-s.glb
│       ├── guitar.glb
│       ├── soccer-ball.glb
│       ├── puzzle.glb
│       └── gym-weights.glb
└── src/
    ├── main.tsx                         # Punto de entrada de React
    ├── App.tsx                          # Estado global (sesión, eventos, usuarios, modales)
    ├── index.css                        # Variables CSS, botones translúcidos (.he-cta), estilos Markdown
    ├── types/
    │   └── auth.ts                      # Interfaces TypeScript (SenaEvent, AdminUser, UserProfile, etc.)
    ├── components/
    │   ├── Header.tsx                   # Barra flotante de navegación y cierre de sesión
    │   ├── LoginCard.tsx                # Login y cambio de contraseña + escenario 3D
    │   ├── LetterS3D.tsx                # Composición Three.js con letra S y objetos de Bienestar
    │   ├── CloudPatternsBackground.tsx  # Campo WebGL de ondas con nodos iluminados en #A4CF63
    │   ├── AmbientSectionParticles.tsx  # Partículas 2D Canvas acotadas con zona tranquila (quietZone)
    │   ├── AdminDashboard.tsx           # Panel completo: Resumen, Eventos y Usuarios (+ Crear Usuario)
    │   ├── CreateEventModal.tsx         # Modal Crear Evento con validaciones y vista previa Markdown
    │   ├── MarkdownDrawer.tsx           # Cajón lateral de documentación Markdown (Vista / .md)
    │   └── FooterStrip.tsx              # Pie de página con acceso a Guía y Privacidad
    └── content/
        ├── index.ts                     # Registro de documentos Markdown
        ├── guia-acceso.md               # Guía de ingreso y operación del panel
        ├── patterns-three.md            # Documentación técnica del motor visual 3D/GLSL
        ├── novedades.md                 # Registro de funcionalidades de la versión actual
        └── terminos.md                  # Pautas de uso y tratamiento de datos
```

---

## Vistas y funcionalidades

### 1. Pantalla de ingreso (`LoginCard.tsx`)
- **Iniciar sesión**:
  - `Correo electrónico`: validación de formato en tiempo real.
  - `Contraseña`: mínimo 6 caracteres, con botón para mostrar/ocultar.
- **Cambiar contraseña**:
  - `Correo electrónico`, `Nueva contraseña` (mínimo 6 caracteres) y `Confirmar contraseña`.

### 2. Panel de Administración (`AdminDashboard.tsx`)
- **01 / Resumen**:
  - Encabezado con bienvenida personalizada, botones `Crear evento` y `Ver todos`.
  - Métricas interactivas: total de eventos y barra de inscripciones abiertas, total de usuarios (operadores/administradores/activos) y total/promedio de checkpoints.
  - Listado de últimos 5 eventos con despliegue (`INSPECCIONAR`) de fechas, cupo, acompañantes, servicios (`Hotel`, `Bus`), descripción Markdown y checkpoints.
- **02 / Eventos**:
  - Filtros (`Todos`, `Abiertos`, `Cerrados`) y buscador por título, sede, operador o checkpoint.
  - Cambio directo entre `Abierto` / `Cerrado`, eliminación de evento y panel expandible para añadir o quitar checkpoints en vivo.
- **03 / Usuarios y formulario `Crear Usuario`**:
  - Campos implementados:
    1. **Rol**: `Operador` (por defecto) o `Administrador`.
    2. **Nombre completo**: obligatorio (mínimo 3 caracteres).
    3. **Documento**: número de documento obligatorio (mínimo 5 caracteres).
    4. **Correo**: obligatorio, formato válido y único (ej. `correo@sena.gov.co`).
    5. **Contraseña (la asigna el Administrador)**: obligatoria (mínimo 8 caracteres), con control para mostrar/ocultar.
    6. **Tipo de afiliación**: `SENA` o `Externo`.
    7. **Centro de formación**: opcional para `Operador` (personal SENA o externo); requerido para `Administrador` con afiliación `SENA`.
  - Directorio con filtros por rol, búsqueda por nombre/documento/correo/afiliación/centro, cambio de rol (protegiendo siempre al último administrador), activación/desactivación y eliminación.

### 3. Modal `Crear Evento` (`CreateEventModal.tsx`)
Campos implementados y validados:
1. **Nombre del evento**: obligatorio (mínimo 3 caracteres, ej. `Ej. Día de Integración`).
2. **Descripción (opcional)**: editor de texto/Markdown con pestañas `.md` y `Vista`.
3. **Lugar**: obligatorio (mínimo 2 caracteres, ej. `Ej. Centro Agropecuario de Caldas`).
4. **Inicio del evento** y **Fin del evento**: selectores `datetime-local` con validación cronológica (`fin >= inicio`).
5. **Inscripciones abren** e **Inscripciones cierran**: selectores `datetime-local` con validación cronológica (`cierre >= apertura`).
6. **Cupo máximo (personas totales)**: numérico entero (`min = 1`).
7. **¿Permite acompañantes?**: radio (`Sí` / `No, el evento es de inscripción individual`).
8. **Máximo de acompañantes por inscripción**: numérico entero entre `1` y `10` (valor inicial `3`; se deshabilita automáticamente cuando el evento es individual).
9. **Servicios logísticos**: casillas `Incluye hotel` e `Incluye bus`.
10. **Operación**: `Operador asignado`, estado inicial de inscripciones (`Abiertas` / `Cerradas`) y lista configurable de **Checkpoints**.

---

## Modelos de datos

Definidos en [`src/types/auth.ts`](src/types/auth.ts):

```ts
export type UserRole = 'Administrador' | 'Operador';
export type AffiliationType = 'SENA' | 'Externo';

export interface AdminUser {
  id: string;
  name: string;
  document: string;
  email: string;
  password?: string;
  role: UserRole;
  affiliationType: AffiliationType;
  trainingCenter?: string;
  active: boolean;
}

export interface SenaEvent {
  id: string;
  title: string;
  date: string;
  startDateTime: string;
  endDateTime: string;
  registrationStartDateTime: string;
  registrationEndDateTime: string;
  location: string;
  maxCapacity: number;
  allowCompanions: boolean;
  maxCompanions: number;
  includesHotel: boolean;
  includesBus: boolean;
  descriptionMd: string;
  operatorId: string;
  registrationOpen: boolean;
  checkpoints: EventCheckpoint[];
  createdAt: string;
}
```

---

## Instalación y ejecución

Requisitos: **Node.js 18+** y **npm**.

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar entorno de desarrollo
npm run dev

# 3. Validar TypeScript y compilar producción
npm run build

# 4. Previsualizar la compilación de producción
npm run preview
```

---

## Acceso de prueba

Para ingresar al panel de administración desde la pantalla de login puedes usar cualquier correo con formato válido y una contraseña de al menos 6 caracteres, por ejemplo:

| Campo | Valor sugerido |
| :--- | :--- |
| **Correo electrónico** | `admin@soy.sena.edu.co` |
| **Contraseña** | `Sena2026*` |

Usuarios precargados inicialmente en el panel:
- **Administrador del Sistema** — `admin@soy.sena.edu.co` · Doc. `1000000001` · `SENA` · Centro Agropecuario de Caldas
- **Operador Bienestar** — `operador@soy.sena.edu.co` · Doc. `1000000002` · `SENA` · Centro Agropecuario de Caldas

---

## Documentación integrada

La aplicación incluye un visor Markdown accesible desde el pie de página (`GUÍA .MD` y `PRIVACIDAD`) conectado a los archivos de [`src/content/`](src/content/):

- [`guia-acceso.md`](src/content/guia-acceso.md): guía paso a paso de ingreso, creación de eventos y administración de usuarios.
- [`patterns-three.md`](src/content/patterns-three.md): descripción técnica del fondo WebGL, nodos `#A4CF63`, partículas y escena 3D.
- [`novedades.md`](src/content/novedades.md): resumen de funcionalidades e hitos de la interfaz actual.
- [`terminos.md`](src/content/terminos.md): lineamientos de seguridad, privacidad y soporte institucional.

---

## Notas de arquitectura y alcance

- **Estado en cliente**: actualmente la sesión, los eventos y las cuentas se administran en memoria con estado local de React (`App.tsx`). Al recargar la página se restauran los valores iniciales.
- **Preparado para integración API**: los tipos `SenaEvent` y `AdminUser` y las validaciones de ambos formularios están estructurados para conectarse directamente a endpoints REST de backend (`/admin/eventos/nuevo`, `/admin/cuentas/nuevo`, autenticación, etc.).
- **Rendimiento y accesibilidad**: las animaciones WebGL y Canvas se pausan automáticamente cuando un modal está abierto, cuando la pestaña pierde foco o cuando el sistema operativo activa `prefers-reduced-motion`.
