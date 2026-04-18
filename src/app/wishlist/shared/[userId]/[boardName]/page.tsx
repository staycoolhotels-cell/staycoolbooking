import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import PropertyCard from '@/app/homepage/components/PropertyCard';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';

import SharedWishlistClient from './components/SharedWishlistClient';

interface SharedWishlistPageProps {
  params: Promise<{
    userId: string;
    boardName: string;
  }>;
}

export default async function SharedWishlistPage({ params }: SharedWishlistPageProps) {
  const { userId, boardName: encodedBoardName } = await params;
  const boardName = decodeURIComponent(encodedBoardName);

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );

  // Fetch items for this board
  const { data: wishlistItems, error } = await supabase
    .from('wishlist')
    .select('*, properties(*)')
    .eq('user_id', userId)
    .eq('board', boardName);

  if (error || !wishlistItems || wishlistItems.length === 0) {
    // If board is empty or not found, show 404
    notFound();
  }

  // Fetch user info (optional, just for better display)
  const { data: owner } = await supabase
    .from('users')
    .select('name')
    .eq('id', userId)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Hero Header */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-[#080808]">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-600/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-4 py-2 rounded-full mb-6">
            <Icon name="HeartIcon" size={16} className="text-sky-400" variant="solid" />
            <span className="text-sky-400 text-xs font-bold uppercase tracking-widest">Shared Wishlist Board</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 italic tracking-tight">
            {boardName}
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            A curated collection of stays by <span className="text-white font-bold">{owner?.name || 'a StayCool Traveler'}</span>.
          </p>
        </div>
      </section>

      {/* Property Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] p-8 md:p-12">
          <div className="flex justify-between items-center mb-10 pb-6 border-b border-zinc-800">
            <div>
              <h2 className="text-2xl font-bold text-white">Properties</h2>
              <p className="text-sm text-zinc-500 mt-1">{wishlistItems.length} items saved to this board</p>
            </div>
            
            <Link 
              href="/" 
              className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-black hover:bg-sky-400 hover:text-white transition-all transform hover:scale-105"
            >
              Start Your Own Search
            </Link>
          </div>

          {/* Client-side Grid rendering */}
          <SharedWishlistClient wishlistItems={wishlistItems} />
        </div>

        {/* Brand Footer CTA */}
        <div className="mt-16 text-center">
            <p className="text-zinc-500 text-sm mb-4">Want to save your own collections?</p>
            <Link 
              href="/signup" 
              className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-400 border border-sky-500/30 px-8 py-4 rounded-2xl font-black hover:bg-sky-500 hover:text-white transition-all shadow-xl shadow-sky-500/10"
            >
              Join StayCool Booking
              <Icon name="ArrowRightIcon" size={18} />
            </Link>
        </div>
      </section>
    </div>
  );
}
