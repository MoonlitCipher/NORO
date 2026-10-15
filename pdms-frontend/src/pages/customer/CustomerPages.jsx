import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Box,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  FileText,
  Gift,
  Home,
  IndianRupee,
  LocateFixed,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Navigation,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { calculateDeliveryFare, useCustomer } from "../../customer/CustomerContext";
import {
  AddressRoute,
  BookingProgress,
  CustomerShell,
  NoroMark,
  OrderCard,
  PageHeader,
  SectionTitle,
} from "../../components/customer/CustomerUI";
import { notificationIcons, quickActions } from "../../customer/customerData";

// Mercator projection helpers for dynamic slippy map
function project(lat, lng, zoom) {
  const sin = Math.sin((lat * Math.PI) / 180);
  const clampedSin = Math.min(Math.max(sin, -0.9999), 0.9999);
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n * 256;
  const y = (0.5 - Math.log((1 + clampedSin) / (1 - clampedSin)) / (4 * Math.PI)) * n * 256;
  return { x, y };
}

function unproject(x, y, zoom) {
  const n = Math.pow(2, zoom);
  const lng = (x / (n * 256)) * 360 - 180;
  const nY = Math.PI * (1 - (2 * y) / (n * 256));
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(nY));
  return {
    lat: Math.min(Math.max(lat, -85), 85),
    lng: Math.min(Math.max(lng, -180), 180),
  };
}

// Curated map landmarks for accurate city map selection
const MAP_LANDMARKS = [
  {
    id: "indiranagar",
    title: "Indiranagar 100ft Road",
    area: "Indiranagar",
    address: "100ft Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
    road: "100ft Road",
    pincode: "560038",
    lat: 12.9784,
    lng: 77.6408,
  },
  {
    id: "koramangala",
    title: "Koramangala 5th Block",
    area: "Koramangala",
    address: "22, 100ft Inner Ring Road, Koramangala 5th Block, Bengaluru 560095",
    road: "100ft Inner Ring Road",
    pincode: "560095",
    lat: 12.9352,
    lng: 77.6245,
  },
  {
    id: "hsr",
    title: "HSR Layout Sector 1",
    area: "HSR Layout",
    address: "14th Main Road, HSR Layout Sector 1, Bengaluru 560102",
    road: "14th Main Road",
    pincode: "560102",
    lat: 12.9121,
    lng: 77.6446,
  },
  {
    id: "whitefield",
    title: "Whitefield ITPL Main Rd",
    area: "Whitefield",
    address: "ITPL Main Road, Pattandur Agrahara, Whitefield, Bengaluru 560066",
    road: "ITPL Main Road",
    pincode: "560066",
    lat: 12.9698,
    lng: 77.75,
  },
  {
    id: "mgroad",
    title: "MG Road Metro Station",
    area: "MG Road",
    address: "Trinity Circle, MG Road, Bengaluru 560001",
    road: "MG Road",
    pincode: "560001",
    lat: 12.9756,
    lng: 77.6066,
  },
  {
    id: "jayanagar",
    title: "Jayanagar 4th Block",
    area: "Jayanagar",
    address: "11th Main Rd, 4th Block, Jayanagar, Bengaluru 560011",
    road: "11th Main Road",
    pincode: "560011",
    lat: 12.9308,
    lng: 77.5838,
  },
  {
    id: "electroniccity",
    title: "Electronic City Phase 1",
    area: "Electronic City",
    address: "Hosur Road, Electronics City Phase 1, Bengaluru 560100",
    road: "Hosur Road",
    pincode: "560100",
    lat: 12.8452,
    lng: 77.6602,
  },
  {
    id: "hebbal",
    title: "Hebbal Flyover Junction",
    area: "Hebbal",
    address: "Bellary Road, Hebbal, Bengaluru 560024",
    road: "Bellary Road",
    pincode: "560024",
    lat: 13.0358,
    lng: 77.597,
  },
  {
    id: "marathahalli",
    title: "Marathahalli Bridge",
    area: "Marathahalli",
    address: "Outer Ring Road, Marathahalli, Bengaluru 560037",
    road: "Outer Ring Road",
    pincode: "560037",
    lat: 12.9591,
    lng: 77.6974,
  },
  {
    id: "malleshwaram",
    title: "Malleshwaram 8th Cross",
    area: "Malleshwaram",
    address: "Sampige Road, Malleshwaram, Bengaluru 560003",
    road: "Sampige Road",
    pincode: "560003",
    lat: 13.0031,
    lng: 77.5702,
  },
  {
    id: "bellandur",
    title: "Bellandur EcoSpace",
    area: "Bellandur",
    address: "Outer Ring Road, Bellandur, Bengaluru 560103",
    road: "Outer Ring Road",
    pincode: "560103",
    lat: 12.9256,
    lng: 77.6766,
  },
  {
    id: "btm",
    title: "BTM Layout 2nd Stage",
    area: "BTM Layout",
    address: "7th Main Rd, BTM 2nd Stage, Bengaluru 560076",
    road: "7th Main Road",
    pincode: "560076",
    lat: 12.9166,
    lng: 77.6101,
  },
  {
    id: "domlur",
    title: "Domlur EGL Business Park",
    area: "Domlur",
    address: "Intermediate Ring Road, Domlur, Bengaluru 560071",
    road: "Intermediate Ring Road",
    pincode: "560071",
    lat: 12.9609,
    lng: 77.6387,
  },
  {
    id: "rajajinagar",
    title: "Rajajinagar Orion Mall",
    area: "Rajajinagar",
    address: "Dr. Rajkumar Road, Rajajinagar, Bengaluru 560010",
    road: "Dr Rajkumar Road",
    pincode: "560010",
    lat: 12.9982,
    lng: 77.553,
  },
  {
    id: "jpnagar",
    title: "JP Nagar 6th Phase",
    area: "JP Nagar",
    address: "24th Main Road, JP Nagar 6th Phase, Bengaluru 560078",
    road: "24th Main Road",
    pincode: "560078",
    lat: 12.9063,
    lng: 77.5857,
  },
];

// Computes realistic urban driving distance in km
function computeRoadDistance(c1, c2) {
  if (!c1 || !c2) return 5.2;
  const R = 6371;
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLon = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const crowDistance = R * c;
  const roadKm = Number((crowDistance * 1.35).toFixed(1));
  return Math.max(roadKm, 1.2);
}

// Reverse geocodes any (lat, lng) to an accurate landmark/street/area
function reverseGeocode(lat, lng) {
  let closest = MAP_LANDMARKS[0];
  let minDistance = Infinity;

  for (const item of MAP_LANDMARKS) {
    const dLat = (item.lat - lat) * 111.32;
    const dLng = (item.lng - lng) * 111.32 * Math.cos((lat * Math.PI) / 180);
    const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
    if (distKm < minDistance) {
      minDistance = distKm;
      closest = item;
    }
  }

  const roundedLat = Number(lat.toFixed(5));
  const roundedLng = Number(lng.toFixed(5));

  if (minDistance < 0.2) {
    return {
      id: closest.id,
      title: closest.title,
      area: closest.area,
      address: closest.address,
      lat: roundedLat,
      lng: roundedLng,
      distanceKm: minDistance,
    };
  }

  const dLat = lat - closest.lat;
  const dLng = lng - closest.lng;
  const ns = dLat > 0 ? "North" : "South";
  const ew = dLng > 0 ? "East" : "West";
  const direction =
    Math.abs(dLat) > 2 * Math.abs(dLng)
      ? ns
      : Math.abs(dLng) > 2 * Math.abs(dLat)
      ? ew
      : `${ns}-${ew}`;
  const meters = Math.round(minDistance * 1000);

  if (minDistance < 1.4) {
    return {
      id: `${closest.id}_${Math.round(lat * 1000)}_${Math.round(lng * 1000)}`,
      title: `${closest.area} (${direction})`,
      area: closest.area,
      address: `Near ${closest.title}, ${direction} Sector, ${closest.road || "Main Rd"}, Bengaluru ${closest.pincode}`,
      lat: roundedLat,
      lng: roundedLng,
      distanceKm: minDistance,
    };
  }

  return {
    id: `loc_${Math.round(lat * 1000)}_${Math.round(lng * 1000)}`,
    title: `${closest.area} Outer`,
    area: closest.area,
    address: `${Math.round(meters / 50) * 50}m ${direction} of ${closest.area}, Bengaluru ${closest.pincode}`,
    lat: roundedLat,
    lng: roundedLng,
    distanceKm: minDistance,
  };
}

