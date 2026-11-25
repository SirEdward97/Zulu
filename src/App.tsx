import { useCallback, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { CloudPatternsBackground } from './components/CloudPatternsBackground';
import { CreateEventModal } from './components/CreateEventModal';
import { FooterStrip } from './components/FooterStrip';
import { Header } from './components/Header';
import { LoginCard } from './components/LoginCard';
import type {
  AdminTab,
  AdminUser,
  AuthMode,
  SenaEvent,
  UserProfile,
} from './types/auth';

const INITIAL_USERS: AdminUser[] = [
  {
    id: 'usr-admin-1',
    name: 'Administrador del Sistema',
    document: '1000000001',
    email: 'admin@soy.sena.edu.co',
    role: 'Administrador',
    affiliationType: 'SENA',
    trainingCenter: 'Centro Agropecuario de Caldas',
    active: true,
  },
  {
    id: 'usr-op-1',
    name: 'Operador Bienestar',
    document: '1000000002',
    email: 'operador@soy.sena.edu.co',
    role: 'Operador',
    affiliationType: 'SENA',
    trainingCenter: 'Centro Agropecuario de Caldas',
    active: true,
  },
];

export function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('resumen');
  const [events, setEvents] = useState<SenaEvent[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [createEventOpen, setCreateEventOpen] = useState<boolean>(false);
  const [focusSignal, setFocusSignal] = useState<number>(0);

  const handleLogout = useCallback(() => {
    setUser(null);
    setAuthMode('login');
    setActiveAdminTab('resumen');
    setCreateEventOpen(false);
  }, []);

  const handleFocusLogin = useCallback(() => {
    setFocusSignal((count) => count + 1);
  }, []);

  const handleCreateEvent = useCallback((newEvent: SenaEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
  }, []);

  const handleToggleEventRegistration = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? { ...ev, registrationOpen: !ev.registrationOpen }
          : ev,
      ),
    );
  }, []);

  const handleAddCheckpoint = useCallback((eventId: string, name: string) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              checkpoints: [
                ...ev.checkpoints,
                { id: `cp-${Date.now()}-${ev.checkpoints.length}`, name },
              ],
            }
          : ev,
      ),
    );
  }, []);

  const handleRemoveCheckpoint = useCallback(
    (eventId: string, checkpointId: string) => {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId
            ? {
                ...ev,
                checkpoints: ev.checkpoints.filter(
                  (cp) => cp.id !== checkpointId,
                ),
              }
            : ev,
        ),
      );
    },
    [],
  );

  const handleDeleteEvent = useCallback((eventId: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
  }, []);

  const handleAddUser = useCallback((newUser: AdminUser) => {
    setAdminUsers((prev) => [...prev, newUser]);
  }, []);

  const handleToggleUserRole = useCallback((userId: string) => {
    setAdminUsers((prev) => {
      const admins = prev.filter((u) => u.role === 'Administrador').length;
      return prev.map((u) => {
        if (u.id !== userId) return u;
        if (u.role === 'Administrador' && admins <= 1) return u;
        return {
          ...u,
          role: u.role === 'Administrador' ? 'Operador' : 'Administrador',
        };
      });
    });
  }, []);

  const handleToggleUserActive = useCallback((userId: string) => {
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, active: !u.active } : u)),
    );
  }, []);

  const handleDeleteUser = useCallback((userId: string) => {
    setAdminUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const isModalActive = createEventOpen;

  return (
    <div className="relative flex min-h-screen flex-col text-white">
      <CloudPatternsBackground paused={isModalActive} />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header
          onSelectAuthMode={setAuthMode}
          user={user}
          activeAdminTab={activeAdminTab}
          onSelectAdminTab={setActiveAdminTab}
          onLogout={handleLogout}
          onFocusLogin={handleFocusLogin}
        />

        <div className="flex-1">
          {user ? (
            <AdminDashboard
              user={user}
              activeTab={activeAdminTab}
              onTabChange={setActiveAdminTab}
              events={events}
              users={adminUsers}
              onOpenCreateEvent={() => setCreateEventOpen(true)}
              onToggleEventRegistration={handleToggleEventRegistration}
              onAddCheckpoint={handleAddCheckpoint}
              onRemoveCheckpoint={handleRemoveCheckpoint}
              onDeleteEvent={handleDeleteEvent}
              onAddUser={handleAddUser}
              onToggleUserRole={handleToggleUserRole}
              onToggleUserActive={handleToggleUserActive}
              onDeleteUser={handleDeleteUser}
              paused={isModalActive}
            />
          ) : (
            <main>
              <LoginCard
                mode={authMode}
                onModeChange={setAuthMode}
                onAuthenticated={setUser}
                focusSignal={focusSignal}
                paused={isModalActive}
              />
            </main>
          )}
        </div>

        <FooterStrip />
      </div>

      <CreateEventModal
        open={createEventOpen}
        users={adminUsers}
        onClose={() => setCreateEventOpen(false)}
        onCreate={handleCreateEvent}
      />
    </div>
  );
}

export default App;
