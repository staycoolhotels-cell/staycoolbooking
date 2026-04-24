'use client';

import React from 'react';
import dynamic from 'next/dynamic';

interface MapPickerProps {
  lat?: number;
  lng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressSelect?: (address: any) => void;
  address?: string;
}

// Dynamically import the real map component with no SSR
const MapPickerContent = dynamic(() => import('./MapPickerContent'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-800 animate-pulse rounded-xl flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading Interactive Map...</div>
});
const MapPicker = React.memo((props: MapPickerProps) => {
  return <MapPickerContent {...props} />;
}, (prevProps, nextProps) => {
  return (
    prevProps.lat === nextProps.lat &&
    prevProps.lng === nextProps.lng &&
    prevProps.address === nextProps.address
  );
});

export default MapPicker;
