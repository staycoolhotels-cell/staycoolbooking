import React, { useState, useEffect, useMemo } from 'react';
import { FileText, CalendarCheck, UploadCloud, AlertCircle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { Property } from '@/lib/types';

// Extended Document Type mapping to Supabase structure
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

// Extended License Type mapping to Supabase structure
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

const SmartDocumentVault: React.FC<SmartDocumentVaultProps> = ({ properties = [] }) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [licenses, setLicenses] = useState<LicenseData[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<string>('Other');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);

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

      // Attempt to insert record
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
        // We will still add a mock document to UI just in case insert fails due to missing table/schema
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

  // Memoize property map for quick lookups
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
        // Fetch Documents for this host
        const { data: docsData } = await supabase
          .from('documents')
          .select('*')
          .eq('host_id', user.id)
          .order('created_at', { ascending: false });

        if (docsData) {
          setDocuments(docsData);
        }

        // Fetch Licenses for host's properties
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

  return (
    <div className="p-6 bg-zinc-950/50">
      <h1 className="text-3xl font-bold text-zinc-100 mb-6">Smart Document Vault</h1>

      {loading ? (
        <div className="text-white/50 animate-pulse">Accessing Vault...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Uploaded Documents</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 border border-white/10 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <FileText size={20} className="text-blue-500 mr-3" />
                      <div>
                        <p className="font-semibold text-white">{doc.name}</p>
                        <p suppressHydrationWarning className="text-xs text-white/50">
                          Type: {doc.type} | Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-sky-400 hover:underline"
                    >
                      View
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-white/50 text-sm">No documents uploaded yet.</p>
              )}
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors"
              >
                <UploadCloud size={20} className="mr-2" /> Upload New Document
              </button>
            </div>
          </div>

          {/* License Tracker */}
          <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">License Tracker</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {licenses.length > 0 ? (
                licenses.map((license) => (
                  <div
                    key={license.id}
                    className={`p-3 border rounded-xl ${license.status === 'Expiring Soon' ? 'border-yellow-400 bg-yellow-500/10' : license.status === 'Expired' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">{license.property_name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${license.status === 'Expiring Soon' ? 'bg-yellow-500/20 text-yellow-400' : license.status === 'Expired' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
                      >
                        {license.status}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">License No: {license.license_number}</p>
                    <p suppressHydrationWarning className="text-sm text-zinc-400 flex items-center">
                      <CalendarCheck size={16} className="mr-1" /> Expiry: {new Date(license.expiry_date).toLocaleDateString()}
                    </p>
                    {license.status === 'Expiring Soon' && (
                      <p className="text-xs text-yellow-400 flex items-center mt-2">
                        <AlertCircle size={14} className="mr-1" /> Renew soon!
                      </p>
                    )}
                    {license.status === 'Expired' && (
                      <p className="text-xs text-red-400 flex items-center mt-2">
                        <AlertCircle size={14} className="mr-1" /> Action required: License expired.
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-white/50 text-sm">No licenses tracked automatically.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md p-6 border border-zinc-800 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Upload Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Document Name (Optional)</label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Passport, License 2024"
                  className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Document Type</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as any)}
                  className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="Guest ID">Guest ID</option>
                  <option value="Property License">Property License</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Select File</label>
                <input
                  type="file"
                  onChange={(e) => setNewDocFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-zinc-400 bg-zinc-800 border-zinc-700 rounded-lg p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-white/70 hover:text-white mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newDocFile || isUploading}
                  className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 flex items-center"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartDocumentVault;
