import React, { useState } from 'react';
import { Property, DirectInquiry } from '../types';
import { 
  X, BedDouble, Bath, Square, MapPin, DollarSign, 
  Calendar, Clock, CheckCircle, Shield, Phone, Mail, 
  MessageSquare, UserCheck, Percent, Info, ArrowRight, Sparkles,
  Compass, Briefcase, Car, Train, Bike,
  Users, Plus, Minus, Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onStartChat: (propertyId: string) => void;
  onBookVisit: (inquiry: DirectInquiry) => void;
  allProperties?: Property[];
  onSelectProperty?: (id: string) => void;
  selectedWorkplace?: string;
  commuteTransitMode?: 'metro' | 'auto' | 'bike';
}

export default function PropertyDetail({ 
  property, 
  onClose, 
  onStartChat, 
  onBookVisit, 
  allProperties = [], 
  onSelectProperty,
  selectedWorkplace = 'iitm',
  commuteTransitMode = 'auto'
}: PropertyDetailProps) {
  const [activePhoto, setActivePhoto] = useState<number>(0);
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantEmail, setTenantEmail] = useState<string>('');
  const [tenantPhone, setTenantPhone] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>('');
  const [visitTime, setVisitTime] = useState<string>('');
  const [introduction, setIntroduction] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [roommates, setRoommates] = useState<number>(2);

  const similarProperties = allProperties
    .filter(p => p.id !== property.id)
    .filter(p => p.city === property.city || p.type === property.type)
    .slice(0, 3);

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !visitDate || !visitTime) return;

    const inquiry: DirectInquiry = {
      id: `inq-${Date.now()}`,
      propertyId: property.id,
      tenantName,
      tenantEmail: tenantEmail || 'anonymous@nestdirect.com',
      tenantPhone: tenantPhone || '+91 99405 11223',
      visitDate,
      visitTime,
      message: introduction || `Hi ${property.ownerName}, I would love to schedule a direct walkthrough of your property!`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ownerEmail: property.ownerEmail
    };

    onBookVisit(inquiry);
    setIsScheduled(true);
    setTimeout(() => {
      setIsScheduled(false);
    }, 4000);
  };

  const upcomingDates = [
    { label: 'Tomorrow', value: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
    { label: 'In 2 days', value: new Date(Date.now() + 172800000).toISOString().split('T')[0] },
    { label: 'Saturday', value: new Date(Date.now() + 345600000).toISOString().split('T')[0] },
    { label: 'Sunday', value: new Date(Date.now() + 432000000).toISOString().split('T')[0] }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex justify-end" 
      id="detail-overlay"
      onClick={onClose}
    >
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white w-full max-w-2xl h-full flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.1)] relative overflow-hidden" 
        id="detail-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header toolbar */}
        <div className="absolute top-6 left-6 z-50">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-sm bg-white/95 backdrop-blur-md text-ink flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95 border border-stone-200 cursor-pointer"
            id="close-detail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable listing detail Container */}
        <div className="flex-1 overflow-y-auto scrollbar-none" id="detail-scroller">
          {/* Gallery Carousel */}
          <div className="h-96 bg-stone-100 relative group overflow-hidden" id="detail-carousel">
            <AnimatePresence mode="wait">
              <motion.img 
                key={activePhoto}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                referrerPolicy="no-referrer"
                src={property.photos[activePhoto]} 
                alt={property.title} 
                className="w-full h-full object-cover" 
              />
            </AnimatePresence>
            
            {/* Gallery Indicator pills */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-ink/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
              {property.photos.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setActivePhoto(i)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${activePhoto === i ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
            
            {/* Savings Badge */}
            <div className="absolute top-6 right-6 bg-terracotta text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-sm shadow-lg flex items-center gap-1.5 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-parchment" strokeWidth={1.5} />
              Save ₹{property.brokerSavings.toLocaleString('en-IN')} Broker Fee
            </div>
          </div>

          {/* Main content */}
          <div className="p-8 space-y-8 pb-32">
            {/* Title & Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-sage/15 text-sage border border-sage/20 rounded-sm text-[8px] font-black uppercase tracking-widest">
                  Direct Owner Verified
                </span>
                <span className="px-2.5 py-0.5 bg-stone-100 text-ink border border-stone-200 rounded-sm text-[8px] font-black uppercase tracking-widest">
                  {property.type}
                </span>
              </div>
              <h1 className="text-2xl font-semibold font-display text-ink tracking-tight leading-tight">
                {property.title}
              </h1>
              <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
                <div className="w-6 h-6 rounded-sm bg-stone-100 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-terracotta" strokeWidth={1.5} />
                </div>
                <span>{property.address}, {property.city}</span>
              </div>
            </div>

            {/* Price Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-parchment/60 rounded-md p-5 border border-stone-200 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Monthly Rent</span>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-ink font-mono">₹{property.price.toLocaleString('en-IN')}</span>
                  <span className="text-xs font-medium text-stone-500 ml-1">/mo</span>
                </div>
              </div>
              <div className="bg-parchment/60 rounded-md p-5 border border-stone-200 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Security Deposit</span>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-ink font-mono">₹{property.securityDeposit.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Roommate Expense Splitter */}
            <div className="bg-white rounded-md p-6 border border-stone-200 shadow-card space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-parchment text-terracotta rounded-sm flex items-center justify-center border border-stone-250">
                    <Calculator className="w-4.5 h-4.5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-ink uppercase tracking-wider">Roommate Cost Splitter</h4>
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Calculate per-person cost share</p>
                  </div>
                </div>
                
                {/* Stepper controls */}
                <div className="flex items-center gap-3 bg-parchment border border-stone-250 p-1 rounded-sm shadow-sm self-end sm:self-auto">
                  <button 
                    type="button"
                    onClick={() => setRoommates(prev => Math.max(1, prev - 1))}
                    disabled={roommates <= 1}
                    className="w-7 h-7 rounded-sm bg-white hover:bg-stone-50 text-ink disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer border border-stone-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <div className="w-10 text-center">
                    <span className="text-xs font-bold text-ink font-mono">{roommates}</span>
                    <span className="text-[8px] block text-stone-400 font-extrabold uppercase -mt-0.5">people</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setRoommates(prev => Math.min(12, prev + 1))}
                    disabled={roommates >= 12}
                    className="w-7 h-7 rounded-sm bg-terracotta hover:bg-terracotta/90 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {roommates > 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-4 bg-parchment/40 border border-stone-200 rounded-sm space-y-1">
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Per-Person Rent</p>
                    <p className="text-lg font-bold text-terracotta font-mono">₹{Math.round(property.price / roommates).toLocaleString('en-IN')}</p>
                    <p className="text-[8px] text-stone-500 font-medium">/month share</p>
                  </div>
                  <div className="p-4 bg-parchment/40 border border-stone-200 rounded-sm space-y-1">
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Deposit Share</p>
                    <p className="text-lg font-bold text-ink font-mono">₹{Math.round(property.securityDeposit / roommates).toLocaleString('en-IN')}</p>
                    <p className="text-[8px] text-stone-500 font-medium">refundable deposit</p>
                  </div>
                  <div className="p-4 bg-sage text-white rounded-sm space-y-1 shadow-md">
                    <p className="text-[9px] font-bold text-parchment uppercase tracking-wider">Brokerage Due</p>
                    <p className="text-xl font-bold font-mono">₹0</p>
                    <p className="text-[8px] text-parchment font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-white" /> 100% Direct P2P
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-parchment/30 border border-stone-200 rounded-sm text-center space-y-0.5">
                  <p className="text-xs font-bold text-stone-500">
                    Adjust the number of roommates above to split rent and deposits automatically!
                  </p>
                  <p className="text-[9px] text-stone-400 font-medium">
                    Fits up to {property.bedrooms * 2} occupants based on bedroom capacity.
                  </p>
                </div>
              )}
              
              {roommates > 1 && (
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-sm flex items-center gap-3">
                  <Users className="w-4 h-4 text-terracotta shrink-0" strokeWidth={1.5} />
                  <p className="text-[9px] text-ink font-medium leading-relaxed">
                    By sharing this {property.bedrooms} BHK listing among {roommates} roommates, your direct up-front move-in share is reduced to <strong className="font-bold text-terracotta font-mono">₹{Math.round((property.price + property.securityDeposit) / roommates).toLocaleString('en-IN')}</strong>, saving each tenant an estimated <strong className="font-bold text-sage font-mono">₹{Math.round(property.brokerSavings / roommates).toLocaleString('en-IN')}</strong> in broker fees!
                  </p>
                </div>
              )}
            </div>

            {/* Specifications */}
            <div className="flex items-center justify-between p-6 bg-white border border-stone-200 rounded-md shadow-sm">
              <div className="text-center space-y-1 flex-1">
                <div className="w-9 h-9 rounded-sm bg-parchment flex items-center justify-center mx-auto mb-1.5 border border-stone-200">
                  <BedDouble className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
                </div>
                <p className="text-base font-bold text-ink font-mono">{property.bedrooms}</p>
                <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Bedrooms</p>
              </div>
              <div className="h-10 w-px bg-stone-200" />
              <div className="text-center space-y-1 flex-1">
                <div className="w-9 h-9 rounded-sm bg-parchment flex items-center justify-center mx-auto mb-1.5 border border-stone-200">
                  <Bath className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
                </div>
                <p className="text-base font-bold text-ink font-mono">{property.bathrooms}</p>
                <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Bathrooms</p>
              </div>
              <div className="h-10 w-px bg-stone-200" />
              <div className="text-center space-y-1 flex-1">
                <div className="w-9 h-9 rounded-sm bg-parchment flex items-center justify-center mx-auto mb-1.5 border border-stone-200">
                  <Square className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
                </div>
                <p className="text-base font-bold text-ink font-mono">{property.areaSqFt}</p>
                <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Sq.Ft Area</p>
              </div>
            </div>

                {/* Description */}
            <div className="space-y-3">
              <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">About this property</h2>
              <p className="text-stone-700 leading-relaxed text-sm font-medium">
                {property.description}
              </p>
            </div>

            {/* Commute Mini Profile & Styled Map Preview */}
            {(() => {
              const workplaceMapped = (selectedWorkplace === 'iitm' || selectedWorkplace === 'tidel' || selectedWorkplace === 'spencer' || selectedWorkplace === 'kapaleeshwarar') ? selectedWorkplace : 'iitm';
              const finalCity = ['Nungambakkam', 'Mylapore', 'Adyar', 'OMR'].includes(property.city) ? property.city : 'Adyar';
              
              const commuteTimesLocal: Record<string, Record<string, Record<'metro' | 'auto' | 'bike', number>>> = {
                'iitm': {
                  'Nungambakkam': { metro: 25, auto: 35, bike: 20 },
                  'Adyar': { metro: 5, auto: 8, bike: 4 },
                  'OMR': { metro: 20, auto: 15, bike: 12 },
                  'Mylapore': { metro: 12, auto: 18, bike: 10 }
                },
                'tidel': {
                  'Nungambakkam': { metro: 35, auto: 45, bike: 30 },
                  'Adyar': { metro: 18, auto: 15, bike: 10 },
                  'OMR': { metro: 5, auto: 6, bike: 5 },
                  'Mylapore': { metro: 22, auto: 25, bike: 18 }
                },
                'spencer': {
                  'Nungambakkam': { metro: 4, auto: 6, bike: 5 },
                  'Adyar': { metro: 25, auto: 30, bike: 20 },
                  'OMR': { metro: 35, auto: 40, bike: 28 },
                  'Mylapore': { metro: 12, auto: 15, bike: 10 }
                },
                'kapaleeshwarar': {
                  'Nungambakkam': { metro: 15, auto: 20, bike: 12 },
                  'Adyar': { metro: 12, auto: 15, bike: 10 },
                  'OMR': { metro: 22, auto: 25, bike: 18 },
                  'Mylapore': { metro: 4, auto: 5, bike: 3 }
                }
              };

              const currentDuration = commuteTimesLocal[workplaceMapped]?.[finalCity]?.[commuteTransitMode] || 15;
              const currentGrade = currentDuration <= 10 ? 'A+ Ultra' : currentDuration <= 20 ? 'A Excellent' : currentDuration <= 30 ? 'B Efficient' : 'C Standard';
              
              const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
                'A+ Ultra': { bg: 'bg-sage', text: 'text-white', border: 'border-sage' },
                'A Excellent': { bg: 'bg-sage/90', text: 'text-white', border: 'border-sage/80' },
                'B Efficient': { bg: 'bg-[#C9A227]', text: 'text-white', border: 'border-stone-500' },
                'C Standard': { bg: 'bg-stone-500', text: 'text-white', border: 'border-stone-600' }
              };
              
              const modeIcons = {
                auto: <Car className="w-4 h-4" strokeWidth={1.5} />,
                metro: <Train className="w-4 h-4" strokeWidth={1.5} />,
                bike: <Bike className="w-4 h-4" strokeWidth={1.5} />
              };
              
              const areasMap: Record<string, { name: string; x: number; y: number; color: string }> = {
                'Nungambakkam': { name: 'Nungambakkam', x: 80, y: 60, color: '#B5652B' },
                'Mylapore': { name: 'Mylapore', x: 160, y: 120, color: '#7A8C7E' },
                'Adyar': { name: 'Adyar', x: 240, y: 180, color: '#C9A227' },
                'OMR': { name: 'OMR Corridor', x: 320, y: 200, color: '#12231C' }
              };

              const workplacesMap: Record<string, { name: string; zone: string; x: number; y: number }> = {
                'iitm': { name: 'IIT Madras Research', zone: 'Adyar', x: 250, y: 175 },
                'tidel': { name: 'TIDEL Park IT Hwy', zone: 'OMR', x: 325, y: 195 },
                'spencer': { name: 'Spencer Plaza', zone: 'Nungambakkam', x: 75, y: 65 },
                'kapaleeshwarar': { name: 'Mylapore Gateway', zone: 'Mylapore', x: 155, y: 125 }
              };

              const currentOrg = areasMap[finalCity] || areasMap['Adyar'];
              const currentDest = workplacesMap[workplaceMapped] || workplacesMap['iitm'];
              
              const midX = (currentOrg.x + currentDest.x) / 2;
              const midY = (currentOrg.y + currentDest.y) / 2 - 25; // Pull curve upwards for nice arc

              const modeColor = commuteTransitMode === 'metro' ? '#B5652B' : commuteTransitMode === 'auto' ? '#C9A227' : '#7A8C7E';

              return (
                <div className="space-y-5 pt-6 border-t border-stone-200" id="property-commute-pulse">
                  <div>
                    <h3 className="text-sm font-bold text-ink uppercase tracking-wider font-display">Commute & Geographic Pulse</h3>
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Live Commute Node Mapping</p>
                  </div>

                  {/* Visual Map Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-stretch">
                    {/* Tiny Map SVG */}
                    <div className="md:col-span-3 relative h-56 bg-stone-50 border border-stone-200 rounded-md overflow-hidden group shadow-inner">
                      <svg viewBox="0 0 400 240" className="w-full h-full">
                        <defs>
                          <pattern id="miniGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#f5f5f4" strokeWidth="1" />
                          </pattern>
                        </defs>
                        {/* Grid */}
                        <rect width="100%" height="100%" fill="url(#miniGrid)" />

                        {/* Coastline */}
                        <path d="M 370 0 Q 355 40 370 80 Q 360 120 375 160 Q 355 200 370 240 L 400 240 L 400 0 Z" fill="#f6f3ec" fillOpacity="0.8" />
                        <text x="382" y="120" fill="#7a8c7e" fillOpacity="0.5" fontSize="7" fontWeight="black" transform="rotate(90, 382, 120)" letterSpacing="1">BAY OF BENGAL</text>

                        {/* Adyar River */}
                        <path d="M 0 165 Q 160 160 250 182 T 363 175" fill="none" stroke="#e7e5e4" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.7" />

                        {/* Faint Area Zones */}
                        {Object.entries(areasMap).map(([id, area]) => (
                          <g key={id}>
                            <circle cx={area.x} cy={area.y} r="22" fill={area.color} fillOpacity="0.04" stroke={area.color} strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 3" />
                            <text x={area.x} y={area.y + 4} fill="#78716c" fontSize="8" fontWeight="bold" textAnchor="middle" className="uppercase tracking-widest opacity-50 font-mono">{area.name}</text>
                          </g>
                        ))}

                        {/* Connection Commute Route Dash */}
                        {finalCity !== currentDest.zone && (
                          <motion.path 
                            d={`M ${currentOrg.x} ${currentOrg.y} Q ${midX} ${midY} ${currentDest.x} ${currentDest.y}`}
                            fill="none" 
                            stroke={modeColor} 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeDasharray="5 5"
                            className="pointer-events-none"
                            initial={{ strokeDashoffset: 100 }}
                            animate={{ strokeDashoffset: 0 }}
                            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                          />
                        )}

                        {/* Active connection line when in same neighborhood */}
                        {finalCity === currentDest.zone && (
                          <line 
                            x1={currentOrg.x} 
                            y1={currentOrg.y} 
                            x2={currentDest.x} 
                            y2={currentDest.y} 
                            stroke={modeColor} 
                            strokeWidth="2" 
                            strokeDasharray="4 4"
                          />
                        )}

                        {/* Property Pin */}
                        <g transform={`translate(${currentOrg.x}, ${currentOrg.y})`}>
                          <circle r="10" fill={areasMap[finalCity]?.color || '#B5652B'} fillOpacity="0.2" className="animate-ping" style={{ animationDuration: '3s' }} />
                          <circle r="6" fill={areasMap[finalCity]?.color || '#B5652B'} stroke="#ffffff" strokeWidth="2" className="shadow-sm" />
                          <circle r="1.5" fill="#ffffff" />
                        </g>

                        {/* Workplace Destination Marker */}
                        <g transform={`translate(${currentDest.x}, ${currentDest.y})`}>
                          <rect x="-7" y="-7" width="14" height="14" rx="2" fill="#12231C" stroke="#ffffff" strokeWidth="1.5" className="shadow-sm" />
                          <circle r="1.5" fill="#C9A227" />
                        </g>

                        {/* Labels */}
                        {/* Property Pin Label */}
                        <g transform={`translate(${currentOrg.x}, ${currentOrg.y - 12})`}>
                          <rect x="-30" y="-8" width="60" height="12" rx="2" fill="#ffffff" stroke="#e7e5e4" strokeWidth="1" className="shadow-sm" />
                          <text x="0" y="0" fill="#12231C" fontSize="6.5" fontWeight="bold" textAnchor="middle" className="uppercase font-mono">Property Pin</text>
                        </g>

                        {/* Workplace Label */}
                        <g transform={`translate(${currentDest.x}, ${currentDest.y + 16})`}>
                          <rect x="-35" y="-8" width="70" height="12" rx="2" fill="#12231C" className="shadow-sm" />
                          <text x="0" y="0" fill="#ffffff" fontSize="6.5" fontWeight="medium" textAnchor="middle" className="uppercase font-mono">{currentDest.name.slice(0, 11)}...</text>
                        </g>
                      </svg>

                      {/* Mini Map Info Overlay */}
                      <div className="absolute top-4 left-4 bg-ink/90 backdrop-blur-md px-2.5 py-1 rounded-sm border border-white/10 flex items-center gap-1.5">
                        <Compass className="w-3 h-3 text-brass animate-spin" style={{ animationDuration: '10s' }} />
                        <span className="text-[7.5px] font-black uppercase text-white tracking-widest">Spatial HUD active</span>
                      </div>
                    </div>

                    {/* Right-side commute data columns */}
                    <div className="md:col-span-2 flex flex-col justify-between space-y-4">
                      {/* Metric Card */}
                      <div className="bg-stone-50 border border-stone-200 p-4 rounded-md space-y-3 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-sm bg-white border border-stone-200 flex items-center justify-center text-ink shadow-sm">
                            {modeIcons[commuteTransitMode]}
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest leading-none">COMMUTE DURATION</p>
                            <p className="text-lg font-bold text-ink mt-0.5 font-mono">{currentDuration} Mins</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-sm text-[7.5px] font-black uppercase tracking-widest ${gradeColors[currentGrade]?.bg} ${gradeColors[currentGrade]?.text} border border-white/10 flex items-center gap-1 shadow-sm`}>
                            <Sparkles className="w-2 h-2" />
                            {currentGrade}
                          </span>
                          <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Zone Index</span>
                        </div>

                        <p className="text-[10px] text-stone-500 font-medium leading-relaxed">
                          {currentGrade.includes('A+') 
                            ? 'Ultra proximity. Perfect for walking, running, or quick bike commutes.' 
                            : currentGrade.includes('A') 
                            ? 'Excellent reach. Under 20 mins travel time with swift access.' 
                            : currentGrade.includes('B') 
                            ? 'Very efficient. Seamless daily transit and negligible transit overhead.' 
                            : 'Standard commute. Highly reliable routes with predictable timings.'}
                        </p>
                      </div>

                      {/* Distance Info Footer */}
                      <div className="bg-parchment/60 border border-stone-200 p-3.5 rounded-sm text-ink space-y-1">
                        <p className="text-xs font-bold text-ink flex items-center gap-1.5 font-display">
                          <MapPin className="w-3.5 h-3.5 text-terracotta shrink-0" strokeWidth={1.5} />
                          {finalCity} • direct handshake
                        </p>
                        <p className="text-[9.5px] text-stone-500 font-semibold leading-normal">
                          No brokers. Your keys directly from the owner in {finalCity} with guaranteed 0% broker commission.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Amenities */}
            <div className="space-y-4">
              <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Included Amenities</h2>
              <div className="grid grid-cols-2 gap-3">
                {property.amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-3 bg-stone-50 hover:bg-white hover:shadow-sm p-3 rounded-sm border border-stone-200 transition-all group">
                    <div className="w-7 h-7 rounded-sm bg-parchment border border-stone-250 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                    </div>
                    <span className="text-xs font-bold text-stone-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Host Card */}
            <div className="bg-ink rounded-md p-6 text-white border border-stone-850 relative overflow-hidden shadow-premium">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <UserCheck className="w-24 h-24" />
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
                <img 
                  referrerPolicy="no-referrer"
                  src={property.ownerAvatar} 
                  alt={property.ownerName} 
                  className="w-16 h-16 rounded-sm object-cover border border-white/10 shadow-md"
                />
                <div className="text-center sm:text-left flex-1 space-y-0.5">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-2xl font-display font-semibold">{property.ownerName}</h3>
                    {property.ownerVerified && (
                      <span className="verified-seal !bg-brass/20 !text-brass !border-brass/40">
                        <CheckCircle className="w-3 h-3" strokeWidth={1.5} />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm font-medium">Direct Property Owner • Instant Response</p>
                </div>
                <button
                  onClick={() => onStartChat(property.id)}
                  className="w-full sm:w-auto bg-terracotta hover:bg-terracotta/90 text-white px-5 py-3 rounded-sm font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  id={`chat-owner-${property.id}`}
                >
                  Direct Message
                </button>
              </div>
            </div>

            {/* Visit Scheduler */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink tracking-tight font-display">Schedule a Visit</h2>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-terracotta bg-parchment px-2.5 py-1 rounded-sm border border-stone-250 uppercase tracking-widest">
                  <Clock className="w-3 h-3 text-terracotta" />
                  Free Direct Walkthrough
                </div>
              </div>

              {isScheduled ? (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-stone-50 border border-stone-200 rounded-md p-8 text-center space-y-5"
                >
                  <div className="w-16 h-16 bg-sage rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-ink font-display">Appointment Requested!</h4>
                    <p className="text-stone-500 text-xs font-medium max-w-xs mx-auto">
                      {property.ownerName} will confirm your slot shortly via Direct Message.
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-stone-200 rounded-sm shadow-sm flex items-center justify-center gap-6 max-w-sm mx-auto">
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Date</p>
                      <p className="text-xs font-bold text-ink font-mono">{visitDate}</p>
                    </div>
                    <div className="w-px h-6 bg-stone-200" />
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Time</p>
                      <p className="text-xs font-bold text-ink font-mono">{visitTime}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmitBooking} className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {upcomingDates.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setVisitDate(d.value)}
                        className={`p-3 rounded-sm border transition-all cursor-pointer text-left ${
                          visitDate === d.value
                            ? 'bg-ink text-white border-ink shadow-md scale-102'
                            : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-250'
                        }`}
                      >
                        <p className={`text-[8px] font-bold uppercase tracking-wider mb-0.5 ${visitDate === d.value ? 'text-brass' : 'text-stone-400'}`}>
                          {d.label}
                        </p>
                        <p className="text-xs font-bold">
                          {new Date(d.value).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {['10:00 AM', '02:00 PM', '06:00 PM'].map((slot, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setVisitTime(slot)}
                        className={`p-3 rounded-sm border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          visitTime === slot
                            ? 'bg-ink text-white border-ink shadow-md scale-102'
                            : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-250'
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 ${visitTime === slot ? 'text-brass' : 'text-stone-400'}`} />
                        <span className="text-xs font-bold">{slot}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={tenantName}
                          onChange={(e) => setTenantName(e.target.value)}
                          className="w-full bg-parchment/30 border border-stone-250 rounded-sm px-4 py-3 text-xs text-ink focus:border-terracotta focus:outline-none transition-colors font-medium placeholder:text-stone-300 shadow-inner"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">Direct Contact</label>
                        <input
                          type="tel"
                          placeholder="+91 99405 11223"
                          value={tenantPhone}
                          onChange={(e) => setTenantPhone(e.target.value)}
                          className="w-full bg-parchment/30 border border-stone-250 rounded-sm px-4 py-3 text-xs text-ink focus:border-terracotta focus:outline-none transition-colors font-medium placeholder:text-stone-300 shadow-inner"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">Quick Intro</label>
                      <textarea
                        rows={3}
                        placeholder="Say hello to the owner..."
                        value={introduction}
                        onChange={(e) => setIntroduction(e.target.value)}
                        className="w-full bg-parchment/30 border border-stone-250 rounded-sm px-4 py-3 text-xs text-ink focus:border-terracotta focus:outline-none transition-colors font-medium placeholder:text-stone-300 shadow-inner resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-terracotta hover:bg-terracotta/90 text-white font-bold py-4 px-4 rounded-sm text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>Request Handover Visit</span>
                    <ArrowRight className="w-4 h-4 text-parchment" />
                  </button>
                </form>
              )}

              {similarProperties.length > 0 && (
                <div className="pt-8 border-t border-stone-200 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-ink uppercase tracking-wider font-display">Similar Handpicked Listings</h3>
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Direct-to-Owner Matches</p>
                    </div>
                    <span className="flex items-center gap-1 bg-parchment text-ink px-3 py-1 rounded-sm text-[8px] font-bold uppercase tracking-widest border border-stone-250">
                      <Sparkles className="w-2.5 h-2.5 text-terracotta" />
                      {similarProperties.length} Matches Found
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {similarProperties.map((simProp) => (
                      <div 
                        key={simProp.id}
                        onClick={() => {
                          onSelectProperty?.(simProp.id);
                          setActivePhoto(0);
                        }}
                        className="group bg-stone-50 hover:bg-white rounded-md border border-stone-200 p-4 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between space-y-4"
                      >
                        <div className="relative h-40 rounded-sm overflow-hidden">
                          <img referrerPolicy="no-referrer" src={simProp.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                          <div className="absolute top-3 left-3">
                            <span className="bg-terracotta text-white px-2.5 py-1 rounded-sm text-[8px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1 border border-white/10">
                              <Sparkles className="w-2.5 h-2.5 text-parchment" />
                              Similar
                            </span>
                          </div>
                          <div className="absolute bottom-3 left-3 bg-ink/90 backdrop-blur-md px-3 py-1 rounded-sm text-white text-xs font-semibold">
                            ₹{simProp.price.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1 font-mono">
                            <MapPin className="w-3 h-3 text-terracotta" />
                            {simProp.city}
                          </p>
                          <h4 className="font-bold text-xs text-ink truncate leading-tight group-hover:text-terracotta transition-colors">{simProp.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
