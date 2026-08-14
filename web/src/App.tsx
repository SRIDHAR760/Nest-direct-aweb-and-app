import React, { useState, useEffect } from 'react';
import { Property, ChatMessage, DirectInquiry, PropertyType } from './types';
import { initialProperties } from './data';
import DocsHub from './components/DocsHub';
import PropertyDetail from './components/PropertyDetail';
import OwnerPortal from './components/OwnerPortal';
import ChatSystem from './components/ChatSystem';
import GuruChatBot from './components/GuruChatBot';
import NeighborhoodMap from './components/NeighborhoodMap';
import PropertyCardImageCarousel from './components/PropertyCardImageCarousel';
import { motion, AnimatePresence } from 'motion/react';

// Firebase Integrations & auth listeners
import { auth, db, signInWithGoogle, signInGuestUser, signInWithEmail, signUpWithEmail, logoutUser, syncFavoritesToCloud, OperationType, handleFirestoreError, getAuthErrorMessage } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, getDoc, query, where, or } from 'firebase/firestore';

import { 
  Home, Search, Filter, MessageSquare, BookOpen, Heart, 
  MapPin, DollarSign, Building, Sparkles, User, Percent, 
  ChevronRight, Compass, Shield, ShieldAlert, Info, Plus,
  Grid, Bell, Check, Loader2, ArrowUpRight, Share2, ClipboardList,
  Map, Bus, Car, Bike, Zap, X, UserCheck, Wifi, Dumbbell, TrendingUp
} from 'lucide-react';

export interface Workplace {
  id: string;
  name: string;
  zone: string;
  gridX: number;
  gridY: number;
  commuteTimes: Record<string, { metro: number; auto: number; bike: number }>;
}

const workplacesData: Workplace[] = [
  { 
    id: 'iitm', 
    name: 'IIT Madras Research Park', 
    zone: 'Adyar', 
    gridX: 53,
    gridY: 56,
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
    gridX: 123,
    gridY: 36,
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
    gridX: 90,
    gridY: 100,
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
    gridX: 36,
    gridY: 126,
    commuteTimes: {
      'Nungambakkam': { metro: 15, auto: 20, bike: 12 },
      'Adyar': { metro: 12, auto: 15, bike: 10 },
      'OMR': { metro: 22, auto: 25, bike: 18 },
      'Mylapore': { metro: 4, auto: 5, bike: 3 }
    }
  }
];

const neighborhoodCenters: Record<string, { x: number; y: number }> = {
  'Adyar': { x: 53, y: 56 },
  'OMR': { x: 123, y: 36 },
  'Mylapore': { x: 36, y: 126 },
  'Nungambakkam': { x: 90, y: 100 }
};


