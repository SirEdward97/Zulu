/** Pie de página editorial minimalista   */
export function FooterStrip() {
  return (
    <footer className="w-full border-t border-white/18 bg-[#012a2c]/55 py-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <img
            src="/logoSenaNaranja.png"
            alt="Logo SENA"
            className="h-4 w-auto object-contain opacity-85"
          />
          <span className="he-meta text-white/90">
            EVENTOS SENA · BIENESTAR AL APRENDIZ
          </span>
        </div>

        <span className="he-meta text-white/75">2026</span>
      </div>
    </footer>
  );
}
