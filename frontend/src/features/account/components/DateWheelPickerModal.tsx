'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateWheelPicker } from './DateWheelPicker';

export interface DateWheelPickerModalProps {
  readonly isOpen: boolean;
  readonly initialDate?: Date;
  readonly minYear?: number;
  readonly maxYear?: number;
  readonly onClose: () => void;
  readonly onConfirm: (date: Date) => void;
}

export function DateWheelPickerModal({
  isOpen,
  initialDate,
  minYear = 1920,
  maxYear = new Date().getFullYear(),
  onClose,
  onConfirm,
}: Readonly<DateWheelPickerModalProps>) {
  const [tempDate, setTempDate] = useState<Date>(
    () => initialDate ?? new Date(1998, 9, 14)
  );

  // Sync tempDate whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setTempDate(initialDate ?? new Date(1998, 9, 14));
    }
  }, [isOpen, initialDate]);

  // Handle ESC key dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    onConfirm(tempDate);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="date-picker-modal-title"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-hidden"
        >
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Card (Strict 0px Geometry, Stealth Palette) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[380px] bg-[#0E0E10] border border-[#1E1E21] shadow-2xl rounded-none flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E21] shrink-0">
              <h3
                id="date-picker-modal-title"
                className="text-[15px] font-medium text-white tracking-tight"
              >
                Select Date of Birth
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-[#8A8F98] hover:text-white transition-colors p-1"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: 3D Wheel Picker with ample breathing room */}
            <div className="p-6 flex flex-col items-center justify-center bg-[#101012]">
              <div className="w-full">
                <DateWheelPicker
                  value={tempDate}
                  onChange={setTempDate}
                  minYear={minYear}
                  maxYear={maxYear}
                />
              </div>

              <p className="text-[11px] text-[#8A8F98] leading-relaxed text-center mt-4">
                Scroll or drag wheels to set your birth date. This can only be set once.
              </p>
            </div>

            {/* Modal Footer: Action Buttons */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#1E1E21] bg-[#0E0E10] shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[13px] font-medium text-[#8A8F98] hover:text-white transition-colors rounded-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 bg-white text-black text-[13px] font-medium hover:bg-[#E2E2E2] active:bg-[#C8C8C8] transition-colors rounded-none"
              >
                Set Date
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
