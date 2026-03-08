'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Property } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';

export type DocumentType = 'Guest ID' | 'Property License' | 'Insurance' | 'Other';
export interface DocumentData {
  id: string;
  host_id: string;
  name: string;
  type: DocumentType | string;
  url: string;
  guest_id?: string;
  property_id?: string;
  created_at: string;
}

export interface LicenseData {
  id: string;
  property_id: string;
  property_name?: string;
  license_number: string;
  expiry_date: string;
  status: 'Active' | 'Expiring Soon' | 'Expired' | string;
  document_id?: string;
  created_at: string;
}

interface SmartDocumentVaultProps {
  properties?: Property[];
}

const getLicenseStatusColors = (status: string) => {
  switch (status) {
    case 'Expiring Soon':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', glow: 'shadow-[inset_0_0_20px_rgba(234,179,8,0.05)]', icon: 'ExclamationTriangleIcon' as const };
    case 'Expired':
      return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', glow: 'shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]', icon: 'XCircleIcon' as const };
    case 'Active':
    default:
      return { bg: 'bg-success/5', text: 'text-success', border: 'border-success/20', glow: '', icon: 'CheckBadgeIcon' as const };
  }
};

const SmartDocumentVault: React.FC<SmartDocumentVaultProps> = ({ properties = [] }) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [licenses, setLicenses] = useState<LicenseData[]>([]);
  const [loading, setLoading] = useState(true);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<string>('Other');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocFile) return;

    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      const fileExt = newDocFile.name.split('.').pop();
      const fileName = `${user.id}/vault/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, newDocFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName);
      const fileUrl = publicUrlData.publicUrl;

      const { data: insertedDoc, error: insertError } = await supabase
        .from('documents')
        .insert([{
          host_id: user.id,
          name: newDocName || newDocFile.name,
          type: newDocType,
          url: fileUrl,
        }])
        .select()
        .single();

      if (insertError) {
        console.error("DB Insert Error:", insertError);
        const fallbackDoc: DocumentData = {
          id: `temp-${Date.now()}`,
          host_id: user.id,
          name: newDocName || newDocFile.name,
          type: newDocType,
          url: fileUrl,
          created_at: new Date().toISOString()
        };
        setDocuments(prev => [fallbackDoc, ...prev]);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      if (insertedDoc) {
        setDocuments(prev => [insertedDoc, ...prev]);
      }

      setShowUploadModal(false);
      setNewDocName('');
      setNewDocType('Other');
      setNewDocFile(null);
    } catch (error: any) {
      console.error("Error uploading document:", error);
      alert(error.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const propertyMap = useMemo(() => {
    return properties.reduce((acc, prop) => {
      acc[prop.id] = prop;
      return acc;
    }, {} as Record<string, Property>);
  }, [properties]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data: docsData } = await supabase
          .from('documents')
          .select('*')
          .eq('host_id', user.id)
          .order('created_at', { ascending: false });

        if (docsData) {
          setDocuments(docsData);
        }

        const propertyIds = properties.map(p => p.id);
        if (propertyIds.length > 0) {
          const { data: licenseData } = await supabase
            .from('licenses')
            .select('*')
            .in('property_id', propertyIds)
            .order('expiry_date', { ascending: true });

          if (licenseData) {
            const enrichedLicenses = licenseData.map((item: any) => ({
              ...item,
              property_name: propertyMap[item.property_id]?.name || 'Unknown Property'
            }));
            setLicenses(enrichedLicenses);
          }
        }
      } catch (error) {
        console.error("Error fetching Vault data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, properties, propertyMap]);

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <Icon name="ArrowPathIcon" size={40} className="text-cyan-500 animate-spin mb-4" />
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Unlocking Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 md:space-y-8 relative">
      {/* 1. Ultra-Premium Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#0a0a0f]/80 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 w-64 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <Icon name="FolderShieldIcon" size={32} className="text-cyan-400 drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg">Smart Vault</h1>
            <p className="text-sm font-medium text-zinc-400 mt-1 uppercase tracking-widest flex items-center gap-2">
              Compliance & Safety
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 w-full md:w-auto">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex-1 md:flex-none bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] border border-cyan-400/50 transition-all rounded-2xl px-6 py-4 flex items-center justify-center gap-3 font-bold"
          >
            <Icon name="ArrowUpTrayIcon" size={20} />
            Upload Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* 2. Uploaded Documents */}
        <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden group flex flex-col min-h-[500px]">
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-cyan-500/15 transition-colors duration-1000" />

          <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shadow-inner">
                <Icon name="DocumentDuplicateIcon" size={20} className="text-cyan-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Secured Documents
              </h2>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
              {documents.length} Files
            </span>
          </div>

          <div className="relative z-10 space-y-3 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {documents.length > 0 ? (
              documents.map((doc, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={doc.id}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300 group/doc flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-white/10 flex items-center justify-center shadow-inner flex-none group-hover/doc:border-cyan-500/30 transition-colors">
                      <Icon name="DocumentTextIcon" size={24} className="text-cyan-500/70 group-hover/doc:text-cyan-400 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate">{doc.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{doc.type}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                          {new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-none p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-cyan-600 hover:border-cyan-500 transition-all shadow-sm"
                    title="View Document"
                  >
                    <Icon name="ArrowTopRightOnSquareIcon" size={16} />
                  </a>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <Icon name="InboxIcon" size={40} className="text-zinc-500 mb-4" />
                <p className="text-sm font-bold text-zinc-300">Vault is Empty</p>
                <p className="text-xs text-zinc-500 mt-1">Upload files to securely store your data.</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. License Tracker */}
        <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden group flex flex-col min-h-[500px]">
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/15 transition-colors duration-1000" />

          <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-inner">
                <Icon name="ClipboardDocumentCheckIcon" size={20} className="text-indigo-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                License & Compliance
              </h2>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
              Active Tracker
            </span>
          </div>

          <div className="relative z-10 space-y-4 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {licenses.length > 0 ? (
              licenses.map((license, idx) => {
                const statusConfig = getLicenseStatusColors(license.status);
                return (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={license.id}
                    className={`p-5 rounded-2xl border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.glow} transition-all duration-300 relative overflow-hidden group/license`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="pr-4 min-w-0">
                        <h3 className="font-bold text-base text-white truncate">{license.property_name}</h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 font-mono">
                          ID: {license.license_number}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 ${statusConfig.text} bg-black/20 backdrop-blur-sm shadow-inner shrink-0`}>
                        <Icon name={statusConfig.icon as any} size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{license.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Valid Until</span>
                          <span className={`text-sm font-bold font-mono ${license.status === 'Expired' ? 'text-red-400' : 'text-white'}`}>
                            {new Date(license.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {license.status !== 'Active' && (
                        <button className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-colors
                                     ${license.status === 'Expired'
                            ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/30'}
                                  `}>
                          Renew Now
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <p className="text-sm font-bold text-zinc-400">No properties requiring license tracking.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Upload Modal - Ultra Premium */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0f] rounded-[2rem] w-full max-w-lg border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500" />

              <div className="p-6 md:p-8 flex flex-col items-center border-b border-white/5 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/10 blur-[50px] pointer-events-none" />
                <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 text-cyan-400 shadow-inner relative z-10">
                  <Icon name="CloudArrowUpIcon" size={32} />
                </div>
                <h2 className="text-2xl font-heading font-bold text-white relative z-10">Secure Upload</h2>
                <p className="text-xs text-zinc-400 mt-2 font-medium relative z-10">Your files are encrypted and stored in the Smart Vault.</p>

                <button
                  onClick={() => setShowUploadModal(false)}
                  className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-20"
                >
                  <Icon name="XMarkIcon" size={16} />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="p-6 md:p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Document Registry Name</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                        <Icon name="DocumentIcon" size={16} />
                      </div>
                      <input
                        type="text"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        placeholder="e.g. Passport ID, Liability Auth 2024"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-zinc-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all outline-none font-medium text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Classification</label>
                      <div className="relative">
                        <select
                          value={newDocType}
                          onChange={(e) => setNewDocType(e.target.value as any)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all outline-none appearance-none font-medium text-sm"
                        >
                          <option value="Guest ID">Identity Verification</option>
                          <option value="Property License">Operational License</option>
                          <option value="Insurance">Liability Insurance</option>
                          <option value="Other">Unclassified Record</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                          <Icon name="ChevronDownIcon" size={16} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">File Payload</label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => setNewDocFile(e.target.files ? e.target.files[0] : null)}
                      required
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${newDocFile ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 hover:border-white/30 bg-black/20'}`}
                    >
                      {newDocFile ? (
                        <div className="flex flex-col items-center text-center">
                          <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mb-3">
                            <Icon name="DocumentCheckIcon" size={24} />
                          </div>
                          <p className="text-sm font-bold text-white truncate max-w-[200px]">{newDocFile.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">{(newDocFile.size / 1024 / 1024).toFixed(2)} MB • Ready</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center">
                          <Icon name="FolderPlusIcon" size={32} className="text-zinc-600 mb-3" />
                          <p className="text-sm font-bold text-zinc-300">Click to browse securely</p>
                          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">PDF, JPG, PNG (Max 10MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-3.5 px-4 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={!newDocFile || isUploading}
                    className="flex-1 py-3.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:shadow-none flex items-center justify-center"
                  >
                    {isUploading ? (
                      <>
                        <Icon name="ArrowPathIcon" size={16} className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : 'Execute Upload'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartDocumentVault;
