import { MapPinned, Navigation } from 'lucide-react';
import { SIMULATOR_CITIES } from '../data/cities';
import type { AppCity } from '../types/models';

interface SimulatorPanelProps {
  currentCity: AppCity;
  onSimulateCity: (city: AppCity) => void;
}

export function SimulatorPanel({ currentCity, onSimulateCity }: SimulatorPanelProps) {
  return (
    <section className="rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
          <MapPinned size={18} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Developer Simulator</h2>
          <p className="text-xs text-zinc-600">Current city: {currentCity}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SIMULATOR_CITIES.map((city) => (
          <button
            key={city}
            onClick={() => onSimulateCity(city)}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
              city === currentCity
                ? 'bg-zinc-900 text-white'
                : 'bg-orange-50 text-zinc-700 hover:bg-orange-100'
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <Navigation size={14} />
              {city}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
