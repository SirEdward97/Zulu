import { useEffect, useState } from 'react';
import {
  Bus,
  Calendar,
  Hotel,
  MapPin,
  Plus,
  QrCode,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import type { AdminUser, EventCheckpoint, SenaEvent } from '../types/auth';

interface CreateEventModalProps {
  open: boolean;
  users: AdminUser[];
  onClose: () => void;
  onCreate: (event: SenaEvent) => void;
}

function formatEventSummaryDate(dateTimeValue: string): string {
  if (!dateTimeValue) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(dateTimeValue);
  if (Number.isNaN(parsed.getTime())) return dateTimeValue;
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

export function CreateEventModal({
  open,
  users,
  onClose,
  onCreate,
}: CreateEventModalProps) {
  const defaultOperator =
    users.find((u) => u.role === 'Operador')?.id ?? users[0]?.id ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [registrationStartDateTime, setRegistrationStartDateTime] =
    useState('');
  const [registrationEndDateTime, setRegistrationEndDateTime] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('1');
  const [allowCompanions, setAllowCompanions] = useState(true);
  const [maxCompanions, setMaxCompanions] = useState('3');
  const [includesHotel, setIncludesHotel] = useState(false);
  const [includesBus, setIncludesBus] = useState(false);

  const [operatorId, setOperatorId] = useState(defaultOperator);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [checkpointInput, setCheckpointInput] = useState('');
  const [checkpoints, setCheckpoints] = useState<EventCheckpoint[]>([
    { id: 'cp-1', name: 'Registro de ingreso' },
    { id: 'cp-2', name: 'Cierre y certificación' },
  ]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (!operatorId && defaultOperator) {
      setOperatorId(defaultOperator);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, operatorId, defaultOperator]);

  if (!open) return null;

  function handleAddCheckpoint() {
    const cleaned = checkpointInput.trim();
    if (!cleaned) return;
    setCheckpoints((prev) => [
      ...prev,
      { id: `cp-${Date.now()}-${prev.length}`, name: cleaned },
    ]);
    setCheckpointInput('');
  }

  function handleRemoveCheckpoint(id: string) {
    setCheckpoints((prev) => prev.filter((cp) => cp.id !== id));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError('Escribe un nombre para el evento (mínimo 3 caracteres).');
      return;
    }

    if (location.trim().length < 2) {
      setError('Indica el lugar donde se realizará el evento.');
      return;
    }

    if (!startDateTime || !endDateTime) {
      setError('Define la fecha y hora de inicio y fin del evento.');
      return;
    }

    if (new Date(endDateTime) < new Date(startDateTime)) {
      setError('La fecha de fin del evento debe ser posterior al inicio.');
      return;
    }

    if (!registrationStartDateTime || !registrationEndDateTime) {
      setError('Define cuándo abren y cierran las inscripciones.');
      return;
    }

    if (
      new Date(registrationEndDateTime) < new Date(registrationStartDateTime)
    ) {
      setError(
        'La fecha de cierre de inscripciones debe ser posterior a la apertura.',
      );
      return;
    }

    const parsedCapacity = Number.parseInt(maxCapacity, 10);
    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
      setError('El cupo máximo debe ser al menos 1 persona.');
      return;
    }

    const parsedCompanions = allowCompanions
      ? Number.parseInt(maxCompanions, 10)
      : 0;
    if (
      allowCompanions &&
      (!Number.isFinite(parsedCompanions) ||
        parsedCompanions < 1 ||
        parsedCompanions > 10)
    ) {
      setError('El máximo de acompañantes por inscripción debe estar entre 1 y 10.');
      return;
    }

    const newEvent: SenaEvent = {
      id: `evt-${Date.now()}`,
      title: title.trim(),
      date: formatEventSummaryDate(startDateTime),
      startDateTime,
      endDateTime,
      registrationStartDateTime,
      registrationEndDateTime,
      location: location.trim(),
      maxCapacity: parsedCapacity,
      allowCompanions,
      maxCompanions: parsedCompanions,
      includesHotel,
      includesBus,
      description: description.trim(),
      operatorId: operatorId || defaultOperator,
      registrationOpen,
      checkpoints,
      createdAt: new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    onCreate(newEvent);
    setTitle('');
    setDescription('');
    setLocation('');
    setStartDateTime('');
    setEndDateTime('');
    setRegistrationStartDateTime('');
    setRegistrationEndDateTime('');
    setMaxCapacity('1');
    setAllowCompanions(true);
    setMaxCompanions('3');
    setIncludesHotel(false);
    setIncludesBus(false);
    setCheckpointInput('');
    setCheckpoints([
      { id: `cp-a-${Date.now()}`, name: 'Registro de ingreso' },
      { id: `cp-b-${Date.now()}`, name: 'Cierre y certificación' },
    ]);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#011c1e]/60 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Crear Evento"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-fade-up flex max-h-[92vh] w-full max-w-[680px] flex-col overflow-hidden rounded-[18px] border border-white/25 bg-[#01282a]/68 shadow-[0_24px_70px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        {/* Encabezado del modal */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/15 px-6 py-4">
          <div>
            <span className="he-meta text-[#A4CF63]">
              BIENESTAR AL APRENDIZ · NUEVO REGISTRO
            </span>
            <h2 className="mt-1 text-[20px] font-medium tracking-[-0.02em] text-white">
              Crear Evento
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-white/22 bg-[#011d1f]/45 text-white/90 transition-colors hover:border-white/45 hover:bg-white/15 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Cuerpo desplazable del formulario */}
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {error && (
              <div
                role="alert"
                className="rounded-[10px] border border-[#A4CF63]/60 bg-[#011c1e]/65 px-4 py-3 text-[13px] font-medium text-white backdrop-blur-md"
              >
                {error}
              </div>
            )}

            {/* 1. Nombre del evento */}
            <div>
              <label htmlFor="event-title" className="he-meta mb-1.5 block text-white/95">
                Nombre del evento
              </label>
              <input
                id="event-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Día de Integración"
                className="h-[44px] w-full rounded-[10px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[14px] text-white placeholder:text-white/55 backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
              />
            </div>

            {/* 2. Descripción (opcional) */}
            <div>
              <label
                htmlFor="event-desc"
                className="he-meta mb-1.5 block text-white/95"
              >
                Descripción (opcional)
              </label>
              <textarea
                id="event-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Agrega detalles, agenda o requisitos del evento..."
                className="w-full resize-y rounded-[10px] border border-white/22 bg-[#011d1f]/45 p-3.5 text-[13.5px] leading-relaxed text-white placeholder:text-white/55 backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
              />
            </div>

            {/* 3. Lugar */}
            <div>
              <label
                htmlFor="event-location"
                className="he-meta mb-1.5 flex items-center gap-1.5 text-white/95"
              >
                <MapPin className="h-3 w-3" />
                Lugar
              </label>
              <input
                id="event-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej. Centro Agropecuario de Caldas"
                className="h-[42px] w-full rounded-[10px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13.5px] text-white placeholder:text-white/55 backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
              />
            </div>

            {/* 4. Inicio del evento / Fin del evento */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="event-start"
                  className="he-meta mb-1.5 flex items-center gap-1.5 text-white/95"
                >
                  <Calendar className="h-3 w-3" />
                  Inicio del evento
                </label>
                <input
                  id="event-start"
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="h-[42px] w-full rounded-[10px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13px] text-white backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="event-end"
                  className="he-meta mb-1.5 flex items-center gap-1.5 text-white/95"
                >
                  <Calendar className="h-3 w-3" />
                  Fin del evento
                </label>
                <input
                  id="event-end"
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="h-[42px] w-full rounded-[10px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13px] text-white backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
                />
              </div>
            </div>

            {/* 5. Inscripciones abren / Inscripciones cierran */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="event-reg-start"
                  className="he-meta mb-1.5 flex items-center gap-1.5 text-white/95"
                >
                  <Calendar className="h-3 w-3" />
                  Inscripciones abren
                </label>
                <input
                  id="event-reg-start"
                  type="datetime-local"
                  value={registrationStartDateTime}
                  onChange={(e) =>
                    setRegistrationStartDateTime(e.target.value)
                  }
                  className="h-[42px] w-full rounded-[10px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13px] text-white backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="event-reg-end"
                  className="he-meta mb-1.5 flex items-center gap-1.5 text-white/95"
                >
                  <Calendar className="h-3 w-3" />
                  Inscripciones cierran
                </label>
                <input
                  id="event-reg-end"
                  type="datetime-local"
                  value={registrationEndDateTime}
                  onChange={(e) => setRegistrationEndDateTime(e.target.value)}
                  className="h-[42px] w-full rounded-[10px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13px] text-white backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
                />
              </div>
            </div>

            {/* 6. Cupo máximo (personas totales) */}
            <div>
              <label
                htmlFor="event-max-capacity"
                className="he-meta mb-1.5 flex items-center gap-1.5 text-white/95"
              >
                <Users className="h-3 w-3" />
                Cupo máximo (personas totales)
              </label>
              <input
                id="event-max-capacity"
                type="number"
                min={1}
                step={1}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                className="h-[42px] w-full rounded-[10px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13.5px] text-white backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
              />
            </div>

            {/* 7. ¿Permite acompañantes? */}
            <fieldset className="rounded-[12px] border border-white/18 bg-[#011e20]/35 p-4 backdrop-blur-md">
              <legend className="he-meta px-1 text-white/95">
                ¿Permite acompañantes?
              </legend>
              <div className="mt-1 space-y-2.5">
                <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-white">
                  <input
                    type="radio"
                    name="allow-companions"
                    checked={allowCompanions}
                    onChange={() => {
                      setAllowCompanions(true);
                      if (
                        !maxCompanions ||
                        Number.parseInt(maxCompanions, 10) < 1
                      ) {
                        setMaxCompanions('3');
                      }
                    }}
                    className="h-4 w-4 accent-[#A4CF63] cursor-pointer"
                  />
                  <span>Sí</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-white">
                  <input
                    type="radio"
                    name="allow-companions"
                    checked={!allowCompanions}
                    onChange={() => setAllowCompanions(false)}
                    className="h-4 w-4 accent-[#A4CF63] cursor-pointer"
                  />
                  <span>No, el evento es de inscripción individual</span>
                </label>
              </div>

              {/* 8. Máximo de acompañantes por inscripción */}
              <div
                className={`mt-4 border-t border-white/15 pt-3.5 transition-opacity ${
                  allowCompanions ? 'opacity-100' : 'opacity-45'
                }`}
              >
                <label
                  htmlFor="event-max-companions"
                  className="he-meta mb-1.5 block text-white/95"
                >
                  Máximo de acompañantes por inscripción
                </label>
                <input
                  id="event-max-companions"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  disabled={!allowCompanions}
                  value={allowCompanions ? maxCompanions : '0'}
                  onChange={(e) => setMaxCompanions(e.target.value)}
                  className="h-[42px] w-full rounded-[10px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13.5px] text-white backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none disabled:cursor-not-allowed"
                />
                <p className="mt-2 text-[12px] leading-relaxed text-white/80">
                  Personas <strong className="text-white">adicionales al titular</strong>{' '}
                  que puede incluir cada inscripción, hasta 10. Si el evento es de
                  inscripción individual, elige la opción &quot;No&quot; de arriba.
                </p>
              </div>
            </fieldset>

            {/* 9. Incluye hotel / Incluye bus */}
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <label
                htmlFor="event-includes-hotel"
                className={`inline-flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-[13.5px] backdrop-blur-md transition-colors ${
                  includesHotel
                    ? 'border-[#A4CF63]/75 bg-[#A4CF63]/20 text-white'
                    : 'border-white/22 bg-[#011d1f]/45 text-white/90 hover:border-white/40 hover:text-white'
                }`}
              >
                <input
                  id="event-includes-hotel"
                  type="checkbox"
                  checked={includesHotel}
                  onChange={(e) => setIncludesHotel(e.target.checked)}
                  className="h-4 w-4 accent-[#A4CF63] cursor-pointer"
                />
                <Hotel className="h-3.5 w-3.5 text-[#A4CF63]" />
                <span>Incluye hotel</span>
              </label>

              <label
                htmlFor="event-includes-bus"
                className={`inline-flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-[13.5px] backdrop-blur-md transition-colors ${
                  includesBus
                    ? 'border-[#A4CF63]/75 bg-[#A4CF63]/20 text-white'
                    : 'border-white/22 bg-[#011d1f]/45 text-white/90 hover:border-white/40 hover:text-white'
                }`}
              >
                <input
                  id="event-includes-bus"
                  type="checkbox"
                  checked={includesBus}
                  onChange={(e) => setIncludesBus(e.target.checked)}
                  className="h-4 w-4 accent-[#A4CF63] cursor-pointer"
                />
                <Bus className="h-3.5 w-3.5 text-[#A4CF63]" />
                <span>Incluye bus</span>
              </label>
            </div>

            {/* Sección operativa: Operador asignado, Estado de inscripciones y Checkpoints */}
            <div className="space-y-4 border-t border-white/15 pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <label
                    htmlFor="event-operator"
                    className="he-meta mb-1.5 flex items-center gap-1.5 text-white/95"
                  >
                    <UserCheck className="h-3 w-3" />
                    Operador asignado
                  </label>
                  <select
                    id="event-operator"
                    value={operatorId}
                    onChange={(e) => setOperatorId(e.target.value)}
                    className="h-[42px] w-full rounded-[10px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13.5px] text-white backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
                  >
                    {users.map((u) => (
                      <option
                        key={u.id}
                        value={u.id}
                        className="bg-[#012b2d] text-white"
                      >
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={registrationOpen}
                    onClick={() => setRegistrationOpen((prev) => !prev)}
                    className={`flex h-[42px] items-center gap-2 rounded-[10px] border px-3.5 font-mono text-[11px] uppercase tracking-[0.12em] backdrop-blur-md transition-colors cursor-pointer ${
                      registrationOpen
                        ? 'border-[#A4CF63]/70 bg-[#A4CF63]/20 text-white'
                        : 'border-white/22 bg-[#011d1f]/45 text-white/80 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        registrationOpen ? 'bg-[#A4CF63]' : 'bg-white/50'
                      }`}
                    />
                    {registrationOpen ? 'Abiertas' : 'Cerradas'}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="checkpoint-input"
                  className="he-meta mb-1.5 flex items-center gap-1.5 text-white/95"
                >
                  <QrCode className="h-3 w-3" />
                  Checkpoints ({checkpoints.length})
                </label>
                <div className="flex gap-2">
                  <input
                    id="checkpoint-input"
                    type="text"
                    value={checkpointInput}
                    onChange={(e) => setCheckpointInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCheckpoint();
                      }
                    }}
                    placeholder="Ej. Control de asistencia refrigerio"
                    className="h-[40px] flex-1 rounded-[10px] border border-white/22 bg-[#011d1f]/45 px-3.5 text-[13px] text-white placeholder:text-white/55 backdrop-blur-md focus:border-[#A4CF63] focus:bg-[#011d1f]/65 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCheckpoint}
                    className="inline-flex h-[40px] items-center gap-1 rounded-[10px] border border-white/25 bg-[#011d1f]/50 px-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white backdrop-blur-md transition-colors hover:border-white/45 hover:bg-white/15 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#A4CF63]" />
                    Añadir
                  </button>
                </div>

                {checkpoints.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {checkpoints.map((cp, idx) => (
                      <span
                        key={cp.id}
                        className="inline-flex items-center gap-1.5 rounded-[8px] border border-white/20 bg-white/[0.08] py-1 pl-2.5 pr-1.5 text-[12px] text-white"
                      >
                        <span className="font-mono text-[10.5px] text-[#A4CF63]">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        {cp.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveCheckpoint(cp.id)}
                          aria-label={`Quitar checkpoint ${cp.name}`}
                          className="rounded p-0.5 text-white/70 transition-colors hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Acciones fijas en el pie del modal */}
          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-white/15 bg-[#012224]/60 px-6 py-4 backdrop-blur-xl">
            <button
              type="button"
              onClick={onClose}
              className="he-cta-neutral cursor-pointer"
            >
              <span className="he-cta-neutral-inner min-h-[38px]">
                Cancelar
              </span>
            </button>
            <button type="submit" className="he-cta cursor-pointer">
              <span className="he-cta-inner min-h-[38px]">
                <Plus className="h-3.5 w-3.5 text-[#A4CF63]" />
                Crear Evento
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
