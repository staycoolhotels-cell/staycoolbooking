
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function HostConnectRazorpay() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"loading" | "connected" | "not_connected">("loading");

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check user_wallets for razorpay_account_id
        const { data, error } = await supabase
            .from("user_wallets")
            .select("razorpay_account_id")
            .eq("user_id", user.id)
            .single();

        if (data?.razorpay_account_id) {
            setStatus("connected");
        } else {
            setStatus("not_connected");
        }

        // Handle case where no row exists yet (error P0001 usually if .single() fails on no rows)
        if (error && error.code !== 'PGRST116') { // PGRST116 is 'The result contains 0 rows'
            console.error("Error checking wallet status:", error.message, error.details, error.hint, error);
        }
    };

    const handleConnect = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/connect/onboard", {
                method: "POST",
            });
            const data = await response.json();

            if (data.success || data.accountId) {
                setStatus("connected");
                // Optionally show a success toast or message
            } else if (data.message === 'Already onboarded') {
                setStatus("connected");
            } else {
                console.error("Onboarding failed", data);
                alert("Failed to create payout account: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error connecting to Payouts:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") {
        return <div className="animate-pulse h-10 w-32 bg-gray-200 rounded"></div>;
    }

    if (status === "connected") {
        return (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Payouts Active</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <Button
                onClick={handleConnect}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                    </>
                ) : (
                    "Connect Payouts"
                )}
            </Button>
            <p className="text-xs text-muted-foreground">
                Securely connect to receive earnings automatically.
            </p>
        </div>
    );
}
