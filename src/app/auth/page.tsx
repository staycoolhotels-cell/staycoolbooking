'use client';

import { login } from '@/lib/auth-actions';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

export default function AuthPage() {
  const [errorMessage, dispatch] = useActionState(login, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="bg-card w-full max-w-md p-8 rounded-3xl shadow-brand-lg border border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Welcome Back</h1>
          <p className="text-text-secondary mt-2">Sign in to your account</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium">
            {errorMessage}
          </div>
        )}

        <form action={dispatch} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-text-secondary mb-1 block" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="name@example.com"
              required
              className="w-full p-3 rounded-xl bg-muted border border-border outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-text-secondary mb-1 block" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="w-full p-3 rounded-xl bg-muted border border-border outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>


          
          <LoginButton />
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <Link href="/signup" className="text-sm text-primary font-bold hover:underline">
            Don't have an account? Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-brand-md hover:opacity-90 transition-all disabled:opacity-50 mt-4"
    >
      {pending ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Processing...
        </div>
      ) : (
        'Sign In'
      )}
    </button>
  );
}
