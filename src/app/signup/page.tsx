'use client';

import { signUpUser, signInWithMobile, verifyMobileOtp } from '@/lib/auth-actions';
import { createHostSignupOrder } from '@/lib/payment-actions';
import { useActionState, useState, startTransition, useEffect, Suspense } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, ArrowRight, Loader2, Lock, User, Home, UserCheck, Smartphone, Check, Eye, EyeOff, Gift } from 'lucide-react';
import Script from 'next/script';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const refParam = searchParams.get('ref') || '';
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [selectedRole, setSelectedRole] = useState(roleParam?.toLowerCase() === 'host' ? 'Host' : 'Guest');
  const [referralCode, setReferralCode] = useState(refParam);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState('');
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email Signup State
  const [emailState, emailAction] = useActionState<any, any>(signUpUser, undefined);

  // Mobile Signup State
  const [mobileState, mobileDispatch] = useActionState<any, any>(async (prevState: any, formData: FormData) => {
    if (!otpSent) {
      // Send OTP
      const result = await signInWithMobile(prevState, formData);
      if (typeof result === 'object' && result?.success) {
        setOtpSent(true);
        return undefined;
      }
      return result;
    } else {
      // Verify OTP - Payment is now handled in the submit handler
      return await verifyMobileOtp(prevState, formData);
    }
  }, undefined);

  // Watch for successful signup
  useEffect(() => {
    // Check Email State
    if (emailState && typeof emailState === 'object' && (emailState as any).success) {
      const role = (emailState as any).role?.toLowerCase();
      if (role === 'host') {
        setShowSuccessModal(true);
      } else {
        // Guests redirect immediately
        router.push('/auth');
      }
    }

    // Check Mobile State
    if (mobileState && typeof mobileState === 'object' && (mobileState as any).success) {
      const role = (mobileState as any).role?.toLowerCase();
      if (role === 'host') {
        setShowSuccessModal(true);
      } else {
        // Guests redirect immediately
        router.push('/auth');
      }
    }
  }, [emailState, mobileState, router]);

  const toggleAuthMethod = (method: 'email' | 'phone') => {
    if (authMethod !== method) {
      setAuthMethod(method);
      setOtpSent(false);
    }
  };

  const handleMobileSignupSubmit = async (formData: FormData) => {
    // If OTP not sent yet, just send OTP (no payment needed yet)
    if (!otpSent) {
      mobileDispatch(formData);
      return;
    }

    // If OTP sent, we are verifying. Check payment for Host.
    if (selectedRole === 'Host') {
      try {
        const order = await createHostSignupOrder();
        if (!order.success) {
          alert("Failed to initiate payment: " + order.error);
          return;
        }


        const payment: any = await new Promise((resolve, reject) => {
          if (typeof (window as any).Razorpay === 'undefined') {
            reject(new Error('Razorpay SDK not loaded. Please check your internet connection or script tag.'));
            return;
          }

          const options = {
            key: order.key_id,
            amount: order.amount,
            currency: order.currency,
            name: "StayCool",
            description: "Host Account Signup Fee",
            order_id: order.orderId,
            handler: (response: any) => {
              console.log("✅ Payment authorized (Mobile):", response.razorpay_payment_id);
              resolve(response);
            },
            modal: {
              ondismiss: () => {
                console.log("ℹ️ Payment modal (Mobile) closed by user");
                reject(new Error('Payment cancelled'));
              },
              escape: true,
              confirm_close: true
            },
            prefill: {
              contact: mobileNumber,
              name: name
            },
            theme: {
              color: "#0ea5e9"
            }
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        });

        formData.append('razorpay_payment_id', payment.razorpay_payment_id);
        formData.append('razorpay_order_id', payment.razorpay_order_id);
        formData.append('razorpay_signature', payment.razorpay_signature);

        startTransition(() => {
          mobileDispatch(formData);
        });

      } catch (err: unknown) {
        if ((err as Error).message === 'Payment cancelled') {
          console.warn("Payment was cancelled by the user.");
        } else {
          console.error("Payment failed (Mobile):", err);
          alert('Payment failed: ' + (err as Error).message);
        }
      }
    } else {
      mobileDispatch(formData);
    }
  };

  /* New State Variables */
  const [showMockPayment, setShowMockPayment] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const handleEmailSignupSubmit = async (formData: FormData) => {
    if (selectedRole === 'Host') {
      try {
        const order = await createHostSignupOrder();
        if (!order.success) {
          alert("Failed to initiate payment: " + order.error);
          return;
        }


        const payment: any = await new Promise((resolve, reject) => {
          if (typeof (window as any).Razorpay === 'undefined') {
            reject(new Error('Razorpay SDK not loaded. Please check your internet connection or script tag.'));
            return;
          }

          const options = {
            key: order.key_id,
            amount: order.amount,
            currency: order.currency,
            name: "StayCool",
            description: "Host Account Signup Fee",
            order_id: order.orderId,
            handler: (response: any) => {
              console.log("✅ Payment authorized:", response.razorpay_payment_id);
              resolve(response);
            },
            modal: {
              ondismiss: () => {
                console.log("ℹ️ Payment modal closed by user");
                reject(new Error('Payment cancelled'));
              },
              escape: true,
              confirm_close: true
            },
            prefill: {
              email: formData.get('email') as string,
              name: formData.get('fullName') as string
            },
            theme: {
              color: "#0ea5e9"
            }
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        });

        formData.append('razorpay_payment_id', payment.razorpay_payment_id);
        formData.append('razorpay_order_id', payment.razorpay_order_id);
        formData.append('razorpay_signature', payment.razorpay_signature);

        startTransition(() => {
          emailAction(formData);
        });

      } catch (err: any) {
        if (err.message === 'Payment cancelled') {
          console.warn("Payment was cancelled by the user.");
        } else {
          console.error("Payment failed:", err);
          alert('Payment failed: ' + err.message);
        }
      }
    } else {
      emailAction(formData);
    }
  };

  const handleMockPaymentSuccess = () => {
    if (!pendingFormData || !pendingOrder) return;

    // Simulate successful payment response
    const mockPaymentResponse = {
      razorpay_payment_id: "pay_mock_" + Date.now(),
      razorpay_order_id: pendingOrder.orderId,
      razorpay_signature: "mock_signature"
    };

    const formData = pendingFormData;
    formData.append('razorpay_payment_id', mockPaymentResponse.razorpay_payment_id);
    formData.append('razorpay_order_id', mockPaymentResponse.razorpay_order_id);
    formData.append('razorpay_signature', mockPaymentResponse.razorpay_signature);

    startTransition(() => {
      if (authMethod === 'email') {
        emailAction(formData);
      } else {
        mobileDispatch(formData);
      }
    });

    setShowMockPayment(false);
    setPendingOrder(null);
    setPendingFormData(null);
  };

  const handleMockPaymentCancel = () => {
    setShowMockPayment(false);
    setPendingOrder(null);
    setPendingFormData(null);
  };

  // Mobile Signup Interceptor (Optional: Implement if needed, currently focusing on Email for simplicity, 
  // but reusing the modal logic for consistency would be good if we refactor mobileDispatch)
  // For now, attaching the modal rendering only.

  const roles = [
    {
      id: 'Guest',
      title: 'Guest',
      icon: User,
      description: 'Book unique stays',
    },
    {
      id: 'Host',
      title: 'Host',
      icon: Home,
      description: 'List your property',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden relative selection:bg-primary/30 selection:text-primary-foreground pt-32 pb-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] opacity-30 mix-blend-screen animate-pulse-subtle" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px] opacity-30 mix-blend-screen animate-pulse-subtle delay-1000" />
      </div>

      <div className="w-full max-w-lg px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl shadow-black/50"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 border border-primary/20 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
            >
              <UserCheck className="w-6 h-6 text-primary" />
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-white tracking-tight mb-1.5 md:mb-2">
              Create Account
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm">
              Join us to book or list unique properties
            </p>
          </div>

          {/* Error Messages */}
          <AnimatePresence mode="wait">
            {(emailState || (typeof mobileState === 'string' && mobileState) || (typeof mobileState === 'object' && (mobileState as any)?.message && !(mobileState as any)?.success)) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {authMethod === 'email'
                  ? (typeof emailState === 'string' ? emailState : (emailState as any)?.message)
                  : (typeof mobileState === 'string' ? mobileState : (mobileState as any)?.message)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Switch */}
          <div className="bg-zinc-900/50 p-1 md:p-1.5 rounded-xl flex items-center gap-1 mb-6 md:mb-8 border border-white/5 mx-auto max-w-[300px]">
            <button
              onClick={() => toggleAuthMethod('email')}
              className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-2.5 px-3 md:px-4 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 relative ${authMethod === 'email' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              {authMethod === 'email' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </span>
            </button>
            <button
              onClick={() => toggleAuthMethod('phone')}
              className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-2.5 px-3 md:px-4 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 relative ${authMethod === 'phone' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              {authMethod === 'phone' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Smartphone className="w-4 h-4" /> Mobile
              </span>
            </button>
          </div>

          {/* Forms */}
          <div className="relative">
            <AnimatePresence mode="wait" initial={false}>
              {authMethod === 'email' ? (
                <motion.div
                  key="email-signup-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form action={handleEmailSignupSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1" htmlFor="fullName">
                        Full Name
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                        <input
                          id="fullName"
                          type="text"
                          name="fullName"
                          placeholder="Your Full Name"
                          required
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1" htmlFor="email">
                        Email Address
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                        <input
                          id="email"
                          type="email"
                          name="email"
                          placeholder="name@example.com"
                          required
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1" htmlFor="password">
                          Password
                        </label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                          <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="••••••"
                            required
                            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1" htmlFor="confirmPassword">
                          Confirm
                        </label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                          <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="••••••"
                            required
                            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Referral Code - Only for Hosts */}
                    {selectedRole === 'Host' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1" htmlFor="referralCode">
                          Referral Code (Optional)
                        </label>
                        <div className="relative group">
                          <Gift className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                          <input
                            id="referralCode"
                            type="text"
                            name="referralCode"
                            placeholder="e.g. SC-XXXXXX"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all uppercase"
                          />
                        </div>
                      </div>
                    )}

                    {/* Role Selection */}
                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                        I am a...
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {roles.map((role) => (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => setSelectedRole(role.id)}
                            className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 group overflow-hidden ${selectedRole === role.id
                              ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(14,165,233,0.1)]'
                              : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'
                              }`}
                          >
                            <div className={`p-2 rounded-full mb-2 transition-colors duration-300 ${selectedRole === role.id ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-300'
                              }`}>
                              <role.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-sm font-bold transition-colors ${selectedRole === role.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                              {role.title}
                            </span>
                            <span className="text-[10px] text-zinc-500 mt-0.5">{role.description}</span>

                            {selectedRole === role.id && (
                              <motion.div
                                layoutId="activeRole"
                                className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                      <input type="hidden" name="role" value={selectedRole} />
                    </div>

                    <SubmitButton>Sign Up</SubmitButton>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="mobile-signup-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form action={handleMobileSignupSubmit} className="space-y-5">
                    {!otpSent ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1" htmlFor="fullName">
                            Full Name
                          </label>
                          <div className="relative group">
                            <User className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                            <input
                              id="fullName"
                              type="text"
                              name="name"
                              placeholder="Your Full Name"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1" htmlFor="phone">
                            Mobile Number
                          </label>
                          <div className="relative group">
                            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                            <input
                              id="phone"
                              type="tel"
                              name="phone"
                              placeholder="+91..."
                              required
                              value={mobileNumber}
                              onChange={(e) => setMobileNumber(e.target.value)}
                              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                            />
                          </div>
                        </div>

                        {/* Referral Code (Mobile) - Only for Hosts */}
                        {selectedRole === 'Host' && (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1" htmlFor="mobileReferralCode">
                              Referral Code (Optional)
                            </label>
                            <div className="relative group">
                              <Gift className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                              <input
                                id="mobileReferralCode"
                                type="text"
                                name="referralCode"
                                placeholder="e.g. SC-XXXXXX"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all uppercase"
                              />
                            </div>
                          </div>
                        )}

                        {/* Role Selection */}
                        <div className="space-y-3 pt-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                            I am a...
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {roles.map((role) => (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => setSelectedRole(role.id)}
                                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 group overflow-hidden ${selectedRole === role.id
                                  ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(14,165,233,0.1)]'
                                  : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'
                                  }`}
                              >
                                <div className={`p-2 rounded-full mb-2 transition-colors duration-300 ${selectedRole === role.id ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-300'
                                  }`}>
                                  <role.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-sm font-bold transition-colors ${selectedRole === role.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                                  {role.title}
                                </span>
                                <span className="text-[10px] text-zinc-500 mt-0.5">{role.description}</span>

                                {selectedRole === role.id && (
                                  <motion.div
                                    layoutId="activeRoleMobile"
                                    className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <SubmitButton>Send verification code</SubmitButton>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <input type="hidden" name="phone" value={mobileNumber} />
                        <input type="hidden" name="role" value={selectedRole} />
                        <input type="hidden" name="name" value={name} />

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1" htmlFor="otp">
                              Verification Code
                            </label>
                            <button
                              type="button"
                              onClick={() => setOtpSent(false)}
                              className="text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                              Change number?
                            </button>
                          </div>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                            <input
                              id="otp"
                              type="text"
                              name="otp"
                              placeholder="123456"
                              required
                              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all tracking-widest"
                            />
                          </div>
                        </div>
                        <SubmitButton>Verify & Create Account</SubmitButton>
                      </div>
                    )}
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-zinc-500 text-sm mb-2">Already have an account?</p>
            <Link
              href="/auth"
              className="inline-flex items-center text-primary font-semibold hover:text-primary/80 transition-colors group"
            >
              Sign In <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div >


      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-green-500/30 rounded-2xl shadow-2xl p-8 overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-400" />

              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                <Check className="w-8 h-8 text-green-500" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
              <p className="text-zinc-400 mb-8">
                Your account has been created successfully. Please log in to continue to your dashboard.
              </p>

              <button
                onClick={() => router.push('/auth')}
                className="w-full py-3.5 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-600/20 transition-all transform active:scale-95"
              >
                Okay, Go to Login
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-sm md:text-base shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group mt-4"
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
      <span className="relative flex items-center justify-center gap-2">
        {pending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
