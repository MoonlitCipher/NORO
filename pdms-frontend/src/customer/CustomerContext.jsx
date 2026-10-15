/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearSession, getSession, loginAccount, loginWithEmailVerified } from "./auth";

const CustomerContext = createContext(null);
const ORDERS_STORAGE_KEY = "noro.orders";

export function calculateDeliveryFare(distanceKm = 3) {
  const dist = Math.max(Number(distanceKm) || 1, 1);
  const baseFare = 75; // first 3 km
  const extraKm = Math.max(0, Number((dist - 3).toFixed(1)));
  const distanceFare = Math.round(extraKm * 15);
  const subtotal = baseFare + distanceFare;
  const platformFee = 12;
  const discount = 50;
  const total = Math.max(subtotal + platformFee - discount, 25);
  return {
    dist,
    baseFare,
    extraKm,
    distanceFare,
    subtotal,
    platformFee,
    discount,
    total,
  };
}

const defaultOrders = [
  { id: "NR-48219", from: "Whitefield", to: "HSR Layout", distance: 14.2, date: "Today, 4:30 PM", price: 205, status: "In transit", eta: "18 min", progress: 68, category: "Documents" },
  { id: "NR-48102", from: "Indiranagar", to: "Koramangala", distance: 5.6, date: "2 Oct, 11:20 AM", price: 76, status: "Delivered", progress: 100, category: "Food" },
  { id: "NR-47988", from: "Jayanagar", to: "MG Road", distance: 6.8, date: "29 Sep, 2:10 PM", price: 94, status: "Delivered", progress: 100, category: "Electronics" },
  { id: "NR-47661", from: "Hebbal", to: "Electronic City", distance: 28.5, date: "22 Sep, 9:05 AM", price: 419, status: "Cancelled", progress: 0, category: "Documents" },
];

const initialBookingState = {
  pickup: "Indiranagar 100ft Road, Bengaluru",
  pickupArea: "Indiranagar",
  pickupCoords: { lat: 12.9784, lng: 77.6408 },
  pickupSenderName: "",
  pickupSenderPhone: "",
  destination: "Koramangala 5th Block, Bengaluru",
  destinationArea: "Koramangala",
  destinationCoords: { lat: 12.9352, lng: 77.6245 },
  dropRecipientName: "",
  dropRecipientPhone: "",
  dropFlat: "",
  distanceKm: 5.2,
  pickupTime: "Now",
  scheduleDate: "",
  scheduleTime: "",
  category: "Documents",
  otherDescription: "",
  weight: "0.5–2 kg",
  dimensions: "Small",
  fragile: false,
  notes: "",
  payment: "UPI",
};

export function CustomerProvider({ children }) {
  const [booking, setBooking] = useState(initialBookingState);
  const [user, setUser] = useState(getSession);
  const [orders, setOrders] = useState(() => {
    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultOrders;
    } catch {
      return defaultOrders;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // storage unavailable
    }
  }, [orders]);

  const [notifications, setNotifications] = useState([
    { id: 1, title: "Your parcel is on the move", body: "Ravi picked up NR-48219 and is heading your way.", time: "8 min ago", type: "delivery", unread: true },
    { id: 2, title: "Payment confirmed", body: "₹184 was paid successfully for NR-48219.", time: "26 min ago", type: "payment", unread: true },
    { id: 3, title: "Delivered safely", body: "NR-48102 was delivered to Koramangala.", time: "2 days ago", type: "success", unread: false },
    { id: 4, title: "A little yellow surprise", body: "Use NORO50 to save ₹50 on your next delivery.", time: "4 days ago", type: "offer", unread: false },
  ]);

  const addOrder = (newOrder) => {
    setOrders((current) => [newOrder, ...current]);
  };

  const cancelOrder = (orderId) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, status: "Cancelled", eta: "Cancelled", progress: 0 }
          : order
      )
    );
  };

  const resetBooking = () => {
    setBooking(initialBookingState);
  };

  const value = useMemo(
    () => ({
      user,
      signIn: (identity, password) => {
        const result = loginAccount(identity, password);
        if (result.ok) setUser(result.user);
        return result;
      },
      signInWithEmail: (email) => {
        const result = loginWithEmailVerified(email);
        if (result.ok) setUser(result.user);
        return result;
      },
      signOut: () => {
        clearSession();
        setUser(null);
      },
      booking,
      setBooking,
      resetBooking,
      orders,
      addOrder,
      cancelOrder,
      notifications,
      markAllRead: () =>
        setNotifications((items) =>
          items.map((item) => ({ ...item, unread: false }))
        ),
    }),
    [user, booking, orders, notifications]
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export const useCustomer = () => useContext(CustomerContext);

