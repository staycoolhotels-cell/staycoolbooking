'use client';

import { sendPasswordResetEmail } from '@/lib/auth-actions';
import { useActionState, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';

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
            Sending…
          </>
        ) : (
          'Send Reset Link'
        )}
      </span>
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(sendPasswordResetEmail, undefined);

  const parsed = (() => {
    try { return state ? JSON.parse(state) : null; } catch { return null; }
  })();

  const success = parsed?.success;
  const errorMsg = parsed?.error;

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
          {/* Back link */}
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 text-sm mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Sign In
          </Link>

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
              Forgot Password?
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm">
              Enter your email and we'll send you a reset link.
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
                <h2 className="text-white font-bold text-lg mb-2">Check your inbox</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  We've sent a password reset link to your email address. Please check your inbox and spam folder.
                </p>
                <Link
                  href="/auth"
                  className="mt-6 inline-flex items-center gap-1.5 text-sky-400 font-semibold hover:text-sky-300 transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
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

                <form action={action} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1" htmlFor="fp-email">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-3.5 w-4 h-4 md:w-5 md:h-5 text-zinc-500 group-focus-within:text-sky-400 transition-colors" />
                      <input
                        id="fp-email"
                        type="email"
                        name="email"
                        placeholder="name@example.com"
                        required
                        className="w-full pl-11 md:pl-12 pr-4 md:py-3.5 py-2.5 text-xs md:text-sm rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <SubmitButton />
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
