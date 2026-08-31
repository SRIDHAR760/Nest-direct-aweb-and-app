from pathlib import Path
import re

OWNER = Path('web/src/components/OwnerPortal.tsx')
APP = Path('web/src/App.tsx')


def patch_owner_portal():
    s = OWNER.read_text(encoding='utf-8')

    # The old implementation stored FileReader base64 data URLs directly in the
    # Firestore `photos` array. Large images can make the Firestore document
    # exceed its 1 MiB limit. Keep the preview in React state, but upload the
    # actual data URL to Firebase Storage before creating the Firestore document.
    if "import { savePropertyToFirestore, uploadPropertyPhoto } from '../firebase';" not in s:
        s = s.replace(
            "import { savePropertyToFirestore } from '../firebase';",
            "import { savePropertyToFirestore, uploadPropertyPhoto } from '../firebase';"
        )

    pattern = re.compile(
        r"  const handleSubmit = async \(e: React\.FormEvent\) => \{.*?\n  \};\n\n  return \(",
        re.S,
    )

    new_submit = r'''  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title || !address || !description) {
      setFormError('Please fill out all required fields.');
      return;
    }

    const user = currentUser;
    if (!user) {
      setFormError('Please sign in as an Owner before submitting a property.');
      return;
    }

    const nonBlankUrls = photoUrlInputs.map(url => url.trim()).filter(url => url.length > 0);
    const invalidUrls = nonBlankUrls.filter(url => !isValidImageUrl(url));
    if (invalidUrls.length > 0) {
      setFormError(`We found ${invalidUrls.length} invalid image link(s). Image URLs must start with http:// or https:// and have a supported image extension or trusted image host.`);
      document.getElementById('owner-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const amenities = amenitiesText.split(',').map(a => a.trim()).filter(a => a.length > 0);
    const priceNum = parseFloat(price) || 1000;
    const depositNum = parseFloat(deposit) || priceNum;
    const brokerSavings = Math.round(priceNum);
    const propertyId = `my-prop-${Date.now()}`;

    const newProp: Property = {
      id: propertyId,
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
      photos: [],
      ownerName: ownerName ? `${ownerName} (You)` : 'Direct Owner (You)',
      ownerPhone: ownerPhone || '+91 99405 88223',
      ownerEmail: ownerEmail || user.email || 'owner@nestdirect-verified.in',
      ownerAvatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      ownerVerified: false,
      createdAt: new Date().toISOString(),
      brokerSavings
    };

    try {
      // IMPORTANT: never put image base64 data directly into Firestore.
      // Upload each local image to Firebase Storage and store only its URL.
      const uploadedPhotoUrls: string[] = [];
      for (let i = 0; i < customPhotos.length; i++) {
        const dataUrl = customPhotos[i];
        if (!dataUrl.startsWith('data:')) continue;
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) {
          throw new Error(`Photo ${i + 1} is not a valid image.`);
        }
        if (blob.size > 5 * 1024 * 1024) {
          throw new Error(`Photo ${i + 1} is larger than 5 MB. Please choose a smaller image.`);
        }
        const extension = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
        const file = new File([blob], `property-${propertyId}-${i + 1}.${extension}`, { type: blob.type });
        const downloadUrl = await uploadPropertyPhoto(propertyId, file);
        uploadedPhotoUrls.push(downloadUrl);
      }

      const externalPhotoUrls = nonBlankUrls.length > 0
        ? nonBlankUrls
        : (uploadedPhotoUrls.length === 0 ? [photoPreset] : []);

      newProp.photos = [...uploadedPhotoUrls, ...externalPhotoUrls];

      // This is the ONLY Firestore property write. It always creates PENDING,
      // never APPROVED/PUBLISHED. AdminPortal's live listener will receive it.
      await savePropertyToFirestore(newProp);

      console.log('[OWNER] Property submitted for admin review:', {
        propertyId,
        ownerId: user.uid,
        photoCount: newProp.photos.length,
        status: 'PENDING'
      });

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
    } catch (error) {
      console.error('[OWNER] Property submission failed:', error);
      setFormError(error instanceof Error ? error.message : 'Unable to submit property. Firebase write failed.');
    }
  };

  return ('''

    if not pattern.search(s):
        raise RuntimeError('OwnerPortal handleSubmit function was not found; refusing to patch blindly.')

    s = pattern.sub(new_submit, s, count=1)
    OWNER.write_text(s, encoding='utf-8')


def patch_app():
    # App.tsx already contains the approved-only public property listener in
    # current revisions. Keep this function idempotent so the workflow remains
    # safe on every push.
    s = APP.read_text(encoding='utf-8')
    required_import = 'savePropertyToFirestore'
    if required_import not in s:
        s = s.replace(
            'logoutUser, syncFavoritesToCloud, OperationType',
            'logoutUser, syncFavoritesToCloud, savePropertyToFirestore, OperationType'
        )
    APP.write_text(s, encoding='utf-8')


if __name__ == '__main__':
    patch_owner_portal()
    patch_app()
    print('NestDirect property flow patch completed successfully.')
