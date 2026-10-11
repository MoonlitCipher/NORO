import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultBooking = {
  pickupAddress: 'Parvathipuram, Nagercoil',
  dropAddress: 'Tower Junction, Nagercoil',
  pickupLat: 8.1883,
  pickupLng: 77.4119,
  dropLat: 8.1804,
  dropLng: 77.4334,
  deliverySpeed: 'EXPRESS',
  packageType: 'SMALL_PARCEL',
  packageWeightKg: 1.0,
  packageDescription: 'Electronics & documents',
  specialInstructions: 'Handle with care',
  quote: null,
  order: null,
};

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(() => {
    try {
      const saved = sessionStorage.getItem('nextus_booking');
      return saved ? JSON.parse(saved) : defaultBooking;
    } catch {
      return defaultBooking;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('nextus_booking', JSON.stringify(booking));
    } catch (e) {
      console.error('Failed to save booking to sessionStorage', e);
    }
  }, [booking]);

  const updateBooking = (fields) => {
    setBooking((prev) => ({ ...prev, ...fields }));
  };

  const resetBooking = () => {
    setBooking(defaultBooking);
    sessionStorage.removeItem('nextus_booking');
  };

  return (
    <BookingContext.Provider value={{ booking, updateBooking, resetBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
