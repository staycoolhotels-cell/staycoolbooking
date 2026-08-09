'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, ChevronRight, Landmark, LayoutDashboard, ShieldCheck } from 'lucide-react';
import BankingDetails from '@/app/host-dashboard/components/BankingDetails';
import AddPropertyModal, { FormData as PropertyFormData } from '@/app/host-dashboard/components/AddPropertyModal';

export default function HostOnboardingClient({
  hasProperty,
  propertyCreated,
}: {
  hasProperty: boolean;
  propertyCreated: boolean;
}) {
  const router = useRouter();
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const openDashboard = useCallback(() => router.replace('/host-dashboard'), [router]);
  const createProperty = useCallback(async (formData: PropertyFormData) => {
    const roomPrices = Object.values(formData.roomTypePrices).map(price => Number(price) || 0).filter(Boolean);
    const weekendPrices = Object.values(formData.roomTypeWeekendPrices).map(price => Number(price) || 0).filter(Boolean);
    const price = roomPrices.length ? Math.min(...roomPrices) : Number(formData.price) || 0;
    const weekendPrice = weekendPrices.length ? Math.min(...weekendPrices) : Number(formData.weekendPrice) || 0;
    const location = formData.city && formData.state ? `${formData.city}, ${formData.state}` : formData.location;

    const res = await fetch('/api/properties/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyPayload: {
          title: formData.name,
          description: formData.description,
          price_per_night: price,
          weekend_price_per_night: weekendPrice,
          tier: formData.type,
          amenities: formData.amenities,
          license_url: formData.license_url,
          tax_bill_url: formData.tax_bill_url,
          current_bill_url: formData.current_bill_url,
          aadhar_url: formData.aadhar_url,
          pan_url: formData.pan_url,
          noc_url: formData.noc_url,
          image_url: formData.photo_urls[0] || '',
          images: formData.photo_urls.map((url, index) => ({ url, alt: `${formData.name} Photo ${index + 1}` })),
          cancellation_policy: formData.cancellationPolicy,
          rules: formData.rules,
          safety_items: formData.safetyItems,
          bedrooms: Number(formData.bedrooms) || 0,
          beds: Number(formData.beds) || 0,
          bathrooms: Number(formData.bathrooms) || 0,
          max_guests: Number(formData.maxGuests) || 0,
          area: Number(formData.area) || 0,
          address_line1: formData.addressLine1,
          address_line2: formData.addressLine2,
          landmark: formData.landmark,
          district: formData.district,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: formData.country,
          location: location || 'Unknown Location',
          total_rooms: Number(formData.totalRooms) || 0,
          room_types: formData.roomTypes,
          room_type_amenities: formData.roomTypeAmenities,
          room_type_counts: formData.roomTypeCounts,
          room_type_prices: formData.roomTypePrices,
          room_type_weekend_prices: formData.roomTypeWeekendPrices,
          check_in_time: formData.checkInTime || '12:00 PM',
          check_out_time: formData.checkOutTime || '11:00 AM',
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          show_specific_location: true,
          bulk_booking_discount: Number(formData.bulkBookingDiscount) || 0,
          standard_price: price,
        },
      }),
    });
    const result = await res.json();
    if (!res.ok || result.error) throw new Error(result.error || 'Unable to create property');
    router.replace('/host-onboarding?property-created=1');
  }, [router]);

  return (
    <main className="min-h-screen bg-[#08090d] p-4 text-white md:p-8">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-xl bg-sky-500/15 p-2"><LayoutDashboard className="text-sky-400" /></div>
            <div><p className="font-black">Host Panel</p><p className="text-xs text-zinc-500">Complete setup</p></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-xl bg-sky-500/15 px-3 py-3 text-sm font-bold text-sky-300">
              <Building2 className="h-4 w-4" /> Properties
              {hasProperty && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />}
            </div>
            <div className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${hasProperty ? 'bg-sky-500/15 text-sky-300' : 'text-zinc-600'}`}>
              <Landmark className="h-4 w-4" /> Banking &amp; KYC
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-8">
          {!hasProperty ? (
            <div className="mx-auto max-w-xl py-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/15"><Building2 className="h-8 w-8 text-sky-400" /></div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">Step 1 of 2 · Properties</p>
              <h1 className="mt-3 text-3xl font-black">Add your first property</h1>
              <p className="mt-3 text-zinc-400">Enter your property details to start hosting. Once it is created, you can complete Banking &amp; KYC.</p>
              <button type="button" onClick={() => setIsPropertyModalOpen(true)} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-sky-400">
                Add property details <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">Step 2 of 2 · Banking &amp; KYC</p>
                <h1 className="mt-3 text-3xl font-black">Complete your payout setup</h1>
                <p className="mt-2 text-zinc-400">After Banking &amp; KYC is activated, your full host dashboard will open automatically.</p>
              </div>
              {propertyCreated && (
                <div className="mb-6 flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  <ShieldCheck className="h-5 w-5 shrink-0" /> Your property was created successfully. Now complete Banking &amp; KYC.
                </div>
              )}
              <BankingDetails onActivated={openDashboard} />
            </>
          )}
        </section>
      </div>
      <AddPropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        onSaveProperty={createProperty}
        propertyToEdit={null}
      />
    </main>
  );
}
