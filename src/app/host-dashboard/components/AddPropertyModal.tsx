'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Property } from '@/lib/types';
import { AMENITIES, CATEGORIZED_AMENITIES, AmenityItem } from '@/lib/amenities';
import { Plus, X, ChevronRight, ChevronLeft, Home, Sparkles, Layers, Users, Bed, Building2, CheckCircle, Bath, Clock, AlertCircle, ChevronDown, Palmtree, Tent, LayoutGrid, Castle, Trees, Building, BadgePercent, DollarSign, ListPlus, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient'; // Import supabase client
import { NumberInput } from '@/components/ui/number-input';
import MapPicker from '@/components/common/MapPicker';

const BUCKETS = {
  propertyPhotos: 'images', // Use the 'images' bucket for photos
  propertyDocuments: 'documents', // Use the 'documents' bucket for other documents
};

export interface FormData {
  name: string;
  description: string;
  price: number | string;
  weekendPrice: number | string;
  location: string;
  type: string;
  roomTypes: string[]; // Changed from roomType: string to roomTypes: string[]
  photos: File[];
  photo_urls: string[]; // New field for uploaded photo URLs
  amenities: number[];
  license: File[];
  license_url: string; // New field for uploaded license URL
  taxBill: File[];
  tax_bill_url: string; // New field for uploaded tax bill URL
  currentBill: File[];
  current_bill_url: string; // New field for uploaded current bill URL
  // Tent-specific identity documents
  aadhar: File[];
  aadhar_url: string;
  pan: File[];
  pan_url: string;
  noc: File[];
  noc_url: string;
  cancellationPolicy: string;
  rules: string[];
  safetyItems: string[];
  bedrooms: number;
  beds: number;
  bathrooms: number;
  maxGuests: number;
  area: number;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  totalRooms: number; // New field for bulk booking
  checkInTime: string;
  checkOutTime: string;
  customAmenities: string[]; // New field for manually added amenities
  roomTypeAmenities: Record<string, number[]>; // New field for per-room-type amenities
  roomTypeCounts: Record<string, number>; // New field for inventory per room type
  roomTypePrices: Record<string, number | string>; // New field for pricing per room type
  roomTypeWeekendPrices: Record<string, number | string>; // New field for weekend pricing per room type
  latitude?: number;
  longitude?: number;
  bulkBookingDiscount: number | string;
}

const PROPERTY_ROOM_TYPES: Record<string, string[]> = {
  'hotel': ['Standard Room', 'AC Room', 'Single Room', 'Double Room', 'Twin Room', 'Deluxe Room', 'Suite'],
  'home stay': ['Entire Home'],
  'apartment': ['Entire Apartment'],
  'villa': ['Entire Villa'],
  'resort': ['Standard Room', 'AC Room', 'Deluxe Room', 'Cottage', 'Suite'],
  'dormitory': ['Dorm Bed', 'Single Bed', 'Double Bed', 'AC Bed'],
  'tent': ['Standard Tent', 'Luxury Tent'],
  'wooden stay': ['Standard Wooden Room', 'Deluxe Wooden Cabin'],
};

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProperty: (formData: FormData) => void;
  propertyToEdit: Property | null;
}

