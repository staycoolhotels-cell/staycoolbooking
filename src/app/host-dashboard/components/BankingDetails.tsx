'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, ChevronRight, Building2, CreditCard, User, Shield, Banknote } from 'lucide-react';

interface KycStatus {
    razorpay_account_id?: string;
    kyc_status: 'pending' | 'under_review' | 'activated' | 'needs_clarification' | 'suspended';
    legal_business_name?: string;
    email?: string;
    bank_ifsc?: string;
    bank_beneficiary_name?: string;
}

const steps = ['Personal Info', 'PAN Details', 'Bank Account'];

type FormData = {
    legal_business_name: string;
    email: string;
    phone: string;
    pan_number: string;
    bank_account_number: string;
    bank_ifsc: string;
    bank_beneficiary_name: string;
};

const statusConfig = {
    pending: {
        icon: Clock,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border border-amber-500/20',
        label: 'Setup Not Started',
        description: 'Complete your banking details to receive payouts.',
    },
    under_review: {
        icon: Clock,
        color: 'text-sky-400',
        bg: 'bg-sky-500/10 border border-sky-500/20',
        label: 'Under Review',
        description: 'Your KYC is under review by Razorpay. This usually takes 1-3 business days.',
    },
    activated: {
        icon: CheckCircle2,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border border-emerald-500/20',
        label: 'Active & Verified',
        description: 'Your account is verified. Payouts will be transferred automatically after each booking.',
    },
    needs_clarification: {
        icon: AlertCircle,
        color: 'text-orange-400',
        bg: 'bg-orange-500/10 border border-orange-500/20',
        label: 'Needs Clarification',
        description: 'Razorpay needs more information. Please contact support.',
    },
    suspended: {
        icon: AlertCircle,
        color: 'text-red-400',
        bg: 'bg-red-500/10 border border-red-500/20',
        label: 'Suspended',
        description: 'Your payout account has been suspended. Please contact Razorpay support.',
    },
};

const inputClass = 'w-full px-4 py-3 bg-zinc-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-all';

