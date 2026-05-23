'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useCsrf } from '@/hooks/useCsrf';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Camera,
  Info,
  Sparkles,
  X,
  Plus,
  Loader2,
  CheckCircle,
  Mountain,
  Phone,
  Mail,
  Globe,
  Instagram,
  MessageCircle,
  LogIn,
  UserPlus,
  Users,
  Building2,
  UtensilsCrossed,
  Star,
  Clock,
  Trash2,
} from 'lucide-react';
import {
  PROVINCES,
  REGIONS,
  CITIES_BY_REGION,
  ATTRACTION_TYPES,
} from '@/data/madagascar-regions';
import { useTrans } from '@/i18n';

const MapLocationPicker = dynamic(
  () => import('@/components/maps/MapLocationPicker'),
  { ssr: false }
);

// Steps: icons stay module-scoped; labels are resolved at render via t[`step${X}`]
const STEPS = [
  { id: 1, key: 'stepInfo', icon: Info },
  { id: 2, key: 'stepLocation', icon: MapPin },
  { id: 3, key: 'stepDetails', icon: Sparkles },
  { id: 4, key: 'stepPhotosContact', icon: Camera },
] as const;

// Enum values (sent to backend) — labels resolved at render via t.season_*
const BEST_SEASON_VALUES = [
  { value: 'avril-octobre', tKey: 'season_dry' },
  { value: 'novembre-mars', tKey: 'season_wet' },
  { value: 'toute-annee', tKey: 'season_yearround' },
  { value: 'autre', tKey: 'season_other' },
] as const;

const PROVIDER_SERVICE_VALUES = [
  { value: 'GUIDE', tKey: 'svc_guide' },
  { value: 'DRIVER', tKey: 'svc_driver' },
  { value: 'TOUR_OPERATOR', tKey: 'svc_touroperator' },
  { value: 'CAR_RENTAL', tKey: 'svc_carrental' },
  { value: 'PHOTOGRAPHER', tKey: 'svc_photographer' },
  { value: 'TRANSLATOR', tKey: 'svc_translator' },
  { value: 'TRAVEL_AGENCY', tKey: 'svc_travelagency' },
  { value: 'TRANSFER', tKey: 'svc_transfer' },
  { value: 'BOAT_EXCURSION', tKey: 'svc_boatexcursion' },
  { value: 'OTHER', tKey: 'svc_other' },
] as const;

// Language enum-like values stored as French (DB compat) — display via t.lang_*
const PROVIDER_LANGUAGE_VALUES = [
  { value: 'Français', tKey: 'lang_francais' },
  { value: 'Anglais', tKey: 'lang_anglais' },
  { value: 'Malgache', tKey: 'lang_malgache' },
  { value: 'Allemand', tKey: 'lang_allemand' },
  { value: 'Italien', tKey: 'lang_italien' },
  { value: 'Espagnol', tKey: 'lang_espagnol' },
  { value: 'Chinois', tKey: 'lang_chinois' },
  { value: 'Japonais', tKey: 'lang_japonais' },
  { value: 'Autre', tKey: 'lang_autre' },
] as const;

const PRICE_UNIT_VALUES = [
  { value: 'par jour', tKey: 'priceUnit_perday' },
  { value: 'par trajet', tKey: 'priceUnit_pertrip' },
  { value: 'par personne', tKey: 'priceUnit_perperson' },
  { value: 'par heure', tKey: 'priceUnit_perhour' },
  { value: 'autre', tKey: 'priceUnit_other' },
] as const;

const HOTEL_TYPE_VALUES = [
  { value: 'hotel', tKey: 'hotelType_hotel' },
  { value: 'boutique-hotel', tKey: 'hotelType_boutique' },
  { value: 'resort', tKey: 'hotelType_resort' },
  { value: 'palace', tKey: 'hotelType_palace' },
  { value: 'guesthouse', tKey: 'hotelType_guesthouse' },
  { value: 'auberge', tKey: 'hotelType_auberge' },
  { value: 'hostel', tKey: 'hotelType_hostel' },
  { value: 'lodge', tKey: 'hotelType_lodge' },
  { value: 'ecolodge', tKey: 'hotelType_ecolodge' },
  { value: 'villa', tKey: 'hotelType_villa' },
  { value: 'bungalow', tKey: 'hotelType_bungalow' },
  { value: 'apart-hotel', tKey: 'hotelType_aparthotel' },
  { value: 'pension', tKey: 'hotelType_pension' },
  { value: 'camping', tKey: 'hotelType_camping' },
  { value: 'autre-hebergement', tKey: 'hotelType_other' },
] as const;

const HOTEL_AMENITY_VALUES = [
  { value: 'wifi', tKey: 'hotelAmenity_wifi' },
  { value: 'parking', tKey: 'hotelAmenity_parking' },
  { value: 'pool', tKey: 'hotelAmenity_pool' },
  { value: 'restaurant', tKey: 'hotelAmenity_restaurant' },
  { value: 'spa', tKey: 'hotelAmenity_spa' },
  { value: 'ac', tKey: 'hotelAmenity_ac' },
  { value: 'tv', tKey: 'hotelAmenity_tv' },
  { value: 'generator', tKey: 'hotelAmenity_generator' },
  { value: 'autre', tKey: 'hotelAmenity_other' },
] as const;

const RESTAURANT_CATEGORY_VALUES = [
  { value: 'RESTAURANT', tKey: 'restCat_restaurant' },
  { value: 'GARGOTE', tKey: 'restCat_gargote' },
  { value: 'LOUNGE', tKey: 'restCat_lounge' },
  { value: 'CAFE', tKey: 'restCat_cafe' },
  { value: 'FAST_FOOD', tKey: 'restCat_fastfood' },
  { value: 'STREET_FOOD', tKey: 'restCat_streetfood' },
  { value: 'AUTRE', tKey: 'restCat_other' },
] as const;

// Cuisine types stored in French (DB compat) — display via t.cuisine_*
const CUISINE_TYPE_VALUES = [
  { value: 'Malgache', tKey: 'cuisine_malgache' },
  { value: 'Français', tKey: 'cuisine_francais' },
  { value: 'Chinois', tKey: 'cuisine_chinois' },
  { value: 'Italien', tKey: 'cuisine_italien' },
  { value: 'Indien', tKey: 'cuisine_indien' },
  { value: 'Japonais', tKey: 'cuisine_japonais' },
  { value: 'Africain', tKey: 'cuisine_africain' },
  { value: 'Fusion', tKey: 'cuisine_fusion' },
  { value: 'Autre', tKey: 'cuisine_autre' },
] as const;

const PRICE_RANGE_VALUES = [
  { value: 'BUDGET', tKey: 'priceRange_budget' },
  { value: 'MODERATE', tKey: 'priceRange_moderate' },
  { value: 'UPSCALE', tKey: 'priceRange_upscale' },
  { value: 'LUXURY', tKey: 'priceRange_luxury' },
  { value: 'AUTRE', tKey: 'priceRange_other' },
] as const;

// Vehicle types (DB values left in French where they were)
const VEHICLE_TYPE_VALUES = [
  { value: 'berline', tKey: 'vehicle_sedan' },
  { value: '4x4', tKey: 'vehicle_4x4' },
  { value: 'minibus', tKey: 'vehicle_minibus' },
  { value: 'van', tKey: 'vehicle_van' },
  { value: 'moto', tKey: 'vehicle_motorbike' },
  { value: 'autre', tKey: 'vehicle_other' },
] as const;

