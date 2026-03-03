import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
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
