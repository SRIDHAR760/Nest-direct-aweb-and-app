import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { documentationData } from '../data';
import { Property } from '../types';
import { 
  BookOpen, 
  FileText, 
  Server, 
  MessageSquare, 
  Shield, 
  Code, 
  ChevronRight, 
  CheckCircle, 
  Upload, 
  Eye, 
  UserCheck, 
  DollarSign, 
  Loader2,
  Sparkles,
  Copy,
  Download,
  RotateCcw,
  Building,
  FilePenLine,
  FileCheck
} from 'lucide-react';

interface DocsHubProps {
  properties: Property[];
  isKycVerified: boolean;
  onVerifyKyc: () => void;
  onSeedDummyData: () => Promise<boolean>;
}

export default function DocsHub({ properties, isKycVerified, onVerifyKyc, onSeedDummyData }: DocsHubProps) {
  const [activeTab, setActiveTab] = useState<'system'|'db'|'api'|'contract'|'vault'>('system');
  const [isUploading, setIsUploading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // AI Rental Agreement Drafting State
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [tenantName, setTenantName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [leaseDuration, setLeaseDuration] = useState<number>(11);
  const [customClauses, setCustomClauses] = useState<string>('Standard tenant peaceful enjoyment, no commercial subletting, pet-friendly, direct bank transfer settlements only.');
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [draftedAgreement, setDraftedAgreement] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [draftError, setDraftError] = useState<string>('');

  // Default initial fields when properties array is loaded
  useEffect(() => {
    if (properties && properties.length > 0 && !selectedPropertyId) {
      const firstProp = properties[0];
      setSelectedPropertyId(firstProp.id);
      setOwnerName(firstProp.ownerName);
      setRentAmount(firstProp.price);
      setDepositAmount(firstProp.securityDeposit || firstProp.price * 5);
    }
  }, [properties]);

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    const prop = properties.find(p => p.id === propertyId);
    if (prop) {
      setOwnerName(prop.ownerName);
      setRentAmount(prop.price);
      setDepositAmount(prop.securityDeposit || prop.price * 5);
    } else {
      setOwnerName('');
      setRentAmount(0);
      setDepositAmount(0);
    }
  };

  const handleGenerateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim()) {
      setDraftError("Please enter the Tenant Name to draft the rental agreement.");
      return;
    }
    const prop = properties.find(p => p.id === selectedPropertyId);
    const title = prop ? prop.title : "Residential Apartment, Chennai";

    setIsDrafting(true);
    setDraftError('');
    try {
      const response = await fetch('/api/generate-agreement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyTitle: title,
          rent: rentAmount,
          deposit: depositAmount,
          tenantName: tenantName,
          ownerName: ownerName,
          durationMonths: leaseDuration,
          customClauses: customClauses
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate agreement draft.");
      }

      const data = await response.json();
      setDraftedAgreement(data.agreement);
    } catch (err: any) {
      console.error(err);
      setDraftError(err.message || "An unexpected error occurred while communicating with the server.");
    } finally {
      setIsDrafting(false);
    }
  };

  const copyToClipboard = () => {
    if (!draftedAgreement) return;
    navigator.clipboard.writeText(draftedAgreement);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAgreement = () => {
    if (!draftedAgreement) return;
    const element = document.createElement("a");
    const file = new Blob([draftedAgreement], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `NestDirect_Rent_Agreement_${tenantName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      onVerifyKyc();
    }, 2500);
  };

  return (
    <div className="bg-white rounded-lg border border-stone-200 shadow-premium overflow-hidden h-full flex flex-col" id="docs-hub-root">
      {/* Docs Header */}
      <div className="bg-ink px-8 py-8 border-b border-stone-850">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/5 rounded-sm flex items-center justify-center border border-white/10">
              <BookOpen className="w-5 h-5 text-brass" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold font-display text-white tracking-tight">System Core v1.0</h2>
          </div>
          {isKycVerified && (
            <div className="flex items-center gap-2 bg-sage/20 text-sage px-3 py-1.5 rounded-sm border border-sage/30 backdrop-blur-md">
              <UserCheck className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-[9px] font-black uppercase tracking-widest">Verified Identity</span>
            </div>
          )}
        </div>
        <p className="text-stone-300 text-xs font-normal leading-relaxed max-w-xl">
          Technical specifications, neural routing schemas, and direct legal templates engineered for the Chennai rental ecosystem.
        </p>
      </div>

      {/* Docs Mode Toggles */}
      <div className="flex bg-stone-50 border-b border-stone-200 overflow-x-auto scrollbar-none px-4">
        {[
          { id: 'system', label: 'Architecture', icon: Server },
          { id: 'vault', label: 'My Vault', icon: Shield },
          { id: 'db', label: 'Neural DB', icon: Code },
          { id: 'contract', label: 'Direct Draft', icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-4 text-xs font-bold tracking-wide transition-all uppercase whitespace-nowrap relative cursor-pointer ${
              activeTab === tab.id
                ? 'text-ink bg-white'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <tab.icon className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="docsTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-terracotta" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Docs Panel Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-none" id="docs-content-area">
        {activeTab === 'vault' && (
          <div className="space-y-8 animate-fadeIn" id="panel-vault">
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-display text-ink tracking-tight">Identity Vault</h3>
              <p className="text-stone-500 font-medium text-xs leading-relaxed">
                Securely store and verify your KYC documents to enable 1-click rental applications and direct handshake eligibility.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Aadhaar Card', status: isKycVerified ? 'Verified' : 'Pending', icon: Shield },
                { label: 'PAN Card', status: isKycVerified ? 'Verified' : 'Required', icon: FileText },
                { label: 'Employment Proof', status: isKycVerified ? 'Verified' : 'Optional', icon: UserCheck },
                { label: 'Bank Statement', status: isKycVerified ? 'Verified' : 'Required', icon: DollarSign }
              ].map((doc, i) => (
                <div key={i} className="p-5 bg-stone-50 rounded-sm border border-stone-200 flex items-center justify-between group transition-all hover:bg-white hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center border border-stone-200">
                      <doc.icon className="w-5 h-5 text-stone-400 group-hover:text-terracotta transition-colors" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">{doc.label}</p>
                      <p className={`text-[8.5px] font-black uppercase tracking-widest mt-1 ${doc.status === 'Verified' ? 'text-sage' : 'text-stone-400'}`}>
                        {doc.status}
                      </p>
                    </div>
                  </div>
                  {doc.status === 'Verified' ? (
                    <CheckCircle className="w-5 h-5 text-sage" />
                  ) : (
                    <button className="text-[9px] font-black text-terracotta uppercase tracking-wider hover:underline cursor-pointer">Update</button>
                  )}
                </div>
              ))}
            </div>

            {!isKycVerified ? (
              <div className="bg-ink rounded-lg p-8 text-center space-y-6 border border-stone-800 relative overflow-hidden shadow-premium">
                <div className="relative z-10 space-y-5">
                  <div className="w-16 h-16 bg-white/5 rounded-sm flex items-center justify-center mx-auto border border-white/10 backdrop-blur-md">
                    <Upload className="w-8 h-8 text-brass" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold font-display text-white">Neural Identity Verification</h4>
                    <p className="text-stone-300 text-xs font-medium max-w-xs mx-auto leading-relaxed">
                      Instantly verify your legal standing in the Chennai rental market to bypass broker friction permanently.
                    </p>
                  </div>
                  <button 
                    onClick={simulateUpload}
                    disabled={isUploading}
                    className="bg-terracotta hover:bg-terracotta/90 disabled:bg-stone-800 text-white font-bold h-11 px-8 rounded-sm text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        Analyzing Payload...
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5" />
                        Synchronize Digital Identity
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-8 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-sage rounded-full flex items-center justify-center shadow-md">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-ink font-display">Digital Handshake Enabled</h4>
                  <p className="text-stone-500 text-xs font-medium max-w-xs">
                    Your profile is fully verified. You can now establish direct rental links with any property owner in Chennai.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-8 animate-fadeIn" id="panel-system">
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-display text-ink tracking-tight">Middleware Elimination Logic</h3>
              <p className="text-stone-500 font-medium leading-relaxed text-xs">
                The NestDirect protocol utilizes a peer-to-peer verification mechanism that maps owner-verified assets directly to tenant interest queues, bypassing the 8% - 12% brokerage surcharge typical in the Tamil Nadu market.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-parchment/40 rounded-sm border border-stone-200">
                <div className="flex items-center gap-2.5 text-ink font-bold text-xs uppercase tracking-wider mb-3">
                  <Shield className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                  P2P Security Escrow
                </div>
                <p className="text-stone-600 text-xs leading-relaxed font-medium">
                  Security deposits are locked in a dual-signature escrow wallet. Release is triggered only upon mutual digital handshake or verified lease termination.
                </p>
              </div>

              <div className="p-6 bg-stone-50 rounded-sm border border-stone-200">
                <div className="flex items-center gap-2.5 text-ink font-bold text-xs uppercase tracking-wider mb-3">
                  <Server className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                  Anti-Broker Neural Filter
                </div>
                <p className="text-stone-600 text-xs leading-relaxed font-medium">
                  Autonomous pattern recognition analyzes listing descriptions for agent markers, routing suspicious entries to automatic ownership audit queues.
                </p>
              </div>
            </div>

            <div className="border border-stone-200 rounded-sm p-6 bg-white shadow-sm">
              <h4 className="text-[9px] font-black text-stone-400 underline decoration-terracotta/30 underline-offset-4 uppercase tracking-[0.2em] mb-6">Onboarding Sequence</h4>
              <div className="space-y-6">
                {[
                  { step: '01', title: 'Asset Digitization', desc: 'Landlords register unit GPS coordinates and verified floor plans.' },
                  { step: '02', title: 'Ownership Audit', desc: 'System Cross-references tax records for live title verification.' },
                  { step: '03', title: 'Direct Handshake', desc: 'Tenant/Owner connect via private channel bypassing agency gatekeeping.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 relative">
                    <span className="text-lg font-bold text-stone-300 font-mono italic select-none">{item.step}</span>
                    <div className="space-y-0.5 pt-0.5 min-w-0">
                      <p className="font-bold text-xs text-ink uppercase tracking-wide">{item.title}</p>
                      <p className="text-xs text-stone-500 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'db' && (
          <div className="space-y-8 animate-fadeIn" id="panel-db">
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-display text-ink tracking-tight">Neural DB Schema</h3>
              <p className="text-stone-500 font-medium text-xs">
                Optimized structures for standard mapping of direct rental entities in Chennai.
              </p>
            </div>

            {/* Cloud Firestore Seeder Control Card */}
            <div className="bg-ink text-white rounded-lg p-8 border border-stone-850 shadow-premium relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-brass rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brass">Cloud Connection Active</span>
                  </div>
                  <h4 className="text-base font-bold font-display tracking-tight text-white">Direct-to-Cloud Seeding Tool</h4>
                  <p className="text-xs font-medium text-stone-300 max-w-xl leading-relaxed">
                    Force-synchronize the backend Firestore collections with the default 12 verified property listings, starter messages, and scheduling data to instantly construct an immersive sandbox.
                  </p>
                </div>
                <div>
                  <button
                    onClick={async () => {
                      setIsSeeding(true);
                      await onSeedDummyData();
                      setIsSeeding(false);
                    }}
                    disabled={isSeeding}
                    className="w-full md:w-auto bg-terracotta hover:bg-terracotta/90 disabled:bg-stone-800 text-white font-bold h-11 px-6 rounded-sm text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    {isSeeding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Seeding Cloud...
                      </>
                    ) : (
                      <>
                        <Server className="w-4 h-4 text-parchment" strokeWidth={1.5} />
                        Seed Default Dataset
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {documentationData.map((sec, idx) => (
              <div key={idx} className="bg-stone-50 rounded-sm border border-stone-200 p-6 space-y-4">
                <h4 className="text-sm font-bold font-display text-ink uppercase tracking-wider">{sec.title}</h4>
                <div className="grid gap-4">
                  {sec.points.map((pt, pIdx) => (
                    <div key={pIdx}>
                      <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest block mb-1.5 px-1 font-mono">field: {pt.title}</span>
                      <code className="block bg-ink text-parchment/90 p-4 rounded-sm font-mono text-xs leading-relaxed border border-stone-850 shadow-inner">
                        {pt.desc}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-8 animate-fadeIn" id="panel-api">
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-display text-ink tracking-tight">RESTful Interfaces</h3>
              <p className="text-stone-500 font-medium text-xs">
                Structured endpoint responses returning real-time state profiles.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { method: 'GET', url: '/api/v1/properties/unit-id', desc: 'Retrieve direct listing metadata' },
                { method: 'POST', url: '/api/v1/applications/apply', desc: 'Dispatch peer application payload' }
              ].map((api, i) => (
                <div key={i} className="bg-ink rounded-lg overflow-hidden border border-stone-850 shadow-premium">
                  <div className="bg-stone-900 px-6 py-3 flex justify-between items-center border-b border-stone-850">
                    <div className="flex items-center gap-3">
                      <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest ${api.method === 'GET' ? 'bg-brass text-ink' : 'bg-terracotta text-white'}`}>
                        {api.method}
                      </span>
                      <code className="text-xs font-bold text-stone-300 font-mono">{api.url}</code>
                    </div>
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{api.desc}</span>
                  </div>
                  <pre className="p-6 text-xs font-mono text-stone-300 overflow-x-auto scrollbar-none bg-ink">
                    {i === 0 ? 
                      `{
  "status": "success",
  "data": {
    "id": "prop-1",
    "title": "Skylit Penthouse",
    "price": 35000,
    "brokerBypass": true
  }
}` : 
                      `{
  "property_id": "unit-442",
  "applicant_id": "usr-990",
  "handshake_intent": true
}`
                    }
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="space-y-8 animate-fadeIn" id="panel-contract">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold font-display text-ink tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-terracotta animate-pulse" />
                  AI P2P Lease Draft Builder
                </h3>
                <p className="text-stone-500 text-xs mt-1">
                  Draft commission-free, legally sound tenant agreements instantly under the Tamil Nadu Tenancy Act.
                </p>
              </div>
              <span className="px-3 py-1 bg-stone-100 text-ink rounded-sm text-[9px] font-bold uppercase tracking-widest border border-stone-250">
                0% Agency Commission Model
              </span>
            </div>

            {draftError && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-sm text-xs font-semibold flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {draftError}
              </div>
            )}

            {!draftedAgreement && !isDrafting ? (
              <form onSubmit={handleGenerateAgreement} className="bg-stone-50 border border-stone-200 rounded-lg p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Property Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 block px-1">
                      1. Select Registered Property
                    </label>
                    <div className="relative">
                      <select
                        value={selectedPropertyId}
                        onChange={(e) => handlePropertyChange(e.target.value)}
                        className="w-full bg-white border border-stone-250 hover:border-terracotta focus:border-terracotta text-ink text-xs font-medium rounded-sm py-2.5 px-3 appearance-none shadow-sm focus:outline-none transition-colors"
                      >
                        <option value="">-- Choose registered listing --</option>
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} (₹{p.price.toLocaleString()}/mo)
                          </option>
                        ))}
                      </select>
                      <Building className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Tenant Name */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 block px-1">
                      2. Tenant Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        placeholder="e.g., Harish Kumar"
                        className="w-full bg-white border border-stone-250 hover:border-terracotta focus:border-terracotta text-ink text-xs font-medium rounded-sm py-2.5 px-3 shadow-sm focus:outline-none transition-colors"
                      />
                      <FilePenLine className="w-4 h-4 text-terracotta absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
                    </div>
                    {isKycVerified && (
                      <p className="text-[9px] text-sage font-bold flex items-center gap-1 px-1">
                        <CheckCircle className="w-3 h-3" /> Fully verified NestDirect profile bound.
                      </p>
                    )}
                  </div>

                  {/* Owner Name */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 block px-1">
                      3. Owner / Landlord Name
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g., Sundararajan K."
                      className="w-full bg-white border border-stone-250 hover:border-terracotta focus:border-terracotta text-ink text-xs font-medium rounded-sm py-2.5 px-3 shadow-sm focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Lease Duration */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 block px-1">
                      4. Lease Duration (Months)
                    </label>
                    <select
                      value={leaseDuration}
                      onChange={(e) => setLeaseDuration(Number(e.target.value))}
                      className="w-full bg-white border border-stone-250 hover:border-terracotta focus:border-terracotta text-ink text-xs font-medium rounded-sm py-2.5 px-3 shadow-sm focus:outline-none transition-colors"
                    >
                      <option value="6">6 Months</option>
                      <option value="11">11 Months (Standard India Term)</option>
                      <option value="12">12 Months</option>
                      <option value="22">22 Months</option>
                      <option value="24">24 Months</option>
                    </select>
                  </div>

                  {/* Monthly Rent */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 block px-1">
                      5. Monthly Rent (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={rentAmount || ''}
                      onChange={(e) => setRentAmount(Number(e.target.value))}
                      placeholder="e.g., 25000"
                      className="w-full bg-white border border-stone-250 hover:border-terracotta focus:border-terracotta text-ink text-xs font-medium rounded-sm py-2.5 px-3 shadow-sm focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Security Deposit */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 block px-1">
                      6. Refundable Security Deposit (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={depositAmount || ''}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      placeholder="e.g., 100000"
                      className="w-full bg-white border border-stone-250 hover:border-terracotta focus:border-terracotta text-ink text-xs font-medium rounded-sm py-2.5 px-3 shadow-sm focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Custom Clauses */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 block px-1">
                    7. Custom Clauses &amp; Rules
                  </label>
                  <textarea
                    rows={3}
                    value={customClauses}
                    onChange={(e) => setCustomClauses(e.target.value)}
                    placeholder="Describe any special covenants, pet policies, maintenance charge division, or utility obligations..."
                    className="w-full bg-white border border-stone-250 hover:border-terracotta focus:border-terracotta text-ink text-xs font-medium rounded-sm py-2.5 px-3 shadow-sm focus:outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[10px] text-stone-400 font-semibold max-w-sm leading-relaxed text-center sm:text-left">
                    Note: Generates a real legal residential contract layout referencing standard Chennai landlord-tenant acts without agent commissions.
                  </p>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-terracotta hover:bg-terracotta/90 text-white font-bold px-6 py-3 rounded-sm text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-parchment" strokeWidth={1.5} />
                    Draft AI Agreement
                  </button>
                </div>
              </form>
            ) : isDrafting ? (
              <div className="bg-ink border border-stone-850 rounded-lg p-8 text-center space-y-6 relative overflow-hidden animate-pulse shadow-premium">
                <div className="relative z-10 space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-sm flex items-center justify-center mx-auto">
                    <Loader2 className="w-8 h-8 text-brass animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold font-display text-white">Synthesizing P2P Legal Draft</h4>
                    <p className="text-stone-300 text-xs font-medium leading-relaxed">
                      Consulting model parameters for standard rental clauses in Chennai, bypassing agents, and configuring the dual-handshake secure escrow provisions...
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Draft Document controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-50 border border-stone-200 p-4 rounded-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-parchment text-ink rounded-sm flex items-center justify-center border border-stone-250">
                      <FileCheck className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Draft Completed Successfully</p>
                      <p className="text-[9px] text-sage font-bold uppercase tracking-widest">Commission-free Direct Contract</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2.5 bg-white border border-stone-200 text-stone-700 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-stone-50 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copied ? <CheckCircle className="w-3.5 h-3.5 text-sage" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied" : "Copy Draft"}
                    </button>
                    <button
                      onClick={downloadAgreement}
                      className="px-4 py-2.5 bg-terracotta hover:bg-terracotta/90 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-parchment" />
                      Download (.txt)
                    </button>
                    <button
                      onClick={() => {
                        setDraftedAgreement('');
                        setDraftError('');
                      }}
                      className="p-2.5 bg-white border border-stone-200 text-stone-400 hover:text-stone-600 rounded-sm transition-all cursor-pointer"
                      title="Draft New Agreement"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Elegant Scrollable Serif Contract Container */}
                <div className="bg-[#F6F3EC] border border-stone-300 rounded-sm p-8 font-serif text-xs text-ink leading-loose shadow-inner max-h-[550px] overflow-y-auto space-y-4">
                  <div className="max-w-xl mx-auto space-y-4 whitespace-pre-wrap">
                    {draftedAgreement}
                  </div>
                </div>

                {/* Visual direct digital handshakes */}
                <div className="grid grid-cols-2 gap-4 border border-stone-200 p-5 rounded-md bg-stone-50/50">
                  <div className="p-4 border border-dashed border-stone-300 rounded-sm text-center space-y-2">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Lessor Digital Node</p>
                    <p className="font-bold text-ink text-xs">{ownerName || "Direct Owner"}</p>
                    <div className="inline-flex items-center gap-1 bg-stone-100 text-ink text-[9px] font-bold px-2 py-0.5 rounded-full border border-stone-200">
                      Verified Signatory
                    </div>
                  </div>
                  <div className="p-4 border border-dashed border-stone-300 rounded-sm text-center space-y-2">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Lessee Digital Node</p>
                    <p className="font-bold text-ink text-xs">{tenantName}</p>
                    <div className={`inline-flex items-center gap-1 ${isKycVerified ? 'bg-sage/10 text-sage' : 'bg-stone-100 text-stone-500'} text-[9px] font-bold px-2 py-0.5 rounded-full border border-stone-200`}>
                      {isKycVerified ? "KYC Identity Bound" : "Pending Signature"}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em] text-center italic">
                  Draft generated and stored securely in local vault session. No intermediary has participated.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
