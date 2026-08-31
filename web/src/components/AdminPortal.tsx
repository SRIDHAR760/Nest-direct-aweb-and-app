import React, { useEffect, useState } from 'react';
import { Shield, Building, CheckCircle, XCircle, Eye, RefreshCw, LogIn, LogOut, Loader2 } from 'lucide-react';
import { auth, db, signInAdminWithEmail, getAuthErrorMessage } from '../firebase';
import { collection, doc, getDoc, onSnapshot, query, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export interface AdminPortalProps { onClose?: () => void; onSelectProperty?: (propertyId: string) => void; }
type PropertyRecord = Record<string, any> & { id: string };

export const AdminPortal: React.FC<AdminPortalProps> = ({ onClose, onSelectProperty }) => {
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [adminReady, setAdminReady] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [adminEmail, setAdminEmail] = useState('admin@nestdirect.in');
  const [adminPassword, setAdminPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // IMPORTANT: Admin access is based on the real Firebase Auth session and
  // users/{uid}.role === ADMIN. A localStorage role switch is not trusted.
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;
      setLoading(true);
      setError(null);

      if (!user) {
        setAdminReady(false);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const role = snap.exists() ? snap.data()?.role : null;
        if (role !== 'ADMIN') {
          setAdminReady(false);
          setLoading(false);
          setError('The current Firebase account is not an ADMIN. Sign in with the dedicated admin Firebase account.');
          return;
        }
        setAdminReady(true);
        setLoading(false);
      } catch (e) {
        setAdminReady(false);
        setLoading(false);
        setError(e instanceof Error ? e.message : String(e));
      }
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  // Live listener: every owner submission written to /properties as PENDING
  // is immediately delivered here. Admins can see all moderation states.
  useEffect(() => {
    if (!adminReady) return;
    setLoading(true);
    setError(null);
    const q = query(collection(db, 'properties'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const rows = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as PropertyRecord[];
      rows.sort((a, b) => String(b.submittedAt || b.createdAt || '').localeCompare(String(a.submittedAt || a.createdAt || '')));
      setProperties(rows);
      setLoading(false);
    }, err => {
      console.error('[ADMIN] properties listener failed', err);
      setError(`Firebase properties listener failed: ${err.message}`);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [adminReady]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    try {
      await signInAdminWithEmail(adminEmail, adminPassword);
      setAdminPassword('');
      setNotice('Admin Firebase authentication successful. Loading the live verification queue…');
    } catch (e) {
      console.error('[ADMIN AUTH] failed', e);
      setError(getAuthErrorMessage(e));
    } finally {
      setAuthLoading(false);
    }
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3500);
  };

  const approveProperty = async (propertyId: string) => {
    const user = auth.currentUser;
    if (!user || !adminReady) return setError('Admin session expired. Sign in again.');
    try {
      await updateDoc(doc(db, 'properties', propertyId), {
        status: 'APPROVED', verificationStatus: 'VERIFIED', isPublished: true, ownerVerified: true,
        reviewedBy: user.uid, reviewedAt: serverTimestamp(), rejectionReason: null
      });
      showNotice('Property approved and published to seekers.');
    } catch (e) {
      console.error('[ADMIN] approve failed', e);
      setError(`Approve failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const rejectProperty = async (propertyId: string) => {
    const user = auth.currentUser;
    if (!user || !adminReady) return setError('Admin session expired. Sign in again.');
    const reason = rejectReason.trim();
    if (!reason) return setError('Enter a rejection reason first.');
    try {
      await updateDoc(doc(db, 'properties', propertyId), {
        status: 'REJECTED', verificationStatus: 'REJECTED', isPublished: false,
        reviewedBy: user.uid, reviewedAt: serverTimestamp(), rejectionReason: reason
      });
      setRejectingId(null);
      setRejectReason('');
      showNotice('Property rejected. It will not appear to seekers.');
    } catch (e) {
      console.error('[ADMIN] reject failed', e);
      setError(`Reject failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const visible = properties.filter(p => filter === 'ALL' || String(p.status || '').toUpperCase() === filter);
  const pendingCount = properties.filter(p => String(p.status || '').toUpperCase() === 'PENDING').length;
  const approvedCount = properties.filter(p => String(p.status || '').toUpperCase() === 'APPROVED' && p.isPublished === true).length;
  const rejectedCount = properties.filter(p => String(p.status || '').toUpperCase() === 'REJECTED').length;

  if (!adminReady) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
        <div className="max-w-xl mx-auto mt-10 bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black uppercase tracking-tight">NestDirect Admin Authentication</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Firebase Auth + Firestore role verification</p>
            </div>
          </div>

          {error && <div className="mb-5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 p-4 text-sm">{error}</div>}
          {notice && <div className="mb-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 p-4 text-sm">{notice}</div>}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Admin Firebase Email</label>
              <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)} type="email" required className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Firebase Password</label>
              <input value={adminPassword} onChange={e => setAdminPassword(e.target.value)} type="password" required className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500" />
            </div>
            <button disabled={authLoading} type="submit" className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Sign in as Firebase Admin
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/80 leading-relaxed">
            This screen intentionally does not trust the old local ADMIN role switch. The Firebase account must have <code className="text-amber-300">users/&lt;UID&gt;.role = ADMIN</code>. This is what allows the Firestore rules to expose the moderation queue.
          </div>

          {onClose && <button onClick={onClose} className="mt-4 w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black">Back to NestDirect</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400"><Shield className="w-5 h-5" /></div>
            <div><h1 className="font-black uppercase tracking-tight">NestDirect Admin Portal</h1><p className="text-[10px] text-slate-400 uppercase tracking-widest">Live Firebase Property Verification</p></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.location.reload()} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
            <button onClick={async () => { await signOut(auth); }} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold flex items-center gap-2"><LogOut className="w-3.5 h-3.5" /> Admin Sign Out</button>
            {onClose && <button onClick={onClose} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold">Exit</button>}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-6">
        {error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 p-4 text-sm"><b>Firebase error:</b> {error}</div>}
        {notice && <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 p-4 text-sm">{notice}</div>}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5"><div className="text-xs text-slate-400 uppercase">Pending Review</div><div className="text-4xl font-black mt-2">{pendingCount}</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5"><div className="text-xs text-slate-400 uppercase">Approved & Published</div><div className="text-4xl font-black mt-2">{approvedCount}</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5"><div className="text-xs text-slate-400 uppercase">Rejected</div><div className="text-4xl font-black mt-2">{rejectedCount}</div></div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          {(['PENDING','APPROVED','REJECTED','ALL'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-xs font-black ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              {f === 'PENDING' ? `PENDING REVIEW (${pendingCount})` : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-10 text-center">Loading Firebase properties…</div>
        ) : visible.length === 0 ? (
          <div className="p-14 text-center rounded-2xl bg-slate-900 border border-slate-800">
            <Building className="mx-auto w-10 h-10 text-slate-600" />
            <p className="mt-3 font-bold">No {filter === 'ALL' ? '' : filter.toLowerCase()} properties found.</p>
            <p className="text-xs text-slate-500 mt-1">Owner submissions are read directly from the Firebase <code>/properties</code> collection in real time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map(p => {
              const status = String(p.status || 'UNKNOWN').toUpperCase();
              return (
                <article key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex flex-col lg:flex-row justify-between gap-5">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded text-[10px] font-black ${status === 'PENDING' ? 'bg-amber-500/10 text-amber-300' : status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>{status}</span>
                        <span className="text-[10px] text-slate-500">ID: {p.id}</span>
                      </div>
                      <h2 className="text-xl font-black">{p.title || 'Untitled Property'}</h2>
                      <p className="text-sm text-slate-400">Owner: <b className="text-slate-200">{p.ownerName || 'Unknown'}</b> · {p.ownerEmail || 'No email'}</p>
                      <p className="text-sm text-slate-400">Location: {p.address || '-'}, {p.city || '-'}</p>
                      <p className="text-sm text-slate-400">Rent: <b className="text-amber-300">₹{Number(p.price || 0).toLocaleString('en-IN')}</b> · {p.bedrooms || 0} BHK · {p.areaSqFt || '-'} sq.ft.</p>
                      <p className="text-xs text-slate-500">Submitted: {p.submittedAt || p.createdAt || '-'}</p>
                      {p.photos?.length > 0 && <img src={p.photos[0]} alt="Property" className="w-48 h-28 object-cover rounded-xl border border-slate-700" />}
                    </div>
                    <div className="flex items-start gap-2 shrink-0">
                      {onSelectProperty && <button onClick={() => onSelectProperty(p.id)} className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black flex items-center gap-2"><Eye className="w-4 h-4" /> REVIEW</button>}
                      {status === 'PENDING' && <>
                        <button onClick={() => approveProperty(p.id)} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black flex items-center gap-2"><CheckCircle className="w-4 h-4" /> ACCEPT</button>
                        <button onClick={() => setRejectingId(p.id)} className="px-4 py-3 rounded-xl bg-rose-500 text-white text-xs font-black flex items-center gap-2"><XCircle className="w-4 h-4" /> REJECT</button>
                      </>}
                    </div>
                  </div>

                  {rejectingId === p.id && <div className="mt-5 border-t border-slate-800 pt-5 flex flex-col md:flex-row gap-3">
                    <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none" />
                    <button onClick={() => rejectProperty(p.id)} className="px-5 py-3 rounded-xl bg-rose-600 text-white text-xs font-black">CONFIRM REJECT</button>
                    <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="px-5 py-3 rounded-xl bg-slate-800 text-xs font-black">CANCEL</button>
                  </div>}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
