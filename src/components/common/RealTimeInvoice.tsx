'use client';

import React from 'react';
import { Transaction } from '@/lib/types';

type RealTimeInvoiceProps = {
  transaction: Transaction;
  onClose?: () => void;
};

const RealTimeInvoice = ({ transaction, onClose }: RealTimeInvoiceProps) => {
  const isRefund = transaction.type === 'refund';
  const invoiceId = transaction.invoice_id || (transaction.id ? transaction.id.split('-')[0].toUpperCase() : 'N/A');
  const date = transaction.date || new Date().toLocaleDateString();

  const breakdown = transaction.breakdown || {
    accommodation: (transaction.amount || 0) * 0.88,
    service_fee: (transaction.amount || 0) * 0.10,
    taxes: (transaction.amount || 0) * 0.02
  };

  return (
    <div className="bg-white max-w-[800px] mx-auto shadow-2xl rounded-2xl overflow-hidden text-zinc-900 font-sans border border-zinc-200">
      {/* 1. Header & Accent Bar */}
      <div className="bg-[#1f2128] p-8 relative">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center space-x-4">
            <img src="/assets/images/logo.png" alt="StayCool Logo" className="h-10 w-auto object-contain" />
            <img src="/assets/Picsart_26-03-22_23-32-24-684.png" alt="Secondary Logo" className="h-10 w-auto object-contain" />
          </div>
          <div className="text-right">
            <h2 className="text-5xl font-black text-[#0ea5e9] tracking-tighter italic">
              {isRefund ? 'REFUND INVOICE' : 'INVOICE'}
            </h2>
          </div>
        </div>
      </div>
      <div className="h-2 bg-[#0ea5e9]" />

      {/* 2. Info Section */}
      <div className="bg-[#1f2128] px-8 py-10 flex border-t border-white/5">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Invoice to:</p>
          <p className="text-xl font-bold text-white mb-2">{transaction.guestName || 'Valued Guest'}</p>
          <div className="text-xs text-zinc-400 leading-relaxed font-medium whitespace-pre-line">
            {transaction.guestAddress || 'Address not provided'}
          </div>
        </div>
        <div className="w-[200px] text-right">
             <div className="mb-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Invoice#</p>
                <p className="text-white font-bold">{invoiceId}</p>
             </div>
             <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date:</p>
                <p className="text-white font-bold">{date}</p>
             </div>
        </div>
      </div>

      {/* 3. Table */}
      <div className="p-8">
        <div className="bg-[#f0f2f5] rounded-lg overflow-hidden border border-zinc-200">
          <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="text-[10px] font-bold text-zinc-600 border-b border-zinc-200" style={{ letterSpacing: '0.04em' }}>
                <th className="py-3 text-center uppercase whitespace-nowrap" style={{ width: '60px', minWidth: '60px', paddingLeft: '8px', paddingRight: '8px' }}>SL.</th>
                <th className="px-4 py-3 uppercase">Item Description</th>
                <th className="px-4 py-3 text-center uppercase" style={{ width: '120px' }}>Price</th>
                <th className="px-4 py-3 text-center uppercase" style={{ width: '70px' }}>Qty.</th>
                <th className="px-4 py-3 text-right uppercase" style={{ width: '110px' }}>Total</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                <td className="px-3 py-4 text-center font-bold text-zinc-400">1</td>
                <td className="px-4 py-4 font-semibold">Accommodation Charges</td>
                <td className="px-4 py-4 text-center">₹{breakdown.accommodation.toLocaleString('en-IN')}</td>
                <td className="px-4 py-4 text-center">1</td>
                <td className="px-4 py-4 text-right font-bold text-sky-600">₹{breakdown.accommodation.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                <td className="px-3 py-4 text-center font-bold text-zinc-400">2</td>
                <td className="px-4 py-4 font-semibold">Platform Service</td>
                <td className="px-4 py-4 text-center">₹{breakdown.service_fee.toLocaleString('en-IN')}</td>
                <td className="px-4 py-4 text-center">1</td>
                <td className="px-4 py-4 text-right font-bold text-sky-600">₹{breakdown.service_fee.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                <td className="px-3 py-4 text-center font-bold text-zinc-400">3</td>
                <td className="px-4 py-4 font-semibold">Applicable Taxes (GST/Stay Tax)</td>
                <td className="px-4 py-4 text-center">₹{breakdown.taxes.toLocaleString('en-IN')}</td>
                <td className="px-4 py-4 text-center">1</td>
                <td className="px-4 py-4 text-right font-bold text-sky-600">₹{breakdown.taxes.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Footer */}
      <div className="px-8 pb-12 flex justify-between items-start pt-4">
        <div className="flex-1 space-y-8">
           <div>
              <p className="text-sm font-black text-zinc-800 italic uppercase">Thank you for choosing STAY COOL</p>
           </div>
           
           <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-3">Payment Info:</p>
              <div className="text-xs font-semibold text-zinc-600 space-y-1">
                <p><span className="text-zinc-400 w-24 inline-block">Account #:</span> 1234 5678 9012</p>
                <p><span className="text-zinc-400 w-24 inline-block">A/C Name:</span> STAYCOOL PVT LTD</p>
                <p><span className="text-zinc-400 w-24 inline-block">Bank Details:</span> STAYCOOL PREMIUM BANKING</p>
              </div>
           </div>

           <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Terms & Conditions</p>
              <p className="text-[9px] leading-relaxed text-zinc-400 italic max-w-[300px]">
                1. Guest is responsible for property condition. 2. Cancellations must be made 72 hours prior for full refund. 3. StayCool is a platform provider. 4. Luxury services subject to availability.
              </p>
           </div>
        </div>

        <div className="w-[300px]">
            <div className="space-y-3 mb-10">
                <div className="flex justify-between items-center text-sm">
                    <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Sub Total:</p>
                    <p className="font-bold text-zinc-800">₹{transaction.amount.toLocaleString('en-IN')}</p>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Tax:</p>
                    <p className="font-bold text-zinc-800">0.00%</p>
                </div>
                <div className="h-px bg-zinc-100" />
                <div className="flex justify-between items-center text-sm">
                    <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">{isRefund ? 'Total Refunded:' : 'Total Amount Paid:'}</p>
                    <p className="text-2xl font-black text-[#0ea5e9] tracking-tighter">₹{transaction.amount.toLocaleString('en-IN')}</p>
                </div>
            </div>

            <div className="text-center pt-10 border-t-2 border-dashed border-zinc-100 mt-10">
                <div className="h-[1px] bg-zinc-200 w-2/3 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Authorised Sign</p>
                <p className="text-[9px] font-medium text-sky-500 mt-1">Verified StayCool Security</p>
            </div>
        </div>
      </div>
      
      {onClose && (
        <div className="absolute top-4 right-4 print:hidden">
            <button 
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      )}
    </div>
  );
};

export default RealTimeInvoice;
