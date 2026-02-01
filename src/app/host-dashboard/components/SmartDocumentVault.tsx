import React from 'react';
import { Document, License, DocumentType } from '../types';
import { FileText, CalendarCheck, UploadCloud, AlertCircle } from 'lucide-react';

const dummyDocuments: Document[] = [
  {
    id: 'doc1',
    name: 'Guest ID - John Doe.pdf',
    type: 'Guest ID',
    uploadDate: '2024-01-10',
    url: '#',
    guestId: 'guest123',
  },
  {
    id: 'doc2',
    name: 'Property License - Villa Beachfront.pdf',
    type: 'Property License',
    uploadDate: '2023-11-01',
    url: '#',
    propertyId: 'prop1',
  },
  {
    id: 'doc3',
    name: 'Insurance Policy.pdf',
    type: 'Insurance',
    uploadDate: '2023-12-15',
    url: '#',
  },
];

const dummyLicenses: License[] = [
  {
    id: 'lic1',
    propertyName: 'Luxury Villa Beachfront',
    licenseNumber: 'LVBF-2023-001',
    expiryDate: '2024-03-15',
    status: 'Expiring Soon',
    documentId: 'doc2',
  },
  {
    id: 'lic2',
    propertyName: 'Downtown Penthouse',
    licenseNumber: 'DPHP-2022-045',
    expiryDate: '2025-10-20',
    status: 'Active',
    documentId: 'doc3', // Assuming doc3 is license for penthouse for dummy
  },
  {
    id: 'lic3',
    propertyName: 'Mountain Cabin Retreat',
    licenseNumber: 'MCR-2021-010',
    expiryDate: '2023-12-31',
    status: 'Expired',
    documentId: 'doc1', // Placeholder
  },
];

const SmartDocumentVault: React.FC = () => {
  return (
    <div className="p-6 bg-zinc-950/50">
      <h1 className="text-3xl font-bold text-zinc-100 mb-6">Smart Document Vault</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">Uploaded Documents</h2>
          <div className="space-y-3">
            {dummyDocuments.length > 0 ? (
              dummyDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 border border-white/10 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <FileText size={20} className="text-blue-500 mr-3" />
                    <div>
                      <p className="font-semibold text-white">{doc.name}</p>
                      <p className="text-xs text-white/50">
                        Type: {doc.type} | Uploaded: {doc.uploadDate}
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
              <p className="text-white/50">No documents uploaded yet.</p>
            )}
            <button className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors">
              <UploadCloud size={20} className="mr-2" /> Upload New Document
            </button>
          </div>
        </div>

        {/* License Tracker */}
        <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">License Tracker</h2>
          <div className="space-y-3">
            {dummyLicenses.length > 0 ? (
              dummyLicenses.map((license) => (
                <div
                  key={license.id}
                  className={`p-3 border rounded-xl ${license.status === 'Expiring Soon' ? 'border-yellow-400 bg-yellow-500/10' : license.status === 'Expired' ? 'border-red-400 bg-red-500/10' : 'border-white/10'}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{license.propertyName}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${license.status === 'Expiring Soon' ? 'bg-yellow-500/20 text-yellow-400' : license.status === 'Expired' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
                    >
                      {license.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">License No: {license.licenseNumber}</p>
                  <p className="text-sm text-zinc-400 flex items-center">
                    <CalendarCheck size={16} className="mr-1" /> Expiry: {license.expiryDate}
                  </p>
                  {license.status === 'Expiring Soon' && (
                    <p className="text-xs text-yellow-400 flex items-center mt-1">
                      <AlertCircle size={14} className="mr-1" /> Renew soon!
                    </p>
                  )}
                  {license.status === 'Expired' && (
                    <p className="text-xs text-red-400 flex items-center mt-1">
                      <AlertCircle size={14} className="mr-1" /> Action required: License expired.
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-white/50">No licenses tracked.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartDocumentVault;
