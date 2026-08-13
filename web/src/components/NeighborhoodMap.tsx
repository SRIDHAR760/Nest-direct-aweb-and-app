import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Compass, Navigation, Maximize2, Minimize2, X, 
  Search, Home, Sparkles, Building, Car, Bus, Bike, 
  Layers, Plus, Minus, Target, Star, ShieldCheck, Flame, Zap
} from 'lucide-react';

interface NeighborhoodProps {
  selectedZone: string;
  onZoneSelect: (zone: string) => void;
  neighborhoodData: Record<string, { desc: string; avgRent: number; directCount: number }>;
  transitMode: 'auto' | 'metro' | 'bike';
  selectedWorkplace?: string;
  onPropertySelect?: (id: string) => void;
  highlightedPropertyId?: string | null;
}

interface MapProperty {
  id: string;
  title: string;
  city: string;
  price: number;
  type: string;
  address: string;
  image: string;
  rating: number;
  bedrooms: number;
  area: number;
  lat: number;
  lng: number;
  emoji: string;
  safetyScore: number;
}

const realChennaiProperties: MapProperty[] = [
  { 
    id: 'prop-1', 
    title: 'Dream Penthouse 😊', 
    city: 'Nungambakkam', 
    price: 35000, 
    type: '2 BHK', 
    address: 'Khadder Nawaz Khan Rd, Nungambakkam', 
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800',
    rating: 4.9,
    bedrooms: 2,
    area: 950,
    lat: 13.0604,
    lng: 80.2496,
    emoji: '😊',
    safetyScore: 96
  },
  { 
    id: 'prop-4', 
    title: 'Heritage Haven 🏡', 
    city: 'Mylapore', 
    price: 25000, 
    type: '1 BHK', 
    address: 'Luz Church Road, Mylapore', 
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
    rating: 4.8,
    bedrooms: 1,
    area: 650,
    lat: 13.0339,
    lng: 80.2696,
    emoji: '🏡',
    safetyScore: 94
  },
  { 
    id: 'prop-2', 
    title: 'Vastu Beach Villa 🌊', 
    city: 'Adyar', 
    price: 65000, 
    type: '3 BHK', 
    address: 'Gandhi Nagar, Adyar', 
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
    rating: 5.0,
    bedrooms: 3,
    area: 1450,
    lat: 13.0012,
    lng: 80.2565,
    emoji: '🌊',
    safetyScore: 98
  },
  { 
    id: 'prop-5', 
    title: 'Waterfront Loft 🏙️', 
    city: 'Adyar', 
    price: 45000, 
    type: '2 BHK', 
    address: 'Elliot Beach Promenade, Besant Nagar', 
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=800',
    rating: 4.7,
    bedrooms: 2,
    area: 1100,
    lat: 12.9998,
    lng: 80.2680,
    emoji: '🏙️',
    safetyScore: 95
  },
  { 
    id: 'prop-3', 
    title: 'Smart Studio ⚡', 
    city: 'OMR', 
    price: 18000, 
    type: 'Studio', 
    address: 'Rajiv Gandhi Salai (OMR), Perungudi', 
    image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=800',
    rating: 4.6,
    bedrooms: 1,
    area: 500,
    lat: 12.9698,
    lng: 80.2457,
    emoji: '⚡',
    safetyScore: 92
  },
  { 
    id: 'prop-6', 
    title: 'Eco Villa 🌿', 
    city: 'OMR', 
    price: 32000, 
    type: '2 BHK', 
    address: 'ECR Link Road, Sholinganallur', 
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800',
    rating: 4.8,
    bedrooms: 2,
    area: 900,
    lat: 12.9010,
    lng: 80.2279,
    emoji: '🌿',
    safetyScore: 93
  },
];

const zoneCoords: Record<string, [number, number]> = {
  'Adyar': [13.0012, 80.2565],
  'Mylapore': [13.0339, 80.2696],
  'Nungambakkam': [13.0604, 80.2496],
  'OMR': [12.9698, 80.2457],
  'All': [13.0300, 80.2500]
};

