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
    accommodation: (transaction.amount || 0) * 0.78,
    service_fee: (transaction.amount || 0) * 0.20,
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
        <div className="w-[280px] space-y-2">
             <div className="grid grid-cols-[140px_1fr] items-center">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Invoice#</p>
                <p className="text-white font-bold">{invoiceId}</p>
             </div>
             <div className="grid grid-cols-[140px_1fr] items-center">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date:</p>
                <p className="text-white font-bold">{date}</p>
             </div>
             {transaction.bookingDate && (
               <div className="grid grid-cols-[140px_1fr] items-center pt-1 border-t border-white/5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Booking Date:</p>
                  <p className="text-white font-bold">{transaction.bookingDate}</p>
               </div>
             )}
             {transaction.cancellationDate && (
               <div className="grid grid-cols-[140px_1fr] items-center text-rose-400">
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Cancellation Date:</p>
                  <p className="font-bold">{transaction.cancellationDate}</p>
               </div>
             )}
             {transaction.refundDate && (
               <div className="grid grid-cols-[140px_1fr] items-center text-emerald-400">
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Refund Date:</p>
                  <p className="font-bold">{transaction.refundDate}</p>
               </div>
             )}
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
      <div className="px-8 pb-12 flex justify-between items-start -mt-12">
        <div className="flex-1 space-y-3">
           <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Thank you for choosing</p>
              <p className="text-4xl font-black uppercase tracking-tight" style={{ color: '#0ea5e9', letterSpacing: '-0.03em' }}>STAY COOL</p>
           </div>
           
           <div className="relative">
               <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-3">Terms & Conditions</p>
               <div className="space-y-2 max-w-[300px]">
                 <p className="text-[9px] leading-relaxed text-zinc-400">The guest is fully responsible for maintaining the property in good condition throughout the duration of their stay.</p>
                 <p className="text-[9px] leading-relaxed text-zinc-400">All cancellations must be requested at least 72 hours prior to the check-in date to be eligible for a full refund.</p>
                 <p className="text-[9px] leading-relaxed text-zinc-400">StayCool acts solely as a platform provider and is not a direct party to the accommodation contract between the guest and host.</p>
                 <p className="text-[9px] leading-relaxed text-zinc-400">Availability of luxury services and amenities is subject to change without prior notice.</p>
               </div>

               {/* Stamp Badge */}
               <div className="absolute left-[240px] top-0 select-none pointer-events-none">
                  {isRefund ? (
                    <img src="/assets/images/refund-stamp.png" alt="Refunded" className="w-[280px] h-[120px] object-contain -rotate-12 opacity-80" />
                  ) : (
                    <img src="/assets/images/paid-stamp.png" alt="Paid" className="w-[280px] h-[120px] object-contain -rotate-12 opacity-80" />
                  )}
               </div>
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


        </div>
      </div>
      

    </div>
  );
};

export default RealTimeInvoice;
