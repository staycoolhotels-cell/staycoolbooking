'use client';

import { signUpUser } from '@/lib/auth-actions';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useState } from 'react';
import Icon from '@/components/ui/AppIcon'; // Import the Icon component

export default function SignupPage() {
  const [errorMessage, dispatch] = useActionState(signUpUser, undefined);
  const [selectedRole, setSelectedRole] = useState('Guest'); // State to manage selected role

  const roles = [
    {
      id: 'Guest',
      title: 'Guest',
      icon: 'UserIcon',
      description: 'Book unique stays and experiences.',
    },
    {
      id: 'Host',
      title: 'Host',
      icon: 'HomeModernIcon',
      description: 'List your property and earn money.',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="bg-card w-full max-w-md p-8 rounded-3xl shadow-brand-lg border border-border mt-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Create Your Account</h1>
          <p className="text-text-secondary mt-2">Sign up for an account</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium">
            {errorMessage}
          </div>
        )}

        <form action={dispatch} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-text-secondary mb-1 block" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              placeholder="Your Full Name"
              required
              className="w-full p-3 rounded-xl bg-muted border border-border outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
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

          <div>
            <label
              className="text-sm font-bold text-text-secondary mb-1 block"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              required
              className="w-full p-3 rounded-xl bg-muted border border-border outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>

          {/* Role selection buttons */}
          <div>
            <label className="text-sm font-bold text-text-secondary mb-3 block">
              I want to sign up as a...
            </label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center ${
                    selectedRole === role.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon
                    name={role.icon as any}
                    size={28}
                    className={`mb-2 ${selectedRole === role.id ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <h3 className="font-bold text-sm text-foreground">{role.title}</h3>
                </button>
              ))}
            </div>
          </div>

          {/* Hidden input to pass selected role to server action */}
          <input type="hidden" name="role" value={selectedRole} />

          <SignupButton />
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <Link href="/auth" className="text-sm text-primary font-bold hover:underline">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

function SignupButton() {
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
        'Sign Up'
      )}
    </button>
  );
}