const NeighborhoodMap: React.FC<NeighborhoodProps> = ({ 
  selectedZone, 
  onZoneSelect, 
  neighborhoodData, 
  transitMode,
  selectedWorkplace = 'iitm',
  onPropertySelect,
  highlightedPropertyId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylineRef = useRef<any>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const [selectedProp, setSelectedProp] = useState<MapProperty | null>(realChennaiProperties[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);

  // Dynamically load Leaflet JS script if not present
  useEffect(() => {
    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => setIsLeafletLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Initialize & update Leaflet Real-time Map
  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current || !(window as any).L) return;
    const L = (window as any).L;

    if (!mapInstanceRef.current) {
      // Create Leaflet Map Instance
      const center: [number, number] = zoneCoords[selectedZone] || [13.0300, 80.2500];
      const map = L.map(mapContainerRef.current, {
        center,
        zoom: 13,
        zoomControl: false
      });

      // Default OpenStreetMap Tile Layer
      const streetTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
      });
      streetTile.addTo(map);
      mapInstanceRef.current = map;

      // Add Custom Green House Markers
      realChennaiProperties.forEach(prop => {
        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div class="group cursor-pointer transform hover:scale-110 transition-transform">
              <div class="bg-[#84cc16] text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-lg border-2 border-white flex items-center gap-1 whitespace-nowrap">
                <span>${prop.emoji}</span>
                <span>${prop.title.split(' ')[0]}</span>
                <span class="bg-slate-950 text-white px-1.5 py-0.2 rounded-md text-[8px]">₹${(prop.price/1000).toFixed(0)}k</span>
              </div>
            </div>
          `,
          iconSize: [120, 30],
          iconAnchor: [60, 15]
        });

        const marker = L.marker([prop.lat, prop.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedProp(prop);
          onZoneSelect(prop.city);
          if (onPropertySelect) onPropertySelect(prop.id);
        });

        markersRef.current[prop.id] = marker;
      });
    } else {
      // Map already initialized - resize cleanly
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 200);
    }
  }, [isLeafletLoaded, isFullScreen]);

  // Update Tile Style Layer dynamically
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).L) return;
    const L = (window as any).L;
    const map = mapInstanceRef.current;

    // Remove existing tile layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    if (mapStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else if (mapStyle === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }

    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
  }, [mapStyle]);

  // Pan Map when selectedZone or highlightedPropertyId changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (highlightedPropertyId) {
      const targetProp = realChennaiProperties.find(p => p.id === highlightedPropertyId);
      if (targetProp) {
        map.flyTo([targetProp.lat, targetProp.lng], 15, { duration: 1.2 });
        setSelectedProp(targetProp);
        return;
      }
    }

    const coords = zoneCoords[selectedZone];
    if (coords) {
      map.flyTo(coords, 13, { duration: 1.2 });
    }
  }, [selectedZone, highlightedPropertyId]);

  return (
    <div className="w-full h-full min-h-[550px] flex flex-col text-left relative overflow-hidden bg-slate-900 rounded-[2.5rem]" id="realtime-leaflet-map-wrapper">
      
      {/* 🧭 Top Floating Real-time Controls Header */}
      <div className="p-3 bg-slate-900/95 backdrop-blur-md text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 z-20">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="w-8 h-8 rounded-lg bg-[#84cc16] flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
            <Navigation className="w-4 h-4 transform -rotate-45" />
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Chennai street or ward..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                const query = e.target.value.toLowerCase();
                const matched = realChennaiProperties.find(p => p.title.toLowerCase().includes(query) || p.city.toLowerCase().includes(query));
                if (matched && mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([matched.lat, matched.lng], 15);
                  setSelectedProp(matched);
                }
              }}
              className="w-full bg-slate-800 text-white placeholder:text-slate-400 text-xs font-bold pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-[#84cc16]"
            />
          </div>
        </div>

        {/* Real-Time Layer Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMapStyle('streets')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              mapStyle === 'streets' ? 'bg-[#84cc16] text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Street Map
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              mapStyle === 'satellite' ? 'bg-[#3b82f6] text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="w-8 h-8 bg-slate-800 hover:bg-[#84cc16] text-white hover:text-slate-950 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Map"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 🗺️ REAL-TIME LEAFLET / OPENSTREETMAP CANVAS */}
      <div className="flex-1 w-full h-full min-h-[500px] relative z-10">
        <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />
      </div>

      {/* 🏡 Bottom Property Card Overlay */}
      {selectedProp && (
        <div className="absolute inset-x-3 bottom-3 z-30 pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/95 backdrop-blur-md p-4 rounded-3xl border border-slate-800 shadow-2xl text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <img src={selectedProp.image} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/10 shrink-0 shadow-md" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#84cc16] text-slate-950 font-black rounded-md text-[9px] uppercase tracking-wider">
                    {selectedProp.title}
                  </span>
                  <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" /> {selectedProp.rating}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white truncate">
                  ₹{selectedProp.price.toLocaleString()}/mo • {selectedProp.bedrooms} BHK ({selectedProp.area} sqft)
                </h4>
                <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#84cc16]" /> {selectedProp.address}
                </p>
              </div>
            </div>

            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={() => {
                  onZoneSelect(selectedProp.city);
                  if (onPropertySelect) onPropertySelect(selectedProp.id);
                  if (isFullScreen) setIsFullScreen(false);
                }}
                className="flex-1 sm:flex-none px-5 py-3 bg-[#84cc16] hover:bg-[#65a30d] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Home className="w-4 h-4" />
                Schedule Tour
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 🚀 FULL-SCREEN MODAL */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl p-4 sm:p-8 flex flex-col"
          >
            <div className="bg-slate-900 px-6 py-4 rounded-t-3xl border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#84cc16] flex items-center justify-center text-slate-950 font-black shadow-md">
                  <Navigation className="w-5 h-5 transform -rotate-45" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide">Real-Time OpenStreetMap Engine</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Chennai Live Satellite & Street Navigation</p>
                </div>
              </div>

              <button
                onClick={() => setIsFullScreen(false)}
                className="w-10 h-10 bg-slate-800 hover:bg-red-500 text-white rounded-2xl flex items-center justify-center transition-all border border-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-slate-900 rounded-b-3xl overflow-hidden relative border border-slate-800">
              <div ref={mapContainerRef} className="w-full h-full min-h-[600px]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NeighborhoodMap;
