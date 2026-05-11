'use server';

export async function getNearbyPlaces(address: string, lat?: number | null, lng?: number | null) {
  try {
    let finalLat: number | undefined = lat ?? undefined;
    let finalLng: number | undefined = lng ?? undefined;

    // 1. Geocode the address if coordinates not provided
    if (finalLat === undefined || finalLng === undefined) {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      const geocodeRes = await fetch(geocodeUrl, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'StayCoolBooking/1.0' },
      });
      const geocodeData = await geocodeRes.json();
      finalLat = geocodeData?.[0]?.lat ? parseFloat(geocodeData[0].lat) : undefined;
      finalLng = geocodeData?.[0]?.lon ? parseFloat(geocodeData[0].lon) : undefined;
    }

    if (!finalLat || !finalLng) {
      return { coordinates: null, suggestions: [] };
    }

    // 2. Fetch real nearby places via Overpass API
    // We search for tourism, leisure, and upscale amenities
    const overpassEndpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
      'https://z.overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];

    const query = `
      [out:json][timeout:25];
      (
        node["tourism"~"attraction|museum|viewpoint|zoo|theme_park|gallery|monument"](around:5000, ${finalLat}, ${finalLng});
        node["amenity"~"restaurant|cafe|bar"](around:1500, ${finalLat}, ${finalLng});
        node["leisure"~"park|garden"](around:3000, ${finalLat}, ${finalLng});
      );
      out body 10;
    `;

    let response = null;
    let lastError = null;

    for (const endpoint of overpassEndpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'StayCoolBooking/1.0 (https://staycoolbooking.com)',
            'Accept': 'application/json'
          }
        });

        if (res.ok) {
          response = res;
          break;
        } else {
          const status = res.status;
          console.warn(`Overpass endpoint ${endpoint} failed with status ${status}`);
          lastError = new Error(`Overpass API failed with status ${status}`);
        }
      } catch (err: unknown) {
        console.warn(`Overpass endpoint ${endpoint} connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        lastError = err instanceof Error ? err : new Error('Unknown error');
      }
    }

    if (!response) {
      throw lastError || new Error('All Overpass API endpoints failed');
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
