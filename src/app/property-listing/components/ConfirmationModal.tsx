'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils'; // Assuming this exists or I'll implement a simple one

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    bookingDetails: {
        roomCount: number;
        nights: number;
        pricePerNight: number;
        totalPrice: number;
        discount: number;
        propertyName: string;
    };
}

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    bookingDetails,
}: ConfirmationModalProps) => {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-slate-900 text-white border-slate-700">
                <DialogHeader>
                    <DialogTitle>Confirm Bulk Booking</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        You are about to book multiple rooms at {bookingDetails.propertyName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Rooms</span>
                        <span className="font-semibold text-white">{bookingDetails.roomCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Duration</span>
                        <span className="font-semibold text-white">{bookingDetails.nights} nights</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Price per night</span>
                        <span className="font-semibold text-white">₹{bookingDetails.pricePerNight.toLocaleString('en-IN')}</span>
                    </div>
                    {bookingDetails.discount > 0 && (
                        <div className="flex justify-between items-center text-sm text-green-400">
                            <span>Bulk Discount</span>
                            <span>- ₹{bookingDetails.discount.toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    <div className="border-t border-slate-700 pt-4 flex justify-between items-center font-bold text-lg">
                        <span>Total</span>
                        <span>₹{bookingDetails.totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                </div>
                <DialogFooter className="flex gap-2 sm:justify-end">
                    <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-800">
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-500 text-white">
                        Proceed to Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmationModal;
