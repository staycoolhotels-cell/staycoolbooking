'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/lib/types';
import { AMENITIES, CATEGORIZED_AMENITIES, AmenityItem } from '@/lib/amenities';
import { Plus, X, ChevronRight, ChevronLeft, Home, Sparkles, Layers, Users, Bed, Building2, CheckCircle, Bath, Clock } from 'lucide-react';
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
  price: number;
  weekendPrice: number;
  location: string;
  type: string;
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
  coHostName: string;
  coHostEmail: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  showSpecificLocation: boolean;
  totalRooms: number; // New field for bulk booking
  checkInTime: string;
  checkOutTime: string;
  customAmenities: string[]; // New field for manually added amenities
  latitude?: number;
  longitude?: number;
}

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
    price: 0,
    weekendPrice: 0,
    location: '',
    type: '',
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
    coHostName: '',
    coHostEmail: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    district: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India - IN',
    showSpecificLocation: false,
    totalRooms: 1, // Default to 1 room
    checkInTime: '12:00 PM',
    checkOutTime: '11:00 AM',
    customAmenities: [], // Initialize new field
    latitude: undefined,
    longitude: undefined,
  });
  const [newCustomAmenity, setNewCustomAmenity] = useState('');
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

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
        name: propertyToEdit.name || '',
        description: propertyToEdit.description || '',
        price: propertyToEdit.price_per_night || 0,
        weekendPrice: propertyToEdit.weekend_price_per_night || 0,
        location: propertyToEdit.location || '',
        type: propertyToEdit.tier || '',
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
        bedrooms: propertyToEdit.bedrooms || 1,
        beds: propertyToEdit.beds || 1,
        bathrooms: propertyToEdit.bathrooms || 1,
        maxGuests: propertyToEdit.max_guests || 2,
        area: propertyToEdit.area || 500,
        coHostName: propertyToEdit.co_host_name || '',
        coHostEmail: propertyToEdit.co_host_email || '',
        addressLine1: propertyToEdit.address_line1 || '',
        addressLine2: propertyToEdit.address_line2 || '',
        landmark: propertyToEdit.landmark || '',
        district: propertyToEdit.district || '',
        city: propertyToEdit.city || '',
        state: propertyToEdit.state || '',
        postalCode: propertyToEdit.postal_code || '',
        country: propertyToEdit.country || 'India - IN',
        showSpecificLocation: propertyToEdit.show_specific_location || false,
        totalRooms: propertyToEdit.total_rooms || 1,
        checkInTime: propertyToEdit.check_in_time || '12:00 PM',
        checkOutTime: propertyToEdit.check_out_time || '11:00 AM',
        customAmenities: propertyToEdit.amenities
          ?.filter((a: any) => !AMENITIES.some(std => std.id === a.id))
          ?.map((a: any) => a.name) || [],
        latitude: propertyToEdit.latitude,
        longitude: propertyToEdit.longitude,
      });
      setPhotoPreviews(initialPhotoUrls);
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        weekendPrice: 0,
        location: '',
        type: '',
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
        coHostName: '',
        coHostEmail: '',
        addressLine1: '',
        addressLine2: '',
        landmark: '',
        district: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India - IN',
        showSpecificLocation: false,
        totalRooms: 1,
        checkInTime: '12:00 PM',
        checkOutTime: '11:00 AM',
        customAmenities: [],
        latitude: undefined,
        longitude: undefined,
      });
      setPhotoPreviews([]);
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    setFormData(prev => ({
      ...prev,
      customAmenities: prev.customAmenities.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        alert("You must be logged in to add a property.");
        return;
      }

      const userId = session.user.id;
      const updatedFormData = { ...formData };
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

      onSaveProperty(updatedFormData);
      onClose(); // Close modal after successful submission
    } catch (error: any) {
      alert('An unexpected error occurred. Please try again later.');
      console.error("Error saving property:", error);
    }
  };

  const steps = [
    "Property Details",
    "Amenities",
    "Policies",
    "Uploads",
    "Pricing"
  ];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
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

        <div className="p-3 md:p-8 overflow-y-auto">
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

          <form onSubmit={handleSubmit} className="space-y-8">
            {currentStep === 0 && (
              <div className="space-y-4 md:space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <InputField label="Property Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Sunny Beachfront Villa" />
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-sm font-medium text-zinc-400">Country/region</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                    >
                      <option value="India - IN">India - IN</option>
                      {/* Add other countries if needed */}
                    </select>
                  </div>

                  <InputField label="Flat, house, etc. (if applicable)" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} />
                  <InputField label="Street address" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} />
                  <InputField label="Nearby landmark (if applicable)" name="landmark" value={formData.landmark} onChange={handleInputChange} />
                  <InputField label="District/locality (if applicable)" name="district" value={formData.district} onChange={handleInputChange} />

                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <InputField label="City/town" name="city" value={formData.city} onChange={handleInputChange} />
                    <InputField label="State" name="state" value={formData.state} onChange={handleInputChange} />
                  </div>

                  <InputField label="PIN code" name="postalCode" value={formData.postalCode} onChange={handleInputChange} />

                  <div className="rounded-xl overflow-hidden h-64 bg-zinc-800 border border-zinc-700 relative">
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
                        
                        const landmarkRaw = addressData.amenity || addressData.tourism || addressData.historic || addressData.building || addressData.shop || addressData.leisure || addressData.office;
                        
                        setFormData(prev => ({
                          ...prev,
                          addressLine1: addressData.house_number || addressData.house_name || '', // Clear if no specific house info
                          addressLine2: addressData.road || prev.addressLine2,
                          landmark: cleanField(landmarkRaw) || prev.landmark,
                          city: cleanedCity || prev.city,
                          state: addressData.state || prev.state,
                          postalCode: addressData.postcode || prev.postalCode,
                          district: addressData.suburb || addressData.neighbourhood || addressData.city_district || addressData.state_district || addressData.county || prev.district,
                        }));
                      }}
                      address={[
                        formData.addressLine1,
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

                  <div className="flex items-center justify-between gap-3 p-3 md:p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                    <div className="flex-1">
                      <p className="font-semibold text-sm md:text-base text-white leading-tight">Show your specific location</p>
                      <p className="text-[10px] md:text-sm text-zinc-400 mt-1 md:mt-1.5 leading-snug">Make it clear to guests where your place is located. We'll only share your address after they've made a reservation.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        name="showSpecificLocation"
                        checked={formData.showSpecificLocation}
                        onChange={(e) => setFormData(prev => ({ ...prev, showSpecificLocation: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
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
                <div>
                  <label htmlFor="type" className="block text-xs md:text-sm font-medium text-zinc-400 mb-1.5 md:mb-2">Property Type</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-white focus:ring-2 focus:ring-primary focus:border-primary transition"
                    required
                  >
                    <option value="">Select a Category</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Resort">Resort</option>
                    <option value="Home Stay">Home Stay</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Cabin">Cabin</option>
                    <option value="Cottage">Cottage</option>
                    <option value="Tent">Tent</option>
                    <option value="Guest House">Guest House</option>
                    <option value="Dormitory">Dormitory</option>
                  </select>
                </div>

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
                  <div className="bg-zinc-800 p-2.5 md:p-4 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
                      <Building2 className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                      <label htmlFor="totalRooms" className="block text-xs md:text-sm font-medium text-zinc-300">Total Rooms/Units</label>
                    </div>
                    <div className="flex justify-center">
                      <NumberInput
                        value={formData.totalRooms}
                        onChange={(val) => setFormData(prev => ({ ...prev, totalRooms: val }))}
                        min={1}
                      />
                    </div>
                    <p className="text-[10px] md:text-xs text-zinc-500 mt-1 text-center">For bulk bookings.</p>
                  </div>
                  <div className={`bg-zinc-800 p-2.5 md:p-4 rounded-xl border border-zinc-700/50 ${formData.type === 'Tent' ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
                      <Home className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                      <label htmlFor="bedrooms" className="block text-xs md:text-sm font-medium text-zinc-300">Bedrooms</label>
                      {formData.type === 'Tent' && <span className="text-[10px] md:text-xs text-amber-400">(N/A)</span>}
                    </div>
                    <div className="flex justify-center">
                      <NumberInput
                        value={formData.bedrooms}
                        onChange={(val) => formData.type !== 'Tent' && setFormData(prev => ({ ...prev, bedrooms: val }))}
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

                  <div className={`bg-zinc-800 p-2.5 md:p-4 rounded-xl border border-zinc-700/50 ${formData.type === 'Tent' ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
                      <Bath className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                      <label htmlFor="bathrooms" className="block text-xs md:text-sm font-medium text-zinc-300">Bathrooms</label>
                      {formData.type === 'Tent' && <span className="text-[10px] md:text-xs text-amber-400">(N/A)</span>}
                    </div>
                    <div className="flex justify-center">
                      <NumberInput
                        value={formData.bathrooms}
                        onChange={(val) => formData.type !== 'Tent' && setFormData(prev => ({ ...prev, bathrooms: val }))}
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
                      <label htmlFor="maxGuests" className="block text-xs md:text-sm font-medium text-zinc-300">Max Guests</label>
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

                <div className="pt-4 border-t border-zinc-800">
                  <h4 className="text-base md:text-lg font-semibold text-white mb-3">Co-Host Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <InputField label="Co-Host Name" name="coHostName" value={formData.coHostName} onChange={handleInputChange} placeholder="e.g. John Doe" />
                    <InputField label="Co-Host Email" name="coHostEmail" value={formData.coHostEmail} onChange={handleInputChange} placeholder="e.g. john@example.com" />
                  </div>
                </div>

              </div>
            )}

            {currentStep === 1 && (
              <div className="animate-fade-in space-y-8">
                <h3 className="text-xl font-semibold text-white mb-6">Select Amenities</h3>
                {Object.entries(CATEGORIZED_AMENITIES).map(([category, items]: [string, AmenityItem[]]) => (
                  <div key={category}>
                    <h4 className="text-lg font-medium text-zinc-300 mb-4 sticky top-0 bg-zinc-900 py-2 z-10">{category}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                      {items.map((amenity: AmenityItem) => (
                        <div
                          key={amenity.id}
                          onClick={() => handleAmenityChange(amenity.id)}
                          className={`p-2.5 md:p-4 border rounded-xl md:rounded-lg cursor-pointer transition-all flex flex-col items-start gap-1.5 md:gap-2 ${formData.amenities.includes(amenity.id)
                            ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                            : 'bg-zinc-800 border-zinc-700 hover:border-primary/50'
                            }`}
                        >
                          <amenity.icon className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                          <div>
                            <p className="font-semibold text-xs md:text-sm leading-tight">{amenity.name}</p>
                            <p className="text-[10px] md:text-xs text-zinc-400 mt-0.5 md:mt-1 line-clamp-2 md:line-clamp-none leading-snug">{amenity.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Custom Amenities Section */}
                <div className="pt-6 md:pt-8 border-t border-zinc-800">
                  <h4 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6">Other Amenities</h4>
                  <div className="flex gap-2.5 md:gap-4 mb-4 md:mb-6">
                    <input
                      type="text"
                      value={newCustomAmenity}
                      onChange={(e) => setNewCustomAmenity(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
                      placeholder="e.g. Home Theater, Infinity Pool"
                      className="flex-1 bg-zinc-800 border-zinc-700 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none"
                    />
                    <button
                      type="button"
                      onClick={addCustomAmenity}
                      className="bg-primary text-primary-foreground px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-bold hover:bg-primary/90 transition flex items-center gap-1.5 md:gap-2 text-sm md:text-base"
                    >
                      <Plus className="w-4 h-4 md:w-5 md:h-5" />
                      Add
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {formData.customAmenities.map((amenity, index) => (
                      <div
                        key={`custom-${index}`}
                        className="p-2.5 md:p-4 bg-primary border-primary rounded-xl md:rounded-lg flex flex-col items-start gap-1.5 md:gap-2 relative group transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                      >
                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-white shrink-0" />
                        <div>
                          <p className="font-semibold text-xs md:text-sm text-white leading-tight">{amenity}</p>
                          <p className="text-[10px] md:text-xs text-white/70 mt-0.5 md:mt-1 leading-snug">Host added amenity</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCustomAmenity(index)}
                          className="absolute top-2 right-2 p-1 bg-black/20 hover:bg-black/40 text-white rounded-md transition-colors"
                          title="Remove amenity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
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
                      <p className="text-xs text-zinc-400 mt-1">Please upload your Aadhaar Card, PAN Card, and a No Objection Certificate (NOC) for the land/site.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <FileUploadField label="Aadhaar Card" name="aadhar" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'aadhar')} fileName={formData.aadhar[0]?.name} currentUrl={formData.aadhar_url} />
                      <FileUploadField label="PAN Card" name="pan" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'pan')} fileName={formData.pan[0]?.name} currentUrl={formData.pan_url} />
                      <FileUploadField label="NOC (No Objection Certificate)" name="noc" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'noc')} fileName={formData.noc[0]?.name} currentUrl={formData.noc_url} />
                    </div>
                  </>
                ) : null}

                {/* Property License, Tax Bill, Current Utility Bill - disabled for Tent */}
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
                <h3 className="text-xl font-semibold text-white mb-6">Set Your Prices</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Price per Night (INR)" name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="e.g. 5000" />
                  <InputField label="Weekend Price per Night (INR)" name="weekendPrice" type="number" value={formData.weekendPrice} onChange={handleInputChange} placeholder="e.g. 7500" />
                </div>
                <div className="p-6 bg-zinc-800 rounded-lg">
                  <p className="text-zinc-300">These are the prices guests will see for your property. You can adjust them at any time.</p>
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
                className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
              >
                {propertyToEdit ? 'Update Property' : 'Add Property'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const InputField = ({ label, name, type = "text", value, onChange, placeholder }: any) => (
  <div>
    <label htmlFor={name} className="block text-xs md:text-sm font-medium text-zinc-400 mb-1 md:mb-1.5">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-white focus:ring-2 focus:ring-primary focus:border-primary transition"
      placeholder={placeholder}
      required
    />
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