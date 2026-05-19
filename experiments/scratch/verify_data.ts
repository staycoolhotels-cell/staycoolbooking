
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyMapping() {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*');

    if (error) throw error;

    const mapped = (bookings || []).map(b => ({
      id: b.id,
      status: (b.status === 'confirmed' || b.status === 'completed') ? 'completed' : 
              (b.status === 'cancelled' || b.status === 'refunded') ? 'refunded' : 'pending',
      amount: Number(b.total_price)
    }));

    const completed = mapped.filter(m => m.status === 'completed');
    const totalRevenue = completed.reduce((acc, m) => acc + m.amount, 0);

    console.log('Verification Results:', {
      totalBookings: mapped.length,
      completedTransactions: completed.length,
      totalRevenue: totalRevenue
    });
  } catch (err: any) {
    console.error('Verification Failed:', err.message);
  }
}

verifyMapping();
