import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { CITY_COORDINATES } from '../data/cities';
import type { AppCity, Contact } from '../types/models';

interface MapViewProps {
  currentCity: AppCity;
  contacts: Contact[];
}

const friendArrivalByCity: Record<AppCity, string> = {
  London: '18m ago',
  Paris: '42m ago',
  Eindhoven: '9m ago',
  'New York': '1h ago',
  Berlin: '28m ago',
  Lisbon: '34m ago',
};

const userIcon = L.divIcon({
  className: 'map-user-pin',
  html: `<div class="map-user-pin__dot"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function getFriendIcon(avatar: string) {
  return L.divIcon({
    className: 'map-friend-pin',
    html: `<div class="map-friend-pin__avatar">${avatar}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -14],
  });
}

function AnimatedMapCenter({ currentCity }: { currentCity: AppCity }) {
  const map = useMap();

  useEffect(() => {
    const { lat, lng } = CITY_COORDINATES[currentCity];
    map.flyTo([lat, lng], 4.7, { duration: 1.1, easeLinearity: 0.3 });
  }, [currentCity, map]);

  return null;
}

export function MapView({ currentCity, contacts }: MapViewProps) {
  const userPosition = CITY_COORDINATES[currentCity];
  const mapContacts = useMemo(
    () =>
      contacts.map((contact) => ({
        ...contact,
        coordinates: CITY_COORDINATES[contact.city],
        arrivedAgo: friendArrivalByCity[contact.city],
      })),
    [contacts],
  );

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-orange-100">
      <MapContainer
        center={[userPosition.lat, userPosition.lng]}
        zoom={4.7}
        minZoom={3}
        scrollWheelZoom
        className="friend-map h-[440px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AnimatedMapCenter currentCity={currentCity} />

        <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
          <Tooltip permanent direction="top" offset={[0, -16]} className="map-user-tooltip">
            You (Simulated)
          </Tooltip>
        </Marker>

        {mapContacts.map((contact) => (
          <Marker
            key={contact.id}
            position={[contact.coordinates.lat, contact.coordinates.lng]}
            icon={getFriendIcon(contact.avatar)}
          >
            <Popup className="friend-popup" closeButton={false}>
              <div className="w-52">
                <p className="text-sm font-semibold text-zinc-900">{contact.name}</p>
                <p className="mt-0.5 text-xs text-zinc-600">{contact.city}</p>
                <p className="mt-2 text-xs text-zinc-500">Arrived {contact.arrivedAgo}</p>
                <button className="mt-3 w-full rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-800">
                  Message {contact.name.split(' ')[0]}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
