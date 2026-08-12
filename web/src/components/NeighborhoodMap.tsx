import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Compass, Navigation, Maximize2, Minimize2, X, 
  Search, Home, Sparkles, Building, Car, Bus, Bike, 
  Layers, Plus, Minus, Target, Star, Utensils, GraduationCap, 
  ShieldCheck, Eye, Zap, Flame, Route, Sliders, CheckCircle
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
  image: string;
  rating: number;
  bedrooms: number;
  area: number;
  x: number;
  y: number;
  emoji: string;
  safetyScore: number;
}

const mapProperties: MapProperty[] = [
  { 
    id: 'prop-1', 
    title: 'Dream Penthouse 😊', 
    city: 'Nungambakkam', 
    price: 35000, 
    type: '2 BHK', 
    address: 'Greene St & Main St Corner', 
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800',
    rating: 4.9,
    bedrooms: 2,
    area: 950,
    x: 80, 
    y: 75, 
    emoji: '😊',
    safetyScore: 96
  },
  { 
    id: 'prop-4', 
    title: 'Heritage Haven 🏡', 
    city: 'Mylapore', 
    price: 25000, 
    type: '1 BHK', 
    address: 'Luz Church Road Junction', 
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
    rating: 4.8,
    bedrooms: 1,
    area: 650,
    x: 175, 
    y: 85, 
    emoji: '🏡',
    safetyScore: 94
  },
  { 
    id: 'prop-2', 
    title: 'Vastu Beach Villa 🌊', 
    city: 'Adyar', 
    price: 65000, 
    type: '3 BHK', 
    address: 'Adyar Beachfront Avenue', 
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
    rating: 5.0,
    bedrooms: 3,
    area: 1450,
    x: 195, 
    y: 175, 
    emoji: '🌊',
    safetyScore: 98
  },
  { 
    id: 'prop-5', 
    title: 'Waterfront Loft 🏙️', 
    city: 'Adyar', 
    price: 45000, 
    type: '2 BHK', 
    address: 'Besant Nagar Promenade', 
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=800',
    rating: 4.7,
    bedrooms: 2,
    area: 1100,
    x: 220, 
    y: 195, 
    emoji: '🏙️',
    safetyScore: 95
  },
  { 
    id: 'prop-3', 
    title: 'Smart Studio ⚡', 
    city: 'OMR', 
    price: 18000, 
    type: 'Studio', 
    address: 'TIDEL Park IT Highway', 
    image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=800',
    rating: 4.6,
    bedrooms: 1,
    area: 500,
    x: 135, 
    y: 245, 
    emoji: '⚡',
    safetyScore: 92
  },
  { 
    id: 'prop-6', 
    title: 'Eco Villa 🌿', 
    city: 'OMR', 
    price: 32000, 
    type: '2 BHK', 
    address: 'ECR Green Corridor', 
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800',
    rating: 4.8,
    bedrooms: 2,
    area: 900,
    x: 160, 
    y: 275, 
    emoji: '🌿',
    safetyScore: 93
  },
];

