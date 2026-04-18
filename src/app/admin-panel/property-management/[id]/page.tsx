import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { fetchHostKycByUserId } from '@/lib/admin-actions';
import PropertyDetailsClient from './PropertyDetailsClient';

interface Props {
    params: Promise<{ id: string }>;
}

const PropertyDetailsPage = async ({ params }: Props) => {
    const { id: propertyId } = await params;

    // Auth check
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth');

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'admin') redirect('/auth');

    // Fetch property
    const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

    if (propertyError || !property) {
        redirect('/admin-panel/property-management');
    }

    // Fetch host KYC data (host_id links property to KYC record)
    const kycRecord = property.host_id
        ? await fetchHostKycByUserId(property.host_id)
        : null;

    return (
        <PropertyDetailsClient
            property={property}
            kycRecord={kycRecord}
        />
    );
};

export default PropertyDetailsPage;
