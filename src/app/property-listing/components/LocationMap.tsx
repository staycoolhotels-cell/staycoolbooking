'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon issues in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Geocoding cache to avoid duplicate API calls ---
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {};

async function geocodeLocation(address: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache[address] !== undefined) return geocodeCache[address];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=in`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'StayCoolBooking/1.0' },
    });
    const data = await res.json();
    if (data && data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache[address] = result;
      return result;
    }
    geocodeCache[address] = null;
    return null;
  } catch (err) {
    console.error('Geocoding failed:', err);
    geocodeCache[address] = null;
    return null;
  }
}

interface LocationMapProps {
  latitude?: number;
  longitude?: number;
  locationName: string;
  address: string;
  nearbyAttractions: Array<{
    name: string;
    distance: string;
    type: string;
  }>;
}

// Component to handle map center updates
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
};

// Custom Marker Icon
const customMarkerIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="
    width: 34px;
    height: 34px;
    background: #0ea5e9;
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg) translate(2px, -2px);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  ">
    <div style="
      width: 10px;
      height: 10px;
      background: white;
      border-radius: 50%;
      transform: rotate(45deg);
    "></div>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

const LocationMap = ({
  latitude,
  longitude,
  locationName,
  address,
  nearbyAttractions,
}: LocationMapProps) => {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const resolveCoords = async () => {
      setError(null);
      // If valid coordinates are provided, use them
      if (latitude && longitude && !(latitude === 32.24 && longitude === 77.18)) {
        setCoords([latitude, longitude]);
        return;
      }
      
      if (!address) {
        setError('No address provided for map location.');
        return;
      }

      const result = await geocodeLocation(address);
      if (result) {
        setCoords([result.lat, result.lng]);
      } else {
        setError('Unable to resolve location coordinates. Falling back to default view.');
      }
    };
    resolveCoords();
  }, [latitude, longitude, address]);

  if (!isMounted) {
    return (
      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-8 min-h-[500px] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-8 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 right-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-4 md:mb-8">
        Location &amp; Nearby
      </h2>

      {/* Location name row */}
      <div className="mb-4 md:mb-8">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/10 flex-shrink-0">
            <Icon name="MapPinIcon" size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm md:text-lg font-bold text-white mb-0.5">
              {locationName}
            </h3>
            <p className="text-xs md:text-sm font-medium text-zinc-400">{address}</p>
          </div>
        </div>
      </div>

      {/* Map — shorter on mobile */}
      <div className="w-full h-48 md:h-96 rounded-2xl overflow-hidden mb-4 md:mb-8 border border-white/10 shadow-lg shadow-black/50 bg-zinc-950 flex items-center justify-center relative p-0 leaflet-dark-container leaflet-dark-detailed">
        {coords ? (
          <MapContainer
            center={coords}
            zoom={14}
            style={{ width: '100%', height: '100%', background: '#111' }}
            zoomControl={true}
            attributionControl={false}
          >
            <ChangeView center={coords} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={coords} icon={customMarkerIcon} />
          </MapContainer>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <Icon name="ExclamationTriangleIcon" size={24} className="text-red-400" />
            </div>
            <div>
              <p className="text-zinc-200 text-sm font-bold mb-1">Map Loading Failed</p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                {error}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-sky-500/10 border border-sky-500/30 rounded-full text-sky-400 text-[10px] font-bold uppercase tracking-widest hover:bg-sky-500/20 transition-all"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400 text-sm font-medium">Loading map engine…</p>
          </div>
        )}
      </div>

      {/* Nearby Attractions */}
      {nearbyAttractions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-3 md:mb-5 flex items-center gap-2">
            <Icon name="SparklesIcon" size={14} />
            <span>Nearby Attractions</span>
            <div className="h-px bg-gradient-to-r from-white/10 to-transparent flex-1 ml-2" />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            {nearbyAttractions.map((attraction, index) => (
              <div
                key={index}
                className="group flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-9 h-9 md:w-12 md:h-12 bg-white/[0.05] rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors border border-white/5 group-hover:border-primary/30">
                  <Icon
                    name={
                      attraction.type === 'restaurant'
                        ? 'BuildingStorefrontIcon'
                        : attraction.type === 'park'
                          ? 'MapIcon'
                          : 'BuildingOffice2Icon'
                    }
                    size={18}
                    className="text-white/70 group-hover:text-primary transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs md:text-sm font-semibold text-white group-hover:text-white transition-colors">
                    {attraction.name}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{attraction.distance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="mt-4 md:mt-8 p-3 md:p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-start space-x-3 backdrop-blur-sm">
        <div className="mt-0.5 flex-shrink-0">
          <Icon
            name="InformationCircleIcon"
            size={18}
            className="text-primary"
          />
        </div>
        <p className="text-xs md:text-sm font-medium text-blue-100/80 leading-relaxed">
          Exact location will be shared after booking confirmation for your safety and privacy.
        </p>
      </div>

      <style jsx global>{`
        .leaflet-dark-container .leaflet-bar a {
          background-color: rgba(24, 24, 27, 0.9) !important;
          color: #fff !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px);
        }
        .leaflet-dark-container .leaflet-bar a:hover {
          background-color: #38bdf8 !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default LocationMap;
