"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Navigation, Navigation2 } from "lucide-react";

// Fix default Leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const myLocationIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Cache for geocoding
const geocodeCache: Record<string, [number, number] | null> = {};

// Simple rate-limiting queue for Nominatim to prevent 429 errors
const queueGeocode = async (address: string): Promise<[number, number] | null> => {
    if (geocodeCache[address] !== undefined) {
        return geocodeCache[address];
    }
    
    // Clean address helper to strip extreme details (like Daire, No, Kat, Blok) which Nominatim hates
    // For "Çınar Mahallesi - İhlas Evleri B11 Daire 11", this helps get just "Çınar Mahallesi"
    const getCleanFallback = (addr: string) => {
        // usually Neighborhood is before a dash or comma
        const parts = addr.split(/[-,\r\n]/);
        if (parts.length > 1 && parts[0].trim().length > 5) {
            return parts[0].trim();
        }
        return addr.split(" ").slice(0, 3).join(" "); // first 3 words
    };

    return new Promise((resolve) => {
        setTimeout(async () => {
            try {
                // Try 1: Full address
                let query = encodeURIComponent(address + ", Türkiye");
                let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
                    headers: { "Accept-Language": "tr" }
                });
                let data = await res.json();
                
                // Try 2: Clean fallback
                if (!data || data.length === 0) {
                    const fallback = getCleanFallback(address);
                    query = encodeURIComponent(fallback + ", Türkiye");
                    res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
                        headers: { "Accept-Language": "tr" }
                    });
                    data = await res.json();
                }

                if (data && data.length > 0) {
                    const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                    geocodeCache[address] = coords;
                    resolve(coords);
                } else {
                    geocodeCache[address] = null;
                    resolve(null);
                }
            } catch (e) {
                resolve(null);
            }
        }, 1200);
    });
};


function AutoFitBounds({ markers }: { markers: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    }, [map, markers]);
    return null;
}

export function MapComponent({ deliveries }: { deliveries: any[] }) {
    const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
    const [deliveryLocs, setDeliveryLocs] = useState<{ id: string, coords: [number, number], person: any }[]>([]);
    const [loadingMsg, setLoadingMsg] = useState("Konumunuz aranıyor...");
    const [failedCount, setFailedCount] = useState(0);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
                (err) => setLoadingMsg("Konum izni reddedildi. Harita hedeflere odaklanacak.")
            );
        }

        const resolveAddresses = async () => {
            setLoadingMsg("Hedef adresler haritada bulunuyor...");
            const temps: { id: string, coords: [number, number], person: any }[] = [];
            let unresolvable = 0;

            for (const d of deliveries) {
                const c = await queueGeocode(d.household.address);
                if (c) {
                    const applicant = d.household.persons.find((p: any) => p.isApplicant) || d.household.persons[0];
                    temps.push({ id: d.id, coords: c, person: applicant });
                    setDeliveryLocs([...temps]); // update gradually
                } else {
                    unresolvable++;
                }
            }
            setFailedCount(unresolvable);
            setLoadingMsg(""); // Done
        };

        resolveAddresses();
    }, [deliveries]);

    const allMarkers = [...deliveryLocs.map(d => d.coords)];
    if (userLoc) allMarkers.push(userLoc);

    return (
        <div className="w-full h-[60vh] bg-zinc-100 rounded-[32px] overflow-hidden border border-black/[0.04] shadow-sm relative z-0 flex flex-col">
            
            {loadingMsg && allMarkers.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/90 backdrop-blur-sm z-50">
                    <div className="bg-white px-5 py-3 rounded-2xl shadow-sm text-sm font-semibold text-zinc-600 animate-pulse border border-black/[0.04] flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                        {loadingMsg}
                    </div>
                </div>
            )}

            {/* Warning overlay if some addresses failed */}
            {!loadingMsg && failedCount > 0 && (
                <div className="absolute top-4 left-4 right-4 z-[999] pointer-events-none flex justify-center">
                    <div className="bg-amber-100/90 backdrop-blur-md border border-amber-200 text-amber-800 px-4 py-2.5 rounded-[16px] text-xs font-bold shadow-lg shadow-amber-900/5 text-center leading-snug">
                        {failedCount} ailenin adresi haritada tam bulunamadı. <br className="sm:hidden" /> Yol tarifini kartlardaki butondan Navigasyon ile deneyin.
                    </div>
                </div>
            )}

            <MapContainer 
                center={userLoc || [39.92077, 32.85411]} 
                zoom={6} 
                style={{ width: "100%", height: "100%", minHeight: "300px" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                
                {allMarkers.length > 0 && <AutoFitBounds markers={allMarkers} />}

                {userLoc && (
                    <Marker position={userLoc} icon={myLocationIcon}>
                        <Popup>
                            <strong>Şu An Buradasınız</strong>
                        </Popup>
                    </Marker>
                )}

                {deliveryLocs.map((d) => (
                    <Marker key={d.id} position={d.coords}>
                        <Popup>
                            <div className="font-sans">
                                <strong className="block text-sm mb-1">{d.person?.firstName} {d.person?.lastName}</strong>
                                <a 
                                    href={`https://maps.google.com/?q=${d.coords[0]},${d.coords[1]}`} 
                                    target="_blank" 
                                    className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-bold inline-flex items-center gap-1 mt-1"
                                    rel="noreferrer"
                                >
                                    <Navigation className="w-3 h-3" /> Yol Tarifi Al
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
