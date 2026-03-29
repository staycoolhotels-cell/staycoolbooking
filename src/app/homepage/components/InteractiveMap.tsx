'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

// Component to handle map center/zoom updates
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Custom Marker Icon to match the premium style
const createCustomIcon = (isHovered: boolean) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="
    width: ${isHovered ? '32px' : '28px'};
    height: ${isHovered ? '32px' : '28px'};
    background: ${isHovered ? '#38bdf8' : '#0ea5e9'};
    border: 2px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg) translate(2px, -2px);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  ">
    <div style="
      width: 10px;
      height: 10px;
      background: rgba(255,255,255,0.9);
      border-radius: 50%;
      transform: rotate(45deg);
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
    "></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const LeafletMapInner: React.FC<InteractiveMapProps> = ({ properties, onPropertySelect }) => {
  const [geoProperties, setGeoProperties] = useState<(MapProperty & { lat: number; lng: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);

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

  const mapCenter = useMemo((): [number, number] => {
    if (geoProperties.length === 0) return INDIA_CENTER;
    if (geoProperties.length === 1) return [geoProperties[0].lat, geoProperties[0].lng];
    const avgLat = geoProperties.reduce((s, p) => s + p.lat, 0) / geoProperties.length;
    const avgLng = geoProperties.reduce((s, p) => s + p.lng, 0) / geoProperties.length;
    return [avgLat, avgLng];
  }, [geoProperties]);

  const mapZoom = useMemo(() => {
    if (geoProperties.length === 0) return 5;
    if (geoProperties.length === 1) return 12;
    return 6;
  }, [geoProperties]);

  const renderPropertyCard = (prop: MapProperty & { lat: number; lng: number }) => (
    <div 
      className="leaflet-property-card"
      style={{
        width: 210,
        background: 'rgba(15,15,20,0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(14,165,233,0.2)',
        fontFamily: 'system-ui,-apple-system,sans-serif',
        cursor: 'pointer',
      }}
      onClick={() => onPropertySelect(prop.id)}
    >
      <div style={{ width: '100%', height: 115, overflow: 'hidden', position: 'relative' }}>
        <img
          src={prop.image || '/assets/images/no_image.png'}
          alt={prop.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#f4f4f5', lineHeight: 1.4, marginBottom: 6, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {prop.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: 14 }}>
            ₹{prop.price.toLocaleString('en-IN')}<span style={{ color: '#a1a1aa', fontWeight: 400, fontSize: 11 }}>/night</span>
          </span>
          <span style={{
            background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 999,
            letterSpacing: '0.04em',
            boxShadow: '0 2px 8px rgba(14,165,233,0.3)',
          }}>View →</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', height: '750px', position: 'relative' }} className="leaflet-dark-container leaflet-dark-detailed">
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-200 text-sm font-bold tracking-wide">Mapping your stay…</p>
          </div>
        </div>
      )}

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center">
        <p className="text-white text-xs font-black tracking-widest uppercase mb-1">
          Explore Properties
        </p>
        <div className="h-0.5 w-12 bg-sky-500 rounded-full mb-1" />
        <p className="text-zinc-400 text-[10px] font-bold">
          {geoProperties.length} active listings found
        </p>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%', background: '#111' }}
        zoomControl={true}
        attributionControl={false}
      >
        <ChangeView center={mapCenter} zoom={mapZoom} />
        
        {/* Use standard OSM + detailed filter applied via CSS class leaflet-dark-detailed */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geoProperties.map((prop) => (
          <Marker
            key={prop.id}
            position={[prop.lat, prop.lng]}
            icon={createCustomIcon(hoveredId === prop.id)}
            eventHandlers={{
              mouseover: () => setHoveredId(prop.id),
              mouseout: () => setHoveredId(null),
              click: () => onPropertySelect(prop.id),
            }}
          >
            <Popup className="premium-popup" minWidth={210}>
              {renderPropertyCard(prop)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <style jsx global>{`
        .leaflet-container {
          font-family: inherit;
        }
        .premium-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .premium-popup .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        .premium-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .premium-popup .leaflet-popup-close-button {
          display: none !important;
        }
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

// Wrapper with SSR disabled
const InteractiveMap = (props: InteractiveMapProps) => {
  const [isMounted, setIsMounted] = React.useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) {
    return (
      <div className="w-full h-[750px] flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Initialising Map Engine</p>
        </div>
      </div>
    );
  }
  return <LeafletMapInner {...props} />;
};

export default InteractiveMap;