/**
 * Dynamic Interactive Map Location Picker Modal (Flipkart / Google Maps Style)
 * Lets customers drag/pan the map, zoom, click anywhere, or search landmarks.
 */
function MapLocationPickerModal({ mode, currentCoords, onSelect, onClose }) {
  const [coords, setCoords] = useState(() => {
    if (currentCoords?.lat && currentCoords?.lng) {
      return { lat: currentCoords.lat, lng: currentCoords.lng };
    }
    const def = MAP_LANDMARKS[mode === "pickup" ? 0 : 1];
    return { lat: def.lat, lng: def.lng };
  });

  const [zoom, setZoom] = useState(14);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [locatingToast, setLocatingToast] = useState("");

  const mapFrameRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 540, height: 320 });
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startCenterPixel: { x: 0, y: 0 },
    distance: 0,
  });

  // Track map container dimensions dynamically
  useEffect(() => {
    const updateSize = () => {
      if (mapFrameRef.current) {
        const rect = mapFrameRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Compute active location dynamically via reverse geocoding
  const activeLocation = useMemo(() => {
    return reverseGeocode(coords.lat, coords.lng);
  }, [coords.lat, coords.lng]);

  // Center pixel in Mercator projection
  const centerPixel = useMemo(() => {
    return project(coords.lat, coords.lng, zoom);
  }, [coords.lat, coords.lng, zoom]);

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return MAP_LANDMARKS.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.area.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Dynamic OpenStreetMap tiles covering current viewport
  const tiles = useMemo(() => {
    const W = dimensions.width || 540;
    const H = dimensions.height || 320;
    const minPixelX = centerPixel.x - W / 2;
    const maxPixelX = centerPixel.x + W / 2;
    const minPixelY = centerPixel.y - H / 2;
    const maxPixelY = centerPixel.y + H / 2;

    const minTileX = Math.floor(minPixelX / 256);
    const maxTileX = Math.floor(maxPixelX / 256);
    const minTileY = Math.floor(minPixelY / 256);
    const maxTileY = Math.floor(maxPixelY / 256);

    const maxTiles = Math.pow(2, zoom);
    const list = [];

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      if (ty < 0 || ty >= maxTiles) continue;
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const wrappedTx = ((tx % maxTiles) + maxTiles) % maxTiles;
        const left = tx * 256 - minPixelX;
        const top = ty * 256 - minPixelY;
        list.push({
          key: `${zoom}-${tx}-${ty}`,
          url: `https://tile.openstreetmap.org/${zoom}/${wrappedTx}/${ty}.png`,
          left,
          top,
        });
      }
    }
    return list;
  }, [centerPixel, zoom, dimensions]);

  // Landmark markers on screen
  const visibleLandmarks = useMemo(() => {
    const W = dimensions.width || 540;
    const H = dimensions.height || 320;
    return MAP_LANDMARKS.map((item) => {
      const p = project(item.lat, item.lng, zoom);
      const x = p.x - centerPixel.x + W / 2;
      const y = p.y - centerPixel.y + H / 2;
      return {
        ...item,
        screenX: x,
        screenY: y,
        isVisible: x >= -60 && x <= W + 60 && y >= -60 && y <= H + 60,
      };
    }).filter((item) => item.isVisible);
  }, [centerPixel, zoom, dimensions]);

  // Pointer drag handling for smooth pan & click
  const handlePointerDown = (e) => {
    if (e.target.closest("button") || e.target.closest(".map-search-row")) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startCenterPixel: { ...centerPixel },
      distance: 0,
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    dragRef.current.distance += Math.abs(dx) + Math.abs(dy);

    const newPixelX = dragRef.current.startCenterPixel.x - dx;
    const newPixelY = dragRef.current.startCenterPixel.y - dy;
    const newCoords = unproject(newPixelX, newPixelY, zoom);
    setCoords(newCoords);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setIsDragging(false);

    // If total drag distance was tiny (< 6px), treat as tap/click to center on clicked point
    if (dragRef.current.distance < 6 && mapFrameRef.current) {
      const rect = mapFrameRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const targetPixelX = centerPixel.x + (clickX - rect.width / 2);
      const targetPixelY = centerPixel.y + (clickY - rect.height / 2);
      const clickedCoords = unproject(targetPixelX, targetPixelY, zoom);
      setCoords(clickedCoords);
    }
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(z + 1, 18));
    } else if (e.deltaY > 0) {
      setZoom((z) => Math.max(z - 1, 11));
    }
  };

  // Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(z + 1, 18));
  const zoomOut = () => setZoom((z) => Math.max(z - 1, 11));

  // Center on user location / GPS
  const handleLocateMe = () => {
    setLocatingToast("Locating your position...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocatingToast("Centered on GPS location");
          setTimeout(() => setLocatingToast(""), 2000);
        },
        () => {
          setCoords({ lat: 12.9784, lng: 77.6408 });
          setLocatingToast("Centered on City Center");
          setTimeout(() => setLocatingToast(""), 2000);
        },
        { timeout: 4000 }
      );
    } else {
      setCoords({ lat: 12.9784, lng: 77.6408 });
      setLocatingToast("Centered on City Center");
      setTimeout(() => setLocatingToast(""), 2000);
    }
  };

  const handleSelectLandmark = (lm) => {
    setCoords({ lat: lm.lat, lng: lm.lng });
    setSearchQuery("");
    setShowSearchDropdown(false);
  };

  const handleConfirm = () => {
    onSelect(activeLocation);
  };

  return (
    <div className="modal-backdrop map-picker-backdrop" role="dialog" aria-modal="true">
      <div className="map-picker-card">
        <header className="map-picker-header">
          <div className="map-picker-title">
            <span className="eyebrow">
              {mode === "pickup" ? "PICKUP LOCATION" : "DROP-OFF LOCATION"}
            </span>
            <h3>Select location on map</h3>
          </div>
          <button className="icon-button light modal-close-btn" onClick={onClose} aria-label="Close map">
            <X size={18} />
          </button>
        </header>

        {/* Search bar inside map */}
        <div className="map-search-wrapper">
          <div className="map-search-row">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search area, landmark or street on map…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
            />
            {searchQuery && (
              <button
                className="text-clear-btn"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchDropdown(false);
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="map-search-dropdown" role="listbox">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="map-search-item"
                  role="option"
                  tabIndex={0}
                  onClick={() => handleSelectLandmark(item)}
                >
                  <MapPin size={16} className="item-pin-icon" />
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.address}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick landmark chips */}
        <div className="map-chip-list" tabIndex={0} aria-label="Quick map landmarks">
          {MAP_LANDMARKS.slice(0, 10).map((item) => {
            const isActive = activeLocation.area === item.area;
            return (
              <button
                key={item.id}
                type="button"
                className={`map-chip ${isActive ? "active" : ""}`}
                onClick={() => handleSelectLandmark(item)}
              >
                <MapPin size={13} />
                {item.area}
              </button>
            );
          })}
        </div>

        {/* Interactive Dynamic Map Canvas */}
        <div
          ref={mapFrameRef}
          className={`interactive-map-frame ${isDragging ? "dragging" : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          style={{ touchAction: "none" }}
        >
          {/* Base Vector Canvas Underlay (Ensures visual road grid even offline) */}
          <div className="map-vector-canvas-underlay">
            <div className="map-grid-layer" />
            <svg
              className="map-vector-routes"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{
                transform: `scale(${zoom / 14}) translate(${((centerPixel.x % 256) - 128) / 8}px, ${((centerPixel.y % 256) - 128) / 8}px)`,
                transformOrigin: "center center",
              }}
            >
              {/* Water features */}
              <path d="M 0,25 Q 25,28 40,40 T 70,80 L 75,100 L 0,100 Z" fill="#e2edf7" opacity="0.85" />
              {/* Arterial Highways */}
              <path d="M 0,38 L 100,38" stroke="#f6bd60" strokeWidth="3" strokeLinecap="round" />
              <path d="M 25,0 L 75,100" stroke="#f6bd60" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M 0,70 L 100,60" stroke="#f6bd60" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M 60,0 L 40,100" stroke="#e9d8a6" strokeWidth="2.2" strokeLinecap="round" />
              {/* Ring Roads */}
              <path d="M 15,15 Q 85,20 85,85" stroke="#eed3be" strokeWidth="2.2" fill="none" strokeDasharray="4 3" />
            </svg>
          </div>

          {/* Dynamic OpenStreetMap Slippy Tile Images */}
          <div className="slippy-tiles-container">
            {tiles.map((t) => (
              <img
                key={t.key}
                src={t.url}
                alt=""
                loading="lazy"
                crossOrigin="anonymous"
                className="map-tile-img"
                style={{
                  position: "absolute",
                  left: `${t.left}px`,
                  top: `${t.top}px`,
                  width: "256px",
                  height: "256px",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ))}
          </div>

          {/* Interactive Landmark Pins on the Map */}
          {visibleLandmarks.map((item) => (
            <button
              key={item.id}
              type="button"
              className="dynamic-map-poi"
              style={{
                left: `${item.screenX}px`,
                top: `${item.screenY}px`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectLandmark(item);
              }}
              title={item.title}
            >
              <span className="poi-dot" />
              <span className="poi-label">{item.area}</span>
            </button>
          ))}

          {/* Center Targeting Reticle (Flipkart Style on ground beneath pin) */}
          <div className="pin-target-reticle" />

          {/* Center Floating Pin (Flipkart Style lifts on drag) */}
          <div className={`dynamic-center-pin ${isDragging ? "dragging" : ""}`}>
            <div className="pin-tooltip">
              {isDragging ? "Move map to adjust" : mode === "pickup" ? "Pickup here" : "Deliver here"}
            </div>
            <div className={`pin-icon-badge ${mode === "pickup" ? "pickup-badge" : "drop-badge"}`}>
              <MapPin size={22} />
            </div>
            <div className="pin-anchor-shadow" />
          </div>

          {/* Floating Zoom Controls (Top Right) */}
          <div className="map-zoom-controls">
            <button
              type="button"
              className="map-zoom-btn"
              onClick={zoomIn}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <Plus size={16} />
            </button>
            <span className="map-zoom-badge">{zoom}x</span>
            <button
              type="button"
              className="map-zoom-btn"
              onClick={zoomOut}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <Minus size={16} />
            </button>
          </div>

          {/* Locate Me GPS Button (Bottom Right) */}
          <button
            type="button"
            className="map-gps-btn"
            onClick={handleLocateMe}
            title="Use current location"
            aria-label="Use current location"
          >
            <LocateFixed size={18} />
          </button>

          {/* Locating Toast Notification */}
          {locatingToast && (
            <div className="map-locating-pill" role="status">
              <Check size={14} />
              {locatingToast}
            </div>
          )}

          {/* Attribution pill */}
          <div className="map-attribution">© OpenStreetMap · Drag to position</div>
        </div>

        {/* Selected location footer banner */}
        <div className="map-selection-footer">
          <div className="selected-address-box">
            <span className={`route-dot ${mode === "pickup" ? "pickup" : "destination"}`} />
            <div>
              <strong>{activeLocation.title}</strong>
              <p>{activeLocation.address}</p>
              <small>
                Coordinates: {activeLocation.lat.toFixed(4)}°N, {activeLocation.lng.toFixed(4)}°E
              </small>
            </div>
          </div>

          <div className="map-footer-actions">
            <button className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" onClick={handleConfirm}>
              Confirm location
              <Check size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { orders, notifications, user } = useCustomer();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.trim() ? user.name.trim().split(/\s+/)[0] : "Customer";
  const active =
    orders.find((o) => o.status === "In transit") ||
    (orders.length > 0 && orders[0].status !== "Cancelled" ? orders[0] : null);

  return (
    <CustomerShell className="dashboard">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">CUSTOMER HOME</span>
          <h1>
            {greeting}, {firstName}
          </h1>
        </div>
        <button
          className="icon-button light"
          aria-label="Notifications"
          onClick={() => navigate("/customer/notifications")}
        >
          <Bell size={20} />
          {notifications.some((n) => n.unread) && <i />}
        </button>
      </header>

      <main className="page-body">
        {active ? (
          <button
            className="active-delivery"
            onClick={() => navigate("/customer/track", { state: { orderId: active.id } })}
          >
            <span className="active-label">
              ACTIVE DELIVERY <i>Live</i>
            </span>
            <strong>Arriving in {active.eta || "20 min"}</strong>
            <div className="progress">
              <span style={{ width: `${active.progress || 35}%` }} />
            </div>
            <div className="progress-labels">
              <small>{active.from}</small>
              <small>{active.to}</small>
            </div>
            <span className="track-strip">
              Track parcel · {active.id}
              <Navigation size={16} />
            </span>
          </button>
        ) : (
          <div className="empty-active-banner">
            <div className="empty-banner-content">
              <span className="active-label">READY TO SHIP?</span>
              <strong>No active deliveries right now</strong>
              <p>Doorstep parcel delivery: ₹75 for first 3 km, ₹15/km extended.</p>
              <button className="primary-button compact" onClick={() => navigate("/customer/book")}>
                Book a delivery <Plus size={16} />
              </button>
            </div>
          </div>
        )}

        <SectionTitle title="Quick actions" />
        <div className="quick-grid">
          {quickActions.map(({ label, icon: Icon, path }) => (
            <button key={label} onClick={() => navigate(path)}>
              <span>
                <Icon size={19} />
              </span>
              <strong>{label}</strong>
            </button>
          ))}
        </div>

        <SectionTitle title="Your delivery pulse" />
        <div className="stats-grid">
          <article>
            <Box size={17} />
            <strong>{orders.length}</strong>
            <small>Deliveries</small>
          </article>
          <article>
            <IndianRupee size={17} />
            <strong>
              ₹{orders.reduce((sum, o) => sum + (o.status !== "Cancelled" ? o.price : 0), 0)}
            </strong>
            <small>Total spent</small>
          </article>
          <article>
            <Star size={17} />
            <strong>4.9</strong>
            <small>Avg rating</small>
          </article>
        </div>

        <SectionTitle
          title="Recent deliveries"
          action="See all"
          onAction={() => navigate("/customer/orders")}
        />
        <div className="order-list">
          {orders.length > 0 ? (
            orders
              .slice(active ? 1 : 0, 4)
              .map((order) => <OrderCard key={order.id} order={order} compact />)
          ) : (
            <p className="empty-subtext">No delivery history yet.</p>
          )}
        </div>

        <aside className="promo">
          <div>
            <span>TRANSPARENT PRICING</span>
            <strong>₹75 for first 3 km · ₹15/km extended</strong>
            <small>Use code NORO50 to save ₹50 at checkout</small>
          </div>
          <Gift size={42} />
        </aside>
      </main>
    </CustomerShell>
  );
}

// 3-step streamlined booking flow (Transport mode selection removed)
const stepTitles = ["Pickup & drop-off details", "Package details", "Review & pay"];

export function BookingPage({ initialStep = 1 }) {
  const navigate = useNavigate();
  const { booking, setBooking, resetBooking, addOrder, user } = useCustomer();
  const [step, setStep] = useState(initialStep);
  const [error, setError] = useState("");
  const [mapPickerMode, setMapPickerMode] = useState(null); // 'pickup' | 'destination' | null

  // Calculate live fare based on exact distance rule: ₹75 for first 3 km, ₹15/km extended
  const fare = calculateDeliveryFare(booking.distanceKm || 5.2);

  const update = (key, value) => {
    setBooking((current) => ({ ...current, [key]: value }));
    setError("");
  };

  // Called when user selects and confirms a location on the map
  const handleMapLocationSelect = (landmark) => {
    if (mapPickerMode === "pickup") {
      const nextDistance = computeRoadDistance(
        { lat: landmark.lat, lng: landmark.lng },
        booking.destinationCoords
      );
      setBooking((curr) => ({
        ...curr,
        pickup: landmark.address,
        pickupArea: landmark.area,
        pickupCoords: { lat: landmark.lat, lng: landmark.lng },
        distanceKm: nextDistance,
      }));
    } else if (mapPickerMode === "destination") {
      const nextDistance = computeRoadDistance(
        booking.pickupCoords,
        { lat: landmark.lat, lng: landmark.lng }
      );
      setBooking((curr) => ({
        ...curr,
        destination: landmark.address,
        destinationArea: landmark.area,
        destinationCoords: { lat: landmark.lat, lng: landmark.lng },
        distanceKm: nextDistance,
      }));
    }
    setMapPickerMode(null);
    setError("");
  };

  const handleCategorySelect = (item) => {
    if (item === "Others" || item === "Other") {
      update("category", "Others");
    } else {
      // Clear custom requirement description when switching to another predefined category
      setBooking((current) => ({
        ...current,
        category: item,
        otherDescription: "",
      }));
      setError("");
    }
  };

  function next() {
    if (step === 1) {
      if (!booking.pickup?.trim()) {
        setError("Please select a pickup location on the map.");
        return;
      }
      if (!booking.destination?.trim()) {
        setError("Please select a drop-off location on the map.");
        return;
      }
      if (!booking.dropRecipientName?.trim()) {
        setError("Please enter the recipient's name for delivery.");
        return;
      }
      const cleanPhone = (booking.dropRecipientPhone || "").replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        setError("Please enter a valid 10-digit phone number for the recipient.");
        return;
      }
      if (!booking.dropFlat?.trim()) {
        setError("Please enter house, flat, or building details for drop-off.");
        return;
      }
      if (booking.pickupTime === "Schedule" && (!booking.scheduleDate || !booking.scheduleTime)) {
        setError("Please select both a date and time for scheduled pickup.");
        return;
      }
    }

    if (step === 2) {
      // Validate "Others" requirement description
      if ((booking.category === "Others" || booking.category === "Other") && !booking.otherDescription?.trim()) {
        setError("Please specify what you need.");
        return;
      }
    }

    if (step < 3) {
      setStep(step + 1);
      setError("");
    } else {
      // Step 3 -> Finalize booking & create order
      const newOrderId = `NR-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrder = {
        id: newOrderId,
        from: booking.pickup.trim(),
        fromArea: booking.pickupArea || "Indiranagar",
        to: booking.destination.trim(),
        toArea: booking.destinationArea || "Koramangala",
        distance: booking.distanceKm || 5.2,
        pickupContact: {
          name: booking.pickupSenderName?.trim() || user?.name || "Sender",
          phone: booking.pickupSenderPhone?.trim() || user?.phone || "+91 98765 43210",
        },
        dropContact: {
          name: booking.dropRecipientName.trim(),
          phone: booking.dropRecipientPhone.trim(),
          flat: booking.dropFlat.trim(),
        },
        date:
          booking.pickupTime === "Schedule"
            ? `Scheduled: ${booking.scheduleDate}, ${booking.scheduleTime}`
            : "Today, just now",
        price: fare.total,
        baseFare: fare.baseFare,
        extraKm: fare.extraKm,
        distanceFare: fare.distanceFare,
        status: "In transit",
        eta: "18–25 min",
        progress: 20,
        category: booking.category,
        otherDescription: booking.category === "Others" ? booking.otherDescription.trim() : undefined,
        weight: booking.weight,
        dimensions: booking.dimensions,
        fragile: booking.fragile,
        payment: booking.payment,
        notes: booking.notes.trim(),
        pickupTime: booking.pickupTime,
        scheduleDate: booking.scheduleDate,
        scheduleTime: booking.scheduleTime,
      };

      addOrder(newOrder);
      resetBooking();
      navigate("/customer/confirmation", { state: { orderId: newOrderId } });
    }
  }

  return (
    <CustomerShell className="booking-page">
      <PageHeader
        title={stepTitles[step - 1]}
        back={step === 1 ? "/customer" : undefined}
        action={
          step > 1 ? (
            <button
              className="text-button light"
              onClick={() => {
                setStep(step - 1);
                setError("");
              }}
            >
              Step {step}/3
            </button>
          ) : null
        }
      />
      <BookingProgress step={step} total={3} />

      <main className="page-body booking-body">
        <p className="step-copy">
          Step {step} of 3 <span>· Takes less than a minute</span>
        </p>

        {/* STEP 1: PICKUP & DROP-OFF DETAILS WITH MAP SELECTION & CONTACT DETAILS */}
        {step === 1 && (
          <section className="form-card booking-locations-card">
            {/* PRICING POLICY BADGE */}
            <div className="pricing-banner-pill">
              <span className="badge-tag">PRICING</span>
              <p>
                <strong>₹75 for first 3 km</strong>, then <strong>₹15/km</strong> extended distance.
              </p>
            </div>

            {/* 1. PICKUP LOCATION (MAP-BASED) */}
            <div className="location-section-group">
              <div className="group-heading">
                <span className="route-dot pickup" />
                <h4>1. Pickup Location & Sender</h4>
              </div>

              {/* Map Selection Box */}
              <div className="map-pick-card" onClick={() => setMapPickerMode("pickup")}>
                <div className="map-pick-content">
                  <div className="map-pin-icon pickup">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className="map-badge">Selected from Map</span>
                    <strong>{booking.pickupArea || "Pickup location"}</strong>
                    <p>{booking.pickup || "Choose location on map"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="secondary-button compact-map-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMapPickerMode("pickup");
                  }}
                >
                  <Navigation size={15} />
                  Change on Map
                </button>
              </div>

              {/* Sender Details */}
              <div className="contact-subgrid">
                <label>
                  Sender name
                  <div className="field">
                    <User size={18} />
                    <input
                      value={booking.pickupSenderName}
                      onChange={(e) => update("pickupSenderName", e.target.value)}
                      placeholder="Test Name"
                    />
                  </div>
                </label>
                <label>
                  Sender phone number
                  <div className="field">
                    <Phone size={18} />
                    <input
                      type="tel"
                      value={booking.pickupSenderPhone}
                      onChange={(e) => update("pickupSenderPhone", e.target.value)}
                      placeholder="9876543210"
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* 2. DROP-OFF LOCATION (MAP-BASED) & RECIPIENT CONTACT DETAILS */}
            <div className="location-section-group">
              <div className="group-heading">
                <span className="route-dot destination" />
                <h4>2. Delivery Drop-off Details</h4>
              </div>

              {/* Map Selection Box */}
              <div className="map-pick-card" onClick={() => setMapPickerMode("destination")}>
                <div className="map-pick-content">
                  <div className="map-pin-icon destination">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className="map-badge">Selected from Map</span>
                    <strong>{booking.destinationArea || "Drop-off destination"}</strong>
                    <p>{booking.destination || "Choose destination on map"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="secondary-button compact-map-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMapPickerMode("destination");
                  }}
                >
                  <Navigation size={15} />
                  Change on Map
                </button>
              </div>

              {/* Drop-off Contact Details */}
              <div className="contact-subgrid">
                <label>
                  Recipient name <span className="req-star">*</span>
                  <div className="field">
                    <User size={18} />
                    <input
                      required
                      value={booking.dropRecipientName}
                      onChange={(e) => update("dropRecipientName", e.target.value)}
                      placeholder="Test Name"
                    />
                  </div>
                </label>
                <label>
                  Recipient phone number <span className="req-star">*</span>
                  <div className="field">
                    <Phone size={18} />
                    <input
                      required
                      type="tel"
                      value={booking.dropRecipientPhone}
                      onChange={(e) => update("dropRecipientPhone", e.target.value)}
                      placeholder="9876543210"
                    />
                  </div>
                </label>
              </div>

              {/* House/Flat and Landmark details */}
              <div className="contact-subgrid">
                <label>
                  House / Flat / Floor / Building <span className="req-star">*</span>
                  <div className="field">
                    <Building2 size={18} />
                    <input
                      required
                      value={booking.dropFlat}
                      onChange={(e) => update("dropFlat", e.target.value)}
                      placeholder="e.g. Flat 302, 3rd Floor, Lotus Apts"
                    />
                  </div>
                </label>
                <label>
                  Nearby landmark (optional)
                  <div className="field">
                    <Home size={18} />
                    <input
                      value={booking.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      placeholder="e.g. Near Metro pillar 124"
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* LIVE DISTANCE & FARE ESTIMATE PREVIEW */}
            <div className="route-estimate-card">
              <div className="estimate-summary-row">
                <div className="distance-badge-pill">
                  <Navigation size={16} />
                  <span>
                    Distance: <strong>{booking.distanceKm} km</strong>
                  </span>
                </div>
                <div className="live-fare-badge">
                  <small>Delivery Fare:</small>
                  <strong>₹{fare.subtotal}</strong>
                </div>
              </div>
              <p className="fare-calc-note">
                Base ₹75 (up to 3 km)
                {fare.extraKm > 0 && ` + ₹${fare.distanceFare} (${fare.extraKm} km @ ₹15/km)`}
                {" · ₹50 discount applied at checkout"}
              </p>
            </div>

            {/* PICKUP TIME */}
            <label>
              Pickup time
              <div className="choice-row">
                {["Now", "Schedule"].map((item) => (
                  <button
                    type="button"
                    className={booking.pickupTime === item ? "selected" : ""}
                    key={item}
                    onClick={() => update("pickupTime", item)}
                  >
                    {item === "Now" ? <Clock3 size={18} /> : <CalendarClock size={18} />}
                    {item}
                  </button>
                ))}
              </div>
            </label>

            {booking.pickupTime === "Schedule" && (
              <div className="schedule-inputs-card">
                <label>
                  Pickup Date
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={booking.scheduleDate || ""}
                    onChange={(e) => update("scheduleDate", e.target.value)}
                  />
                </label>
                <label>
                  Pickup Time Slot
                  <input
                    type="time"
                    value={booking.scheduleTime || ""}
                    onChange={(e) => update("scheduleTime", e.target.value)}
                  />
                </label>
              </div>
            )}
          </section>
        )}

        {/* STEP 2: PACKAGE DETAILS & "OTHERS" SPECIFICATION */}
        {step === 2 && (
          <section className="form-card">
            <label>
              What are you sending?
              <div className="category-grid">
                {["Documents", "Food", "Electronics", "Others"].map((item) => {
                  const isSelected =
                    booking.category === item ||
                    (item === "Others" && booking.category === "Other");
                  return (
                    <button
                      type="button"
                      key={item}
                      className={isSelected ? "selected" : ""}
                      onClick={() => handleCategorySelect(item)}
                    >
                      <Box size={18} />
                      {item}
                    </button>
                  );
                })}
              </div>
            </label>

            {/* "Others" Specification Field */}
            {(booking.category === "Others" || booking.category === "Other") && (
              <label className="other-field-group">
                <span>
                  Please specify your requirement <span className="req-star">*</span>
                </span>
                <textarea
                  required
                  value={booking.otherDescription || ""}
                  onChange={(e) => update("otherDescription", e.target.value)}
                  placeholder="Please specify what you need delivered..."
                  rows={3}
                  className={error === "Please specify what you need." ? "invalid" : ""}
                  aria-required="true"
                />
                <small className="field-hint">
                  Specify details such as contents, handling, or specific requirements.
                </small>
              </label>
            )}

            <label>
              Approximate weight
              <select value={booking.weight} onChange={(e) => update("weight", e.target.value)}>
                <option>Under 0.5 kg</option>
                <option>0.5–2 kg</option>
                <option>2–5 kg</option>
                <option>5–10 kg</option>
              </select>
            </label>

            {/* Polished Fragile Handling Card */}
            <div
              className={`fragile-toggle-card ${booking.fragile ? "active" : ""}`}
              onClick={() => update("fragile", !booking.fragile)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  update("fragile", !booking.fragile);
                }
              }}
            >
              <div className="fragile-info">
                <div className="fragile-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <strong>Fragile item</strong>
                  <small>Handle with care</small>
                </div>
              </div>
              <label className="switch-toggle" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={booking.fragile}
                  onChange={(e) => update("fragile", e.target.checked)}
                  aria-label="Mark item as fragile"
                />
                <span className="slider" />
              </label>
            </div>

            <label>
              Special delivery instructions
              <textarea
                value={booking.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Gate code, landmark, recipient instructions…"
              />
            </label>
          </section>
        )}

        {/* STEP 3: REVIEW & PAY (DISTANCE PRICING BREAKDOWN) */}
        {step === 3 && (
          <section className="review-stack">
            <article className="summary-card">
              <AddressRoute pickup={booking.pickup} destination={booking.destination} />

              <div className="route-details-strip">
                <div className="metric-item">
                  <small>Distance</small>
                  <strong>{booking.distanceKm} km</strong>
                </div>
                <div className="metric-item">
                  <small>Pickup</small>
                  <span>{booking.pickupSenderName || user?.name || "Sender"}</span>
                </div>
                <div className="metric-item">
                  <small>Deliver to</small>
                  <span>{booking.dropRecipientName} ({booking.dropRecipientPhone})</span>
                </div>
              </div>

              {booking.dropFlat && (
                <div className="address-floor-note">
                  <Building2 size={15} />
                  <span>{booking.dropFlat}</span>
                </div>
              )}

              <div className="summary-tags">
                <span className={booking.category === "Others" ? "tag-others" : ""}>
                  {booking.category === "Others" && booking.otherDescription
                    ? `Others: ${booking.otherDescription}`
                    : booking.category}
                </span>
                <span>{booking.weight}</span>
                {booking.fragile && (
                  <span className="tag-fragile">
                    <ShieldCheck size={12} /> Fragile · Handle with care
                  </span>
                )}
                {booking.pickupTime === "Schedule" && (
                  <span>
                    Scheduled: {booking.scheduleDate} {booking.scheduleTime}
                  </span>
                )}
              </div>

              {booking.notes && (
                <div className="summary-notes-row">
                  <small>
                    <b>Instructions:</b> {booking.notes}
                  </small>
                </div>
              )}
            </article>

            <SectionTitle title="Payment method" />
            <div className="payment-options">
              {[
                ["UPI", Smartphone],
                ["Card", CreditCard],
                ["Wallet", Wallet],
                ["Cash", IndianRupee],
              ].map(([name, Icon]) => (
                <button
                  type="button"
                  key={name}
                  className={booking.payment === name ? "selected" : ""}
                  onClick={() => update("payment", name)}
                >
                  <Icon size={19} />
                  {name}
                  {booking.payment === name && <Check size={17} />}
                </button>
              ))}
            </div>

            {/* DYNAMIC FARE BREAKDOWN (First 3 km: ₹75, extended: ₹15/km) */}
            <article className="fare-card">
              <div className="fare-line">
                <span>Base delivery fare (First 3 km)</span>
                <b>₹75</b>
              </div>
              {fare.extraKm > 0 && (
                <div className="fare-line">
                  <span>Additional distance ({fare.extraKm} km × ₹15/km)</span>
                  <b>₹{fare.distanceFare}</b>
                </div>
              )}
              <div className="fare-line">
                <span>Platform fee</span>
                <b>₹12</b>
              </div>
              <div className="fare-line">
                <span>NORO50 discount</span>
                <b className="discount">−₹50</b>
              </div>
              <div className="total">
                <div>
                  <strong>Total to pay</strong>
                  <small className="pricing-rule-subtext">Total distance: {booking.distanceKm} km</small>
                </div>
                <strong>₹{fare.total}</strong>
              </div>
            </article>
          </section>
        )}

        {error && (
          <p className="form-error booking-error" role="alert">
            <AlertCircle size={15} />
            {error}
          </p>
        )}

        <div className="sticky-action">
          <button className="primary-button" onClick={next}>
            {step === 3 ? `Pay ₹${fare.total} & book` : "Continue"}
            <ArrowRight size={18} />
          </button>
          {step > 1 && (
            <button
              className="text-button"
              onClick={() => {
                setStep(step - 1);
                setError("");
              }}
            >
              Back
            </button>
          )}
        </div>
      </main>

      {/* MAP LOCATION PICKER MODAL */}
      {mapPickerMode && (
        <MapLocationPickerModal
          mode={mapPickerMode}
          currentCoords={
            mapPickerMode === "pickup" ? booking.pickupCoords : booking.destinationCoords
          }
          onSelect={handleMapLocationSelect}
          onClose={() => setMapPickerMode(null)}
        />
      )}
    </CustomerShell>
  );
}

