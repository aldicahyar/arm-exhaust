'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

const BENCHO_EASE = [0.22, 1, 0.36, 1] as const;

export interface CertificateModalProps {
  readonly isOpen: boolean;
  readonly serialNumber: string;
  readonly modelName: string;
  readonly vehicleMatch: string;
  readonly materialGrade?: string;
  readonly warrantyStatus?: string;
  readonly warrantyType?: string;
  readonly fabricationDate?: string;
  readonly verificationToken?: string;
  readonly onClose: () => void;
}

export function AccountCertificateModal({
  isOpen,
  serialNumber,
  modelName,
  vehicleMatch,
  materialGrade = 'Grade 1 Japanese Titanium (TIG Welded)',
  warrantyStatus = 'ACTIVE',
  warrantyType = 'Lifetime Structural TIG Weld Guarantee',
  fabricationDate = '18 November 2026',
  verificationToken,
  onClose,
}: Readonly<CertificateModalProps>) {
  const [copied, setCopied] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tokenQuery = verificationToken ? `?token=${encodeURIComponent(verificationToken)}` : '';
      setPublicUrl(`${window.location.origin}/verify/${encodeURIComponent(serialNumber)}${tokenQuery}`);
    }
  }, [serialNumber, verificationToken]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="certificate-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.22, ease: BENCHO_EASE }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[580px] bg-[#0E0E10] border border-[#1E1E21] text-white p-6 md:p-8 font-sans rounded-none shadow-2xl relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1E1E21] pb-4 mb-6">
              <div>
                <span className="text-[11px] font-mono tracking-widest text-[#8A8F98] uppercase">
                  Official Digital Passport
                </span>
                <h2 id="certificate-modal-title" className="text-[18px] font-normal text-white tracking-tight mt-0.5">
                  ARM Exhaust Certificate of Authenticity
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close certificate modal"
                className="text-[#8A8F98] hover:text-white text-[13px] px-2 py-1 transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Serial & Status Ribbon */}
            <div className="bg-[#141416] border border-[#1E1E21] p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono text-[#8A8F98] uppercase">Serial Number</div>
                <div className="text-[18px] font-mono font-medium text-white tracking-wider mt-0.5">
                  {serialNumber}
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 self-start sm:self-auto bg-white text-black px-2.5 py-1 text-[11px] font-mono uppercase font-semibold">
                <span>VERIFIED AUTHENTIC</span>
              </div>
            </div>

            {/* QR Code & Direct Scan Instruction */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 border border-[#1E1E21] mb-6 bg-[#0A0A0B]">
              <div className="p-3 bg-white shrink-0">
                <QRCodeSVG
                  value={publicUrl || `https://armexhaust.com/verify/${serialNumber}`}
                  size={132}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="text-center sm:text-left">
                <div className="text-[14px] font-medium text-white mb-1">
                  Scan to Verify Provenance
                </div>
                <p className="text-[12px] text-[#8A8F98] leading-relaxed mb-3">
                  Anyone who scans this QR code on a smartphone camera will open the official public registry proving original ownership and valid warranty.
                </p>
                <div className="text-[11px] font-mono text-[#8A8F98] break-all">
                  {publicUrl}
                </div>
              </div>
            </div>

            {/* Specifications Matrix */}
            <div className="border-t border-[#1E1E21] pt-4 mb-6 space-y-2.5 text-[13px]">
              <div className="flex justify-between py-1 border-b border-[#141416]">
                <span className="text-[#8A8F98]">Exhaust Model</span>
                <span className="text-white font-medium text-right">{modelName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#141416]">
                <span className="text-[#8A8F98]">Motorcycle Match</span>
                <span className="text-white text-right">{vehicleMatch}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#141416]">
                <span className="text-[#8A8F98]">Material Grade</span>
                <span className="text-white text-right">{materialGrade}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#141416]">
                <span className="text-[#8A8F98]">Fabrication Date</span>
                <span className="text-white text-right">{fabricationDate}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8A8F98]">Warranty Status</span>
                <span className="text-white text-right">{warrantyStatus} • {warrantyType}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-4 text-[13px] border border-white text-white hover:bg-white hover:text-black transition-colors text-center"
              >
                {copied ? '✓ Link Copied to Clipboard' : 'Copy Verification Link'}
              </button>

              <a
                href={publicUrl || `/verify/${encodeURIComponent(serialNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 text-[13px] text-[#8A8F98] hover:text-white underline underline-offset-4 text-center transition-colors"
              >
                Open Public Registry Page ↗
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