const AddPropertyModal = ({
  isOpen,
  onClose,
  onSaveProperty,
  propertyToEdit,
}: AddPropertyModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    weekendPrice: '',
    location: '',
    type: '',
    roomTypes: [], // Initialize as empty array
    photos: [],
    photo_urls: [], // Initialize as empty array
    amenities: [],
    license: [],
    license_url: '', // Initialize as empty string
    taxBill: [],
    tax_bill_url: '', // Initialize as empty string
    currentBill: [],
    current_bill_url: '', // Initialize as empty string
    aadhar: [],
    aadhar_url: '',
    pan: [],
    pan_url: '',
    noc: [],
    noc_url: '',
    cancellationPolicy: 'Tiered',
    rules: [],
    safetyItems: [],
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    maxGuests: 2,
    area: 500,
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    district: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India - IN',
    totalRooms: 1, // Default to 1 room
    checkInTime: '12:00 PM',
    checkOutTime: '11:00 AM',
    customAmenities: [], // Initialize new field
    roomTypeAmenities: {}, // Initialize as empty object
    roomTypeCounts: {}, // Initialize as empty object
    roomTypePrices: {}, // Initialize as empty object
    roomTypeWeekendPrices: {}, // Initialize as empty object
    latitude: undefined,
    longitude: undefined,
    bulkBookingDiscount: 10, // Default 10%
  });
  const [newCustomAmenity, setNewCustomAmenity] = useState('');
  const [disabledFields, setDisabledFields] = useState<Record<string, boolean>>({
    addressLine2: true,
    landmark: true,
    district: true,
    city: true,
    state: true,
    postalCode: true,
    country: true,
  });
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedRoomTypes, setExpandedRoomTypes] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isBulkDiscountEnabled, setIsBulkDiscountEnabled] = useState(true);
  const lastNonZeroDiscount = useRef<number>(10);

  const handleBulkDiscountToggle = (enabled: boolean) => {
    setIsBulkDiscountEnabled(enabled);
    if (enabled) {
      setFormData(prev => ({ ...prev, bulkBookingDiscount: lastNonZeroDiscount.current }));
    } else {
      setFormData(prev => ({ ...prev, bulkBookingDiscount: 0 }));
    }
  };

  useEffect(() => {
    const discountNum = Number(formData.bulkBookingDiscount);
    if (discountNum > 0) {
      lastNonZeroDiscount.current = discountNum;
    }
  }, [formData.bulkBookingDiscount]);

  // Auto-sync Total Rooms/Beds when roomTypeCounts or roomTypes change
  useEffect(() => {
    const isSingleRoomsType = ['Home Stay', 'Apartment', 'Villa', 'Dormitory'].includes(formData.type);
    
    // Ensure all selected room types have a count of at least 1 in roomTypeCounts
    let hasChanges = false;
    const updatedCounts = { ...formData.roomTypeCounts };
    formData.roomTypes.forEach(type => {
      if (updatedCounts[type] === undefined || updatedCounts[type] < 1) {
        updatedCounts[type] = 1;
        hasChanges = true;
      }
    });

    if (isSingleRoomsType) {
      if (formData.totalRooms !== 1) {
        setFormData(prev => ({ ...prev, totalRooms: 1, roomTypeCounts: hasChanges ? updatedCounts : prev.roomTypeCounts }));
        return;
      }
      
      // For Dormitory, auto-sync Beds to the sum of room type counts
      if (formData.type === 'Dormitory') {
        if (formData.roomTypes.length > 0) {
          let sum = 0;
          for (const type of formData.roomTypes) {
            sum += (updatedCounts[type] || 1);
          }
          if (formData.beds !== sum || hasChanges) {
            setFormData(prev => ({ ...prev, beds: sum, roomTypeCounts: updatedCounts }));
          }
        } else {
          if (formData.beds !== 0) {
            setFormData(prev => ({ ...prev, beds: 0 }));
          }
        }
      } else if (hasChanges) {
        setFormData(prev => ({ ...prev, roomTypeCounts: updatedCounts }));
      }
      return;
    }
    
    if (formData.roomTypes.length > 0) {
      let sum = 0;
      for (const type of formData.roomTypes) {
        sum += (updatedCounts[type] || 1);
      }
      if (formData.totalRooms !== sum || hasChanges) {
        setFormData(prev => ({ ...prev, totalRooms: sum, roomTypeCounts: updatedCounts }));
      }
    } else if (hasChanges) {
      setFormData(prev => ({ ...prev, roomTypeCounts: updatedCounts }));
    }
  }, [formData.roomTypes, formData.roomTypeCounts, formData.type, formData.totalRooms, formData.beds]);

  const propertyCategories = [
    { id: 'Hotel', name: 'Hotel', icon: Building2 },
    { id: 'Resort', name: 'Resort', icon: Palmtree },
    { id: 'Home Stay', name: 'Home Stay', icon: Home },
    { id: 'Apartment', name: 'Apartment', icon: LayoutGrid },
    { id: 'Villa', name: 'Villa', icon: Castle },
    { id: 'Wooden Stay', name: 'Wooden Stay', icon: Trees },
    { id: 'Tent', name: 'Tent', icon: Tent },
    { id: 'Dormitory', name: 'Dormitory', icon: Users },
  ];

  // Scroll to top of step container when step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const uploadFileToSupabase = async (file: File, bucketName: string, folderPath: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated. Please log in to upload files.");
    }

    const fileExt = file.name.split('.').pop();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${folderPath}/${Date.now()}_${randomStr}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload file to ${bucketName}: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  useEffect(() => {
    if (propertyToEdit) {
      const initialPhotoUrls = propertyToEdit.images && propertyToEdit.images.length > 0
        ? propertyToEdit.images.map((img: any) => typeof img === 'string' ? img : img.url)
        : (propertyToEdit.image_url ? [propertyToEdit.image_url] : []);

      setFormData({
        name: propertyToEdit.title || propertyToEdit.name || '',
        description: propertyToEdit.description || '',
        price: propertyToEdit.price_per_night || propertyToEdit.price || '',
        weekendPrice: propertyToEdit.weekend_price_per_night || propertyToEdit.weekendPrice || '',
        location: propertyToEdit.location || '',
        type: propertyToEdit.tier || '',
        roomTypes: (propertyToEdit.room_types && propertyToEdit.room_types.length > 0)
          ? propertyToEdit.room_types
          : (
              propertyToEdit.room_type && 
              !propertyToEdit.room_type.includes('[') && 
              !propertyToEdit.room_type.includes(',') && 
              propertyToEdit.room_type.length < 50
                ? [propertyToEdit.room_type]
                : (PROPERTY_ROOM_TYPES[(propertyToEdit.tier || propertyToEdit.type || '').toLowerCase()] || [])
            ),
        photos: [], // Reset photos when editing
        photo_urls: initialPhotoUrls,
        amenities: propertyToEdit.amenities?.map((a: any) => a.id) || [],
        license: [],
        license_url: propertyToEdit.license_url || '',
        taxBill: [],
        tax_bill_url: propertyToEdit.tax_bill_url || '',
        currentBill: [],
        current_bill_url: propertyToEdit.current_bill_url || '',
        aadhar: [],
        aadhar_url: propertyToEdit.aadhar_url || '',
        pan: [],
        pan_url: propertyToEdit.pan_url || '',
        noc: [],
        noc_url: propertyToEdit.noc_url || '',
        cancellationPolicy: propertyToEdit.cancellation_policy || 'Tiered',
        rules: propertyToEdit.rules || [],
        safetyItems: propertyToEdit.safety_items || [],
        bedrooms: ['Tent', 'Dormitory', 'Hotel', 'Resort'].includes(propertyToEdit.tier || '') ? 0 : (propertyToEdit.bedrooms || 1),
        beds: propertyToEdit.beds || 1,
        bathrooms: propertyToEdit.bathrooms || 1,
        maxGuests: propertyToEdit.max_guests || 2,
        area: propertyToEdit.area || 500,
        addressLine1: propertyToEdit.address_line1 || '',
        addressLine2: propertyToEdit.address_line2 || '',
        landmark: propertyToEdit.landmark || '',
        district: propertyToEdit.district || '',
        city: propertyToEdit.city || '',
        state: propertyToEdit.state || '',
        postalCode: propertyToEdit.postal_code || '',
        country: propertyToEdit.country || 'India - IN',
        totalRooms: ['Home Stay', 'Apartment', 'Villa'].includes(propertyToEdit.tier || '') ? 1 : (propertyToEdit.total_rooms || 1),
        checkInTime: propertyToEdit.check_in_time || '12:00 PM',
        checkOutTime: propertyToEdit.check_out_time || '11:00 AM',
        customAmenities: propertyToEdit.amenities
          ?.filter((a: any) => !AMENITIES.some(std => std.id === a.id))
          ?.map((a: any) => a.name) || [],
        roomTypeAmenities: (propertyToEdit as any).room_type_amenities || {},
        roomTypeCounts: (propertyToEdit as any).room_type_counts || {},
        roomTypePrices: (propertyToEdit as any).room_type_prices || {},
        roomTypeWeekendPrices: (propertyToEdit as any).room_type_weekend_prices || {},
        latitude: propertyToEdit.latitude,
        longitude: propertyToEdit.longitude,
        bulkBookingDiscount: ['Home Stay', 'Apartment', 'Villa'].includes(propertyToEdit.tier || '') ? 0 : (propertyToEdit.bulk_booking_discount !== undefined && propertyToEdit.bulk_booking_discount !== null ? propertyToEdit.bulk_booking_discount : 10),
      });
      setDisabledFields({
        name: false,
        addressLine2: !!propertyToEdit.address_line2,
        landmark: !!propertyToEdit.landmark,
        district: !!propertyToEdit.district,
        city: !!propertyToEdit.city,
        state: !!propertyToEdit.state,
        postalCode: !!propertyToEdit.postal_code,
        country: !!propertyToEdit.country,
      });
      const isSingleUnitType = ['Home Stay', 'Apartment', 'Villa'].includes(propertyToEdit.tier || '');
      const discountVal = isSingleUnitType ? 0 : (propertyToEdit.bulk_booking_discount !== undefined && propertyToEdit.bulk_booking_discount !== null ? propertyToEdit.bulk_booking_discount : 10);
      setIsBulkDiscountEnabled(discountVal > 0);
      lastNonZeroDiscount.current = discountVal > 0 ? discountVal : 10;
      setPhotoPreviews(initialPhotoUrls);
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        weekendPrice: '',
        location: '',
        type: '',
        roomTypes: [], // Initialize as empty array
        photos: [],
        photo_urls: [],
        amenities: [],
        license: [],
        license_url: '',
        taxBill: [],
        tax_bill_url: '',
        currentBill: [],
        current_bill_url: '',
        aadhar: [],
        aadhar_url: '',
        pan: [],
        pan_url: '',
        noc: [],
        noc_url: '',
        cancellationPolicy: 'Tiered',
        rules: [],
        safetyItems: [],
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        maxGuests: 2,
        area: 500,
        addressLine1: '',
        addressLine2: '',
        landmark: '',
        district: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India - IN',
        totalRooms: 1,
        checkInTime: '12:00 PM',
        checkOutTime: '11:00 AM',
        customAmenities: [],
        roomTypeAmenities: {},
        roomTypeCounts: {},
        roomTypePrices: {},
        roomTypeWeekendPrices: {},
        latitude: undefined,
        longitude: undefined,
        bulkBookingDiscount: 10,
      });
      setIsBulkDiscountEnabled(true);
      lastNonZeroDiscount.current = 10;
      setPhotoPreviews([]);
      setDisabledFields({
        addressLine2: true,
        landmark: true,
        district: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      });
    }
  }, [propertyToEdit]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'type') {
      const isSingleUnitType = ['Home Stay', 'Apartment', 'Villa'].includes(value);
      const normalizedNewType = value?.trim().toLowerCase();
      const validRoomTypes = PROPERTY_ROOM_TYPES[normalizedNewType] || [];
      
      setFormData((prev) => {
        const filteredRoomTypes = prev.roomTypes.filter(rt => validRoomTypes.includes(rt));
        
        // Filter helper to retain only keys associated with valid/retained room types
        const filteredCounts: Record<string, number> = {};
        const filteredPrices: Record<string, number | string> = {};
        const filteredWeekendPrices: Record<string, number | string> = {};
        const filteredAmenities: Record<string, number[]> = {};

        filteredRoomTypes.forEach(rt => {
          if (prev.roomTypeCounts[rt] !== undefined) filteredCounts[rt] = prev.roomTypeCounts[rt];
          if (prev.roomTypePrices[rt] !== undefined) filteredPrices[rt] = prev.roomTypePrices[rt];
          if (prev.roomTypeWeekendPrices[rt] !== undefined) filteredWeekendPrices[rt] = prev.roomTypeWeekendPrices[rt];
          if (prev.roomTypeAmenities[rt] !== undefined) filteredAmenities[rt] = prev.roomTypeAmenities[rt];
        });

        return {
          ...prev,
          [name]: value,
          bedrooms: ['Tent', 'Dormitory', 'Hotel', 'Resort'].includes(value) ? 0 : (prev.bedrooms === 0 ? 1 : prev.bedrooms),
          totalRooms: ['Home Stay', 'Apartment', 'Villa', 'Dormitory'].includes(value) ? 1 : prev.totalRooms,
          bulkBookingDiscount: isSingleUnitType ? 0 : prev.bulkBookingDiscount,
          roomTypes: isSingleUnitType && validRoomTypes.length === 1 
            ? validRoomTypes 
            : filteredRoomTypes,
          roomTypeCounts: isSingleUnitType && validRoomTypes.length === 1 
            ? { [validRoomTypes[0]]: 1 } 
            : filteredCounts,
          roomTypePrices: isSingleUnitType && validRoomTypes.length === 1 
            ? { [validRoomTypes[0]]: prev.roomTypePrices[validRoomTypes[0]] || '' } 
            : filteredPrices,
          roomTypeWeekendPrices: isSingleUnitType && validRoomTypes.length === 1 
            ? { [validRoomTypes[0]]: prev.roomTypeWeekendPrices[validRoomTypes[0]] || '' } 
            : filteredWeekendPrices,
          roomTypeAmenities: isSingleUnitType && validRoomTypes.length === 1 
            ? { [validRoomTypes[0]]: prev.roomTypeAmenities[validRoomTypes[0]] || [] } 
            : filteredAmenities
        };
      });
      if (isSingleUnitType) {
        setIsBulkDiscountEnabled(false);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        [field]: field === 'photos' ? [...(prev.photos || []), ...newFiles] : newFiles
      }));

      if (field === 'photos') {
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setPhotoPreviews(prev => [...prev, ...newPreviews]);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotoPreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      newPreviews.splice(index, 1);
      return newPreviews;
    });

    setFormData(prev => {
      const existingUrlsCount = prev.photo_urls.length;
      if (index < existingUrlsCount) {
        const newPhotoUrls = [...prev.photo_urls];
        newPhotoUrls.splice(index, 1);
        return { ...prev, photo_urls: newPhotoUrls };
      } else {
        const newPhotos = [...prev.photos];
        newPhotos.splice(index - existingUrlsCount, 1);
        return { ...prev, photos: newPhotos };
      }
    });
  };

  const handleAmenityChange = (amenityId: number) => {
    setFormData((prev) => {
      const amenities = prev.amenities.includes(amenityId)
        ? prev.amenities.filter((id) => id !== amenityId)
        : [...prev.amenities, amenityId];
      return { ...prev, amenities };
    });
  };

  const addCustomAmenity = () => {
    if (newCustomAmenity.trim()) {
      setFormData(prev => ({
        ...prev,
        customAmenities: [...prev.customAmenities, newCustomAmenity.trim()]
      }));
      setNewCustomAmenity('');
    }
  };

  const removeCustomAmenity = (index: number) => {
    const targetId = 2000 + index;
    setFormData(prev => {
      const updatedRoomTypeAmenities = { ...prev.roomTypeAmenities };
      
      // Remove targetId and shift down any IDs higher than it
      Object.keys(updatedRoomTypeAmenities).forEach(roomType => {
        const ids = updatedRoomTypeAmenities[roomType] || [];
        updatedRoomTypeAmenities[roomType] = ids
          .filter(id => id !== targetId)
          .map(id => (id > targetId && id >= 2000 ? id - 1 : id));
      });

      return {
        ...prev,
        customAmenities: prev.customAmenities.filter((_, i) => i !== index),
        roomTypeAmenities: updatedRoomTypeAmenities
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (formData.roomTypes.length > 0) {
      for (const roomType of formData.roomTypes) {
        const price = formData.roomTypePrices[roomType];
        const weekendPrice = formData.roomTypeWeekendPrices[roomType];
        if (!price || Number(price) <= 0) {
          setErrorMessage(`Please enter a valid price for ${roomType}.`);
          return;
        }
        if (!weekendPrice || Number(weekendPrice) <= 0) {
          setErrorMessage(`Please enter a valid weekend price for ${roomType}.`);
          return;
        }
      }
    } else {
      setErrorMessage("Please select at least one room type first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        setErrorMessage("You must be logged in to add a property.");
        setIsSubmitting(false);
        return;
      }

      const userId = session.user.id;
      const updatedFormData = { ...formData };

      // Consolidate all room type amenities into a unique global list for property-level view
      const allAmenityIds = new Set<number>();
      Object.values(formData.roomTypeAmenities).forEach(ids => {
        ids.forEach(id => allAmenityIds.add(id));
      });
      updatedFormData.amenities = Array.from(allAmenityIds);
      
      if (formData.roomTypes.length > 0) {
        const finalPrices = { ...formData.roomTypePrices };
        const finalWeekendPrices = { ...formData.roomTypeWeekendPrices };
        updatedFormData.roomTypePrices = finalPrices;
        updatedFormData.roomTypeWeekendPrices = finalWeekendPrices;
        
        // Find minimum custom prices for global indexing
        const pricesList = Object.values(finalPrices).map(p => parseFloat(String(p)) || 0).filter(p => p > 0);
        const minPrice = pricesList.length > 0 ? Math.min(...pricesList) : 0;

        const weekendPricesList = Object.values(finalWeekendPrices).map(p => parseFloat(String(p)) || 0).filter(p => p > 0);
        const minWeekendPrice = weekendPricesList.length > 0 ? Math.min(...weekendPricesList) : 0;
        
        updatedFormData.price = minPrice > 0 ? String(minPrice) : '';
        updatedFormData.weekendPrice = minWeekendPrice > 0 ? String(minWeekendPrice) : '';
      }
      
      const propertyNameSlug = formData.name.replace(/\s+/g, '-');

      // Upload photos
      const photoUrls: string[] = [...formData.photo_urls];
      for (const photo of formData.photos) {
        const url = await uploadFileToSupabase(photo, BUCKETS.propertyPhotos, `${userId}/properties/${propertyNameSlug}/photos`);
        photoUrls.push(url);
      }
      updatedFormData.photo_urls = photoUrls;

      if (formData.type === 'Tent') {
        // Tent: upload Aadhaar, PAN, NOC instead
        if (formData.aadhar.length > 0) {
          updatedFormData.aadhar_url = await uploadFileToSupabase(formData.aadhar[0], BUCKETS.propertyDocuments, `${userId}/properties/${propertyNameSlug}/documents/aadhar`);
        }
        if (formData.pan.length > 0) {
          updatedFormData.pan_url = await uploadFileToSupabase(formData.pan[0], BUCKETS.propertyDocuments, `${userId}/properties/${propertyNameSlug}/documents/pan`);
        }
        if (formData.noc.length > 0) {
          updatedFormData.noc_url = await uploadFileToSupabase(formData.noc[0], BUCKETS.propertyDocuments, `${userId}/properties/${propertyNameSlug}/documents/noc`);
        }
      } else {
        // Non-Tent: upload License, Tax Bill, Current Bill
        if (formData.license.length > 0) {
          updatedFormData.license_url = await uploadFileToSupabase(formData.license[0], BUCKETS.propertyDocuments, `${userId}/properties/${propertyNameSlug}/documents/license`);
        }
        if (formData.taxBill.length > 0) {
          updatedFormData.tax_bill_url = await uploadFileToSupabase(formData.taxBill[0], BUCKETS.propertyDocuments, `${userId}/properties/${propertyNameSlug}/documents/tax-bill`);
        }
        if (formData.currentBill.length > 0) {
          updatedFormData.current_bill_url = await uploadFileToSupabase(formData.currentBill[0], BUCKETS.propertyDocuments, `${userId}/properties/${propertyNameSlug}/documents/current-bill`);
        }
      }

      await onSaveProperty(updatedFormData);
      onClose(); // Close modal after successful submission
    } catch (error: any) {
      setErrorMessage('An unexpected error occurred. Please try again later.');
      console.error("Error saving property:", error);
      setIsSubmitting(false);
    }
  };

  const steps = [
    "Property Details",
    "Room Amenities",
    "Policies",
    "Uploads",
    "Pricing"
  ];

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 0) {
      if (formRef.current && !formRef.current.reportValidity()) {
        return;
      }

      if (!formData.latitude || !formData.longitude) {
        setErrorMessage("Please select the property location on the map.");
        return;
      }
    }

    // Validation for Room Amenities step (now Step 1)
    if (currentStep === 1) {
      const selectedRoomTypes = formData.roomTypes;
      if (selectedRoomTypes.length > 0) {
        const missingAmenities = selectedRoomTypes.filter(type => 
          !formData.roomTypeAmenities[type] || formData.roomTypeAmenities[type].length === 0
        );
        if (missingAmenities.length > 0) {
          setErrorMessage(`Please select amenities for: ${missingAmenities.join(', ')}`);
          return;
        }
      }
    }

    if (currentStep === 2) {
      if (formData.rules.length === 0) {
        setErrorMessage("Please select at least one house rule.");
        return;
      }
      if (formData.safetyItems.length === 0) {
        setErrorMessage("Please select at least one safety item.");
        return;
      }
    }

    if (currentStep === 3) {
      const hasPhotos = formData.photos.length > 0 || formData.photo_urls.length > 0;
      if (!hasPhotos) {
        setErrorMessage("Please upload at least one property photo.");
        return;
      }

      if (formData.type === 'Tent') {
        const tentDocsCount = [
          formData.aadhar.length > 0 || formData.aadhar_url,
          formData.pan.length > 0 || formData.pan_url,
          formData.noc.length > 0 || formData.noc_url,
        ].filter(Boolean).length;
        if (tentDocsCount < 2) {
          setErrorMessage("Tent property కోసం కనీసం 2 documents upload చేయాలి (Aadhaar, PAN, లేదా NOC లో ఏవైనా 2).");
          return;
        }
      } else {
        const docCount = [
          formData.license.length > 0 || formData.license_url,
          formData.taxBill.length > 0 || formData.tax_bill_url,
          formData.currentBill.length > 0 || formData.current_bill_url
        ].filter(Boolean).length;

        if (docCount < 2) {
          setErrorMessage("Please upload at least 2 documents (Property License, Tax Bill, or Utility Bill).");
          return;
        }
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-zinc-800">
          <h2 className="text-lg md:text-2xl font-bold text-white">{propertyToEdit ? 'Edit Property' : 'Create a new listing'}</h2>
          <button onClick={onClose} className="p-1.5 md:p-2 rounded-full hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5 md:h-6 md:w-6 text-zinc-400" />
          </button>
        </div>

        <div ref={scrollContainerRef} className="p-3 md:p-8 overflow-y-auto">
          <div className="mb-4 md:mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={index}>
                  <div className="flex items-center">
                    <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm ${index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-zinc-800 text-zinc-400'}`}>
                      {index + 1}
                    </div>
                    <p className={`ml-1.5 md:ml-4 text-[10px] md:text-sm font-semibold hidden sm:block ${index <= currentStep ? 'text-white' : 'text-zinc-500'}`}>{step}</p>
                  </div>
                  {index < steps.length - 1 && <div className="flex-1 h-px bg-zinc-800 mx-1.5 md:mx-4"></div>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            {currentStep === 0 && (
              <div className="space-y-4 md:space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <InputField label="Property Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Sunny Beachfront Villa" disabled={false} />
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-sm font-medium text-zinc-400">Country/region</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                      disabled={disabledFields.country}
                      className={`w-full bg-zinc-800 border-zinc-700 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition ${
                        disabledFields.country ? 'opacity-50 cursor-not-allowed bg-zinc-900/40 border-zinc-800' : ''
                      }`}
                    >
                      <option value="India - IN">India - IN</option>
                      {/* Add other countries if needed */}
                    </select>
                  </div>

                  <InputField label="Street address" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} placeholder="e.g. MG Road" disabled={disabledFields.addressLine2} />
                  <InputField label="Nearby landmark" name="landmark" value={formData.landmark} onChange={handleInputChange} placeholder="e.g. Near Apollo Hospital" disabled={disabledFields.landmark} />
                  <InputField label="District/locality" name="district" value={formData.district} onChange={handleInputChange} placeholder="e.g. Banjara Hills" disabled={disabledFields.district} />

                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <InputField label="City/town" name="city" value={formData.city} onChange={handleInputChange} disabled={disabledFields.city} />
                    <InputField label="State" name="state" value={formData.state} onChange={handleInputChange} disabled={disabledFields.state} />
                  </div>

                  <InputField label="PIN code" name="postalCode" value={formData.postalCode} onChange={handleInputChange} disabled={disabledFields.postalCode} />

                  <div className="md:col-span-2 rounded-2xl overflow-hidden h-[450px] bg-zinc-800 border border-zinc-700 relative shadow-2xl group/map">
                    <MapPicker
                      key={propertyToEdit?.id || 'new-property'}
                      lat={formData.latitude} 
                      lng={formData.longitude} 
                      onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                      onAddressSelect={(addressData) => {
                        console.log("Address Data received:", addressData);
                        
                        const cleanField = (val: string | undefined) => {
                          if (!val) return '';
                          return val
                            .replace(/Municipal Corporation|Municipal Council|M\.Corp|MC|Corporation|Municipality|Muncipality|Mpl/gi, '')
                            .replace(/\s+/g, ' ')
                            .trim();
                        };

                        const cityRaw = addressData.city || addressData.town || addressData.village || addressData.municipality;
                        const cleanedCity = cleanField(cityRaw);
                        
                        const landmarkRaw = addressData.amenity || addressData.tourism || addressData.historic || addressData.building || addressData.shop || addressData.leisure || addressData.office || addressData.place || addressData.neighbourhood;
                        
                        const toTitleCase = (str: string) => {
                          return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        };

                        const districtRaw = addressData.suburb || addressData.neighbourhood || addressData.city_district || addressData.state_district || addressData.county;

                        const newAddressLine2 = addressData.road ? toTitleCase(addressData.road) : '';
                        const newLandmark = landmarkRaw ? toTitleCase(cleanField(landmarkRaw)) : '';
                        const newCity = cleanedCity ? toTitleCase(cleanedCity) : '';
                        const newState = addressData.state ? toTitleCase(addressData.state) : '';
                        const newPostalCode = addressData.postcode || '';
                        const newDistrict = districtRaw ? toTitleCase(cleanField(districtRaw)) : '';

                        setFormData(prev => ({
                          ...prev,
                          addressLine2: newAddressLine2,
                          landmark: newLandmark,
                          city: newCity,
                          state: newState,
                          postalCode: newPostalCode,
                          district: newDistrict,
                        }));

                        setDisabledFields(prev => ({
                          ...prev,
                          addressLine2: !!newAddressLine2,
                          landmark: !!newLandmark,
                          city: !!newCity,
                          state: !!newState,
                          postalCode: !!newPostalCode,
                          district: !!newDistrict,
                          country: !!(addressData.country || prev.country || formData.country),
                        }));
                      }}
                      address={[
                        formData.addressLine2,
                        formData.landmark,
                        formData.district,
                        formData.city,
                        formData.state,
                        formData.postalCode,
                        formData.country ? formData.country.split(' - ')[0] : ''
                      ].filter(Boolean).join(', ')}
                    />
                  </div>


                </div>
                <div>
                  <label htmlFor="description" className="block text-xs md:text-sm font-medium text-zinc-400 mb-1.5 md:mb-2">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-white focus:ring-2 focus:ring-primary focus:border-primary transition"
                    placeholder="Describe your property in detail..."
                    required
                  />
                </div>
                <div className="relative" ref={categoryRef}>
                  <label className="block text-xs md:text-sm font-medium text-zinc-400 mb-1.5 md:mb-2">Property Type</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-white flex items-center justify-between hover:border-primary/50 transition-all focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <div className="flex items-center gap-3">
                      {formData.type ? (
                        <>
                          {React.createElement(propertyCategories.find(c => c.id === formData.type)?.icon || Building, { className: "w-5 h-5 text-sky-400" })}
                          <span className="font-medium">{formData.type}</span>
                        </>
                      ) : (
                        <span className="text-zinc-500">Select a Category</span>
                      )}
                    </div>
                    <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isCategoryOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute z-[60] left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 p-2 gap-1">
                          {propertyCategories.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                handleInputChange({ target: { name: 'type', value: category.id } } as any);
                                setIsCategoryOpen(false);
                              }}
                              className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left ${formData.type === category.id 
                                ? 'bg-primary text-white' 
                                : 'hover:bg-zinc-800 text-zinc-300 hover:text-white'}`}
                            >
                              <category.icon className={`w-5 h-5 ${formData.type === category.id ? 'text-white' : 'text-sky-400'}`} />
                              <span className="text-sm font-semibold">{category.name}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Hidden input for form validation */}
                  <input 
                    type="text" 
                    name="type" 
                    value={formData.type} 
                    required 
                    className="opacity-0 absolute inset-0 pointer-events-none" 
                    onChange={() => {}} 
                  />
                </div>

                {/* Room Type Selection based on Property Type */}
                {(() => {
                  const normalizedType = formData.type?.trim().toLowerCase();
                  const roomTypes = normalizedType ? PROPERTY_ROOM_TYPES[normalizedType] : null;
                  
                  if (!roomTypes) return null;

                  return (
                    <div className="space-y-1.5 md:space-y-2 animate-fade-in py-2">
                      <label className="text-xs md:text-sm font-medium text-zinc-400">Room Type Selection</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {roomTypes.map((roomType) => {
                          const isSelected = formData.roomTypes.includes(roomType);
                          const count = isSelected ? (formData.roomTypeCounts[roomType] || 1) : 0;
                          
                          return (
                            <div
                              key={roomType}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                                isSelected
                                  ? 'bg-sky-500/10 border-sky-400 text-white shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                                  : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:border-sky-500/50 hover:bg-zinc-800/80 hover:text-white'
                              }`}
                            >
                              {/* Click name to toggle selection */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (['Home Stay', 'Apartment', 'Villa'].includes(formData.type)) return;
                                  setFormData(prev => {
                                    const isSel = prev.roomTypes.includes(roomType);
                                    const newRoomTypes = isSel
                                      ? prev.roomTypes.filter(t => t !== roomType)
                                      : [...prev.roomTypes, roomType];
                                    
                                    const newCounts = { ...prev.roomTypeCounts };
                                    if (isSel) {
                                      delete newCounts[roomType];
                                    } else {
                                      newCounts[roomType] = 1;
                                    }
                                    
                                    return { ...prev, roomTypes: newRoomTypes, roomTypeCounts: newCounts };
                                  });
                                }}
                                className={`flex-1 text-left font-bold text-xs md:text-sm outline-none ${
                                  ['Home Stay', 'Apartment', 'Villa'].includes(formData.type) ? 'cursor-default' : ''
                                }`}
                              >
                                {roomType}
                              </button>

                              {/* Plus/Minus Controls */}
                              <div className="flex items-center gap-2.5 ml-2">
                                {isSelected ? (
                                  ['Home Stay', 'Apartment', 'Villa'].includes(formData.type) ? (
                                    <div className="flex items-center justify-center bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-1">
                                      <span className="text-xs md:text-sm font-black select-none text-white">1</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-800 rounded-lg p-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFormData(prev => {
                                            const currentCount = prev.roomTypeCounts[roomType] || 1;
                                            const newCount = currentCount - 1;
                                            if (newCount <= 0) {
                                              const newRoomTypes = prev.roomTypes.filter(t => t !== roomType);
                                              const newCounts = { ...prev.roomTypeCounts };
                                              delete newCounts[roomType];
                                              return { ...prev, roomTypes: newRoomTypes, roomTypeCounts: newCounts };
                                            } else {
                                              return {
                                                ...prev,
                                                roomTypeCounts: { ...prev.roomTypeCounts, [roomType]: newCount }
                                              };
                                            }
                                          });
                                        }}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-sky-400 font-black text-sm select-none"
                                      >
                                        -
                                      </button>
                                      <span className="text-xs md:text-sm font-black w-4 text-center select-none text-white">{count}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFormData(prev => {
                                            const currentCount = prev.roomTypeCounts[roomType] || 1;
                                            return {
                                              ...prev,
                                              roomTypeCounts: { ...prev.roomTypeCounts, [roomType]: currentCount + 1 }
                                            };
                                          });
                                        }}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-sky-400 font-black text-sm select-none"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setFormData(prev => {
                                      const newRoomTypes = [...prev.roomTypes, roomType];
                                      const newCounts = { ...prev.roomTypeCounts, [roomType]: 1 };
                                      return { ...prev, roomTypes: newRoomTypes, roomTypeCounts: newCounts };
                                    })}
                                    className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider bg-zinc-800 hover:bg-sky-500 hover:text-white rounded border border-zinc-700/60 transition-all text-zinc-350"
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                {/* Check-in & Check-out Timings */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Timing Protocol</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Check-in Card */}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <div className="relative p-3 md:p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl hover:border-sky-500/30 transition-all">
                        <label className="block text-[9px] font-black text-sky-400 uppercase tracking-[0.2em] mb-1.5">Check-in After</label>
                        <div className="relative">
                          <select 
                            name="checkInTime" 
                            value={formData.checkInTime} 
                            onChange={handleInputChange}
                            className="w-full bg-transparent border-none p-0 text-sm md:text-base font-bold text-white focus:ring-0 outline-none appearance-none cursor-pointer"
                          >
                            {["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"].map(time => (
                              <option key={time} value={time} className="bg-zinc-900 text-white font-bold">{time}</option>
                            ))}
                          </select>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Plus className="w-3 h-3 text-sky-400 opacity-30 rotate-45" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Check-out Card */}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <div className="relative p-3 md:p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl hover:border-rose-500/30 transition-all">
                        <label className="block text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1.5">Check-out Before</label>
                        <div className="relative">
                          <select 
                            name="checkOutTime" 
                            value={formData.checkOutTime} 
                            onChange={handleInputChange}
                            className="w-full bg-transparent border-none p-0 text-sm md:text-base font-bold text-white focus:ring-0 outline-none appearance-none cursor-pointer"
                          >
                            {["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"].map(time => (
                              <option key={time} value={time} className="bg-zinc-900 text-white font-bold">{time}</option>
                            ))}
                          </select>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Plus className="w-3 h-3 text-rose-400 opacity-30 rotate-45" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NEW FIELDS: Bedrooms, Bathrooms, Area, Max Guests, Total Rooms */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">

                  {/* Total Rooms / Units Input */}
                  <div className={`bg-zinc-800 p-2.5 md:p-4 rounded-xl border border-zinc-700/50 ${['Home Stay', 'Apartment', 'Villa', 'Dormitory'].includes(formData.type) ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
                      <Building2 className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                      <label htmlFor="totalRooms" className="block text-xs md:text-sm font-medium text-zinc-300">
                        {formData.type === 'Tent' ? 'Total Tents/Units' : 'Total Rooms/Units'}
                      </label>
                      {['Home Stay', 'Apartment', 'Villa', 'Dormitory'].includes(formData.type) && <span className="text-[10px] md:text-xs text-amber-400">(N/A)</span>}
                    </div>
                    <div className="flex justify-center">
                      <NumberInput
                        value={formData.totalRooms}
                        onChange={(val) => setFormData(prev => ({ ...prev, totalRooms: val }))}
                        min={1}
                        disabled={['Home Stay', 'Apartment', 'Villa', 'Dormitory'].includes(formData.type)}
                      />
                    </div>
                    <p className="text-[10px] md:text-xs text-zinc-500 mt-1 text-center">
                      {formData.type === 'Tent' ? 'For tent bookings.' : 'For bulk bookings.'}
                    </p>
                  </div>
                  <div className={`bg-zinc-800 p-2.5 md:p-4 rounded-xl border border-zinc-700/50 ${['Tent', 'Dormitory', 'Hotel', 'Resort'].includes(formData.type) ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
                      <Home className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                      <label htmlFor="bedrooms" className="block text-xs md:text-sm font-medium text-zinc-300">Bedrooms</label>
                      {['Tent', 'Dormitory', 'Hotel', 'Resort'].includes(formData.type) && <span className="text-[10px] md:text-xs text-amber-400">(N/A)</span>}
                    </div>
                    <div className="flex justify-center">
                              <NumberInput
                        value={formData.bedrooms}
                        onChange={(val) => !['Tent', 'Dormitory', 'Hotel', 'Resort'].includes(formData.type) && setFormData(prev => ({ ...prev, bedrooms: val }))}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-800 p-2.5 md:p-4 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
                      <Bed className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                      <label htmlFor="beds" className="block text-xs md:text-sm font-medium text-zinc-300">Beds</label>
                    </div>
                    <div className="flex justify-center">
                      <NumberInput
                        value={formData.beds}
                        onChange={(val) => setFormData(prev => ({ ...prev, beds: val }))}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-800 p-2.5 md:p-4 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
                      <Bath className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                      <label htmlFor="bathrooms" className="block text-xs md:text-sm font-medium text-zinc-300">Bathrooms</label>
                    </div>
                    <div className="flex justify-center">
                      <NumberInput
                        value={formData.bathrooms}
                        onChange={(val) => setFormData(prev => ({ ...prev, bathrooms: val }))}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className={`bg-zinc-800 p-2.5 md:p-4 rounded-xl border border-zinc-700/50 ${formData.type === 'Tent' ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
                      <Layers className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                      <label htmlFor="area" className="block text-xs md:text-sm font-medium text-zinc-300">Area (sq ft)</label>
                      {formData.type === 'Tent' && <span className="text-[10px] md:text-xs text-amber-400">(N/A)</span>}
                    </div>
                    <div className="flex justify-center">
                      <NumberInput
                        value={formData.area}
                        onChange={(val) => formData.type !== 'Tent' && setFormData(prev => ({ ...prev, area: val }))}
                        min={0}
                        max={100000}
                        step={10}
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-800 p-2.5 md:p-4 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                      <label htmlFor="maxGuests" className="block text-xs md:text-sm font-medium text-zinc-300">{formData.type === 'Dormitory' ? 'Max Guests/per bed' : 'Max Guests/per unit'}</label>
                    </div>
                    <div className="flex justify-center">
                      <NumberInput
                        value={formData.maxGuests}
                        onChange={(val) => setFormData(prev => ({ ...prev, maxGuests: val }))}
                        min={1}
                      />
                    </div>
                  </div>
                </div>




              </div>
            )}

            {currentStep === 1 && (
              <div className="animate-fade-in space-y-12">
                <div className="space-y-4">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    మీరు ఎంచుకున్న ప్రతి రూమ్ టైప్ కి విడివిడిగా అమూల్యమైన సదుపాయాలను ఎంచుకోండి. (Select separate amenities for each chosen room type).
                  </p>
                </div>

                {/* Custom Amenities Input Section */}
                <div className="bg-zinc-900/40 border border-zinc-800 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-lg">
                  <div className="flex items-center gap-2">
                    <ListPlus className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Custom Amenities (మనువల్ గా చేర్చండి)</h4>
                  </div>
                  <p className="text-xs text-zinc-400">
                    కింది లిస్ట్‌లో లేని సదుపాయాలను ఇక్కడ టైప్ చేసి యాడ్ చేసుకోండి. అవి ప్రతి రూమ్ టైప్‌లో "Custom Amenities" కేటగిరీ కింద కనిపిస్తాయి.
                    (Type and add custom amenities here. They will appear under the "Custom Amenities" category for each room type.)
                  </p>
                  
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={newCustomAmenity}
                        onChange={(e) => setNewCustomAmenity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomAmenity();
                          }
                        }}
                        placeholder="e.g. Private Pool, Hammock, Mini Bar..."
                        className="w-full bg-zinc-800/50 border border-zinc-700/60 hover:border-sky-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-medium placeholder:text-zinc-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addCustomAmenity}
                      className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] shrink-0 flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>

                  {formData.customAmenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {formData.customAmenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800/80 text-zinc-300 border border-zinc-700/50"
                        >
                          <span>{amenity}</span>
                          <button
                            type="button"
                            onClick={() => removeCustomAmenity(idx)}
                            className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer outline-none"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {formData.roomTypes.length === 0 ? (
                  <div className="p-12 border-2 border-dashed border-zinc-800 rounded-[2rem] text-center bg-zinc-900/50">
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-zinc-600" />
                    </div>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No Room Types Selected</p>
                    <p className="text-zinc-600 text-[10px] mt-2">Go back to Step 0 to select room types for this property.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {formData.roomTypes.map((roomType) => {
                      const isRoomTypeExpanded = !!expandedRoomTypes[roomType];
                      const selectedCount = (formData.roomTypeAmenities[roomType] || []).length;
                      const isCompleted = selectedCount > 0;
                      
                      return (
                        <div 
                          key={roomType} 
                          className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                            isRoomTypeExpanded 
                              ? 'bg-zinc-800/20 border-sky-500/30 shadow-[0_4px_25px_rgba(14,165,233,0.08)]' 
                              : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700/60 hover:bg-zinc-800/10'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedRoomTypes(prev => ({
                              ...prev,
                              [roomType]: !prev[roomType]
                            }))}
                            className="w-full flex items-center justify-between py-4 px-5 transition-all text-left outline-none cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              {/* Accent indicator / Room Icon */}
                              <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                                isCompleted 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
                              }`}>
                                <Bed className="w-5 h-5" />
                              </div>
                              
                              <div>
                                <h4 className="text-sm md:text-base font-bold text-white tracking-wide uppercase">
                                  {roomType}
                                </h4>
                                <p className="text-[10px] md:text-xs text-zinc-500 font-medium mt-0.5">
                                  Configure inventory amenities and features
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Status pill badge */}
                              {isCompleted ? (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  <span>{selectedCount} Selected</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                  <AlertCircle className="w-3 h-3 text-amber-400" />
                                  <span>Required</span>
                                </span>
                              )}
                              
                              <div className={`p-1 rounded-full transition-transform duration-300 ${
                                isRoomTypeExpanded ? 'rotate-180 bg-sky-500/10 text-sky-400' : 'bg-transparent text-zinc-500'
                              }`}>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isRoomTypeExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                className="overflow-hidden border-t border-zinc-800/60"
                              >
                                <div className="p-5 space-y-6">
                                  <div className="space-y-4">
                                    {Object.entries(CATEGORIZED_AMENITIES)
                                      .map(([category, items]: [string, AmenityItem[]]) => {
                                        let filteredItems = items;
                                        if (formData.type?.toLowerCase() === 'tent') {
                                          const tentAmenityIds = [103, 104, 106, 2002, 2003, 2004, 2007, 2008, 2009, 2014, 2013, 504, 701, 2017, 601, 602, 603, 1002, 1003, 1004, 1005, 1006, 1201, 1203, 1204];
                                          filteredItems = items.filter(item => tentAmenityIds.includes(item.id));
                                        }
                                        return [category, filteredItems] as [string, AmenityItem[]];
                                      })
                                      .filter(([_, items]) => items.length > 0)
                                      .map(([category, items]) => {
                                      const isExpanded = !!expandedCategories[`${roomType}-${category}`];
                                      const categoryIds = items.map(item => item.id);
                                      const selectedInCategoryCount = (formData.roomTypeAmenities[roomType] || []).filter(id => categoryIds.includes(id)).length;

                                      return (
                                        <div key={category} className="space-y-3">
                                          <button
                                            type="button"
                                            onClick={() => setExpandedCategories(prev => ({
                                              ...prev,
                                              [`${roomType}-${category}`]: !prev[`${roomType}-${category}`]
                                            }))}
                                            className={`w-full flex items-center justify-between py-3 px-4 rounded-xl border transition-all text-left outline-none cursor-pointer ${
                                              isExpanded 
                                                ? 'bg-zinc-800/40 border-zinc-700/60' 
                                                : 'bg-zinc-900/20 border-zinc-800/60 hover:bg-zinc-800/40 hover:border-zinc-700'
                                            }`}
                                          >
                                            <div className="flex items-center gap-3">
                                              <span className="text-xs font-bold text-zinc-300 tracking-wider uppercase">{category}</span>
                                              {selectedInCategoryCount > 0 && (
                                                <span className="text-[9px] font-extrabold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                                                  {selectedInCategoryCount} Selected
                                                </span>
                                              )}
                                            </div>
                                            <div className={`p-0.5 rounded-full transition-transform duration-300 ${
                                              isExpanded ? 'rotate-180 text-sky-400' : 'text-zinc-500'
                                            }`}>
                                              <ChevronDown className="w-3.5 h-3.5" />
                                            </div>
                                          </button>
                                          
                                          <AnimatePresence initial={false}>
                                            {isExpanded && (
                                              <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                                className="overflow-hidden"
                                              >
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1 pb-3">
                                                  {items.map((amenity: AmenityItem) => {
                                                    const isSelected = (formData.roomTypeAmenities[roomType] || []).includes(amenity.id);
                                                    return (
                                                      <button
                                                        key={amenity.id}
                                                        type="button"
                                                        onClick={() => setFormData(prev => {
                                                          const currentRoomAmenities = prev.roomTypeAmenities[roomType] || [];
                                                          const newRoomAmenities = currentRoomAmenities.includes(amenity.id)
                                                            ? currentRoomAmenities.filter(id => id !== amenity.id)
                                                            : [...currentRoomAmenities, amenity.id];
                                                          return {
                                                            ...prev,
                                                            roomTypeAmenities: {
                                                              ...prev.roomTypeAmenities,
                                                              [roomType]: newRoomAmenities
                                                            }
                                                          };
                                                        })}
                                                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 group relative cursor-pointer outline-none ${
                                                          isSelected
                                                            ? 'bg-sky-500 border-sky-400 text-white shadow-[0_4px_15px_rgba(14,165,233,0.25)] scale-[1.02]'
                                                            : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/80 hover:text-white'
                                                        }`}
                                                      >
                                                        <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                                                          isSelected ? 'bg-white/10 text-white' : 'bg-zinc-900/50 text-sky-400 group-hover:text-sky-300'
                                                        }`}>
                                                          <amenity.icon className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-[11px] font-bold uppercase tracking-wide leading-tight select-none">{amenity.name}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      );
                                    })}

                                    {/* Render Custom Amenities category inside Room Type if any exist */}
                                    {formData.customAmenities.length > 0 && (() => {
                                      const isCustomExpanded = !!expandedCategories[`${roomType}-custom`];
                                      const selectedCustomCount = (formData.roomTypeAmenities[roomType] || []).filter(id => id >= 2000).length;

                                      return (
                                        <div className="space-y-3">
                                          <button
                                            type="button"
                                            onClick={() => setExpandedCategories(prev => ({
                                              ...prev,
                                              [`${roomType}-custom`]: !prev[`${roomType}-custom`]
                                            }))}
                                            className={`w-full flex items-center justify-between py-3 px-4 rounded-xl border transition-all text-left outline-none cursor-pointer ${
                                              isCustomExpanded 
                                                ? 'bg-zinc-800/40 border-zinc-700/60' 
                                                : 'bg-zinc-900/20 border-zinc-800/60 hover:bg-zinc-800/40 hover:border-zinc-700'
                                            }`}
                                          >
                                            <div className="flex items-center gap-3">
                                              <span className="text-xs font-bold text-zinc-300 tracking-wider uppercase">Custom Amenities</span>
                                              {selectedCustomCount > 0 && (
                                                <span className="text-[9px] font-extrabold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                                                  {selectedCustomCount} Selected
                                                </span>
                                              )}
                                            </div>
                                            <div className={`p-0.5 rounded-full transition-transform duration-300 ${
                                              isCustomExpanded ? 'rotate-180 text-sky-400' : 'text-zinc-500'
                                            }`}>
                                              <ChevronDown className="w-3.5 h-3.5" />
                                            </div>
                                          </button>
                                          
                                          <AnimatePresence initial={false}>
                                            {isCustomExpanded && (
                                              <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                                className="overflow-hidden"
                                              >
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1 pb-3">
                                                  {formData.customAmenities.map((name, index) => {
                                                    const customId = 2000 + index;
                                                    const isSelected = (formData.roomTypeAmenities[roomType] || []).includes(customId);
                                                    return (
                                                      <button
                                                        key={customId}
                                                        type="button"
                                                        onClick={() => setFormData(prev => {
                                                          const currentRoomAmenities = prev.roomTypeAmenities[roomType] || [];
                                                          const newRoomAmenities = currentRoomAmenities.includes(customId)
                                                            ? currentRoomAmenities.filter(id => id !== customId)
                                                            : [...currentRoomAmenities, customId];
                                                          return {
                                                            ...prev,
                                                            roomTypeAmenities: {
                                                              ...prev.roomTypeAmenities,
                                                              [roomType]: newRoomAmenities
                                                            }
                                                          };
                                                        })}
                                                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 group relative cursor-pointer outline-none ${
                                                          isSelected
                                                            ? 'bg-sky-500 border-sky-400 text-white shadow-[0_4px_15px_rgba(14,165,233,0.25)] scale-[1.02]'
                                                            : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:border-zinc-650 hover:bg-zinc-800/80 hover:text-white'
                                                        }`}
                                                      >
                                                        <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                                                          isSelected ? 'bg-white/10 text-white' : 'bg-zinc-900/50 text-sky-400 group-hover:text-sky-300'
                                                        }`}>
                                                          <Sparkles className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-[11px] font-bold uppercase tracking-wide leading-tight select-none">{name}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  
                                  <div className="bg-zinc-950/20 border border-zinc-800/80 p-4 rounded-2xl">
                                    {(() => {
                                      const AMENITY_PRESETS = [
                                        {
                                          label: 'Standard Double Room',
                                          amenities: [2007, 2008, 2009, 2010, 209, 204, 2011, 2025, 2026, 702, 501, 701, 2016, 301, 2012, 2013, 2014, 2015, 2001, 103, 2002, 2003, 106, 104, 2004, 102, 2017, 808, 2018, 804, 802, 1202, 2019, 2020, 2021],
                                          color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600',
                                          forRoomTypes: ['Double Room'],
                                        },
                                        {
                                          label: 'Standard Single Room',
                                          amenities: [2007, 2008, 2009, 2010, 209, 204, 2011, 702, 501, 301, 701, 2012, 2013, 2014, 2001, 2002, 2003, 106, 104, 2004, 2005, 103, 2017, 808, 2018, 804, 1202, 2019, 2021],
                                          color: 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-600',
                                          forRoomTypes: ['Single Room'],
                                        },
                                        {
                                          label: 'Standard Basic',
                                          amenities: [103, 104, 106, 2001, 2002, 2003, 2004, 2007, 2008, 2009, 701, 501, 301, 1202],
                                          color: 'bg-zinc-800/50 text-zinc-350 border-zinc-700/60 hover:bg-zinc-700',
                                          forRoomTypes: ['Standard Room'],
                                        },
                                        {
                                          label: 'Premium Luxury',
                                          amenities: [103, 104, 106, 2001, 2002, 2003, 2004, 2007, 2008, 2009, 701, 501, 301, 1202, 2010, 209, 2011, 702, 2012, 2013, 2014, 2015, 2016, 802, 808, 2022, 2023, 2024, 2006],
                                          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-600',
                                          forRoomTypes: [],
                                        },
                                        {
                                          label: 'Home',
                                          amenities: [103, 104, 106, 2001, 2002, 2003, 2004, 2007, 2008, 2009, 209, 702, 501, 301, 701, 2013, 801, 802, 807, 812, 2017, 1003, 1101],
                                          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600',
                                          forRoomTypes: ['Entire Home'],
                                        },
                                        {
                                          label: 'Villa',
                                          amenities: [103, 104, 106, 2001, 2002, 2003, 2004, 101, 2006, 2007, 2008, 2009, 209, 702, 501, 2016, 701, 2015, 2013, 801, 802, 803, 807, 812, 2017, 2022, 2023, 1001, 1002, 1003, 1004, 1101, 1102],
                                          color: 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-600',
                                          forRoomTypes: ['Entire Villa'],
                                        },
                                        {
                                          label: 'Cottage',
                                          amenities: [103, 104, 106, 2001, 2002, 2003, 2004, 2007, 2008, 2009, 209, 501, 301, 701, 808, 2018, 2014, 1001, 1003, 1005, 1006, 1101],
                                          color: 'bg-teal-500/10 text-teal-400 border-teal-500/20 hover:bg-teal-600',
                                          forRoomTypes: ['Cottage'],
                                        },
                                        {
                                          label: 'Apartment',
                                          amenities: [103, 104, 106, 2001, 2002, 2003, 2004, 2007, 2008, 2009, 209, 501, 301, 701, 2020, 801, 802, 803, 807, 812, 1001],
                                          color: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-600',
                                          forRoomTypes: ['Entire Apartment'],
                                        },
                                        {
                                          label: 'Standard Tent',
                                          amenities: [103, 104, 2003, 2004, 2007, 2008, 2009, 701, 2013, 504, 2017, 1002, 1003, 1005],
                                          color: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-600',
                                          forRoomTypes: ['Standard Tent'],
                                        },
                                        {
                                          label: 'Luxury Tent',
                                          amenities: [103, 104, 2003, 2004, 2007, 2008, 2009, 701, 2013, 504, 2017, 1001, 1002, 1003, 1004, 1005, 1006, 2001, 2002, 2010, 209],
                                          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-600',
                                          forRoomTypes: ['Luxury Tent'],
                                        },
                                        {
                                          label: 'Wooden Cabin',
                                          amenities: [103, 104, 106, 2001, 2002, 2003, 2004, 2007, 2008, 2009, 2010, 209, 501, 301, 701, 2014, 808, 2018, 2017, 502, 1001, 1003, 1004, 1005, 1101],
                                          color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-600',
                                          forRoomTypes: [],
                                        },
                                        {
                                          label: 'Dorm Bed',
                                          amenities: [103, 104, 106, 2002, 2003, 2004, 2005, 2007, 2008, 2009, 209, 204, 501, 701, 2013, 2014, 1202, 2017],
                                          color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-600',
                                          forRoomTypes: ['Dorm Bed'],
                                        },
                                        {
                                          label: 'AC Room',
                                          amenities: [103, 104, 106, 2001, 2002, 2003, 2004, 2007, 2008, 2009, 2010, 209, 501, 301, 701, 2013, 2014, 808, 2017, 1202],
                                          color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-600',
                                          forRoomTypes: ['AC Room'],
                                        },
                                        {
                                          label: 'Suite Room',
                                          amenities: [103, 104, 106, 101, 2001, 2002, 2003, 2004, 2006, 2007, 2008, 2009, 2010, 209, 204, 2011, 2025, 2026, 702, 501, 701, 2016, 301, 2012, 2013, 2014, 2015, 802, 804, 808, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 1202],
                                          color: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20 hover:bg-fuchsia-600',
                                          forRoomTypes: ['Suite'],
                                        },
                                        {
                                          label: 'Twin Room',
                                          amenities: [2007, 2008, 2009, 2010, 209, 204, 2011, 702, 501, 701, 2016, 301, 2012, 2013, 2014, 2015, 2001, 103, 2002, 2003, 106, 104, 2004, 2017, 808, 2018, 804, 802, 1202, 2019, 2021],
                                          color: 'bg-lime-500/10 text-lime-400 border-lime-500/20 hover:bg-lime-600',
                                          forRoomTypes: ['Twin Room'],
                                        },
                                        {
                                          label: 'Standard Wooden Room',
                                          amenities: [103, 104, 106, 2001, 2002, 2003, 2004, 2007, 2008, 2009, 209, 501, 301, 701, 2014, 808, 2017, 1001, 1003, 1101],
                                          color: 'bg-stone-500/10 text-stone-400 border-stone-500/20 hover:bg-stone-600',
                                          forRoomTypes: ['Standard Wooden Room'],
                                        },
                                        {
                                          label: 'Deluxe Wooden Cabin',
                                          amenities: [103, 104, 106, 2001, 2002, 2003, 2004, 2006, 2007, 2008, 2009, 2010, 209, 501, 301, 701, 2014, 2015, 808, 2018, 2017, 502, 802, 1001, 1003, 1004, 1005, 1101, 2022, 2023],
                                          color: 'bg-amber-600/10 text-amber-500 border-amber-600/20 hover:bg-amber-700',
                                          forRoomTypes: ['Deluxe Wooden Cabin'],
                                        },
                                        {
                                          label: 'Deluxe Room',
                                          amenities: [103, 104, 106, 2001, 2002, 2003, 2004, 2007, 2008, 2009, 2010, 209, 501, 301, 701, 2013, 2014, 808, 2017, 1202, 2012, 2015, 2016],
                                          color: 'bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-600',
                                          forRoomTypes: ['Deluxe Room'],
                                        },
                                        {
                                          label: 'Single Dorm Bed',
                                          amenities: [103, 104, 106, 2002, 2003, 2004, 2005, 2007, 2008, 2009, 209, 204, 501, 701, 2013, 2014, 1202, 2017],
                                          color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600',
                                          forRoomTypes: ['Single Bed'],
                                        },
                                        {
                                          label: 'Double Dorm Bed',
                                          amenities: [103, 104, 106, 2002, 2003, 2004, 2005, 2007, 2008, 2009, 209, 204, 501, 701, 2013, 2014, 1202, 2017],
                                          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600',
                                          forRoomTypes: ['Double Bed'],
                                        },
                                        {
                                          label: 'AC Dorm Bed',
                                          amenities: [103, 104, 106, 2001, 2002, 2003, 2004, 2007, 2008, 2009, 2010, 209, 501, 301, 701, 2013, 2014, 808, 2017, 1202],
                                          color: 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-600',
                                          forRoomTypes: ['AC Bed'],
                                        },
                                      ];

                                      const filteredPresets = AMENITY_PRESETS.filter(p => p.forRoomTypes.includes(roomType));

                                      if (filteredPresets.length === 0) return null;

                                      return (
                                        <div className="flex flex-wrap gap-2">
                                          {filteredPresets.map(preset => (
                                            <button
                                              key={preset.label}
                                              type="button"
                                              onClick={() => setFormData(prev => ({
                                                ...prev,
                                                roomTypeAmenities: {
                                                  ...prev.roomTypeAmenities,
                                                  [roomType]: preset.amenities
                                                }
                                              }))}
                                              className={`px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border hover:text-white transition-all cursor-pointer ${preset.color}`}
                                            >
                                              {preset.label}
                                            </button>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 md:space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">Cancellation Policy</h3>
                  <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                    {['Tiered'].map((policy) => (
                      <div
                        key={policy}
                        onClick={() => setFormData(prev => ({ ...prev, cancellationPolicy: policy }))}
                        className={`p-2.5 md:p-4 border rounded-lg cursor-pointer transition-all ${formData.cancellationPolicy === policy
                          ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                          : 'bg-zinc-800 border-zinc-700 hover:border-primary/50'
                          }`}
                      >
                        <p className="font-semibold text-sm md:text-base text-center">{policy}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">House Rules</h3>
                  <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                    {['No smoking', 'No pets', 'No parties or events', 'Quiet hours', 'Self check-in', 'Suitable for infants', 'Suitable for children', 'Pets welcome', 'Events allowed', 'Smoking allowed', 'Commercial photography allowed'].map((rule) => (
                      <div
                        key={rule}
                        onClick={() => setFormData(prev => {
                          const newRules = prev.rules.includes(rule)
                            ? prev.rules.filter(r => r !== rule)
                            : [...prev.rules, rule];
                          return { ...prev, rules: newRules };
                        })}
                        className={`p-2.5 md:p-4 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${formData.rules.includes(rule)
                          ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                          : 'bg-zinc-800 border-zinc-700 hover:border-primary/50'
                          }`}
                      >
                        <span className="text-sm md:text-base font-medium">{rule}</span>
                        {formData.rules.includes(rule) && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white"></div>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">Safety & Property</h3>
                  <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                    {['Smoke alarm', 'Carbon monoxide alarm', 'First aid kit', 'Fire extinguisher', 'Security cameras', 'Pool safety gate', 'Nearby lake/river', 'Climbing or play structure', 'Heights/Railings'].map((item) => (
                      <div
                        key={item}
                        onClick={() => setFormData(prev => {
                          const newItems = prev.safetyItems.includes(item)
                            ? prev.safetyItems.filter(i => i !== item)
                            : [...prev.safetyItems, item];
                          return { ...prev, safetyItems: newItems };
                        })}
                        className={`p-2.5 md:p-4 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${formData.safetyItems.includes(item)
                          ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                          : 'bg-zinc-800 border-zinc-700 hover:border-primary/50'
                          }`}
                      >
                        <span className="text-sm md:text-base font-medium">{item}</span>
                        {formData.safetyItems.includes(item) && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white"></div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 md:space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">Property Photos</h3>
                  <div className="p-4 md:p-6 border-2 border-dashed border-zinc-700 rounded-lg text-center bg-zinc-800">
                    <input type="file" id="photos" name="photos" multiple onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'photos')} className="hidden" />
                    <label htmlFor="photos" className="cursor-pointer">
                      <Plus className="mx-auto h-8 w-8 md:h-12 md:w-12 text-zinc-500" />
                      <p className="mt-1.5 md:mt-2 text-xs md:text-sm text-zinc-400">Drag & drop photos here, or click to select files</p>
                    </label>
                  </div>
                  <div className="mt-4 md:mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-4">
                    {photoPreviews.map((previewUrl, index) => (
                      <div key={index} className="relative w-full h-24 md:h-32 rounded-lg overflow-hidden group">
                        <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(index)} className="absolute top-1 right-1 md:top-2 md:right-2 bg-black bg-opacity-50 p-1 md:p-1.5 rounded-full text-white opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3 md:h-4 md:w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.type === 'Tent' ? (
                  <>
                    <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                      <p className="text-sm font-semibold text-amber-400">🏕️ Tent Property — Identity Documents Required</p>
                      <p className="text-xs text-zinc-400 mt-1">కనీసం <span className="text-amber-400 font-bold">2 documents</span> upload చేయాలి — Aadhaar Card, PAN Card, లేదా NOC (No Objection Certificate) లో ఏవైనా రెండు.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <FileUploadField label="Aadhaar Card" name="aadhar" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'aadhar')} fileName={formData.aadhar[0]?.name} currentUrl={formData.aadhar_url} />
                      <FileUploadField label="PAN Card" name="pan" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'pan')} fileName={formData.pan[0]?.name} currentUrl={formData.pan_url} />
                      <FileUploadField label="NOC (No Objection Certificate)" name="noc" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'noc')} fileName={formData.noc[0]?.name} currentUrl={formData.noc_url} />
                    </div>
                  </>
                ) : null}

                {/* Property License, Tax Bill, Current Utility Bill - disabled for Tent */}
                {formData.type !== 'Tent' && (
                  <div className="mb-4 p-4 bg-sky-500/10 border border-sky-500/30 rounded-xl">
                    <p className="text-sm font-semibold text-sky-400">📄 Upload Any Two Documents</p>
                    <p className="text-xs text-zinc-400 mt-1">కనీసం <span className="text-sky-400 font-bold">2 documents</span> upload చేయాలి — Property License, Tax Bill, లేదా Current Utility Bill లో ఏవైనా రెండు.</p>
                  </div>
                )}
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 ${formData.type === 'Tent' ? 'opacity-40 pointer-events-none' : ''}`}>
                  {formData.type === 'Tent' && (
                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
                      <p className="text-xs text-amber-400">⚠️ Property License, Tax Bill, and Current Utility Bill are not required for Tent listings.</p>
                    </div>
                  )}
                  <FileUploadField label="Property License" name="license" onChange={(e: React.ChangeEvent<HTMLInputElement>) => !formData.type.includes('Tent') && handleFileChange(e, 'license')} fileName={formData.license[0]?.name} currentUrl={formData.license_url} disabled={formData.type === 'Tent'} />
                  <FileUploadField label="Tax Bill" name="taxBill" onChange={(e: React.ChangeEvent<HTMLInputElement>) => !formData.type.includes('Tent') && handleFileChange(e, 'taxBill')} fileName={formData.taxBill[0]?.name} currentUrl={formData.tax_bill_url} disabled={formData.type === 'Tent'} />
                  <FileUploadField label="Current Utility Bill" name="currentBill" onChange={(e: React.ChangeEvent<HTMLInputElement>) => !formData.type.includes('Tent') && handleFileChange(e, 'currentBill')} fileName={formData.currentBill[0]?.name} currentUrl={formData.current_bill_url} disabled={formData.type === 'Tent'} />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-white tracking-tight italic uppercase italic">Set Your Prices</h3>
                </div>

                {/* Per-Room-Type Custom Pricing Section */}
                {formData.roomTypes.length > 0 ? (
                  <div className="space-y-4 md:space-y-5 animate-fade-in">
                    <div className="flex items-center gap-3 px-1">
                      <div className="p-1.5 bg-sky-500/10 rounded-lg border border-sky-500/20">
                        <Building2 className="w-4 h-4 text-sky-400" />
                      </div>
                      <h4 className="text-xs md:text-sm font-black text-white uppercase tracking-[0.2em] italic">Per-Room-Type Custom Rates</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      {formData.roomTypes.map((roomType) => {
                        const priceVal = parseFloat(String(formData.roomTypePrices[roomType])) || 0;
                        const wPriceVal = parseFloat(String(formData.roomTypeWeekendPrices[roomType])) || 0;
                        const hasCustomPrice = priceVal > 0 || wPriceVal > 0;
                        
                        let markupPct = 0;
                        if (priceVal > 0 && wPriceVal > priceVal) {
                          markupPct = Math.round(((wPriceVal - priceVal) / priceVal) * 100);
                        }

                        const weekdayPlaceholder = "e.g. 1500";
                        const weekendPlaceholder = "e.g. 1800";

                        return (
                          <div 
                            key={roomType} 
                            className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-5 md:p-6 hover:border-sky-500/30 focus-within:border-sky-500/30 focus-within:shadow-[0_4px_30px_rgba(14,165,233,0.05)] transition-all duration-300 group relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-500/5 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-all duration-500" />

                            <div className="flex items-center justify-between mb-4 md:mb-5 relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sky-400 group-hover:text-sky-300 transition-colors">
                                  <Bed className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs md:text-sm font-black text-white uppercase tracking-wider">{roomType}</h5>
                                    {hasCustomPrice ? (
                                      <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 tracking-widest uppercase">Customized</span>
                                    ) : null}
                                  </div>
                                  <p className="text-[10px] text-zinc-500 mt-0.5">Customize weekday and weekend pricing for this room type</p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Weekday Price</span>
                                  <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">Mon-Fri</span>
                                </div>
                                <div className="relative flex items-center bg-zinc-950/50 border border-zinc-800 hover:border-zinc-750/60 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 rounded-xl px-3.5 py-3 transition-all">
                                  <span className="text-zinc-500 font-bold mr-2 select-none">₹</span>
                                  <input
                                    type="number"
                                    value={formData.roomTypePrices[roomType] || ''}
                                    onChange={(e: any) => setFormData(prev => ({
                                      ...prev,
                                      roomTypePrices: {
                                        ...prev.roomTypePrices,
                                        [roomType]: e.target.value
                                      }
                                    }))}
                                    placeholder={weekdayPlaceholder}
                                    className="w-full bg-transparent border-none outline-none text-white font-semibold placeholder:text-zinc-700 text-sm p-0 focus:ring-0"
                                    required
                                  />
                                  <span className="text-[10px] text-zinc-500 font-black tracking-widest ml-2 select-none">/NIGHT</span>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Weekend Price</span>
                                  <div className="flex items-center gap-1.5">
                                    {markupPct > 0 && (
                                      <span className="text-[9px] font-extrabold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20 animate-fade-in">
                                        +{markupPct}%
                                      </span>
                                    )}
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">Sat-Sun</span>
                                  </div>
                                </div>
                                <div className="relative flex items-center bg-zinc-950/50 border border-zinc-800 hover:border-zinc-750/60 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-xl px-3.5 py-3 transition-all">
                                  <span className="text-zinc-500 font-bold mr-2 select-none">₹</span>
                                  <input
                                    type="number"
                                    value={formData.roomTypeWeekendPrices[roomType] || ''}
                                    onChange={(e: any) => setFormData(prev => ({
                                      ...prev,
                                      roomTypeWeekendPrices: {
                                        ...prev.roomTypeWeekendPrices,
                                        [roomType]: e.target.value
                                      }
                                    }))}
                                    placeholder={weekendPlaceholder}
                                    className="w-full bg-transparent border-none outline-none text-white font-semibold placeholder:text-zinc-700 text-sm p-0 focus:ring-0"
                                    required
                                  />
                                  <span className="text-[10px] text-zinc-500 font-black tracking-widest ml-2 select-none">/NIGHT</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                
                {/* Bulk Booking Discount with toggle and +/- buttons */}
                {['Home Stay', 'Apartment', 'Villa'].includes(formData.type) ? (
                  <div className="bg-zinc-800/40 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-700/30 flex items-start gap-3 md:gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/3 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 shrink-0 border border-amber-500/20">
                      <BadgePercent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs md:text-sm font-black text-white uppercase tracking-widest mb-1.5">
                        Bulk Booking Discount
                      </h4>
                      <p className="text-[10px] md:text-xs text-zinc-500 font-medium leading-relaxed">
                        Bulk discounts are only applicable to multi-unit listings (Hotels and Resorts). Since this listing is categorized as a {formData.type || 'single unit'}, bulk discounts are disabled.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-800 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-700/50 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/5 to-sky-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <div className="relative z-10 flex justify-between items-center mb-4 md:mb-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${isBulkDiscountEnabled ? 'bg-sky-500/10 text-sky-400' : 'bg-zinc-700 text-zinc-500'}`}>
                          <BadgePercent className="w-5 h-5" />
                        </div>
                        <div>
                          <label className="block text-xs md:text-sm font-black text-white uppercase tracking-widest">
                            Bulk Booking Discount
                          </label>
                          {isBulkDiscountEnabled && (
                            <span className="text-[9px] text-amber-400 font-black uppercase tracking-[0.2em] mt-0.5">
                              Max 10% Protocol Active
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isBulkDiscountEnabled}
                          onChange={(e) => handleBulkDiscountToggle(e.target.checked)}
                        />
                        <div className="w-12 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 peer-checked:after:bg-white peer-checked:after:border-white shadow-inner"></div>
                      </label>
                    </div>

                    <AnimatePresence initial={false}>
                      {isBulkDiscountEnabled ? (
                        <motion.div
                          key="discount-selector"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden space-y-4"
                        >
                          <div className="flex justify-start">
                            <NumberInput
                              value={Number(formData.bulkBookingDiscount)}
                              onChange={(val) => setFormData(prev => ({ ...prev, bulkBookingDiscount: val }))}
                              min={1}
                              max={10}
                            />
                          </div>
                          <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-700/30">
                            <p className="text-[10px] md:text-xs text-zinc-400 font-medium leading-relaxed italic">
                              "Bulk discounts apply when guests book multiple units. This encourages larger group bookings and higher occupancy."
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="discount-disabled"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <p className="text-[10px] md:text-xs text-zinc-500 font-medium leading-relaxed">
                            Bulk booking discount is currently disabled. Guests will pay regular room rates when booking multiple units.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="p-4 md:p-6 bg-brand-default/5 border border-brand-default/10 rounded-2xl md:rounded-3xl flex gap-4">
                  <div className="p-2 bg-brand-default/10 rounded-xl h-fit">
                    <AlertCircle className="w-4 h-4 text-brand-default" />
                  </div>
                  <p className="text-[10px] md:text-xs text-zinc-400 font-medium leading-relaxed">
                    <span className="text-zinc-200 font-bold">Pricing Transparency:</span> These are the rates guests will see. You can dynamically adjust them later based on seasonal demand or special occasions from your dashboard.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-zinc-800 mt-auto">
          <div>
            {currentStep > 0 && (
              <button onClick={prevStep} className="flex items-center px-6 py-3 rounded-lg text-white font-semibold hover:bg-zinc-800 transition-colors">
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back
              </button>
            )}
          </div>
          <div>
            {currentStep < steps.length - 1 && (
              <button onClick={nextStep} className="flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                Next
                <ChevronRight className="h-5 w-5 ml-2" />
              </button>
            )}
            {currentStep === steps.length - 1 && (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg bg-green-600 text-white font-semibold transition-colors flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700'}`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {propertyToEdit ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  propertyToEdit ? 'Update Property' : 'Add Property'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setErrorMessage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-red-500/30 text-white px-8 py-8 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col items-center gap-4 max-w-sm text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
              
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-2">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              
              <div>
                <h4 className="font-bold text-xl tracking-tight">Hold on a second</h4>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              <button 
                onClick={() => setErrorMessage(null)}
                className="mt-4 w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition-all border border-zinc-700 active:scale-95"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const InputField = ({ label, name, type = "text", value, onChange, placeholder, disabled }: any) => (
  <div>
    <label htmlFor={name} className="block text-xs md:text-sm font-medium text-zinc-400 mb-1 md:mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-lg p-2.5 md:p-3 pr-16 text-sm md:text-base transition-all duration-300 outline-none ${
          disabled
            ? 'bg-zinc-950/40 border border-zinc-900 text-zinc-500 cursor-not-allowed opacity-50'
            : 'bg-zinc-800/30 border border-zinc-700/60 text-white hover:border-sky-500/50 hover:bg-zinc-800/60 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500'
        }`}
        placeholder={placeholder}
        required
      />
      {disabled && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/60 select-none">
            Locked
          </span>
        </div>
      )}
    </div>
  </div>
);

const FileUploadField = ({ label, name, onChange, fileName, currentUrl, disabled }: any) => (
  <div>
    <label htmlFor={name} className="block text-xs md:text-sm font-medium text-zinc-400 mb-1.5 md:mb-2">{label}</label>
    <div className="relative">
      <input type="file" id={name} name={name} onChange={onChange} className="hidden" disabled={disabled} />
      <label htmlFor={disabled ? undefined : name} className={`flex items-center justify-center w-full px-3 md:px-4 py-2.5 md:py-3 bg-zinc-800 border-zinc-700 rounded-lg text-xs md:text-sm text-zinc-400 transition overflow-hidden ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-700'}`}>
        <Plus className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 flex-shrink-0" />
        <span className="truncate">{fileName || 'Upload File'}</span>
      </label>
      {currentUrl && !fileName && !disabled && (
        <p className="mt-1 text-[10px] md:text-xs text-emerald-400 flex items-center gap-1">
          <span>✓</span> Already uploaded
          <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="underline ml-1">View</a>
        </p>
      )}
    </div>
  </div>
)


export default AddPropertyModal;