export function ConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId || "NR-48220";

  return (
    <CustomerShell nav={false} className="center-page">
      <main className="success-card">
        <div className="success-burst">
          <Check size={38} />
        </div>
        <span className="eyebrow">BOOKING CONFIRMED</span>
        <h1>Your parcel is in good hands.</h1>
        <p>We’re finding the nearest delivery partner. You’ll receive live updates as they head your way.</p>
        <div className="confirmation-code">
          <small>ORDER ID</small>
          <strong>{orderId}</strong>
        </div>
        <button
          className="primary-button"
          onClick={() => navigate("/customer/track", { state: { orderId } })}
        >
          Track delivery
          <Navigation size={18} />
        </button>
        <button className="secondary-button" onClick={() => navigate("/customer")}>
          Back to home
        </button>
      </main>
    </CustomerShell>
  );
}

export function TrackingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders } = useCustomer();
  const [toastMessage, setToastMessage] = useState("");

  const trackId = location.state?.orderId;
  const currentOrder =
    (trackId && orders.find((o) => o.id === trackId)) ||
    orders.find((o) => o.status === "In transit") ||
    orders[0] || {
      id: "NR-48219",
      from: "Whitefield",
      to: "HSR Layout",
      distance: 14.2,
      price: 205,
      status: "In transit",
      eta: "18 min",
      progress: 68,
    };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <CustomerShell>
      <PageHeader title="Track your delivery" />
      <main className="page-body">
        {toastMessage && (
          <div className="form-message" role="status">
            <Check size={16} /> {toastMessage}
          </div>
        )}

        <div className="map-card">
          <div className="map-grid" />
          <span className="map-pin pickup-pin">
            <Home size={17} />
          </span>
          <span className="map-pin rider-pin">
            <Navigation size={19} />
          </span>
          <span className="map-pin drop-pin">
            <MapPin size={18} />
          </span>
          <svg viewBox="0 0 400 240" preserveAspectRatio="none">
            <path d="M55 190 C 125 70, 260 210, 350 55" />
          </svg>
          <button
            aria-label="Center map"
            onClick={() => showToast("Map centered on delivery partner's position")}
          >
            <LocateFixed size={18} />
          </button>
        </div>

        <article className="eta-card">
          <span className="live-pill">{currentOrder.status.toUpperCase()}</span>
          <div>
            <small>Estimated arrival</small>
            <strong>{currentOrder.eta || "18 minutes"}</strong>
          </div>
          <p>
            Rider is heading to <b>{currentOrder.to}</b>
          </p>
          <div className="eta-progress">
            <span style={{ width: `${currentOrder.progress || 60}%` }} />
          </div>
        </article>

        <article className="partner-card">
          <div className="avatar">RK</div>
          <div>
            <strong>
              Ravi Kumar <BadgeCheck size={15} />
            </strong>
            <small>4.9 ★ · 1,248 deliveries · KA 05 MJ 2841</small>
          </div>
          <button
            aria-label="Call partner"
            onClick={() => showToast("Calling delivery partner Ravi Kumar (+91 98765 12345)...")}
          >
            <Phone size={18} />
          </button>
          <button
            aria-label="Message partner"
            onClick={() => showToast("Opening message conversation with Ravi...")}
          >
            <MessageCircle size={18} />
          </button>
        </article>

        <SectionTitle title="Delivery journey" />
        <div className="timeline">
          {[
            ["Order confirmed", "4:12 PM", true],
            ["Partner assigned", "4:18 PM", true],
            ["Parcel picked up", "4:32 PM", (currentOrder.progress || 60) >= 40],
            ["In transit", "Now", (currentOrder.progress || 60) >= 60],
            ["Delivered", "Expected shortly", currentOrder.status === "Delivered"],
          ].map(([label, time, done], i) => (
            <div className={done ? "done" : ""} key={label}>
              <span>{done ? <Check size={14} /> : i + 1}</span>
              <p>
                <strong>{label}</strong>
                <small>{time}</small>
              </p>
            </div>
          ))}
        </div>

        <button
          className="secondary-button full"
          onClick={() => navigate("/customer/support", { state: { orderId: currentOrder.id } })}
        >
          Need help with this order?
        </button>
      </main>
    </CustomerShell>
  );
}

