'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import Icon from '@/components/ui/AppIcon';

interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ActionConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger'
}: ActionConfirmModalProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'ExclamationTriangleIcon',
          iconBg: 'bg-red-500/20',
          iconColor: 'text-red-500',
          buttonBg: 'bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]',
          borderColor: 'border-red-500/20'
        };
      case 'warning':
        return {
          icon: 'ExclamationCircleIcon',
          iconBg: 'bg-amber-500/20',
          iconColor: 'text-amber-500',
          buttonBg: 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.3)]',
          borderColor: 'border-amber-500/20'
        };
      default:
        return {
          icon: 'InformationCircleIcon',
          iconBg: 'bg-indigo-500/20',
          iconColor: 'text-indigo-500',
          buttonBg: 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)]',
          borderColor: 'border-indigo-500/20'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-[#0a0a0f] border border-white/10 p-0 overflow-hidden rounded-3xl">
        <div className="relative p-6 md:p-8">
          {/* Background effects */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
          
          <div className="flex flex-col items-center text-center">
            {/* Animated Icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-16 h-16 ${styles.iconBg} rounded-2xl flex items-center justify-center mb-6 border ${styles.borderColor}`}
            >
              <Icon name={styles.icon as any} size={32} className={styles.iconColor} />
            </motion.div>

            <DialogTitle className="text-2xl font-black text-white mb-2 tracking-tight">
              {title}
            </DialogTitle>
            
            <DialogDescription className="text-zinc-400 text-sm leading-relaxed mb-8">
              {description}
            </DialogDescription>


            <div className="flex flex-col w-full gap-3">
              <button
                onClick={onConfirm}
                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 ${styles.buttonBg} text-white`}
              >
                {confirmLabel}
              </button>
              
              <button
                onClick={onClose}
                className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all hover:bg-white/5 text-zinc-500 hover:text-white border border-white/5"
              >
                {cancelLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Subtle glow bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-red-500/5 to-transparent pointer-events-none" />
      </DialogContent>
    </Dialog>
  );
};

export default ActionConfirmModal;
