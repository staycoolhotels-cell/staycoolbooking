'use client';

import { updatePassword } from '@/lib/auth-actions';
import { useActionState, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white py-3 md:py-4 rounded-xl font-bold text-sm md:text-base shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
      <span className="relative flex items-center justify-center gap-2">
        {pending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Updating…
          </>
        ) : (
          'Update Password'
        )}
      </span>
    </button>
  );
}

export default function ResetPasswordPage() {
  const [state, action] = useActionState(updatePassword, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const router = useRouter();

  // Supabase stores the reset session in the URL hash; we need to let it process
  useEffect(() => {
    const handleHashSession = async () => {
      // Give Supabase time to pick up the hash tokens
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        // Listen for the auth state change triggered by the hash
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' && session) {
            setSessionReady(true);
            subscription.unsubscribe();
          }
        });
        // Timeout: if session never arrives, show error
        const timer = setTimeout(() => {
          setSessionError(true);
        }, 5000);
        return () => {
          clearTimeout(timer);
          subscription.unsubscribe();
        };
      }
    };
    handleHashSession();
  }, []);

  const parsed = (() => {
    try { return state ? JSON.parse(state) : null; } catch { return null; }
  })();

  const success = parsed?.success;
  const errorMsg = parsed?.error;

  // Redirect to login after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => router.push('/auth'), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden relative selection:bg-primary/30 pt-32 pb-12">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-sky-500/15 rounded-full blur-[120px] opacity-30 mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] opacity-30 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl shadow-black/50"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl shadow-inner">
                <img
                  src="/assets/images/logo.png"
                  alt="StayCool Logo"
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain filter drop-shadow-lg"
                />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-white tracking-tight mb-1.5">
              Reset Password
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm">
              Choose a strong new password for your account.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
                <h2 className="text-white font-bold text-lg mb-2">Password Updated!</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Your password has been updated successfully. Redirecting you to sign in…
                </p>
              </motion.div>
            ) : sessionError ? (
              <motion.div
                key="session-error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                </div>
                <h2 className="text-white font-bold text-lg mb-2">Link Expired</h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  This reset link has expired or is invalid. Please request a new one.
                </p>
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
                >
                  Request New Link
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Error */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {errorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!sessionReady && (
                  <div className="mb-5 flex items-center gap-2 text-zinc-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    Verifying reset link…
                  </div>
                )}

                <form action={action} className="space-y-5">
                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1" htmlFor="rp-password">
                      New Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 w-4 h-4 md:w-5 md:h-5 text-zinc-500 group-focus-within:text-sky-400 transition-colors" />
                      <input
                        id="rp-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        disabled={!sessionReady}
                        className="w-full pl-11 md:pl-12 pr-12 md:py-3.5 py-2.5 text-xs md:text-sm rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3 md:top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1" htmlFor="rp-confirm">
                      Confirm New Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 w-4 h-4 md:w-5 md:h-5 text-zinc-500 group-focus-within:text-sky-400 transition-colors" />
                      <input
                        id="rp-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        disabled={!sessionReady}
                        className="w-full pl-11 md:pl-12 pr-12 md:py-3.5 py-2.5 text-xs md:text-sm rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-3 md:top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                      </button>
                    </div>
                  </div>

                  <SubmitButton />
                </form>

                <div className="mt-6 text-center">
                  <Link href="/auth" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                    Back to Sign In
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
