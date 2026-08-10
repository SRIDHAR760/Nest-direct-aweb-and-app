import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Compass, Sparkles, Heart, Scale } from 'lucide-react';
import { Property } from '../types';

interface PropertyCardImageCarouselProps {
  photos: string[];
  propertyId: string;
  favorites: string[];
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
  comparedPropertyIds?: string[];
  toggleCompare?: (id: string, e: React.MouseEvent) => void;
  type: string;
  city: string;
  selectedWorkplace: string;
  commuteTransitMode: 'auto' | 'metro' | 'bike';
  isFilterActive: boolean;
  getCommuteGrade: (time: number) => string;
  getCommuteTime: (city: string, workplace: string, mode: 'auto' | 'metro' | 'bike') => number;
  prop: Property;
}

export default function PropertyCardImageCarousel({
  photos,
  propertyId,
  favorites,
  toggleFavorite,
  comparedPropertyIds = [],
  toggleCompare,
  type,
  city,
  selectedWorkplace,
  commuteTransitMode,
  isFilterActive,
  getCommuteGrade,
  getCommuteTime,
  prop
}: PropertyCardImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const commuteMin = getCommuteTime(city, selectedWorkplace, commuteTransitMode);

  const handleNext = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;

    // Swipe threshold of 50px
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        handleNext(e);
      } else {
        handlePrev(e);
      }
    }
    setTouchStartX(null);
  };

  return (
    <div 
      className="h-72 overflow-hidden relative select-none group/carousel"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      id={`carousel-${propertyId}`}
    >
      {/* Photo with AnimatePresence slide/fade effect */}
      <div className="absolute inset-0 bg-slate-900">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={photos[activeIndex]}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full h-full object-cover"
            alt={`${prop.title} - View ${activeIndex + 1}`}
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
      </div>

      {/* Modern Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

      {/* Quick-action navigation arrows (hidden by default on desktop, visible on hover; visible on touch devices if they trigger hover) */}
      {photos.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-black/50 active:scale-95 z-20 cursor-pointer"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-black/50 active:scale-95 z-20 cursor-pointer"
            aria-label="Next photo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Floating Badges */}
      <div className="absolute top-6 left-6 flex flex-col gap-2 z-10 pointer-events-none">
        <span className="bg-parchment/95 backdrop-blur-md text-ink px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-sm border border-stone-200">
          {type}
        </span>
        <div className="bg-ink/95 backdrop-blur-md text-white px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 border border-white/10 shrink-0">
          <Compass className="w-3.5 h-3.5 text-sage" strokeWidth={1.5} />
          {getCommuteGrade(commuteMin)} Grade
        </div>
        {isFilterActive && (
          <div className="bg-terracotta text-white px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 shrink-0 select-none">
            <Sparkles className="w-3.5 h-3.5 text-parchment" strokeWidth={1.5} />
            Similar
          </div>
        )}
      </div>

      {/* Signature Brass Verified Owner Wax-Stamp Seal */}
      <div className="absolute top-5 right-5 z-10 select-none pointer-events-none animate-fadeIn hidden sm:flex">
        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#AA7C11] to-[#8B6508] border-2 border-[#AA7C11] flex items-center justify-center shadow-[0_4px_10px_rgba(139,101,8,0.5)] rotate-[-12deg] before:absolute before:inset-0.5 before:rounded-full before:border before:border-dashed before:border-[#F3E5AB]/40 group/seal transition-transform duration-300">
          <div className="flex flex-col items-center text-center justify-center">
            <span className="text-[5px] font-bold tracking-[0.1em] text-white/95 uppercase leading-none font-mono">DIRECT</span>
            <div className="w-2 h-2 rounded-full bg-white/25 my-0.5 flex items-center justify-center">
              <span className="text-[6px] text-[#F3E5AB] font-black">✓</span>
            </div>
            <span className="text-[5px] font-bold tracking-[0.05em] text-[#F3E5AB] uppercase leading-none font-sans">OWNER</span>
          </div>
        </div>
      </div>

      {/* Interactive Carousel Indicators (Dots) */}
      {photos.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-ink/75 backdrop-blur-md px-3 py-1.5 rounded-full z-10 transition-all border border-white/10 shadow-lg">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeIndex 
                  ? 'bg-white w-4' 
                  : 'bg-white/40 hover:bg-white/70 w-1.5'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Bottom overlay for Price, Compare, and Favorite */}
      <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-10">
        <div className="bg-ink/95 backdrop-blur-md text-white px-4 py-2 rounded-lg flex items-center gap-3 border border-white/10 shadow-xl">
          <span className="text-lg font-bold font-mono tracking-tight text-white">₹{prop.price.toLocaleString()}</span>
          <div className="w-px h-5 bg-white/20" />
          <span className="text-[10px] font-black text-sage uppercase tracking-widest">0% Fees</span>
        </div>
        <div className="flex items-center gap-2">
          {toggleCompare && (
            <button 
              onClick={(e) => toggleCompare(propertyId, e)}
              className={`w-10 h-10 backdrop-blur-md rounded-lg flex items-center justify-center transition-all shadow-xl cursor-pointer ${
                comparedPropertyIds.includes(propertyId)
                  ? 'bg-terracotta text-white hover:bg-terracotta-dark'
                  : 'bg-white/95 text-ink hover:text-terracotta hover:scale-105'
              }`}
              title={comparedPropertyIds.includes(propertyId) ? "Remove from Compare Matrix" : "Add to Compare Matrix"}
            >
              <Scale className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
          <button 
            onClick={(e) => toggleFavorite(propertyId, e)}
            className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-lg flex items-center justify-center text-ink hover:text-rose-500 hover:scale-105 transition-all shadow-xl cursor-pointer"
            aria-label="Add to favorites"
            title="Bookmark Property"
          >
            <Heart className={`w-4 h-4 transition-colors ${favorites.includes(propertyId) ? 'fill-rose-500 text-rose-500' : 'text-ink'}`} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
