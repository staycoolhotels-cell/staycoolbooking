'use client';

import { useRef, useState, useActionState, startTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { addProperty } from '@/lib/property-actions';
import { redirect } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" aria-disabled={pending} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      {pending ? 'Adding Property...' : 'Add Property'}
    </button>
  );
}

export default function AddPropertyPage() {
  const [state, formAction] = useActionState(addProperty, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [rules, setRules] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // If the property was added successfully, redirect to host-dashboard.
  // The server action already handles redirect, but this can be a client-side fallback or for more complex flows.
  // For this simple case, the server action's redirect is sufficient, but keeping this for demonstration.
  if (state && state.error === undefined && !state.imageUploadErrors && !state.documentUploadErrors) {
    // Optionally, you might want to reset the form here if not redirecting,
    // or show a success message.
    console.log('Property added successfully, redirecting handled by server action.');
  }

  const handleAmenityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (e.target.checked) {
      setAmenities([...amenities, value]);
    } else {
      setAmenities(amenities.filter((a) => a !== value));
    }
  };

  const handleRuleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (e.target.checked) {
      setRules([...rules, value]);
    } else {
      setRules(rules.filter((r) => r !== value));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Append amenities and rules as JSON strings
    formData.append('amenities', JSON.stringify(amenities));

    // Process House Rules with times
    const checkInTime = formData.get('checkInTime') as string;
    const checkOutTime = formData.get('checkOutTime') as string;
    const finalRules = [...rules];

    // Helper to format 24h time to 12h AM/PM
    const formatTime = (time: string) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    };

    if (checkInTime) finalRules.push(`Check-in after ${formatTime(checkInTime)}`);
    if (checkOutTime) finalRules.push(`Checkout before ${formatTime(checkOutTime)}`);

    formData.append('rules', JSON.stringify(finalRules));

    // Append image files
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    // Manually trigger the server action
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">List Your Property</h1>
      <form 
        ref={formRef} 
        onSubmit={handleSubmit} 
        method="POST"
        encType="multipart/form-data"
        className="space-y-4"
      >
        {state?.error && <p className="text-red-500">{state.error}</p>}
        {state?.imageUploadErrors && state.imageUploadErrors.length > 0 && (
          <div className="text-red-500">
            <p>Image Upload Errors:</p>
            <ul>
              {state.imageUploadErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        {state?.documentUploadErrors && state.documentUploadErrors.length > 0 && (
          <div className="text-red-500">
            <p>Document Upload Errors:</p>
            <ul>
              {state.documentUploadErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Property Name</label>
          <input type="text" id="name" name="name" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
          <input type="text" id="location" name="location" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="description" name="description" rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Property Type</label>
          <select id="type" name="type" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="villa">Villa</option>
            <option value="wooden-stay">Wooden Stay</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price_per_night" className="block text-sm font-medium text-gray-700">Price per Night</label>
            <input type="number" id="price_per_night" name="price_per_night" step="0.01" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="weekendPrice" className="block text-sm font-medium text-gray-700">Weekend Price</label>
            <input type="number" id="weekendPrice" name="weekendPrice" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacity</label>
            <input type="number" id="capacity" name="capacity" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">Bedrooms</label>
            <input type="number" id="bedrooms" name="bedrooms" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">Bathrooms</label>
            <input type="number" id="bathrooms" name="bathrooms" step="1" min="0" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="max_guests" className="block text-sm font-medium text-gray-700">Max Guests/per unit</label>
            <input type="number" id="max_guests" name="max_guests" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
        </div>

        <div>
          <label htmlFor="cancellationPolicy" className="block text-sm font-medium text-gray-700">Cancellation Policy</label>
          <textarea id="cancellationPolicy" name="cancellationPolicy" rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {['Wifi', 'Kitchen', 'TV', 'Parking', 'Pool', 'Gym', 'Air Conditioning', 'Heating', 'Washer', 'Dryer'].map((amenity) => (
              <div key={amenity} className="flex items-center">
                <input type="checkbox" id={`amenity-${amenity}`} value={amenity} onChange={handleAmenityChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                <label htmlFor={`amenity-${amenity}`} className="ml-2 text-sm text-gray-700">{amenity}</label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Safety & Property</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {['Smoke alarm', 'Carbon monoxide alarm', 'First aid kit', 'Fire extinguisher', 'Security cameras', 'Safe'].map((item) => (
              <div key={item} className="flex items-center">
                <input type="checkbox" id={`safety-${item}`} value={item} onChange={handleAmenityChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                <label htmlFor={`safety-${item}`} className="ml-2 text-sm text-gray-700">{item}</label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">House Rules</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="checkInTime" className="block text-xs font-medium text-gray-500 mb-1">Check-in Start</label>
              <input type="time" id="checkInTime" name="checkInTime" className="block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="checkOutTime" className="block text-xs font-medium text-gray-500 mb-1">Check-out End</label>
              <input type="time" id="checkOutTime" name="checkOutTime" className="block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {['No Smoking', 'No Pets', 'No Parties', 'Quiet Hours'].map((rule) => (
              <div key={rule} className="flex items-center">
                <input type="checkbox" id={`rule-${rule}`} value={rule} onChange={handleRuleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                <label htmlFor={`rule-${rule}`} className="ml-2 text-sm text-gray-700">{rule}</label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="images" className="block text-sm font-medium text-gray-700">Property Images</label>
          <input type="file" id="images" name="images" multiple accept="image/*" onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>

        <div>
          <label htmlFor="license_file" className="block text-sm font-medium text-gray-700">License Document</label>
          <input type="file" id="license_file" name="license_file" accept=".pdf,.doc,.docx,.jpg,.png" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>

        <div>
          <label htmlFor="tax_bill_file" className="block text-sm font-medium text-gray-700">Tax Bill Document</label>
          <input type="file" id="tax_bill_file" name="tax_bill_file" accept=".pdf,.doc,.docx,.jpg,.png" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>

        <div>
          <label htmlFor="current_bill_file" className="block text-sm font-medium text-gray-700">Current Bill Document</label>
          <input type="file" id="current_bill_file" name="current_bill_file" accept=".pdf,.doc,.docx,.jpg,.png" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
