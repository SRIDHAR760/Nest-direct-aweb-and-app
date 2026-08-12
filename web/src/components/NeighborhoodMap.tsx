import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Compass, Navigation, Layers, Plus, Minus, 
  Target, Search, Sparkles, Building, Car, Bus, Bike, 
  Check, ArrowRight, ExternalLink, Zap
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
  x: number;
  y: number;
}

const mapProperties: MapProperty[] = [
  { id: 'prop-1', title: 'Skylit Penthouse', city: 'Nungambakkam', price: 35000, type: '2 BHK', x: 75, y: 70 },
  { id: 'prop-4', title: 'Heritage Garden Suite', city: 'Mylapore', price: 25000, type: '1 BHK', x: 170, y: 85 },
  { id: 'prop-2', title: 'Vastu Family Villa', city: 'Adyar', price: 65000, type: '3 BHK', x: 195, y: 175 },
  { id: 'prop-5', title: 'Waterfront Duplex', city: 'Adyar', price: 45000, type: '2 BHK', x: 220, y: 195 },
  { id: 'prop-3', title: 'Premium Smart Studio', city: 'OMR', price: 18000, type: 'Studio', x: 135, y: 245 },
  { id: 'prop-6', title: 'Eco-Friendly Villa', city: 'OMR', price: 32000, type: '2 BHK', x: 160, y: 275 },
];

const mapWorkplaces = [
  { 
    id: 'iitm', 
    name: 'IIT Madras Research Park', 
    zone: 'Adyar', 
    x: 180, 
    y: 185, 
    commuteTimes: {
      'Nungambakkam': { metro: 25, auto: 35, bike: 20 },
      'Adyar': { metro: 5, auto: 8, bike: 4 },
      'OMR': { metro: 20, auto: 15, bike: 12 },
      'Mylapore': { metro: 12, auto: 18, bike: 10 }
    }
  },
  { 
    id: 'tidel', 
    name: 'TIDEL Park IT Expressway', 
    zone: 'OMR', 
    x: 145, 
    y: 260, 
    commuteTimes: {
      'Nungambakkam': { metro: 35, auto: 45, bike: 30 },
      'Adyar': { metro: 18, auto: 15, bike: 10 },
      'OMR': { metro: 5, auto: 6, bike: 5 },
      'Mylapore': { metro: 22, auto: 25, bike: 18 }
    }
  },
  { 
    id: 'spencer', 
    name: 'Spencer Plaza Commercial', 
    zone: 'Nungambakkam', 
    x: 65, 
    y: 55, 
    commuteTimes: {
      'Nungambakkam': { metro: 4, auto: 6, bike: 5 },
      'Adyar': { metro: 25, auto: 30, bike: 20 },
      'OMR': { metro: 35, auto: 40, bike: 28 },
      'Mylapore': { metro: 12, auto: 15, bike: 10 }
    }
  },
  { 
    id: 'kapaleeshwarar', 
    name: 'Mylapore Temple Gateway', 
    zone: 'Mylapore', 
    x: 175, 
    y: 75, 
    commuteTimes: {
      'Nungambakkam': { metro: 15, auto: 20, bike: 12 },
      'Adyar': { metro: 12, auto: 15, bike: 10 },
      'OMR': { metro: 22, auto: 25, bike: 18 },
      'Mylapore': { metro: 4, auto: 5, bike: 3 }
    }
  }
];

