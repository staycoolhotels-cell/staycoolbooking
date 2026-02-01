'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/lib/types';
import { AMENITIES } from '@/lib/amenities';
import { Plus, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; // Import supabase client

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
  });
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const uploadFileToSupabase = async (file: File, bucketName: string, folderPath: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated. Please log in to upload files.");
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${folderPath}/${Date.now()}.${fileExt}`;
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
      setFormData({
        name: propertyToEdit.name || '',
        description: propertyToEdit.description || '',
        price: propertyToEdit.price_per_night || 0,
        weekendPrice: propertyToEdit.weekend_price_per_night || 0,
        location: propertyToEdit.location || '',
        type: propertyToEdit.tier || '',
        photos: [], // Reset photos when editing
        photo_urls: propertyToEdit.image_url ? [propertyToEdit.image_url] : [],
        amenities: propertyToEdit.amenities?.map((a: any) => a.id) || [],
        license: [],
        license_url: propertyToEdit.license_url || '',
        taxBill: [],
        tax_bill_url: propertyToEdit.tax_bill_url || '',
        currentBill: [],
        current_bill_url: propertyToEdit.current_bill_url || '',
      });
      if (propertyToEdit.image_url) {
        setPhotoPreviews([propertyToEdit.image_url]);
      } else {
        setPhotoPreviews([]);
      }
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
      setFormData(prev => ({ ...prev, [field]: newFiles }));

      if (field === 'photos') {
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setPhotoPreviews(prev => [...prev, ...newPreviews]);
      }
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => {
      const newPhotos = [...prev.photos];
      newPhotos.splice(index, 1);
      return { ...prev, photos: newPhotos };
    });
    setPhotoPreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      newPreviews.splice(index, 1);
      return newPreviews;
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
      const photoUrls: string[] = [];
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
                  <InputField label="Location" name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. Goa, India" />
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
                    <option value="">Select a type</option>
                    <option value="Villa">Villa</option>
                    <option value="Tent">Tent</option>
                    <option value="Cottage">Cottage</option>
                    <option value="Boutique Hotel">Boutique Hotel</option>
                    <option value="Unique Stay">Unique Stay</option>
                  </select>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-semibold text-white mb-6">Select Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {AMENITIES.map((amenity) => (
                    <div
                      key={amenity.id}
                      onClick={() => handleAmenityChange(amenity.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.amenities.includes(amenity.id)
                          ? 'bg-primary border-primary text-white'
                          : 'bg-zinc-800 border-zinc-700 hover:border-primary'
                      }`}
                    >
                      <amenity.icon className="w-6 h-6 mb-2" />
                      <p className="font-semibold mt-2">{amenity.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Property Photos</h3>
                  <div className="p-6 border-2 border-dashed border-zinc-700 rounded-lg text-center bg-zinc-800">
                    <input type="file" id="photos" name="photos" multiple onChange={(e) => handleFileChange(e, 'photos')} className="hidden" />
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
                    <FileUploadField label="Property License" name="license" onChange={(e) => handleFileChange(e, 'license')} fileName={formData.license[0]?.name} />
                    <FileUploadField label="Tax Bill" name="taxBill" onChange={(e) => handleFileChange(e, 'taxBill')} fileName={formData.taxBill[0]?.name} />
                    <FileUploadField label="Current Utility Bill" name="currentBill" onChange={(e) => handleFileChange(e, 'currentBill')} fileName={formData.currentBill[0]?.name} />
                </div>
              </div>
            )}

            {currentStep === 3 && (
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