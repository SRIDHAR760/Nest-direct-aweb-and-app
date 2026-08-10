import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Property, DirectInquiry, PropertyType } from '../types';
import { 
  PlusCircle, LayoutDashboard, FileText, Check, X, 
  MapPin, CheckCircle, Home, Hammer, Calendar, 
  Clock, Mail, DollarSign, UserCheck, ShieldAlert,
  UploadCloud, Image as ImageIcon, Trash2, Phone,
  AlertCircle
} from 'lucide-react';

const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  const cleanUrl = url.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    return false;
  }
  const lowerUrl = cleanUrl.toLowerCase();
  
  // Extract path to ignore search params
  const pathPart = lowerUrl.split('?')[0];
  
  // Match standard image file extensions at the end of path
  const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|heic)$/i.test(pathPart);
  
  // Also support typical trusted CDNs / image hosts that don't enforce file extension in URL paths
  const isTrustedImageHost = lowerUrl.includes('images.unsplash.com') ||
                             lowerUrl.includes('picsum.photos') ||
                             lowerUrl.includes('raw.githubusercontent.com') ||
                             lowerUrl.includes('imgur.com') ||
                             lowerUrl.includes('cloudinary.com') ||
                             /\.(format|auto=format|fit=|w=\d+|h=\d+)/i.test(lowerUrl);
                             
  return hasImageExtension || isTrustedImageHost;
};

interface OwnerPortalProps {
  myProperties: Property[];
  inquiries: DirectInquiry[];
  onAddProperty: (property: Property) => void;
  onUpdateInquiryStatus: (id: string, status: 'accepted' | 'declined') => void;
  onTogglePropertyStatus?: (id: string) => void;
  currentUser?: any;
}

