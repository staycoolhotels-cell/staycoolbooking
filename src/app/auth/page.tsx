'use client';

import { login, signInWithMobile, verifyMobileOtp } from '@/lib/auth-actions';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, ArrowRight, Loader2, Sparkles, Lock, User } from 'lucide-react';

import AppImage from '@/components/ui/AppImage';

export default function AuthPage() {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Email Login State
  const [emailState, emailAction] = useActionState(login, undefined);

  // Mobile Login State
  const [mobileState, mobileDispatch] = useActionState(async (prevState: any, formData: FormData) => {
    if (!otpSent) {
      // Send OTP
      const result = await signInWithMobile(prevState, formData);
      if (typeof result === 'object' && result?.success) {
        setOtpSent(true);
        return undefined;
      }
      return result;
    } else {
      // Verify OTP
      return await verifyMobileOtp(prevState, formData);
    }
  }, undefined);

  const toggleAuthMethod = (method: 'email' | 'phone') => {
    if (authMethod !== method) {
      setAuthMethod(method);
      setOtpSent(false); // Reset OTP state
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden relative selection:bg-primary/30 selection:text-primary-foreground">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-30 mix-blend-screen animate-pulse-subtle" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-30 mix-blend-screen animate-pulse-subtle delay-1000" />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl shadow-black/50"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.2)] bg-white p-[1px] border border-zinc-200/50"
              >
                <AppImage
                  src="/logo.png"
                  alt="StayCool Logo"
                  fill
                  className="object-contain rounded-full"
                />
              </motion.div>
            </div>
            <h1 className="text-3xl font-heading font-bold text-white tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-zinc-400 text-sm">
              Sign in to access your account
            </p>
          </div>

          {/* Error Messages */}
          <AnimatePresence mode="wait">
            {(emailState || (typeof mobileState === 'string' && mobileState)) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {authMethod === 'email' ? emailState : (typeof mobileState === 'string' ? mobileState : '')}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Switch */}
          <div className="bg-zinc-900/50 p-1.5 rounded-xl flex items-center gap-1 mb-8 border border-white/5 mx-auto max-w-[300px]">
            <button
              onClick={() => toggleAuthMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 relative ${authMethod === 'email' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
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
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 relative ${authMethod === 'phone' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
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
                <Phone className="w-4 h-4" /> Mobile
              </span>
            </button>
          </div>

          {/* Forms */}
          <div className="relative min-h-[220px]">
            <AnimatePresence mode="wait" initial={false}>
              {authMethod === 'email' ? (
                <motion.div
                  key="email-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form action={emailAction} className="space-y-5">
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

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1" htmlFor="password">
                        Password
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                        <input
                          id="password"
                          type="password"
                          name="password"
                          placeholder="••••••••"
                          required
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        />
                      </div>
                    </div>

                    <SubmitButton>Sign In</SubmitButton>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="mobile-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form action={mobileDispatch} className="space-y-5">
                    {!otpSent ? (
                      <div className="space-y-4">
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
                        <SubmitButton>Send verification code</SubmitButton>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <input type="hidden" name="phone" value={mobileNumber} />
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
                        <SubmitButton>Verify & Sign In</SubmitButton>
                      </div>
                    )}
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-zinc-500 text-sm mb-2">Don't have an account?</p>
            <Link
              href="/signup"
              className="inline-flex items-center text-primary font-semibold hover:text-primary/80 transition-colors group"
            >
              Create an account <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div >
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
      className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
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
