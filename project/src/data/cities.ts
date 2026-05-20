import type { AppCity, CityCoordinates } from '../types/models';

export const CITY_COORDINATES: Record<AppCity, CityCoordinates> = {
  London: { city: 'London', lat: 51.5072, lng: -0.1276 },
  Paris: { city: 'Paris', lat: 48.8566, lng: 2.3522 },
  Eindhoven: { city: 'Eindhoven', lat: 51.4416, lng: 5.4697 },
  'New York': { city: 'New York', lat: 40.7128, lng: -74.006 },
  Berlin: { city: 'Berlin', lat: 52.52, lng: 13.405 },
  Lisbon: { city: 'Lisbon', lat: 38.7223, lng: -9.1393 },
};

export const SIMULATOR_CITIES: AppCity[] = ['London', 'Paris', 'Eindhoven', 'New York'];
