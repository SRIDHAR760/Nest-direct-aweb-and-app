import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Compass, Navigation, Maximize2, Minimize2, X, 
  Search, Home, Sparkles, Building, Car, Bus, Bike, 
  Layers, Plus, Minus, Target, Star, Utensils, GraduationCap, ShieldCheck
} from 'lucide-react';

interface NeighborhoodProps {
  selectedZone: string;
  onZoneSelect: (zone: string) => void;
  neighborhoodData: Record<string, { desc: string; avgRent: number; directCount: number }>;
  transitMode: 'auto' | 'metro' | 'bike';
  selectedWorkplace?: string;
  onPropertySelect?: (id: string) => void;
}

interface MapProperty {
  id: string;
  title: string;
  city: string;
  price: number;
  type: string;
  address: string;
  x: number;
  y: number;
  emoji?: string;
}

const mapProperties: MapProperty[] = [
  { id: 'prop-1', title: 'Dream Home 😊', city: 'Nungambakkam', price: 35000, type: '2 BHK', address: 'Main St & Greene St', x: 80, y: 75, emoji: '😊' },
  { id: 'prop-4', title: 'Heritage Haven 🏡', city: 'Mylapore', price: 25000, type: '1 BHK', address: 'Luz Church Road', x: 175, y: 85, emoji: '🏡' },
  { id: 'prop-2', title: 'Vastu Beach Villa 🌊', city: 'Adyar', price: 65000, type: '3 BHK', address: 'Adyar Avenue', x: 195, y: 175, emoji: '🌊' },
  { id: 'prop-5', title: 'Waterfront Loft 🏙️', city: 'Adyar', price: 45000, type: '2 BHK', address: 'Besant Avenue', x: 220, y: 195, emoji: '🏙️' },
  { id: 'prop-3', title: 'Smart Studio ⚡', city: 'OMR', price: 18000, type: 'Studio', address: 'TIDEL Park Road', x: 135, y: 245, emoji: '⚡' },
  { id: 'prop-6', title: 'Eco Villa 🌿', city: 'OMR', price: 32000, type: '2 BHK', address: 'ECR Link Road', x: 160, y: 275, emoji: '🌿' },
];

const pois = [
  { id: 'dominos', label: "Domino's Pizza", type: 'food', x: 45, y: 40, icon: Utensils },
  { id: 'school', label: 'Journalism & Mass Comm', type: 'edu', x: 165, y: 35, icon: GraduationCap },
  { id: 'park', label: 'Greene St Park & Fountain', type: 'park', x: 245, y: 80, icon: Sparkles },
  { id: 'science', label: 'Physical Science Center', type: 'edu', x: 85, y: 220, icon: Building },
];

const mapWorkplaces = [
  { id: 'iitm', name: 'IIT Madras Park', zone: 'Adyar', x: 180, y: 185 },
  { id: 'tidel', name: 'TIDEL Park IT', zone: 'OMR', x: 145, y: 260 },
  { id: 'spencer', name: 'Spencer Plaza', zone: 'Nungambakkam', x: 65, y: 55 },
];

