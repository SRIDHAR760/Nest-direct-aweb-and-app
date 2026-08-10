import { Property, DocSection } from './types';

export const initialProperties: Property[] = [
  {
    id: 'prop-1',
    title: 'Minimalist Skylit Penthouse with Roof Terrace',
    description: 'A beautiful top-floor apartment in Nungambakkam featuring contemporary design, beautiful high ceilings, automated ventilation, and a private 300 sq.ft terrace overlooking the cathedral lanes. Direct listing from the property owner, looking for a corporate tenant or design-focused professional who appreciates clean architecture.',
    price: 35000,
    securityDeposit: 150000,
    type: 'apartment',
    address: 'Flat 4A, Sterling Road, Nungambakkam',
    city: 'Nungambakkam',
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 1200,
    amenities: ['Private Terrace', 'Modular Kitchen', 'Power Backup', '24/7 Security', 'Covered Car Parking', 'Keyless Entry'],
    photos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerName: 'Karthik Subramanian',
    ownerPhone: '+91 98401 23456',
    ownerEmail: 'karthik.s@nestdirect-verified.in',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    ownerVerified: true,
    createdAt: '2026-06-10T12:00:00Z',
    brokerSavings: 35000 // In Chennai, typical brokerage is 1 month rent
  },
  {
    id: 'prop-2',
    title: 'Vastu-Compliant 3 BHK Family Villa',
    description: 'Perfect family home situated in Besant Nagar near Elliot\'s Beach. Meticulously landscaped private front yard, high-quality teak wood doors, premium fittings, and under-sink RO water system. Directly managed by the owner. Extremely quiet avenue with immediate beach access.',
    price: 65000,
    securityDeposit: 300000,
    type: 'house',
    address: '15, Kamarajar Salai, Besant Nagar',
    city: 'Adyar',
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 2200,
    amenities: ['Vastu Compliant', 'Private Yard', 'Walk to Beach', 'Teakwood Finishes', 'Three-Phase Power', 'RO Water Filter'],
    photos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerName: 'Anitha Krishnan',
    ownerPhone: '+91 94440 98765',
    ownerEmail: 'anitha.k@nestdirect-verified.in',
    ownerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    ownerVerified: true,
    createdAt: '2026-06-12T09:30:00Z',
    brokerSavings: 65000
  },
  {
    id: 'prop-3',
    title: 'Premium Smart Studio near TIDEL Park',
    description: 'An efficient, smart micro-apartment located right on OMR IT Corridor. Perfect for tech professionals working in Sholinganallur or Perungudi. Features multi-functional modular furniture, smart climate controls, and high-speed enterprise broadband connectivity included in rent.',
    price: 18000,
    securityDeposit: 80000,
    type: 'studio',
    address: 'Tower A, 8th Floor, OMR Expressway',
    city: 'OMR',
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 480,
    amenities: ['Smart Home System', 'Walk to TIDEL Park', 'Rooftop Lounge', 'Gymnasium', 'Hi-Speed Fiber Wifi'],
    photos: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerName: 'Senthil Nathan',
    ownerPhone: '+91 81234 56789',
    ownerEmail: 'senthil.n@nestdirect-verified.in',
    ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    ownerVerified: true,
    createdAt: '2026-06-14T10:15:00Z',
    brokerSavings: 18000
  },
  {
    id: 'prop-4',
    title: 'Heritage Garden Suite in Mylapore',
    description: 'A charming garden unit located inside a carefully restored traditional heritage home in Mylapore. Features high ventilation, central open-courtyard access, absolute privacy, and peaceful quietude under mango groves. Host lives on the property and welcomes direct negotiations without brokerage.',
    price: 25000,
    securityDeposit: 100000,
    type: 'room',
    address: '22, Sannidhi Street, Near Kapaleeshwarar Temple',
    city: 'Mylapore',
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 750,
    amenities: ['Private Entrance', 'Courtyard Access', 'Traditional Architecture', 'Vegetarian Only Neighborhood', 'Bicycle Parking'],
    photos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerName: 'Balaji Srinivasan',
    ownerPhone: '+91 97890 12345',
    ownerEmail: 'balaji.srini@mylaporeheritage.org',
    ownerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
    ownerVerified: true,
    createdAt: '2026-06-15T08:00:00Z',
    brokerSavings: 25000
  },
  {
    id: 'prop-5',
    title: 'Waterfront 3 BHK Residence on ECR',
    description: 'Luxurious duplex overlooking the Bay of Bengal on East Coast Road (ECR). Open floor plan, stunning sunrise-facing glass balconies, Italian marble floors, and 2 designated covered parking slots. Direct owner listing with zero agent commissions.',
    price: 45000,
    securityDeposit: 200000,
    type: 'apartment',
    address: 'Duplex B, Oceanview Enclave, ECR',
    city: 'Adyar',
    bedrooms: 3,
    bathrooms: 3.5,
    areaSqFt: 1950,
    amenities: ['Sea View Balconies', 'Italian Marble', 'Modular Kitchen', 'Power Backup', 'Gated Community', 'Swimming Pool'],
    photos: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerName: 'Divya Venkatesh',
    ownerPhone: '+91 98840 55667',
    ownerEmail: 'divya.v@owners-hub.in',
    ownerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=300',
    ownerVerified: true,
    createdAt: '2026-06-16T14:24:00Z',
    brokerSavings: 45000
  },
  {
    id: 'prop-6',
    title: 'Eco-Friendly Modern 2 BHK Villa',
    description: 'Architect-designed green villa featuring roof integrated solar panels, rainwater harvesting system, and beautiful private sit-out in Velachery. Superb location with fast access to Phoenix Marketcity, key public transit, and major software corridors.',
    price: 32000,
    securityDeposit: 150000,
    type: 'house',
    address: '45, Rajeshwari Street, Velachery',
    city: 'OMR',
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 1150,
    amenities: ['Solar Panels', 'Rainwater Harvesting', 'Private Sitout', 'Gated Security', 'EV Charger Point'],
    photos: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerName: 'Dr. Rajesh Sundaram',
    ownerPhone: '+91 91500 88990',
    ownerEmail: 'rajesh.s@eco-homes.co.in',
    ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    ownerVerified: true,
    createdAt: '2026-06-16T16:00:00Z',
    brokerSavings: 32000
  },
  {
    id: 'prop-7',
    title: 'Executive Private Suite in Luxury Condo',
    description: 'Spacious air-conditioned master bedroom inside a beautiful premium high-rise on Chennai OMR IT Highway. Exclusive private ensuite bathroom, access to high-end modular cooking hub and modern shared living area. Direct rental lease without broker interference.',
    price: 15000,
    securityDeposit: 60000,
    type: 'room',
    address: 'Apt 2201, Shriram The Gateway, OMR',
    city: 'OMR',
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 450,
    amenities: ['Panoramic View', 'Central AC', 'Clubhouse & Pool', 'Tennis Court', 'High-Speed Elevators'],
    photos: [
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerName: 'Priya Raghavan',
    ownerPhone: '+91 99620 44556',
    ownerEmail: 'priya.ragh@omrhighrise.com',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    ownerVerified: true,
    createdAt: '2026-06-16T18:12:00Z',
    brokerSavings: 15000
  },
  {
    id: 'prop-8',
    title: 'Cozy Studio near Guindy Forest Reserve',
    description: 'Charming modern studio featuring beautiful natural lighting, wooden floor panels, and lovely direct views of the trees. Located in a safe residential enclave managed direct by a local host. Fully furnished, complete power backup.',
    price: 20000,
    securityDeposit: 80000,
    type: 'studio',
    address: '18, Sardar Patel Road, Guindy',
    city: 'Nungambakkam',
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 520,
    amenities: ['Fully Furnished', 'Forest Views', 'Full Power Backup', 'AC Unit Installed', 'Washing Machine'],
    photos: [
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerName: 'Ramesh Kumar',
    ownerPhone: '+91 94451 12233',
    ownerEmail: 'ramesh.kumar@rkhousing.in',
    ownerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
    ownerVerified: false,
    createdAt: '2026-06-16T19:45:00Z',
    brokerSavings: 20000
  },
  {
    id: 'prop-9',
    title: 'Heritage Courtyard Duplex with Private Garden',
    description: 'An elegant traditional-styled duplex villa located in the heart of Mylapore close to the Kapaleeshwarar Gateway. Features high wooden ceilings, a stunning internal courtyard open skylight, handmade Athangudi floor tiles, and a private back-garden. Renting directly to family or professionals who cherish Chennai heritage.',
    price: 52000,
    securityDeposit: 250000,
    type: 'house',
    address: '12, Kesavaperumal Sannidhi Street, Mylapore',
    city: 'Mylapore',
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 2100,
    amenities: ['Athangudi Tiles', 'Central Courtyard', 'Private Garden', 'Drinking Water Filter', 'Solar Assisted Water Heaters', 'Covered Car parking'],
    photos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerName: 'Venkatesh Prasad',
    ownerPhone: '+91 99401 54321',
    ownerEmail: 'v.prasad@nestdirect-verified.in',
    ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    ownerVerified: true,
    createdAt: '2026-06-17T09:15:00Z',
    brokerSavings: 52000
  },
  {
    id: 'prop-10',
    title: 'Smart Tech Studio Near Adyar Flyover',
    description: 'Highly space-efficient premium studio apartment customized with smart motorized space-saving fold-down bed, hidden storage systems, Alexa-integrated mood lighting, and high-performance AC. Just minutes from IIT Madras research cluster and Adyar bus terminus.',
    price: 21000,
    securityDeposit: 90000,
    type: 'studio',
    address: '6th Block, Canal Bank Road, Adyar',
    city: 'Adyar',
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 550,
    amenities: ['Motorized Furniture', 'Alexa Smart Control', 'Washing Machine', 'High-Speed Wifi Included', 'Access Control Security', 'Elevator'],
    photos: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerName: 'Meenakshi Sundaram',
    ownerPhone: '+91 91761 44556',
    ownerEmail: 'meena.sundaram@nestdirect-verified.in',
    ownerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    ownerVerified: true,
    createdAt: '2026-06-18T11:45:00Z',
    brokerSavings: 21000
  },
  {
    id: 'prop-11',
    title: 'High-Rise Lakeview 2 BHK Suite on OMR',
    description: 'Immaculate 24th-floor apartment offering direct views of the Okkiyam Maduvu lake and the OMR skyline. Generous open floor layout, high-performance soundproof double-glazed window panels, fully modular kitchen with built-in hob & chimney, and deep balconies.',
    price: 29000,
    securityDeposit: 120000,
    type: 'apartment',
    address: 'Flat 2404, DLF Garden City, OMR Corridor',
    city: 'OMR',
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 1250,
    amenities: ['Panoramic Views', 'Double-Glazed Windows', 'Modular Kitchen', 'Jogging Track', 'Infinity Swimming Pool', 'Piped Gas Supply'],
    photos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerName: 'Preetha Chandran',
    ownerPhone: '+91 98409 66778',
    ownerEmail: 'preetha.c@nestdirect-verified.in',
    ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    ownerVerified: true,
    createdAt: '2026-06-18T16:20:00Z',
    brokerSavings: 29000
  },
  {
    id: 'prop-12',
    title: 'Art Deco Luxury Suite in Nungambakkam',
    description: 'A masterpiece of classic architecture met with modern luxury, this spacious suite features solid teak wooden panels, expansive high-contrast windows overlooking mature tree canopies, marble bathrooms, and keycard gate security. Absolutely zero brokers—deal directly with owner.',
    price: 48000,
    securityDeposit: 200000,
    type: 'apartment',
    address: 'Arunachal Towers, Anderson Road, Nungambakkam',
    city: 'Nungambakkam',
    bedrooms: 2,
    bathrooms: 2.5,
    areaSqFt: 1450,
    amenities: ['Art Deco Finishes', 'Lush Tree View', 'Keyless Secure Entry', 'Video Door Phone', 'AC in Bedrooms', 'Assigned Basement Parking'],
    photos: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerName: 'Sanjay Dutt',
    ownerPhone: '+91 98224 88990',
    ownerEmail: 'sanjay.dutt@nestdirect-verified.in',
    ownerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
    ownerVerified: true,
    createdAt: '2026-06-19T10:10:00Z',
    brokerSavings: 48000
  }
];

export const documentationData: DocSection[] = [
  {
    title: '1. NestDirect Platform Architecture (Tamil Nadu)',
    description: 'NestDirect bypasses intermediaries, linking Chennai property owners and prospective tenants in a high-fidelity, secure environment. Here is our end-to-end blueprint specification:',
    points: [
      {
        title: 'Core Architecture Paradigm',
        desc: 'Hybrid-responsive application layout using an embedded viewport simulation. The frontend handles real-time filtering (by Chennai zones), instant local messaging, smart replies, and local storage state sync.'
      },
      {
        title: 'API Endpoint Specifications (REST / JSON-RPC)',
        desc: 'POST /api/v1/properties - registration of owner properties; GET /api/v1/properties?city=Adyar&type=apartment - discovery feed filter; POST /api/v1/inquires - tour appointment scheduler.'
      },
      {
        title: 'Security & Registration Audits',
        desc: 'Validates individual property tax registers and electricity connection numbers (TANGEDCO) to verify real ownership. Direct owners only—we filter out agents who list using standard catchphrases.'
      }
    ]
  },
  {
    title: '2. Database Schema (Suggested Postgres/Firestore Layout)',
    description: 'Recommended persistent models to support verified land-registry integrations and private chats:',
    points: [
      {
        title: 'Properties Table Schema',
        desc: 'id VARCHAR(64) PRIMARY KEY, title VARCHAR(120), price NUMERIC, security_deposit NUMERIC, type VARCHAR(24), street_address TEXT, owner_id VARCHAR(64) REFERENCES users(id), city VARCHAR(32), amenities VARCHAR(32)[]'
      },
      {
        title: 'Inquiries & Booking Table Schema',
        desc: 'id VARCHAR(64) PRIMARY KEY, property_id REFERENCES properties, tenant_id REFERENCES users, scheduled_date DATE, scheduled_time TIME, message TEXT, status VARCHAR(20) DEFAULT "pending"'
      },
      {
        title: 'Private Messaging Channels Schema',
        desc: 'channel_id VARCHAR(64) PRIMARY KEY, host_id REFERENCES users, guest_id REFERENCES users, created_at TIMESTAMP. Message records carry foreign key to channel_id for high-throughput query optimization.'
      }
    ]
  },
  {
    title: '3. Broker Savings & Direct Negotiation Logic',
    description: 'How NestDirect secures trust and provides maximum value directly to standard users:',
    points: [
      {
        title: 'Commission Savings Formulation (Chennai Standard)',
        desc: 'Historically, Chennai real estate brokers demand one month of rent as brokerage commission from both tenants and landlords. NestDirect completely saves this hefty upfront sum (ranging from ₹15,000 to over ₹65,000).'
      },
      {
        title: 'Direct Identity Verification',
        desc: 'Landlords complete digital Aadhaar/Aadhaar OTP verification and local land registry status matching to unlock "Verified Owner" status badges, ensuring trust and avoiding bait-and-switch listings.'
      },
      {
        title: 'Automated Lease Contract Generator',
        desc: 'Constructs an e-signable rental agreement compliant with the Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act. Eliminates the need for costly external legal drafting.'
      }
    ]
  }
];

export const smartReplies: Record<string, string[]> = {
  default: [
    "Vannakkam! Thank you for reaching out. Yes, this home is rented directly by me with absolutely zero broker commission. When would you like to schedule a direct walkthrough?",
    "Hello! Yes, the lease agreement is fully compliant with Tamil Nadu Tenancy laws, directly e-signed. Are you a remote working IT professional or corporate tenant?",
    "Thanks for your interest! The property is available immediately. I live nearby and can show you the apartment this Saturday morning!"
  ],
  'prop-1': [
    "Hello! Standard main water supply and power backup fees are included. Would you like to schedule a tour of the roof terrace this week?",
    "Hi. The apartment is very close to Sterling Road cafes. We can finalize the deal direct without any broker fees."
  ],
  'prop-2': [
    "Vanakkam. Yes, Elliot's Beach is less than a 5-minute walk from here! The garden is fully organic and maintained. Shall we coordinate a tour?",
    "Absolutely zero brokerage. The security deposit is fully negotiable for long-term tenants who maintain the house well. Let me know when you are free."
  ]
};
