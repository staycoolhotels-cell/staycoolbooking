'use server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function getNearbyPlaces(address: string) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API Key is missing');
    return null;
  }

  try {
    // 1. Geocode the address to get lat/lng
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
      console.error('Geocoding failed:', geocodeData.status);
      return null;
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // 2. Fetch nearby places (Tourist Attractions, Cafes, Parks)
    // We'll do three separate searches for better results or one with multiple types if supported.
    // Google Places API Nearby Search supports one type per request normally.
    
    const fetchPlacesByType = async (type: string) => {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      return res.json();
    };

    const [attractions, cafes, parks] = await Promise.all([
      fetchPlacesByType('tourist_attraction'),
      fetchPlacesByType('cafe'),
      fetchPlacesByType('park'),
    ]);

    const formatPlaces = (data: any, type: string) => {
      if (data.status !== 'OK' || !data.results) return [];
      return data.results.slice(0, 3).map((place: any) => ({
        name: place.name,
        type: type === 'tourist_attraction' ? 'Famous Place' : type === 'cafe' ? 'Cafe' : 'Spot',
        distance: 'Nearby', // In a real app, we could calculate distance using distance matrix API
        icon: type === 'cafe' ? 'BuildingStorefrontIcon' : type === 'park' ? 'SunIcon' : 'MapPinIcon',
        rating: place.rating,
        address: place.vicinity,
      }));
    };

    const allSuggestions = [
      ...formatPlaces(attractions, 'tourist_attraction'),
      ...formatPlaces(cafes, 'cafe'),
      ...formatPlaces(parks, 'park'),
    ];

    return {
      coordinates: { lat, lng },
      suggestions: allSuggestions,
    };
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return null;
  }
}
