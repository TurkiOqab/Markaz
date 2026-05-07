import L from "../lib/leaflet";
import { Crosshair, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { TextField } from "./TextField";

// Center of KSA — Riyadh-ish — used as default map center.
const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753];
const DEFAULT_ZOOM = 6;

// Fix Leaflet's default marker icon paths (Vite breaks them otherwise).
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Props {
  open: boolean;
  onClose: () => void;
  initialLat: number | null;
  initialLng: number | null;
  onConfirm: (lat: number, lng: number) => void;
}

export function LocationPicker({ open, onClose, initialLat, initialLng, onConfirm }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

  // Sync inputs when modal opens with initial values
  useEffect(() => {
    if (open) {
      setLat(initialLat != null ? String(initialLat) : "");
      setLng(initialLng != null ? String(initialLng) : "");
    }
  }, [open, initialLat, initialLng]);

  // Initialize map when modal opens
  useEffect(() => {
    if (!open) return;
    // Wait for DOM
    const timer = window.setTimeout(() => {
      if (!mapContainerRef.current || mapRef.current) return;
      const startLat = initialLat ?? DEFAULT_CENTER[0];
      const startLng = initialLng ?? DEFAULT_CENTER[1];
      const startZoom = initialLat != null ? 14 : DEFAULT_ZOOM;
      const map = L.map(mapContainerRef.current).setView([startLat, startLng], startZoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      function placeMarker(lt: number, ln: number) {
        if (markerRef.current) {
          markerRef.current.setLatLng([lt, ln]);
        } else {
          markerRef.current = L.marker([lt, ln], { icon: markerIcon, draggable: true }).addTo(map);
          markerRef.current.on("dragend", () => {
            const p = markerRef.current!.getLatLng();
            setLat(p.lat.toFixed(6));
            setLng(p.lng.toFixed(6));
          });
        }
        setLat(lt.toFixed(6));
        setLng(ln.toFixed(6));
      }

      if (initialLat != null && initialLng != null) {
        placeMarker(initialLat, initialLng);
      }

      map.on("click", (e: L.LeafletMouseEvent) => {
        placeMarker(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      // Force leaflet to recompute size after modal animation
      window.setTimeout(() => map.invalidateSize(), 200);
    }, 50);

    return () => {
      window.clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open, initialLat, initialLng]);

  function useGeolocation() {
    if (!navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    toast.info("جارِ تحديد الموقع...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude.toFixed(6));
        setLng(longitude.toFixed(6));
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            markerRef.current = L.marker([latitude, longitude], {
              icon: markerIcon,
              draggable: true,
            }).addTo(mapRef.current);
          }
        }
        toast.success("تم تحديد الموقع الحالي");
      },
      (err) => {
        toast.error(`تعذر الحصول على الموقع: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function applyManualCoords() {
    const ln = Number(lng);
    const lt = Number(lat);
    if (!Number.isFinite(lt) || !Number.isFinite(ln)) return;
    if (lt < -90 || lt > 90 || ln < -180 || ln > 180) return;
    if (mapRef.current) {
      mapRef.current.setView([lt, ln], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([lt, ln]);
      } else {
        markerRef.current = L.marker([lt, ln], {
          icon: markerIcon,
          draggable: true,
        }).addTo(mapRef.current);
      }
    }
  }

  function handleConfirm() {
    const lt = Number(lat);
    const ln = Number(lng);
    if (!Number.isFinite(lt) || !Number.isFinite(ln)) {
      toast.error("اختر موقعاً على الخريطة أو أدخل إحداثيات صالحة");
      return;
    }
    onConfirm(Number(lt.toFixed(6)), Number(ln.toFixed(6)));
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تحديد موقع الحادث"
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleConfirm}>
            <MapPin size={16} />
            تأكيد الموقع
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={useGeolocation}>
            <Crosshair size={16} />
            استخدام موقعي الحالي
          </Button>
          <span className="text-xs text-surface-500">
            أو اضغط على الخريطة لتحديد الموقع، أو اسحب العلامة لضبطها بدقة
          </span>
        </div>

        <div
          ref={mapContainerRef}
          className="h-[400px] w-full overflow-hidden rounded-xl border border-surface-300"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="خط العرض (Latitude)"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            onBlur={applyManualCoords}
            placeholder="24.7136"
          />
          <TextField
            label="خط الطول (Longitude)"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            onBlur={applyManualCoords}
            placeholder="46.6753"
          />
        </div>
      </div>
    </Modal>
  );
}
