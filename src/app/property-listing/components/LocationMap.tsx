'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

// --- Geocoding cache to avoid duplicate API calls ---
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {};

async function geocodeLocation(locationStr: string): Promise<{ lat: number; lng: number } | null> {
  if (!locationStr || locationStr.trim() === '') return null;
  if (geocodeCache[locationStr] !== undefined) return geocodeCache[locationStr];
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error('API Key missing');
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationStr)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.results[0]) {
      const result = data.results[0].geometry.location;
      geocodeCache[locationStr] = result;
      return result;
    }
    
    if (data.status === 'REQUEST_DENIED') {
      console.error('Geocoding API access denied. Ensure "Geocoding API" is enabled in Google Cloud Console.');
    }
    
    geocodeCache[locationStr] = null;
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    geocodeCache[locationStr] = null;
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

const mapContainerStyle = {
  width: '100%',
  height: '100%',
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

const LocationMap = ({
  latitude,
  longitude,
  locationName,
  address,
  nearbyAttractions,
}: LocationMapProps) => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    const resolveCoords = async () => {
      setError(null);
      // If valid coordinates are provided, use them
      if (latitude && longitude && !(latitude === 32.24 && longitude === 77.18)) {
        setCoords({ lat: latitude, lng: longitude });
        return;
      }
      
      if (!address) {
        setError('No address provided for map location.');
        return;
      }

      // Otherwise geocode the address
      const result = await geocodeLocation(address);
      if (result) {
        setCoords(result);
      } else {
        setError('Unable to resolve location coordinates. Please ensure Google Geocoding API is enabled.');
      }
    };
    resolveCoords();
  }, [latitude, longitude, address]);

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  if (!isLoaded) {
    return (
      <div className="bg-card rounded-xl p-4 md:p-8 border border-border">
        <div className="h-48 md:h-96 bg-muted animate-pulse rounded-lg"></div>
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
      <div className="w-full h-48 md:h-96 rounded-2xl overflow-hidden mb-4 md:mb-8 border border-white/10 shadow-lg shadow-black/50 bg-zinc-900 flex items-center justify-center relative p-6">
        {coords ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={coords}
            zoom={14}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              styles: darkMapStyle,
              disableDefaultUI: true,
              zoomControl: true,
            }}
          >
            <Marker 
              position={coords}
              icon={{
                path: "M11 0C4.925 0 0 4.925 0 11C0 18.5 11 34 11 34C11 34 22 18.5 22 11C22 4.925 17.075 0 11 0Z",
                fillColor: "#0ea5e9",
                fillOpacity: 1,
                strokeWeight: 1,
                strokeColor: "#ffffff",
                scale: 1,
                anchor: new google.maps.Point(11, 34),
              }}
            />
          </GoogleMap>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <Icon name="ExclamationTriangleIcon" size={24} className="text-red-400" />
            </div>
            <div>
              <p className="text-zinc-200 text-sm font-bold mb-1">Map Loading Failed</p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Google Geocoding API is not activated for this key. Please enable it in the Google Cloud Console.
              </p>
            </div>
            <a 
              href="https://console.cloud.google.com/google/maps-apis/api-list" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-sky-500/10 border border-sky-500/30 rounded-full text-sky-400 text-[10px] font-bold uppercase tracking-widest hover:bg-sky-500/20 transition-all font-sans"
            >
              Open Console
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400 text-sm font-medium">Loading map…</p>
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
    </div>
  );
};

export default LocationMap;
