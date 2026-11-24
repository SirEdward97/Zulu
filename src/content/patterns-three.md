# Patterns Three · Motor Visual 3D y Nodos Luminosos

**Patterns Three** impulsa la identidad visual interactiva de **Eventos SENA — Bienestar al Aprendiz**, combinando gráficos WebGL en tiempo real, partículas 2D acotadas y modelos 3D PBR.

## Paleta y atmósfera visual

- **Lienzo base**: petróleo oscuro `#014446` con resplandor inferior suave hacia `#A4CF63`.
- **Nodos iluminados**: brillo radial y núcleo luminoso en `#A4CF63` con mezcla aditiva (`AdditiveBlending`).
- **Interfaz translúcida**: formularios, tarjetas y botones en vidrio esmerilado (`backdrop-blur`) con bordes claros y tipografía blanca de alto contraste.

## Capas gráficas implementadas

1. **Campo de ondas 3D (`CloudPatternsBackground.tsx`)**:
   - **9,424 nodos luminosos** (`124 × 76`) y **26 cintas de contorno** sincronizadas por shaders GLSL personalizados.
   - Ondulación continua y elevación suave al desplazar el cursor sobre la pantalla.
2. **Escenario 3D de Bienestar (`LetterS3D.tsx`)**:
   - Letra **S** metálica central interactiva (arrastrable en 3D) rodeada por cuatro modelos `.glb` (guitarra, balón, rompecabezas y pesas) con iluminación de estudio (`RoomEnvironment`) y reflejo lateral `#A4CF63`.
3. **Partículas ambientales (`AmbientSectionParticles.tsx`)**:
   - Canvas 2D acotado por sección con zona de baja densidad (`quietZone`) detrás de los formularios y resplandor en `#A4CF63`.

## Optimización y accesibilidad

- Pausa automática cuando se abre un modal, al ocultar la pestaña del navegador o cuando la sección sale del viewport (`IntersectionObserver`).
- Respeto estricto de la preferencia del sistema `prefers-reduced-motion: reduce`.
