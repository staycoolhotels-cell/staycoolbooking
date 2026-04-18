'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Property, Booking, User } from './types';

interface AppState {
  // Data
  properties: Property[];
  bookings: Booking[];
  currentUser: User | null;
  wishlistIds: string[];

  // Loading States
  isStatsLoading: boolean;
  isInitialLoadComplete: boolean;

  // Actions
  setProperties: (properties: Property[]) => void;
  updateProperty: (property: Partial<Property> & { id: string }) => void;
  setBookings: (bookings: Booking[]) => void;
  setCurrentUser: (user: User | null) => void;
  setWishlistIds: (ids: string[]) => void;
  toggleWishlistItem: (propertyId: string) => void;
  clearCache: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial State
      properties: [],
      bookings: [],
      currentUser: null,
      wishlistIds: [],
      isStatsLoading: false,
      isInitialLoadComplete: false,

      // Actions
      setProperties: (properties) => set({ properties, isInitialLoadComplete: true }),
      
      updateProperty: (updatedProperty) => set((state) => ({
        properties: state.properties.map((p) => 
          p.id === updatedProperty.id ? { ...p, ...updatedProperty } : p
        )
      })),

      setBookings: (bookings) => set({ bookings }),
      
      setCurrentUser: (user) => set({ currentUser: user }),
      
      setWishlistIds: (ids) => set({ wishlistIds: ids }),
      
      toggleWishlistItem: (propertyId) => set((state) => {
        const isSaved = state.wishlistIds.includes(propertyId);
        return {
          wishlistIds: isSaved 
            ? state.wishlistIds.filter(id => id !== propertyId)
            : [...state.wishlistIds, propertyId]
        };
      }),

      clearCache: () => set({ 
        properties: [], 
        bookings: [], 
        currentUser: null, 
        wishlistIds: [],
        isInitialLoadComplete: false 
      }),
    }),
    {
      name: 'staycool-app-cache', // Key in local storage
      storage: createJSONStorage(() => localStorage),
      // Only persist specific parts of the state
      partialize: (state) => ({ 
        properties: state.properties,
        currentUser: state.currentUser,
        wishlistIds: state.wishlistIds
      }),
    }
  )
);