interface RoomTypeEntry {
  name: string;
  capacity: string;
  pricePerNight: string;
}

interface FormData {
  name: string;
  shortDescription: string;
  description: string;
  attractionType: string;
  province: string;
  region: string;
  city: string;
  district: string;
  latitude: string;
  longitude: string;
  isFree: boolean;
  entryFeeLocal: string;
  entryFeeForeign: string;
  visitDuration: string;
  bestTimeToVisit: string;
  bestSeason: string;
  isAccessible: boolean;
  hasGuide: boolean;
  hasParking: boolean;
  hasRestaurant: boolean;
  highlights: string[];
  photos: File[];
  photoUrls: string[];
  phone: string;
  email: string;
  website: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  // Type selector
  establishmentType: 'ATTRACTION' | 'PROVIDER' | 'HOTEL' | 'RESTAURANT';
  // Provider-specific
  serviceType: string;
  languages: string[];
  experience: string;
  priceFrom: string;
  priceTo: string;
  priceUnit: string;
  vehicleType: string;
  vehicleCapacity: string;
  licenseNumber: string;
  operatingZone: string;
  // Hotel-specific
  hotelType: string;
  starRating: number;
  hotelAmenities: string[];
  checkInTime: string;
  checkOutTime: string;
  roomTypes: RoomTypeEntry[];
  // Restaurant-specific
  restaurantCategory: string;
  cuisineTypes: string[];
  priceRange: string;
  avgMainCourse: string;
  avgBeer: string;
  specialties: string[];
  hasDelivery: boolean;
  hasTakeaway: boolean;
  hasReservation: boolean;
  hasWifi: boolean;
  restHasParking: boolean;
  hasGenerator: boolean;
  // Free text for "Autre" options
  customOther: Record<string, string>;
}

