'use client';

import React from 'react';
import Turnstile from 'react-turnstile';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  siteKey?: string;
}

const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({ 
  onVerify, 
  siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY 
}) => {
  if (!siteKey) {
    console.warn('Turnstile Site Key missing. CAPTCHA will not render.');
    return null;
  }

  return (
    <div className="flex justify-center my-4 overflow-hidden rounded-xl">
      <Turnstile
        sitekey={siteKey}
        onVerify={onVerify}
        theme="dark"
      />
    </div>
  );
};

export default TurnstileWidget;
