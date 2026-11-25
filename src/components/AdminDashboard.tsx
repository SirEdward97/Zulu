import { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bus,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Hotel,
  MapPin,
  Plus,
  QrCode,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { AmbientSectionParticles } from './AmbientSectionParticles';
import type {
  AdminTab,
  AdminUser,
  AffiliationType,
  SenaEvent,
  UserProfile,
  UserRole,
} from '../types/auth';

interface AdminDashboardProps {
  user: UserProfile;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  events: SenaEvent[];
  users: AdminUser[];
  onOpenCreateEvent: () => void;
  onToggleEventRegistration: (eventId: string) => void;
  onAddCheckpoint: (eventId: string, name: string) => void;
  onRemoveCheckpoint: (eventId: string, checkpointId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddUser: (newUser: AdminUser) => void;
  onToggleUserRole: (userId: string) => void;
  onToggleUserActive: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  paused?: boolean;
}

type EventFilter = 'todos' | 'abiertos' | 'cerrados';
type RoleFilter = 'todos' | 'Administrador' | 'Operador';

function formatDateTime(value: string): string {
  if (!value) return 'Sin definir';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

export function AdminDashboard({
  user,
  activeTab,
  onTabChange,
  events,
  users,
  onOpenCreateEvent,
  onToggleEventRegistration,
  onAddCheckpoint,
  onRemoveCheckpoint,
  onDeleteEvent,
  onAddUser,
  onToggleUserRole,
  onToggleUserActive,
  onDeleteUser,
  paused = false,
}: AdminDashboardProps) {
  const resumenHeroRef = useRef<HTMLElement>(null);

  // Estado de la pestaña de eventos
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<EventFilter>('todos');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [inlineCheckpointDraft, setInlineCheckpointDraft] = useState<
    Record<string, string>
  >({});

  // Estado de la pestaña de usuarios
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('todos');
  const [userSearch, setUserSearch] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserRole, setNewUserRole] = useState<UserRole>('Operador');
  const [newUserName, setNewUserName] = useState('');
  const [newUserDocument, setNewUserDocument] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUserAffiliation, setNewUserAffiliation] =
    useState<AffiliationType>('SENA');
  const [newUserTrainingCenter, setNewUserTrainingCenter] = useState('');
  const [userError, setUserError] = useState<string | null>(null);

  const openEventsCount = useMemo(
    () => events.filter((ev) => ev.registrationOpen).length,
    [events],
  );
  const closedEventsCount = events.length - openEventsCount;

  const operatorCount = useMemo(
    () => users.filter((u) => u.role === 'Operador').length,
    [users],
  );
  const adminCount = useMemo(
    () => users.filter((u) => u.role === 'Administrador').length,
    [users],
  );
  const activeUsersCount = useMemo(
    () => users.filter((u) => u.active).length,
    [users],
  );

  const totalCheckpoints = useMemo(
    () => events.reduce((acc, ev) => acc + ev.checkpoints.length, 0),
    [events],
  );
  const avgCheckpoints =
    events.length > 0 ? (totalCheckpoints / events.length).toFixed(1) : '0.0';

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter((ev) => {
      if (eventFilter === 'abiertos' && !ev.registrationOpen) return false;
      if (eventFilter === 'cerrados' && ev.registrationOpen) return false;
      if (!q) return true;
      const opName =
        users.find((u) => u.id === ev.operatorId)?.name.toLowerCase() ?? '';
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q) ||
        opName.includes(q) ||
        ev.checkpoints.some((cp) => cp.name.toLowerCase().includes(q))
      );
    });
  }, [events, eventFilter, searchQuery, users]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'todos' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.document.toLowerCase().includes(q) ||
        u.affiliationType.toLowerCase().includes(q) ||
        (u.trainingCenter?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [users, roleFilter, userSearch]);

  function getOperatorName(operatorId: string): string {
    return users.find((u) => u.id === operatorId)?.name ?? 'Sin asignar';
  }

  function getAssignedEventCount(userId: string): number {
    return events.filter((ev) => ev.operatorId === userId).length;
  }

  function handleInlineAddCheckpoint(eventId: string) {
    const raw = (inlineCheckpointDraft[eventId] ?? '').trim();
    if (!raw) return;
    onAddCheckpoint(eventId, raw);
    setInlineCheckpointDraft((prev) => ({ ...prev, [eventId]: '' }));
  }

  function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUserError(null);

    if (newUserName.trim().length < 3) {
      setUserError('Escribe el nombre completo del usuario.');
      return;
    }
    if (newUserDocument.trim().length < 5) {
      setUserError('Ingresa un número de documento válido.');
      return;
    }
    const cleanedEmail = newUserEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      setUserError('Ingresa un correo electrónico válido.');
      return;
    }
    if (
      users.some((u) => u.email.toLowerCase() === cleanedEmail.toLowerCase())
    ) {
      setUserError('Ya existe un usuario registrado con ese correo.');
      return;
    }
    if (newUserPassword.length < 8) {
      setUserError('La contraseña debe tener mínimo 8 caracteres.');
      return;
    }
    if (
      newUserRole === 'Administrador' &&
      newUserAffiliation === 'SENA' &&
      newUserTrainingCenter.trim().length === 0
    ) {
      setUserError('Escribe el nombre del centro de formación.');
      return;
    }

    onAddUser({
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      document: newUserDocument.trim(),
      email: cleanedEmail,
      password: newUserPassword,
      role: newUserRole,
      affiliationType: newUserAffiliation,
      trainingCenter: newUserTrainingCenter.trim() || undefined,
      active: true,
    });

    setNewUserRole('Operador');
    setNewUserName('');
    setNewUserDocument('');
    setNewUserEmail('');
    setNewUserPassword('');
    setShowNewUserPassword(false);
    setNewUserAffiliation('SENA');
    setNewUserTrainingCenter('');
    setShowAddUser(false);
  }

  const sectionIndexLabel =
    activeTab === 'resumen'
      ? '01 / RESUMEN'
      : activeTab === 'eventos'
        ? '02 / DIRECTORIO DE EVENTOS'
        : '03 / EQUIPO Y PERMISOS';

  return (
    <main className="mx-auto min-h-[calc(100vh-124px)] w-full max-w-[1320px] px-5 pb-20 sm:px-10">
      {/* Barra superior compartida de metadatos */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-white/18 py-3">
        <span className="he-meta text-white">{sectionIndexLabel}</span>
        <span className="he-meta hidden text-white/90 md:inline">
          PANEL DE ADMINISTRACIÓN · BIENESTAR AL APRENDIZ
        </span>
        <span className="he-meta inline-flex items-center gap-2 text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-[#A4CF63]" />
          {user.email}
        </span>
      </div>

      {/* ==================== PESTAÑA 1: RESUMEN ==================== */}
      {activeTab === 'resumen' && (
        <div className="animate-fade-up">
          {/* Encabezado asimétrico editorial de 12 columnas */}
          <section
            ref={resumenHeroRef}
            className="relative overflow-hidden py-10 sm:py-14"
          >
            <AmbientSectionParticles
              sectionRef={resumenHeroRef}
              paused={paused}
              config={{ count: 32, size: [3, 9], opacity: [0.14, 0.4] }}
              quietZone={{ x: 0.02, y: 0.1, width: 0.96, height: 0.8 }}
            />

            <div className="relative z-10 grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-8">
                <span className="he-meta mb-4 block text-white/90">
                  BIENESTAR AL APRENDIZ · SENA
                </span>
                <h1 className="animate-he-reveal km-metallic text-[42px] font-medium leading-[0.95] tracking-[-0.045em] sm:text-[62px] lg:text-[74px]">
                  Bienvenido,
                  <br />
                  {user.name}.
                </h1>
              </div>

              <div className="flex flex-col justify-end lg:col-span-4 lg:border-l lg:border-white/18 lg:pl-8">
                <span className="he-meta mb-2.5 text-white/90">
                  CONTROL OPERATIVO
                </span>
                <p className="text-[14.5px] leading-relaxed text-white/90">
                  Gestiona los eventos del Bienestar al Aprendiz, sus
                  checkpoints y los operadores asignados desde una sola vista.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onOpenCreateEvent}
                    className="he-cta cursor-pointer"
                  >
                    <span className="he-cta-inner">
                      <Plus className="h-3.5 w-3.5 text-[#A4CF63]" />
                      Crear evento
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onTabChange('eventos')}
                    className="he-cta-neutral cursor-pointer"
                  >
                    <span className="he-cta-neutral-inner">
                      Ver todos
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Franja arquitectónica de métricas en 3 columnas */}
          <section
            aria-label="Indicadores generales"
            className="grid grid-cols-1 border-y border-white/18 md:grid-cols-3 md:divide-x md:divide-white/18"
          >
            {/* Métrica 01 */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onTabChange('eventos')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onTabChange('eventos');
              }}
              className="group flex flex-col justify-between border-b border-white/18 py-7 transition-colors hover:bg-white/[0.06] md:border-b-0 md:pr-8 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="he-meta text-white/90">
                  01 / EVENTOS RECIENTES
                </span>
                <ArrowUpRight className="h-4 w-4 text-white/80 transition-colors group-hover:text-[#A4CF63]" />
              </div>
              <div className="mt-6 flex items-baseline justify-between gap-4">
                <span className="text-[56px] font-medium leading-none tracking-[-0.04em] tabular-nums text-white">
                  {events.length}
                </span>
                <span className="text-right text-[13px] text-white/90">
                  {openEventsCount} con inscripciones abiertas
                </span>
              </div>
              <div className="mt-5 h-[2px] w-full overflow-hidden bg-white/18">
                <div
                  className="h-full bg-[#A4CF63] transition-all duration-300"
                  style={{
                    width:
                      events.length > 0
                        ? `${Math.round((openEventsCount / events.length) * 100)}%`
                        : '0%',
                  }}
                />
              </div>
            </div>

            {/* Métrica 02 */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onTabChange('usuarios')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onTabChange('usuarios');
              }}
              className="group flex flex-col justify-between border-b border-white/18 py-7 transition-colors hover:bg-white/[0.06] md:border-b-0 md:px-8 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="he-meta text-white/90">02 / USUARIOS</span>
                <ArrowUpRight className="h-4 w-4 text-white/80 transition-colors group-hover:text-[#A4CF63]" />
              </div>
              <div className="mt-6 flex items-baseline justify-between gap-4">
                <span className="text-[56px] font-medium leading-none tracking-[-0.04em] tabular-nums text-white">
                  {users.length}
                </span>
                <span className="text-right text-[13px] text-white/90">
                  {operatorCount} operadores · {adminCount} administradores
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.12em] text-white/85">
                <span>{activeUsersCount} ACTIVOS</span>
                <span className="text-[#A4CF63]">GESTIONAR →</span>
              </div>
            </div>

            {/* Métrica 03 */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onTabChange('eventos')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onTabChange('eventos');
              }}
              className="group flex flex-col justify-between py-7 transition-colors hover:bg-white/[0.06] md:pl-8 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="he-meta text-white/90">03 / CHECKPOINTS</span>
                <ArrowUpRight className="h-4 w-4 text-white/80 transition-colors group-hover:text-[#A4CF63]" />
              </div>
              <div className="mt-6 flex items-baseline justify-between gap-4">
                <span className="text-[56px] font-medium leading-none tracking-[-0.04em] tabular-nums text-white">
                  {totalCheckpoints}
                </span>
                <span className="text-right text-[13px] text-white/90">
                  Configurados en todos los eventos
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.12em] text-white/85">
                <span>PROMEDIO POR EVENTO</span>
                <span className="text-white">{avgCheckpoints}</span>
              </div>
            </div>
          </section>

          {/* Superficie editorial tonal inferior */}
          <section className="mt-10 rounded-[22px] border border-white/22 bg-[#01282a]/54 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-10">
            <div className="flex flex-col gap-3 border-b border-white/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="he-meta text-white/85">
                  04 / ACTIVIDAD RECIENTE
                </span>
                <h2 className="mt-2 text-[26px] font-medium tracking-[-0.03em] text-white sm:text-[32px]">
                  Eventos recientes.
                </h2>
                <p className="mt-1 text-[14px] text-white/90">
                  Los eventos creados más recientemente en Bienestar al Aprendiz.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onTabChange('eventos')}
                className="he-meta inline-flex items-center gap-1.5 self-start rounded-[9px] border border-white/22 bg-[#011d1f]/45 px-3 py-1.5 text-white backdrop-blur-md transition-colors hover:border-white/45 hover:bg-white/15 sm:self-auto cursor-pointer"
              >
                VER LISTADO COMPLETO
                <ArrowRight className="h-3.5 w-3.5 text-[#A4CF63]" />
              </button>
            </div>

            {events.length === 0 ? (
              <div className="grid grid-cols-1 items-center gap-8 py-12 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <h3 className="text-[24px] font-medium tracking-[-0.025em] text-white">
                    Aún no hay eventos registrados.
                  </h3>
                  <p className="mt-2 max-w-[460px] text-[14.5px] leading-relaxed text-white/90">
                    Crea el primer evento para comenzar a gestionar
                    inscripciones, operadores asignados y checkpoints de
                    asistencia.
                  </p>
                </div>
                <div className="flex lg:col-span-5 lg:justify-end">
                  <button
                    type="button"
                    onClick={onOpenCreateEvent}
                    className="he-cta cursor-pointer"
                  >
                    <span className="he-cta-inner">
                      <Plus className="h-3.5 w-3.5 text-[#A4CF63]" />
                      Crear primer evento
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/15">
                {events.slice(0, 5).map((ev, index) => {
                  const isExpanded = expandedEventId === ev.id;
                  return (
                    <div
                      key={ev.id}
                      className="py-5 transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
                        <div className="md:col-span-1">
                          <span className="he-meta text-white/85">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="md:col-span-5">
                          <h3 className="text-[17px] font-medium tracking-[-0.015em] text-white">
                            {ev.title}
                          </h3>
                          <p className="mt-1 flex flex-wrap items-center gap-3 text-[12.5px] text-white/85">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {ev.date}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {ev.location}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Cupo {ev.maxCapacity}
                            </span>
                            {ev.includesHotel && (
                              <span className="inline-flex items-center gap-1 text-[#A4CF63]">
                                <Hotel className="h-3 w-3" />
                                Hotel
                              </span>
                            )}
                            {ev.includesBus && (
                              <span className="inline-flex items-center gap-1 text-[#A4CF63]">
                                <Bus className="h-3 w-3" />
                                Bus
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="he-meta block text-white/75">
                            OPERADOR
                          </span>
                          <span className="mt-0.5 block text-[13px] text-white">
                            {getOperatorName(ev.operatorId)}
                          </span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.12em]">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                ev.registrationOpen
                                  ? 'bg-[#A4CF63]'
                                  : 'bg-white/50'
                              }`}
                            />
                            <span
                              className={
                                ev.registrationOpen
                                  ? 'text-[#A4CF63]'
                                  : 'text-white/80'
                              }
                            >
                              {ev.registrationOpen ? 'Abierto' : 'Cerrado'}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[12px] text-white/85">
                            {ev.checkpoints.length} checkpoints
                          </span>
                        </div>
                        <div className="flex justify-start md:col-span-2 md:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedEventId(isExpanded ? null : ev.id)
                            }
                            className="he-meta inline-flex items-center gap-1 rounded-[8px] border border-white/25 bg-[#011d1f]/48 px-3 py-1.5 text-white backdrop-blur-md transition-colors hover:border-white/45 hover:bg-white/15 cursor-pointer"
                          >
                            {isExpanded ? 'OCULTAR' : 'INSPECCIONAR'}
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-5 grid grid-cols-1 gap-6 border-t border-white/15 pt-5 lg:grid-cols-12">
                          <div className="space-y-4 lg:col-span-7">
                            <div className="grid grid-cols-1 gap-3 rounded-[12px] border border-white/18 bg-[#011d1f]/42 p-3.5 text-[12.5px] backdrop-blur-md sm:grid-cols-2">
                              <div>
                                <span className="he-meta block text-white/75">
                                  INICIO / FIN DEL EVENTO
                                </span>
                                <span className="mt-1 block text-white">
                                  {formatDateTime(ev.startDateTime)} →{' '}
                                  {formatDateTime(ev.endDateTime)}
                                </span>
                              </div>
                              <div>
                                <span className="he-meta block text-white/75">
                                  VENTANA DE INSCRIPCIONES
                                </span>
                                <span className="mt-1 block text-white">
                                  {formatDateTime(ev.registrationStartDateTime)}{' '}
                                  → {formatDateTime(ev.registrationEndDateTime)}
                                </span>
                              </div>
                              <div>
                                <span className="he-meta block text-white/75">
                                  CUPO Y ACOMPAÑANTES
                                </span>
                                <span className="mt-1 block text-white">
                                  {ev.maxCapacity} personas ·{' '}
                                  {ev.allowCompanions
                                    ? `Hasta ${ev.maxCompanions} acompañantes`
                                    : 'Inscripción individual'}
                                </span>
                              </div>
                              <div>
                                <span className="he-meta block text-white/75">
                                  SERVICIOS INCLUIDOS
                                </span>
                                <span className="mt-1 block text-white">
                                  {[
                                    ev.includesHotel && 'Hotel',
                                    ev.includesBus && 'Bus',
                                  ]
                                    .filter(Boolean)
                                    .join(' · ') || 'Ninguno'}
                                </span>
                              </div>
                            </div>

                            <div>
                              <span className="he-meta mb-2 block text-white/85">
                                DESCRIPCIÓN
                              </span>
                              <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-white/90">
                                {ev.description || 'Sin descripción.'}
                              </p>
                            </div>
                          </div>
                          <div className="lg:col-span-5 lg:border-l lg:border-white/15 lg:pl-6">
                            <span className="he-meta mb-3 block text-white/85">
                              CHECKPOINTS ({ev.checkpoints.length})
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {ev.checkpoints.map((cp, idx) => (
                                <span
                                  key={cp.id}
                                  className="inline-flex items-center gap-1.5 rounded-[8px] border border-white/20 bg-white/[0.08] px-2.5 py-1 text-[12px] text-white"
                                >
                                  <span className="font-mono text-[10.5px] text-[#A4CF63]">
                                    #{String(idx + 1).padStart(2, '0')}
                                  </span>
                                  {cp.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Fila inferior compacta de equipo y estado operativo */}
            <div className="mt-8 grid grid-cols-1 gap-8 border-t border-white/15 pt-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="mb-4 flex items-center justify-between">
                  <span className="he-meta text-white/85">
                    EQUIPO OPERATIVO
                  </span>
                  <button
                    type="button"
                    onClick={() => onTabChange('usuarios')}
                    className="he-meta rounded-[8px] border border-white/22 bg-[#011d1f]/45 px-2.5 py-1 text-white backdrop-blur-md transition-colors hover:border-white/45 hover:bg-white/15 cursor-pointer"
                  >
                    VER USUARIOS →
                  </button>
                </div>
                <div className="divide-y divide-white/15 border-y border-white/15">
                  {users.slice(0, 4).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-3 text-[13.5px]"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-white">
                          {member.name}
                        </span>
                        <span className="ml-2.5 hidden text-[12.5px] text-white/80 sm:inline">
                          {member.email}
                        </span>
                      </div>
                      <span className="he-meta shrink-0 text-white/90">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 lg:border-l lg:border-white/15 lg:pl-8">
                <span className="he-meta mb-4 block text-white/85">
                  ESTADO DE LA PLATAFORMA
                </span>
                <dl className="space-y-3 text-[13.5px]">
                  <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                    <dt className="text-white/90">Inscripciones abiertas</dt>
                    <dd className="font-mono text-white">
                      {openEventsCount} / {events.length}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                    <dt className="text-white/90">Eventos cerrados</dt>
                    <dd className="font-mono text-white">{closedEventsCount}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-white/90">Operadores activos</dt>
                    <dd className="font-mono text-[#A4CF63]">
                      {activeUsersCount} de {users.length}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ==================== PESTAÑA 2: EVENTOS ==================== */}
      {activeTab === 'eventos' && (
        <div className="animate-fade-up">
          {/* Encabezado editorial de 12 columnas */}
          <section className="grid grid-cols-1 items-end gap-8 py-10 sm:py-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="he-meta mb-3 block text-white/90">
                GESTIÓN DE ACTIVIDADES Y CHECKPOINTS
              </span>
              <h1 className="animate-he-reveal km-metallic text-[44px] font-medium leading-[0.95] tracking-[-0.045em] sm:text-[62px]">
                Eventos.
              </h1>
            </div>
            <div className="flex flex-col gap-5 lg:col-span-5 lg:items-end lg:text-right">
              <p className="max-w-[400px] text-[14.5px] leading-relaxed text-white/90">
                Filtra inscripciones, consulta los detalles y agrega o retira
                checkpoints en vivo por cada evento.
              </p>
              <button
                type="button"
                onClick={onOpenCreateEvent}
                className="he-cta self-start lg:self-end cursor-pointer"
              >
                <span className="he-cta-inner">
                  <Plus className="h-3.5 w-3.5 text-[#A4CF63]" />
                  Crear evento
                </span>
              </button>
            </div>
          </section>

          {/* Barra de filtros y búsqueda */}
          <div className="flex flex-col gap-4 border-y border-white/18 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'todos', label: `Todos (${events.length})` },
                  { id: 'abiertos', label: `Abiertos (${openEventsCount})` },
                  { id: 'cerrados', label: `Cerrados (${closedEventsCount})` },
                ] as { id: EventFilter; label: string }[]
              ).map((tab) => {
                const active = eventFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEventFilter(tab.id)}
                    className={`rounded-[8px] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.13em] backdrop-blur-md transition-colors cursor-pointer ${
                      active
                        ? 'border border-[#A4CF63]/75 bg-[#A4CF63]/20 text-white'
                        : 'border border-white/22 bg-[#011d1f]/45 text-white/85 hover:border-white/45 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-[320px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar evento, sede o checkpoint..."
                className="h-[38px] w-full rounded-[9px] border border-white/22 bg-[#011d1f]/48 pl-9 pr-3.5 text-[13px] text-white placeholder:text-white/55 backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/68 focus:outline-none"
              />
            </div>
          </div>

          {/* Directorio editorial en varias columnas */}
          {filteredEvents.length === 0 ? (
            <div className="mt-8 rounded-[20px] border border-white/22 bg-[#01282a]/52 px-6 py-16 text-center shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <span className="he-meta text-white/85">
                SIN REGISTROS EN ESTA VISTA
              </span>
              <h2 className="mt-3 text-[24px] font-medium tracking-[-0.025em] text-white">
                {events.length === 0
                  ? 'Aún no hay eventos creados.'
                  : 'No encontramos coincidencias.'}
              </h2>
              <p className="mx-auto mt-2 max-w-[420px] text-[14px] text-white/90">
                {events.length === 0
                  ? 'Crea el primer evento para habilitar inscripciones, asignar operador y configurar checkpoints.'
                  : 'Ajusta el filtro de estado o prueba con otra palabra clave.'}
              </p>
              {events.length === 0 && (
                <button
                  type="button"
                  onClick={onOpenCreateEvent}
                  className="he-cta mt-6 cursor-pointer"
                >
                  <span className="he-cta-inner">
                    <Plus className="h-3.5 w-3.5 text-[#A4CF63]" />
                    Crear evento
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[20px] border border-white/22 bg-[#01282a]/54 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              {/* Encabezado de columnas para escritorio */}
              <div className="hidden grid-cols-12 border-b border-white/15 px-6 py-3.5 md:grid">
                <span className="he-meta col-span-1 text-white/85">#</span>
                <span className="he-meta col-span-4 text-white/85">
                  EVENTO / SEDE
                </span>
                <span className="he-meta col-span-2 text-white/85">
                  OPERADOR
                </span>
                <span className="he-meta col-span-2 text-white/85">
                  CHECKPOINTS
                </span>
                <span className="he-meta col-span-2 text-white/85">ESTADO</span>
                <span className="he-meta col-span-1 text-right text-white/85">
                  ACCIONES
                </span>
              </div>

              <div className="divide-y divide-white/15">
                {filteredEvents.map((ev, idx) => {
                  const isExpanded = expandedEventId === ev.id;
                  const draft = inlineCheckpointDraft[ev.id] ?? '';
                  return (
                    <article
                      key={ev.id}
                      className="px-6 py-5 transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
                        <span className="he-meta hidden text-white/85 md:col-span-1 md:block">
                          {String(idx + 1).padStart(2, '0')}
                        </span>

                        <div className="md:col-span-4">
                          <h2 className="text-[16.5px] font-medium tracking-[-0.015em] text-white">
                            {ev.title}
                          </h2>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-[12.5px] text-white/85">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {ev.date}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {ev.location}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Cupo {ev.maxCapacity}
                            </span>
                            {ev.includesHotel && (
                              <span className="inline-flex items-center gap-1 text-[#A4CF63]">
                                <Hotel className="h-3 w-3" />
                                Hotel
                              </span>
                            )}
                            {ev.includesBus && (
                              <span className="inline-flex items-center gap-1 text-[#A4CF63]">
                                <Bus className="h-3 w-3" />
                                Bus
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-[13.5px] text-white md:col-span-2">
                          {getOperatorName(ev.operatorId)}
                        </div>

                        <div className="md:col-span-2">
                          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-white">
                            <QrCode className="h-3.5 w-3.5 text-[#A4CF63]" />
                            {ev.checkpoints.length} puntos
                          </span>
                        </div>

                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={() => onToggleEventRegistration(ev.id)}
                            className={`inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] backdrop-blur-md transition-colors cursor-pointer ${
                              ev.registrationOpen
                                ? 'border-[#A4CF63]/70 bg-[#A4CF63]/20 text-white hover:bg-[#A4CF63]/30'
                                : 'border-white/22 bg-[#011d1f]/45 text-white/80 hover:border-white/45 hover:text-white'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                ev.registrationOpen
                                  ? 'bg-[#A4CF63]'
                                  : 'bg-white/50'
                              }`}
                            />
                            {ev.registrationOpen ? 'Abierto' : 'Cerrado'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 md:col-span-1 md:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedEventId(isExpanded ? null : ev.id)
                            }
                            aria-label="Gestionar checkpoints y detalles"
                            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-white/22 bg-[#011d1f]/45 text-white/90 backdrop-blur-md transition-colors hover:border-white/45 hover:bg-white/15 hover:text-white cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEvent(ev.id)}
                            aria-label={`Eliminar evento ${ev.title}`}
                            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-white/22 bg-[#011d1f]/45 text-white/85 backdrop-blur-md transition-colors hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-200 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Detalle expandible y editor de checkpoints en vivo */}
                      {isExpanded && (
                        <div className="animate-fade-up mt-5 grid grid-cols-1 gap-6 border-t border-white/15 pt-5 lg:grid-cols-12">
                          <div className="space-y-4 lg:col-span-7">
                            <div className="grid grid-cols-1 gap-3 rounded-[12px] border border-white/18 bg-[#011d1f]/42 p-3.5 text-[12.5px] backdrop-blur-md sm:grid-cols-2">
                              <div>
                                <span className="he-meta block text-white/75">
                                  INICIO / FIN DEL EVENTO
                                </span>
                                <span className="mt-1 block text-white">
                                  {formatDateTime(ev.startDateTime)} →{' '}
                                  {formatDateTime(ev.endDateTime)}
                                </span>
                              </div>
                              <div>
                                <span className="he-meta block text-white/75">
                                  VENTANA DE INSCRIPCIONES
                                </span>
                                <span className="mt-1 block text-white">
                                  {formatDateTime(ev.registrationStartDateTime)}{' '}
                                  → {formatDateTime(ev.registrationEndDateTime)}
                                </span>
                              </div>
                              <div>
                                <span className="he-meta block text-white/75">
                                  CUPO Y ACOMPAÑANTES
                                </span>
                                <span className="mt-1 block text-white">
                                  {ev.maxCapacity} personas ·{' '}
                                  {ev.allowCompanions
                                    ? `Hasta ${ev.maxCompanions} acompañantes`
                                    : 'Inscripción individual'}
                                </span>
                              </div>
                              <div>
                                <span className="he-meta block text-white/75">
                                  SERVICIOS INCLUIDOS
                                </span>
                                <span className="mt-1 block text-white">
                                  {[
                                    ev.includesHotel && 'Hotel',
                                    ev.includesBus && 'Bus',
                                  ]
                                    .filter(Boolean)
                                    .join(' · ') || 'Ninguno'}
                                </span>
                              </div>
                            </div>

                            <div>
                              <span className="he-meta mb-2.5 block text-white/85">
                                DESCRIPCIÓN
                              </span>
                              <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-white/90">
                                {ev.description || 'Sin descripción.'}
                              </p>
                            </div>
                          </div>

                          <div className="lg:col-span-5 lg:border-l lg:border-white/15 lg:pl-6">
                            <span className="he-meta mb-3 block text-white/85">
                              GESTIONAR CHECKPOINTS ({ev.checkpoints.length})
                            </span>

                            <div className="space-y-2">
                              {ev.checkpoints.map((cp, cIdx) => (
                                <div
                                  key={cp.id}
                                  className="flex items-center justify-between rounded-[9px] border border-white/18 bg-white/[0.07] px-3 py-2 text-[13px]"
                                >
                                  <span className="flex items-center gap-2 text-white">
                                    <span className="font-mono text-[11px] text-[#A4CF63]">
                                      #{String(cIdx + 1).padStart(2, '0')}
                                    </span>
                                    {cp.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onRemoveCheckpoint(ev.id, cp.id)
                                    }
                                    aria-label={`Quitar checkpoint ${cp.name}`}
                                    className="text-white/75 transition-colors hover:text-red-300 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div className="mt-3 flex gap-2">
                              <input
                                type="text"
                                value={draft}
                                onChange={(e) =>
                                  setInlineCheckpointDraft((prev) => ({
                                    ...prev,
                                    [ev.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleInlineAddCheckpoint(ev.id);
                                  }
                                }}
                                placeholder="Nuevo checkpoint..."
                                className="h-[36px] flex-1 rounded-[9px] border border-white/22 bg-[#011d1f]/48 px-3 text-[12.5px] text-white placeholder:text-white/55 backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/68 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleInlineAddCheckpoint(ev.id)}
                                className="inline-flex h-[36px] items-center gap-1 rounded-[9px] border border-[#A4CF63]/70 bg-[#A4CF63]/20 px-3 font-mono text-[11px] uppercase tracking-[0.1em] text-white backdrop-blur-md transition-colors hover:bg-[#A4CF63]/32 cursor-pointer"
                              >
                                <Plus className="h-3 w-3 text-[#A4CF63]" />
                                Añadir
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== PESTAÑA 3: USUARIOS ==================== */}
      {activeTab === 'usuarios' && (
        <div className="animate-fade-up">
          {/* Encabezado editorial de 12 columnas */}
          <section className="grid grid-cols-1 items-end gap-8 py-10 sm:py-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="he-meta mb-3 block text-white/90">
                ROLES, OPERADORES Y ACCESOS
              </span>
              <h1 className="animate-he-reveal km-metallic text-[44px] font-medium leading-[0.95] tracking-[-0.045em] sm:text-[62px]">
                Usuarios.
              </h1>
            </div>
            <div className="flex flex-col gap-5 lg:col-span-5 lg:items-end lg:text-right">
              <p className="max-w-[400px] text-[14.5px] leading-relaxed text-white/90">
                {operatorCount} operadores · {adminCount} administradores ·{' '}
                {activeUsersCount} cuentas activas en el sistema.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowAddUser((prev) => !prev);
                  setUserError(null);
                }}
                className="he-cta self-start lg:self-end cursor-pointer"
              >
                <span className="he-cta-inner">
                  <Plus className="h-3.5 w-3.5 text-[#A4CF63]" />
                  {showAddUser ? 'Cerrar formulario' : 'Crear usuario'}
                </span>
              </button>
            </div>
          </section>

          {/* Panel en línea para crear usuario */}
          {showAddUser && (
            <form
              onSubmit={handleCreateUser}
              noValidate
              className="animate-fade-up mb-8 rounded-[18px] border border-white/25 bg-[#01282a]/60 p-6 shadow-[0_20px_54px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
            >
              <div className="mb-5 flex items-center justify-between border-b border-white/15 pb-3.5">
                <div>
                  <span className="he-meta block text-[#A4CF63]">
                    BIENESTAR AL APRENDIZ · NUEVA CUENTA
                  </span>
                  <h2 className="mt-1 text-[20px] font-medium tracking-[-0.02em] text-white">
                    Crear Usuario
                  </h2>
                </div>
                <span className="he-meta text-white/80">ADMIN / OPERADOR</span>
              </div>

              {userError && (
                <div
                  role="alert"
                  className="mb-4 rounded-[10px] border border-[#A4CF63]/60 bg-[#011c1e]/65 px-4 py-3 text-[13px] font-medium text-white backdrop-blur-md"
                >
                  {userError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                {/* 1. Rol */}
                <div className="md:col-span-4">
                  <label
                    htmlFor="user-role"
                    className="he-meta mb-1.5 block text-white/95"
                  >
                    Rol
                  </label>
                  <select
                    id="user-role"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="h-[42px] w-full rounded-[9px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13.5px] text-white backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
                  >
                    <option value="Operador" className="bg-[#012b2d] text-white">
                      Operador
                    </option>
                    <option
                      value="Administrador"
                      className="bg-[#012b2d] text-white"
                    >
                      Administrador
                    </option>
                  </select>
                </div>

                {/* 2. Nombre completo */}
                <div className="md:col-span-4">
                  <label
                    htmlFor="user-name"
                    className="he-meta mb-1.5 block text-white/95"
                  >
                    Nombre completo
                  </label>
                  <input
                    id="user-name"
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Nombre del usuario"
                    className="h-[42px] w-full rounded-[9px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13.5px] text-white placeholder:text-white/55 backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
                  />
                </div>

                {/* 3. Documento */}
                <div className="md:col-span-4">
                  <label
                    htmlFor="user-document"
                    className="he-meta mb-1.5 block text-white/95"
                  >
                    Documento
                  </label>
                  <input
                    id="user-document"
                    type="text"
                    inputMode="numeric"
                    value={newUserDocument}
                    onChange={(e) => setNewUserDocument(e.target.value)}
                    placeholder="Número de documento"
                    className="h-[42px] w-full rounded-[9px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13.5px] text-white placeholder:text-white/55 backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
                  />
                </div>

                {/* 4. Correo */}
                <div className="md:col-span-6">
                  <label
                    htmlFor="user-email"
                    className="he-meta mb-1.5 block text-white/95"
                  >
                    Correo
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="correo@sena.gov.co"
                    className="h-[42px] w-full rounded-[9px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13.5px] text-white placeholder:text-white/55 backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
                  />
                </div>

                {/* 5. Contraseña (la asigna el Administrador) */}
                <div className="md:col-span-6">
                  <label
                    htmlFor="user-password"
                    className="he-meta mb-1.5 block text-white/95"
                  >
                    Contraseña (la asigna el Administrador)
                  </label>
                  <div className="relative">
                    <input
                      id="user-password"
                      type={showNewUserPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="h-[42px] w-full rounded-[9px] border border-white/22 bg-[#011d1f]/45 px-3.5 pr-10 text-[13.5px] text-white placeholder:text-white/55 backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPassword((prev) => !prev)}
                      aria-label={
                        showNewUserPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[7px] text-white/80 transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
                    >
                      {showNewUserPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 6. Tipo de afiliación */}
                <div className="md:col-span-4">
                  <label
                    htmlFor="user-affiliation"
                    className="he-meta mb-1.5 block text-white/95"
                  >
                    Tipo de afiliación
                  </label>
                  <select
                    id="user-affiliation"
                    value={newUserAffiliation}
                    onChange={(e) =>
                      setNewUserAffiliation(e.target.value as AffiliationType)
                    }
                    className="h-[42px] w-full rounded-[9px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13.5px] text-white backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
                  >
                    <option value="SENA" className="bg-[#012b2d] text-white">
                      SENA
                    </option>
                    <option value="Externo" className="bg-[#012b2d] text-white">
                      Externo
                    </option>
                  </select>
                </div>

                {/* 7. Centro de formación */}
                <div className="md:col-span-8">
                  <label
                    htmlFor="user-training-center"
                    className="he-meta mb-1.5 block text-white/95"
                  >
                    Centro de formación
                  </label>
                  <input
                    id="user-training-center"
                    type="text"
                    value={newUserTrainingCenter}
                    onChange={(e) => setNewUserTrainingCenter(e.target.value)}
                    placeholder="Escribe el nombre del centro"
                    className="h-[42px] w-full rounded-[9px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13.5px] text-white placeholder:text-white/55 backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
                  />
                  <p className="mt-1.5 text-[12px] text-white/80">
                    Opcional para Operadores: pueden ser personal del SENA o
                    externos.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2.5 border-t border-white/15 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="he-cta-neutral cursor-pointer"
                >
                  <span className="he-cta-neutral-inner min-h-[38px]">
                    Cancelar
                  </span>
                </button>
                <button type="submit" className="he-cta cursor-pointer">
                  <span className="he-cta-inner min-h-[38px]">
                    <Plus className="h-3.5 w-3.5 text-[#A4CF63]" />
                    Crear Usuario
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Barra de filtros por rol y búsqueda */}
          <div className="flex flex-col gap-4 border-y border-white/18 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'todos', label: `Todos (${users.length})` },
                  {
                    id: 'Administrador',
                    label: `Administradores (${adminCount})`,
                  },
                  { id: 'Operador', label: `Operadores (${operatorCount})` },
                ] as { id: RoleFilter; label: string }[]
              ).map((tab) => {
                const active = roleFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRoleFilter(tab.id)}
                    className={`rounded-[8px] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.13em] backdrop-blur-md transition-colors cursor-pointer ${
                      active
                        ? 'border border-[#A4CF63]/75 bg-[#A4CF63]/20 text-white'
                        : 'border border-white/22 bg-[#011d1f]/45 text-white/85 hover:border-white/45 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-[320px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/70" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por nombre, documento o centro..."
                className="h-[38px] w-full rounded-[9px] border border-white/22 bg-[#011d1f]/48 pl-9 pr-3.5 text-[13px] text-white placeholder:text-white/55 backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/68 focus:outline-none"
              />
            </div>
          </div>

          {/* Directorio de usuarios en varias columnas */}
          <div className="mt-6 overflow-hidden rounded-[20px] border border-white/22 bg-[#01282a]/54 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="hidden grid-cols-12 border-b border-white/15 px-6 py-3.5 md:grid">
              <span className="he-meta col-span-1 text-white/85">ID</span>
              <span className="he-meta col-span-4 text-white/85">
                MIEMBRO / DOCUMENTO / CENTRO
              </span>
              <span className="he-meta col-span-2 text-white/85">ROL</span>
              <span className="he-meta col-span-2 text-white/85">EVENTOS</span>
              <span className="he-meta col-span-2 text-white/85">ESTADO</span>
              <span className="he-meta col-span-1 text-right text-white/85">
                ACCIÓN
              </span>
            </div>

            <div className="divide-y divide-white/15">
              {filteredUsers.map((item, idx) => {
                const isLastAdmin =
                  item.role === 'Administrador' && adminCount <= 1;
                const assignedCount = getAssignedEventCount(item.id);

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 items-center gap-4 px-6 py-5 transition-colors hover:bg-white/[0.04] md:grid-cols-12"
                  >
                    <span className="he-meta hidden text-white/85 md:col-span-1 md:block">
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    <div className="flex items-center gap-3.5 md:col-span-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-white/22 bg-white/10 font-mono text-[12px] font-medium text-white">
                        {item.name
                          .split(' ')
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium text-white">
                          {item.name}
                        </p>
                        <p className="truncate text-[12.5px] text-white/85">
                          {item.email}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[11px] text-white/80">
                          Doc. {item.document} · {item.affiliationType}
                          {item.trainingCenter
                            ? ` · ${item.trainingCenter}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <button
                        type="button"
                        disabled={isLastAdmin}
                        onClick={() => onToggleUserRole(item.id)}
                        title={
                          isLastAdmin
                            ? 'Debe existir al menos un administrador'
                            : 'Cambiar entre Administrador y Operador'
                        }
                        className={`rounded-[8px] border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] backdrop-blur-md transition-colors ${
                          item.role === 'Administrador'
                            ? 'border-[#A4CF63]/70 bg-[#A4CF63]/20 text-white'
                            : 'border-white/22 bg-[#011d1f]/45 text-white'
                        } ${
                          isLastAdmin
                            ? 'cursor-default opacity-90'
                            : 'cursor-pointer hover:border-white/45 hover:bg-white/15'
                        }`}
                      >
                        {item.role}
                      </button>
                    </div>

                    <div className="font-mono text-[12.5px] text-white/90 md:col-span-2">
                      {assignedCount}{' '}
                      {assignedCount === 1 ? 'asignado' : 'asignados'}
                    </div>

                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={() => onToggleUserActive(item.id)}
                        className="inline-flex items-center gap-2 rounded-[8px] border border-white/18 bg-[#011d1f]/42 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] backdrop-blur-md transition-colors hover:border-white/40 hover:bg-white/12 cursor-pointer"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.active ? 'bg-[#A4CF63]' : 'bg-white/45'
                          }`}
                        />
                        <span
                          className={
                            item.active ? 'text-white' : 'text-white/75'
                          }
                        >
                          {item.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </button>
                    </div>

                    <div className="flex md:col-span-1 md:justify-end">
                      {!isLastAdmin ? (
                        <button
                          type="button"
                          onClick={() => onDeleteUser(item.id)}
                          aria-label={`Eliminar a ${item.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-white/22 bg-[#011d1f]/45 text-white/85 backdrop-blur-md transition-colors hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-200 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="he-meta text-white/70">BASE</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