export function OrdersPage() {
  const navigate = useNavigate();
  const { orders } = useCustomer();
  const [filter, setFilter] = useState("All");

  const shown = useMemo(
    () => orders.filter((o) => filter === "All" || o.status === filter),
    [orders, filter]
  );

  return (
    <CustomerShell>
      <PageHeader title="Your orders" />
      <main className="page-body">
        <div className="filter-row">
          {["All", "In transit", "Delivered", "Cancelled"].map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <p className="results-label">
          {shown.length} {shown.length === 1 ? "delivery" : "deliveries"}
        </p>

        {shown.length > 0 ? (
          <div className="order-list large">
            {shown.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="empty-orders-view">
            <Box size={40} />
            <strong>No {filter !== "All" ? filter.toLowerCase() : ""} deliveries</strong>
            <p>You haven’t had any orders with this status yet.</p>
            <button className="primary-button compact" onClick={() => navigate("/customer/book")}>
              Book a delivery
            </button>
          </div>
        )}
      </main>
    </CustomerShell>
  );
}

export function OrderDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { orders, cancelOrder } = useCustomer();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const order = orders.find((o) => o.id === id) || orders[0];

  if (!order) {
    return (
      <CustomerShell>
        <PageHeader title="Order details" back="/customer/orders" />
        <main className="page-body">
          <div className="empty-orders-view">
            <Box size={40} />
            <strong>Order not found</strong>
            <p>The requested order could not be located.</p>
            <button className="primary-button" onClick={() => navigate("/customer/orders")}>
              Back to orders
            </button>
          </div>
        </main>
      </CustomerShell>
    );
  }

  const handleCancelConfirm = () => {
    cancelOrder(order.id);
    setShowCancelModal(false);
    setToastMessage("Order has been cancelled successfully.");
  };

  const distance = order.distance || 5.2;

  return (
    <CustomerShell>
      <PageHeader title="Order details" back="/customer/orders" />
      <main className="page-body details-page">
        {toastMessage && (
          <div className="form-message" role="status">
            <Check size={16} /> {toastMessage}
          </div>
        )}

        <article className="status-hero">
          <span className={order.status.toLowerCase().replace(" ", "-")}>{order.status}</span>
          <strong>{order.id}</strong>
          <p>{order.date}</p>
          {order.status === "In transit" && (
            <button onClick={() => navigate("/customer/track", { state: { orderId: order.id } })}>
              Track live
              <Navigation size={17} />
            </button>
          )}
        </article>

        <article className="summary-card">
          <AddressRoute pickup={order.from} destination={order.to} />
          {order.dropContact && (
            <div className="delivery-contact-snippet">
              <small>Deliver to: <b>{order.dropContact.name}</b> ({order.dropContact.phone})</small>
              {order.dropContact.flat && <small>Address note: {order.dropContact.flat}</small>}
            </div>
          )}
        </article>

        <article className="info-card">
          <SectionTitle title="Delivery & package details" />
          <div className="info-row">
            <span>
              <Navigation size={18} /> Route distance
            </span>
            <b>{distance} km</b>
          </div>
          <div className="info-row">
            <span>
              <Box size={18} />
              {order.category || "Documents"}
              {order.otherDescription ? ` (${order.otherDescription})` : ""} · {order.weight || "0.5–2 kg"}
            </span>
            <b className="pricing-tag-pill">₹75 base + ₹15/km</b>
          </div>
          {order.fragile && (
            <div className="info-row">
              <span>
                <ShieldCheck size={18} /> Special handling
              </span>
              <b className="handling-badge">
                <ShieldCheck size={13} /> Fragile · Handle with care
              </b>
            </div>
          )}
          {order.notes && (
            <div className="info-row">
              <span>
                <FileText size={18} /> Instructions
              </span>
              <small className="notes-display">{order.notes}</small>
            </div>
          )}
          <div className="info-row">
            <span>
              <IndianRupee size={18} /> Total paid
            </span>
            <b>₹{order.price}</b>
          </div>
        </article>

        {/* Cancellation action if active */}
        {order.status === "In transit" && (
          <button
            type="button"
            className="secondary-button cancel-order-trigger"
            onClick={() => setShowCancelModal(true)}
          >
            Cancel this delivery
          </button>
        )}

        <div className="action-grid">
          <button onClick={() => navigate(`/customer/invoice/${order.id}`)}>
            <FileText size={19} />
            Invoice
          </button>
          {order.status === "Delivered" && (
            <button onClick={() => navigate(`/customer/review/${order.id}`)}>
              <Star size={19} />
              Rate delivery
            </button>
          )}
          <button onClick={() => navigate("/customer/support", { state: { orderId: order.id } })}>
            <CircleHelp size={19} />
            Support
          </button>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <button
                className="modal-close"
                aria-label="Close"
                onClick={() => setShowCancelModal(false)}
              >
                <X size={18} />
              </button>
              <div className="modal-icon-burst alert">
                <AlertCircle size={32} />
              </div>
              <h3>Cancel delivery?</h3>
              <p>
                Are you sure you want to cancel order <b>{order.id}</b>? Our delivery partner will be notified immediately.
              </p>
              <div className="modal-actions">
                <button className="primary-button danger" onClick={handleCancelConfirm}>
                  Yes, cancel order
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setShowCancelModal(false)}
                >
                  Keep delivery
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </CustomerShell>
  );
}

