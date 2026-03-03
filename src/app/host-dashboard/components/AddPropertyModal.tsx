'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/lib/types';
import { AMENITIES, CATEGORIZED_AMENITIES, AmenityItem } from '@/lib/amenities';
import { Plus, X, ChevronRight, ChevronLeft, Home, Sparkles, Layers, Users, Bed, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; // Import supabase client
import { NumberInput } from '@/components/ui/number-input';

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
  roomType: string; // New field for detailed room classification
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
    cancellationPolicy: 'Flexible',
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
    roomType: '', // Initialize new field
  });
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
        cancellationPolicy: propertyToEdit.cancellation_policy || 'Flexible',
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
        roomType: propertyToEdit.room_type || '', // Load existing room type
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
        cancellationPolicy: 'Flexible',
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
        roomType: '',
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

      // Upload license
      if (formData.license.length > 0) {
        updatedFormData.license_url = await uploadFileToSupabase(formData.license[0], BUCKETS.propertyDocuments, `${userId}/properties/${propertyNameSlug}/documents/license`);
      }

      // Upload tax bill
      if (formData.taxBill.length > 0) {
        updatedFormData.tax_bill_url = await uploadFileToSupabase(formData.taxBill[0], BUCKETS.propertyDocuments, `${userId}/properties/${propertyNameSlug}/documents/tax-bill`);
      }

      // Upload current bill
      if (formData.currentBill.length > 0) {
        updatedFormData.current_bill_url = await uploadFileToSupabase(formData.currentBill[0], BUCKETS.propertyDocuments, `${userId}/properties/${propertyNameSlug}/documents/current-bill`);
      }

      onSaveProperty(updatedFormData);
      onClose(); // Close modal after successful submission
    } catch (error: any) {
      alert(`Failed to save property: ${error.message}`);
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
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-white">{propertyToEdit ? 'Edit Property' : 'Create a new listing'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
            <X className="h-6 w-6 text-zinc-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={index}>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-zinc-800 text-zinc-400'}`}>
                      {index + 1}
                    </div>
                    <p className={`ml-4 font-semibold ${index <= currentStep ? 'text-white' : 'text-zinc-500'}`}>{step}</p>
                  </div>
                  {index < steps.length - 1 && <div className="flex-1 h-px bg-zinc-800 mx-4"></div>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {currentStep === 0 && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Property Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Sunny Beachfront Villa" />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Country/region</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                    >
                      <option value="India - IN">India - IN</option>
                      {/* Add other countries if needed */}
                    </select>
                  </div>

                  <InputField label="Flat, house, etc. (if applicable)" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} />
                  <InputField label="Street address" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} />
                  <InputField label="Nearby landmark (if applicable)" name="landmark" value={formData.landmark} onChange={handleInputChange} />
                  <InputField label="District/locality (if applicable)" name="district" value={formData.district} onChange={handleInputChange} />

                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="City/town" name="city" value={formData.city} onChange={handleInputChange} />
                    <InputField label="State/union territory" name="state" value={formData.state} onChange={handleInputChange} />
                  </div>

                  <InputField label="PIN code" name="postalCode" value={formData.postalCode} onChange={handleInputChange} />

                  <div className="rounded-xl overflow-hidden h-48 bg-zinc-800 border border-zinc-700">
                    <iframe
                      width="100%"
                      height="100%"
                      loading="lazy"
                      title="Map Preview"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                        `${formData.addressLine1 || ''} ${formData.addressLine2 || ''} ${formData.city || ''} ${formData.state || ''} ${formData.country || ''}`.trim() || 'India'
                      )}&z=14&output=embed`}
                      className="border-0"
                    ></iframe>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                    <div>
                      <p className="font-semibold text-white">Show your specific location</p>
                      <p className="text-sm text-zinc-400 mt-1">Make it clear to guests where your place is located. We'll only share your address after they've made a reservation.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
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
                  <label htmlFor="description" className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-primary transition"
                    placeholder="Describe your property in detail..."
                    required
                  />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-zinc-400 mb-2">Property Type</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-primary transition"
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
                    <option value="Hostel">Hostel</option>
                  </select>
                </div>

                {/* Room Classification Dropdown - Shown mainly for Hotels/Resorts but available for all if needed */}
                <div className="col-span-full md:col-span-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-sky-400" />
                    <label htmlFor="roomType" className="block text-sm font-medium text-zinc-300">Room Classification</label>
                  </div>
                  <select
                    id="roomType"
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-primary transition"
                  >
                    <option value="">Select Room Type (Optional)</option>

                    <optgroup label="Based on Occupancy">
                      <option value="Single Room">Single Room</option>
                      <option value="Double Room">Double Room</option>
                      <option value="Triple Room">Triple Room</option>
                      <option value="Quad Room">Quad Room</option>
                    </optgroup>

                    <optgroup label="Based on Bed Size & Number">
                      <option value="Queen Room">Queen Room</option>
                      <option value="King Room">King Room</option>
                      <option value="Twin Room">Twin Room</option>
                      <option value="Double-Double Room">Double-Double Room</option>
                      <option value="Hollywood Twin Room">Hollywood Twin Room</option>
                      <option value="Studio Room">Studio Room</option>
                    </optgroup>

                    <optgroup label="Based on Layout">
                      <option value="Standard Room">Standard Room</option>
                      <option value="Deluxe Room">Deluxe Room</option>
                      <option value="Joint Room">Joint Room</option>
                      <option value="Connecting Room">Connecting Room</option>
                      <option value="Suit Room">Suit Room</option>
                      <option value="Apartment-Style Room">Apartment-Style Room</option>
                      <option value="Accessible Room">Accessible Room</option>
                    </optgroup>

                    <optgroup label="Based on Suites">
                      <option value="Standard Suite">Standard Suite</option>
                      <option value="Junior or Mini Suite">Junior or Mini Suite</option>
                      <option value="Penthouse Suite">Penthouse Suite</option>
                      <option value="Bridal Suite">Bridal Suite</option>
                      <option value="Honeymoon Suite">Honeymoon Suite</option>
                      <option value="Presidential Suite">Presidential Suite</option>
                    </optgroup>
                  </select>
                </div>

                {/* NEW FIELDS: Bedrooms, Bathrooms, Area, Max Guests, Total Rooms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                  {/* Total Rooms / Units Input */}
                  <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-sky-400" />
                      <label htmlFor="totalRooms" className="block text-sm font-medium text-zinc-300">Total Rooms/Units</label>
                    </div>
                    <div className="flex justify-center">
                      <NumberInput
                        value={formData.totalRooms}
                        onChange={(val) => setFormData(prev => ({ ...prev, totalRooms: val }))}
                        min={1}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 text-center">For bulk bookings.</p>
                  </div>
                  <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="w-5 h-5 text-sky-400" />
                      <label htmlFor="bedrooms" className="block text-sm font-medium text-zinc-300">Bedrooms</label>
                    </div>
                    <div className="flex justify-center">
                      <NumberInput
                        value={formData.bedrooms}
                        onChange={(val) => setFormData(prev => ({ ...prev, bedrooms: val }))}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Bed className="w-5 h-5 text-sky-400" />
                      <label htmlFor="beds" className="block text-sm font-medium text-zinc-300">Beds</label>
                    </div>
                    <div className="flex justify-center">
                      <NumberInput
                        value={formData.beds}
                        onChange={(val) => setFormData(prev => ({ ...prev, beds: val }))}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-sky-400" />
                      <label htmlFor="bathrooms" className="block text-sm font-medium text-zinc-300">Bathrooms</label>
                    </div>
                    <div className="flex justify-center">
                      <NumberInput
                        value={formData.bathrooms}
                        onChange={(val) => setFormData(prev => ({ ...prev, bathrooms: val }))}
                        min={0}
                        step={0.5}
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-5 h-5 text-sky-400" />
                      <label htmlFor="area" className="block text-sm font-medium text-zinc-300">Area (sq ft)</label>
                    </div>
                    <div className="flex justify-center">
                      <NumberInput
                        value={formData.area}
                        onChange={(val) => setFormData(prev => ({ ...prev, area: val }))}
                        min={0}
                        max={100000}
                        step={10}
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-sky-400" />
                      <label htmlFor="maxGuests" className="block text-sm font-medium text-zinc-300">Max Guests</label>
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

                <div className="pt-6 border-t border-zinc-800">
                  <h4 className="text-lg font-semibold text-white mb-4">Co-Host Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {items.map((amenity: AmenityItem) => (
                        <div
                          key={amenity.id}
                          onClick={() => handleAmenityChange(amenity.id)}
                          className={`p-4 border rounded-lg cursor-pointer transition-all flex flex-col items-start gap-2 ${formData.amenities.includes(amenity.id)
                            ? 'bg-primary border-primary text-white'
                            : 'bg-zinc-800 border-zinc-700 hover:border-primary'
                            }`}
                        >
                          <amenity.icon className="w-6 h-6" />
                          <div>
                            <p className="font-semibold text-sm">{amenity.name}</p>
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{amenity.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Cancellation Policy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Flexible', 'Moderate', 'Strict', 'Super Strict', 'Non-refundable', 'Tiered'].map((policy) => (
                      <div
                        key={policy}
                        onClick={() => setFormData(prev => ({ ...prev, cancellationPolicy: policy }))}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${formData.cancellationPolicy === policy
                          ? 'bg-primary border-primary text-white'
                          : 'bg-zinc-800 border-zinc-700 hover:border-primary'
                          }`}
                      >
                        <p className="font-semibold text-center">{policy}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">House Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['No smoking', 'No pets', 'No parties or events', 'Quiet hours', 'Self check-in', 'Suitable for infants', 'Suitable for children', 'Pets welcome', 'Events allowed', 'Smoking allowed', 'Commercial photography allowed'].map((rule) => (
                      <div
                        key={rule}
                        onClick={() => setFormData(prev => {
                          const newRules = prev.rules.includes(rule)
                            ? prev.rules.filter(r => r !== rule)
                            : [...prev.rules, rule];
                          return { ...prev, rules: newRules };
                        })}
                        className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${formData.rules.includes(rule)
                          ? 'bg-primary border-primary text-white'
                          : 'bg-zinc-800 border-zinc-700 hover:border-primary'
                          }`}
                      >
                        <span>{rule}</span>
                        {formData.rules.includes(rule) && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Safety & Property</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Smoke alarm', 'Carbon monoxide alarm', 'First aid kit', 'Fire extinguisher', 'Security cameras', 'Pool safety gate', 'Nearby lake/river', 'Climbing or play structure', 'Heights/Railings'].map((item) => (
                      <div
                        key={item}
                        onClick={() => setFormData(prev => {
                          const newItems = prev.safetyItems.includes(item)
                            ? prev.safetyItems.filter(i => i !== item)
                            : [...prev.safetyItems, item];
                          return { ...prev, safetyItems: newItems };
                        })}
                        className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${formData.safetyItems.includes(item)
                          ? 'bg-primary border-primary text-white'
                          : 'bg-zinc-800 border-zinc-700 hover:border-primary'
                          }`}
                      >
                        <span>{item}</span>
                        {formData.safetyItems.includes(item) && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Property Photos</h3>
                  <div className="p-6 border-2 border-dashed border-zinc-700 rounded-lg text-center bg-zinc-800">
                    <input type="file" id="photos" name="photos" multiple onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'photos')} className="hidden" />
                    <label htmlFor="photos" className="cursor-pointer">
                      <Plus className="mx-auto h-12 w-12 text-zinc-500" />
                      <p className="mt-2 text-sm text-zinc-400">Drag & drop photos here, or click to select files</p>
                    </label>
                  </div>
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photoPreviews.map((previewUrl, index) => (
                      <div key={index} className="relative w-full h-32 rounded-lg overflow-hidden group">
                        <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => removePhoto(index)} className="absolute top-2 right-2 bg-black bg-opacity-50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FileUploadField label="Property License" name="license" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'license')} fileName={formData.license[0]?.name} />
                  <FileUploadField label="Tax Bill" name="taxBill" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'taxBill')} fileName={formData.taxBill[0]?.name} />
                  <FileUploadField label="Current Utility Bill" name="currentBill" onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'currentBill')} fileName={formData.currentBill[0]?.name} />
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
    <label htmlFor={name} className="block text-sm font-medium text-zinc-400 mb-2">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-primary transition"
      placeholder={placeholder}
      required
    />
  </div>
);

const FileUploadField = ({ label, name, onChange, fileName }: any) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-zinc-400 mb-2">{label}</label>
    <div className="relative">
      <input type="file" id={name} name={name} onChange={onChange} className="hidden" />
      <label htmlFor={name} className="flex items-center justify-center w-full px-4 py-3 bg-zinc-800 border-zinc-700 rounded-lg cursor-pointer text-zinc-400 hover:bg-zinc-700 transition">
        <Plus className="h-5 w-5 mr-2" />
        {fileName || 'Upload File'}
      </label>
    </div>
  </div>
)


export default AddPropertyModal;