export default function BankingDetails() {
    const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<FormData>({
        legal_business_name: '',
        email: '',
        phone: '',
        pan_number: '',
        bank_account_number: '',
        bank_ifsc: '',
        bank_beneficiary_name: '',
    });

    useEffect(() => {
        fetchStatus();
    }, []);

    async function fetchStatus() {
        setLoading(true);
        try {
            const res = await fetch('/api/razorpay/linked-account/status');
            if (res.ok) {
                const data = await res.json();
                setKycStatus(data);
            } else if (res.status === 404) {
                setKycStatus({ kyc_status: 'pending' });
            }
        } catch {
            setKycStatus({ kyc_status: 'pending' });
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const res = await fetch('/api/razorpay/linked-account/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Something went wrong. Please try again.');
            } else {
                setKycStatus({ kyc_status: 'under_review', ...data });
            }
        } catch {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Show status card if already submitted
    if (kycStatus && kycStatus.kyc_status !== 'pending') {
        const config = statusConfig[kycStatus.kyc_status];
        const StatusIcon = config.icon;

        return (
            <div className="w-full space-y-6 md:space-y-8 relative">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-[#0a0a0f]/80 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 bottom-0 w-80 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-5 w-full lg:w-auto">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] shrink-0">
                            <Banknote size={32} className="text-indigo-400 drop-shadow-md" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg truncate">Banking & KYC</h1>
                            <p className="text-xs md:text-sm font-bold text-zinc-400 mt-1 uppercase tracking-widest truncate whitespace-nowrap">
                                Razorpay Route · Payout Setup
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status Card */}
                <div className={`rounded-[2rem] ${config.bg} p-6 md:p-8`}>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                            <StatusIcon className={`w-6 h-6 ${config.color}`} />
                        </div>
                        <div>
                            <h3 className={`font-black text-lg ${config.color}`}>{config.label}</h3>
                            <p className="text-zinc-400 text-sm mt-1">{config.description}</p>
                        </div>
                    </div>
                </div>

                {/* Account Details */}
                {kycStatus.razorpay_account_id && (
                    <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl p-6 md:p-8">
                        <h3 className="font-black text-white mb-4 text-sm uppercase tracking-widest">Account Details</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-3 border-b border-white/5">
                                <span className="text-zinc-500 font-medium">Account ID</span>
                                <span className="font-mono text-zinc-300 text-xs">{kycStatus.razorpay_account_id}</span>
                            </div>
                            {kycStatus.legal_business_name && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-zinc-500 font-medium">Business Name</span>
                                    <span className="text-zinc-300">{kycStatus.legal_business_name}</span>
                                </div>
                            )}
                            {kycStatus.bank_beneficiary_name && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-zinc-500 font-medium">Beneficiary</span>
                                    <span className="text-zinc-300">{kycStatus.bank_beneficiary_name}</span>
                                </div>
                            )}
                            {kycStatus.bank_ifsc && (
                                <div className="flex justify-between py-3">
                                    <span className="text-zinc-500 font-medium">IFSC Code</span>
                                    <span className="font-mono text-zinc-300">{kycStatus.bank_ifsc}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <button
                    onClick={fetchStatus}
                    className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold rounded-2xl transition-all text-sm uppercase tracking-widest"
                >
                    Refresh Status
                </button>
            </div>
        );
    }

    // Show setup form
    const stepIcons = [User, Shield, CreditCard];
    const StepIcon = stepIcons[currentStep];

    return (
        <div className="w-full space-y-6 md:space-y-8 relative">

            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-[#0a0a0f]/80 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bottom-0 w-80 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-center gap-5 w-full lg:w-auto">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] shrink-0">
                        <Banknote size={32} className="text-indigo-400 drop-shadow-md" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg truncate">Banking & KYC</h1>
                        <p className="text-xs md:text-sm font-bold text-zinc-400 mt-1 uppercase tracking-widest truncate whitespace-nowrap">
                            Razorpay Route · Payout Setup
                        </p>
                    </div>
                </div>
                <div className="relative z-10 hidden sm:flex items-center gap-4">
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shadow-inner">
                        <div className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">Secure Setup</div>
                    </div>
                </div>
            </div>

            {/* Info banner */}
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-[2rem] p-5 flex gap-4 items-start">
                <div className="p-2 bg-sky-500/20 rounded-xl shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4 text-sky-400" />
                </div>
                <p className="text-sky-300 text-sm leading-relaxed">
                    Set up your banking details to receive automatic payouts after each guest booking.
                    Your information is securely handled by <strong className="text-sky-200">Razorpay Route</strong>.
                </p>
            </div>

            {/* Step indicators */}
            <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl p-5 md:p-6">
                <div className="flex items-center gap-2">
                    {steps.map((step, i) => (
                        <div key={step} className="flex items-center gap-2 flex-1">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black transition-all ${
                                i < currentStep ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' :
                                i === currentStep ? 'bg-sky-500/20 border border-sky-500/40 text-sky-400' :
                                'bg-white/5 border border-white/10 text-zinc-600'
                            }`}>
                                {i < currentStep ? '✓' : i + 1}
                            </div>
                            <span className={`text-xs font-bold hidden sm:inline uppercase tracking-widest ${i === currentStep ? 'text-white' : 'text-zinc-600'}`}>
                                {step}
                            </span>
                            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-zinc-700 ml-auto" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Form card */}
            <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-sky-500/20 border border-sky-500/20 rounded-xl">
                        <StepIcon className="w-5 h-5 text-sky-400" />
                    </div>
                    <h2 className="font-black text-white tracking-tight">{steps[currentStep]}</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {currentStep === 0 && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                    Full Legal Name / Business Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="legal_business_name"
                                    value={formData.legal_business_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Ravi Kumar Sharma"
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                    Email Address <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                    Mobile Number <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="10-digit mobile number"
                                    required
                                    pattern="[0-9]{10}"
                                    maxLength={10}
                                    className={inputClass}
                                />
                                <p className="text-xs text-zinc-600 mt-1.5">Enter 10 digits without country code</p>
                            </div>
                        </>
                    )}

                    {currentStep === 1 && (
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                PAN Number <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="pan_number"
                                value={formData.pan_number}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value.toUpperCase(), name: 'pan_number' } })}
                                placeholder="e.g. ABCDE1234F"
                                required
                                maxLength={10}
                                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                className={`${inputClass} font-mono uppercase`}
                            />
                            <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
                                <strong>Why we need this:</strong> PAN is required by Razorpay for KYC compliance (as per RBI guidelines). Your data is encrypted and never shared with third parties.
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                    Account Holder Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bank_beneficiary_name"
                                    value={formData.bank_beneficiary_name}
                                    onChange={handleChange}
                                    placeholder="Name as on bank account"
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                    Bank Account Number <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bank_account_number"
                                    value={formData.bank_account_number}
                                    onChange={handleChange}
                                    placeholder="Enter account number"
                                    required
                                    minLength={9}
                                    maxLength={18}
                                    className={`${inputClass} font-mono`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                    IFSC Code <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bank_ifsc"
                                    value={formData.bank_ifsc}
                                    onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value.toUpperCase(), name: 'bank_ifsc' } })}
                                    placeholder="e.g. SBIN0001234"
                                    required
                                    maxLength={11}
                                    pattern="[A-Z]{4}0[A-Z0-9]{6}"
                                    className={`${inputClass} font-mono uppercase`}
                                />
                                <p className="text-xs text-zinc-600 mt-1.5">11-character IFSC code from your cheque book or passbook</p>
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2 text-sm text-red-400">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        {currentStep > 0 && (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(s => s - 1)}
                                className="flex-1 py-3 px-4 bg-white/5 border border-white/10 text-zinc-300 font-bold rounded-xl hover:bg-white/10 transition-all text-sm uppercase tracking-widest"
                            >
                                Back
                            </button>
                        )}

                        {currentStep < steps.length - 1 ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (currentStep === 0 && (!formData.legal_business_name || !formData.email || !formData.phone)) {
                                        setError('Please fill in all fields.');
                                        return;
                                    }
                                    if (currentStep === 1 && !formData.pan_number) {
                                        setError('PAN number is required.');
                                        return;
                                    }
                                    setError('');
                                    setCurrentStep(s => s + 1);
                                }}
                                className="flex-1 py-3 px-4 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-400 font-bold rounded-xl transition-all text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(14,165,233,0.15)]"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-3 px-4 bg-sky-500/20 hover:bg-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed border border-sky-500/30 text-sky-400 font-bold rounded-xl transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(14,165,233,0.15)]"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit & Create Account'
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 justify-center text-xs text-zinc-600">
                <Shield className="w-3.5 h-3.5" />
                <span>256-bit encrypted · Secured by Razorpay · PCI DSS Compliant</span>
            </div>
        </div>
    );
}
