'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GestureHandling } from 'leaflet-gesture-handling';
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';

// Fix for default marker icons in Leaflet with Next.js
const createDefaultIcon = () => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #0ea5e9; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(14,165,233,0.5);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const createHoverIcon = () => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #38bdf8; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px rgba(56,189,248,0.7);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

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

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

// --- Geocoding cache to avoid duplicate API calls ---
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {};

async function geocodeLocation(locationStr: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache[locationStr] !== undefined) return geocodeCache[locationStr];
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationStr)}&format=json&limit=1&countrycodes=in`;
    const osmRes = await fetch(osmUrl, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'StayCoolBooking/1.0' },
    });
    const osmData = await osmRes.json();
    if (osmData && osmData.length > 0) {
      const result = { lat: parseFloat(osmData[0].lat), lng: parseFloat(osmData[0].lon) };
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

const InteractiveMap: React.FC<InteractiveMapProps> = ({ properties, onPropertySelect }) => {
  const [geoProperties, setGeoProperties] = useState<(MapProperty & { lat: number; lng: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // 1. Handle Mounting
  useEffect(() => {
    setIsMounted(true);
    
    // Register GestureHandling only once to avoid duplicate handler errors in dev mode
    if (L.Map && typeof (L.Map as any).addInitHook === 'function') {
      try {
        (L.Map as any).addInitHook('addHandler', 'gestureHandling', GestureHandling);
      } catch (e) {
        // Ignore if already added
      }
    }
    
    return () => {
      setIsMounted(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Geocode properties
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
          !(prop.lat >= 51.0 && prop.lat <= 52.0 && prop.lng >= -0.6 && prop.lng <= 0.4) &&
          !(prop.lat === 0 && prop.lng === 0)
        ) {
          results.push({ ...prop, lat: prop.lat, lng: prop.lng });
          continue;
        }
        if (prop.location) {
          const coords = await geocodeLocation(prop.location);
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

  // 3. Initialize Map (Manual)
  useEffect(() => {
    if (!isMounted || !mapContainerRef.current) return;

    // Safety: check if element already has a map
    // @ts-expect-error - _leaflet_id is a private property of Leaflet
    if (mapContainerRef.current._leaflet_id) {
        // This is exactly the case that causes the crash. We fix it by deleting the ID
        // and clearing the HTML before Leaflet gets a chance to complain.
        // @ts-expect-error - _leaflet_id is a private property of Leaflet
        delete mapContainerRef.current._leaflet_id;
        mapContainerRef.current.innerHTML = '';
    }

    const map = L.map(mapContainerRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      zoomControl: false,
      attributionControl: false,
      gestureHandling: true,
      gestureHandlingOptions: {
        theme: 'dark',
      }
    } as any);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: ''
    }).addTo(map);

    L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      attribution: '',
      zIndex: 1000
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMounted]); // Run once when mounted

  // 4. Update View and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Update view
    map.setView(mapCenter, mapZoom);

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add new markers
    geoProperties.forEach(prop => {
      const marker = L.marker([prop.lat, prop.lng], {
        icon: createDefaultIcon()
      });

      const popupContent = document.createElement('div');
      popupContent.className = 'property-popup-container';
      popupContent.innerHTML = `
        <div class="cursor-pointer overflow-hidden rounded-xl" style="min-width: 180px">
          <div class="h-24 w-full relative overflow-hidden">
            <img src="${prop.image || '/assets/images/no_image.png'}" alt="${prop.title}" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
          <div class="p-3 bg-zinc-900 border-t border-white/10">
            <h4 class="text-white font-bold text-xs mb-1 truncate">${prop.title}</h4>
            <div class="flex items-center gap-1 mb-2 opacity-80">
              <span class="text-zinc-400 text-[9px] font-medium truncate">${prop.location}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sky-400 font-extrabold text-sm">₹${prop.price.toLocaleString('en-IN')}<span class="text-zinc-500 text-[10px] font-normal">/night</span></span>
              <span class="text-[9px] bg-sky-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">View</span>
            </div>
          </div>
        </div>
      `;

      popupContent.onclick = () => onPropertySelect(prop.id);

      marker.bindPopup(popupContent, {
        className: 'property-popup',
        offset: L.point(0, -5),
        closeButton: true
      });

      marker.on('mouseover', () => {
        marker.setIcon(createHoverIcon());
      });

      marker.on('mouseout', () => {
        marker.setIcon(createDefaultIcon());
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

  }, [geoProperties, mapCenter, mapZoom]);

  return (
    <div 
      style={{ width: '100%', position: 'relative' }} 
      className="map-responsive-height h-full min-h-[500px] bg-zinc-950 map-glow-container rounded-[inherit]"
    >
      <div 
        ref={mapContainerRef}
        className="w-full h-full rounded-[inherit] overflow-hidden"
        id="leaflet-container-manual"
      />

      {/* Overlay UI elements */}
      {loading ? (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-200 text-sm font-bold tracking-wide">Mapping your stay…</p>
          </div>
        </div>
      ) : null}
      
      <style jsx global>{`
        .leaflet-container {
          background: #09090b !important;
        }
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        .leaflet-popup-tip {
          background: #18181b !important;
        }
        .leaflet-popup-close-button {
          color: white !important;
          padding: 8px !important;
          z-index: 1000;
        }
        .map-responsive-height {
          height: 100%;
        }
        .map-glow-container {
          position: relative;
          z-index: 1;
          box-shadow: 0 0 30px -10px rgba(14, 165, 233, 0.4);
          transition: box-shadow 0.3s ease;
        }
        .map-glow-container:hover {
          box-shadow: 0 0 50px -10px rgba(14, 165, 233, 0.6);
        }
        .map-glow-container::after {
          content: '';
          position: absolute;
          inset: -1px;
          z-index: -1;
          background: linear-gradient(45deg, rgba(14, 165, 233, 0.3), transparent, rgba(14, 165, 233, 0.3));
          border-radius: inherit;
          padding: 1px;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .map-glow-container::before {
          content: '';
          position: absolute;
          inset: -15px;
          z-index: -2;
          background: radial-gradient(circle at center, rgba(14, 165, 233, 0.15) 0%, transparent 70%);
          border-radius: inherit;
          opacity: 0.6;
          animation: map-glow-pulse 6s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes map-glow-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .property-popup-container img {
          transition: transform 0.5s ease;
        }
        .property-popup-container:hover img {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default InteractiveMap;
