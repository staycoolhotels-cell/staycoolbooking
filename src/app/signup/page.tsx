'use client';

import { signUpUser, signInWithMobile, verifyMobileOtp } from '@/lib/auth-actions';
import { useActionState, useEffect, useState, Suspense } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Eye, EyeOff, Loader2, LockKeyhole, Mail, Phone, UserRound, ArrowRight, Ticket } from 'lucide-react';

export default function SignupPage() { return <Suspense fallback={<Loader />}><SignupContent /></Suspense>; }

function SignupContent() {
  const params = useSearchParams();
  const router = useRouter();
  const role = params.get('role')?.toLowerCase() === 'host' ? 'Host' : 'Guest';
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailState, emailAction] = useActionState<any, FormData>(signUpUser, undefined);
  const [mobileState, mobileAction] = useActionState<any, FormData>(async (previous, formData) => {
    if (!otpSent) {
      const result = await signInWithMobile(previous, formData);
      if (typeof result === 'object' && result?.success) { setOtpSent(true); return undefined; }
      return result;
    }
    return verifyMobileOtp(previous, formData);
  }, undefined);

  useEffect(() => {
    if (typeof emailState === 'object' && emailState?.success) router.push('/auth?role=' + role.toLowerCase());
    if (typeof mobileState === 'object' && mobileState?.success) router.push(role === 'Host' ? '/host-onboarding' : '/');
  }, [emailState, mobileState, role, router]);

  const state = method === 'email' ? emailState : mobileState;
  const error = typeof state === 'string' ? state : (state && !state.success ? state.message : '');

  return <main className="min-h-screen bg-[#030405] px-4 py-5 text-white sm:px-6 sm:py-8">
    <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[780px] items-center justify-center sm:min-h-[calc(100vh-4rem)]">
      <section className="auth-card w-full rounded-[24px] border border-white/10 bg-[#050505] px-4 py-6 shadow-[0_20px_70px_rgba(0,0,0,.55)] sm:px-6 sm:py-7 lg:grid lg:grid-cols-[.72fr_1.28fr] lg:gap-7 lg:px-7 lg:py-7">
        <div className="auth-intro">
        <div className="mx-auto mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-[21px] border border-white/15 bg-[#111214] p-3"><img src="/assets/images/logo.png" alt="StayCool" className="h-full w-full object-contain" /></div>
        <header className="mb-7 text-center"><h1 className="font-serif text-[30px] font-bold leading-none sm:text-[34px]">Create Account</h1><p className="mt-2 text-sm text-zinc-400">Join StayCool as a {role.toLowerCase()}</p></header>
        </div>
        <div className="auth-form-panel">
        <div className="mb-7 grid grid-cols-2 rounded-2xl border border-white/10 bg-[#101012] p-1.5"><Tab active={method === 'email'} onClick={() => { setMethod('email'); setOtpSent(false); }} icon={<Mail size={18} />} label="Email" /><Tab active={method === 'phone'} onClick={() => { setMethod('phone'); setOtpSent(false); }} icon={<Phone size={18} />} label="Mobile" /></div>
        {error && <p className="mb-5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        {method === 'email' ? <form action={emailAction} className="space-y-5">
          <Field label="Full name" icon={<UserRound size={22} />}><input name="fullName" type="text" placeholder="Your full name" required className="auth-input" /></Field>
          <Field label="Email address" icon={<Mail size={22} />}><input name="email" type="email" placeholder="name@example.com" required className="auth-input" /></Field>
          <PasswordField label="Password" show={showPassword} setShow={setShowPassword} name="password" />
          <PasswordField label="Confirm password" show={showConfirm} setShow={setShowConfirm} name="confirmPassword" />
          {role === 'Host' && <Field label="Referral code (optional)" icon={<Ticket size={22} />}><input name="referralCode" type="text" placeholder="Enter referral code" className="auth-input uppercase" /></Field>}
          <input type="hidden" name="role" value={role} /><Submit>Create Account</Submit>
        </form> : <form action={mobileAction} className="space-y-5">
          {!otpSent ? <><Field label="Full name" icon={<UserRound size={22} />}><input name="name" value={name} onChange={event => setName(event.target.value)} type="text" placeholder="Your full name" required className="auth-input" /></Field><Field label="Mobile number" icon={<Phone size={22} />}><input name="phone" value={phone} onChange={event => setPhone(event.target.value)} type="tel" inputMode="numeric" placeholder="Enter mobile number" required className="auth-input" /></Field>{role === 'Host' && <Field label="Referral code (optional)" icon={<Ticket size={22} />}><input name="referralCode" value={referralCode} onChange={event => setReferralCode(event.target.value)} type="text" placeholder="Enter referral code" className="auth-input uppercase" /></Field>}<input type="hidden" name="role" value={role} /><input type="hidden" name="flow" value="signup" /><Submit>Send OTP</Submit></> : <><input type="hidden" name="phone" value={phone} /><input type="hidden" name="name" value={name} /><input type="hidden" name="referralCode" value={referralCode} /><input type="hidden" name="role" value={role} /><Field label="Verification code" icon={<LockKeyhole size={22} />}><input name="otp" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit code" required className="auth-input tracking-[.28em]" /></Field><button type="button" onClick={() => setOtpSent(false)} className="text-sm text-sky-400">Change mobile number</button><Submit>Verify & Create Account</Submit></>}
        </form>}
        <div className="my-8 flex items-center gap-3"><span className="h-px flex-1 bg-white/10" /><span className="text-xs text-zinc-500">Already registered?</span><span className="h-px flex-1 bg-white/10" /></div>
        <Link href={`/auth?role=${role.toLowerCase()}`} className="flex items-center justify-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-400/5 py-4 text-sm font-semibold text-sky-300 transition hover:bg-sky-400/10">Sign In <ArrowRight size={18} /></Link>
        </div>
      </section>
    </div>
  </main>;
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button type="button" onClick={onClick} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-base font-semibold transition ${active ? 'border border-sky-400/40 bg-sky-400/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>{icon}{label}</button>; }
function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) { return <div><label className="auth-label">{label}</label><div className="auth-field">{icon}{children}</div></div>; }
function PasswordField({ label, show, setShow, name }: { label: string; show: boolean; setShow: (show: boolean) => void; name: string }) { return <div><label className="auth-label">{label}</label><div className="auth-field"><LockKeyhole className="auth-icon" size={22} /><input name={name} type={show ? 'text' : 'password'} placeholder="••••••••" required className="auth-input pr-10" /><button type="button" aria-label="Toggle password visibility" onClick={() => setShow(!show)} className="absolute right-4 text-zinc-500 hover:text-zinc-200">{show ? <EyeOff size={21} /> : <Eye size={21} />}</button></div></div>; }
function Submit({ children }: { children: React.ReactNode }) { const { pending } = useFormStatus(); return <button type="submit" disabled={pending} className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-4 text-lg font-bold text-white shadow-[0_10px_26px_rgba(14,116,255,.28)] transition hover:brightness-110 disabled:opacity-60">{pending ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={20} />Please wait</span> : children}</button>; }
function Loader() { return <div className="flex min-h-screen items-center justify-center bg-[#030405]"><Loader2 className="animate-spin text-sky-400" size={32} /></div>; }
