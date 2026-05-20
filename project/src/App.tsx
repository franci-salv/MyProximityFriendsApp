import { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, List, Map, MapPin } from 'lucide-react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AuthGate } from './components/AuthGate';
import { ContactsPanel } from './components/ContactsPanel';
import { HistoryTimeline } from './components/HistoryTimeline';
import { InvitePanel } from './components/InvitePanel';
import { MapView } from './components/MapView';
import { SimulatorPanel } from './components/SimulatorPanel';
import { ToastBanner } from './components/ToastBanner';
import { seedContacts } from './data/seedContacts';
import { mockGeocodeByCity, hasSignificantLocationChange } from './lib/geocoder';
import {
  acceptInvite,
  createInvite,
  getContactsForUser,
  getHistory,
  getProfile,
  hasSupabaseEnv,
  insertLocationUpdate,
  insertProximityEvent,
  simulateSupabaseCityWrite,
  supabase,
  upsertProfile,
} from './lib/supabase';
import type { AppCity, Contact, HistoryEvent, ToastState, UserProfile } from './types/models';

const CACHE_KEY = 'friendapp.lastCity';

function App() {
  const [activeView, setActiveView] = useState<'list' | 'map'>('list');
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>(seedContacts);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [currentCity, setCurrentCity] = useState<AppCity>('Eindhoven');
  const [lastSavedCity, setLastSavedCity] = useState<AppCity | null>(null);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isWritingLocation, setIsWritingLocation] = useState(false);
  const [lastInviteCode, setLastInviteCode] = useState<string | null>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  const nearbyContacts = useMemo(
    () => contacts.filter((contact) => contact.city === currentCity),
    [contacts, currentCity],
  );

  useEffect(() => {
    const cachedCity = localStorage.getItem(CACHE_KEY) as AppCity | null;
    if (cachedCity) {
      setCurrentCity(cachedCity);
      setLastSavedCity(cachedCity);
    }
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setIsAuthLoading(false);
      return;
    }

    const handleAuthChange = (event: AuthChangeEvent, nextSession: Session | null) => {
      setSession(nextSession);
      // Fires after GoTrue init (including URL/hash token exchange for magic links).
      if (event === 'INITIAL_SESSION') {
        setIsAuthLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!hasSupabaseEnv || !session?.user) return;
    let isMounted = true;
    const bootstrap = async () => {
      try {
        const existing = await getProfile(session.user.id);
        if (!isMounted) return;
        if (existing) {
          setProfile({
            id: existing.id,
            name: existing.name,
            avatar: existing.avatar,
            homeCity: existing.home_city,
            currentCity,
            createdAt: existing.created_at,
          });
          return;
        }
        const emailName = session.user.email?.split('@')[0] ?? 'Friend';
        const created = await upsertProfile(session.user.id, emailName, currentCity);
        if (!isMounted) return;
        setProfile({
          id: created.id,
          name: created.name,
          avatar: created.avatar,
          homeCity: created.home_city,
          currentCity,
          createdAt: created.created_at,
        });
      } catch (error) {
        if (!isMounted) return;
        setAppError(error instanceof Error ? error.message : 'Profile bootstrap failed.');
      }
    };
    bootstrap();
    return () => {
      isMounted = false;
    };
  }, [currentCity, session]);

  useEffect(() => {
    if (!profile) return;
    if (!hasSupabaseEnv) {
      setContacts(seedContacts);
      return;
    }
    let isMounted = true;
    const loadData = async () => {
      setIsContactsLoading(true);
      setContactsError(null);
      setHistoryError(null);
      try {
        const [nextContacts, nextHistory] = await Promise.all([getContactsForUser(profile.id), getHistory(profile.id)]);
        if (!isMounted) return;
        setContacts(nextContacts);
        setHistory(nextHistory);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Failed to load data.';
        setContacts(seedContacts);
        setContactsError(`${message} Falling back to demo friends.`);
        setHistoryError(message);
      } finally {
        if (isMounted) {
          setIsContactsLoading(false);
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [profile]);

  useEffect(() => {
    if (!toast?.visible) return;
    const timeout = window.setTimeout(() => {
      setToast((currentToast) => (currentToast ? { ...currentToast, visible: false } : null));
    }, 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const addEvent = (event: Omit<HistoryEvent, 'id' | 'createdAt'>) => {
    const nextEvent: HistoryEvent = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [nextEvent, ...prev].slice(0, 14));
  };

  const notifyUser = (message: string) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification('FriendApp Alert', { body: message, icon: '/favicon.svg' });
    }
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const handleOnboardingComplete = (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    setCurrentCity(nextProfile.currentCity);
    setLastSavedCity(nextProfile.currentCity);
    localStorage.setItem(CACHE_KEY, nextProfile.currentCity);
    addEvent({
      type: 'system',
      title: 'Mock session started',
      description: `${nextProfile.name} joined from ${nextProfile.homeCity}.`,
      city: nextProfile.currentCity,
    });
  };

  const refreshContactsAndHistory = async () => {
    if (!profile || !hasSupabaseEnv) return;
    const [nextContacts, nextHistory] = await Promise.all([getContactsForUser(profile.id), getHistory(profile.id)]);
    setContacts(nextContacts);
    setHistory(nextHistory);
  };

  const handleCreateInvite = async () => {
    if (!profile || !hasSupabaseEnv) return;
    setIsCreatingInvite(true);
    try {
      const invite = await createInvite(profile.id);
      setLastInviteCode(invite.code);
      addEvent({
        type: 'system',
        title: 'Invite created',
        description: `Invite code ${invite.code} is ready to share.`,
        city: currentCity,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create invite.';
      setContactsError(message);
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!profile || !hasSupabaseEnv) return;
    setIsAcceptingInvite(true);
    try {
      await acceptInvite(profile.id, inviteCodeInput);
      setInviteCodeInput('');
      addEvent({
        type: 'system',
        title: 'Invite accepted',
        description: 'You added this user. You become mutual friends when they also add you.',
        city: currentCity,
      });
      await refreshContactsAndHistory();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept invite.';
      setContactsError(message);
    } finally {
      setIsAcceptingInvite(false);
    }
  };

  const handleSignOut = async () => {
    if (hasSupabaseEnv) {
      await supabase.auth.signOut();
    }
    setAppError(null);
    setProfile(null);
    setSession(null);
    setHistory([]);
    setContacts(seedContacts);
  };

  const refreshSessionAfterMagicLink = useCallback(async () => {
    if (!hasSupabaseEnv) return;
    const {
      data: { session: nextSession },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      setToast({
        id: crypto.randomUUID(),
        message: `Could not read your session: ${error.message}`,
        visible: true,
      });
      return;
    }
    if (!nextSession) {
      setToast({
        id: crypto.randomUUID(),
        message:
          'No active session yet. Open the magic link from the same browser, wait a few seconds, and try again — or tap Send magic link for a new email.',
        visible: true,
      });
      return;
    }
    setSession(nextSession);
  }, []);

  const handleSimulatorCitySwitch = async (nextCity: AppCity) => {
    const changed = hasSignificantLocationChange(currentCity, nextCity);
    if (!changed) return;

    setCurrentCity(nextCity);
    localStorage.setItem(CACHE_KEY, nextCity);
    const geocode = mockGeocodeByCity(nextCity);
    addEvent({
      type: 'city_change',
      title: `Significant change detected: ${nextCity}`,
      description: `Mock geocoder resolved (${geocode.lat.toFixed(3)}, ${geocode.lng.toFixed(3)}).`,
      city: nextCity,
    });

    if (lastSavedCity !== nextCity && profile) {
      setIsWritingLocation(true);
      let writeResult = '';
      try {
        if (hasSupabaseEnv) {
          await insertLocationUpdate(profile.id, nextCity);
          writeResult = `Supabase write saved for ${profile.id} in ${nextCity}`;
        } else {
          writeResult = await simulateSupabaseCityWrite(profile.id, nextCity);
        }
      } catch (error) {
        writeResult = error instanceof Error ? `Supabase write failed: ${error.message}` : 'Supabase write failed';
      } finally {
        setIsWritingLocation(false);
      }
      setLastSavedCity(nextCity);
      addEvent({
        type: 'db_write',
        title: 'Location sync attempted',
        description: writeResult,
        city: nextCity,
      });
    }

    const matches = contacts.filter((contact) => contact.city === nextCity);
    if (matches.length === 0) {
      addEvent({
        type: 'system',
        title: 'No nearby contacts',
        description: `No seeded contacts currently in ${nextCity}.`,
        city: nextCity,
      });
      return;
    }

    matches.forEach((contact) => {
      const message = `Hey! Your friend ${contact.name} is currently in ${nextCity}. Reach out and grab a coffee!`;
      setToast({ id: crypto.randomUUID(), message, visible: true });
      notifyUser(message);
      addEvent({
        type: 'friend_nearby',
        title: `${contact.name} is nearby`,
        description: message,
        city: nextCity,
      });
      if (hasSupabaseEnv && profile) {
        insertProximityEvent(profile.id, contact.id, nextCity, message).catch(() => undefined);
      }
    });

    if (hasSupabaseEnv) {
      refreshContactsAndHistory().catch(() => undefined);
    }
  };

  if (isAuthLoading) {
    return <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-stone-100 px-4 py-8">Loading session...</main>;
  }

  const isSignedIn = Boolean(session?.user);
  const isProfileBootstrapping = hasSupabaseEnv && isSignedIn && !profile && !appError;

  if (isProfileBootstrapping) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-stone-100 px-4 py-8">
        <p className="mx-auto mt-16 max-w-md text-center text-sm text-zinc-600">Signed in — setting up your profile…</p>
      </main>
    );
  }

  if (hasSupabaseEnv && isSignedIn && appError && !profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-stone-100 px-4 py-8">
        <ToastBanner toast={toast} />
        <div className="mx-auto mt-10 w-full max-w-md rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-lg backdrop-blur">
          <h2 className="text-lg font-semibold text-zinc-900">Could not load your profile</h2>
          <p className="mt-2 text-sm text-rose-800">{appError}</p>
          <button
            type="button"
            onClick={() => {
              void handleSignOut();
            }}
            className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Sign out and try again
          </button>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-stone-100 px-4 py-8">
        <ToastBanner toast={toast} />
        <AuthGate onAuthenticated={handleOnboardingComplete} onRefreshSession={refreshSessionAfterMagicLink} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-stone-100 px-4 py-5 text-zinc-900">
      <ToastBanner toast={toast} />

      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-4 rounded-3xl border border-orange-100 bg-white/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">FriendApp MVP</p>
              <h1 className="text-xl font-semibold">Hi {profile.name}, welcome back.</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">{profile.avatar}</div>
              <button onClick={handleSignOut} className="rounded-xl bg-zinc-100 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-200">
                Sign out
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1">
              <MapPin size={12} />
              Current: {currentCity}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1">
              <BellRing size={12} />
              Notifications: {notificationPermission}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-1">
              Supabase: {hasSupabaseEnv ? 'configured' : 'mock mode'}
            </span>
            {isWritingLocation && <span className="rounded-full bg-emerald-100 px-2 py-1">Syncing city...</span>}
          </div>
          {notificationPermission !== 'granted' && (
            <button
              onClick={requestNotifications}
              className="mt-3 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800"
            >
              Enable browser notifications
            </button>
          )}
          {appError ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{appError}</p> : null}
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <SimulatorPanel currentCity={currentCity} onSimulateCity={handleSimulatorCitySwitch} />
          <InvitePanel
            createBusy={isCreatingInvite}
            acceptBusy={isAcceptingInvite}
            inviteCodeInput={inviteCodeInput}
            lastCreatedCode={lastInviteCode}
            onInviteCodeInputChange={setInviteCodeInput}
            onCreateInvite={handleCreateInvite}
            onAcceptInvite={handleAcceptInvite}
          />
        </div>

        <div className="mt-4">
          <ContactsPanel
            contacts={contacts}
            currentCity={currentCity}
            isLoading={isContactsLoading}
            error={contactsError}
            sourceLabel={hasSupabaseEnv ? 'supabase' : 'demo'}
          />
        </div>

        <section className="mt-4 rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Nearby right now</h2>
            <div className="inline-flex rounded-xl border border-orange-100 bg-orange-50 p-1">
              <button
                onClick={() => setActiveView('list')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeView === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <List size={13} />
                List View
              </button>
              <button
                onClick={() => setActiveView('map')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeView === 'map' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Map size={13} />
                Map View
              </button>
            </div>
          </div>

          {activeView === 'list' ? (
            nearbyContacts.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-600">No contacts in {currentCity}. Try another simulator city.</p>
            ) : (
              <p className="mt-2 text-sm text-zinc-700">
                {nearbyContacts.map((contact) => contact.name).join(', ')} {nearbyContacts.length > 1 ? 'are' : 'is'} in{' '}
                {currentCity}.
              </p>
            )
          ) : (
            <MapView currentCity={currentCity} contacts={contacts} />
          )}
        </section>

        <div className="mt-4">
          {historyError ? <p className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{historyError}</p> : null}
          <HistoryTimeline events={history} />
        </div>
      </div>
    </main>
  );
}

export default App;
