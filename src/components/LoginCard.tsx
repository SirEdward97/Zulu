import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { AmbientSectionParticles } from './AmbientSectionParticles';
import { LetterS3D } from './LetterS3D';
import type { AuthMode, UserProfile } from '../types/auth';

interface LoginCardProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated: (user: UserProfile) => void;
  focusSignal: number;
  paused?: boolean;
}

export function LoginCard({
  mode,
  onModeChange,
  onAuthenticated,
  focusSignal,
  paused = false,
}: LoginCardProps) {
  const heroSectionRef = useRef<HTMLElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusSignal > 0) {
      emailInputRef.current?.focus();
    }
  }, [focusSignal]);

  useEffect(() => {
    setError(null);
    setPasswordUpdated(false);
    setShowPassword(false);
  }, [mode]);

  const isEmailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email],
  );
  const isPasswordValid = password.trim().length >= 6;

  function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isEmailValid) {
      setError('Ingresa un correo electrónico institucional válido.');
      return;
    }

    if (!isPasswordValid) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      const cleaned = email.trim();
      const lower = cleaned.toLowerCase();
      const isDefaultAdmin =
        lower === 'admin@soy.sena.edu.co' ||
        lower === 'aprendiz@soy.sena.edu.co' ||
        lower.startsWith('admin@');

      const rawName = cleaned
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      onAuthenticated({
        name: isDefaultAdmin
          ? 'Administrador del Sistema'
          : rawName || 'Administrador del Sistema',
        email: cleaned,
        role: 'Administrador',
        program: 'Bienestar al Aprendiz',
      });
      setSubmitting(false);
    }, 420);
  }

  function handleChangePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setError('Ingresa tu correo electrónico institucional.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setPasswordUpdated(true);
      setEmail(resetEmail.trim());
    }, 450);
  }

  return (
    <div className="mx-auto w-full max-w-[820px] px-[16px] sm:px-[10px]">
      {/* Bounded centered section: 3D Metallic Letter S + 4 Bienestar objects -> Headline -> Frosted Glass Login */}
      <section
        ref={heroSectionRef}
        className="animate-fade-up relative flex flex-col items-center overflow-hidden rounded-[24px] pt-2 pb-[76px] text-center sm:pt-4"
      >
        <AmbientSectionParticles
          sectionRef={heroSectionRef}
          paused={paused}
          quietZone={{ x: 0.16, y: 0.42, width: 0.68, height: 0.54 }}
        />

        <div className="relative z-10 flex w-full flex-col items-center">
          {/* Interactive 3D Metallic Letter "S" + 4 smaller Bienestar objects */}
          <LetterS3D paused={paused} />

          {/* Opening Headline */}
          <div className="mt-2 max-w-[603px]">
            <h1 className="km-metallic text-[38px] font-bold leading-none tracking-[-0.0109em] sm:text-[46px]">
              {mode === 'login' ? 'Bienvenido.' : 'Cambiar contraseña.'}
            </h1>
            <p className="mt-3.5 text-[16px] font-bold leading-[1.3] text-white/95 sm:text-[18px]">
              {mode === 'login'
                ? 'Inicia sesión con tu cuenta de Bienestar al Aprendiz.'
                : 'Actualiza la clave de acceso de tu cuenta institucional.'}
            </p>
          </div>

          {/* Frosted Glass Login Dock matching the Header style */}
          <div className="relative mt-7 w-full max-w-[448px] rounded-[18px] border border-white/25 bg-[#01282a]/52 p-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:p-7">
            {/* Subtle top glass specular edge matching the Header */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
            />

            {mode === 'change-password' && (
              <button
                type="button"
                onClick={() => onModeChange('login')}
                className="mb-5 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-white/90 transition-colors duration-150 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al ingreso
              </button>
            )}

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-[11px] border border-[#A4CF63]/55 bg-[#011f21]/70 px-4 py-3 text-[13px] font-bold text-white backdrop-blur-md"
              >
                {error}
              </div>
            )}

            {/* LOGIN FORM (Solo ingreso) */}
            {mode === 'login' && (
              <form
                onSubmit={handleLoginSubmit}
                className="space-y-4"
                noValidate
              >
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-2 block text-[13px] font-bold tracking-[-0.01em] text-white"
                  >
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <input
                      ref={emailInputRef}
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@soy.sena.edu.co"
                      className="h-[46px] w-full rounded-[11px] border border-white/25 bg-[#011e20]/45 px-3.5 pr-11 text-[14px] font-bold text-white placeholder:text-white/55 backdrop-blur-md transition-all duration-150 focus:border-[#A4CF63] focus:bg-[#011e20]/68 focus:outline-none focus:ring-2 focus:ring-[#A4CF63]/25"
                    />
                    {isEmailValid && (
                      <span
                        aria-label="Correo válido"
                        className="absolute right-3 top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-[6px] bg-[#A4CF63]/25 text-[#A4CF63]"
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-2 block text-[13px] font-bold tracking-[-0.01em] text-white"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-[46px] w-full rounded-[11px] border border-white/25 bg-[#011e20]/45 px-3.5 pr-11 text-[14px] font-bold text-white placeholder:text-white/55 backdrop-blur-md transition-all duration-150 focus:border-[#A4CF63] focus:bg-[#011e20]/68 focus:outline-none focus:ring-2 focus:ring-[#A4CF63]/25"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[7px] text-white/80 transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Primary Submit Button echoing the Header's inset badge button */}
                <div className="pt-1.5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-[46px] w-full items-center justify-center gap-2.5 rounded-[11px] border border-white/35 bg-[#00af00]/78 px-4 text-[14px] font-bold tracking-[-0.01em] text-white shadow-[0_10px_28px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-150 hover:border-white/50 hover:bg-[#00af00]/92 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-65 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Ingresando...
                      </>
                    ) : (
                      <>
                        <span>Iniciar sesión</span>
                        <span
                          aria-hidden="true"
                          className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-black/22 text-white"
                        >
                          <ChevronRight
                            className="h-[13px] w-[13px]"
                            strokeWidth={2.5}
                          />
                        </span>
                      </>
                    )}
                  </button>
                </div>

                <div className="py-1">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                </div>

                {/* Secondary Action matching the Header's dark translucent inset button */}
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    onModeChange('change-password');
                  }}
                  className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[10px] border border-white/28 bg-[#011f21]/48 px-4 text-[13.5px] font-bold tracking-[-0.01em] text-white backdrop-blur-md transition-all duration-150 hover:border-white/45 hover:bg-white/15 hover:text-white active:scale-[0.985] cursor-pointer"
                >
                  Cambiar contraseña
                </button>
              </form>
            )}

            {/* CHANGE PASSWORD FORM */}
            {mode === 'change-password' &&
              (passwordUpdated ? (
                <div className="rounded-[12px] border border-white/22 bg-[#011e20]/55 p-5 text-center backdrop-blur-md">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-[#A4CF63]" />
                  <p className="mt-3 text-[17px] font-bold text-white">
                    Contraseña actualizada.
                  </p>
                  <p className="mt-1.5 text-[13.5px] font-bold text-white/85">
                    Ya puedes ingresar con tu nueva clave para{' '}
                    <span className="text-white">{resetEmail}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => onModeChange('login')}
                    className="mt-5 inline-flex h-[42px] items-center justify-center gap-2 rounded-[10px] border border-white/35 bg-[#00af00]/78 px-5 text-[13.5px] font-bold text-white backdrop-blur-md transition-all hover:border-white/50 hover:bg-[#00af00]/92 cursor-pointer"
                  >
                    <span>Ir a iniciar sesión</span>
                    <span
                      aria-hidden="true"
                      className="flex h-[20px] w-[20px] items-center justify-center rounded-[6px] bg-black/22 text-white"
                    >
                      <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleChangePasswordSubmit}
                  className="space-y-4"
                  noValidate
                >
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="mb-2 block text-[13px] font-bold text-white"
                    >
                      Correo electrónico
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="correo@soy.sena.edu.co"
                      className="h-[46px] w-full rounded-[11px] border border-white/25 bg-[#011e20]/45 px-3.5 text-[14px] font-bold text-white placeholder:text-white/55 backdrop-blur-md transition-all focus:border-[#A4CF63] focus:bg-[#011e20]/68 focus:outline-none focus:ring-2 focus:ring-[#A4CF63]/25"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-[13px] font-bold text-white"
                    >
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="h-[46px] w-full rounded-[11px] border border-white/25 bg-[#011e20]/45 px-3.5 pr-11 text-[14px] font-bold text-white placeholder:text-white/55 backdrop-blur-md transition-all focus:border-[#A4CF63] focus:bg-[#011e20]/68 focus:outline-none focus:ring-2 focus:ring-[#A4CF63]/25"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                        className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[7px] text-white/80 hover:bg-white/15 hover:text-white cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-[13px] font-bold text-white"
                    >
                      Confirmar contraseña
                    </label>
                    <input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu nueva contraseña"
                      className="h-[46px] w-full rounded-[11px] border border-white/25 bg-[#011e20]/45 px-3.5 text-[14px] font-bold text-white placeholder:text-white/55 backdrop-blur-md transition-all focus:border-[#A4CF63] focus:bg-[#011e20]/68 focus:outline-none focus:ring-2 focus:ring-[#A4CF63]/25"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-1 flex h-[46px] w-full items-center justify-center gap-2.5 rounded-[11px] border border-white/35 bg-[#00af00]/78 px-4 text-[14px] font-bold text-white shadow-[0_10px_28px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all hover:border-white/50 hover:bg-[#00af00]/92 disabled:opacity-65 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <span>Guardar nueva contraseña</span>
                        <span
                          aria-hidden="true"
                          className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-black/22 text-white"
                        >
                          <ChevronRight
                            className="h-[13px] w-[13px]"
                            strokeWidth={2.5}
                          />
                        </span>
                      </>
                    )}
                  </button>
                </form>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
