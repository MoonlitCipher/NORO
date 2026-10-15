import { Bell, CircleHelp, FileText, MapPin, Navigation, PackageCheck, Plus } from "lucide-react";

export const quickActions = [
  { label: "Book delivery", icon: Plus, path: "/customer/book" },
  { label: "Track parcel", icon: Navigation, path: "/customer/track" },
  { label: "Addresses", icon: MapPin, path: "/customer/addresses" },
  { label: "Get support", icon: CircleHelp, path: "/customer/support" },
];

export const notificationIcons = {
  delivery: Navigation,
  payment: FileText,
  success: PackageCheck,
  offer: Bell,
};
