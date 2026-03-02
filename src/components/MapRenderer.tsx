"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Navigation, Loader2, MapPinOff } from "lucide-react";

// Fix for default Leaflet icon paths in Next.js
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

// Bileşen haritayı yeni koordinata uçurmak için
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

interface MapRendererProps {
    address: string;
    onClose?: () => void;
}

export default function MapRenderer({ address, onClose }: MapRendererProps) {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const geocodeAddress = async () => {
            try {
                setLoading(true);
                setError(false);

                // Nominatim OSM API'den adresi koordinata çevir (Türkiye sınırlarında arar)
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&countrycodes=tr&format=json&limit=1`;
                const response = await fetch(url, {
                    headers: {
                        'Accept-Language': 'tr'
                    }
                });

                const data = await response.json();

                if (data && data.length > 0) {
                    setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Geocoding failed", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (address) {
            geocodeAddress();
        }
    }, [address]);

    const getGoogleMapsUrl = () => {
        if (position) {
            return `https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`;
        }
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    };

    if (loading) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-zinc-500">Adres haritada aranıyor...</p>
            </div>
        );
    }

    if (error || !position) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center bg-red-50 rounded-xl border border-red-100 p-6 text-center">
                <MapPinOff className="w-10 h-10 text-red-400 mb-3" />
                <h3 className="font-bold text-red-800 mb-1">Adres Tam Konumlandırılamadı</h3>
                <p className="text-xs text-red-600/80 mb-4 max-w-xs leading-relaxed">
                    Girilen adres açık kaynaklı harita sisteminde bulunamadı. Muhtemelen mahalle/sokak ismi eksik.
                    <br />Yine de Google Haritalar ile aramayı deneyebilirsiniz.
                </p>
                <Button asChild className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg">
                    <a href={getGoogleMapsUrl()} target="_blank" rel="noopener noreferrer">
                        <Navigation className="w-4 h-4 mr-2" /> Google'da Aç
                    </a>
                </Button>
            </div>
        );
    }

    return (
        <div className="relative rounded-xl overflow-hidden border border-zinc-200 shadow-sm h-[350px] w-full flex flex-col">
            <div className="flex-1 w-full bg-zinc-100 z-0">
                <MapContainer center={position} zoom={15} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position}>
                        <Popup>
                            <strong>Teslimat Noktası</strong><br />
                            Teyit edilen konum.
                        </Popup>
                    </Marker>
                    <ChangeView center={position} zoom={16} />
                </MapContainer>
            </div>
            <div className="bg-white p-4 border-t z-10">
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg h-12 rounded-xl text-md font-bold">
                    <a href={getGoogleMapsUrl()} target="_blank" rel="noopener noreferrer">
                        <Navigation className="w-5 h-5 mr-2" /> Yol Tarifi Al (Navigasyon)
                    </a>
                </Button>
            </div>
        </div>
    );
}
