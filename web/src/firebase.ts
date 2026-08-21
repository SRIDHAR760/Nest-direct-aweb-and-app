import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut,
  onAuthStateChanged, User, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile, signInAnonymously
} from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, onSnapshot, query, orderBy, where,
  getDocFromServer
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
export { app, googleProvider };

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Firestore connection verified.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('[Firebase] Client is offline.');
    } else {
      console.log('[Firebase] Initialized.');
    }
  }
}
testConnection();

export async function signInWithGoogle(): Promise<User | null> {
  const result = await signInWithPopup(auth, googleProvider);
  await saveUserProfile(result.user);
  return result.user;
}

export async function signInGuestUser(): Promise<User | null> {
  const result = await signInAnonymously(auth);
  await saveUserProfile(result.user);
  return result.user;
}

export async function signInWithEmail(email: string, pass: string): Promise<User | null> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  await saveUserProfile(result.user);
  return result.user;
}

export async function signUpWithEmail(email: string, pass: string, name: string): Promise<User | null> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(result.user, { displayName: name });
  await result.user.reload();
  const updatedUser = auth.currentUser || result.user;
  await saveUserProfile(updatedUser);
  return updatedUser;
}

export async function saveUserProfile(user: User, role: 'OWNER' | 'SEEKER' | 'ADMIN' = 'SEEKER'): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const registryRef = doc(db, 'registered_users', user.uid);
  try {
    const userSnap = await getDoc(userRef);
    const generatedAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.uid)}`;
    const displayName = user.displayName || (user.isAnonymous ? `Chennai Guest #${user.uid.substring(0, 4)}` : 'Chennai Tenant');
    const photoURL = user.photoURL || generatedAvatar;
    const provider = user.isAnonymous ? 'Guest' : user.providerData?.[0]?.providerId === 'google.com' ? 'Google' : user.providerData?.[0]?.providerId === 'password' ? 'Email' : 'Mobile OTP';
    const onboardingCompleted = localStorage.getItem('nestdirect_onboarding_v4_done') === 'true';
    const isKycVerified = localStorage.getItem('nestdirect_kyc_verified_v4') === 'true';
    const joinedAt = new Date().toISOString();

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid, displayName, email: user.email || (user.isAnonymous ? 'guest@nestdirect.in' : ''),
        photoURL, provider, role, favorites: ['prop-1', 'prop-5'],
        onboardingCompleted, isKycVerified, createdAt: joinedAt
      });
      await setDoc(registryRef, {
        uid: user.uid, name: displayName, email: user.email || (user.isAnonymous ? 'guest@nestdirect.in' : ''),
        photoURL, provider, role, joinedAt, isGuest: user.isAnonymous || false,
        deviceType: /Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile' : 'Web', city: 'Chennai'
      });
    } else {
      const existingData = userSnap.data();
      await setDoc(userRef, {
        displayName: existingData.displayName || displayName,
        photoURL: existingData.photoURL || photoURL,
        role: existingData.role || role
      }, { merge: true });
      await setDoc(registryRef, {
        lastSeenAt: joinedAt, name: displayName, provider,
        role: existingData.role || role
      }, { merge: true });
    }
  } catch (error) {
    console.error('[Firebase] Error setting up user profile:', error);
    throw error;
  }
}

/**
 * Creates an owner property as PENDING. This function is deliberately the
 * single source of truth for owner property creation.
 */
export async function savePropertyToFirestore(property: any): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in as an owner before submitting a property.');

  const propId = property.id || `prop-${Date.now()}`;
  const propRef = doc(db, 'properties', propId);

  const propertyData = {
    id: propId,
    title: property.title || 'Direct Rental Property',
    description: property.description || '',
    price: Number(property.price) || 0,
    securityDeposit: property.securityDeposit != null ? Number(property.securityDeposit) : null,
    type: property.type || 'apartment',
    address: property.address || '',
    city: property.city || 'Chennai',
    bedrooms: property.bedrooms != null ? Number(property.bedrooms) : null,
    bathrooms: property.bathrooms != null ? Number(property.bathrooms) : null,
    areaSqFt: property.areaSqFt != null ? Number(property.areaSqFt) : null,
    amenities: property.amenities || [],
    photos: property.photos || [],
    ownerId: user.uid,
    ownerName: property.ownerName || user.displayName || 'Direct Owner',
    ownerPhone: property.ownerPhone || '',
    ownerEmail: user.email || property.ownerEmail || '',
    ownerAvatar: property.ownerAvatar || user.photoURL || '',
    ownerVerified: false,
    brokerSavings: property.brokerSavings != null ? Number(property.brokerSavings) : 0,
    isFeatured: false,
    status: 'PENDING',
    verificationStatus: 'PENDING',
    isPublished: false,
    availabilityStatus: 'AVAILABLE',
    createdAt: property.createdAt || new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null
  };

  try {
    await setDoc(propRef, propertyData);
    console.log(`[Firestore] Property ${propId} created as PENDING for owner ${user.uid}`);
    return propId;
  } catch (error) {
    console.error('[Firestore] Property CREATE failed:', error);
    throw error;
  }
}

export async function syncFavoritesToCloud(userId: string, favorites: string[]): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), { favorites });
  } catch (error) {
    console.error('Error syncing favorites:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function getAuthErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('auth/unauthorized-domain')) return `This domain (${window.location.hostname}) is not authorized for sign-in yet.`;
  if (raw.includes('auth/operation-not-allowed') || raw.includes('auth/admin-restricted-operation')) return 'This sign-in method is disabled in Firebase Authentication.';
  if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password') || raw.includes('auth/user-not-found')) return 'Invalid email or password.';
  if (raw.includes('auth/invalid-email')) return 'Invalid email format.';
  if (raw.includes('auth/email-already-in-use')) return 'This email is already in use.';
  if (raw.includes('auth/weak-password')) return 'Weak password. It must be at least 6 characters.';
  if (raw.includes('popup-blocked') || raw.includes('cancelled-popup-request') || raw.includes('popup-closed-by-user')) return 'Google Login popup was blocked or closed.';
  if (raw.includes('auth/network-request-failed')) return 'Network error reaching Firebase.';
  return raw;
}

export enum OperationType { CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LIST = 'list', GET = 'get', WRITE = 'write' }

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: { userId?: string | null; email?: string | null; emailVerified?: boolean | null; isAnonymous?: boolean | null; tenantId?: string | null; providerInfo?: { providerId?: string | null; email?: string | null }[] };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error), operationType, path,
    authInfo: {
      userId: auth.currentUser?.uid, email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified, isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(p => ({ providerId: p.providerId, email: p.email })) || []
    }
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function uploadPropertyPhoto(propertyId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `properties/${propertyId}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `users/${userId}/avatar_${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}
