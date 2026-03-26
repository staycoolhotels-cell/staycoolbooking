'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

interface MapProperty {
  id: string | number;
  lat?: number;
  lng?: number;
  title: string;
  price: number;
  available: boolean;
  image: string;
  location?: string;
}

interface InteractiveMapProps {
  properties: MapProperty[];
  onPropertySelect: (id: string | number) => void;
}

// --- Geocoding cache to avoid duplicate API calls ---
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {};

async function geocodeLocation(locationStr: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache[locationStr] !== undefined) return geocodeCache[locationStr];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationStr)}&format=json&limit=1&countrycodes=in`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'StayCoolBooking/1.0' },
    });
    const data = await res.json();
    if (data && data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache[locationStr] = result;
      return result;
    }
    geocodeCache[locationStr] = null;
    return null;
  } catch {
    geocodeCache[locationStr] = null;
    return null;
  }
}

// India center fallback
const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

const mapContainerStyle = {
  width: '100%',
  height: '750px',
};

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#023e58' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255761' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b0d5ce' }] },
  { featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{ color: '#023e58' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'transit', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'transit.line', elementType: 'geometry.fill', stylers: [{ color: '#283d6a' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#3a4762' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];

const GoogleMapInner: React.FC<InteractiveMapProps> = ({ properties, onPropertySelect }) => {
  const [geoProperties, setGeoProperties] = useState<(MapProperty & { lat: number; lng: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // Geocode all property locations
  useEffect(() => {
    if (!properties || properties.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const geocodeAll = async () => {
      const results: (MapProperty & { lat: number; lng: number })[] = [];
      for (const prop of properties) {
        if (
          prop.lat &&
          prop.lng &&
          !(prop.lat >= 51.0 && prop.lat <= 52.0 && prop.lng >= -0.6 && prop.lng <= 0.4)
        ) {
          results.push({ ...prop, lat: prop.lat, lng: prop.lng });
          continue;
        }
        if (prop.location) {
          const locationParts = prop.location.split(',');
          let coords = null;
          for (const part of locationParts) {
            coords = await geocodeLocation(part.trim());
            if (coords) break;
          }
          if (!coords) coords = await geocodeLocation(prop.location);
          if (coords) {
            results.push({ ...prop, lat: coords.lat, lng: coords.lng });
          }
        }
      }
      setGeoProperties(results);
      setLoading(false);
    };
    geocodeAll();
  }, [properties]);

  const mapCenter = useMemo(() => {
    if (geoProperties.length === 0) return INDIA_CENTER;
    if (geoProperties.length === 1) return { lat: geoProperties[0].lat, lng: geoProperties[0].lng };
    const avgLat = geoProperties.reduce((s, p) => s + p.lat, 0) / geoProperties.length;
    const avgLng = geoProperties.reduce((s, p) => s + p.lng, 0) / geoProperties.length;
    return { lat: avgLat, lng: avgLng };
  }, [geoProperties]);

  const mapZoom = useMemo(() => {
    if (geoProperties.length === 0) return 5;
    if (geoProperties.length === 1) return 12;
    return 6;
  }, [geoProperties]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm font-medium">Loading map…</p>
        </div>
      </div>
    );
  }

  const renderPropertyCard = (prop: MapProperty & { lat: number; lng: number }) => (
    <div 
      style={{
        width: 210,
        background: 'rgba(15,15,20,0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(14,165,233,0.15)',
        fontFamily: 'system-ui,-apple-system,sans-serif',
        cursor: 'pointer',
      }}
      onClick={() => onPropertySelect(prop.id)}
    >
      <div style={{ width: '100%', height: 110, overflow: 'hidden', position: 'relative' }}>
        <img
          src={prop.image || '/assets/images/no_image.png'}
          alt={prop.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#f4f4f5', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {prop.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: 13 }}>
            ₹{prop.price.toLocaleString('en-IN')}<span style={{ color: '#71717a', fontWeight: 400, fontSize: 11 }}>/night</span>
          </span>
          <span style={{
            background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 999,
            letterSpacing: '0.04em',
          }}>View →</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', height: '750px', position: 'relative' }}>
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-300 text-sm font-semibold">Finding properties on map…</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-5 py-2.5 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
        <p className="text-white text-xs font-bold tracking-wide">
          🗺️ Explore Properties on the Map
        </p>
        <p className="text-zinc-400 text-[10px] text-center mt-0.5">
          {geoProperties.length} propert{geoProperties.length === 1 ? 'y' : 'ies'} located across India
        </p>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={mapZoom}
        options={{
          styles: darkMapStyle,
          disableDefaultUI: false,
          zoomControl: true,
        }}
      >
        {geoProperties.map((prop) => (
          <Marker
            key={prop.id}
            position={{ lat: prop.lat, lng: prop.lng }}
            icon={{
              path: "M11 0C4.925 0 0 4.925 0 11C0 18.5 11 34 11 34C11 34 22 18.5 22 11C22 4.925 17.075 0 11 0Z",
              fillColor: hoveredId === prop.id ? "#38bdf8" : "#0ea5e9",
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: "#ffffff",
              scale: hoveredId === prop.id ? 1.15 : 1,
              anchor: new google.maps.Point(11, 34),
            }}
            onMouseOver={() => !isTouchDevice && setHoveredId(prop.id)}
            onMouseOut={() => !isTouchDevice && setHoveredId(null)}
            onClick={() => {
              if (isTouchDevice) {
                setSelectedId(selectedId === prop.id ? null : prop.id);
              } else {
                onPropertySelect(prop.id);
              }
            }}
          >
            {((!isTouchDevice && hoveredId === prop.id) || (isTouchDevice && selectedId === prop.id)) && (
              <InfoWindow
                position={{ lat: prop.lat, lng: prop.lng }}
                onCloseClick={() => {
                  setHoveredId(null);
                  setSelectedId(null);
                }}
                options={{
                  pixelOffset: new google.maps.Size(0, -34),
                }}
              >
                {renderPropertyCard(prop)}
              </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>
      
      {/* Inject styles for Google Maps InfoWindow to make it transparent/clean */}
      <style jsx global>{`
        .gm-style-iw {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          max-width: none !important;
        }
        .gm-style-iw-d {
          background: transparent !important;
          overflow: hidden !important;
          padding: 0 !important;
          max-height: none !important;
        }
        .gm-style-iw-tc::after {
          display: none !important;
        }
        .gm-ui-hover-effect {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

// Wrapper with SSR disabled
const InteractiveMap = (props: InteractiveMapProps) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm font-medium">Initialising map…</p>
        </div>
      </div>
    );
  }
  return <GoogleMapInner {...props} />;
};

export default InteractiveMap;
