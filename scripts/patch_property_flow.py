from pathlib import Path
import re

p = Path('web/src/components/OwnerPortal.tsx')
s = p.read_text()
start = s.index('  const handleSubmit = (e: React.FormEvent) => {')
end = s.index('\n  return (', start)
new = r'''  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title || !address || !description) {
      setFormError('Please fill out all required fields.');
      return;
    }
    const nonBlankUrls = photoUrlInputs.map(url => url.trim()).filter(url => url.length > 0);
    const invalidUrls = nonBlankUrls.filter(url => !isValidImageUrl(url));
    if (invalidUrls.length > 0) {
      setFormError(`We found ${invalidUrls.length} invalid image link(s). Image URLs must start with http:// or https:// and have standard image extensions (.jpg, .png, .webp, etc.) or point to public images.`);
      document.getElementById('owner-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const amenities = amenitiesText.split(',').map(a => a.trim()).filter(a => a.length > 0);
    const priceNum = parseFloat(price) || 1000;
    const depositNum = parseFloat(deposit) || priceNum;
    const brokerSavings = Math.round(priceNum);
    const finalPhotos = [...customPhotos, ...nonBlankUrls];
    const propertyPhotos = finalPhotos.length > 0 ? finalPhotos : [photoPreset];
    const newProp: Property = {
      id: `my-prop-${Date.now()}`,
      title, description, price: priceNum, securityDeposit: depositNum, type, address, city,
      bedrooms: parseInt(bedrooms) || 1, bathrooms: parseFloat(bathrooms) || 1,
      areaSqFt: parseInt(area) || 500, amenities, photos: propertyPhotos,
      ownerName: ownerName ? `${ownerName} (You)` : 'Direct Owner (You)',
      ownerPhone: ownerPhone || '+91 99405 88223',
      ownerEmail: ownerEmail || 'owner@nestdirect-verified.in',
      ownerAvatar: currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      ownerVerified: false,
      createdAt: new Date().toISOString(), brokerSavings
    };
    try {
      await savePropertyToFirestore(newProp);
      setFormSuccess(true);
      setTitle(''); setDescription(''); setAddress(''); setCustomPhotos([]); setPhotoUrlInputs(['']);
      setTimeout(() => { setFormSuccess(false); setViewMode('dashboard'); }, 2500);
    } catch (error) {
      console.error('[OWNER] Property submission failed:', error);
      setFormError(error instanceof Error ? error.message : 'Unable to submit property. Firebase write failed.');
    }
  };
'''
s = s[:start] + new + s[end:]
p.write_text(s)

p = Path('web/src/App.tsx')
s = p.read_text()
s = s.replace(
    "auth, db, signInWithGoogle, signInGuestUser, signInWithEmail, signUpWithEmail, logoutUser, syncFavoritesToCloud, OperationType, handleFirestoreError, getAuthErrorMessage",
    "auth, db, signInWithGoogle, signInGuestUser, signInWithEmail, signUpWithEmail, logoutUser, syncFavoritesToCloud, savePropertyToFirestore, OperationType, handleFirestoreError, getAuthErrorMessage"
)
s = re.sub(r"const \[properties, setProperties\] = useState<Property\[\]>\(\(\) => \{.*?\n  \}\);", "const [properties, setProperties] = useState<Property[]>([]);", s, count=1, flags=re.S)
start = s.index('  // 🔄 2. Listen to Properties in Firestore')
end = s.index('  // 🔄 3. Listen to Inquiries in Firestore', start)
new = r'''  // 🔄 2. Listen ONLY to approved, verified, published properties.
  useEffect(() => {
    const approvedQuery = query(
      collection(db, 'properties'),
      where('status', '==', 'APPROVED'),
      where('verificationStatus', '==', 'VERIFIED'),
      where('isPublished', '==', true)
    );
    const unsubscribe = onSnapshot(approvedQuery, (snapshot) => {
      const cloudProps = snapshot.docs.map(d => d.data() as Property);
      cloudProps.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setProperties(cloudProps);
    }, (error) => {
      console.error('[PUBLIC PROPERTIES] Approved listing query failed:', error);
      setProperties([]);
    });
    return () => unsubscribe();
  }, []);

'''
s = s[:start] + new + s[end:]
start = s.index('  const handleAddProperty = async (newProperty: Property) => {')
end = s.index('\n  const handleUpdateInquiryStatus', start)
new = r'''  const handleAddProperty = async (newProperty: Property) => {
    try {
      await savePropertyToFirestore(newProperty);
      showToast(`Property "${newProperty.title}" submitted for admin verification.`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `properties/${newProperty.id}`);
    }
  };
'''
s = s[:start] + new + s[end:]
p.write_text(s)
