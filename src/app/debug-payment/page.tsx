import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DebugPaymentPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Please log in to access this debug page.</div>;
    }

    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: users } = await supabaseAdmin.from('users').select('id, name, email, role, stripe_account_id');
    const { data: properties } = await supabaseAdmin.from('properties').select('id, name, host_id');

    async function claimProperties() {
        'use server';
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Update all properties to belong to the current user
        await supabaseAdmin.from('properties').update({ host_id: user.id }).neq('host_id', user.id);

        // Ensure current user is a host
        await supabaseAdmin.from('users').update({ role: 'host', status: 'approved' }).eq('id', user.id);

        revalidatePath('/debug-payment');
    }

    return (
        <div className="p-8 font-mono text-sm">
            <h1 className="text-2xl font-bold mb-4">Payment Debug Dashboard</h1>

            <div className="mb-8 border p-4 rounded">
                <h2 className="text-xl font-bold mb-2">Current User</h2>
                <pre>{JSON.stringify(user, null, 2)}</pre>
                <form action={claimProperties}>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Fix Data: specificy Me as Host for All Properties
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                        Use this if 'Host not found' error persists. It will assign all properties to YOU.
                    </p>
                </form>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="border p-4 rounded">
                    <h2 className="text-xl font-bold mb-2">Users ({users?.length})</h2>
                    <div className="max-h-96 overflow-auto">
                        {users?.map(u => (
                            <div key={u.id} className="mb-2 p-2 border-b">
                                <div className="font-bold">{u.name || u.email}</div>
                                <div className="text-xs text-gray-400">{u.id}</div>
                                <div className="text-xs">Role: {u.role}</div>
                                <div className="text-xs">Stripe: {u.stripe_account_id || 'N/A'}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border p-4 rounded">
                    <h2 className="text-xl font-bold mb-2">Properties ({properties?.length})</h2>
                    <div className="max-h-96 overflow-auto">
                        {properties?.map(p => {
                            const host = users?.find(u => u.id === p.host_id);
                            const isOrphan = !host;
                            return (
                                <div key={p.id} className={`mb-2 p-2 border-b ${isOrphan ? 'bg-red-900/20' : ''}`}>
                                    <div className="font-bold">{p.name}</div>
                                    <div className="text-xs text-gray-400">ID: {p.id}</div>
                                    <div className="text-xs">
                                        Host: {p.host_id}
                                        {isOrphan && <span className="text-red-500 font-bold ml-2"> (ORPHANED - Host Not Found)</span>}
                                        {host && <span className="text-green-500 ml-2"> (Valid)</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