const NeighborhoodMap: React.FC<NeighborhoodProps> = ({ 
  selectedZone, 
  onZoneSelect, 
  neighborhoodData, 
  transitMode,
  selectedWorkplace = 'iitm',
  onPropertySelect
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hoveredProp, setHoveredProp] = useState<MapProperty | null>(null);
  const [selectedProp, setSelectedProp] = useState<MapProperty | null>(mapProperties[0]);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  const [searchQuery, setSearchQuery] = useState('');

  const currentZone = neighborhoodData[selectedZone] || neighborhoodData['Adyar'];

  const filteredProperties = mapProperties.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMapContent = (full: boolean = false) => (
    <div className="relative w-full h-full bg-[#E5E3DF] overflow-hidden select-none">
      {/* Real Google Maps Vector Street Network SVG */}
      <motion.svg 
        viewBox="0 0 300 300" 
        className="w-full h-full cursor-grab active:cursor-grabbing"
        animate={{ scale: zoomLevel }}
        transition={{ duration: 0.2 }}
      >
        <defs>
          {/* Street Blocks Pattern */}
          <pattern id="streetBlock" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill={mapStyle === 'satellite' ? '#1e293b' : mapStyle === 'terrain' ? '#e8f5e9' : '#f1f5f9'} />
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke={mapStyle === 'satellite' ? '#334155' : '#e2e8f0'} strokeWidth="1" />
          </pattern>

          {/* Building Outlines Pattern */}
          <pattern id="buildings" width="30" height="30" patternUnits="userSpaceOnUse">
            <rect x="2" y="2" width="12" height="12" fill="#e2e8f0" rx="1" />
            <rect x="16" y="2" width="10" height="10" fill="#cbd5e1" rx="1" />
            <rect x="2" y="16" width="24" height="10" fill="#f1f5f9" rx="1" />
          </pattern>

          {/* Pin Glow Shadow */}
          <filter id="pinGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. Base Map Layer */}
        <rect width="300" height="300" fill="url(#streetBlock)" />
        <rect width="300" height="300" fill="url(#buildings)" opacity="0.25" />

        {/* 2. Coastline Water (Bay of Bengal) */}
        <path d="M 235,0 C 255,60 230,120 255,200 C 245,250 252,300 252,300 L 300,300 L 300,0 Z" fill="#aecbfa" />

        {/* 3. Major Secondary & Primary Road Grids */}
        {/* Greene Street */}
        <path d="M 0,110 L 300,50" fill="none" stroke="#22c55e" strokeWidth="5" opacity="0.75" />
        <path d="M 0,110 L 300,50" fill="none" stroke="#ffffff" strokeWidth="3" />
        <text x="140" y="72" className="font-sans text-[4px] fill-slate-700 font-extrabold" transform="rotate(-11 140 72)">Greene St</text>

        {/* Main Street */}
        <path d="M 60,0 L 20,300" fill="none" stroke="#94a3b8" strokeWidth="6" />
        <path d="M 60,0 L 20,300" fill="none" stroke="#ffffff" strokeWidth="4" />
        <text x="45" y="120" className="font-sans text-[4px] fill-slate-600 font-bold" transform="rotate(82 45 120)">Main St</text>

        {/* Sumwalt Way */}
        <path d="M 30,140 Q 120,135 220,150" fill="none" stroke="#64748b" strokeWidth="4" />
        <path d="M 30,140 Q 120,135 220,150" fill="none" stroke="#ffffff" strokeWidth="2.5" />
        <text x="120" y="148" className="font-sans text-[3.5px] fill-slate-600 font-bold">Sumwalt Way</text>

        {/* Devine Street */}
        <path d="M 120,290 C 180,270 240,285 300,270" fill="none" stroke="#22c55e" strokeWidth="4" opacity="0.6" />
        <path d="M 120,290 C 180,270 240,285 300,270" fill="none" stroke="#ffffff" strokeWidth="2.5" />
        <text x="180" y="278" className="font-sans text-[3.5px] fill-slate-700 font-bold">Devine St</text>

        {/* 4. POI Icons (Pizza, College, Science Center) */}
        {pois.map((poi) => (
          <g key={poi.id} transform={`translate(${poi.x}, ${poi.y})`}>
            <circle r="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" filter="url(#pinGlow)" />
            <circle r="2.5" fill={poi.type === 'food' ? '#f97316' : poi.type === 'edu' ? '#3b82f6' : '#22c55e'} />
            <text x="6" y="2" className="font-sans text-[3.5px] fill-slate-600 font-bold">{poi.label}</text>
          </g>
        ))}

        {/* 5. Google Maps Green House Location Pins with Labels */}
        {filteredProperties.map((prop) => {
          const isSelected = selectedProp?.id === prop.id || hoveredProp?.id === prop.id;

          return (
            <g 
              key={prop.id}
              className="cursor-pointer"
              onClick={() => {
                setSelectedProp(prop);
                onZoneSelect(prop.city);
                if (onPropertySelect) onPropertySelect(prop.id);
              }}
              onMouseEnter={() => setHoveredProp(prop)}
              onMouseLeave={() => setHoveredProp(null)}
            >
              {/* Pulsing Ripple if Selected */}
              {isSelected && (
                <circle 
                  cx={prop.x} 
                  cy={prop.y} 
                  r="16" 
                  fill="#84cc16" 
                  fillOpacity="0.25" 
                  className="animate-ping"
                />
              )}

              {/* Green Google Pin teardrop shape matching screenshot */}
              <g transform={`translate(${prop.x}, ${prop.y})`} filter="url(#pinGlow)">
                {/* Teardrop Pin */}
                <path 
                  d="M 0,0 C -8,-10 -12,-16 0,-24 C 12,-16 8,-10 0,0 Z" 
                  fill={isSelected ? '#65a30d' : '#84cc16'} 
                  stroke="#ffffff" 
                  strokeWidth="1.5" 
                />
                {/* House Circle Badge inside Pin */}
                <circle cx="0" cy="-14" r="6" fill="#ffffff" />
                <path d="M -3,-14 L 0,-17 L 3,-14 L 3,-11 L -3,-11 Z" fill="#ef4444" />
                <rect x="-1" y="-13" width="2" height="2" fill="#3b82f6" />
              </g>

              {/* Green Pill Label Badge ("Dream Home 😊") matching screenshot */}
              <g transform={`translate(${prop.x}, ${prop.y + 12})`} filter="url(#pinGlow)">
                <rect 
                  x="-36" 
                  y="-8" 
                  width="72" 
                  height="16" 
                  rx="8" 
                  fill="#a3e635" 
                  stroke="#ffffff" 
                  strokeWidth="1.5" 
                />
                <text 
                  x="0" 
                  y="2.5" 
                  textAnchor="middle" 
                  fill="#1a2e05" 
                  className="font-sans text-[5.5px] font-black tracking-tight select-none"
                >
                  {prop.title}
                </text>
              </g>
            </g>
          );
        })}
      </motion.svg>

      {/* Touch To Open Full Screen Prompt Overlay */}
      {!full && (
        <button
          onClick={() => setIsFullScreen(true)}
          className="absolute inset-0 w-full h-full bg-slate-900/10 hover:bg-slate-900/20 backdrop-blur-[1px] transition-all flex flex-col items-center justify-center text-white gap-2 group cursor-pointer"
        >
          <div className="px-4 py-2.5 bg-slate-900/90 hover:bg-[#84cc16] hover:text-slate-950 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-2xl flex items-center gap-2 transition-all transform group-hover:scale-105 border border-white/20">
            <Maximize2 className="w-4 h-4" />
            Touch / Click to Expand Map
          </div>
          <span className="text-[10px] font-bold text-white bg-slate-900/80 px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
            Interactive Full-Screen Google Maps Experience
          </span>
        </button>
      )}

      {/* Floating Zoom & Style Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
        <button 
          onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 1.8))}
          className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-800 rounded-lg shadow-md flex items-center justify-center border border-slate-200 cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
          className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-800 rounded-lg shadow-md flex items-center justify-center border border-slate-200 cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setIsFullScreen(!full)}
          className="w-8 h-8 bg-[#84cc16] hover:bg-[#65a30d] text-slate-950 rounded-lg shadow-md flex items-center justify-center border border-white/40 cursor-pointer"
          title={full ? "Exit Fullscreen" : "Fullscreen Map"}
        >
          {full ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Property Preview Card */}
      {selectedProp && (
        <div className="absolute inset-x-3 bottom-3 z-20">
          <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl text-left flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#84cc16] text-slate-950 font-black rounded-md text-[9px] uppercase tracking-wider">
                  {selectedProp.title}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{selectedProp.address}</span>
              </div>
              <h4 className="text-sm font-black text-white truncate">
                ₹{selectedProp.price.toLocaleString()}/mo • {selectedProp.type}
              </h4>
            </div>

            <button
              onClick={() => {
                onZoneSelect(selectedProp.city);
                if (onPropertySelect) onPropertySelect(selectedProp.id);
                if (full) setIsFullScreen(false);
              }}
              className="px-4 py-2 bg-[#84cc16] hover:bg-[#65a30d] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Home className="w-3.5 h-3.5" />
              View Listing
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 text-left" id="interactive-google-map-root">
      {/* Inline Preview Container */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#84cc16]" />
            Local Area Map & Dream Homes
          </h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Google Maps Street Grid & Real-time Pins</p>
        </div>
        <button
          onClick={() => setIsFullScreen(true)}
          className="px-3.5 py-1.5 bg-[#84cc16] hover:bg-[#65a30d] text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Full Screen
        </button>
      </div>

      {/* Main Inline Map Container */}
      <div className="relative aspect-square sm:aspect-[4/3] rounded-[2rem] border border-slate-200 overflow-hidden shadow-lg">
        {renderMapContent(false)}
      </div>

      {/* 🚀 FULL-SCREEN GOOGLE MAPS MODAL */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl p-4 sm:p-8 flex flex-col"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 rounded-t-2xl border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#84cc16] flex items-center justify-center text-slate-950 font-black">
                  <Navigation className="w-5 h-5 transform -rotate-45" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide">Full-Screen Google Maps Explorer</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Chennai Ward Intelligence & Dream Home Pins</p>
                </div>
              </div>

              {/* Search & Close */}
              <div className="flex items-center gap-3">
                <div className="relative hidden sm:block">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search property or street..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-800 text-white placeholder:text-slate-400 text-xs font-bold pl-9 pr-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-[#84cc16]"
                  />
                </div>

                <button
                  onClick={() => setIsFullScreen(false)}
                  className="w-10 h-10 bg-slate-800 hover:bg-red-500 text-white rounded-xl flex items-center justify-center transition-all border border-slate-700 cursor-pointer"
                  title="Close Fullscreen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Full-screen Map Body */}
            <div className="flex-1 bg-slate-900 rounded-b-2xl overflow-hidden relative border border-slate-800">
              {renderMapContent(true)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NeighborhoodMap;