export default function PublierLieuPage() {
  const t = useTrans('publishPlace');
  const tt = t as Record<string, string>;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { csrfToken } = useCsrf();
  const [step, setStep] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [typeFromUrl, setTypeFromUrl] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);


  const [formData, setFormData] = useState<FormData>({
    name: '',
    shortDescription: '',
    description: '',
    attractionType: '',
    province: '',
    region: '',
    city: '',
    district: '',
    latitude: '',
    longitude: '',
    isFree: false,
    entryFeeLocal: '',
    entryFeeForeign: '',
    visitDuration: '',
    bestTimeToVisit: '',
    bestSeason: '',
    isAccessible: false,
    hasGuide: false,
    hasParking: false,
    hasRestaurant: false,
    highlights: [],
    photos: [],
    photoUrls: [],
    phone: '',
    email: '',
    website: '',
    facebook: '',
    instagram: '',
    whatsapp: '',
    establishmentType: 'ATTRACTION',
    serviceType: '',
    languages: [],
    experience: '',
    priceFrom: '',
    priceTo: '',
    priceUnit: '',
    vehicleType: '',
    vehicleCapacity: '',
    licenseNumber: '',
    operatingZone: '',
    hotelType: '',
    starRating: 0,
    hotelAmenities: [],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    roomTypes: [],
    restaurantCategory: '',
    cuisineTypes: [],
    priceRange: '',
    avgMainCourse: '',
    avgBeer: '',
    specialties: [],
    hasDelivery: false,
    hasTakeaway: false,
    hasReservation: false,
    hasWifi: false,
    restHasParking: false,
    hasGenerator: false,
    customOther: {},
  });

  const STORAGE_KEY = 'mada-spot-publier-lieu-draft';

  // Restore saved form data from sessionStorage (after login/register redirect)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) {
          // Restore form data (except photos which are File objects and can't be serialized)
          setFormData((prev) => ({ ...prev, ...parsed.formData, photos: [] }));
        }
        if (parsed.step) {
          setStep(parsed.step);
        }
        // Clear saved data after restoring
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Effet unique : pré-remplir depuis URL params + vérifier session + verrouiller le type
  // Priorité : (1) URL type+subtype, (2) session userType, (3) sélection manuelle
  useEffect(() => {
    const urlType = searchParams.get('type');
    const urlSubtype = searchParams.get('subtype');

    // (1) Verrouillage depuis les query params (parcours inscription)
    if (urlType && ['HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER'].includes(urlType)) {
      setFormData((prev) => {
        const updates: Partial<FormData> = { establishmentType: urlType as FormData['establishmentType'] };
        if (urlSubtype) {
          if (urlType === 'ATTRACTION') updates.attractionType = urlSubtype;
          else if (urlType === 'PROVIDER') updates.serviceType = urlSubtype;
          else if (urlType === 'HOTEL') updates.hotelType = urlSubtype;
          else if (urlType === 'RESTAURANT') updates.restaurantCategory = urlSubtype;
        }
        return { ...prev, ...updates };
      });
      setTypeFromUrl(true);
      try { sessionStorage.removeItem('mada-spot-registration-intent'); } catch {}
    }

    // (2) Vérifier la session + verrouiller depuis userType si pas de param URL
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setIsAuthenticated(true);
            // Verrouiller le type selon le userType du prestataire (seulement si pas déjà verrouillé par URL)
            if (!urlType) {
              const ut = data.user.userType as FormData['establishmentType'] | null;
              if (ut && ['HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER'].includes(ut)) {
                setFormData((prev) => ({ ...prev, establishmentType: ut }));
                setTypeFromUrl(true);
              }
            }
          }
        }
      } catch {
        // pas de session
      } finally {
        setSessionLoading(false);
      }
    };
    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save form data to sessionStorage before redirecting to login/register
  const saveFormAndRedirect = (href: string) => {
    try {
      const { photos, ...serializableData } = formData;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        formData: serializableData,
        step,
      }));
    } catch {
      // sessionStorage full or unavailable
    }
    router.push(href);
  };

  const availableRegions = formData.province ? REGIONS[formData.province] || [] : [];
  const availableCities = formData.region ? CITIES_BY_REGION[formData.region] || [] : [];

  const updateField = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateCustomOther = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, customOther: { ...prev.customOther, [key]: value } }));
  };

  const renderOtherInput = (field: string, isVisible: boolean, placeholder = t.otherSpecify) => {
    if (!isVisible) return null;
    return (
      <input
        type="text"
        value={formData.customOther[field] || ''}
        onChange={(e) => updateCustomOther(field, e.target.value)}
        placeholder={placeholder}
        className="w-full mt-2 px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
      />
    );
  };

  const getResolvedGeo = () => ({
    province: formData.province === 'Autre' ? formData.customOther.province : formData.province,
    region: (formData.province === 'Autre' || formData.region === 'Autre') ? formData.customOther.region : formData.region,
    city: (formData.province === 'Autre' || formData.region === 'Autre' || formData.city === 'Autre') ? formData.customOther.city : formData.city,
  });

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
  };

  const addHighlight = () => {
    if (highlightInput.trim() && formData.highlights.length < 10) {
      setFormData((prev) => ({
        ...prev,
        highlights: [...prev.highlights, highlightInput.trim()],
      }));
      setHighlightInput('');
    }
  };

  const removeHighlight = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Add photos locally (no auth needed, no upload yet)
  const addPhotos = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((f) => {
      if (!f.type.startsWith('image/')) {
        setError(t.errImagesOnly);
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        setError(`"${f.name}" ${t.errFileTooBig}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const totalPhotos = formData.photos.length + validFiles.length;
    if (totalPhotos > 5) {
      setError(`${t.errMaxPhotos} (${formData.photos.length} ${t.errPhotosAlreadyAdded})`);
      return;
    }

    setError('');
    // Create local blob URL previews
    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...validFiles],
      photoUrls: [...prev.photoUrls, ...newPreviews],
    }));
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addPhotos(e.dataTransfer.files);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addPhotos(e.target.files);
    e.target.value = ''; // Reset so the same file can be selected again
  };

  const removePhoto = (index: number) => {
    // Revoke blob URL to free memory
    const url = formData.photoUrls[index];
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);

    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
      photoUrls: prev.photoUrls.filter((_, i) => i !== index),
    }));
  };

  const setCoverPhoto = (index: number) => {
    if (index === 0) return;
    setFormData((prev) => {
      const newPhotos = [...prev.photos];
      const newUrls = [...prev.photoUrls];
      // Swap with first
      [newPhotos[0], newPhotos[index]] = [newPhotos[index], newPhotos[0]];
      [newUrls[0], newUrls[index]] = [newUrls[index], newUrls[0]];
      return { ...prev, photos: newPhotos, photoUrls: newUrls };
    });
  };

  // Upload all local photos to server, returns server URLs
  const uploadPhotos = async (): Promise<string[]> => {
    const filesToUpload = formData.photos.filter((_, i) => formData.photoUrls[i]?.startsWith('blob:'));
    if (filesToUpload.length === 0) {
      // All photos already uploaded (restored from previous session with server URLs)
      return formData.photoUrls;
    }

    setUploadProgress(`${t.uploadingPhotos} (0/${filesToUpload.length})...`);

    const serverUrls = [...formData.photoUrls];

    // Upload in batches of up to 5
    const fd = new FormData();
    filesToUpload.forEach((file) => fd.append('files', file));
    if (csrfToken) fd.append('csrfToken', csrfToken);

    const res = await fetch('/api/upload', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || t.errUpload);
    }

    const data = await res.json();
    const uploadedUrls: string[] = data.files.map((f: { url: string }) => f.url);

    // Map uploaded URLs back to correct positions
    let uploadIdx = 0;
    for (let i = 0; i < serverUrls.length; i++) {
      if (serverUrls[i]?.startsWith('blob:')) {
        URL.revokeObjectURL(serverUrls[i]);
        serverUrls[i] = uploadedUrls[uploadIdx++];
      }
    }

    setUploadProgress('');
    return serverUrls;
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        if (formData.establishmentType === 'PROVIDER') {
          return formData.name && formData.description && formData.serviceType;
        }
        if (formData.establishmentType === 'HOTEL') {
          return formData.name && formData.description && formData.hotelType;
        }
        if (formData.establishmentType === 'RESTAURANT') {
          return formData.name && formData.description && formData.restaurantCategory;
        }
        return formData.name && formData.description && formData.attractionType;
      case 2: {
        const geo = getResolvedGeo();
        return !!geo.province && !!geo.region && !!geo.city;
      }
      case 3:
        if (formData.establishmentType === 'RESTAURANT') {
          return !!formData.priceRange;
        }
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Upload photos first (if any local files need uploading)
      let photoUrls = formData.photoUrls;
      if (formData.photos.length > 0) {
        photoUrls = await uploadPhotos();
      }

      let payload: Record<string, unknown>;
      let submitUrl: string;

      // Resolve "Autre" values: use custom text when user selected "Autre"
      const co = formData.customOther;
      const geo = getResolvedGeo();
      const resolveOther = (val: string, key: string, otherVals: string[]) =>
        otherVals.includes(val) && co[key] ? co[key] : val;

      const commonPayload = {
        name: formData.name,
        shortDescription: formData.shortDescription,
        description: formData.description,
        province: geo.province,
        region: geo.region,
        city: geo.city,
        district: formData.district,
        latitude: formData.latitude,
        longitude: formData.longitude,
        coverImage: photoUrls[0] || null,
        images: photoUrls.slice(1),
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        facebook: formData.facebook,
        instagram: formData.instagram,
        whatsapp: formData.whatsapp,
        customOther: co,
      };

      if (formData.establishmentType === 'PROVIDER') {
        submitUrl = '/api/bons-plans/prestataires/submit';
        payload = {
          ...commonPayload,
          serviceType: resolveOther(formData.serviceType, 'serviceType', ['OTHER']),
          languages: formData.languages.map((l) => l === 'Autre' && co.languages ? co.languages : l),
          experience: formData.experience,
          priceFrom: formData.priceFrom ? parseFloat(formData.priceFrom) : null,
          priceTo: formData.priceTo ? parseFloat(formData.priceTo) : null,
          priceUnit: resolveOther(formData.priceUnit, 'priceUnit', ['autre']) || null,
          vehicleType: resolveOther(formData.vehicleType, 'vehicleType', ['autre']) || null,
          vehicleCapacity: formData.vehicleCapacity ? parseInt(formData.vehicleCapacity) : null,
          licenseNumber: formData.licenseNumber || null,
          operatingZone: formData.operatingZone || null,
        };
      } else if (formData.establishmentType === 'HOTEL') {
        submitUrl = '/api/bons-plans/hotels/submit';
        payload = {
          ...commonPayload,
          hotelType: resolveOther(formData.hotelType, 'hotelType', ['autre-hebergement']),
          starRating: formData.starRating || null,
          amenities: formData.hotelAmenities.map((a) => a === 'autre' && co.hotelAmenities ? co.hotelAmenities : a),
          checkInTime: formData.checkInTime || null,
          checkOutTime: formData.checkOutTime || null,
          roomTypes: formData.roomTypes
            .filter((r) => r.name && r.pricePerNight)
            .map((r) => ({
              name: r.name,
              capacity: r.capacity ? parseInt(r.capacity) : 2,
              pricePerNight: parseFloat(r.pricePerNight),
            })),
        };
      } else if (formData.establishmentType === 'RESTAURANT') {
        submitUrl = '/api/bons-plans/restaurants/submit';
        payload = {
          ...commonPayload,
          category: resolveOther(formData.restaurantCategory, 'restaurantCategory', ['AUTRE']),
          cuisineTypes: formData.cuisineTypes.map((c) => c === 'Autre' && co.cuisineTypes ? co.cuisineTypes : c),
          priceRange: resolveOther(formData.priceRange, 'priceRange', ['AUTRE']),
          avgMainCourse: formData.avgMainCourse || null,
          avgBeer: formData.avgBeer || null,
          specialties: formData.specialties,
          hasDelivery: formData.hasDelivery,
          hasTakeaway: formData.hasTakeaway,
          hasReservation: formData.hasReservation,
          hasParking: formData.restHasParking,
          hasWifi: formData.hasWifi,
          hasGenerator: formData.hasGenerator,
        };
      } else {
        submitUrl = '/api/bons-plans/attractions/submit';
        payload = {
          ...commonPayload,
          attractionType: resolveOther(formData.attractionType, 'attractionType', ['autre']),
          isFree: formData.isFree,
          entryFeeLocal: formData.entryFeeLocal || null,
          entryFeeForeign: formData.entryFeeForeign || null,
          visitDuration: formData.visitDuration,
          bestTimeToVisit: formData.bestTimeToVisit,
          bestSeason: resolveOther(formData.bestSeason, 'bestSeason', ['autre']),
          isAccessible: formData.isAccessible,
          hasGuide: formData.hasGuide,
          hasParking: formData.hasParking,
          hasRestaurant: formData.hasRestaurant,
          highlights: formData.highlights,
        };
      }

      setUploadProgress(t.sendingForm);

      const res = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || t.errSubmit);
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#070710] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">{t.successTitle}</h2>
          <p className="text-gray-400 mb-8">
            {t.successDesc}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              {t.successDashboardBtn}
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setStep(1);
                setFormData({
                  name: '', shortDescription: '', description: '', attractionType: '',
                  province: '', region: '', city: '', district: '',
                  latitude: '', longitude: '',
                  isFree: false, entryFeeLocal: '', entryFeeForeign: '',
                  visitDuration: '', bestTimeToVisit: '', bestSeason: '',
                  isAccessible: false, hasGuide: false, hasParking: false, hasRestaurant: false,
                  highlights: [], photos: [], photoUrls: [],
                  phone: '', email: '', website: '', facebook: '', instagram: '', whatsapp: '',
                  establishmentType: 'ATTRACTION',
                  serviceType: '', languages: [], experience: '',
                  priceFrom: '', priceTo: '', priceUnit: '',
                  vehicleType: '', vehicleCapacity: '',
                  licenseNumber: '', operatingZone: '',
                  hotelType: '', starRating: 0, hotelAmenities: [],
                  checkInTime: '14:00', checkOutTime: '11:00', roomTypes: [],
                  restaurantCategory: '', cuisineTypes: [], priceRange: '',
                  avgMainCourse: '', avgBeer: '', specialties: [],
                  hasDelivery: false, hasTakeaway: false, hasReservation: false,
                  hasWifi: false, restHasParking: false, hasGenerator: false,
                  customOther: {},
                });
              }}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all"
            >
              {t.successAnotherBtn}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070710] text-white">
      {/* Header */}
      <div className="border-b border-[#1e1e2e]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.back}
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            {formData.establishmentType === 'HOTEL' ? <Building2 className="w-5 h-5 text-purple-400" /> : formData.establishmentType === 'RESTAURANT' ? <UtensilsCrossed className="w-5 h-5 text-amber-400" /> : formData.establishmentType === 'PROVIDER' ? <Users className="w-5 h-5 text-cyan-400" /> : <Mountain className="w-5 h-5 text-emerald-400" />}
            {formData.establishmentType === 'HOTEL' ? t.publishHotel : formData.establishmentType === 'RESTAURANT' ? t.publishRestaurant : formData.establishmentType === 'PROVIDER' ? t.publishProvider : t.publishPlace}
          </h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Step indicator */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step > s.id
                      ? 'bg-emerald-500 text-white'
                      : step === s.id
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                      : 'bg-[#1e1e2e] text-gray-500'
                  }`}
                >
                  {step > s.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <s.icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 hidden sm:block ${
                    step >= s.id ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {tt[s.key]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    step > s.id ? 'bg-emerald-500' : 'bg-[#1e1e2e]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">{t.step1Title}</h2>
                  <p className="text-gray-500 text-sm">
                    {typeFromUrl ? t.step1FillSubtitle : t.step1ChooseSubtitle}
                  </p>
                </div>

                {/* Type badge (locked from registration or userType) */}
                {typeFromUrl && (
                  <div className={`flex items-center gap-3 p-4 rounded-xl ${
                    formData.establishmentType === 'HOTEL' ? 'bg-purple-500/10 border-2 border-purple-500 text-purple-400'
                    : formData.establishmentType === 'RESTAURANT' ? 'bg-amber-500/10 border-2 border-amber-500 text-amber-400'
                    : formData.establishmentType === 'PROVIDER' ? 'bg-cyan-500/10 border-2 border-cyan-500 text-cyan-400'
                    : 'bg-orange-500/10 border-2 border-orange-500 text-orange-400'
                  }`}>
                    {formData.establishmentType === 'HOTEL' ? <Building2 className="w-6 h-6" />
                      : formData.establishmentType === 'RESTAURANT' ? <UtensilsCrossed className="w-6 h-6" />
                      : formData.establishmentType === 'PROVIDER' ? <Users className="w-6 h-6" />
                      : <Mountain className="w-6 h-6" />}
                    <div>
                      <div className="font-medium">
                        {t.publishingAs} {formData.establishmentType === 'HOTEL' ? t.typeHotel
                          : formData.establishmentType === 'RESTAURANT' ? t.typeRestaurant
                          : formData.establishmentType === 'PROVIDER' ? t.typeProvider
                          : t.typeAttraction}
                      </div>
                      <div className="text-xs text-gray-500">{t.typeLockedHint}</div>
                    </div>
                    <CheckCircle className="w-5 h-5 ml-auto opacity-60" />
                  </div>
                )}

                {/* Type selector: loading / locked / selectable */}
                {sessionLoading && !typeFromUrl ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0c0c16] border border-[#1e1e2e] animate-pulse">
                    <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                    <span className="text-gray-500 text-sm">{t.loadingProfile}</span>
                  </div>
                ) : !typeFromUrl ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.typeLabel} <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateField('establishmentType', 'HOTEL')}
                        className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                          formData.establishmentType === 'HOTEL'
                            ? 'bg-purple-500/10 border-2 border-purple-500 text-purple-400'
                            : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <Building2 className="w-6 h-6" />
                        <div className="text-left">
                          <div className="font-medium">{t.typeHotel}</div>
                          <div className="text-xs text-gray-500">{t.typeHotelDesc}</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField('establishmentType', 'RESTAURANT')}
                        className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                          formData.establishmentType === 'RESTAURANT'
                            ? 'bg-amber-500/10 border-2 border-amber-500 text-amber-400'
                            : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <UtensilsCrossed className="w-6 h-6" />
                        <div className="text-left">
                          <div className="font-medium">{t.typeRestaurant}</div>
                          <div className="text-xs text-gray-500">{t.typeRestaurantDesc}</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField('establishmentType', 'ATTRACTION')}
                        className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                          formData.establishmentType === 'ATTRACTION'
                            ? 'bg-orange-500/10 border-2 border-orange-500 text-orange-400'
                            : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <Mountain className="w-6 h-6" />
                        <div className="text-left">
                          <div className="font-medium">{t.typeAttraction}</div>
                          <div className="text-xs text-gray-500">{t.typeAttractionDesc}</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField('establishmentType', 'PROVIDER')}
                        className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                          formData.establishmentType === 'PROVIDER'
                            ? 'bg-cyan-500/10 border-2 border-cyan-500 text-cyan-400'
                            : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <Users className="w-6 h-6" />
                        <div className="text-left">
                          <div className="font-medium">{t.typeProvider}</div>
                          <div className="text-xs text-gray-500">{t.typeProviderDesc}</div>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {formData.establishmentType === 'PROVIDER' ? t.nameLabelProvider : formData.establishmentType === 'HOTEL' ? t.nameLabelHotel : formData.establishmentType === 'RESTAURANT' ? t.nameLabelRestaurant : t.nameLabelPlace} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder={formData.establishmentType === 'PROVIDER' ? t.namePlaceholderProvider : formData.establishmentType === 'HOTEL' ? t.namePlaceholderHotel : formData.establishmentType === 'RESTAURANT' ? t.namePlaceholderRestaurant : t.namePlaceholderPlace}
                    className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t.shortDescriptionLabel} <span className="text-gray-600">{t.shortDescriptionLimit}</span>
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => updateField('shortDescription', e.target.value.slice(0, 200))}
                    placeholder={t.shortDescriptionPlaceholder}
                    className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <p className="text-xs text-gray-600 mt-1">{formData.shortDescription.length}/200</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t.fullDescriptionLabel} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder={formData.establishmentType === 'PROVIDER' ? t.fullDescriptionPlaceholderProvider : formData.establishmentType === 'HOTEL' ? t.fullDescriptionPlaceholderHotel : formData.establishmentType === 'RESTAURANT' ? t.fullDescriptionPlaceholderRestaurant : t.fullDescriptionPlaceholderPlace}
                    rows={5}
                    className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  />
                </div>

                {/* Attraction Type (only for ATTRACTION) */}
                {formData.establishmentType === 'ATTRACTION' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.attractionTypeLabel} <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ATTRACTION_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => updateField('attractionType', type.value)}
                          className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            formData.attractionType === type.value
                              ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                              : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-400 hover:text-white hover:border-gray-600'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                    {renderOtherInput('attractionType', formData.attractionType === 'autre', t.otherAttractionType)}
                  </div>
                )}

                {/* Hotel Type (only for HOTEL) */}
                {formData.establishmentType === 'HOTEL' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.hotelTypeLabel} <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {HOTEL_TYPE_VALUES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => updateField('hotelType', type.value)}
                          className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            formData.hotelType === type.value
                              ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white'
                              : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-400 hover:text-white hover:border-gray-600'
                          }`}
                        >
                          {tt[type.tKey]}
                        </button>
                      ))}
                    </div>
                    {renderOtherInput('hotelType', formData.hotelType === 'autre-hebergement', t.otherHotelType)}
                  </div>
                )}

                {/* Restaurant Category (only for RESTAURANT) */}
                {formData.establishmentType === 'RESTAURANT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.restaurantCategoryLabel} <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {RESTAURANT_CATEGORY_VALUES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => updateField('restaurantCategory', cat.value)}
                          className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            formData.restaurantCategory === cat.value
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
                              : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-400 hover:text-white hover:border-gray-600'
                          }`}
                        >
                          {tt[cat.tKey]}
                        </button>
                      ))}
                    </div>
                    {renderOtherInput('restaurantCategory', formData.restaurantCategory === 'AUTRE', t.otherRestaurantCategory)}
                  </div>
                )}

                {/* Service Type (only for PROVIDER) */}
                {formData.establishmentType === 'PROVIDER' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.serviceTypeLabel} <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PROVIDER_SERVICE_VALUES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => updateField('serviceType', type.value)}
                          className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            formData.serviceType === type.value
                              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'
                              : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-400 hover:text-white hover:border-gray-600'
                          }`}
                        >
                          {tt[type.tKey]}
                        </button>
                      ))}
                    </div>
                    {renderOtherInput('serviceType', formData.serviceType === 'OTHER', t.otherServiceType)}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">{t.step2Title}</h2>
                  <p className="text-gray-500 text-sm">{t.step2Subtitle}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Province */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.provinceLabel} <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => {
                        updateField('province', e.target.value);
                        updateField('region', '');
                        updateField('city', '');
                      }}
                      className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                    >
                      <option value="">{t.selectPlaceholder}</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                      <option value="Autre">{t.otherOption}</option>
                    </select>
                    {renderOtherInput('province', formData.province === 'Autre', t.otherProvince)}
                  </div>

                  {/* Region */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.regionLabel} <span className="text-red-400">*</span>
                    </label>
                    {formData.province === 'Autre' ? (
                      <input
                        type="text"
                        value={formData.customOther.region || ''}
                        onChange={(e) => updateCustomOther('region', e.target.value)}
                        placeholder={t.otherRegion}
                        className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    ) : (
                      <>
                        <select
                          value={formData.region}
                          onChange={(e) => {
                            updateField('region', e.target.value);
                            updateField('city', '');
                          }}
                          disabled={!formData.province}
                          className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
                        >
                          <option value="">{t.selectPlaceholder}</option>
                          {availableRegions.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                          <option value="Autre">{t.otherOption}</option>
                        </select>
                        {renderOtherInput('region', formData.region === 'Autre', t.otherRegion)}
                      </>
                    )}
                  </div>

                  {/* Ville */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.cityLabel} <span className="text-red-400">*</span>
                    </label>
                    {formData.province === 'Autre' || formData.region === 'Autre' ? (
                      <input
                        type="text"
                        value={formData.customOther.city || ''}
                        onChange={(e) => updateCustomOther('city', e.target.value)}
                        placeholder={t.otherCity}
                        className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    ) : (
                      <>
                        <select
                          value={formData.city}
                          onChange={(e) => updateField('city', e.target.value)}
                          disabled={!formData.region}
                          className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
                        >
                          <option value="">{t.selectPlaceholder}</option>
                          {availableCities.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="Autre">{t.otherOption}</option>
                        </select>
                        {renderOtherInput('city', formData.city === 'Autre', t.otherCity)}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t.districtLabel} <span className="text-gray-600">{t.districtOptional}</span>
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => updateField('district', e.target.value)}
                    placeholder={t.districtPlaceholder}
                    className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    {t.gpsPositionLabel} <span className="text-gray-600">{t.gpsClickHint}</span>
                  </label>
                  <div className="rounded-xl overflow-hidden border border-[#1e1e2e] min-h-[300px] sm:min-h-[400px]">
                    <MapLocationPicker
                      onLocationSelect={handleLocationSelect}
                      initialLat={formData.latitude ? parseFloat(formData.latitude) : undefined}
                      initialLng={formData.longitude ? parseFloat(formData.longitude) : undefined}
                    />
                  </div>
                  {formData.latitude && formData.longitude && (
                    <p className="text-xs text-emerald-400 mt-2">
                      {t.positionConfirmed} {parseFloat(formData.latitude).toFixed(5)}, {parseFloat(formData.longitude).toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    {formData.establishmentType === 'PROVIDER' ? t.step3TitleProvider : formData.establishmentType === 'HOTEL' ? t.step3TitleHotel : formData.establishmentType === 'RESTAURANT' ? t.step3TitleRestaurant : t.step3TitleAttraction}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {formData.establishmentType === 'PROVIDER' ? t.step3SubtitleProvider : formData.establishmentType === 'HOTEL' ? t.step3SubtitleHotel : formData.establishmentType === 'RESTAURANT' ? t.step3SubtitleRestaurant : t.step3SubtitleAttraction}
                  </p>
                </div>

                {/* PROVIDER-specific fields */}
                {formData.establishmentType === 'PROVIDER' && (
                  <>
                    {/* Languages */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{t.languagesLabel}</label>
                      <div className="flex flex-wrap gap-2">
                        {PROVIDER_LANGUAGE_VALUES.map((lang) => (
                          <button
                            key={lang.value}
                            type="button"
                            onClick={() => {
                              const langs = formData.languages.includes(lang.value)
                                ? formData.languages.filter((l) => l !== lang.value)
                                : [...formData.languages, lang.value];
                              updateField('languages', langs);
                            }}
                            className={`px-3 py-2 rounded-lg text-sm transition-all ${
                              formData.languages.includes(lang.value)
                                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                                : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-400 hover:border-gray-600'
                            }`}
                          >
                            {tt[lang.tKey]}
                          </button>
                        ))}
                      </div>
                      {renderOtherInput('languages', formData.languages.includes('Autre'), t.otherLanguage)}
                    </div>

                    {/* Experience */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{t.experienceLabel}</label>
                      <input
                        type="text"
                        value={formData.experience}
                        onChange={(e) => updateField('experience', e.target.value)}
                        placeholder={t.experiencePlaceholder}
                        className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t.priceFromLabel}</label>
                        <input
                          type="number"
                          value={formData.priceFrom}
                          onChange={(e) => updateField('priceFrom', e.target.value)}
                          placeholder={t.priceFromPlaceholder}
                          className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t.priceToLabel}</label>
                        <input
                          type="number"
                          value={formData.priceTo}
                          onChange={(e) => updateField('priceTo', e.target.value)}
                          placeholder={t.priceToPlaceholder}
                          className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t.priceUnitLabel}</label>
                        <select
                          value={formData.priceUnit}
                          onChange={(e) => updateField('priceUnit', e.target.value)}
                          className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                        >
                          <option value="">{t.selectPlaceholder}</option>
                          {PRICE_UNIT_VALUES.map((u) => (
                            <option key={u.value} value={u.value}>{tt[u.tKey]}</option>
                          ))}
                        </select>
                        {renderOtherInput('priceUnit', formData.priceUnit === 'autre', t.otherPriceUnit)}
                      </div>
                    </div>

                    {/* Vehicle (for drivers/car rental) */}
                    {(formData.serviceType === 'DRIVER' || formData.serviceType === 'CAR_RENTAL' || formData.serviceType === 'TRANSFER') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">{t.vehicleTypeLabel}</label>
                          <select
                            value={formData.vehicleType}
                            onChange={(e) => updateField('vehicleType', e.target.value)}
                            className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                          >
                            <option value="">{t.selectPlaceholder}</option>
                            {VEHICLE_TYPE_VALUES.map((v) => (
                              <option key={v.value} value={v.value}>{tt[v.tKey]}</option>
                            ))}
                          </select>
                          {renderOtherInput('vehicleType', formData.vehicleType === 'autre', t.otherVehicleType)}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">{t.vehicleCapacityLabel}</label>
                          <input
                            type="number"
                            value={formData.vehicleCapacity}
                            onChange={(e) => updateField('vehicleCapacity', e.target.value)}
                            placeholder={t.vehicleCapacityPlaceholder}
                            min="1"
                            max="50"
                            className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* License / Operating zone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t.licenseLabel}</label>
                        <input
                          type="text"
                          value={formData.licenseNumber}
                          onChange={(e) => updateField('licenseNumber', e.target.value)}
                          placeholder={t.licenseOptional}
                          className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t.operatingZoneLabel}</label>
                        <input
                          type="text"
                          value={formData.operatingZone}
                          onChange={(e) => updateField('operatingZone', e.target.value)}
                          placeholder={t.operatingZonePlaceholder}
                          className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ATTRACTION-specific fields */}
                {formData.establishmentType === 'ATTRACTION' && (
                  <>
                    {/* Free toggle */}
                    <div className="flex items-center justify-between p-4 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl">
                      <span className="text-sm font-medium">{t.freeAccess}</span>
                      <button
                        type="button"
                        onClick={() => updateField('isFree', !formData.isFree)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          formData.isFree ? 'bg-emerald-500' : 'bg-gray-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            formData.isFree ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Pricing */}
                    {!formData.isFree && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">{t.localFeeLabel}</label>
                          <input
                            type="number"
                            value={formData.entryFeeLocal}
                            onChange={(e) => updateField('entryFeeLocal', e.target.value)}
                            placeholder={t.localFeePlaceholder}
                            className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">{t.foreignFeeLabel}</label>
                          <input
                            type="number"
                            value={formData.entryFeeForeign}
                            onChange={(e) => updateField('entryFeeForeign', e.target.value)}
                            placeholder={t.foreignFeePlaceholder}
                            className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* Visit info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t.visitDurationLabel}</label>
                        <input
                          type="text"
                          value={formData.visitDuration}
                          onChange={(e) => updateField('visitDuration', e.target.value)}
                          placeholder={t.visitDurationPlaceholder}
                          className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t.bestTimeLabel}</label>
                        <input
                          type="text"
                          value={formData.bestTimeToVisit}
                          onChange={(e) => updateField('bestTimeToVisit', e.target.value)}
                          placeholder={t.bestTimePlaceholder}
                          className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{t.bestSeasonLabel}</label>
                      <select
                        value={formData.bestSeason}
                        onChange={(e) => updateField('bestSeason', e.target.value)}
                        className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                      >
                        <option value="">{t.selectPlaceholder}</option>
                        {BEST_SEASON_VALUES.map((s) => (
                          <option key={s.value} value={s.value}>{tt[s.tKey]}</option>
                        ))}
                      </select>
                      {renderOtherInput('bestSeason', formData.bestSeason === 'autre', t.otherBestSeason)}
                    </div>

                    {/* Features checkboxes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">{t.amenitiesServicesLabel}</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'isAccessible' as const, label: t.featAccessible },
                          { key: 'hasGuide' as const, label: t.featGuide },
                          { key: 'hasParking' as const, label: t.featParking },
                          { key: 'hasRestaurant' as const, label: t.featRestaurant },
                        ].map((feat) => (
                          <button
                            key={feat.key}
                            type="button"
                            onClick={() => updateField(feat.key, !formData[feat.key])}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                              formData[feat.key]
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-500'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                formData[feat.key] ? 'bg-emerald-500' : 'bg-[#1e1e2e]'
                              }`}
                            >
                              {formData[feat.key] && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm">{feat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{t.highlightsLabel}</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={highlightInput}
                          onChange={(e) => setHighlightInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                          placeholder={t.highlightsPlaceholder}
                          className="flex-1 px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={addHighlight}
                          className="px-4 py-3 bg-[#1e1e2e] rounded-xl text-gray-400 hover:text-white transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      {formData.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.highlights.map((h, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e2e] rounded-lg text-sm text-gray-300"
                            >
                              {h}
                              <button type="button" onClick={() => removeHighlight(i)}>
                                <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* HOTEL-specific fields */}
                {formData.establishmentType === 'HOTEL' && (
                  <>
                    {/* Star Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{t.starsClassLabel}</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => updateField('starRating', formData.starRating === star ? 0 : star)}
                            className={`p-3 rounded-xl transition-all ${
                              star <= formData.starRating
                                ? 'bg-purple-500/20 border border-purple-500/50 text-yellow-400'
                                : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-600 hover:border-gray-600'
                            }`}
                          >
                            <Star className={`w-5 h-5 ${star <= formData.starRating ? 'fill-yellow-400' : ''}`} />
                          </button>
                        ))}
                        {formData.starRating > 0 && (
                          <span className="flex items-center text-sm text-gray-400 ml-2">{formData.starRating} {formData.starRating > 1 ? t.starsSuffixPlural : t.starsSuffixSingle}</span>
                        )}
                      </div>
                    </div>

                    {/* Amenities */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">{t.hotelAmenitiesLabel}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {HOTEL_AMENITY_VALUES.map((amenity) => (
                          <button
                            key={amenity.value}
                            type="button"
                            onClick={() => {
                              const amenities = formData.hotelAmenities.includes(amenity.value)
                                ? formData.hotelAmenities.filter((a) => a !== amenity.value)
                                : [...formData.hotelAmenities, amenity.value];
                              updateField('hotelAmenities', amenities);
                            }}
                            className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
                              formData.hotelAmenities.includes(amenity.value)
                                ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                                : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-500 hover:border-gray-600'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                formData.hotelAmenities.includes(amenity.value) ? 'bg-purple-500' : 'bg-[#1e1e2e]'
                              }`}
                            >
                              {formData.hotelAmenities.includes(amenity.value) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm">{tt[amenity.tKey]}</span>
                          </button>
                        ))}
                      </div>
                      {renderOtherInput('hotelAmenities', formData.hotelAmenities.includes('autre'), t.otherAmenity)}
                    </div>

                    {/* Check-in / Check-out */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {t.checkInTimeLabel}
                        </label>
                        <input
                          type="time"
                          value={formData.checkInTime}
                          onChange={(e) => updateField('checkInTime', e.target.value)}
                          className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {t.checkOutTimeLabel}
                        </label>
                        <input
                          type="time"
                          value={formData.checkOutTime}
                          onChange={(e) => updateField('checkOutTime', e.target.value)}
                          className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Room Types */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-300">{t.roomTypesLabel}</label>
                        <button
                          type="button"
                          onClick={() => updateField('roomTypes', [...formData.roomTypes, { name: '', capacity: '2', pricePerNight: '' }])}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 text-sm hover:bg-purple-500/20 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          {t.addRoomBtn}
                        </button>
                      </div>
                      {formData.roomTypes.length === 0 && (
                        <p className="text-sm text-gray-600 italic">{t.noRoomsHint}</p>
                      )}
                      <div className="space-y-3">
                        {formData.roomTypes.map((room, i) => (
                          <div key={i} className="p-4 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-400">{t.roomLabel} {i + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = formData.roomTypes.filter((_, idx) => idx !== i);
                                  updateField('roomTypes', updated);
                                }}
                                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <input
                                type="text"
                                value={room.name}
                                onChange={(e) => {
                                  const updated = [...formData.roomTypes];
                                  updated[i] = { ...updated[i], name: e.target.value };
                                  updateField('roomTypes', updated);
                                }}
                                placeholder={t.roomNamePlaceholder}
                                className="px-3 py-2 bg-[#070710] border border-[#1e1e2e] rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                              />
                              <input
                                type="number"
                                value={room.capacity}
                                onChange={(e) => {
                                  const updated = [...formData.roomTypes];
                                  updated[i] = { ...updated[i], capacity: e.target.value };
                                  updateField('roomTypes', updated);
                                }}
                                placeholder={t.roomCapacityPlaceholder}
                                min="1"
                                max="20"
                                className="px-3 py-2 bg-[#070710] border border-[#1e1e2e] rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                              />
                              <input
                                type="number"
                                value={room.pricePerNight}
                                onChange={(e) => {
                                  const updated = [...formData.roomTypes];
                                  updated[i] = { ...updated[i], pricePerNight: e.target.value };
                                  updateField('roomTypes', updated);
                                }}
                                placeholder={t.roomPricePlaceholder}
                                className="px-3 py-2 bg-[#070710] border border-[#1e1e2e] rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* RESTAURANT-specific fields */}
                {formData.establishmentType === 'RESTAURANT' && (
                  <>
                    {/* Cuisine Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{t.cuisineLabel}</label>
                      <div className="flex flex-wrap gap-2">
                        {CUISINE_TYPE_VALUES.map((cuisine) => (
                          <button
                            key={cuisine.value}
                            type="button"
                            onClick={() => {
                              const types = formData.cuisineTypes.includes(cuisine.value)
                                ? formData.cuisineTypes.filter((c) => c !== cuisine.value)
                                : [...formData.cuisineTypes, cuisine.value];
                              updateField('cuisineTypes', types);
                            }}
                            className={`px-3 py-2 rounded-lg text-sm transition-all ${
                              formData.cuisineTypes.includes(cuisine.value)
                                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                                : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-400 hover:border-gray-600'
                            }`}
                          >
                            {tt[cuisine.tKey]}
                          </button>
                        ))}
                      </div>
                      {renderOtherInput('cuisineTypes', formData.cuisineTypes.includes('Autre'), t.otherCuisineType)}
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t.priceRangeLabel} <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {PRICE_RANGE_VALUES.map((range) => (
                          <button
                            key={range.value}
                            type="button"
                            onClick={() => updateField('priceRange', range.value)}
                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                              formData.priceRange === range.value
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
                                : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-400 hover:text-white hover:border-gray-600'
                            }`}
                          >
                            {tt[range.tKey]}
                          </button>
                        ))}
                      </div>
                      {renderOtherInput('priceRange', formData.priceRange === 'AUTRE', t.otherPriceRange)}
                    </div>

                    {/* Average prices */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t.avgMainCourseLabel}</label>
                        <input
                          type="number"
                          value={formData.avgMainCourse}
                          onChange={(e) => updateField('avgMainCourse', e.target.value)}
                          placeholder={t.avgMainCoursePlaceholder}
                          className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t.avgBeerLabel}</label>
                        <input
                          type="number"
                          value={formData.avgBeer}
                          onChange={(e) => updateField('avgBeer', e.target.value)}
                          placeholder={t.avgBeerPlaceholder}
                          className="w-full px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Services */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">{t.servicesLabel}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {([
                          { key: 'hasDelivery' as const, label: t.svcDelivery },
                          { key: 'hasTakeaway' as const, label: t.svcTakeaway },
                          { key: 'hasReservation' as const, label: t.svcReservation },
                          { key: 'hasWifi' as const, label: t.svcWifi },
                          { key: 'restHasParking' as const, label: t.svcParking },
                          { key: 'hasGenerator' as const, label: t.svcGenerator },
                        ] as const).map((feat) => (
                          <button
                            key={feat.key}
                            type="button"
                            onClick={() => updateField(feat.key, !formData[feat.key])}
                            className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
                              formData[feat.key]
                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                                : 'bg-[#0c0c16] border border-[#1e1e2e] text-gray-500 hover:border-gray-600'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                formData[feat.key] ? 'bg-amber-500' : 'bg-[#1e1e2e]'
                              }`}
                            >
                              {formData[feat.key] && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm">{feat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Specialties */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{t.specialtiesLabel}</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={highlightInput}
                          onChange={(e) => setHighlightInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (highlightInput.trim()) {
                                updateField('specialties', [...formData.specialties, highlightInput.trim()]);
                                setHighlightInput('');
                              }
                            }
                          }}
                          placeholder={t.specialtiesPlaceholder}
                          className="flex-1 px-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (highlightInput.trim()) {
                              updateField('specialties', [...formData.specialties, highlightInput.trim()]);
                              setHighlightInput('');
                            }
                          }}
                          className="px-4 py-3 bg-[#1e1e2e] rounded-xl text-gray-400 hover:text-white transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      {formData.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.specialties.map((s, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e2e] rounded-lg text-sm text-gray-300"
                            >
                              {s}
                              <button
                                type="button"
                                onClick={() => updateField('specialties', formData.specialties.filter((_, idx) => idx !== i))}
                              >
                                <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Photos & Contact */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">{t.step4Title}</h2>
                  <p className="text-gray-500 text-sm">{t.step4Subtitle}</p>
                </div>

                {/* Photo upload - Drag & Drop */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    {t.photosLabel} <span className="text-gray-600">{t.photosHint}</span>
                  </label>

                  {/* Drag & Drop zone */}
                  {formData.photoUrls.length < 5 && (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handlePhotoDrop}
                      className={`relative mb-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
                        dragOver
                          ? 'border-orange-500 bg-orange-500/10 scale-[1.01]'
                          : 'border-[#2a2a3e] hover:border-orange-500/40'
                      }`}
                    >
                      <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                          dragOver ? 'bg-orange-500/20' : 'bg-[#1e1e2e]'
                        }`}>
                          <Camera className={`w-7 h-7 ${dragOver ? 'text-orange-400' : 'text-gray-500'}`} />
                        </div>
                        <p className="text-sm font-medium text-gray-300 mb-1">
                          {dragOver ? t.dropHere : t.dragDropHint}
                        </p>
                        <p className="text-xs text-gray-600 mb-3">{t.orClickHint}</p>
                        <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium rounded-lg">
                          {t.choosePhotos}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Photo previews grid */}
                  {formData.photoUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                      {formData.photoUrls.map((url, i) => (
                        <div
                          key={`${url}-${i}`}
                          className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                            i === 0 ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-[#1e1e2e] hover:border-orange-500/40'
                          }`}
                          onClick={() => setCoverPhoto(i)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 && (
                            <span className="absolute top-2 left-2 px-2.5 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                              {t.coverBadge}
                            </span>
                          )}
                          {i !== 0 && (
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              {t.clickToCover}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-full text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload progress */}
                  {uploadProgress && (
                    <div className="flex items-center gap-2 text-sm text-orange-400 mb-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {uploadProgress}
                    </div>
                  )}
                </div>

                {/* Contact fields */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-300">{t.contactSectionTitle} <span className="text-gray-600">{t.contactOptional}</span></h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-600" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder={t.contactPhonePlaceholder}
                        className="w-full pl-10 pr-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-600" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder={t.contactEmailPlaceholder}
                        className="w-full pl-10 pr-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3.5 w-4 h-4 text-gray-600" />
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => updateField('website', e.target.value)}
                        placeholder={t.contactWebsitePlaceholder}
                        className="w-full pl-10 pr-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0022 12.06C22 6.53 17.5 2.04 12 2.04Z"/></svg>
                      <input
                        type="text"
                        value={formData.facebook}
                        onChange={(e) => updateField('facebook', e.target.value)}
                        placeholder={t.contactFacebookPlaceholder}
                        className="w-full pl-10 pr-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-3.5 w-4 h-4 text-gray-600" />
                      <input
                        type="text"
                        value={formData.instagram}
                        onChange={(e) => updateField('instagram', e.target.value)}
                        placeholder={t.contactInstagramPlaceholder}
                        className="w-full pl-10 pr-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-3.5 w-4 h-4 text-gray-600" />
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => updateField('whatsapp', e.target.value)}
                        placeholder={t.contactWhatsappPlaceholder}
                        className="w-full pl-10 pr-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Recap */}
                <div className="p-4 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl space-y-2">
                  <h3 className="text-sm font-bold text-gray-300 mb-3">{t.recapTitle}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-500">{t.recapName}</p>
                    <p className="text-white">{formData.name || t.recapDash}</p>
                    <p className="text-gray-500">{t.recapType}</p>
                    <p className="text-white">
                      {(() => {
                        if (formData.establishmentType === 'PROVIDER') {
                          const found = PROVIDER_SERVICE_VALUES.find((x) => x.value === formData.serviceType);
                          return found ? tt[found.tKey] : t.recapDash;
                        }
                        if (formData.establishmentType === 'HOTEL') {
                          const found = HOTEL_TYPE_VALUES.find((x) => x.value === formData.hotelType);
                          return found ? tt[found.tKey] : t.recapDash;
                        }
                        if (formData.establishmentType === 'RESTAURANT') {
                          const found = RESTAURANT_CATEGORY_VALUES.find((x) => x.value === formData.restaurantCategory);
                          return found ? tt[found.tKey] : t.recapDash;
                        }
                        return ATTRACTION_TYPES.find((x) => x.value === formData.attractionType)?.label || t.recapDash;
                      })()}
                    </p>
                    <p className="text-gray-500">{t.recapCity}</p>
                    <p className="text-white">{formData.city || t.recapDash}</p>
                    <p className="text-gray-500">{t.recapRegion}</p>
                    <p className="text-white">{formData.region || t.recapDash}</p>
                    {formData.establishmentType === 'PROVIDER' ? (
                      <>
                        <p className="text-gray-500">{t.recapPrice}</p>
                        <p className="text-white">{formData.priceFrom ? `${formData.priceFrom} MGA` : t.recapDash}{formData.priceUnit ? ` ${formData.priceUnit}` : ''}</p>
                      </>
                    ) : formData.establishmentType === 'HOTEL' ? (
                      <>
                        <p className="text-gray-500">{t.recapStars}</p>
                        <p className="text-white">{formData.starRating ? `${formData.starRating} ${formData.starRating > 1 ? t.starsSuffixPlural : t.starsSuffixSingle}` : t.recapDash}</p>
                        <p className="text-gray-500">{t.recapRooms}</p>
                        <p className="text-white">{formData.roomTypes.length} {t.recapRoomTypes}</p>
                      </>
                    ) : formData.establishmentType === 'RESTAURANT' ? (
                      <>
                        <p className="text-gray-500">{t.recapRangeLabel}</p>
                        <p className="text-white">{(() => { const r = PRICE_RANGE_VALUES.find((x) => x.value === formData.priceRange); return r ? tt[r.tKey] : t.recapDash; })()}</p>
                        <p className="text-gray-500">{t.recapCuisine}</p>
                        <p className="text-white">{formData.cuisineTypes.length > 0 ? formData.cuisineTypes.map((c) => { const f = CUISINE_TYPE_VALUES.find((x) => x.value === c); return f ? tt[f.tKey] : c; }).join(', ') : t.recapDash}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500">{t.recapPrice}</p>
                        <p className="text-white">{formData.isFree ? t.recapFree : formData.entryFeeLocal ? `${formData.entryFeeLocal} MGA` : t.recapDash}</p>
                      </>
                    )}
                    <p className="text-gray-500">{t.recapPhotos}</p>
                    <p className="text-white">{formData.photoUrls.length} {t.recapPhotoCount}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#1e1e2e]">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-3 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.previousBtn}
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t.nextBtn}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.submittingBtn}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {t.submitBtn}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t.authRequiredTitle}</h3>
                <p className="text-gray-400 text-sm">
                  {t.authRequiredDesc}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => saveFormAndRedirect('/login?redirect=/publier-lieu')}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
                >
                  <LogIn className="w-5 h-5" />
                  {t.authLoginBtn}
                </button>
                <button
                  onClick={() => saveFormAndRedirect('/register?redirect=/publier-lieu')}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#1e1e2e] text-white font-medium rounded-xl hover:bg-[#2a2a3e] transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  {t.authRegisterBtn}
                </button>
              </div>

              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                {t.authContinueBtn}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
