import guiaAccesoRaw from './guia-acceso.md?raw';
import novedadesRaw from './novedades.md?raw';
import patternsThreeRaw from './patterns-three.md?raw';
import terminosRaw from './terminos.md?raw';
import type { MarkdownDocId, MarkdownDocument } from '../types/auth';

export const MARKDOWN_DOCS: Record<MarkdownDocId, MarkdownDocument> = {
  guia: {
    id: 'guia',
    title: 'Guía de acceso',
    filename: 'guia-acceso.md',
    summary: 'Cómo ingresar y operar el panel de eventos y usuarios.',
    content: guiaAccesoRaw,
  },
  patterns: {
    id: 'patterns',
    title: 'Patterns Three',
    filename: 'patterns-three.md',
    summary: 'Fondo 3D generativo en #014446 con nodos luminosos #A4CF63.',
    content: patternsThreeRaw,
  },
  novedades: {
    id: 'novedades',
    title: 'Novedades',
    filename: 'novedades.md',
    summary: 'Funcionalidades actuales de eventos, usuarios e interfaz.',
    content: novedadesRaw,
  },
  terminos: {
    id: 'terminos',
    title: 'Privacidad',
    filename: 'terminos.md',
    summary: 'Privacidad, credenciales y pautas de uso institucional.',
    content: terminosRaw,
  },
};

export const MARKDOWN_DOC_LIST: MarkdownDocument[] = [
  MARKDOWN_DOCS.guia,
  MARKDOWN_DOCS.patterns,
  MARKDOWN_DOCS.novedades,
  MARKDOWN_DOCS.terminos,
];