export default function App() {
  // --- Real-Time Firebase Authentication and Storage States ---
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState<boolean>(true);
  const [cloudProfileReady, setCloudProfileReady] = useState<boolean>(false);

  // --- Real-Time Persistence State ---
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('nestdirect_properties_chennai_v4');
    return saved ? JSON.parse(saved) : initialProperties;
  });

  const [inquiries, setInquiries] = useState<DirectInquiry[]>(() => {
    const saved = localStorage.getItem('nestdirect_inquiries_chennai_v4');
    if (saved) return JSON.parse(saved);
    // Starter inquiries to demonstrate state density immediately
    return [
      {
        id: 'inq-starter-1',
        propertyId: 'prop-1',
        tenantName: 'Alex Mercer (You)',
        tenantEmail: 'bennymax@gmail.com',
        tenantPhone: '+91 99405 11223',
        visitDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
        visitTime: '02:00 PM',
        message: 'Hi Karthik, I love the Skylit penthouse listing! Bypassing agency fees saves me almost ₹35,000 upfront. Ready to visit tomorrow!',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('nestdirect_messages_chennai_v4');
    if (saved) return JSON.parse(saved);
    // Starter messages
    return [
      {
        id: 'msg-start-1',
        propertyId: 'prop-1',
        sender: 'owner',
        text: 'Hi Alex! Thanks for contacting me about my top floor penthouse directly. Since there are no brokers involved, the lease is highly flexible. When would you like to tour?',
        timestamp: '10:14 AM'
      },
      {
        id: 'msg-start-2',
        propertyId: 'prop-1',
        sender: 'tenant',
        text: 'Hello Karthik! Bypassing administrative surcharges is amazing. I can visit tomorrow around 2:00 PM if that works for you.',
        timestamp: '10:20 AM'
      }
    ];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('nestdirect_favorites_chennai_v4');
    return saved ? JSON.parse(saved) : ['prop-1', 'prop-5'];
  });

  // --- Search & Filtering States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [priceLimit, setPriceLimit] = useState<number>(100000);
  const [minBedrooms, setMinBedrooms] = useState<string>('any');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);

  // --- Commuter & Proximity States ---
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>('iitm');
  const [commuteTransitMode, setCommuteTransitMode] = useState<'metro' | 'auto' | 'bike'>('auto');
  const [maxCommuteTime, setMaxCommuteTime] = useState<number>(45);
  const [hoveredWorkplace, setHoveredWorkplace] = useState<string | null>(null);

  // --- View Control States ---
  // For Web Layout view selection: 'browse' | 'docs' | 'owner' | 'chats'
  const [webActiveSection, setWebActiveSection] = useState<'browse' | 'docs' | 'owner' | 'chats'>('browse');
  const [ownerPortalViewMode, setOwnerPortalViewMode] = useState<'dashboard' | 'add'>('dashboard');

  // --- Active elements state ---
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [activePropertyChatId, setActivePropertyChatId] = useState<string | null>('prop-1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Map Simulator active spot ---
  const [selectedMapNeighborhood, setSelectedMapNeighborhood] = useState<string>('Adyar');
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapContainerWidth, setMapContainerWidth] = useState<number>(280);
  const [activePriceTiers, setActivePriceTiers] = useState<string[]>(['budget', 'mid', 'premium']);
  const [mapScale, setMapScale] = useState<number>(1.0);

  // --- Compare Basket & Route Hoover states ---
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [comparedPropertyIds, setComparedPropertyIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // --- Onboarding & Identity States ---
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    try { return localStorage.getItem('nestdirect_onboarding_v4_done') === 'true'; } catch { return false; }
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [isKycVerified, setIsKycVerified] = useState<boolean>(() => {
    try { return localStorage.getItem('nestdirect_kyc_verified_v4') === 'true'; } catch { return false; }
  });

  // --- Auth Form & Savings Calculator States ---
  const [calcMonthlyRent, setCalcMonthlyRent] = useState<number>(30000);
  const [authTab, setAuthTab] = useState<'quick' | 'signin' | 'signup'>('quick');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const getPropertyTier = (price: number): 'budget' | 'mid' | 'premium' => {
    if (price < 22000) return 'budget';
    if (price <= 30000) return 'mid';
    return 'premium';
  };

  const getCommuteGrade = (time: number): string => {
    if (time <= 10) return 'A+';
    if (time <= 20) return 'A';
    if (time <= 30) return 'B';
    if (time <= 45) return 'C';
    return 'D';
  };

  const togglePriceTier = (tier: string) => {
    setActivePriceTiers(prev => {
      const next = prev.includes(tier) 
        ? prev.filter(t => t !== tier) 
        : [...prev, tier];
      showToast(`${tier.charAt(0).toUpperCase() + tier.slice(1)} price tier ${prev.includes(tier) ? 'deactivated' : 'activated'}`);
      return next;
    });
  };

  // Auto-shift selected neighborhood if its tier is toggled off
  useEffect(() => {
    if (activePriceTiers.length > 0) {
      const activeWards = ['Adyar', 'OMR', 'Mylapore'].filter(ward => {
        const tier = ward === 'Adyar' ? 'premium' : ward === 'Mylapore' ? 'mid' : 'budget';
        return activePriceTiers.includes(tier);
      });
      if (activeWards.length > 0 && !activeWards.includes(selectedMapNeighborhood)) {
        setSelectedMapNeighborhood(activeWards[0]);
        setSelectedCity(activeWards[0]);
      }
    }
  }, [activePriceTiers, selectedMapNeighborhood]);

  // 🔄 1. Listen to Authentication State and User Document in Real-time
  useEffect(() => {
    let userDocUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsFirebaseLoading(false);
      setCloudProfileReady(false);

      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      if (user) {
        // Broadcast logged-in session to server for automatic phone app login sync
        try {
          fetch('/api/sync-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || (user.isAnonymous ? `Guest #${user.uid.substring(0, 4)}` : 'User'),
              photoURL: user.photoURL || ''
            })
          }).catch(() => {});
        } catch (e) {}

        // Listen to the user's specific document in Firestore in real-time
        const userDocRef = doc(db, 'users', user.uid);
        userDocUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data) {
              // Functional updates prevent loops and redundant state-change triggers
              if (Array.isArray(data.favorites)) {
                setFavorites(prev => {
                  const isSame = prev.length === data.favorites.length && prev.every((v, i) => v === data.favorites[i]);
                  return isSame ? prev : data.favorites;
                });
              }
              if (typeof data.onboardingCompleted === 'boolean') {
                setOnboardingCompleted(prev => {
                  if (prev !== data.onboardingCompleted) {
                    localStorage.setItem('nestdirect_onboarding_v4_done', data.onboardingCompleted ? 'true' : 'false');
                    return data.onboardingCompleted;
                  }
                  return prev;
                });
              }
              if (typeof data.isKycVerified === 'boolean') {
                setIsKycVerified(prev => {
                  if (prev !== data.isKycVerified) {
                    localStorage.setItem('nestdirect_kyc_verified_v4', data.isKycVerified ? 'true' : 'false');
                    return data.isKycVerified;
                  }
                  return prev;
                });
              }
              setCloudProfileReady(true);
            }
          }
        }, (err) => {
          console.warn("Could not retrieve cloud profile fields in real-time:", err.message || err);
          const savedFavorites = localStorage.getItem('nestdirect_favorites_chennai_v4');
          if (savedFavorites) {
            try {
              setFavorites(JSON.parse(savedFavorites));
            } catch (jsonErr) {}
          }
          setCloudProfileReady(true);
        });
      } else {
        // Auto-login sync: If no user is logged in locally, check if PC web broadcasted an active session
        try {
          fetch('/api/sync-session')
            .then(res => res.json())
            .then(async (data) => {
              if (data?.session?.uid) {
                console.log("Auto-syncing session from PC Web:", data.session);
                // Auto-sign in as guest/user to sync session immediately
                await signInGuestUser();
              }
            })
            .catch(() => {});
        } catch (e) {}
      }
    });

    return () => {
      unsubscribe();
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }
    };
  }, []);

  // 🔄 2. Listen to Properties in Firestore (Seeds if Firestore is brand new)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'properties'), async (snapshot) => {
      if (snapshot.empty) {
        // State initializer: write standard starters to cloud
        try {
          for (const prop of initialProperties) {
            await setDoc(doc(db, 'properties', prop.id), prop);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'properties');
        }
      } else {
        const cloudProps: Property[] = [];
        snapshot.forEach((doc) => {
          cloudProps.push(doc.data() as Property);
        });
        cloudProps.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setProperties(cloudProps);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'properties');
      // Fallback: fetch from Express backend /api/properties REST API database
      fetch('/api/properties')
        .then(res => res.json())
        .then(data => {
          if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
            setProperties(data.data);
          }
        })
        .catch(() => {});
    });
    return () => unsubscribe();
  }, []);

  // 🔄 3. Listen to Inquiries in Firestore
  useEffect(() => {
    if (!currentUser) return;
    const userEmail = currentUser.email || 'anonymous@nestdirect.com';
    const q = query(
      collection(db, 'inquiries'),
      or(
        where('tenantEmail', '==', userEmail),
        where('ownerEmail', '==', userEmail)
      )
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Seed starter inquiries
        try {
          const starterInquiries = [
            {
              id: 'inq-starter-1',
              propertyId: 'prop-1',
              tenantName: 'Alex Mercer (You)',
              tenantEmail: 'bennymax@gmail.com',
              tenantPhone: '+91 99405 11223',
              visitDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              visitTime: '02:00 PM',
              message: 'Hi Karthik, I love the Skylit penthouse listing! Bypassing agency fees saves me almost ₹35,000 upfront. Ready to visit tomorrow!',
              status: 'pending',
              createdAt: new Date().toISOString(),
              ownerEmail: 'karthik.s@nestdirect-verified.in'
            }
          ];
          for (const inq of starterInquiries) {
            await setDoc(doc(db, 'inquiries', inq.id), inq);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'inquiries');
        }
      } else {
        const cloudInqs: DirectInquiry[] = [];
        snapshot.forEach((doc) => {
          cloudInqs.push(doc.data() as DirectInquiry);
        });
        setInquiries(cloudInqs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'inquiries');
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 🔄 4. Listen to Chat Messages in Firestore
  useEffect(() => {
    if (!currentUser) return;
    const userEmail = currentUser.email || 'anonymous@nestdirect.com';
    const q = query(
      collection(db, 'chat_messages'),
      or(
        where('tenantEmail', '==', userEmail),
        where('ownerEmail', '==', userEmail)
      )
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        try {
          const starterMessages = [
            {
              id: 'msg-start-1',
              propertyId: 'prop-1',
              sender: 'owner',
              text: 'Hi Alex! Thanks for contacting me about my top floor penthouse directly. Since there are no brokers involved, the lease is highly flexible. When would you like to tour?',
              timestamp: '10:14 AM',
              tenantEmail: 'bennymax@gmail.com',
              ownerEmail: 'karthik.s@nestdirect-verified.in'
            },
            {
              id: 'msg-start-2',
              propertyId: 'prop-1',
              sender: 'tenant',
              text: 'Hello Karthik! Bypassing administrative surcharges is amazing. I can visit tomorrow around 2:00 PM if that works for you.',
              timestamp: '10:20 AM',
              tenantEmail: 'bennymax@gmail.com',
              ownerEmail: 'karthik.s@nestdirect-verified.in'
            }
          ];
          for (const msg of starterMessages) {
            await setDoc(doc(db, 'chat_messages', msg.id), msg);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'chat_messages');
        }
      } else {
        const cloudMsgs: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          cloudMsgs.push(doc.data() as ChatMessage);
        });
        // Sort by ID is usually perfect for keeping chat messages serial
        cloudMsgs.sort((a, b) => a.id.localeCompare(b.id));
        setChatMessages(cloudMsgs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chat_messages');
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 🔄 5. Sync Local Favorites to user document when logged in
  useEffect(() => {
    if (currentUser && cloudProfileReady) {
      syncFavoritesToCloud(currentUser.uid, favorites);
    }
  }, [favorites, currentUser, cloudProfileReady]);

  // 🔄 6. Sync Onboarding and KYC states to user document when logged in
  useEffect(() => {
    if (currentUser) {
      const syncUserState = async () => {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, {
            onboardingCompleted,
            isKycVerified
          }, { merge: true });
        } catch (e) {
          console.warn("Could not sync onboarding/KYC state to user profile:", e);
        }
      };
      syncUserState();
    }
  }, [currentUser, onboardingCompleted, isKycVerified]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('nestdirect_properties_chennai_v4', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('nestdirect_inquiries_chennai_v4', JSON.stringify(inquiries));
  }, [inquiries]);

  useEffect(() => {
    localStorage.setItem('nestdirect_messages_chennai_v4', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('nestdirect_favorites_chennai_v4', JSON.stringify(favorites));
  }, [favorites]);

  // 🔄 6. Parse deep-linked comparedPropertyIds from URL parameters on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const compareParam = searchParams.get('comparedPropertyIds') || searchParams.get('compare');
    if (compareParam) {
      const ids = compareParam.split(',').map(id => id.trim()).filter(Boolean);
      if (ids.length > 0) {
        setComparedPropertyIds(ids);
        setIsCompareOpen(true);
        setTimeout(() => {
          showToast(`Loaded ${ids.length} shared properties for comparison!`);
        }, 800);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShareCompare = async () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const idsString = comparedPropertyIds.join(',');
    const link = `${baseUrl}?comparedPropertyIds=${encodeURIComponent(idsString)}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast("Comparison link copied! Send it to your roommates.");
    } catch (err) {
      // Fallback copy
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          showToast("Comparison link copied! Send it to your roommates.");
        } else {
          showToast("Failed to copy link automatically.");
        }
      } catch (e) {
        console.error("Failed to copy link:", e);
        showToast("Failed to copy link automatically.");
      }
      document.body.removeChild(textArea);
    }
  };

  // --- Listing manipulations ---
  const handleAddProperty = async (newProperty: Property) => {
    try {
      await setDoc(doc(db, 'properties', newProperty.id), newProperty);
      showToast(`Property "${newProperty.title}" successfully listed directly by owner!`);
    } catch (e) {
      setProperties(prev => [newProperty, ...prev]);
      handleFirestoreError(e, OperationType.WRITE, `properties/${newProperty.id}`);
    }
  };

  const handleUpdateInquiryStatus = async (id: string, status: 'accepted' | 'declined') => {
    try {
      await setDoc(doc(db, 'inquiries', id), { status }, { merge: true });
      showToast(`Tour schedule request has been ${status === 'accepted' ? 'accepted' : 'declined'} successfully.`);
      
      // Auto-message coordination in chat
      const targetInq = inquiries.find(i => i.id === id);
      if (targetInq) {
        const confirmText = status === 'accepted' 
          ? `Hello! I have confirmed your request to tour the property on ${targetInq.visitDate} at ${targetInq.visitTime}. See you then!`
          : `Hi there, unfortunately that specific time slot is unavailable. Please choose another date or message me here!`;
        
        const newMsg: ChatMessage = {
          id: `msg-auto-${Date.now()}`,
          propertyId: targetInq.propertyId,
          sender: 'owner',
          text: confirmText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        await setDoc(doc(db, 'chat_messages', newMsg.id), newMsg);
      }
    } catch (e) {
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status } : inq));
      handleFirestoreError(e, OperationType.WRITE, `inquiries/${id}`);
    }
  };

  const handleTogglePropertyStatus = async (propertyId: string) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return;
    const isCurrentlyAvailable = prop.status !== 'occupied';
    const newStatus: 'available' | 'occupied' = isCurrentlyAvailable ? 'occupied' : 'available';
    const updatedProp: Property = {
      ...prop,
      status: newStatus
    };
    try {
      await setDoc(doc(db, 'properties', propertyId), updatedProp);
      showToast(`Property "${prop.title}" is now marked as ${newStatus}!`);
    } catch (e) {
      setProperties(prev => prev.map(p => p.id === propertyId ? updatedProp : p));
      handleFirestoreError(e, OperationType.WRITE, `properties/${propertyId}`);
    }
  };

  const handleStartChat = (propertyId: string) => {
    setActivePropertyChatId(propertyId);
    setSelectedPropertyId(null); // Close drawer
    setWebActiveSection('chats');
    showToast("Direct Chat Session Opened!");
  };

  const handleBookVisit = async (newInquiry: DirectInquiry) => {
    try {
      await setDoc(doc(db, 'inquiries', newInquiry.id), newInquiry);
      showToast(`Walkthrough tour requested with Host directly!`);
    } catch (e) {
      setInquiries(prev => [newInquiry, ...prev]);
      handleFirestoreError(e, OperationType.WRITE, `inquiries/${newInquiry.id}`);
    }
  };

  const handleSendMessage = async (propertyId: string, text: string) => {
    // Check if the user is replying as tenant or landlord
    const property = properties.find(p => p.id === propertyId);
    const isUserOwner = property?.ownerName.includes('(You)') || (currentUser && property?.ownerEmail === currentUser.email);
    const activeEmail = currentUser?.email || 'anonymous@nestdirect.com';

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      propertyId,
      sender: isUserOwner ? 'owner' : 'tenant',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tenantEmail: isUserOwner 
        ? (chatMessages.find(m => m.propertyId === propertyId && m.tenantEmail)?.tenantEmail || 'bennymax@gmail.com')
        : activeEmail,
      ownerEmail: property?.ownerEmail || 'karthik.s@nestdirect-verified.in'
    };

    try {
      await setDoc(doc(db, 'chat_messages', newMsg.id), newMsg);
    } catch (e) {
      setChatMessages(prev => [...prev, newMsg]);
      handleFirestoreError(e, OperationType.WRITE, `chat_messages/${newMsg.id}`);
    }
  };

  const handleSeedDummyData = async (): Promise<boolean> => {
    try {
      showToast("Seeding default properties, messages, and inquiries to cloud Firestore...");
      // 1. Seed properties
      for (const prop of initialProperties) {
        await setDoc(doc(db, 'properties', prop.id), prop);
      }
      // 2. Seed starter inquiries
      const starterInquiries = [
        {
          id: 'inq-starter-1',
          propertyId: 'prop-1',
          tenantName: 'Alex Mercer (You)',
          tenantEmail: 'bennymax@gmail.com',
          tenantPhone: '+91 99405 11223',
          visitDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          visitTime: '02:00 PM',
          message: 'Hi Karthik, I love the Skylit penthouse listing! Bypassing agency fees saves me almost ₹35,000 upfront. Ready to visit tomorrow!',
          status: 'pending',
          createdAt: new Date().toISOString(),
          ownerEmail: 'karthik.s@nestdirect-verified.in'
        }
      ];
      for (const inq of starterInquiries) {
        await setDoc(doc(db, 'inquiries', inq.id), inq);
      }
      // 3. Seed starter chat messages
      const starterMessages = [
        {
          id: 'msg-start-1',
          propertyId: 'prop-1',
          sender: 'owner',
          text: 'Hi Alex! Thanks for contacting me about my top floor penthouse directly. Since there are no brokers involved, the lease is highly flexible. When would you like to tour?',
          timestamp: '10:14 AM',
          tenantEmail: 'bennymax@gmail.com',
          ownerEmail: 'karthik.s@nestdirect-verified.in'
        },
        {
          id: 'msg-start-2',
          propertyId: 'prop-1',
          sender: 'tenant',
          text: 'Hello Karthik! Bypassing administrative surcharges is amazing. I can visit tomorrow around 2:00 PM if that works for you.',
          timestamp: '10:20 AM',
          tenantEmail: 'bennymax@gmail.com',
          ownerEmail: 'karthik.s@nestdirect-verified.in'
        }
      ];
      for (const msg of starterMessages) {
        await setDoc(doc(db, 'chat_messages', msg.id), msg);
      }
      showToast("Cloud Firestore successfully populated with standard Chennai listings!");
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'all_collections');
      return false;
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const exists = prev.includes(id);
      if (exists) {
        showToast("Removed from bookmarks");
        return prev.filter(fId => fId !== id);
      } else {
        showToast("Property bookmarked!");
        return [...prev, id];
      }
    });
  };

  const toggleCompare = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setComparedPropertyIds(prev => {
      if (prev.includes(id)) {
        showToast("Removed from comparison matrix");
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 3) {
          showToast("Maximum 3 properties can be compared simultaneously");
          return prev;
        }
        showToast("Added to comparison matrix");
        return [...prev, id];
      }
    });
  };

  const getCommuteTime = (cityZone: string, workplaceId: string, mode: 'metro' | 'auto' | 'bike'): number => {
    const workplace = workplacesData.find(w => w.id === workplaceId);
    if (!workplace) return 15;
    // Map ward names gracefully
    const mappedZone = cityZone === 'Adyar' ? 'Adyar' : cityZone === 'OMR' ? 'OMR' : cityZone === 'Mylapore' ? 'Mylapore' : 'Nungambakkam';
    return workplace.commuteTimes[mappedZone]?.[mode] ?? 15;
  };

  // --- Filtering & Sorting Calculations ---
  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = selectedCity === 'All' || p.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesType = selectedType === 'All' || p.type === selectedType.toLowerCase();
    const matchesPrice = p.price <= priceLimit;
    
    let matchesBeds = true;
    if (minBedrooms !== 'any') {
      if (minBedrooms === '3+') {
        matchesBeds = p.bedrooms >= 3;
      } else {
        matchesBeds = p.bedrooms === parseInt(minBedrooms);
      }
    }
    
    const matchesVerified = !onlyVerified || p.ownerVerified;
    const matchesTier = activePriceTiers.includes(getPropertyTier(p.price));
    
    // Commute filtering
    const commuteTime = getCommuteTime(p.city, selectedWorkplace, commuteTransitMode);
    const matchesCommute = commuteTime <= maxCommuteTime;

    return matchesSearch && matchesCity && matchesType && matchesPrice && matchesBeds && matchesVerified && matchesTier && matchesCommute;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const isFilterActive = searchQuery !== '' || 
                         selectedCity !== 'All' || 
                         selectedType !== 'All' || 
                         priceLimit < 100000 || 
                         minBedrooms !== 'any' || 
                         onlyVerified || 
                         activePriceTiers.length < 3 || 
                         maxCommuteTime !== 45;

  const totalSavingsCommissions = filteredProperties.reduce((sum, p) => sum + p.brokerSavings, 0);

  // --- Commute Route calculations for map overlay ---
  const activeRouteOriginZone = (() => {
    if (hoveredPropertyId) {
      const p = properties.find(x => x.id === hoveredPropertyId);
      if (p) return p.city;
    }
    if (hoveredNeighborhood) return hoveredNeighborhood;
    return selectedMapNeighborhood;
  })();

  const activeRouteOrigin = neighborhoodCenters[activeRouteOriginZone] || neighborhoodCenters['Adyar'];
  const activeRouteDest = workplacesData.find(w => w.id === selectedWorkplace) || workplacesData[0];
  const routeColor = commuteTransitMode === 'metro' ? '#3b82f6' : commuteTransitMode === 'auto' ? '#fbbf24' : '#10b981';

  // --- Mock Neighborhood Mapping simulator ---
  const neighborhoodData: Record<string, { desc: string; coords: string; avgRent: number; directCount: number }> = {
    'Adyar': { desc: 'Premium beachside avenues, elite standalone houses, modern rooftop lofts, and Elliot\'s walk.', coords: 'M 40,40 L 70,50 L 50,80 Z', avgRent: 45000, directCount: 2 },
    'OMR': { desc: 'The major IT Express Highway, modern high-rise tech apartments, co-living micro-studios.', coords: 'M 110,30 L 140,20 L 120,60 Z', avgRent: 21000, directCount: 3 },
    'Mylapore': { desc: 'Historic temple quarter containing traditional brass shops, lively alleys, and pure filter coffee.', coords: 'M 10,120 L 60,110 L 40,150 Z', avgRent: 25000, directCount: 1 },
    'Nungambakkam': { desc: 'Upscale heart of Chennai, rich commercial avenues, luxury high-rises, and prime residential leafy streets.', coords: 'M 80,75 L 110,95 L 75,115 Z', avgRent: 35000, directCount: 2 }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#1A1D1F] font-sans antialiased" id="nestdirect-app-scope">
      
      {/* 🚀 TOAST ALERTS */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#1A1D1F] text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3 backdrop-blur-xl"
          >
            <Sparkles className="w-5 h-5 text-terracotta/70 shrink-0" />
            <span className="text-sm font-semibold tracking-tight">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📊 ONBOARDING PORTAL */}
      <AnimatePresence>
        {!onboardingCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#F6F3EC] flex items-center justify-center p-4 sm:p-8 z-[90] overflow-y-auto"
          >
            {/* If onboarding was already completed before, allow canceling the login screen */}
            {localStorage.getItem('nestdirect_onboarding_v4_done') === 'true' && (
              <button 
                onClick={() => setOnboardingCompleted(true)}
                className="absolute top-6 right-6 p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-full shadow-lg transition-all text-slate-500 hover:text-black z-[100] cursor-pointer"
                title="Go Back"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Product Preview */}
              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="hidden lg:block relative"
              >
                <div className="w-[450px] h-[600px] bg-white rounded-[4rem] shadow-premium border border-slate-100 overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-white text-4xl font-extrabold font-display leading-tight">Modern Living. <br/>Direct from Owners.</h3>
                    <p className="text-white/70 mt-4 font-medium">Bypass fees and find your dream home in Chennai.</p>
                  </div>
                </div>
              </motion.div>

              {/* Login Actions */}
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-ink">
                    <Home className="w-8 h-8 text-terracotta" strokeWidth={1.5} />
                    <span className="text-xl font-bold font-display tracking-tight text-ink">NestDirect</span>
                  </div>
                  <h1 className="text-4xl font-bold font-display tracking-tight leading-[1.1] text-ink">Direct renting <span className="text-terracotta">without fees</span></h1>
                  <p className="text-stone-500 text-sm font-medium max-w-md">Connect securely with verified property owners in Chennai. Save up to ₹50,000 in broker charges.</p>
                </div>

                {/* Authentication Tabs */}
                <div className="bg-white border border-stone-200 shadow-premium rounded-lg p-6 space-y-6">
                  <div className="flex border-b border-stone-100 pb-3 gap-2">
                    <button
                      onClick={() => { setAuthTab('quick'); setAuthError(null); }}
                      className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${authTab === 'quick' ? 'border-b-2 border-terracotta text-terracotta' : 'border-transparent text-stone-400 hover:text-stone-700'}`}
                    >
                      Quick Access
                    </button>
                    <button
                      onClick={() => { setAuthTab('signin'); setAuthError(null); }}
                      className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${authTab === 'signin' ? 'border-b-2 border-terracotta text-terracotta' : 'border-transparent text-stone-400 hover:text-stone-700'}`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setAuthTab('signup'); setAuthError(null); }}
                      className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${authTab === 'signup' ? 'border-b-2 border-terracotta text-terracotta' : 'border-transparent text-stone-400 hover:text-stone-700'}`}
                    >
                      Register
                    </button>
                  </div>

                  {authError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-sm font-medium flex gap-2.5 items-start">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {/* TAB 1: QUICK ACCESS */}
                  {authTab === 'quick' && (
                    <div className="space-y-4">
                      <button
                        disabled={isAuthenticating}
                        onClick={async () => {
                          setIsAuthenticating(true);
                          setAuthError(null);
                          try {
                            const user = await signInWithGoogle();
                            if (user) {
                              localStorage.setItem('nestdirect_onboarding_v4_done', 'true');
                              setOnboardingCompleted(true);
                              showToast(`Welcome, ${user.displayName || 'Guest'}`);
                            }
                          } catch (error: any) {
                            console.warn("Google sign-in popup error context:", error);
                            setAuthError(getAuthErrorMessage(error));
                          } finally {
                            setIsAuthenticating(false);
                          }
                        }}
                        className="w-full h-12 bg-ink hover:bg-ink/90 text-white rounded-sm font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isAuthenticating ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4 text-brass" />}
                        Continue with Google
                      </button>

                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-stone-150"></div>
                        <span className="flex-shrink mx-4 text-[9px] text-stone-400 font-bold uppercase tracking-widest">Or instant guest mode</span>
                        <div className="flex-grow border-t border-stone-150"></div>
                      </div>

                      <button
                        disabled={isAuthenticating}
                        onClick={async () => {
                          setIsAuthenticating(true);
                          setAuthError(null);
                          try {
                            const user = await signInGuestUser();
                            if (user) {
                              localStorage.setItem('nestdirect_onboarding_v4_done', 'true');
                              setOnboardingCompleted(true);
                              showToast("Logged in as Guest User successfully!");
                            }
                          } catch (error: any) {
                            console.warn("Guest sign-in error context:", error);
                            setAuthError(getAuthErrorMessage(error));
                          } finally {
                            setIsAuthenticating(false);
                          }
                        }}
                        className="w-full h-12 bg-parchment hover:bg-stone-200/50 text-ink rounded-sm font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all border border-stone-300 cursor-pointer disabled:opacity-50"
                      >
                        {isAuthenticating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-terracotta" />}
                        Instant Guest Access (One-Click)
                      </button>

                      <button
                        onClick={() => {
                          localStorage.setItem('nestdirect_onboarding_v4_done', 'true');
                          setOnboardingCompleted(true);
                          showToast("Browsing preview with local fallback");
                        }}
                        className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-bold underline transition-all pt-2"
                      >
                        Continue browsing as offline visitor
                      </button>
                    </div>
                  )}

                  {/* TAB 2: EMAIL LOGIN */}
                  {authTab === 'signin' && (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!authEmail || !authPassword) {
                         setAuthError("Please fill in all fields.");
                         return;
                      }
                      setIsAuthenticating(true);
                      setAuthError(null);
                      try {
                        const user = await signInWithEmail(authEmail, authPassword);
                        if (user) {
                          localStorage.setItem('nestdirect_onboarding_v4_done', 'true');
                          setOnboardingCompleted(true);
                          showToast(`Welcome back, ${user.displayName || 'User'}`);
                        }
                      } catch (error: any) {
                        console.warn("Email sign-in error context:", error);
                        setAuthError(getAuthErrorMessage(error));
                      } finally {
                        setIsAuthenticating(false);
                      }
                    }} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                        <input
                          type="email"
                          placeholder="yourname@gmail.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-terracotta transition-all font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-terracotta transition-all font-medium"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isAuthenticating}
                        className="w-full h-12 bg-[#1A1D1F] hover:bg-black text-white rounded-lg font-bold flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In with Email"}
                      </button>
                    </form>
                  )}

                  {/* TAB 3: REGISTER */}
                  {authTab === 'signup' && (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!authName || !authEmail || !authPassword) {
                        setAuthError("All fields are required.");
                        return;
                      }
                      setIsAuthenticating(true);
                      setAuthError(null);
                      try {
                        const user = await signUpWithEmail(authEmail, authPassword, authName);
                        if (user) {
                          localStorage.setItem('nestdirect_onboarding_v4_done', 'true');
                          setOnboardingCompleted(true);
                          showToast(`Account created! Welcome, ${authName}`);
                        }
                      } catch (error: any) {
                        console.warn("Email sign-up error context:", error);
                        setAuthError(getAuthErrorMessage(error));
                      } finally {
                        setIsAuthenticating(false);
                      }
                    }} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                        <input
                          type="text"
                          placeholder="Alex Mercer"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-terracotta transition-all font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                        <input
                          type="email"
                          placeholder="alex.mercer@gmail.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-terracotta transition-all font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password (min 6 chars)</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-terracotta transition-all font-medium"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isAuthenticating}
                        className="w-full h-12 bg-[#1A1D1F] hover:bg-black text-white rounded-lg font-bold flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                      </button>
                    </form>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-8">
                  <div>
                    <p className="text-xl font-bold font-mono text-slate-700">1.2k+</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Properties</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold font-mono text-slate-700">₹10M+</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Saved in Fees</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🖥️ NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setWebActiveSection('browse')}>
              <div className="w-9 h-9 bg-ink rounded-sm flex items-center justify-center text-white shadow-md transition-transform duration-300 hover:scale-105">
                <Home className="w-4.5 h-4.5" strokeWidth={1.5} />
              </div>
              <span className="text-xl font-bold font-display tracking-tight text-ink">NestDirect</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              {[
                { id: 'browse', label: 'Discover', icon: Compass },
                { id: 'chats', label: 'Messages', icon: MessageSquare },
                { id: 'owner', label: 'Owner Hub', icon: User },
                { id: 'docs', label: 'Guidelines', icon: BookOpen },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'owner') setOwnerPortalViewMode('dashboard');
                    setWebActiveSection(item.id as any);
                  }}
                  className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all font-sans relative py-1.5 ${
                    webActiveSection === item.id ? 'text-terracotta' : 'text-stone-500 hover:text-ink'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  {item.label}
                  {webActiveSection === item.id && (
                    <motion.div 
                      layoutId="activeTabUnderline" 
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-terracotta rounded-full" 
                    />
                  )}
                </button>
              ))}

              <button
                onClick={() => {
                  setOwnerPortalViewMode('add');
                  setWebActiveSection('owner');
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#12141C] hover:bg-terracotta text-white rounded-md font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-brass" strokeWidth={2} />
                Add Unit
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 pl-4 border-l border-stone-200">
                <button
                  onClick={async () => {
                    try {
                      await fetch('/api/sync-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          uid: currentUser.uid,
                          email: currentUser.email || '',
                          displayName: currentUser.displayName || 'User',
                          photoURL: currentUser.photoURL || ''
                        })
                      });
                      showToast("📱 Session synced! Mobile phone will auto-login on refresh.");
                    } catch (e) {
                      showToast("Could not sync session to server.");
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-200"
                  title="Broadcast active session to USB connected phone"
                >
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  Sync Phone
                </button>

                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold leading-none text-stone-800">{currentUser.displayName?.split(' ')[0]}</p>
                  <p className="text-[9px] text-brass font-extrabold uppercase tracking-widest mt-1">Verified Tenant</p>
                </div>
                <img src={currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'} className="w-9 h-9 rounded-full border-2 border-white shadow-md object-cover" alt="" />
                <button 
                  onClick={async () => {
                    await logoutUser();
                    fetch('/api/sync-session', { method: 'POST', body: JSON.stringify({}) }).catch(() => {});
                    localStorage.removeItem('nestdirect_onboarding_v4_done');
                    setOnboardingCompleted(false);
                    showToast("Signed out successfully");
                  }} 
                  className="p-2 bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded-sm transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setOnboardingCompleted(false);
                  setAuthTab('quick');
                  setAuthError(null);
                }}
                className="bg-ink hover:bg-ink/90 text-white px-5 py-2 rounded-sm font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12" id="web-dashboard-layout">
        {webActiveSection === 'browse' && (
          <div className="space-y-12 animate-fadeIn">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-[#12141C] p-8 md:p-14 lg:p-20 shadow-xl border border-white/5">
              <motion.div 
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 0.22, scale: 1 }}
                className="absolute inset-0 pointer-events-none"
              >
                <img src="https://images.unsplash.com/photo-1600585154340-be6199f7f009?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover" alt="" />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-10">
                <div className="space-y-4">
                  <motion.div 
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brass/15 border border-brass/30 rounded-full text-brass text-[10px] font-extrabold uppercase tracking-widest"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brass" />
                    Trusted by 10k+ verified tenants & owners
                  </motion.div>
                  <motion.h2 
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.08 }}
                    className="text-4xl md:text-6xl font-black font-display text-white leading-tight max-w-2xl tracking-tight"
                  >
                    Discover Your Perfect Space. <span className="text-terracotta">Direct From Owners.</span>
                  </motion.h2>
                </div>

                {/* SEARCH BAR (Dribbble High-End Inline Console) */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white p-3.5 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center gap-2 max-w-4xl border border-slate-100"
                >
                  <div className="flex-1 flex items-center gap-4 pl-5 w-full h-14 md:h-auto">
                    <Search className="w-5 h-5 text-terracotta" />
                    <div className="flex flex-col flex-grow text-left">
                      <span className="text-[9px] font-extrabold text-terracotta uppercase tracking-widest leading-none mb-1">Where to live</span>
                      <input 
                        type="text" 
                        placeholder="Search neighborhood or property..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none text-[#1A1D1F] font-bold placeholder-slate-400 focus:outline-none text-base"
                      />
                    </div>
                  </div>
                  <div className="hidden md:block w-px h-10 bg-slate-150 mx-2" />
                  <div className="flex-1 hidden md:flex items-center gap-4 px-4">
                    <MapPin className="w-5 h-5 text-sage" />
                    <div className="flex flex-col flex-grow text-left">
                      <span className="text-[9px] font-extrabold text-terracotta uppercase tracking-widest leading-none mb-1">Select zone</span>
                      <select 
                        value={selectedCity}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedCity(val);
                          setSelectedMapNeighborhood(val === 'All' ? 'Adyar' : val);
                        }}
                        className="bg-transparent border-none text-[#1A1D1F] font-bold focus:outline-none text-base cursor-pointer w-full"
                      >
                        {['All', 'Adyar', 'Nungambakkam', 'OMR', 'Mylapore'].map(c => <option key={c} value={c}>{c === 'All' ? 'Everywhere' : c}</option>)}
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const elem = document.getElementById('handpicked-properties');
                      if (elem) {
                        elem.scrollIntoView({ behavior: 'smooth' });
                      }
                      showToast(`Showing verified properties in ${selectedCity === 'All' ? 'all zones' : selectedCity}`);
                    }}
                    className="w-full md:w-auto h-14 px-10 bg-[#12141C] hover:bg-terracotta text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-102 active:scale-98 shadow-md cursor-pointer"
                  >
                    Explore
                  </button>
                </motion.div>
              </div>
            </section>

            {/* QUICK FILTERS */}
            <section className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-2.5">
                {['All', 'Apartment', 'House', 'Villa', 'Studio'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      selectedType === type 
                        ? 'bg-[#12141C] text-white border-[#12141C] shadow-md' 
                        : 'bg-white text-slate-600 border-slate-200/60 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-slate-200/60 rounded-lg px-4 py-2.5 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-all text-slate-700 focus:outline-none shadow-sm"
                >
                  <option value="newest">Newest Listings</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* LEFT PANE: PROPERTY LIST & FILTERS (Col 1) */}
              <div className="space-y-8">
                {/* 🌟 USER DIRECT UPLOAD CALL TO ACTION BANNER */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-r from-ink via-ink-light to-terracotta-dark rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-terracotta/10 rounded-full blur-2xl -ml-16 -mb-16" />
                  
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center text-white shrink-0 border border-white/15 shadow-md">
                      <Plus className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 text-left">
                      <span className="inline-block bg-white/15 text-brass text-[9px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-white/10">Zero Commission</span>
                      <h4 className="text-lg font-bold font-display tracking-tight leading-tight mt-1">List & Rent Units Direct from Owners</h4>
                      <p className="text-xs text-white/70 font-medium">Connect directly to avoid middlemen. Save massive sums on broker deposits.</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setWebActiveSection('owner')}
                    className="bg-white hover:bg-slate-50 text-slate-900 px-6 py-3.5 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shadow-md active:scale-95 cursor-pointer relative z-10"
                  >
                    List Unit Now
                  </button>
                </motion.div>

                <div id="handpicked-properties" className="flex items-end justify-between scroll-mt-24">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold font-display tracking-tight text-[#1A1D1F]">Handpicked Properties</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{filteredProperties.length} Verified direct units in {selectedCity === 'All' ? 'Chennai' : selectedCity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => showToast("Grid view active")}
                      className="p-2.5 bg-white border border-slate-200/60 rounded-lg hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
                      title="Grid View"
                    >
                      <Grid className="w-4 h-4 text-terracotta" />
                    </button>
                    <button 
                      onClick={() => {
                        document.getElementById('neighborhood-explorer-root')?.scrollIntoView({ behavior: 'smooth' });
                        showToast("Switched to Neighborhood Map view");
                      }}
                      className="p-2.5 bg-white border border-slate-200/60 rounded-lg hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
                      title="Interactive Map View"
                    >
                      <Map className="w-4 h-4 text-slate-400 hover:text-terracotta" />
                    </button>
                  </div>
                </div>

                {filteredProperties.length === 0 ? (
                  <div className="bg-white rounded-[2rem] py-24 text-center border border-slate-100 shadow-premium">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h4 className="text-xl font-bold text-[#1A1D1F]">No properties found</h4>
                    <p className="text-slate-500 mt-2">Try adjusting your filters to find more results in {selectedCity}.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredProperties.map((prop, idx) => {
                      const commuteMin = getCommuteTime(prop.city, selectedWorkplace, commuteTransitMode);
                      return (
                        <motion.div
                          key={prop.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ y: -4, scale: 1.002 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                            delay: idx * 0.04 
                          }}
                          onMouseEnter={() => setHoveredPropertyId(prop.id)}
                          onMouseLeave={() => setHoveredPropertyId(null)}
                          onClick={() => setSelectedPropertyId(prop.id)}
                          className="group bg-white rounded-lg border border-stone-200/80 hover:border-stone-400/80 shadow-card hover:shadow-premium transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                        >
                          <PropertyCardImageCarousel
                            photos={prop.photos}
                            propertyId={prop.id}
                            favorites={favorites}
                            toggleFavorite={toggleFavorite}
                            comparedPropertyIds={comparedPropertyIds}
                            toggleCompare={toggleCompare}
                            type={prop.type}
                            city={prop.city}
                            selectedWorkplace={selectedWorkplace}
                            commuteTransitMode={commuteTransitMode}
                            isFilterActive={isFilterActive}
                            getCommuteGrade={getCommuteGrade}
                            getCommuteTime={getCommuteTime}
                            prop={prop}
                          />

                          <div className="p-6 space-y-5 flex-1 flex flex-col justify-between bg-white">
                            <div className="space-y-3.5 text-left">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-stone-500 text-[10px] font-bold uppercase tracking-wider">
                                  <MapPin className="w-3.5 h-3.5 text-terracotta" strokeWidth={1.5} />
                                  {prop.city}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border ${
                                    prop.status === 'occupied' 
                                      ? 'bg-terracotta/10 text-terracotta border-terracotta/20' 
                                      : 'bg-sage/10 text-sage border-sage/20'
                                  }`}>
                                    {prop.status === 'occupied' ? 'Occupied' : 'Available'}
                                  </span>
                                  <div className="flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-ink rounded-sm text-[8px] font-black uppercase tracking-widest border border-stone-200">
                                    <Compass className="w-3 h-3 text-sage" strokeWidth={1.5} />
                                    {commuteMin} MINS
                                  </div>
                                </div>
                              </div>
                              <h4 className="text-lg font-semibold font-display tracking-tight text-ink group-hover:text-terracotta transition-colors leading-snug">{prop.title}</h4>
                            </div>

                            {/* Owner status toggle quick controls */}
                            {(prop.ownerName.includes('(You)') || (currentUser && prop.ownerEmail === currentUser.email)) && (
                              <div 
                                className="px-3 py-1.5 bg-parchment/65 border border-stone-200/60 rounded-md flex items-center justify-between gap-3 text-xs"
                                onClick={(e) => e.stopPropagation()} // Prevent opening details modal when clicking toggle
                              >
                                <div className="flex items-center gap-2">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${prop.status === 'occupied' ? 'bg-terracotta' : 'bg-sage'}`}></span>
                                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${prop.status === 'occupied' ? 'bg-terracotta' : 'bg-sage'}`}></span>
                                  </span>
                                  <span className="text-stone-500 font-bold uppercase tracking-wider text-[8px]">
                                    Owner Controls
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleTogglePropertyStatus(prop.id)}
                                  className={`px-2 py-1 rounded-sm font-black uppercase text-[8px] tracking-widest border transition-all cursor-pointer active:scale-95 ${
                                    prop.status === 'occupied'
                                      ? 'bg-sage text-white border-sage hover:bg-sage/90'
                                      : 'bg-terracotta text-white border-terracotta hover:bg-terracotta/90'
                                  }`}
                                >
                                  {prop.status === 'occupied' ? 'Mark Available' : 'Mark Occupied'}
                                </button>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4.5 border-t border-stone-150">
                              <div className="flex items-center gap-5 text-left">
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold font-mono text-ink leading-tight">{prop.bedrooms}</span>
                                  <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">Beds</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold font-mono text-ink leading-tight">{prop.bathrooms}</span>
                                  <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">Baths</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold font-mono text-ink leading-tight">{prop.areaSqFt}</span>
                                  <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">Sq.Ft</span>
                                </div>
                              </div>

                              <div className="flex -space-x-1.5 items-center">
                                <div className="relative">
                                  <img src={prop.ownerAvatar} className="w-7 h-7 rounded-full border-2 border-white shadow-sm object-cover" alt="" />
                                  <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-brass border-2 border-white shadow-sm flex items-center justify-center text-white" title="Verified Direct Owner">
                                    <Check className="w-2.5 h-2.5 stroke-[3px]" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT PANE: PROFESSIONAL GOOGLE MAPS ENGINE (Col 2) */}
              <aside className="sticky top-24 space-y-6">
                {/* 🎯 Workspace & Commute Controls */}
                <div className="bg-white rounded-[2rem] p-5 border border-slate-200/60 shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-sage/10 rounded-lg flex items-center justify-center text-sage border border-sage/20">
                        <Building className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-black uppercase tracking-tight text-[#1A1D1F]">Commute Target</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Active Workspace Destination</p>
                      </div>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button 
                        onClick={() => setCommuteTransitMode('auto')}
                        className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${commuteTransitMode === 'auto' ? 'bg-[#12141C] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        Car
                      </button>
                      <button 
                        onClick={() => setCommuteTransitMode('metro')}
                        className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${commuteTransitMode === 'metro' ? 'bg-terracotta text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        Metro
                      </button>
                      <button 
                        onClick={() => setCommuteTransitMode('bike')}
                        className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${commuteTransitMode === 'bike' ? 'bg-sage text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        Bike
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {workplacesData.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => setSelectedWorkplace(w.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedWorkplace === w.id 
                            ? 'bg-[#12141C] border-[#12141C] text-white shadow-md' 
                            : 'bg-slate-50 border-slate-200/60 text-[#1A1D1F] hover:bg-slate-100'
                        }`}
                      >
                        <p className="text-[10px] font-black truncate">{w.name.split(' ')[0]}</p>
                        <p className={`text-[8px] font-bold mt-0.5 ${selectedWorkplace === w.id ? 'text-white/70' : 'text-slate-400'}`}>
                          {w.zone}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🗺️ Professional Google Maps Canvas */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[600px] h-[calc(100vh-160px)]">
                  <NeighborhoodMap 
                    selectedZone={selectedCity === 'All' ? selectedMapNeighborhood : selectedCity}
                    onZoneSelect={(zone) => {
                      setSelectedCity(zone);
                      setSelectedMapNeighborhood(zone);
                      showToast(`Centered view on ${zone} properties`);
                    }}
                    neighborhoodData={neighborhoodData}
                    transitMode={commuteTransitMode}
                    selectedWorkplace={selectedWorkplace}
                    onPropertySelect={(id) => {
                      setSelectedPropertyId(id);
                      const prop = properties.find(p => p.id === id);
                      if (prop) {
                        setSelectedCity(prop.city);
                        setSelectedMapNeighborhood(prop.city);
                        const elem = document.getElementById('handpicked-properties');
                        if (elem) {
                          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        showToast(`Selected ${prop.title} in ${prop.city}`);
                      }
                    }}
                  />
                </div>

                {/* 🛡️ Interactive Verified Landlord Direct Access & Quick Match Hub */}
                <div className="bg-[#12141C] rounded-[2rem] p-6 text-white space-y-5 relative overflow-hidden shadow-2xl border border-white/10 text-left">
                  {/* Ambient background glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-400/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-400/30">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-tight text-white flex items-center gap-2">
                          Owner Direct Hub
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </h4>
                        <p className="text-[9px] text-white/40 font-extrabold uppercase tracking-widest">Verified Landlord Directory</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/20 uppercase tracking-wider">Zero Broker</span>
                  </div>

                  {/* Trust Indicators List */}
                  <div className="space-y-2 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-200">
                      <span className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Government ID Verified
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 font-extrabold">100%</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-200">
                      <span className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Direct Landlord Chat
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 font-extrabold">Instant</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-200">
                      <span className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Zero Commission Fee
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 font-extrabold">Guaranteed</span>
                    </div>
                  </div>

                  {/* Quick Category Filter Pills */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-extrabold text-white/50 uppercase tracking-widest block">Quick Filter Listings</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => { setSelectedType('apartment'); showToast('Filtered Apartment Listings'); }}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-[9px] font-bold text-left transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Building className="w-3.5 h-3.5 text-amber-400" />
                        <span>Apartments</span>
                      </button>
                      <button
                        onClick={() => { setSelectedType('house'); showToast('Filtered Independent Houses'); }}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-[9px] font-bold text-left transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Home className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Independent Houses</span>
                      </button>
                      <button
                        onClick={() => { setSelectedType('studio'); showToast('Filtered Studio Apartments'); }}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-[9px] font-bold text-left transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>Studios</span>
                      </button>
                      <button
                        onClick={() => { setSelectedType('room'); showToast('Filtered Room Listings'); }}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-[9px] font-bold text-left transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span>Private Rooms</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Chat Action Button */}
                  <button
                    onClick={() => setWebActiveSection('chats')}
                    className="w-full py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open Landlord Direct Chat
                  </button>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-extrabold text-white/40 uppercase tracking-wider">
                    <span>Active Landlords: {properties.length}+</span>
                    <span className="text-emerald-400 font-bold">100% Direct</span>
                  </div>
                </div>

                {/* 📜 Interactive Legal Rental Agreement & Tenant Protection Hub */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-[2rem] p-6 border border-slate-800 shadow-2xl space-y-5 text-left relative overflow-hidden">
                  {/* Glowing ambient background circle */}
                  <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-400 border border-amber-400/30 shadow-md">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-tight text-white flex items-center gap-2">
                          Rental Legal Hub
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        </h4>
                        <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Tamil Nadu Tenancy Act</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/30 uppercase tracking-wider">Free Draft</span>
                  </div>

                  {/* Feature Highlights Card */}
                  <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-200">
                      <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Zero-Brokerage Security Clause Included</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-200">
                      <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Standard 11-Month Rental Duration</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-200">
                      <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Instant PDF Download & e-Sign Ready</span>
                    </div>
                  </div>

                  {/* Primary Call to Action */}
                  <button
                    onClick={() => setWebActiveSection('docs')}
                    className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Draft Free Rental Agreement Now
                  </button>

                  {/* Trust Footer Badges */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      Legally Compliant
                    </span>
                    <span className="text-amber-400">100% Free Tool</span>
                  </div>
                </div>
              </aside>
            </section>
          </div>
        )}

        {webActiveSection === 'chats' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[700px] bg-white rounded-[3rem] shadow-premium border border-slate-100 overflow-hidden">
            <ChatSystem
              properties={properties}
              activePropertyId={activePropertyChatId}
              chatMessages={chatMessages}
              onSendMessage={handleSendMessage}
              onSelectPropertyChat={(id) => setActivePropertyChatId(id)}
            />
          </motion.div>
        )}



        {webActiveSection === 'owner' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-[700px] bg-white rounded-[3rem] shadow-premium border border-slate-100 overflow-hidden p-8">
            <OwnerPortal
              myProperties={properties.filter(p => p.ownerName.includes('(You)') || (currentUser && p.ownerEmail === currentUser.email))}
              inquiries={inquiries}
              onAddProperty={handleAddProperty}
              onUpdateInquiryStatus={handleUpdateInquiryStatus}
              onTogglePropertyStatus={handleTogglePropertyStatus}
              currentUser={currentUser}
              initialViewMode={ownerPortalViewMode}
            />
          </motion.div>
        )}

        {webActiveSection === 'docs' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-[700px] bg-white rounded-[3rem] shadow-premium border border-slate-100 overflow-hidden p-8">
            <DocsHub 
              properties={properties}
              isKycVerified={isKycVerified} 
              onVerifyKyc={() => {
                setIsKycVerified(true);
                localStorage.setItem('nestdirect_kyc_verified_v4', 'true');
                showToast("Identity Synchronized. You are now a Verified Tenant.");
              }}
              onSeedDummyData={handleSeedDummyData}
            />
          </motion.div>
        )}
      </main>

      {/* ========================================== */}
      {/* 📊 FLOATING COMPARISON BASKET OVERLAY BADGE */}
      {/* ========================================== */}
      {comparedPropertyIds.length > 0 && (
        <motion.div 
          id="floating-compare-hud"
          whileHover={{
            scale: [1, 1.02, 1],
            borderColor: [
              "rgba(16, 185, 129, 0.3)",
              "rgba(16, 185, 129, 0.6)",
              "rgba(16, 185, 129, 0.3)"
            ],
            boxShadow: [
              "0 0 50px -12px rgba(16,185,129,0.3)",
              "0 0 50px -4px rgba(16,185,129,0.5)",
              "0 0 50px -12px rgba(16,185,129,0.3)"
            ]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="fixed bottom-8 right-8 bg-slate-950/80 border border-terracotta/30 pl-5 pr-3 py-3 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(181,101,43,0.3)] z-40 flex items-center gap-6 animate-slideUp backdrop-blur-2xl max-w-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center border border-terracotta/20">
              <Sparkles className="w-5 h-5 text-terracotta animate-pulse shrink-0" />
            </div>
            <div>
              <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none">Analysis Loop</p>
              <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase">{comparedPropertyIds.length} Vector{comparedPropertyIds.length > 1 ? 's' : ''} Staged</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCompareOpen(true)}
              className="bg-terracotta hover:bg-terracotta-dark text-slate-950 font-black text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-terracotta/20"
            >
              Matrix
            </button>
            <button
              onClick={() => {
                setComparedPropertyIds([]);
                showToast('Matrix cleared');
              }}
              className="bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-wider w-10 h-10 flex items-center justify-center rounded-xl border border-white/5 cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* 📊 DIRECT COMPARISON SIDE-BY-SIDE DIALOG */}
      {isCompareOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 z-50 animate-fadeIn" id="compare-modal-root">
          <div className="bg-slate-900 border border-white/5 rounded-[3rem] w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-[0_0_100px_-20px_rgba(181,101,43,0.1)] animate-scaleUp">
            
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/50 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-terracotta/10 flex items-center justify-center border border-terracotta/20">
                  <Sparkles className="w-6 h-6 text-terracotta" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white font-display tracking-tight">Rental Analysis Matrix</h3>
                  <p className="text-xs text-slate-500 font-bold tracking-wide uppercase mt-0.5">Real-time Comparative Protocol • Verified Listings</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleShareCompare}
                  className="px-5 py-3 rounded-xl bg-terracotta/10 hover:bg-terracotta/20 text-terracotta font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all border border-terracotta/20 hover:border-terracotta/30 active:scale-95 cursor-pointer shrink-0"
                  title="Copy deep-link to share comparison with roommates"
                >
                  <Share2 className="w-4 h-4 text-terracotta" />
                  <span className="hidden sm:inline">Share Comparison</span>
                  <span className="sm:hidden">Share</span>
                </button>
                <button 
                  onClick={() => setIsCompareOpen(false)}
                  className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/5 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Matrix Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-8 scrollbar-thin scrollbar-thumb-white/5">
              <div className="grid grid-cols-4 gap-6 items-stretch">
                
                {/* Labels Column */}
                <div className="space-y-6 pr-4 flex flex-col justify-between py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest border-r border-white/5">
                  <div className="h-56 flex items-end pb-4 font-black">Configuration</div>
                  <div className="py-4 border-t border-white/5 flex items-center gap-2"><DollarSign className="w-4 h-4 text-terracotta" /> Economics</div>
                  <div className="py-4 border-t border-white/5 flex items-center gap-2"><Building className="w-4 h-4 text-terracotta" /> Architecture</div>
                  <div className="py-4 border-t border-white/5 flex items-center gap-2"><Compass className="w-4 h-4 text-terracotta" /> Logistics</div>
                  <div className="py-4 border-t border-white/5 flex items-center gap-2"><Sparkles className="w-4 h-4 text-terracotta" /> Direct Gain</div>
                  <div className="py-4 border-t border-white/5 flex items-center gap-2"><UserCheck className="w-4 h-4 text-terracotta" /> Validation</div>
                  <div className="py-4 border-t border-white/5 flex items-center gap-2">Inventory</div>
                  <div className="pt-6 border-t border-white/5">Protocol</div>
                </div>

                {/* Compare Properties columns (max 3) */}
                {properties.filter(p => comparedPropertyIds.includes(p.id)).map((p) => {
                  const commuteMin = getCommuteTime(p.city, selectedWorkplace, commuteTransitMode);
                  return (
                    <motion.div 
                      key={p.id} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="bg-white/90 border border-slate-100 rounded-[2.5rem] p-6 flex flex-col justify-between relative space-y-8 backdrop-blur-xl hover:shadow-terracotta/5 hover:border-terracotta/20 hover:shadow-premium transition-all duration-500 group shadow-lg shadow-slate-200/20"
                    >
                      
                      {/* Column Content 1: Header Image & Title */}
                      <div className="space-y-6 flex flex-col">
                        <div className="h-44 rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 relative shadow-inner">
                          <img referrerPolicy="no-referrer" src={p.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent" />
                          <span className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black text-slate-900 uppercase tracking-widest border border-slate-100 shadow-sm">
                            {p.type}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-base font-black text-slate-900 font-display line-clamp-2 leading-tight tracking-tight">{p.title}</h4>
                          <div className="text-[10px] text-slate-400 font-black flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                            <MapPin className="w-3.5 h-3.5 text-terracotta" />
                            {p.city}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Rent & Deposit */}
                        <div className="pt-6 border-t border-slate-50">
                          <p className="text-2xl font-black text-slate-900 font-display tracking-tight">₹{p.price.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-wider leading-none">Deposit: ₹{p.securityDeposit.toLocaleString('en-IN')}</p>
                        </div>

                        {/* Area & Space */}
                        <div className="pt-6 border-t border-slate-50 text-xs text-slate-500 font-bold">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900">{p.bedrooms}</span> Bed • <span className="text-slate-900">{p.bathrooms}</span> Bath
                          </div>
                          <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-wider leading-none">{p.areaSqFt} SQFT Luxury Space</p>
                        </div>

                        {/* Commute Time to active office */}
                        <div className="pt-6 border-t border-slate-50">
                          <div className="flex items-center gap-2 text-sm font-black text-terracotta font-display">
                            <Compass className="w-4 h-4" />
                            <span>{commuteMin} MINS COMMUTE</span>
                          </div>
                          <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1 leading-none">To Active Workspace hub</p>
                        </div>

                        {/* Middleman Saved */}
                        <div className="pt-6 border-t border-slate-50">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100">
                            <Zap className="w-3 h-3 fill-green-600" />
                            ₹{p.brokerSavings.toLocaleString('en-IN')} Saved
                          </div>
                        </div>

                        {/* Verified host */}
                        <div className="pt-6 border-t border-slate-50 flex items-center gap-4">
                          <img src={p.ownerAvatar} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm" />
                          <div className="text-[10px]">
                            <p className="font-bold text-slate-900 leading-none mb-1.5">{p.ownerName}</p>
                            <div className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-terracotta" />
                              <span className="text-[8px] font-black text-terracotta uppercase tracking-widest">Verified Host</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons (Direct Chat) */}
                      <div className="pt-8 flex gap-3 mt-auto">
                        <button 
                          onClick={() => {
                            setActivePropertyChatId(p.id);
                            setWebActiveSection('chats');
                            setIsCompareOpen(false);
                            showToast(`Encrypted Link established with ${p.ownerName}`);
                          }}
                          className="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xl shadow-slate-900/10 active:scale-[0.98]"
                        >
                          Chat Direct
                        </button>
                        <button 
                          onClick={() => {
                            setComparedPropertyIds(prev => prev.filter(id => id !== p.id));
                          }}
                          className="w-12 h-12 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-100 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                {/* If < 3 properties, show a call-to-add blank column */}
                {Array.from({ length: Math.max(0, 3 - comparedPropertyIds.length) }).map((_, idx) => (
                  <div key={idx} className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center transition-all hover:bg-slate-50 hover:border-slate-200 group">
                    <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                      <Plus className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Add Protocol</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tight leading-relaxed max-w-[120px]">Select listing to augment comparative analysis</p>
                  </div>
                ))}

              </div>
            </div>

            {/* Total savings calculation summary row */}
            <div className="p-10 bg-white border-t border-slate-100 flex justify-between items-center text-xs font-black text-slate-400 px-12 shrink-0 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center border border-terracotta/20">
                  <Sparkles className="w-5 h-5 text-terracotta" />
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-900 text-[11px] uppercase tracking-widest">Aggregate Direct Gains</span>
                  <span className="text-slate-400 text-[9px] uppercase tracking-[0.15em] mt-1">Net Direct Savings Portfolio</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900 font-display">₹{properties.filter(p => comparedPropertyIds.includes(p.id)).reduce((sum, p) => sum + p.brokerSavings, 0).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-green-600 tracking-widest font-black uppercase">Commission Avoided</p>
                </div>
                <div className="w-px h-12 bg-slate-100" />
                <button 
                  onClick={() => showToast("Comparison Report exported successfully!")}
                  className="bg-terracotta hover:bg-terracotta-dark text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-terracotta/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Export Report
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 🚀 SHARED PROPERTY DETAIL DRAW PANEL (Slid from side) */}
      {/* ==================================================== */}
      {selectedPropertyId && (
        <PropertyDetail
          property={properties.find(p => p.id === selectedPropertyId)!}
          onClose={() => setSelectedPropertyId(null)}
          onStartChat={handleStartChat}
          onBookVisit={handleBookVisit}
          allProperties={properties}
          onSelectProperty={(id) => setSelectedPropertyId(id)}
          selectedWorkplace={selectedWorkplace}
          commuteTransitMode={commuteTransitMode}
        />
      )}


    </div>
  );
}