const workplaces = [
  { id: 'iitm', name: 'IIT Madras Park', city: 'Adyar', x: 180, y: 185, time: '8 mins' },
  { id: 'tidel', name: 'TIDEL Park IT Expressway', city: 'OMR', x: 145, y: 260, time: '12 mins' },
  { id: 'spencer', name: 'Spencer Plaza Commercial', city: 'Nungambakkam', x: 65, y: 55, time: '6 mins' },
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
  const [activeWorkplace, setActiveWorkplace] = useState(workplaces[0]);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [is3DTilt, setIs3DTilt] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState<'none' | 'price' | 'safety'>('none');
  const [searchQuery, setSearchQuery] = useState('');

  const currentZone = neighborhoodData[selectedZone] || neighborhoodData['Adyar'];

  const filteredProperties = useMemo(() => {
    return mapProperties.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Calculate route curve path between destination workplace and selected property pin
  const routeCurvePath = useMemo(() => {
    const targetX = selectedProp ? selectedProp.x : 180;
    const targetY = selectedProp ? selectedProp.y : 185;
    const startX = activeWorkplace.x;
    const startY = activeWorkplace.y;
    const cpX = (startX + targetX) / 2 - (startY - targetY) * 0.25;
    const cpY = (startY + targetY) / 2 + (startX - targetX) * 0.25;
    return `M ${startX},${startY} Q ${cpX},${cpY} ${targetX},${targetY}`;
  }, [selectedProp, activeWorkplace]);

  const renderMapCanvas = (full: boolean = false) => (
    <div className="relative w-full h-full bg-[#E5E3DF] overflow-hidden select-none">
      
      {/* 🧭 Google Maps Top Floating Navigation Search Bar */}
      <div className="absolute top-3 left-3 right-16 sm:right-auto z-20 flex items-center gap-2">
        <div className="relative flex-1 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          <input
            type="text"
            placeholder="Search Chennai street, ward, BHK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-bold text-slate-900 bg-transparent placeholder:text-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 🗺️ Main Map SVG Graphics */}
      <motion.div 
        className="w-full h-full origin-center transition-transform duration-500"
        style={{
          transform: is3DTilt ? 'rotateX(30deg) rotateZ(-5deg) scale(1.15)' : 'none'
        }}
      >
        <motion.svg 
          viewBox="0 0 300 300" 
          className="w-full h-full"
          animate={{ scale: zoomLevel }}
          transition={{ duration: 0.2 }}
        >
          <defs>
            {/* GIS Grid Pattern */}
            <pattern id="advancedGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#f8fafc" />
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            </pattern>

            {/* Building Block Texture */}
            <pattern id="bldgTexture" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect x="2" y="2" width="7" height="7" fill="#e2e8f0" rx="1" />
              <rect x="11" y="2" width="7" height="7" fill="#cbd5e1" rx="1" />
              <rect x="2" y="11" width="16" height="7" fill="#f1f5f9" rx="1" />
            </pattern>

            {/* Glow Drop Shadow */}
            <filter id="advPinGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
            </filter>

            {/* Heatmap Gradients */}
            <radialGradient id="heatPrice" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
            </radialGradient>
            <radialGradient id="heatSafety" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </radialGradient>
          </defs>

          {/* 1. Base Map Layer */}
          <rect width="300" height="300" fill="url(#advancedGrid)" />
          <rect width="300" height="300" fill="url(#bldgTexture)" opacity="0.3" />

          {/* 2. Heatmap Overlay Layer if Active */}
          {heatmapMode === 'price' && (
            <circle cx="195" cy="175" r="90" fill="url(#heatPrice)" className="pointer-events-none transition-all" />
          )}
          {heatmapMode === 'safety' && (
            <circle cx="195" cy="175" r="110" fill="url(#heatSafety)" className="pointer-events-none transition-all" />
          )}

          {/* 3. Ocean / Bay of Bengal Coastline */}
          <path d="M 235,0 C 255,60 230,120 255,200 C 245,250 252,300 252,300 L 300,300 L 300,0 Z" fill="#93c5fd" />
          <text x="272" y="80" className="font-sans text-[6.5px] fill-[#1e40af] font-black uppercase tracking-widest" transform="rotate(90 272 80)">
            Bay of Bengal
          </text>

          {/* 4. Major Road Networks with Labels */}
          {/* Greene Street */}
          <path d="M 0,110 L 300,50" fill="none" stroke="#22c55e" strokeWidth="6" opacity="0.8" />
          <path d="M 0,110 L 300,50" fill="none" stroke="#ffffff" strokeWidth="3.5" />
          <text x="140" y="72" className="font-sans text-[4.5px] fill-slate-800 font-extrabold" transform="rotate(-11 140 72)">Greene St</text>

          {/* Main Street */}
          <path d="M 60,0 L 20,300" fill="none" stroke="#64748b" strokeWidth="6" />
          <path d="M 60,0 L 20,300" fill="none" stroke="#ffffff" strokeWidth="4" />
          <text x="45" y="120" className="font-sans text-[4.5px] fill-slate-700 font-bold" transform="rotate(82 45 120)">Main St</text>

          {/* OMR IT Highway */}
          <path d="M 120,195 Q 165,230 195,235 T 145,295" fill="none" stroke="#eab308" strokeWidth="6" />
          <path d="M 120,195 Q 165,230 195,235 T 145,295" fill="none" stroke="#ffffff" strokeWidth="4" />

          {/* 5. Live Navigation Route Path with Moving Direction Particles */}
          <g className="pointer-events-none">
            <path 
              d={routeCurvePath} 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="5" 
              strokeLinecap="round"
              opacity="0.9"
              filter="url(#advPinGlow)"
            />
            <path 
              d={routeCurvePath} 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="2" 
              strokeDasharray="4 6"
              style={{ animation: 'advDash 1.2s linear infinite' }}
            />
            <circle r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5">
              <animateMotion dur="2.2s" repeatCount="indefinite" path={routeCurvePath} />
            </circle>

            {/* Commute Time Floating Badge */}
            <g transform={`translate(${(activeWorkplace.x + (selectedProp?.x || 180)) / 2}, ${(activeWorkplace.y + (selectedProp?.y || 185)) / 2})`}>
              <rect x="-30" y="-10" width="60" height="20" rx="10" fill="#0f172a" filter="url(#advPinGlow)" stroke="#3b82f6" strokeWidth="1" />
              <text x="0" y="3" textAnchor="middle" fill="#ffffff" className="font-sans text-[7px] font-black uppercase tracking-wider">
                ⚡ {activeWorkplace.time}
              </text>
            </g>
          </g>

          {/* 6. Workplace Target Nodes */}
          {workplaces.map((w) => {
            const isActive = activeWorkplace.id === w.id;
            return (
              <g 
                key={`wp-${w.id}`}
                className="cursor-pointer"
                onClick={() => setActiveWorkplace(w)}
              >
                <circle cx={w.x} cy={w.y} r={isActive ? 9 : 6} fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" filter="url(#advPinGlow)" />
                <circle cx={w.x} cy={w.y} r="3.5" fill="#eab308" />
              </g>
            );
          })}

          {/* 7. Green House Pins with Custom Emoji Titles matching Screenshot */}
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
                {/* Pulsing Target Ring */}
                {isSelected && (
                  <circle cx={prop.x} cy={prop.y} r="18" fill="#84cc16" fillOpacity="0.3" className="animate-ping" />
                )}

                {/* Green Pin Shape */}
                <g transform={`translate(${prop.x}, ${prop.y})`} filter="url(#advPinGlow)">
                  <path 
                    d="M 0,0 C -8,-10 -12,-16 0,-24 C 12,-16 8,-10 0,0 Z" 
                    fill={isSelected ? '#65a30d' : '#84cc16'} 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                  />
                  <circle cx="0" cy="-14" r="6.5" fill="#ffffff" />
                  <path d="M -3.5,-14 L 0,-17.5 L 3.5,-14 L 3.5,-10.5 L -3.5,-10.5 Z" fill="#ef4444" />
                  <rect x="-1" y="-13" width="2.5" height="2.5" fill="#3b82f6" />
                </g>

                {/* Green Pill Badge ("Dream Penthouse 😊") */}
                <g transform={`translate(${prop.x}, ${prop.y + 13})`} filter="url(#advPinGlow)">
                  <rect 
                    x="-40" 
                    y="-9" 
                    width="80" 
                    height="18" 
                    rx="9" 
                    fill={isSelected ? '#84cc16' : '#a3e635'} 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                  />
                  <text 
                    x="0" 
                    y="3" 
                    textAnchor="middle" 
                    fill="#1a2e05" 
                    className="font-sans text-[6px] font-black tracking-tight select-none"
                  >
                    {prop.title}
                  </text>
                </g>
              </g>
            );
          })}
        </motion.svg>
      </motion.div>

      {/* SVG Dash Keyframe Animation */}
      <style>{`
        @keyframes advDash {
          to { stroke-dashoffset: -20; }
        }
      `}</style>

      {/* Touch to Expand Prompt (Only on Inline Mode) */}
      {!full && (
        <button
          onClick={() => setIsFullScreen(true)}
          className="absolute inset-0 w-full h-full bg-slate-900/10 hover:bg-slate-900/25 backdrop-blur-[1px] transition-all flex flex-col items-center justify-center text-white gap-2 group cursor-pointer"
        >
          <div className="px-5 py-3 bg-slate-900/90 hover:bg-[#84cc16] hover:text-slate-950 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-2xl flex items-center gap-2 transition-all transform group-hover:scale-105 border border-white/20">
            <Maximize2 className="w-4 h-4" />
            Touch / Click to Expand Full Map
          </div>
          <span className="text-[10px] font-bold text-white bg-slate-900/80 px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md">
            Interactive Full-Screen Google Maps Experience
          </span>
        </button>
      )}

      {/* 🎛️ Map Controls Bar (Top & Right) */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
        <button 
          onClick={() => setIs3DTilt(!is3DTilt)}
          className={`w-9 h-9 rounded-xl shadow-lg flex items-center justify-center border font-black text-xs transition-all cursor-pointer ${
            is3DTilt ? 'bg-[#84cc16] text-slate-950 border-white' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
          }`}
          title="Toggle 3D Tilt View"
        >
          3D
        </button>

        <button 
          onClick={() => setHeatmapMode(prev => prev === 'none' ? 'price' : prev === 'price' ? 'safety' : 'none')}
          className={`w-9 h-9 rounded-xl shadow-lg flex items-center justify-center border transition-all cursor-pointer ${
            heatmapMode !== 'none' ? 'bg-[#3b82f6] text-white border-white' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
          }`}
          title="Toggle Heatmap Layer"
        >
          <Flame className="w-4 h-4" />
        </button>

        <button 
          onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 1.8))}
          className="w-9 h-9 bg-white hover:bg-slate-100 text-slate-800 rounded-xl shadow-lg flex items-center justify-center border border-slate-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button 
          onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
          className="w-9 h-9 bg-white hover:bg-slate-100 text-slate-800 rounded-xl shadow-lg flex items-center justify-center border border-slate-200 cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button 
          onClick={() => setIsFullScreen(!full)}
          className="w-9 h-9 bg-[#84cc16] hover:bg-[#65a30d] text-slate-950 rounded-xl shadow-lg flex items-center justify-center border border-white/40 cursor-pointer"
        >
          {full ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
        </button>
      </div>

      {/* 🏡 High-Resolution Property Card Modal (Bottom) */}
      {selectedProp && (
        <div className="absolute inset-x-3 bottom-3 z-20">
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
                  <ShieldCheck className="w-3 h-3 text-[#84cc16]" /> Safety Score: {selectedProp.safetyScore}/100 • Direct Owner
                </p>
              </div>
            </div>

            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={() => {
                  onZoneSelect(selectedProp.city);
                  if (onPropertySelect) onPropertySelect(selectedProp.id);
                  if (full) setIsFullScreen(false);
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
    </div>
  );

  return (
    <div className="space-y-4 text-left" id="advanced-google-map-root">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#84cc16]" />
            Advanced Google Maps Intelligence
          </h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Interactive 3D Grid • Live Route Estimator</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullScreen(true)}
            className="px-4 py-2 bg-[#84cc16] hover:bg-[#65a30d] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Expand Full Screen
          </button>
        </div>
      </div>

      {/* Main Inline Canvas */}
      <div className="relative aspect-square sm:aspect-[4/3] rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl">
        {renderMapCanvas(false)}
      </div>

      {/* 🚀 FULL-SCREEN INTERACTIVE MAP MODAL */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl p-4 sm:p-8 flex flex-col"
          >
            {/* Modal Header Bar */}
            <div className="bg-slate-900 px-6 py-4 rounded-t-3xl border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#84cc16] flex items-center justify-center text-slate-950 font-black shadow-md">
                  <Navigation className="w-5 h-5 transform -rotate-45" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide">Full-Screen Google Maps Engine</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live Commute Estimator & Direct Home Listings</p>
                </div>
              </div>

              <button
                onClick={() => setIsFullScreen(false)}
                className="w-10 h-10 bg-slate-800 hover:bg-red-500 text-white rounded-2xl flex items-center justify-center transition-all border border-slate-700 cursor-pointer"
                title="Close Fullscreen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Map Canvas */}
            <div className="flex-1 bg-slate-900 rounded-b-3xl overflow-hidden relative border border-slate-800">
              {renderMapCanvas(true)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NeighborhoodMap;