export function NotificationsPage() {
  const { notifications, markAllRead } = useCustomer();

  return (
    <CustomerShell>
      <PageHeader
        title="Notifications"
        action={
          <button className="text-button" onClick={markAllRead}>
            Mark all read
          </button>
        }
      />
      <main className="page-body">
        {notifications.length > 0 ? (
          <div className="notification-list">
            {notifications.map((item) => {
              const Icon = notificationIcons[item.type] || Bell;
              return (
                <article key={item.id} className={item.unread ? "unread" : ""}>
                  <span className={`notification-icon ${item.type}`}>
                    <Icon size={19} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                    <small>{item.time}</small>
                  </div>
                  {item.unread && <i />}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-orders-view">
            <Bell size={40} />
            <strong>No notifications</strong>
            <p>You’re all caught up!</p>
          </div>
        )}
      </main>
    </CustomerShell>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useCustomer();
  const [dark, setDark] = useState(() => localStorage.getItem("noro.theme") === "dark");
  const [alerts, setAlerts] = useState(true);

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : "CU";

  const joined = user?.joined
    ? new Date(user.joined).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  const handleDarkToggle = (checked) => {
    setDark(checked);
    localStorage.setItem("noro.theme", checked ? "dark" : "light");
  };

  return (
    <CustomerShell className={dark ? "dark-theme" : ""}>
      <PageHeader title="Profile & preferences" />
      <main className="page-body">
        <article className="profile-card">
          <div className="avatar large">{initials}</div>
          <div>
            <strong>{user?.name || "Customer"}</strong>
            <small>{user?.email || "customer@example.com"}</small>
            <small>Member since {joined}</small>
          </div>
          <ChevronRight size={18} />
        </article>

        <SectionTitle title="Your account" />
        <div className="menu-card">
          <button onClick={() => navigate("/customer/addresses")}>
            <MapPin size={19} />
            <span>Saved addresses</span>
            <ChevronRight size={17} />
          </button>
          <button onClick={() => navigate("/customer/notifications")}>
            <Bell size={19} />
            <span>Notifications</span>
            <ChevronRight size={17} />
          </button>
          <button onClick={() => navigate("/customer/support")}>
            <CircleHelp size={19} />
            <span>Help & support</span>
            <ChevronRight size={17} />
          </button>
        </div>

        <SectionTitle title="Preferences" />
        <div className="menu-card">
          <label>
            <span>Dark mode</span>
            <input
              type="checkbox"
              checked={dark}
              onChange={(e) => handleDarkToggle(e.target.checked)}
            />
          </label>
          <label>
            <span>Delivery alerts</span>
            <input
              type="checkbox"
              checked={alerts}
              onChange={(e) => setAlerts(e.target.checked)}
            />
          </label>
        </div>

        <button
          className="logout-button"
          onClick={() => {
            signOut();
            navigate("/customer/login", { replace: true });
          }}
        >
          Sign out
        </button>

        <p className="version">Noro Customer · v1.0</p>
      </main>
    </CustomerShell>
  );
}

export function AddressesPage() {
  const navigate = useNavigate();
  const { setBooking } = useCustomer();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ label: "", address: "" });
  const [formError, setFormError] = useState("");
  const [addresses, setAddresses] = useState([
    { label: "Home", address: "Indiranagar 100ft Road, HAL 2nd Stage, Bengaluru 560038" },
    { label: "Work", address: "22, 100ft Inner Ring Road, Koramangala 5th Block, Bengaluru 560095" },
  ]);

  function saveAddress(event) {
    event.preventDefault();
    if (!draft.label.trim() || !draft.address.trim()) {
      setFormError("Please fill out both label and address.");
      return;
    }
    setAddresses((items) => [
      ...items,
      { label: draft.label.trim(), address: draft.address.trim() },
    ]);
    setDraft({ label: "", address: "" });
    setFormError("");
    setShowForm(false);
  }

  function deleteAddress(index) {
    setAddresses((items) => items.filter((_, i) => i !== index));
  }

  function selectAddress(address) {
    setBooking((current) => ({ ...current, pickup: address }));
    navigate("/customer/book");
  }

  return (
    <CustomerShell>
      <PageHeader
        title="Saved addresses"
        action={
          <button
            aria-label={showForm ? "Close address form" : "Add address"}
            className="icon-button yellow"
            onClick={() => {
              setShowForm(!showForm);
              setFormError("");
            }}
          >
            <Plus size={19} />
          </button>
        }
      />
      <main className="page-body">
        {showForm && (
          <form className="form-card address-form" onSubmit={saveAddress}>
            <label>
              Label
              <input
                required
                value={draft.label}
                onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
                placeholder="e.g. Parents’ home, Studio"
              />
            </label>
            <label>
              Full address
              <textarea
                required
                value={draft.address}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, address: event.target.value }))
                }
                placeholder="House/flat, street, landmark, city"
              />
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <button className="primary-button" type="submit">
              Save address
            </button>
          </form>
        )}

        <div className="address-list">
          {addresses.map((item, index) => (
            <article key={`${item.label}-${index}`}>
              <span>
                {item.label.toLowerCase() === "home" ? (
                  <Home size={20} />
                ) : (
                  <Building2 size={20} />
                )}
              </span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.address}</p>
              </div>
              <div className="address-actions">
                <button type="button" onClick={() => selectAddress(item.address)}>
                  Use
                </button>
                {addresses.length > 1 && (
                  <button
                    type="button"
                    className="delete-address-btn"
                    aria-label={`Delete ${item.label}`}
                    onClick={() => deleteAddress(index)}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>
    </CustomerShell>
  );
}

export function SupportPage() {
  const location = useLocation();
  const { orders } = useCustomer();
  const initialOrderId = location.state?.orderId;
  const [selectedOrder, setSelectedOrder] = useState(
    initialOrderId || (orders[0]?.id ? `${orders[0].id} · ${orders[0].status}` : "NR-48219 · In transit")
  );
  const [issueType, setIssueType] = useState("Delivery is delayed");
  const [otherIssue, setOtherIssue] = useState("");
  const [description, setDescription] = useState("");
  const [supportError, setSupportError] = useState("");
  const [sent, setSent] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleIssueTypeChange = (e) => {
    const val = e.target.value;
    setIssueType(val);
    if (val !== "Something else") {
      setOtherIssue("");
      setSupportError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (issueType === "Something else" && !otherIssue.trim()) {
      setSupportError("Please specify what you need.");
      return;
    }
    if (!description.trim()) {
      setSupportError("Please tell us more about what happened.");
      return;
    }
    setSupportError("");
    setSent(true);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <CustomerShell>
      <PageHeader title="Help & support" />
      <main className="page-body">
        {toastMessage && (
          <div className="form-message" role="status">
            <Check size={16} /> {toastMessage}
          </div>
        )}

        {sent ? (
          <div className="inline-success">
            <CheckCircle2 size={34} />
            <h2>Ticket raised</h2>
            <p>We’ve received your query and will get back to you within 2 hours.</p>
            <button
              className="secondary-button"
              onClick={() => {
                setSent(false);
                setDescription("");
                setOtherIssue("");
              }}
            >
              Raise another
            </button>
          </div>
        ) : (
          <form className="form-card support-form" onSubmit={handleSubmit}>
            <label>
              Related order
              <select
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
              >
                {orders.map((o) => (
                  <option key={o.id} value={`${o.id} · ${o.status}`}>
                    {o.id} · {o.status} ({o.from} → {o.to})
                  </option>
                ))}
              </select>
            </label>

            <label>
              What can we help with?
              <select value={issueType} onChange={handleIssueTypeChange}>
                <option>Delivery is delayed</option>
                <option>Payment issue</option>
                <option>Package concern</option>
                <option>Something else</option>
              </select>
            </label>

            {issueType === "Something else" && (
              <label className="other-field-group">
                <span>
                  Please specify your requirement <span className="req-star">*</span>
                </span>
                <input
                  type="text"
                  value={otherIssue}
                  onChange={(e) => {
                    setOtherIssue(e.target.value);
                    if (e.target.value.trim()) setSupportError("");
                  }}
                  placeholder="Please specify what you need..."
                  className={supportError === "Please specify what you need." ? "invalid" : ""}
                  required
                />
              </label>
            )}

            <label>
              Tell us more
              <textarea
                required
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (e.target.value.trim()) setSupportError("");
                }}
                placeholder="Describe what happened with as much detail as possible…"
              />
            </label>

            {supportError && (
              <p className="form-error" role="alert">
                <AlertCircle size={14} /> {supportError}
              </p>
            )}

            <button className="primary-button" type="submit">
              Submit ticket
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        <SectionTitle title="Quick help" />
        <div className="contact-grid">
          <button
            type="button"
            onClick={() => {
              window.location.href = "tel:+918000000000";
            }}
          >
            <Phone size={20} />
            <strong>Call us</strong>
            <small>8 AM–10 PM</small>
          </button>
          <button
            type="button"
            onClick={() => showToast("Live chat agent will connect with you shortly.")}
          >
            <MessageCircle size={20} />
            <strong>Live chat</strong>
            <small>Usually instant</small>
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "mailto:help@noro.in";
            }}
          >
            <Mail size={20} />
            <strong>Email</strong>
            <small>help@noro.in</small>
          </button>
        </div>
      </main>
    </CustomerShell>
  );
}

export function ReviewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!rating) return;
    setSubmitted(true);
    setTimeout(() => {
      navigate(`/customer/order/${id}`, { replace: true });
    }, 1200);
  };

  return (
    <CustomerShell nav={false}>
      <PageHeader title="Rate your delivery" back={`/customer/order/${id}`} />
      <main className="page-body review-page">
        <div className="avatar large">RK</div>
        <h2>How was your delivery?</h2>
        <p>Your feedback helps Ravi and the Noro delivery community.</p>

        {submitted ? (
          <div className="form-message" role="status">
            <Check size={16} /> Thank you! Your review has been submitted.
          </div>
        ) : (
          <>
            <div className="stars" aria-label="Rating out of 5 stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-label={`${n} star`}
                  onClick={() => setRating(n)}
                  className={n <= rating ? "active" : ""}
                >
                  <Star size={30} fill="currentColor" />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share a few words about your delivery experience (optional)"
            />

            <button
              className="primary-button"
              disabled={!rating}
              onClick={handleSubmit}
            >
              Submit review
            </button>
          </>
        )}
      </main>
    </CustomerShell>
  );
}

