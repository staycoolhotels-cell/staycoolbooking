async function testNominatim() {
  const lat = 16.3067;
  const lon = 80.4365;
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
    headers: { 
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'StayCoolBooking/1.0 (admin@staycoolbooking.com)'
    }
  });
  const data = await res.json();
  console.log('Nominatim Address Result:', JSON.stringify(data.address, null, 2));
}

testNominatim();
