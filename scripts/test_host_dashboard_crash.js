const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testAllHosts() {
  const { data: hosts } = await supabase.from('users').select('*').eq('role', 'host');

  for (const host of hosts) {
    console.log(`\nTesting Host: ${host.name} (${host.email}) [${host.id}]`);
    
    // 1. Properties
    const { data: properties, error: pErr } = await supabase
      .from('properties')
      .select('*')
      .eq('host_id', host.id);
    if (pErr) console.error('Property fetch error:', pErr);
    console.log(`  Properties count: ${properties?.length || 0}`);

    // 2. Bookings
    const { data: rawBookings, error: bErr } = await supabase
      .from('bookings')
      .select('*, properties!inner(*), guest:users!bookings_guest_id_fkey(*), booking_rooms(rooms(*))')
      .eq('properties.host_id', host.id)
      .order('created_at', { ascending: false });
    if (bErr) console.error('Booking fetch error:', bErr);
    console.log(`  Bookings count: ${rawBookings?.length || 0}`);

    // 3. Activities
    const { data: bookingActivities } = await supabase
      .from('activities')
      .select('*')
      .eq('type', 'booking_amenities');

    // 4. Reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('receiver_id', host.id);

    try {
      // Simulate page.tsx logic
      const bookings = (rawBookings || []).map((b) => {
        const activity = (bookingActivities || []).find((a) => {
          try {
            const payload = JSON.parse(a.description);
            return payload && payload.bookingId === b.id;
          } catch {
            return false;
          }
        });

        let selectedAmenities = [];
        if (activity) {
          try {
            selectedAmenities = JSON.parse(activity.description).amenities || [];
          } catch (err) {}
        }

        const roomTypePrices = b.properties?.room_type_prices || {};
        const roomTypeCounts = (b.booking_rooms || []).reduce((acc, br) => {
          const type = br.rooms?.room_type || br.room?.room_type;
          if (type) acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        const roomType = Object.keys(roomTypeCounts).length > 0 
          ? Object.entries(roomTypeCounts).map(([type, count]) => {
              const price = roomTypePrices[type];
              return `${type} (${count})${price ? ` ₹${Number(price).toLocaleString('en-IN')}` : ''}`;
            }).join(', ') 
          : null;

        return {
          ...b,
          amenities: selectedAmenities,
          room_type: roomType,
        };
      });

      const mappedTransactions = (bookings || [])
        .filter(b => b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed')
        .map(b => {
          const grossTotal = Number(b.total_price) || 0;
          const guestServiceFee = Number(b.service_fee) || Math.round((grossTotal * 0.1) / 1.1);
          const hostRevenue = Math.max(0, grossTotal - guestServiceFee);
          const hostCommission = Math.round(hostRevenue * 0.10);
          const hostNetPayout = hostRevenue - hostCommission;

          return {
            id: b.id,
            transactionId: `TXN-${b.id ? b.id.slice(0, 8).toUpperCase() : 'UNKNOWN'}`,
            propertyName: b.properties?.title || 'Unknown Property',
            guestName: b.guest?.name || 'Unknown Guest',
            hostName: host.name || 'Me',
            amount: hostNetPayout,
            serviceFee: guestServiceFee,
            netRevenue: hostNetPayout,
            date: new Date(b.created_at).toLocaleDateString(),
            status: (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed') ? 'completed' : 'pending',
            paymentMethod: 'Razorpay',
            room_type: b.room_type,
            breakdown: {
              accommodation: hostRevenue,
              service_fee: guestServiceFee,
              taxes: 0,
            }
          };
        });

      const monthlyEarningsMap = {};
      const confirmedBookingsForChart = (bookings || []).filter(b => b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed');
      confirmedBookingsForChart.forEach((b) => {
        const month = new Date(b.created_at).toLocaleString('default', { month: 'short' });
        const grossTotal = Number(b.total_price) || 0;
        const guestServiceFee = Number(b.service_fee) || Math.round((grossTotal * 0.1) / 1.1);
        const hostRevenue = Math.max(0, grossTotal - guestServiceFee);
        const hostNetPayout = Math.round(hostRevenue * 0.90);
        monthlyEarningsMap[month] = (monthlyEarningsMap[month] || 0) + hostNetPayout;
      });

      console.log('  Page.tsx data processing: SUCCESS');
    } catch (err) {
      console.error('  CRASH in page.tsx:', err);
    }
  }
}

testAllHosts().catch(console.error);
