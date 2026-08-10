import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Info, Sparkles, TrendingUp, Compass, Briefcase, Navigation, Landmark, Zap, Bus, Bike } from 'lucide-react';

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
  x: number;
  y: number;
}

const mapProperties: MapProperty[] = [
  { id: 'prop-1', title: 'Skylit Penthouse', city: 'Nungambakkam', price: 35000, x: 50, y: 75 },
  { id: 'prop-4', title: 'Heritage Garden Suite', city: 'Mylapore', price: 25000, x: 145, y: 95 },
  { id: 'prop-2', title: 'Vastu Family Villa', city: 'Adyar', price: 65000, x: 195, y: 170 },
  { id: 'prop-5', title: 'Waterfront Duplex', city: 'Adyar', price: 45000, x: 215, y: 195 },
  { id: 'prop-3', title: 'Premium Smart Studio', city: 'OMR', price: 18000, x: 130, y: 240 },
  { id: 'prop-6', title: 'Eco-Friendly Modern Villa', city: 'OMR', price: 32000, x: 155, y: 275 },
];

const mapWorkplaces = [
  { 
    id: 'iitm', 
    name: 'IIT Madras Research Park', 
    zone: 'Adyar', 
    x: 175, 
    y: 190, 
    icon: 'iitm',
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
    x: 140, 
    y: 260, 
    icon: 'tidel',
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
    x: 60, 
    y: 50, 
    icon: 'spencer',
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
    x: 170, 
    y: 80, 
    icon: 'temple',
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
  const [showRadius, setShowRadius] = useState(true);

  const radiusSettings = {
    auto: { r: 55, color: 'rgba(181, 101, 43, 0.08)', stroke: '#B5652B', label: 'Car/Auto (15-20 Min Reach)' },
    metro: { r: 85, color: 'rgba(201, 162, 39, 0.08)', stroke: '#C9A227', label: 'Metro Rapid Transit' },
    bike: { r: 35, color: 'rgba(122, 140, 126, 0.08)', stroke: '#7A8C7E', label: 'Bicycle Commute' },
  };

  const getZoneCenter = (id: string) => {
    if (id === 'Nungambakkam') return { x: 60, y: 65 };
    if (id === 'Mylapore') return { x: 160, y: 75 };
    if (id === 'Adyar') return { x: 175, y: 180 };
    return { x: 145, y: 255 };
  };

  // Harmonized zones to fit 300x300 viewBox seamlessly
  const zones = [
    { 
      id: 'Nungambakkam', 
      name: 'Nungambakkam', 
      path: 'M 15,30 C 45,15 75,15 105,30 C 110,65 100,100 85,115 C 55,105 25,100 15,70 Z', 
      color: '#B5652B' 
    },
    { 
      id: 'Mylapore', 
      name: 'Mylapore', 
      path: 'M 105,30 C 135,15 175,15 220,30 C 225,75 220,115 205,135 C 165,140 125,135 105,115 Z', 
      color: '#C9A227' 
    },
    { 
      id: 'Adyar', 
      name: 'Adyar', 
      path: 'M 125,135 C 165,140 205,135 225,145 C 230,190 215,220 185,225 C 155,220 115,215 110,185 Z', 
      color: '#7A8C7E' 
    },
    { 
      id: 'OMR', 
      name: 'Old Mahabalipuram Rd', 
      path: 'M 110,185 C 155,220 185,225 210,215 C 195,260 175,295 140,295 C 105,295 95,260 110,185 Z', 
      color: '#24382F' 
    },
  ];

  const currentZone = neighborhoodData[selectedZone] || neighborhoodData['Adyar'];
  const activeWorkplaceObj = mapWorkplaces.find(w => w.id === selectedWorkplace) || mapWorkplaces[0];

  // Dynamic targeting based on hover states (Zone, Property Pin, or Workplace)
  const effectiveWorkplace = hoveredWork || activeWorkplaceObj;
  const effectiveTargetZone = hoveredZone || (hoveredProp ? hoveredProp.city : null) || selectedZone;
  
  // Exact target coordinates: property pin if hovering property, otherwise neighborhood center
  const targetPoint = hoveredProp 
    ? { x: hoveredProp.x, y: hoveredProp.y, label: hoveredProp.title }
    : { ...getZoneCenter(effectiveTargetZone), label: effectiveTargetZone };

  // Calculate smooth curved path from active workspace to target location
  const startX = effectiveWorkplace.x;
  const startY = effectiveWorkplace.y;
  const endX = targetPoint.x;
  const endY = targetPoint.y;
  const cpX = (startX + endX) / 2 - (startY - endY) * 0.2;
  const cpY = (startY + endY) / 2 + (startX - endX) * 0.2;

  const dynamicCommutePath = `M ${startX},${startY} Q ${cpX},${cpY} ${endX},${endY}`;
  const isHoveredInteraction = Boolean(hoveredZone || hoveredProp || hoveredWork);
  const currentCommuteTime = effectiveWorkplace.commuteTimes[effectiveTargetZone]?.[transitMode] || 15;

  return (
    <div className="space-y-6" id="neighborhood-explorer-root">
      <div className="flex items-center justify-between">
        <div className="space-y-1 text-left">
          <h4 className="text-sm font-black uppercase tracking-tight text-[#1A1D1F]">Local Area Pulse</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Chennai Ward Intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowRadius(!showRadius)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border cursor-pointer ${
              showRadius 
                ? 'bg-terracotta border-terracotta text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {showRadius ? 'Radius Active' : 'Show Reach'}
          </button>
          <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center text-sage border border-sage/20">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
        </div>
      </div>

      {/* SVG Stylized Map Container */}
      <div className="relative aspect-square bg-slate-50 rounded-[2rem] border border-slate-200/80 overflow-hidden group select-none shadow-inner">
        <svg viewBox="0 0 300 300" className="w-full h-full">
          <defs>
            {/* GIS Grid Pattern */}
            <pattern id="mapGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              <circle cx="0" cy="0" r="1" fill="#e2e8f0" />
            </pattern>
            {/* Water Linear Gradient */}
            <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.6" />
            </linearGradient>
            {/* Land Region Gradient */}
            <radialGradient id="regionHighlight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.02" />
            </radialGradient>
          </defs>

          {/* 1. Base GIS Grid Layer */}
          <rect width="300" height="300" fill="url(#mapGrid)" />

          {/* 2. Map Coordinates Indicators */}
          <g opacity="0.35" className="font-mono text-[5px] fill-slate-400 font-bold">
            <line x1="0" y1="150" x2="300" y2="150" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="150" y1="0" x2="150" y2="300" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3 3" />
            <text x="5" y="146">13°04&apos; N</text>
            <text x="154" y="295">80°16&apos; E</text>
          </g>

          {/* 3. Ocean / Bay of Bengal Coastline (East side) */}
          <path 
            d="M 235,0 C 255,60 230,120 255,200 C 245,250 252,300 252,300 L 300,300 L 300,0 Z" 
            fill="url(#oceanGradient)" 
          />
          {/* Sandy Beach Line */}
          <path 
            d="M 235,0 C 255,60 230,120 255,200 C 245,250 252,300 252,300" 
            fill="none" 
            stroke="#fef08a" 
            strokeWidth="3" 
            strokeLinecap="round"
            opacity="0.85"
          />
          <text x="270" y="80" className="font-sans text-[6px] fill-sky-700/60 font-black uppercase tracking-widest writing-mode-vertical" transform="rotate(90 270 80)">
            Bay of Bengal
          </text>

          {/* 4. Natural Waterways (Adyar & Cooum Rivers) */}
          {/* Adyar River cutting below Mylapore / above Adyar */}
          <path 
            d="M 0,165 Q 80,160 140,175 T 247,175" 
            fill="none" 
            stroke="#bae6fd" 
            strokeWidth="6.5" 
            strokeLinecap="round" 
            opacity="0.9"
          />
          <path 
            d="M 0,165 Q 80,160 140,175 T 247,175" 
            fill="none" 
            stroke="#e0f2fe" 
            strokeWidth="2" 
            strokeLinecap="round" 
          />
          <text x="70" y="171" className="font-sans text-[5px] fill-sky-600/60 font-extrabold uppercase tracking-widest">
            Adyar River
          </text>

          {/* Cooum River in the north */}
          <path 
            d="M 0,55 Q 70,45 120,55 T 243,50" 
            fill="none" 
            stroke="#bae6fd" 
            strokeWidth="4" 
            strokeLinecap="round" 
            opacity="0.7"
          />

          {/* 5. Chennai Metro Rail Transit Track Line (Glowing Green Line) */}
          <path 
            d="M 20,15 Q 60,65 110,90 T 175,170 T 140,250" 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="2.5" 
            strokeDasharray="5 3.5" 
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* 6. Neighborhood Ward Polygons & Interactive Center Badges */}
          {zones.map((zone) => {
            const isActive = selectedZone === zone.id;
            const isHovered = hoveredZone === zone.id;
            const center = getZoneCenter(zone.id);
            const directUnits = neighborhoodData[zone.id]?.directCount || 2;
            
            return (
              <g 
                key={zone.id}
                className="cursor-pointer group"
                onClick={() => onZoneSelect(zone.id)}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
              >
                {/* Zone Polygon Path */}
                <motion.path
                  d={zone.path}
                  fill={isActive ? zone.color : '#cbd5e1'}
                  fillOpacity={isActive ? 0.28 : isHovered ? 0.2 : 0.08}
                  stroke={isActive ? zone.color : isHovered ? '#B5652B' : '#94a3b8'}
                  strokeWidth={isActive ? 2.5 : isHovered ? 2 : 0.75}
                  strokeDasharray={isActive ? 'none' : '3 1.5'}
                  initial={false}
                  animate={{
                    fillOpacity: isActive ? 0.32 : isHovered ? 0.22 : 0.08,
                    strokeWidth: isActive || isHovered ? 2.5 : 0.75,
                  }}
                  whileHover={{ scale: 1.008 }}
                  transition={{ duration: 0.2 }}
                />
                
                {/* Active Zone Pulsing Ground Ring */}
                {isActive && (
                  <circle
                    cx={center.x}
                    cy={center.y - 12}
                    r="16"
                    fill={zone.color}
                    fillOpacity="0.15"
                    className="animate-ping pointer-events-none"
                    style={{ animationDuration: '2.5s' }}
                  />
                )}

                {/* SVG Center Interactive Badge Pill */}
                <g transform={`translate(${center.x}, ${center.y - 14})`}>
                  <rect
                    x="-32"
                    y="-10"
                    width="64"
                    height="18"
                    rx="5"
                    fill={isActive ? '#12141C' : isHovered ? '#B5652B' : '#ffffff'}
                    fillOpacity={isActive ? '0.92' : '0.9'}
                    stroke={isActive ? zone.color : isHovered ? '#B5652B' : '#cbd5e1'}
                    strokeWidth={isActive || isHovered ? '1.5' : '0.75'}
                    className="shadow-sm transition-all duration-200"
                  />
                  <text 
                    x="0" 
                    y="-1" 
                    textAnchor="middle" 
                    fill={isActive || isHovered ? '#ffffff' : '#334155'}
                    className="font-sans text-[6.5px] font-black uppercase tracking-wider select-none pointer-events-none"
                  >
                    {zone.name}
                  </text>
                  <text 
                    x="0" 
                    y="5.5" 
                    textAnchor="middle" 
                    fill={isActive || isHovered ? '#cbd5e1' : '#64748b'}
                    className="font-sans text-[5px] font-bold select-none pointer-events-none"
                  >
                    {directUnits} units • Click to view
                  </text>
                </g>
              </g>
            );
          })}

          {/* 7. Commute Radius Overlay */}
          <AnimatePresence>
            {showRadius && (
              <motion.circle
                key={`radius-${effectiveTargetZone}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                cx={getZoneCenter(effectiveTargetZone).x}
                cy={getZoneCenter(effectiveTargetZone).y}
                r={radiusSettings[transitMode].r}
                fill={radiusSettings[transitMode].color}
                stroke={radiusSettings[transitMode].stroke}
                strokeWidth="1.25"
                strokeDasharray="4 3"
                className="pointer-events-none transition-all duration-300"
              />
            )}
          </AnimatePresence>

          {/* 8. Smooth Animated Commute Path Line (Workspace to Neighborhood/Property) */}
          <g className="pointer-events-none">
            {/* Background Faint Reference Trace */}
            <path 
              d={dynamicCommutePath} 
              fill="none" 
              stroke="#94a3b8" 
              strokeWidth="1.5" 
              strokeDasharray="3 3" 
              opacity="0.35"
            />

            {/* Smooth Animated Path Draw Line */}
            <motion.path 
              key={`path-${startX}-${startY}-${endX}-${endY}`}
              d={dynamicCommutePath} 
              fill="none" 
              stroke={isHoveredInteraction ? '#B5652B' : radiusSettings[transitMode].stroke}
              strokeWidth={isHoveredInteraction ? "3" : "2"} 
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Flowing Dash Particles Overlay */}
            <path 
              d={dynamicCommutePath} 
              fill="none" 
              stroke="#ffffff"
              strokeWidth="1.2" 
              strokeDasharray="5 10" 
              opacity="0.8"
              style={{
                strokeDashoffset: 100,
                animation: 'dashCommute 2s linear infinite'
              }}
            />

            {/* Animated Moving Commuter Dot along path */}
            <circle r={isHoveredInteraction ? "4.5" : "3.5"} fill={isHoveredInteraction ? "#B5652B" : radiusSettings[transitMode].stroke} stroke="#ffffff" strokeWidth="1.5">
              <animateMotion dur="2.2s" repeatCount="indefinite" path={dynamicCommutePath} />
            </circle>

            {/* Target Location Pulsing Radar Ring */}
            <circle 
              cx={endX} 
              cy={endY} 
              r="9" 
              fill="none"
              stroke={isHoveredInteraction ? '#B5652B' : radiusSettings[transitMode].stroke} 
              strokeWidth="1.5"
              className="animate-ping"
              style={{ animationDuration: '2s' }}
            />
            <circle 
              cx={endX} 
              cy={endY} 
              r="3.5" 
              fill={isHoveredInteraction ? '#B5652B' : radiusSettings[transitMode].stroke} 
              stroke="#ffffff"
              strokeWidth="1"
            />

            {/* Floating Commute Time Badge along Path Midpoint */}
            <motion.g
              key={`badge-${startX}-${startY}-${endX}-${endY}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <rect 
                x={((startX + endX) / 2) - 24} 
                y={((startY + endY) / 2) - 8} 
                width="48" 
                height="14" 
                rx="4" 
                fill="#12141C" 
                fillOpacity="0.95"
                stroke={isHoveredInteraction ? '#B5652B' : radiusSettings[transitMode].stroke}
                strokeWidth="1"
              />
              <text 
                x={(startX + endX) / 2} 
                y={((startY + endY) / 2) + 2} 
                textAnchor="middle" 
                fill="#ffffff" 
                className="font-sans text-[6px] font-black uppercase tracking-wider"
              >
                ⚡ {currentCommuteTime} MINS
              </text>
            </motion.g>
          </g>

          {/* 9. Interactive Workplace Nodes */}
          {mapWorkplaces.map((w) => {
            const isActive = selectedWorkplace === w.id;
            const isHovered = hoveredWork?.id === w.id;
            return (
              <g 
                key={`work-${w.id}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredWork(w)}
                onMouseLeave={() => setHoveredWork(null)}
              >
                {/* Outer Ring */}
                <circle 
                  cx={w.x} 
                  cy={w.y} 
                  r={isHovered || isActive ? 9 : 6} 
                  fill="#1e293b" 
                  fillOpacity="0.1" 
                  stroke="#1e293b"
                  strokeWidth="1"
                  className="transition-all duration-300"
                />
                {/* Inner Core */}
                <circle 
                  cx={w.x} 
                  cy={w.y} 
                  r="4" 
                  fill="#B5652B" 
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
                {/* Micro Label */}
                {(isActive || isHovered) && (
                  <g className="pointer-events-none">
                    <rect 
                      x={w.x - 45} 
                      y={w.y - 20} 
                      width="90" 
                      height="12" 
                      rx="3" 
                      fill="#1e293b" 
                      opacity="0.9" 
                    />
                    <text 
                      x={w.x} 
                      y={w.y - 12} 
                      textAnchor="middle" 
                      fill="#ffffff" 
                      className="font-sans text-[5.5px] font-bold uppercase tracking-wider"
                    >
                      {w.name.split(' ')[0]} {w.name.split(' ')[1] || 'Park'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 10. Interactive Property Price-Tag Pins */}
          {mapProperties.map((prop) => {
            const isHovered = hoveredProp?.id === prop.id;
            const isZoneSelected = selectedZone === prop.city;
            
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
                {/* Pulsing Backing */}
                {isZoneSelected && (
                  <circle 
                    cx={prop.x} 
                    cy={prop.y} 
                    r={isHovered ? 14 : 9} 
                    fill="#B5652B" 
                    fillOpacity="0.15" 
                    className="animate-ping"
                    style={{ animationDuration: '3s' }}
                  />
                )}
                {/* Pin Container */}
                <motion.g
                  animate={{
                    scale: isHovered ? 1.25 : isZoneSelected ? 1.05 : 0.9,
                    y: isHovered ? -3 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <rect 
                    x={prop.x - 14} 
                    y={prop.y - 7} 
                    width="28" 
                    height="12" 
                    rx="4" 
                    fill={isHovered ? '#111827' : isZoneSelected ? '#B5652B' : '#64748b'} 
                    stroke="#ffffff"
                    strokeWidth="1"
                    className="shadow-sm"
                  />
                  <text 
                    x={prop.x} 
                    y={prop.y + 1.5} 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    className="font-sans text-[6px] font-black tracking-tight"
                  >
                    ₹{(prop.price / 1000).toFixed(0)}k
                  </text>
                </motion.g>
              </g>
            );
          })}
        </svg>

        {/* CSS Animation injection for route dashes */}
        <style>{`
          @keyframes dashCommute {
            to {
              stroke-dashoffset: -100;
            }
          }
          .animate-spin-slow {
            animation: spin 20s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* 11. Overlay Live HUD Tooltip (Zone, Property, or Workplace context) */}
        <div className="absolute inset-x-3 bottom-3 z-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#12141C]/95 backdrop-blur-md p-3.5 rounded-lg border border-white/10 shadow-2xl text-left"
          >
            <AnimatePresence mode="wait">
              {hoveredProp ? (
                <motion.div 
                  key="prop-tooltip"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-terracotta uppercase tracking-widest">direct listing price-point</span>
                    <span className="text-[9px] font-black text-white">₹{hoveredProp.price.toLocaleString()}/mo</span>
                  </div>
                  <h5 className="text-xs font-bold text-white truncate">{hoveredProp.title}</h5>
                  <p className="text-[9px] text-slate-400">Click to view high-resolution specs, owner details & schedule tours.</p>
                </motion.div>
              ) : hoveredWork ? (
                <motion.div 
                  key="work-tooltip"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-terracotta uppercase tracking-widest">commute optimization hub</span>
                    <span className="text-[8px] font-black text-slate-300 uppercase bg-white/10 px-1.5 py-0.5 rounded">{hoveredWork.zone} Zone</span>
                  </div>
                  <h5 className="text-xs font-bold text-white truncate">{hoveredWork.name}</h5>
                  <p className="text-[9px] text-slate-400">Route indicators measure direct road latency to various wards.</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="zone-tooltip"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Ward Selection</span>
                    <span className="text-[9px] font-extrabold text-brass flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      {transitMode.toUpperCase()} RADAR
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-white">{hoveredZone || selectedZone}</h5>
                    <span className="text-[9px] font-bold text-slate-300">₹{currentZone.avgRent.toLocaleString()}/mo avg</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-snug line-clamp-1">
                    {neighborhoodData[hoveredZone || selectedZone]?.desc || 'Chennai premium residential zone.'}
                  </p>
                  <button
                    onClick={() => onZoneSelect(hoveredZone || selectedZone)}
                    className="mt-1.5 w-full py-1 px-2.5 bg-terracotta/20 hover:bg-terracotta border border-terracotta/40 text-terracotta hover:text-white rounded text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Compass className="w-2.5 h-2.5" />
                    Center List View on {hoveredZone || selectedZone} Properties
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-2 gap-4 text-left">
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1 transition-all hover:bg-slate-100">
          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Avg Rent</p>
          <p className="text-sm font-black text-[#1A1D1F]">₹{currentZone.avgRent.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-terracotta/5 rounded-lg border border-terracotta/10 space-y-1 transition-all hover:bg-terracotta/10">
          <p className="text-[9px] font-extrabold text-terracotta uppercase tracking-widest">Direct Links</p>
          <p className="text-sm font-black text-terracotta">{currentZone.directCount} Active</p>
        </div>
      </div>

      {/* Dynamic Transit Legend Bar */}
      <div className="p-4 bg-[#12141C] rounded-lg text-white flex items-center justify-between border border-white/5 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
            {transitMode === 'auto' ? (
              <Zap className="w-4 h-4 text-amber-400" />
            ) : transitMode === 'metro' ? (
              <Bus className="w-4 h-4 text-terracotta" />
            ) : (
              <Bike className="w-4 h-4 text-sage" />
            )}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-tight text-white">{activeWorkplaceObj.name.split(' ')[0]} Commute</p>
            <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest leading-none mt-1">
              Active: {radiusSettings[transitMode].label}
            </p>
          </div>
        </div>
        <div className="px-2.5 py-1 bg-white/10 rounded-lg text-[9px] font-black tracking-widest text-terracotta border border-white/5 uppercase">
          {activeWorkplaceObj.commuteTimes[selectedZone]?.[transitMode] || 15} MINS
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodMap;
