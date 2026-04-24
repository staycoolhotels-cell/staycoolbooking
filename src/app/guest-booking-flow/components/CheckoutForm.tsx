"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";

export default function CheckoutForm({ amount, onCancel }: { amount: number, onCancel: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/payment/success`,
            },
        });

        if (error) {
            setErrorMessage('An unexpected error occurred.');
            setLoading(false);
        } else {
            // The UI will likely redirect before this runs
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Complete Payment</h3>
                <p className="text-sm text-slate-400 mb-6">
                    Total to pay: <span className="text-primary font-bold">₹{amount.toLocaleString('en-IN')}</span>
                </p>

                <PaymentElement />

                {errorMessage && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
                        {errorMessage}
                    </div>
                )}

                <div className="mt-6 flex gap-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!stripe || loading}
                        className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex justify-center items-center"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Pay Now"}
                    </button>
                </div>
            </div>
        </form>
    );
}
