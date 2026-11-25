import { ChevronRight } from 'lucide-react';
import type { AdminTab, AuthMode, UserProfile } from '../types/auth';

interface HeaderProps {
  onSelectAuthMode: (mode: AuthMode) => void;
  user: UserProfile | null;
  activeAdminTab: AdminTab;
  onSelectAdminTab: (tab: AdminTab) => void;
  onLogout: () => void;
  onFocusLogin: () => void;
}

/**
 * Encabezado flotante centrado con efecto de vidrio esmerilado:
 * - En el login (!user): barra compacta centrada con logo SENA y Eventos SENA.
 * - Autenticado (user): [Logo SENA]  [Resumen · Eventos · Usuarios]  [Cerrar sesión [›]]
 */
export function Header({
  onSelectAuthMode,
  user,
  activeAdminTab,
  onSelectAdminTab,
  onLogout,
  onFocusLogin,
}: HeaderProps) {
  const adminLinks: { id: AdminTab; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'eventos', label: 'Eventos' },
    { id: 'usuarios', label: 'Usuarios' },
  ];

  function handleBrandClick() {
    if (user) {
      onSelectAdminTab('resumen');
    } else {
      onSelectAuthMode('login');
      onFocusLogin();
    }
  }

  return (
    <header className="sticky top-0 z-40 flex w-full justify-center px-3 pt-4 pb-2 sm:px-4 sm:pt-5">
      <div
        className={`relative inline-flex max-w-full items-center rounded-[14px] border border-white/25 bg-[#01282a]/50 shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${
          user
            ? 'gap-3.5 p-[6px] pl-[14px] sm:gap-6 sm:pl-[18px]'
            : 'gap-3 px-[18px] py-[10px]'
        }`}
      >
        {/* Borde superior especular sutil del efecto vidrio */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
        />

        {/* Izquierda: marca y logo SENA */}
        <button
          type="button"
          onClick={handleBrandClick}
          aria-label="Eventos SENA"
          className="flex shrink-0 items-center gap-2.5 rounded-lg transition-opacity duration-150 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00af00]/60 cursor-pointer"
        >
          <img
            src="/logoSenaNaranja.png"
            alt="Logo SENA"
            className="h-[26px] w-auto object-contain sm:h-[28px]"
          />
          {!user && (
            <span className="text-[14px] font-bold tracking-[-0.015em] text-white">
              Eventos SENA
            </span>
          )}
        </button>

        {/* Navegación del panel de administración y cierre de sesión  */}
        {user && (
          <>
            <nav
              aria-label="Navegación principal"
              className="flex items-center gap-3.5 sm:gap-6"
            >
              {adminLinks.map((link) => {
                const isActive = activeAdminTab === link.id;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => onSelectAdminTab(link.id)}
                    className={`relative py-1 text-[13px] font-bold tracking-[-0.01em] transition-colors duration-150 sm:text-[13.5px] cursor-pointer ${
                      isActive
                        ? 'text-white'
                        : 'text-white/85 hover:text-white'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-[#A4CF63]"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-[38px] shrink-0 items-center gap-2.5 rounded-[10px] border border-white/25 bg-[#012022]/55 pl-3.5 pr-2 text-[13px] font-bold tracking-[-0.01em] text-white backdrop-blur-md transition-all duration-150 hover:border-white/40 hover:bg-white/15 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A4CF63]/70 sm:pl-4 sm:pr-2.5 sm:text-[13.5px] cursor-pointer"
            >
              <span>Cerrar sesión</span>
              <span
                aria-hidden="true"
                className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-white/15 text-[#A4CF63]"
              >
                <ChevronRight className="h-[13px] w-[13px]" strokeWidth={2.5} />
              </span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
