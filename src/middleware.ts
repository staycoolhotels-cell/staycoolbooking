import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 1. Refresh Session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 2. Protect Host Dashboard
    if (request.nextUrl.pathname.startsWith("/host-dashboard")) {
        if (!user) {
            return NextResponse.redirect(new URL("/auth", request.url));
        }

        // Check Role and Status via Metadata (lightweight check first)
        // NOTE: Metadata might be stale, but it's good for first line of defense.
        // For critical strictness, we might query the DB, but middleware edge functions shouldn't contain complex DB logic if avoidable.
        // However, since we need STRICT security, we rely on the `page.tsx` serverside check for the ultimate source of truth,
        // but we can try to redirect early if metadata says 'pending'.

        // We can't easily query public.users in middleware roughly without service role or RLS setup complexity in edge.
        // So we rely on the page logic, which WE HAVE UPDATED in the previous steps (or will update).
        // The user requirement says: "Backend must enforce approval check on: Login, Protected routes".
        // Since page.tsx IS the backend for App Router, checking there is valid backend enforcement.
        // Middleware mainly ensures they are Authenticated.

        // However, if we put status in metadata, we can check it here. 
        // Let's rely on the robust check in `src/app/host-dashboard/page.tsx` we verified earlier.
        // But we MUST ensure the user is logged in.
    }

    // 3. Protect Admin Panel
    if (request.nextUrl.pathname.startsWith("/admin-panel")) {
        if (!user) {
            return NextResponse.redirect(new URL("/auth", request.url));
        }
        // Similar strictly checking role requires DB access or trusting metadata.
        // We will trust metadata for redirect speed, but Page verify source of truth.
        const role = user.user_metadata?.role;
        if (role !== 'admin') {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
