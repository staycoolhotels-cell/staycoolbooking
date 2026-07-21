import Link from 'next/link';
import { CheckCircle, MapPin } from 'lucide-react';

interface SuccessPageProps {
    searchParams: {
        lat?: string;
        lng?: string;
        label?: string;
        address?: string;
    }
}

export default function PaymentSuccessPage({ searchParams }: SuccessPageProps) {
    const { lat, lng, label, address } = searchParams;
    
    // Construct directions URL
    const directionsUrl = lat && lng 
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
        : address 
            ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
            : null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-32 pb-12">
            <div className="max-w-md w-full p-8 rounded-xl bg-card border border-border shadow-lg text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h1>
                <p className="text-muted-foreground mb-8">
                    Your booking has been confirmed. You will receive an email with the details shortly.
                </p>

                {directionsUrl && (
                    <div className="mb-8 p-4 bg-sky-500/10 border border-sky-500/30 rounded-xl">
                        <p className="text-sm font-medium text-sky-400 mb-3 flex items-center justify-center gap-2">
                            <MapPin className="h-4 w-4" /> Ready for your stay?
                        </p>
                        <a 
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-3 px-4 bg-sky-500 text-black rounded-lg font-bold hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20"
                        >
                            Get Directions
                        </a>
                    </div>
                )}

                <div className="space-y-4">
                    <Link
                        href="/my-bookings"
                        className="block w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        View My Bookings
                    </Link>
                    <Link
                        href="/"
                        className="block w-full py-3 px-4 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

