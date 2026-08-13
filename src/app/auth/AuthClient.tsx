'use client';

import { login, signInWithMobile, verifyMobileOtp } from '@/lib/auth-actions';
import { useActionState, useEffect, useState, Suspense } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Mail, Phone, LockKeyhole, ArrowRight } from 'lucide-react';

export default function AuthClient() {
  return <Suspense fallback={<AuthLoader />}><AuthContent /></Suspense>;
}

function AuthContent() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedRole = params.get('role')?.toLowerCase();
  const expectedRole: 'guest' | 'host' | 'admin' = requestedRole === 'host' || requestedRole === 'admin' ? requestedRole : 'guest';
  const returnTo = params.get('returnTo')?.startsWith('/guest-booking-flow') ? params.get('returnTo')! : '';
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailState, emailAction] = useActionState(login, undefined);
  const [mobileState, mobileAction] = useActionState(async (previous: any, formData: FormData) => {
    if (!otpSent) {
      const result = await signInWithMobile(previous, formData);
      if (typeof result === 'object' && result?.success) { setOtpSent(true); return undefined; }
      return result;
    }
    return verifyMobileOtp(previous, formData);
  }, undefined);

  useEffect(() => {
    if (typeof mobileState === 'object' && mobileState?.success) {
      router.replace(expectedRole === 'host' ? '/host-onboarding' : expectedRole === 'admin' ? '/admin-panel' : (returnTo || '/'));
    }
  }, [mobileState, expectedRole, returnTo, router]);

  const error = method === 'email' ? (typeof emailState === 'string' ? emailState : '') : (typeof mobileState === 'string' ? mobileState : '');
  const signupHref = `/signup?role=${expectedRole}`;

  return (
    <main className="min-h-screen bg-[#030405] px-4 py-5 text-white sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[780px] items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <section className="auth-card w-full rounded-[24px] border border-white/10 bg-[#050505] px-4 py-6 shadow-[0_20px_70px_rgba(0,0,0,.55)] sm:px-6 sm:py-7 lg:grid lg:grid-cols-[.72fr_1.28fr] lg:gap-7 lg:px-7 lg:py-7">
          <div className="auth-intro">
          <div className="mx-auto mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-[21px] border border-white/15 bg-[#111214] p-3">
            <img src="/assets/images/logo.png" alt="StayCool" className="h-full w-full object-contain" />
          </div>
          <header className="mb-9 text-center">
            <h1 className="font-serif text-[32px] font-bold leading-none tracking-tight sm:text-[36px]">{expectedRole === 'admin' ? 'Admin Login' : 'Welcome Back'}</h1>
            <p className="mt-2 text-sm text-zinc-400">Sign in to access your {expectedRole === 'admin' ? 'admin' : expectedRole} account</p>
          </header>

          </div>
          <div className="auth-form-panel">

          <div className="mb-8 grid grid-cols-2 rounded-2xl border border-white/10 bg-[#101012] p-1.5">
            <MethodButton active={method === 'email'} onClick={() => { setMethod('email'); setOtpSent(false); }} icon={<Mail size={19} />} label="Email" />
            <MethodButton active={method === 'phone'} onClick={() => { setMethod('phone'); setOtpSent(false); }} icon={<Phone size={19} />} label="Mobile" />
          </div>

          {error && <p className="mb-5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}

          {method === 'email' ? (
            <form action={emailAction} className="space-y-6">
              <input type="hidden" name="expectedRole" value={expectedRole} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <Field label="Email address" icon={<Mail size={23} />}><input id="email" name="email" type="email" autoComplete="email" placeholder="name@example.com" required className="auth-input" /></Field>
              <div>
                <div className="mb-3 flex items-center justify-between"><label htmlFor="password" className="auth-label">Password</label><Link href="/forgot-password" className="text-sm text-sky-400 hover:text-sky-300">Forgot password?</Link></div>
                <div className="auth-field"><LockKeyhole className="auth-icon" size={23} /><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" required className="auth-input pr-12" /><button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-zinc-500 hover:text-zinc-200">{showPassword ? <EyeOff size={22} /> : <Eye size={22} />}</button></div>
              </div>
              <SubmitButton>Sign In</SubmitButton>
            </form>
          ) : (
            <form action={mobileAction} className="space-y-6">
              <input type="hidden" name="expectedRole" value={expectedRole} />
              {!otpSent ? <Field label="Mobile number" icon={<Phone size={23} />}><input id="phone" name="phone" type="tel" inputMode="numeric" placeholder="Enter mobile number" required value={phone} onChange={(event) => setPhone(event.target.value)} className="auth-input" /></Field> : <Field label="Verification code" icon={<LockKeyhole size={23} />}><input name="phone" type="hidden" value={phone} /><input id="otp" name="otp" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit code" required className="auth-input tracking-[.28em]" /></Field>}
              {otpSent && <button type="button" onClick={() => setOtpSent(false)} className="-mt-3 text-sm text-sky-400">Change mobile number</button>}
              <SubmitButton>{otpSent ? 'Verify & Sign In' : 'Send OTP'}</SubmitButton>
            </form>
          )}

          {expectedRole !== 'admin' && <><div className="my-8 flex items-center gap-3"><span className="h-px flex-1 bg-white/10" /><span className="text-xs text-zinc-500">New to StayCool?</span><span className="h-px flex-1 bg-white/10" /></div>
          <Link href={signupHref} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-400/5 py-4 text-sm font-semibold text-sky-300 transition hover:bg-sky-400/10">Create an account <ArrowRight size={18} /></Link></>}
          <p className="mt-6 text-center text-xs text-zinc-500">Signing in as a {expectedRole} · <Link href={expectedRole === 'host' ? '/auth?role=guest' : '/auth?role=host'} className="text-sky-400">Switch portal</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}

function MethodButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button type="button" onClick={onClick} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-base font-semibold transition ${active ? 'border border-sky-400/40 bg-sky-400/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>{icon}{label}</button>;
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div><label className="auth-label">{label}</label><div className="auth-field">{icon}{children}</div></div>;
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-4 text-lg font-bold text-white shadow-[0_10px_26px_rgba(14,116,255,.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{pending ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={20} />Please wait</span> : children}</button>;
}

function AuthLoader() { return <div className="flex min-h-screen items-center justify-center bg-[#030405]"><Loader2 className="animate-spin text-sky-400" size={32} /></div>; }
