'use server';

import { unstable_cache } from 'next/cache';

// In-memory cache for ultra-fast same-instance resolution
const memoryPlacesCache = new Map<string, { coordinates: { lat: number; lng: number } | null; suggestions: any[] }>();

async function fetchNearbyPlacesInternal(address: string, lat?: number | null, lng?: number | null) {
  try {
    let finalLat: number | undefined = lat ?? undefined;
    let finalLng: number | undefined = lng ?? undefined;

    // 1. Geocode the address if coordinates not provided
    if (finalLat === undefined || finalLng === undefined) {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
      try {
        const geocodeRes = await fetch(geocodeUrl, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'StayCoolBooking/1.0' },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const geocodeData = await geocodeRes.json();
        finalLat = geocodeData?.[0]?.lat ? parseFloat(geocodeData[0].lat) : undefined;
        finalLng = geocodeData?.[0]?.lon ? parseFloat(geocodeData[0].lon) : undefined;
      } catch {
        clearTimeout(timeoutId);
      }
    }

    if (!finalLat || !finalLng) {
      return { coordinates: null, suggestions: [] };
    }

    // 2. Fetch real nearby places via Overpass API with strict 2.5s timeout
    const overpassEndpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];

    const query = `
      [out:json][timeout:5];
      (
        node["tourism"~"attraction|museum|viewpoint|zoo|theme_park|gallery|monument"](around:5000, ${finalLat}, ${finalLng});
        node["amenity"~"restaurant|cafe|bar"](around:1500, ${finalLat}, ${finalLng});
        node["leisure"~"park|garden"](around:3000, ${finalLat}, ${finalLng});
      );
      out body 10;
    `;

    let response = null;

    for (const endpoint of overpassEndpoints) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s max timeout per endpoint
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'StayCoolBooking/1.0 (https://staycoolbooking.com)',
            'Accept': 'application/json'
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          response = res;
          break;
        }
      } catch {
        clearTimeout(timeoutId);
      }
    }

    if (!response) {
      // Fallback quickly with coordinates so map can still render without suggestions
      return { coordinates: { lat: finalLat, lng: finalLng }, suggestions: [] };
    }
    
    const data = await response.json();
    
    // Haversine formula helper
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return (R * c).toFixed(1);
    };

    const suggestions = (data.elements || [])
      .filter((el: { tags?: Record<string, string>; lat: number; lon: number }) => el.tags && (el.tags.name || el.tags['name:en']))
      .map((el: { tags: Record<string, string>; lat: number; lon: number }) => {
        const dist = calculateDistance(finalLat!, finalLng!, el.lat, el.lon);
        let type = 'Attraction';
        if (el.tags.amenity === 'cafe' || el.tags.amenity === 'restaurant') type = 'Cafe';
        if (el.tags.leisure === 'park' || el.tags.tourism === 'park') type = 'Spot';

        return {
          name: el.tags['name:en'] || el.tags.name,
          type: type,
          distance: `${dist} km`,
          icon: type === 'Cafe' ? 'BuildingStorefrontIcon' : type === 'Spot' ? 'SunIcon' : 'MapPinIcon',
          rating: 4.5, // Mock rating as OSM doesn't have it
          address: el.tags['addr:street'] || 'Nearby',
        };
      })
      .sort((a: { distance: string }, b: { distance: string }) => parseFloat(a.distance) - parseFloat(b.distance));

    return {
      coordinates: { lat: finalLat, lng: finalLng },
      suggestions: suggestions.slice(0, 4), // Top 4 closest
    };
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return { coordinates: null, suggestions: [] };
  }
}

export async function getNearbyPlaces(address: string, lat?: number | null, lng?: number | null) {
  const cacheKey = `${address}_${lat ?? ''}_${lng ?? ''}`;
  if (memoryPlacesCache.has(cacheKey)) {
    return memoryPlacesCache.get(cacheKey)!;
  }

  const result = await fetchNearbyPlacesInternal(address, lat, lng);
  memoryPlacesCache.set(cacheKey, result);
  return result;
}
