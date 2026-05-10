'use client';

import React, { useState, startTransition } from 'react';
import { verifyUser, processIdDocument } from '@/lib/booking-actions';
import { Loader2, CheckCircle2, AlertCircle, ScanLine } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { useRouter } from 'next/navigation';
import Tesseract from 'tesseract.js';

interface Step2Props {
  onNext: () => void;
  onBack: () => void;
  verificationData: { fullName: string; documentFile: File | null };
  setVerificationData: React.Dispatch<React.SetStateAction<{ fullName: string; documentFile: File | null }>>;
}

const Step2_Verification = ({ onNext, onBack, verificationData, setVerificationData }: Step2Props) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<{ idNumber?: string; isBlurry?: boolean; isFakeSuspected?: boolean } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVerificationData({ ...verificationData, documentFile: file });
      
      // Start OCR Process
      setOcrLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('document', file);
      
      try {
        const result = await processIdDocument(formData);
        if (result.success && result.data) {
          const { fullName, idNumber, isBlurry, isFakeSuspected, isValidId } = result.data;
          
          if (isValidId === false) {
            setError('The uploaded image is not a valid ID document. Please upload a clear photo of your Aadhaar card.');
            setVerificationData({ ...verificationData, documentFile: null });
            setOcrLoading(false);
            return;
          }

          if (isBlurry) {
            setError('The image appears to be blurry. Please upload a clearer photo for better verification.');
          } else if (isFakeSuspected) {
            setError('The document details could not be verified reliably. Please ensure it is a valid government ID.');
          }

          // Auto-fill name if not already filled or if user hasn't typed much
          if (fullName && (!verificationData.fullName || verificationData.fullName.length < 3)) {
            setVerificationData((prev: { fullName: string; documentFile: File | null }) => ({ ...prev, fullName }));
          }
          
          setOcrData({ idNumber, isBlurry, isFakeSuspected });
        } else {
          // Gemini failed, try Tesseract as fallback
          console.log('Gemini OCR failed, trying Tesseract fallback...');
          const { data: { text } } = await Tesseract.recognize(file, 'eng');
          
          // Basic heuristic for Aadhaar number (12 digits)
          const idMatch = text.match(/\d{4}\s?\d{4}\s?\d{4}/);
          if (idMatch) {
            setOcrData({ idNumber: idMatch[0], isBlurry: false, isFakeSuspected: false });
          }
        }
      } catch (err) {
        console.error('OCR Processing failed:', err);
        // Silent fallback to manual entry
      } finally {
        setOcrLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!verificationData.fullName || verificationData.fullName.trim() === '') {
      setError('Please fill out your Full Name to proceed.');
      setLoading(false);
      return;
    }

    if (!verificationData.documentFile || verificationData.documentFile.size === 0) {
      setError('Please choose an ID Document file to upload.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('fullName', verificationData.fullName);
    formData.append('document', verificationData.documentFile);
    if (ocrData) {
      formData.append('ocrData', JSON.stringify(ocrData));
    }

    try {
      startTransition(async () => {
        const result = await verifyUser(undefined, formData);
        
        if (result.redirect) {
          router.push(result.redirect);
          return;
        }

        if (result.success) {
          onNext();
        } else {
          setError(result.error || 'Verification failed. Please check your inputs.');
        }
        setLoading(false);
      });
    } catch (err: any) {
      console.error('Verification Error:', err);
      setError(`An error occurred: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-xl shadow-brand-md max-w-2xl mx-auto bg-card/50 backdrop-blur-md border border-brand-energetic/20">
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary text-center mb-4">
        Identity Verification
      </h2>
      <form 
        onSubmit={handleSubmit} 
        method="POST"
        encType="multipart/form-data"
        className="space-y-4"
        noValidate
      >
        <div>
          <label
            className="block text-sm font-semibold text-text-secondary mb-1"
            htmlFor="fullName"
          >
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={verificationData.fullName}
            onChange={(e) => setVerificationData({ ...verificationData, fullName: e.target.value })}
            className="w-full p-2 sm:p-2.5 text-sm sm:text-base bg-surface/60 text-text-primary rounded-lg border border-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-energetic hover:shadow-sm transition-shadow"
            placeholder="Full Name (as on ID)"
          />
        </div>
        <div>
          <label
            className="block text-sm font-semibold text-text-secondary mb-1"
            htmlFor="document"
          >
            ID Document
          </label>
          {verificationData.documentFile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between w-full p-2 sm:p-2.5 bg-surface/60 text-text-primary rounded-lg border border-primary/50">
                <div className="flex items-center gap-2 overflow-hidden">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="truncate max-w-[150px] sm:max-w-xs text-xs sm:text-sm text-sky-400">
                    {verificationData.documentFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationData({ ...verificationData, documentFile: null });
                    setOcrData(null);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 whitespace-nowrap"
                >
                  Change File
                </button>
              </div>
              
              {ocrLoading && (
                <div className="flex items-center gap-3 p-3 bg-brand-energetic/5 border border-brand-energetic/20 rounded-lg animate-pulse">
                  <div className="relative">
                    <Loader2 className="h-5 w-5 text-brand-energetic animate-spin" />
                    <div className="absolute inset-0 bg-brand-energetic/20 blur-sm rounded-full animate-ping"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-brand-energetic">AI Scanning in progress...</span>
                    <span className="text-[10px] text-text-secondary">Extracting Aadhaar details & verifying authenticity</span>
                  </div>
                </div>
              )}

              {ocrData?.idNumber && !ocrLoading && (
                <div className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <div className="bg-green-500/20 p-1.5 rounded-full">
                    <ScanLine className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-green-400">Aadhaar Verified via OCR</span>
                    <span className="text-[10px] text-text-secondary">ID Number: {ocrData.idNumber}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full">
              <input
                type="file"
                id="document"
                name="document"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full p-2 sm:p-2.5 bg-surface/60 text-text-primary rounded-lg border border-primary/50 flex items-center gap-2 sm:gap-3 hover:shadow-sm transition-shadow">
                <div className="bg-primary/10 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-semibold text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Choose file</div>
                <span className="text-text-secondary text-xs sm:text-sm truncate">No file chosen</span>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-text-secondary text-center">
          We use a secure third-party service to verify your identity. Your data is safe with us.
        </p>

        {/* Trust Indicators */}
        <div className="flex justify-center gap-6 mt-4 opacity-60">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 uppercase tracking-tighter">
            <Icon name="ShieldCheckIcon" size={12} />
            <span>256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 uppercase tracking-tighter">
            <Icon name="LockClosedIcon" size={12} />
            <span>Private Data</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 uppercase tracking-tighter">
            <Icon name="FingerPrintIcon" size={12} />
            <span>AI Verified</span>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-muted/60 text-text-primary rounded-lg font-semibold disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin h-5 w-5" />}
            <span className="whitespace-nowrap">{loading ? 'Verifying...' : 'Proceed to Payment'}</span>
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 mt-4 text-center text-sm">{error}</p>}
    </div>
  );
};

export default Step2_Verification;