const NeighborhoodMap: React.FC<NeighborhoodProps> = ({ 
  selectedZone, 
  onZoneSelect, 
  neighborhoodData, 
  transitMode,
  selectedWorkplace = 'iitm',
  onPropertySelect
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoveredProp, setHoveredProp] = useState<MapProperty | null>(null);
  const [hoveredWork, setHoveredWork] = useState<typeof mapWorkplaces[0] | null>(null);
  const [mapStyle, setMapStyle] = useState<'google-default' | 'google-terrain' | 'google-satellite'>('google-default');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [priceFilter, setPriceFilter] = useState<'all' | 'budget' | 'premium'>('all');

  const getZoneCenter = (id: string) => {
    if (id === 'Nungambakkam') return { x: 75, y: 65 };
    if (id === 'Mylapore') return { x: 170, y: 75 };
    if (id === 'Adyar') return { x: 195, y: 185 };
    return { x: 150, y: 260 };
  };

  const zones = [
    { 
      id: 'Nungambakkam', 
      name: 'Nungambakkam', 
      path: 'M 20,25 C 50,15 85,15 115,25 C 120,65 110,105 95,120 C 65,110 30,105 20,75 Z', 
      color: '#4285F4' 
    },
    { 
      id: 'Mylapore', 
      name: 'Mylapore', 
      path: 'M 115,25 C 145,15 185,15 230,25 C 235,70 230,120 215,140 C 175,145 135,140 115,120 Z', 
      color: '#EA4335' 
    },
    { 
      id: 'Adyar', 
      name: 'Adyar', 
      path: 'M 135,140 C 175,145 215,140 235,150 C 240,195 225,230 195,235 C 165,230 125,225 120,195 Z', 
      color: '#34A853' 
    },
    { 
      id: 'OMR', 
      name: 'OMR IT Corridor', 
      path: 'M 120,195 C 165,230 195,235 220,225 C 205,270 185,295 145,295 C 110,295 100,270 120,195 Z', 
      color: '#FBBC05' 
    },
  ];

  const currentZone = neighborhoodData[selectedZone] || neighborhoodData['Adyar'];
  const activeWorkplaceObj = mapWorkplaces.find(w => w.id === selectedWorkplace) || mapWorkplaces[0];

  const effectiveTargetZone = hoveredZone || (hoveredProp ? hoveredProp.city : null) || selectedZone;
  const targetPoint = hoveredProp 
    ? { x: hoveredProp.x, y: hoveredProp.y, label: hoveredProp.title }
    : { ...getZoneCenter(effectiveTargetZone), label: effectiveTargetZone };

  const startX = activeWorkplaceObj.x;
  const startY = activeWorkplaceObj.y;
  const endX = targetPoint.x;
  const endY = targetPoint.y;
  const cpX = (startX + endX) / 2 - (startY - endY) * 0.25;
  const cpY = (startY + endY) / 2 + (startX - endX) * 0.25;
  const dynamicCommutePath = `M ${startX},${startY} Q ${cpX},${cpY} ${endX},${endY}`;

  const currentCommuteTime = activeWorkplaceObj.commuteTimes[effectiveTargetZone]?.[transitMode] || 15;

  const filteredProps = mapProperties.filter(p => {
    if (priceFilter === 'budget') return p.price <= 30000;
    if (priceFilter === 'premium') return p.price > 30000;
    return true;
  });

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden text-left" id="google-maps-enhanced-wrapper">
      {/* 🧭 Google Maps Header Toolbar */}
      <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4285F4] flex items-center justify-center text-white shadow-md">
            <Navigation className="w-4 h-4 transform -rotate-45" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Interactive City Map</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Google Maps Vector Layer • Chennai</p>
          </div>
        </div>

        {/* Map Type Mode Toggles */}
        <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setMapStyle('google-default')}
            className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mapStyle === 'google-default' ? 'bg-[#4285F4] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setMapStyle('google-terrain')}
            className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mapStyle === 'google-terrain' ? 'bg-[#34A853] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Terrain
          </button>
          <button
            onClick={() => setMapStyle('google-satellite')}
            className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mapStyle === 'google-satellite' ? 'bg-[#EA4335] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* 🔍 Google Maps Quick Filter Chips Bar */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0">Filter Pins:</span>
          <button
            onClick={() => setPriceFilter('all')}
            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
              priceFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-100'
            }`}
          >
            All Listings ({mapProperties.length})
          </button>
          <button
            onClick={() => setPriceFilter('budget')}
            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
              priceFilter === 'budget' ? 'bg-[#34A853] text-white border-[#34A853]' : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-100'
            }`}
          >
            Under ₹30k
          </button>
          <button
            onClick={() => setPriceFilter('premium')}
            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
              priceFilter === 'premium' ? 'bg-[#EA4335] text-white border-[#EA4335]' : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-100'
            }`}
          >
            Premium (₹30k+)
          </button>
        </div>
        <span className="text-[9px] font-bold text-slate-500 shrink-0">
          Showing <strong className="text-slate-900">{selectedZone}</strong>
        </span>
      </div>

      {/* 🗺️ Main Google Maps Container Canvas */}
      <div className="relative aspect-square sm:aspect-[4/3] bg-[#E5E3DF] overflow-hidden select-none group">
        
        {/* Google Maps Real Vector Graphic Engine */}
        <motion.svg 
          viewBox="0 0 300 300" 
          className="w-full h-full"
          animate={{ scale: zoomLevel }}
          transition={{ duration: 0.3 }}
        >
          <defs>
            {/* Google Maps Road Grid Background Pattern */}
            <pattern id="gmapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill={mapStyle === 'google-satellite' ? '#1e293b' : mapStyle === 'google-terrain' ? '#f1f8e9' : '#f8fafc'} />
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={mapStyle === 'google-satellite' ? '#334155' : '#e2e8f0'} strokeWidth="1" />
            </pattern>
            
            {/* Coastal Water Gradient */}
            <linearGradient id="gmapWater" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={mapStyle === 'google-satellite' ? '#0f172a' : '#aecbfa'} stopOpacity="1" />
              <stop offset="100%" stopColor={mapStyle === 'google-satellite' ? '#1e293b' : '#c6dafc'} stopOpacity="1" />
            </linearGradient>

            {/* Drop Pin Shadow Filter */}
            <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* 1. Base Map Canvas */}
          <rect width="300" height="300" fill="url(#gmapGrid)" />

          {/* 2. Bay of Bengal Coastline */}
          <path 
            d="M 235,0 C 255,60 230,120 255,200 C 245,250 252,300 252,300 L 300,300 L 300,0 Z" 
            fill="url(#gmapWater)" 
          />
          <text x="272" y="80" className="font-sans text-[6.5px] fill-[#1a73e8] font-black uppercase tracking-widest" transform="rotate(90 272 80)">
            Bay of Bengal
          </text>

          {/* 3. Major Arterial Expressways (Google Yellow & White Highways) */}
          {/* OMR IT Expressway */}
          <path d="M 120,195 Q 165,230 195,235 T 145,295" fill="none" stroke="#fde047" strokeWidth="6" strokeLinecap="round" />
          <path d="M 120,195 Q 165,230 195,235 T 145,295" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          <text x="175" y="270" className="font-sans text-[4.5px] fill-slate-700 font-extrabold uppercase tracking-wider" transform="rotate(35 175 270)">
            OMR IT Expressway
          </text>

          {/* Anna Salai / Mount Road */}
          <path d="M 10,20 Q 60,60 115,25" fill="none" stroke="#fde047" strokeWidth="5" strokeLinecap="round" />
          <path d="M 10,20 Q 60,60 115,25" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

          {/* ECR Coastal Highway */}
          <path d="M 230,25 C 235,70 230,120 215,140 T 220,295" fill="none" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />

          {/* 4. Rivers (Adyar River) */}
          <path d="M 0,165 Q 80,160 140,175 T 247,175" fill="none" stroke="#aecbfa" strokeWidth="7" strokeLinecap="round" />
          <path d="M 0,165 Q 80,160 140,175 T 247,175" fill="none" stroke="#c6dafc" strokeWidth="3" strokeLinecap="round" />

          {/* 5. Neighborhood Ward Polygons */}
          {zones.map((zone) => {
            const isActive = selectedZone === zone.id;
            const isHovered = hoveredZone === zone.id;
            const center = getZoneCenter(zone.id);
            const directUnits = neighborhoodData[zone.id]?.directCount || 2;

            return (
              <g 
                key={zone.id}
                className="cursor-pointer"
                onClick={() => onZoneSelect(zone.id)}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
              >
                <motion.path
                  d={zone.path}
                  fill={isActive ? zone.color : mapStyle === 'google-satellite' ? '#334155' : '#ffffff'}
                  fillOpacity={isActive ? 0.35 : isHovered ? 0.25 : 0.1}
                  stroke={isActive ? zone.color : isHovered ? '#1a73e8' : '#cbd5e1'}
                  strokeWidth={isActive ? 2.5 : isHovered ? 2 : 1}
                  strokeDasharray={isActive ? 'none' : '4 2'}
                  whileHover={{ scale: 1.005 }}
                  transition={{ duration: 0.2 }}
                />

                {/* Google Maps Style Locality Name Marker */}
                <g transform={`translate(${center.x}, ${center.y - 8})`}>
                  <rect
                    x="-34"
                    y="-9"
                    width="68"
                    height="18"
                    rx="9"
                    fill={isActive ? '#1a73e8' : isHovered ? '#1e293b' : '#ffffff'}
                    filter="url(#pinShadow)"
                    stroke={isActive ? '#ffffff' : '#cbd5e1'}
                    strokeWidth="1"
                  />
                  <text 
                    x="0" 
                    y="-1" 
                    textAnchor="middle" 
                    fill={isActive || isHovered ? '#ffffff' : '#202124'}
                    className="font-sans text-[6.5px] font-black uppercase tracking-wider select-none"
                  >
                    {zone.name.split(' ')[0]}
                  </text>
                  <text 
                    x="0" 
                    y="5.5" 
                    textAnchor="middle" 
                    fill={isActive || isHovered ? '#e8f0fe' : '#5f6368'}
                    className="font-sans text-[5px] font-bold select-none"
                  >
                    {directUnits} Available
                  </text>
                </g>
              </g>
            );
          })}

          {/* 6. Google Maps Directions Curved Route Line */}
          <g className="pointer-events-none">
            <path 
              d={dynamicCommutePath} 
              fill="none" 
              stroke="#1a73e8" 
              strokeWidth="4" 
              strokeLinecap="round"
              opacity="0.9"
              filter="url(#pinShadow)"
            />
            <path 
              d={dynamicCommutePath} 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="1.5" 
              strokeDasharray="4 6"
              style={{ animation: 'gmapDash 1.5s linear infinite' }}
            />
            {/* Animated Direction Particle Dot */}
            <circle r="4" fill="#ea4335" stroke="#ffffff" strokeWidth="1.5">
              <animateMotion dur="2.5s" repeatCount="indefinite" path={dynamicCommutePath} />
            </circle>

            {/* Commute Time Pill Badge on Route */}
            <g transform={`translate(${(startX + endX) / 2}, ${(startY + endY) / 2})`}>
              <rect x="-26" y="-9" width="52" height="18" rx="9" fill="#1a73e8" filter="url(#pinShadow)" stroke="#ffffff" strokeWidth="1" />
              <text x="0" y="2" textAnchor="middle" fill="#ffffff" className="font-sans text-[6.5px] font-black uppercase tracking-wider">
                🚗 {currentCommuteTime} MINS
              </text>
            </g>
          </g>

          {/* 7. Workplace Map Pins (Office Icons) */}
          {mapWorkplaces.map((w) => {
            const isActive = selectedWorkplace === w.id;
            return (
              <g 
                key={`work-${w.id}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredWork(w)}
                onMouseLeave={() => setHoveredWork(null)}
              >
                <circle cx={w.x} cy={w.y} r={isActive ? 8 : 6} fill="#202124" stroke="#ffffff" strokeWidth="1.5" filter="url(#pinShadow)" />
                <circle cx={w.x} cy={w.y} r="3" fill="#fbbc04" />
              </g>
            );
          })}

          {/* 8. Google Maps Style Price Tag Drop Pins */}
          {filteredProps.map((prop) => {
            const isHovered = hoveredProp?.id === prop.id;
            const isSelected = selectedZone === prop.city;

            return (
              <g 
                key={prop.id}
                className="cursor-pointer"
                onClick={() => {
                  onZoneSelect(prop.city);
                  if (onPropertySelect) onPropertySelect(prop.id);
                }}
                onMouseEnter={() => setHoveredProp(prop)}
                onMouseLeave={() => setHoveredProp(null)}
              >
                <motion.g
                  animate={{
                    scale: isHovered ? 1.2 : 1.0,
                    y: isHovered ? -4 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  filter="url(#pinShadow)"
                >
                  <rect 
                    x={prop.x - 18} 
                    y={prop.y - 10} 
                    width="36" 
                    height="16" 
                    rx="8" 
                    fill={isHovered ? '#ea4335' : isSelected ? '#1a73e8' : '#202124'} 
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text 
                    x={prop.x} 
                    y={prop.y + 1} 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    className="font-sans text-[6.5px] font-black tracking-tight"
                  >
                    ₹{(prop.price / 1000).toFixed(0)}k/mo
                  </text>
                </motion.g>
              </g>
            );
          })}
        </motion.svg>

        {/* Dash Animation */}
        <style>{`
          @keyframes gmapDash {
            to { stroke-dashoffset: -20; }
          }
        `}</style>

        {/* 🎛️ Google Maps Controls Overlay (Top Right & Bottom Right) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button 
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 1.6))}
            className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-800 rounded-lg shadow-md flex items-center justify-center transition-all border border-slate-200 cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.9))}
            className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-800 rounded-lg shadow-md flex items-center justify-center transition-all border border-slate-200 cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              setZoomLevel(1.0);
              onZoneSelect('Adyar');
            }}
            className="w-8 h-8 bg-white hover:bg-[#1a73e8] text-slate-800 hover:text-white rounded-lg shadow-md flex items-center justify-center transition-all border border-slate-200 cursor-pointer"
            title="Recenter Map"
          >
            <Target className="w-4 h-4" />
          </button>
        </div>

        {/* 📍 Google Maps High-Contrast Bottom Card */}
        <div className="absolute inset-x-3 bottom-3 z-10">
          <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl text-left">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">Google Maps GIS Active</span>
                </div>
                <h3 className="text-base font-black text-white truncate leading-tight">
                  {hoveredProp ? hoveredProp.title : (hoveredZone || selectedZone)}
                </h3>
                <p className="text-[11px] text-slate-300 font-medium truncate">
                  {hoveredProp 
                    ? `₹${hoveredProp.price.toLocaleString()}/mo • ${hoveredProp.type} in ${hoveredProp.city}` 
                    : `Average Rent: ₹${currentZone.avgRent.toLocaleString()}/mo • ${currentZone.directCount} direct units available`
                  }
                </p>
              </div>

              {/* High-Contrast Action Button */}
              <button
                onClick={() => onZoneSelect(hoveredZone || (hoveredProp ? hoveredProp.city : selectedZone))}
                className="px-4 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all shrink-0 flex items-center gap-2 cursor-pointer active:scale-95 border border-white/20"
              >
                <Compass className="w-3.5 h-3.5 text-white" />
                Center View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Bottom Quick Stats Bar */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-250 shadow-sm">
          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Avg Rent ({selectedZone})</p>
          <p className="text-sm font-black text-slate-900 mt-0.5">₹{currentZone.avgRent.toLocaleString()}/mo</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-250 shadow-sm">
          <p className="text-[9px] font-extrabold text-[#1a73e8] uppercase tracking-wider">Direct Listings</p>
          <p className="text-sm font-black text-[#1a73e8] mt-0.5">{currentZone.directCount} Active Units</p>
        </div>
        <div className="col-span-2 sm:col-span-1 p-3 bg-slate-900 text-white rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Transit Latency</p>
            <p className="text-xs font-black text-white mt-0.5">{currentCommuteTime} mins via {transitMode}</p>
          </div>
          <Zap className="w-4 h-4 text-[#fbbc04]" />
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodMap;
