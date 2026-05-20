import { Users } from 'lucide-react';
import type { Contact } from '../types/models';

interface ContactsPanelProps {
  contacts: Contact[];
  currentCity: string;
  isLoading?: boolean;
  error?: string | null;
  sourceLabel?: string;
}

export function ContactsPanel({ contacts, currentCity, isLoading, error, sourceLabel }: ContactsPanelProps) {
  const nearby = contacts.filter((contact) => contact.city === currentCity);

  return (
    <section className="rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-orange-100 p-2 text-orange-700">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Contacts</h2>
            <p className="text-xs text-zinc-600">
              {contacts.length} friends {sourceLabel ? `(${sourceLabel})` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {isLoading ? <p className="text-sm text-zinc-600">Loading friends...</p> : null}
        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {!isLoading && !error && contacts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 px-3 py-2 text-sm text-zinc-600">
            No friends yet. Create or accept an invite.
          </p>
        ) : null}
        {contacts.map((contact) => {
          const isNearby = nearby.some((entry) => entry.id === contact.id);
          return (
            <div
              key={contact.id}
              className={`flex items-center justify-between rounded-2xl border px-3 py-2 ${
                isNearby ? 'border-amber-300 bg-amber-50' : 'border-zinc-100 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-zinc-900 text-center text-xs font-semibold leading-9 text-white">
                  {contact.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{contact.name}</p>
                  <p className="text-xs text-zinc-600">{contact.city}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                  contact.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {isNearby ? 'Nearby' : contact.status}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
