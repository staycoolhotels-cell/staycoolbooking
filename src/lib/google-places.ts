'use server';

export async function getNearbyPlaces(address: string) {
  try {
    // 1. Geocode the address to get lat/lng using free OpenStreetMap Nominatim
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const geocodeRes = await fetch(geocodeUrl, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'StayCoolBooking/1.0' },
    });
    const geocodeData = await geocodeRes.json();

    if (!geocodeData || geocodeData.length === 0) {
      console.warn('Geocoding failed for address (using fallback):', address);
    }

    const lat = geocodeData?.[0]?.lat ? parseFloat(geocodeData[0].lat) : null;
    const lng = geocodeData?.[0]?.lon ? parseFloat(geocodeData[0].lon) : null;

    // 2. Fetch nearby places (Tourist Attractions, Cafes, Parks)
    // We'll provide high-quality mock data for the demo since Google Places requires an active billing account.
    
    // In a real application, you could integrate OpenStreetMap's Overpass API here.
    const allSuggestions = [
      {
        name: 'Local City Center Park',
        type: 'Spot',
        distance: '0.8 km',
        icon: 'SunIcon',
        rating: 4.5,
        address: 'Downtown area',
      },
      {
        name: 'Sunset View Cafe',
        type: 'Cafe',
        distance: '1.2 km',
        icon: 'BuildingStorefrontIcon',
        rating: 4.7,
        address: 'Main Street 4th Ave',
      },
      {
        name: 'Historical Museum',
        type: 'Famous Place',
        distance: '2.5 km',
        icon: 'MapPinIcon',
        rating: 4.2,
        address: 'Heritage Square',
      }
    ];

    return {
      coordinates: lat !== null && lng !== null ? { lat, lng } : null,
      suggestions: allSuggestions,
    };
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    // Even on network error, return mock data so UI doesn't break
    return {
      coordinates: null,
      suggestions: [
        {
          name: 'Local City Center Park',
          type: 'Spot',
          distance: '0.8 km',
          icon: 'SunIcon',
          rating: 4.5,
          address: 'Downtown area',
        }
      ],
    };
  }
}
