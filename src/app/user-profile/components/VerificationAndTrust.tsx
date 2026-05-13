'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { UserVerificationStatus, Booking, Property } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { processIdDocument } from '@/lib/booking-actions';
import { Loader2, ScanLine } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { toast } from 'sonner';
import ActionConfirmModal from '@/components/ui/ActionConfirmModal';


type VerificationAndTrustProps = {
  verifications: UserVerificationStatus;
  bookings?: (Booking & { properties: Partial<Property> })[];
  onUpdate?: (newVerifications: UserVerificationStatus) => void;
  onContactHost?: (hostId: string) => void;
};

const VerificationAndTrust = ({ verifications, bookings = [], onUpdate, onContactHost }: VerificationAndTrustProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ocrData, setOcrData] = useState<{ idNumber?: string; fullName?: string } | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);


  // Extract unique hosts from bookings
  const uniqueHosts = bookings.reduce<Array<{ id: string; name: string; avatar: string; location?: string }>>((acc, booking) => {
    // Some bookings might have host info nested or it might be missing
    const host = booking.properties?.host;
    const hostId = booking.properties?.host_id;
    
    if (host && host.name && hostId && !acc.some((h) => h.id === hostId)) {
      acc.push({
        id: hostId,
        name: host.name,
        avatar: host.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(host.name)}&background=0D8ABC&color=fff`,
        location: booking.properties.location
      });
    }
    return acc;
  }, []).slice(0, 3);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${verifications.user_id}/id_verification_${Math.random()}.${fileExt}`;
      const filePath = `verifications/${fileName}`;

      // 1. Start OCR Process in parallel
      const ocrFormData = new FormData();
      ocrFormData.append('document', file);
      setOcrLoading(true);
      
      processIdDocument(ocrFormData).then(async (result) => {
        if (result.success && result.data) {
          if (result.data.isValidId === false) {
            toast.error('The uploaded image is not recognized as a valid ID document. Please upload a real ID card.');

            setOcrData(null);
            setOcrLoading(false);
            return;
          }
          setOcrData(result.data);
        } else {
          // Fallback to Tesseract
          console.log('Gemini failed, trying Tesseract fallback...');
          const { data: { text } } = await Tesseract.recognize(file, 'eng');
          const idMatch = text.match(/\d{4}\s?\d{4}\s?\d{4}/);
          if (idMatch) {
            setOcrData({ idNumber: idMatch[0] });
          }
        }
        setOcrLoading(false);
      }).catch(async (err) => {
        console.error('OCR Error:', err);
        // Fallback to Tesseract on catch too
        try {
          const { data: { text } } = await Tesseract.recognize(file, 'eng');
          const idMatch = text.match(/\d{4}\s?\d{4}\s?\d{4}/);
          if (idMatch) {
            setOcrData({ idNumber: idMatch[0] });
          }
        } catch (e) {
          console.error('Tesseract fallback failed:', e);
        }
        setOcrLoading(false);
      });

      // 2. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Update database
      const { data: updatedData, error: dbError } = await supabase
        .from('verifications')
        .upsert({
          user_id: verifications.user_id,
          isIdVerified: true,
          file_url: filePath,
          status: 'pending',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (dbError) throw dbError;

      if (onUpdate && updatedData) {
        onUpdate(updatedData as UserVerificationStatus);
      }
      
      toast.success('ID Document uploaded successfully! Verification is now in progress.');

    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload document: ' + (error.message || 'Unknown error'));

    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeId = async () => {

    
    try {
      setIsUploading(true);
      const { data: updatedData, error: dbError } = await supabase
        .from('verifications')
        .update({ isIdVerified: false })
        .eq('user_id', verifications.user_id)
        .select()
        .single();

      if (dbError) throw dbError;

      if (onUpdate && updatedData) {
        onUpdate(updatedData as UserVerificationStatus);
      }
    } catch (error: any) {
      toast.error('Failed to remove ID: ' + error.message);

    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] shadow-xl p-6 shadow-sky-900/5">
      <h2 className="text-xl font-bold text-white mb-4">Verification & Trust Center</h2>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,.pdf"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Vault */}
        <div className="bg-zinc-800/40 rounded-xl p-4">
          <h3 className="font-semibold text-zinc-300 mb-3">Secure Document Vault</h3>
          <p className="text-xs text-zinc-400 mb-4">
            Upload your ID for faster bookings. Documents are encrypted and only shared with hosts
            upon confirmation.
          </p>

          {verifications.isIdVerified ? (
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 text-center">
              <Icon name="CheckCircleIcon" className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="font-semibold text-white">ID Verification Active</p>
              <p className="text-xs text-gray-400">Successfully verified on {new Date().toLocaleDateString()}</p>
              <button 
                onClick={() => setIsRemoveModalOpen(true)}

                disabled={isUploading}
                className="text-xs text-red-400 mt-2 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ) : (
            <button 
              onClick={handleUploadClick}
              disabled={isUploading}
              className="w-full bg-sky-600/30 text-sky-300 border border-sky-500/50 rounded-lg py-3 font-semibold flex items-center justify-center gap-2 hover:bg-sky-600/40 transition disabled:opacity-50"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-sky-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="CloudArrowUpIcon" size={16} />
              )}
              {isUploading ? 'Uploading...' : 'Upload Passport/ID'}
            </button>
          )}

          {ocrLoading && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-sky-500/5 border border-sky-500/20 rounded-lg animate-pulse">
              <Loader2 className="h-4 w-4 text-sky-400 animate-spin" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-sky-300">AI Scanning ID...</span>
              </div>
            </div>
          )}

          {ocrData?.idNumber && !ocrLoading && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <ScanLine className="h-4 w-4 text-green-400" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-green-400">OCR Detected Aadhaar</span>
                <span className="text-[10px] text-zinc-400">ID: {ocrData.idNumber}</span>
              </div>
            </div>
          )}
        </div>

        {/* Host Direct Link */}
        <div className="bg-zinc-800/40 rounded-xl p-4">
          <h3 className="font-semibold text-zinc-300 mb-3">Host Direct Link</h3>
          <p className="text-xs text-zinc-400 mb-4">
            After booking, you can start a secure, encrypted chat with your host directly.
          </p>
          <div className="space-y-3">
            {uniqueHosts.length > 0 ? (
              uniqueHosts.map((host, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-lg cursor-pointer hover:bg-zinc-900/80 transition-colors group"
                    onClick={() => {
                      if (onContactHost) {
                        onContactHost(host.id);
                      } else {
                        toast.info(`Starting secure chat with ${host.name}... Redirecting to inbox.`);

                      }
                    }}
                  >
                    <img
                      src={host.avatar}
                      alt={host.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-800"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate group-hover:text-sky-400 transition-colors">{host.name}</p>
                      <p className="text-xs text-zinc-500 truncate">
                        {host.location ? `Host in ${host.location}` : 'Property Host'}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 bg-sky-500/20 rounded-full group-hover:bg-sky-500/30 transition-colors"
                    >
                      <Icon name="MessageSquare" size={16} className="text-sky-400" />
                    </motion.button>
                  </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-xs">
                No active host chats found. Book a stay to unlock direct messaging.
              </div>
            )}
          </div>
        </div>
      </div>

      <ActionConfirmModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={() => {
          removeId();
          setIsRemoveModalOpen(false);
        }}
        title="Remove ID Verification?"
        description="Are you sure you want to remove your ID verification? This may prevent you from booking certain premium properties."
        confirmLabel="Remove ID"
        variant="danger"
      />
    </div>

  );
};

export default VerificationAndTrust;

