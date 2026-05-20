import { CITY_COORDINATES } from '../data/cities';
import type { AppCity, CityCoordinates } from '../types/models';

export function mockGeocodeByCity(city: AppCity): CityCoordinates {
  return CITY_COORDINATES[city];
}

export function hasSignificantLocationChange(previousCity: AppCity | null, nextCity: AppCity): boolean {
  if (!previousCity) return true;
  return previousCity !== nextCity;
}
