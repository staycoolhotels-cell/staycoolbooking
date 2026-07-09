'use client';

import React, { useState } from 'react';
import Icon from '../../components/ui/AppIcon';

/**
 * PROTECTED Admin Setup Utility
 * This page initializes the admin user using credentials from .env file
 */
export default function AdminSetupPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // IMPORTANT: Change this to a private key only you know!
  const MASTER_SECRET = 'STAYCOOL_2024_DEPLOY_KEY';

  const createAdmin = async () => {
    // 1. Security Check
    if (secretKey !== MASTER_SECRET) {
      setStatus('error');
      setMessage('Invalid Secret Key. Access Denied.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      // Call the API route to initialize admin user
      const response = await fetch('/api/admin-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage(`Admin account initialized successfully! Email: ${result.adminEmail}`);
        setAdminEmail(result.adminEmail);
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
            <Icon name="LockClosedIcon" size={32} />
          </div>
          <h1 className="text-2xl font-heading font-bold">Protected Admin Setup</h1>
          <p className="text-text-secondary text-sm mt-2">
            Enter the master secret key to create the admin user.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-text-secondary">
              Master Secret Key
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter Deployment Key"
              data-1p-ignore=""
              data-op-ignore=""
              data-lpignore="true"
              data-dashlane-ignore="true"
              data-protonpass-ignore="true"
              autoComplete="off"
              className="w-full p-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          <button
            onClick={createAdmin}
            disabled={status === 'loading' || !secretKey}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
          >
            {status === 'loading' ? 'Processing...' : 'Authorize & Create Admin'}
          </button>
        </div>

        {message && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm border ${status === 'error'
                ? 'bg-error/10 border-error/20 text-error'
                : 'bg-green-500/10 border-green-500/20 text-green-600'
              }`}
          >
            <p className="font-bold mb-2">{message}</p>
            {status === 'success' && adminEmail && (
              <p className="text-xs mt-2 opacity-80">
                You can now login at <a href="/auth" className="underline">/auth</a> using the admin credentials.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