export function InvoicePage() {
  const { id } = useParams();
  const { orders } = useCustomer();
  const order = orders.find((o) => o.id === id) || {
    id: id || "NR-48102",
    from: "Indiranagar",
    to: "Koramangala",
    distance: 5.6,
    price: 76,
  };

  const distance = order.distance || 5.2;
  const fare = calculateDeliveryFare(distance);

  return (
    <CustomerShell nav={false}>
      <PageHeader title="Invoice" back={`/customer/order/${id}`} />
      <main className="page-body">
        <article className="invoice">
          <div className="invoice-brand">
            <NoroMark compact />
            <div>
              <strong>NORO</strong>
              <small>Parcel delivery</small>
            </div>
          </div>
          <span className="paid-stamp">PAID</span>

          <h2>Tax invoice</h2>
          <p>Invoice #INV-{order.id.replace("NR-", "")}</p>

          <div className="invoice-route">
            <AddressRoute pickup={order.from} destination={order.to} />
            <small className="invoice-dist-note">Route distance: {distance} km</small>
          </div>

          <div className="fare-card">
            <div>
              <span>Base delivery fare (First 3 km)</span>
              <b>₹75</b>
            </div>
            {fare.extraKm > 0 && (
              <div>
                <span>Distance charge ({fare.extraKm} km @ ₹15/km)</span>
                <b>₹{fare.distanceFare}</b>
              </div>
            )}
            <div>
              <span>Platform fee</span>
              <b>₹12</b>
            </div>
            <div>
              <span>NORO50 discount</span>
              <b className="discount">−₹50</b>
            </div>
            <div className="total">
              <strong>Total paid</strong>
              <strong>₹{order.price || fare.total}</strong>
            </div>
          </div>

          <small className="invoice-note">
            <LockKeyhole size={14} /> Payment reference NORO-PAY-{order.id.replace("NR-", "")}
          </small>

          <button className="primary-button" onClick={() => window.print()}>
            Print / save invoice
            <FileText size={17} />
          </button>
        </article>
      </main>
    </CustomerShell>
  );
}
