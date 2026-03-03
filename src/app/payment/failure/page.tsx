import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function PaymentFailurePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full p-8 rounded-xl bg-card border border-border shadow-lg text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center">
                        <XCircle className="h-10 w-10 text-red-500" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h1>
                <p className="text-muted-foreground mb-8">
                    We couldn't process your payment. Please keep your booking ID handy and try again, or contact support.
                </p>
                <div className="space-y-4">
                    <Link
                        href="/guest-booking-flow"
                        className="block w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        Try Again
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
