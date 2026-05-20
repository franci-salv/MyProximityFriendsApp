import { Clock3 } from 'lucide-react';
import type { HistoryEvent } from '../types/models';

interface HistoryTimelineProps {
  events: HistoryEvent[];
}

export function HistoryTimeline({ events }: HistoryTimelineProps) {
  return (
    <section className="rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-rose-100 p-2 text-rose-700">
          <Clock3 size={18} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Proximity History</h2>
          <p className="text-xs text-zinc-600">Recent location + friend events</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500">
          No events yet. Start by changing your city in the simulator.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {events.map((event) => (
            <li key={event.id} className="rounded-2xl border border-zinc-100 bg-white p-3">
              <p className="text-sm font-medium text-zinc-900">{event.title}</p>
              <p className="mt-1 text-xs text-zinc-600">{event.description}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-400">
                {new Date(event.createdAt).toLocaleTimeString()} - {event.city}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
