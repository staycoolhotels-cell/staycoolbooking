'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Icon from '../../components/ui/AppIcon';

/**
 * PROTECTED Admin Setup Utility
 */
export default function AdminSetupPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [secretKey, setSecretKey] = useState('');

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
      const { data, error } = await supabase.auth.signUp({
        email: 'balapraveenraju.madanu@gmail.com',
        password: 'DefaultPassword123',
        options: {
          data: {
            role: 'Admin', // This unlocks the Admin Panel
            full_name: 'System Admin',
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setStatus('success');
        setMessage('Admin account created successfully! You can now log in.');
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
            className={`mt-6 p-4 rounded-xl text-sm border ${
              status === 'error'
                ? 'bg-error/10 border-error/20 text-error'
                : 'bg-green-500/10 border-green-500/20 text-green-600'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
