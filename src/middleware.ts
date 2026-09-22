import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // 0. API Rate Limiting (Protects against bots, DDoS, and brute-force attacks)
    if (request.nextUrl.pathname.startsWith("/api")) {
        const forwardedFor = request.headers.get("x-forwarded-for");
        const ip = forwardedFor 
            ? forwardedFor.split(",")[0].trim() 
            : (request.headers.get("x-real-ip") || request.headers.get("cf-connecting-ip") || "127.0.0.1");

        const pathname = request.nextUrl.pathname;
        let tier: "auth" | "payment" | "write" | "api" = "api";
        if (pathname.includes("/auth") || pathname.includes("/login") || pathname.includes("/register") || pathname.includes("/password")) {
            tier = "auth";
        } else if (pathname.includes("/payment") || pathname.includes("/razorpay") || pathname.includes("/webhook")) {
            tier = "payment";
        } else if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
            tier = "write";
        }

        const rateLimitResult = await checkRateLimit(ip, tier);

        if (!rateLimitResult.success) {
            return new NextResponse(
                JSON.stringify({
                    error: "Too Many Requests",
                    message: `Rate limit exceeded. High request volume detected. Please try again in ${rateLimitResult.retryAfter} seconds.`,
                    retryAfter: rateLimitResult.retryAfter,
                }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "Retry-After": String(rateLimitResult.retryAfter),
                        "X-RateLimit-Limit": String(rateLimitResult.limit),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": String(rateLimitResult.reset),
                    },
                }
            );
        }

        response.headers.set("X-RateLimit-Limit", String(rateLimitResult.limit));
        response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
        response.headers.set("X-RateLimit-Reset", String(rateLimitResult.reset));

        // Skip heavyweight session check for API routes to minimize DB load
        return response;
    }

    const pathname = request.nextUrl.pathname;
    const isProtectedRoute = 
        pathname.startsWith("/host-dashboard") || 
        pathname.startsWith("/admin-panel") ||
        pathname.startsWith("/user-profile") ||
        pathname.startsWith("/host-onboarding") ||
        pathname.startsWith("/list-property");

    // Fast path: Check if user has any Supabase auth cookies
    const allCookies = request.cookies.getAll();
    const hasAuthCookie = allCookies.some(c => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

    // If protected route and no auth cookies present, instantly redirect without remote network call
    if (isProtectedRoute && !hasAuthCookie) {
        return NextResponse.redirect(new URL("/auth", request.url));
    }

    // Only run Supabase session check for protected routes, or when auth cookie is present to refresh session
    if (isProtectedRoute || hasAuthCookie) {
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

        // 1. Refresh Session / Get User safely
        let user = null;
        try {
            const { data } = await supabase.auth.getUser();
            user = data?.user ?? null;
        } catch {
            user = null;
        }

        // 2. Protect Host Dashboard
        if (pathname.startsWith("/host-dashboard")) {
            if (!user) {
                return NextResponse.redirect(new URL("/auth", request.url));
            }
        }

        // 3. Protect Admin Panel
        if (pathname.startsWith("/admin-panel")) {
            if (!user) {
                return NextResponse.redirect(new URL("/auth", request.url));
            }
            const role = user.user_metadata?.role;
            if (role !== 'admin') {
                return NextResponse.redirect(new URL("/", request.url));
            }
        }

        // 4. Protect User Profile & Onboarding
        if (pathname.startsWith("/user-profile") || pathname.startsWith("/host-onboarding") || pathname.startsWith("/list-property")) {
            if (!user) {
                return NextResponse.redirect(new URL("/auth", request.url));
            }
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
        "/((?!_next/static|_next/image|guest-booking-flow|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
