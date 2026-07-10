'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Navigation, Map as MapIcon, LocateFixed } from 'lucide-react';

// Fix for default marker icons in Leaflet with Next.js/Webpack
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// Explicitly set the default icon
L.Marker.prototype.options.icon = DefaultIcon;

// Bulletproof global safety wrapper for Leaflet map prototype to prevent '_leaflet_pos' and 'offsetWidth' null reference crashes
if (typeof window !== 'undefined' && L && L.Map && L.Map.prototype) {
  const originalGetSize = L.Map.prototype.getSize;
  L.Map.prototype.getSize = function(this: L.Map) {
    // @ts-expect-error - internal leaflet reference
    if (!this._container) {
      return L.point(0, 0);
    }
    return originalGetSize.call(this);
  };

  const originalInvalidateSize = L.Map.prototype.invalidateSize;
  L.Map.prototype.invalidateSize = function(this: L.Map, options?: any) {
    // @ts-expect-error - internal leaflet reference
    if (!this._container) {
      return this;
    }
    return originalInvalidateSize.call(this, options);
  };
}

interface MapPickerContentProps {
  lat?: number;
  lng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressSelect?: (address: any) => void;
  address?: string;
}

const MapPickerContent = ({ lat, lng, onLocationSelect, onAddressSelect, address }: MapPickerContentProps) => {
  const [ready, setReady] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const isMapClickUpdateRef = useRef(false);
  const lastSearchedAddressRef = useRef<string>('');

  useEffect(() => {
    setReady(true);
    return () => setReady(false);
  }, []);

  // Map Tile Configurations
  const TILE_LAYERS = {
    street: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    satellite: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
  };

  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;

    // Safety: check if element already has a map
    // @ts-expect-error - _leaflet_id is a private property of Leaflet
    if (containerRef.current._leaflet_id) {
      // @ts-expect-error - _leaflet_id is a private property of Leaflet
      delete containerRef.current._leaflet_id;
      containerRef.current.innerHTML = '';
    }

    const initialLat = lat || 20.5937;
    const initialLng = lng || 78.9629;
    const initialZoom = lat && lng ? 17 : 5;

    // Initialize map
    const map = L.map(containerRef.current, {
      zoomControl: false, // Custom zoom control for better aesthetics
      attributionControl: false,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false
    });

    // Safety wrapper to prevent post-unmount crashes
    const originalGetSize = map.getSize;
    map.getSize = function(this: L.Map) {
      // @ts-expect-error - internal leaflet reference
      if (!this._container) return L.point(0, 0);
      return originalGetSize.call(this);
    };
    const originalInvalidateSize = map.invalidateSize;
    map.invalidateSize = function(this: L.Map, options?: any) {
      // @ts-expect-error - internal leaflet reference
      if (!this._container) return this;
      return originalInvalidateSize.call(this, options);
    };

    map.setView([initialLat, initialLng], initialZoom);
    mapRef.current = map;

    // Add Zoom Control at a better position
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Tile Layer
    const tileLayer = L.tileLayer(TILE_LAYERS[mapType], {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxZoom: 20,
      detectRetina: true,
      attribution: '&copy; Google Maps'
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Initial Marker
    if (lat && lng) {
      const marker = L.marker([lat, lng], { icon: DefaultIcon }).addTo(map);
      markerRef.current = marker;
    }

    // Fix for map not filling container on initial load or layout change
    const resizeObserver = new ResizeObserver(() => {
      // @ts-expect-error - internal leaflet reference
      if (map && map._container && map._panes && map._panes.mapPane) {
        map.invalidateSize();
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Small timeout as a fallback
    const timeoutId = setTimeout(() => {
      // @ts-expect-error - internal leaflet reference
      if (map && map._container && map._panes && map._panes.mapPane) {
        map.invalidateSize();
      }
    }, 500);

    const fetchAddress = async (lat: number, lng: number) => {
      if (!onAddressSelect) return;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&email=admin@staycoolbooking.com`,
          { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data && data.address) {
          onAddressSelect(data.address);
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
      }
    };

    // Map Click Event
    map.on('click', async (e: L.LeafletMouseEvent) => {
      isMapClickUpdateRef.current = true;
      const { lat: newLat, lng: newLng } = e.latlng;
      
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        const marker = L.marker(e.latlng, { icon: DefaultIcon }).addTo(map);
        markerRef.current = marker;
      }

      onLocationSelect(newLat, newLng);
      map.setView(e.latlng, Math.max(map.getZoom(), 17), { animate: false });
      
      // Fetch address components
      await fetchAddress(newLat, newLng);
      setTimeout(() => {
        isMapClickUpdateRef.current = false;
      }, 1000);
    });

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
      if (mapRef.current) {
        try {
          mapRef.current.stop();
          mapRef.current.remove();
        } catch (e) {
          console.warn("Leaflet cleanup error:", e);
        }
        mapRef.current = null;
        markerRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [ready]);

  // Handle map type switching
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(TILE_LAYERS[mapType]);
    }
  }, [mapType]);

  // Handle outside position updates
  useEffect(() => {
    if (lat && lng && mapRef.current) {
      const newPos: L.LatLngExpression = [lat, lng];
      mapRef.current.setView(newPos, Math.max(mapRef.current.getZoom(), 17), { animate: false });
      
      if (markerRef.current) {
        markerRef.current.setLatLng(newPos);
      } else {
        markerRef.current = L.marker(newPos, { icon: DefaultIcon }).addTo(mapRef.current);
      }
    }
  }, [lat, lng]);

  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const handleLocateMe = () => {
    if (!mapRef.current) return;
    if (!navigator.geolocation) {
      setLocateError('GPS మీ browser లో support కాదు');
      setTimeout(() => setLocateError(null), 4000);
      return;
    }

    setIsLocating(true);
    setLocateError(null);
    isMapClickUpdateRef.current = true;
    mapRef.current.locate({ setView: false });

    mapRef.current.once('locationfound', async (e) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      if (mapRef.current) {
        mapRef.current.setView(e.latlng, 17, { animate: false });
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = L.marker(e.latlng, { icon: DefaultIcon }).addTo(mapRef.current);
        }
      }
      onLocationSelect(newLat, newLng);

      // Fetch address components
      if (onAddressSelect) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1&email=admin@staycoolbooking.com`,
            { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
          );
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          if (data && data.address) {
            onAddressSelect(data.address);
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
        }
      }
      setIsLocating(false);
      setTimeout(() => {
        isMapClickUpdateRef.current = false;
      }, 1000);
    });

    mapRef.current.once('locationerror', (e) => {
      setIsLocating(false);
      isMapClickUpdateRef.current = false;
      if (e.code === 1) {
        // Permission denied
        setLocateError('Location permission denied. Browser settings లో allow చేయండి.');
      } else if (e.code === 2) {
        setLocateError('GPS signal దొరకలేదు. మళ్ళీ try చేయండి.');
      } else {
        setLocateError('Location కనుగొనడం సాధ్యం కాలేదు.');
      }
      setTimeout(() => setLocateError(null), 5000);
    });
  };

  const handleFindOnMap = React.useCallback(async () => {
    if (!address || address.trim() === '' || address.trim() === lastSearchedAddressRef.current) return;
    lastSearchedAddressRef.current = address.trim();
    
    const addressParts = address.split(',').map(p => p.trim()).filter(Boolean);
    
    for (let i = 0; i < addressParts.length; i++) {
      const searchStr = addressParts.slice(i).join(', ');
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchStr)}&limit=1&email=admin@staycoolbooking.com`,
          { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data && data.length > 0) {
          const newLat = parseFloat(data[0].lat);
          const newLng = parseFloat(data[0].lon);
          onLocationSelect(newLat, newLng);
          if (mapRef.current) {
            mapRef.current.setView([newLat, newLng], 17, { animate: false });
          }
          return;
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      }
      
      // Delay to respect Nominatim rate limits (max 1 req/s)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [address, onLocationSelect]);



  return (
    <div className="relative w-full h-full group overflow-hidden rounded-xl border border-white/10 shadow-2xl">
      {!ready && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest text-xs z-[500]">
          Initializing HD Map...
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="w-full h-full z-0" 
      />

      {/* Floating Controls Layer */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        {/* Style Switcher */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/20 p-1 rounded-xl flex gap-1 shadow-2xl">
          <button
            type="button"
            onClick={() => setMapType('street')}
            className={`p-2 rounded-lg transition-all ${mapType === 'street' ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20' : 'text-white hover:bg-white/10'}`}
            title="Street View"
          >
            <MapIcon size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMapType('satellite')}
            className={`p-2 rounded-lg transition-all ${mapType === 'satellite' ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20' : 'text-white hover:bg-white/10'}`}
            title="Satellite View"
          >
            <Layers size={18} />
          </button>
        </div>

        {/* Locate Me */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className={`bg-black/60 backdrop-blur-xl border border-white/20 p-2.5 rounded-xl text-white transition-all shadow-2xl active:scale-95 ${isLocating ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/10'}`}
          title="My Location"
        >
          <LocateFixed size={18} className={isLocating ? 'animate-spin text-sky-400' : ''} />
        </button>

        {/* Error Toast for location failure */}
        {locateError && (
          <div className="bg-red-500/90 backdrop-blur-xl border border-red-400/30 px-3 py-2 rounded-xl text-white text-[11px] font-bold shadow-2xl max-w-[200px] leading-snug">
            {locateError}
          </div>
        )}
      </div>

      {/* Address Sync Button */}
      {address && (
        <div className="absolute top-4 left-4 z-[400]">
          <button
            type="button"
            onClick={handleFindOnMap}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-black px-4 py-2.5 rounded-xl font-bold text-xs shadow-xl shadow-sky-500/20 transition-all active:scale-95 group/btn"
          >
            <Navigation size={14} className="group-hover/btn:rotate-45 transition-transform" />
            Find Property Address
          </button>
        </div>
      )}

      {/* Bottom Tip Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-2xl transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
          <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em] whitespace-nowrap">
            Tap map to pin exact location
          </p>
        </div>
      </div>

      {/* Branding Overlay */}
      <div className="absolute bottom-4 right-14 z-[400] pointer-events-none flex items-center gap-2 opacity-50">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[9px] font-medium text-white uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">HD Map Active</span>
      </div>
    </div>
  );
};

export default MapPickerContent;