export default function OwnerPortal({ 
  myProperties, 
  inquiries, 
  onAddProperty, 
  onUpdateInquiryStatus, 
  onTogglePropertyStatus,
  currentUser 
}: OwnerPortalProps) {
  const [viewMode, setViewMode] = useState<'dashboard' | 'add'>('dashboard');

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('25000');
  const [deposit, setDeposit] = useState('50000');
  const [type, setType] = useState<PropertyType>('apartment');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Adyar');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('1');
  const [area, setArea] = useState('850');
  const [amenitiesText, setAmenitiesText] = useState('High-Speed Wifi, Private Parking, Pet Friendly, Central Heating');
  const [description, setDescription] = useState('');
  
  // Custom Photos / presets
  const [photoPreset, setPhotoPreset] = useState<string>('https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200');
  const [customPhotos, setCustomPhotos] = useState<string[]>([]);
  const [photoUrlInputs, setPhotoUrlInputs] = useState<string[]>(['']);
  const [dragActive, setDragActive] = useState(false);

  // Landlord profile override
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('+91 99405 88223');

  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setOwnerName(currentUser.displayName || '');
      setOwnerEmail(currentUser.email || '');
    } else {
      setOwnerName('Guest Landlord');
      setOwnerEmail('guest.landlord@nestdirect.in');
    }
  }, [currentUser]);

  const photoPresets = [
    { label: 'Modern Loft', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200' },
    { label: 'Brick Cottage', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200' },
    { label: 'Timber Industrial', url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=1200' },
    { label: 'Bohemian Studio', url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=1200' }
  ];

  // FileReader multi-upload conversion to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files) as File[];
      filesArray.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            setCustomPhotos((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      filesArray.forEach((file: File) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
              setCustomPhotos((prev) => [...prev, reader.result as string]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeCustomPhoto = (indexToRem: number) => {
    setCustomPhotos((prev) => prev.filter((_, idx) => idx !== indexToRem));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title || !address || !description) {
      setFormError('Please fill out all required fields.');
      return;
    }

    // Identify non-blank URL inputs & validate them
    const nonBlankUrls = photoUrlInputs.map(url => url.trim()).filter(url => url.length > 0);
    const invalidUrls = nonBlankUrls.filter(url => !isValidImageUrl(url));
    if (invalidUrls.length > 0) {
      setFormError(`We found ${invalidUrls.length} invalid image link(s). Image URLs must start with http:// or https:// and have standard image extensions (.jpg, .png, .webp, etc.) or point to public images.`);
      
      const scrollContainer = document.getElementById('owner-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const amenities = amenitiesText.split(',').map(a => a.trim()).filter(a => a.length > 0);
    const priceNum = parseFloat(price) || 1000;
    const depositNum = parseFloat(deposit) || priceNum;
    const brokerSavings = Math.round(priceNum);

    // If custom photos or URL inputs are provided, combine them; otherwise use preset
    const finalPhotos = [...customPhotos, ...nonBlankUrls];
    const propertyPhotos = finalPhotos.length > 0 ? finalPhotos : [photoPreset];

    const newProp: Property = {
      id: `my-prop-${Date.now()}`,
      title,
      description,
      price: priceNum,
      securityDeposit: depositNum,
      type,
      address,
      city,
      bedrooms: parseInt(bedrooms) || 1,
      bathrooms: parseFloat(bathrooms) || 1,
      areaSqFt: parseInt(area) || 500,
      amenities,
      photos: propertyPhotos,
      ownerName: ownerName ? `${ownerName} (You)` : 'Direct Owner (You)',
      ownerPhone: ownerPhone || '+91 99405 88223',
      ownerEmail: ownerEmail || 'owner@nestdirect-verified.in',
      ownerAvatar: currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      ownerVerified: true,
      createdAt: new Date().toISOString(),
      brokerSavings
    };

    onAddProperty(newProp);
    setFormSuccess(true);
    setTitle('');
    setDescription('');
    setAddress('');
    setCustomPhotos([]);
    setPhotoUrlInputs(['']);
    
    setTimeout(() => {
      setFormSuccess(false);
      setViewMode('dashboard');
    }, 2500);
  };

  return (
    <div className="bg-white flex flex-col h-full rounded-lg border border-stone-200 shadow-premium overflow-hidden" id="owner-portal-root">
      {/* Sub header */}
      <div className="bg-ink px-8 py-6 border-b border-stone-850 flex items-center justify-between z-10 text-white">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-sm flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-brass" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white tracking-tight">Owner Hub</h2>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">Direct Inventory Management</p>
          </div>
        </div>
        <div className="flex bg-stone-800/50 p-1 border border-stone-700/50 rounded-sm">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-4 py-1.5 rounded-sm text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${
              viewMode === 'dashboard' ? 'bg-white text-ink shadow-sm' : 'text-stone-300 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setViewMode('add')}
            className={`px-4 py-1.5 rounded-sm text-xs font-bold tracking-wide uppercase transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'add' ? 'bg-white text-ink shadow-sm' : 'text-stone-300 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
            Add Unit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-none" id="owner-scroll-container">
        {viewMode === 'dashboard' ? (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Listings', val: myProperties.length, sub: 'Direct active inventory', icon: Home, color: 'bg-stone-100 text-ink border-stone-250' },
                { label: 'Inquiries', val: inquiries.length, sub: 'Tenant tour requests', icon: Clock, color: 'bg-stone-100 text-terracotta border-stone-250' },
                { label: 'Bypassed Fee', val: `₹${myProperties.reduce((sum, p) => sum + p.brokerSavings, 0).toLocaleString('en-IN')}`, sub: 'Retained earnings', icon: DollarSign, color: 'bg-stone-100 text-sage border-stone-250' }
              ].map((stat, i) => (
                <div key={i} className="bg-stone-50 p-6 rounded-sm border border-stone-200 flex flex-col justify-between group hover:shadow-md transition-all">
                  <div className={`w-10 h-10 ${stat.color} rounded-sm border flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <stat.icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest font-mono">{stat.label}</p>
                    <p className="text-2xl font-bold font-display text-ink mt-2 tracking-tight">{stat.val}</p>
                    <p className="text-[10px] text-stone-500 font-medium mt-1">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Inquiries */}
            <div className="space-y-4">
              <h3 className="text-[9px] font-black text-stone-400 uppercase tracking-widest font-mono px-2">
                Active Tenant Applications
              </h3>
              {inquiries.length === 0 ? (
                <div className="bg-stone-50 rounded-lg p-16 text-center border border-dashed border-stone-200 text-stone-400 flex flex-col items-center">
                  <ShieldAlert className="w-12 h-12 text-stone-300 mb-4" strokeWidth={1.5} />
                  <p className="text-sm font-bold font-display text-ink uppercase tracking-wide">Waiting for first lead</p>
                  <p className="text-xs text-stone-500 mt-2 max-w-sm mx-auto font-medium">Your listings are direct-only, bypassing broker friction. Leads will appear here once requested.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {inquiries.map((inq, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-stone-50 p-6 rounded-md border border-stone-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 group hover:shadow-md transition-all"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-white rounded-sm border border-stone-200 flex items-center justify-center text-stone-400 group-hover:border-terracotta group-hover:text-terracotta transition-colors">
                          <UserCheck className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3">
                            <h4 className="text-sm font-bold font-display text-ink uppercase tracking-wide">{inq.tenantName}</h4>
                            <span className="px-2 py-0.5 bg-parchment text-ink rounded-sm text-[9px] font-bold uppercase tracking-wider border border-stone-250">
                              Unit: {inq.propertyId.split('-').pop()}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs font-bold text-stone-400 font-mono">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-stone-300" strokeWidth={1.5} />
                              {new Date(inq.visitDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-stone-300" strokeWidth={1.5} />
                              {inq.visitTime}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-stone-300" strokeWidth={1.5} />
                              {inq.tenantEmail}
                            </span>
                          </div>
                          <div className="p-3 bg-white rounded-sm border border-stone-200 text-xs font-medium text-stone-600 leading-relaxed max-w-xl italic">
                            "{inq.message}"
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full lg:w-auto gap-2">
                        {inq.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => onUpdateInquiryStatus(inq.id, 'accepted')}
                              className="flex-1 lg:flex-none bg-sage hover:bg-sage/90 text-white font-bold h-10 px-6 rounded-sm text-xs uppercase tracking-wider shadow-sm cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => onUpdateInquiryStatus(inq.id, 'declined')}
                              className="flex-1 lg:flex-none bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white font-bold h-10 px-6 rounded-sm text-xs uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <div className={`h-10 px-6 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2 border ${
                            inq.status === 'accepted' ? 'bg-sage/10 text-sage border-sage/20' : 'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {inq.status === 'accepted' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            {inq.status === 'accepted' ? 'Handshake Confirmed' : 'Request Terminated'}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* My Listings */}
            <div className="space-y-4">
              <h3 className="text-[9px] font-black text-stone-400 uppercase tracking-widest font-mono px-2">
                Inventory Portfolio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProperties.map((p, idx) => (
                  <div key={idx} className="bg-stone-50 rounded-lg border border-stone-200 overflow-hidden group hover:shadow-md transition-all">
                    <div className="h-40 relative overflow-hidden">
                      <img referrerPolicy="no-referrer" src={p.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className={`px-2 py-0.5 rounded-sm text-[8px] font-extrabold uppercase tracking-wider border shadow-sm ${
                          p.status === 'occupied' 
                            ? 'bg-amber-500 text-white border-amber-400' 
                            : 'bg-sage text-white border-sage/10'
                        }`}>
                          {p.status === 'occupied' ? 'Occupied' : 'Available'}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 bg-ink/90 backdrop-blur-md px-2 py-0.5 rounded-sm text-[8px] font-bold text-white border border-stone-850 uppercase tracking-wider">
                        {p.type}
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div>
                        <h4 className="font-bold text-xs font-display text-ink uppercase tracking-wide line-clamp-1">{p.title}</h4>
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5 font-mono">{p.city}</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-stone-200 gap-4">
                        <span className="text-sm font-bold text-ink">₹{p.price.toLocaleString('en-IN')}/mo</span>
                        {onTogglePropertyStatus ? (
                          <button
                            onClick={() => onTogglePropertyStatus(p.id)}
                            className={`px-2.5 py-1 rounded-sm font-bold uppercase text-[8px] tracking-wider border transition-all cursor-pointer active:scale-95 ${
                              p.status === 'occupied'
                                ? 'bg-sage/10 text-sage border-sage/20 hover:bg-sage/20'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {p.status === 'occupied' ? 'Mark Available' : 'Mark Occupied'}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-sage/10 text-sage rounded-sm text-[8px] font-bold border border-sage/20 uppercase tracking-wider">
                            <Check className="w-3 h-3" />
                            0% Fee
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Add Property */
          <div className="max-w-3xl mx-auto">
            {formSuccess ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-stone-50 border border-stone-200 rounded-lg p-16 text-center space-y-6"
              >
                <div className="w-16 h-16 bg-sage rounded-sm flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-ink uppercase tracking-wider">Direct Unit Published</h3>
                  <p className="text-stone-600 text-xs font-medium max-w-sm mx-auto mt-2">
                    Your rental unit has been successfully generated & mapped to the NestDirect P2P engine.
                  </p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg border border-stone-200 shadow-premium">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold font-display text-ink uppercase tracking-wide flex items-center gap-3">
                    <PlusCircle className="w-6 h-6 text-terracotta" strokeWidth={1.5} />
                    New Direct Listing
                  </h3>
                  <p className="text-xs font-medium text-stone-500">Complete details to bypass traditional brokerage brokers and find direct tenants instantly.</p>
                </div>

                <AnimatePresence>
                  {formError && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 border border-red-150 rounded-sm p-4 text-red-800 flex items-start gap-3 overflow-hidden"
                    >
                      <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div className="flex-1 space-y-1">
                        <h4 className="text-xs font-bold tracking-tight uppercase">Form Validation Blocked</h4>
                        <p className="text-[11px] font-semibold leading-relaxed text-red-600">{formError}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormError(null)} 
                        className="text-[10px] font-bold uppercase text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-full">
                      <label className="text-[9px] font-bold text-stone-400 uppercase px-1 tracking-widest font-mono">Listing Reference Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Minimalist Zen Penthouse in Mylapore"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-terracotta focus:bg-white transition-all text-xs font-bold placeholder:text-stone-300"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-stone-400 uppercase px-1 tracking-widest font-mono">Address Line</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 12, Bishop Wallers Avenue West"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-terracotta focus:bg-white transition-all text-xs font-bold placeholder:text-stone-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-stone-400 uppercase px-1 tracking-widest font-mono">Monthly Rent (₹)</label>
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-terracotta focus:bg-white transition-all text-xs font-bold placeholder:text-stone-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-stone-400 uppercase px-1 tracking-widest font-mono">Security Deposit (₹)</label>
                      <input
                        type="number"
                        required
                        value={deposit}
                        onChange={(e) => setDeposit(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-terracotta focus:bg-white transition-all text-xs font-bold placeholder:text-stone-300"
                      />
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-stone-400 uppercase px-1 tracking-widest font-mono">Prop Type</label>
                      <div className="relative">
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as PropertyType)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-terracotta focus:bg-white text-xs font-bold text-stone-700 appearance-none cursor-pointer"
                        >
                          <option value="apartment">Apartment</option>
                          <option value="house">House</option>
                          <option value="studio">Studio</option>
                          <option value="room">Room</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-stone-400 uppercase px-1 tracking-widest font-mono">Zone</label>
                      <div className="relative">
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-terracotta focus:bg-white text-xs font-bold text-stone-700 appearance-none cursor-pointer"
                        >
                          <option value="Adyar">Adyar</option>
                          <option value="OMR">OMR</option>
                          <option value="Mylapore">Mylapore</option>
                          <option value="Nungambakkam">Nungambakkam</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-stone-400 uppercase px-1 tracking-widest font-mono">Beds</label>
                      <input
                        type="number"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-terracotta focus:bg-white text-xs font-bold text-stone-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-stone-400 uppercase px-1 tracking-widest font-mono">Area</label>
                      <input
                        type="number"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-terracotta focus:bg-white text-xs font-bold text-stone-700"
                      />
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-stone-400 uppercase px-1 tracking-widest font-mono">Property Amenities (comma separated)</label>
                    <input
                      type="text"
                      required
                      placeholder="High-Speed Wifi, Private Parking, Pet Friendly..."
                      value={amenitiesText}
                      onChange={(e) => setAmenitiesText(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-terracotta focus:bg-white transition-all text-xs font-bold placeholder:text-stone-300"
                    />
                  </div>

                  {/* Real-time Custom Image File and Drag-and-Drop Uploader */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase px-1 tracking-widest font-mono">Property Photos (Upload & Live Preview)</label>
                      <p className="text-[11px] text-stone-500 font-medium px-1">Upload property photos directly from your device, paste picture URLs, or select one from our preset aesthetics.</p>
                    </div>

                    {/* Drag and Drop Box */}
                    <div 
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-sm p-6 text-center transition-all ${
                        dragActive ? 'border-terracotta bg-parchment scale-[1.01]' : 'border-stone-300 bg-stone-50/50 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 bg-white border border-stone-200 rounded-sm flex items-center justify-center text-terracotta shadow-sm">
                          <UploadCloud className="w-5 h-5" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink font-display uppercase tracking-wide">Drag & drop your property photos here or</p>
                          <label className="text-xs text-terracotta hover:text-terracotta/90 font-extrabold cursor-pointer mt-1 inline-block">
                            browse files
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*" 
                              onChange={handleFileChange} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Photo URL Array Inputs */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest font-mono">Image URLs</span>
                        <button
                          type="button"
                          onClick={() => setPhotoUrlInputs((prev) => [...prev, ''])}
                          className="text-[10px] text-terracotta hover:text-terracotta/90 font-extrabold flex items-center gap-1 transition-all uppercase tracking-wider"
                        >
                          + Add Another URL
                        </button>
                      </div>

                      <div className="space-y-3">
                        {photoUrlInputs.map((url, index) => {
                          const hasText = url.trim().length > 0;
                          const isValid = hasText && isValidImageUrl(url);
                          
                          let borderClass = 'border-stone-200 focus:border-terracotta';
                          if (hasText) {
                            borderClass = isValid 
                              ? 'border-sage/30 bg-sage/5 focus:border-sage' 
                              : 'border-red-200 bg-red-50/10 focus:border-red-500';
                          }

                          return (
                            <div key={index} className="space-y-1 bg-stone-50/30 p-2 rounded-sm border border-stone-200">
                              <div className="flex gap-2 items-center">
                                <span className="text-[10px] font-black text-stone-400 w-8 text-center bg-stone-150 py-2 rounded-sm shrink-0 font-mono">#{index + 1}</span>
                                <input 
                                  type="text" 
                                  placeholder="https://images.unsplash.com/photo-..." 
                                  value={url}
                                  onChange={(e) => {
                                    const newInputs = [...photoUrlInputs];
                                    newInputs[index] = e.target.value;
                                    setPhotoUrlInputs(newInputs);
                                    setFormError(null);
                                  }}
                                  className={`flex-1 bg-white border rounded-sm px-4 py-2.5 text-xs font-bold focus:outline-none placeholder:text-stone-300 transition-all ${borderClass}`}
                                />
                                {photoUrlInputs.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPhotoUrlInputs((prev) => prev.filter((_, idx) => idx !== index));
                                      setFormError(null);
                                    }}
                                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-sm border border-red-100 transition-all cursor-pointer shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                  </button>
                                )}
                              </div>
                              {hasText && (
                                <div className="text-[10px] font-bold px-1 pt-0.5 flex items-center gap-1.5 font-mono">
                                  {isValid ? (
                                    <span className="text-sage flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5 text-sage" /> Valid public image URL
                                    </span>
                                  ) : (
                                    <span className="text-red-500 flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5 text-red-400" /> Invalid image link. Start with http(s)://
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live URL Image Previews */}
                    {photoUrlInputs.some(url => url.trim().startsWith('http')) && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold text-terracotta uppercase px-1 tracking-widest font-mono">Live URL Previews</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {photoUrlInputs.map((url, idx) => {
                            if (!url.trim().startsWith('http')) return null;
                            return (
                              <div key={idx} className="relative h-20 rounded-sm overflow-hidden group border border-stone-200 shadow-sm bg-stone-50">
                                <img src={url.trim()} alt="" className="w-full h-full object-cover" onError={(e) => {
                                  // Fallback indicator
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=400';
                                }} />
                                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 text-white rounded-sm text-[8px] font-mono uppercase tracking-wider">
                                  URL #{idx + 1}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Display uploaded photos if any */}
                    {customPhotos.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold text-terracotta uppercase px-1 tracking-widest font-mono">Uploaded Photos ({customPhotos.length})</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {customPhotos.map((photo, idx) => (
                            <div key={idx} className="relative h-20 rounded-sm overflow-hidden group border border-stone-200">
                              <img src={photo} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeCustomPhoto(idx)}
                                className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-red-500 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Presets Grid */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-stone-400 uppercase px-1 tracking-widest font-mono">
                        {customPhotos.length > 0 ? "Or override using presets" : "Or pick architectural styled presets:"}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {photoPresets.map((pic, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                                setPhotoPreset(pic.url);
                                // Clear custom upload if user explicitly clicks preset to keep clean state
                                setCustomPhotos([]);
                            }}
                            className={`relative h-20 rounded-sm overflow-hidden border-2 transition-all cursor-pointer ${
                              photoPreset === pic.url && customPhotos.length === 0 ? 'border-terracotta shadow-md scale-102' : 'border-transparent opacity-60'
                            }`}
                          >
                            <img referrerPolicy="no-referrer" src={pic.url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 py-0.5 bg-black/50 text-center text-[8px] font-bold text-white uppercase tracking-wider">
                              {pic.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Owner Contact Information */}
                  <div className="space-y-4 bg-stone-50 p-6 rounded-sm border border-stone-200">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold font-display text-ink tracking-tight uppercase flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-brass" strokeWidth={1.5} />
                        Landlord Identity Settings
                      </h4>
                      <p className="text-[11px] text-stone-500 font-medium">Bypass fees by confirming your registered workspace credentials.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-stone-400 uppercase px-1 font-mono">Landlord Name</label>
                        <input
                          type="text"
                          required
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-terracotta text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-stone-400 uppercase px-1 font-mono">Contact Phone</label>
                        <input
                          type="text"
                          required
                          value={ownerPhone}
                          onChange={(e) => setOwnerPhone(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-terracotta text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-stone-400 uppercase px-1 font-mono">Registered Email</label>
                        <input
                          type="email"
                          required
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-terracotta text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-stone-400 uppercase px-1 tracking-widest font-mono">Property Description</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Explain direct rental benefits and space specifications..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-terracotta focus:bg-white transition-all text-xs font-bold placeholder:text-stone-300 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-terracotta hover:bg-terracotta/95 text-white font-bold py-4 px-4 rounded-sm text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Deploy Direct Listing Agent
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
