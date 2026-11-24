import logoSena from '../assets/logoSenaNaranja.png';
import type { MarkdownDocId } from '../types/auth';

interface FooterStripProps {
  onOpenDoc: (docId: MarkdownDocId) => void;
}

/** Minimal editorial hairline footer aligned to the 1320px agency grid */
export function FooterStrip({ onOpenDoc }: FooterStripProps) {
  return (
    <footer className="w-full border-t border-white/18 bg-[#012a2c]/55 py-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <img
            src={logoSena}
            alt="Logo SENA"
            className="h-4 w-auto object-contain opacity-85"
          />
          <span className="he-meta text-white/90">
            EVENTOS SENA · BIENESTAR AL APRENDIZ
          </span>
        </div>

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => onOpenDoc('guia')}
            className="he-meta text-white/85 transition-colors hover:text-white cursor-pointer"
          >
            GUÍA .MD
          </button>
          <button
            type="button"
            onClick={() => onOpenDoc('terminos')}
            className="he-meta text-white/85 transition-colors hover:text-white cursor-pointer"
          >
            PRIVACIDAD
          </button>
          <span className="he-meta hidden text-white/75 sm:inline">2026</span>
        </div>
      </div>
    </footer>
  );
}
