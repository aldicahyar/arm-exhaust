'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldCheck, Mail, MessageSquare } from 'lucide-react';
import type { CommunicationPreferences } from '../types';
import { DEFAULT_COMMUNICATION_PREFERENCES } from '../types';
import { loadStoredPreferences, saveStoredPreferences } from '../services/account.api';

// Bencho official transition curve
const BENCHO_EASE = [0.22, 1, 0.36, 1] as const;

export interface AccountPrivacyTabProps {
  readonly userEmail: string;
  readonly userPhone?: string;
  readonly userId?: string;
}

interface StealthToggleProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly id: string;
  readonly label: string;
}

/**
 * Ergonomic monochrome pill toggle switch (Polestar/Apple standard).
 * Features exact 2px symmetrical padding with hardware-accelerated translation.
 */
function StealthToggle({
  checked,
  onChange,
  disabled = false,
  id,
  label,
}: Readonly<StealthToggleProps>) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onChange(!checked);
        }
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 p-0.5 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10] select-none ${
        disabled
          ? 'cursor-not-allowed opacity-50 ' + (checked ? 'bg-white' : 'bg-[#27272A]')
          : checked
          ? 'bg-white'
          : 'bg-[#27272A] hover:bg-[#323238]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-5 bg-[#0E0E10]' : 'translate-x-0 bg-white'
        }`}
      />
    </button>
  );
}

export function AccountPrivacyTab({
  userEmail,
  userPhone = '',
  userId = 'default-user',
}: Readonly<AccountPrivacyTabProps>) {
  const [preferences, setPreferences] = useState<CommunicationPreferences>(
    DEFAULT_COMMUNICATION_PREFERENCES
  );
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load preferences from storage on mount
  useEffect(() => {
    const loaded = loadStoredPreferences(userId);
    setPreferences(loaded);
  }, [userId]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleToggle = (key: keyof CommunicationPreferences, value: boolean) => {
    if (key === 'orderUpdates') return; // Immutable required notification

    const updated: CommunicationPreferences = {
      ...preferences,
      [key]: value,
    };

    setPreferences(updated);
    setSaveStatus('saving');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Save with subtle visual feedback
    saveStoredPreferences(userId, updated);

    timerRef.current = setTimeout(() => {
      setSaveStatus('saved');
      timerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2400);
    }, 250);
  };

  const cleanPhone = userPhone.trim();
  const displayPhone = cleanPhone && cleanPhone !== '-' ? cleanPhone : 'Phone not provided';

  return (
    <div className="py-2 max-w-3xl">
      {/* Top Header with Subtle Auto-save Feedback */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#1E1E21]">
        <div>
          <h2 className="text-[18px] font-normal text-white tracking-tight">
            Communication Preferences
          </h2>
          <p className="text-[13px] text-[#8A8F98] mt-1 leading-relaxed">
            Choose what you receive from ARM Exhaust. Transactional order updates are always delivered.
          </p>
        </div>

        {/* Quiet Auto-Save Feedback Pill */}
        <div className="h-6 flex items-center justify-end min-w-[140px]" aria-live="polite">
          <AnimatePresence mode="wait">
            {saveStatus === 'saving' && (
              <motion.span
                key="saving"
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.16, ease: BENCHO_EASE }}
                className="text-[12px] font-mono text-[#8A8F98] flex items-center gap-1.5 select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#8A8F98] animate-pulse" />
                <span>Saving...</span>
              </motion.span>
            )}

            {saveStatus === 'saved' && (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.16, ease: BENCHO_EASE }}
                className="text-[12px] font-medium text-white flex items-center gap-1.5 select-none"
              >
                <Check size={13} className="text-white" />
                <span>Preferences saved</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ====================================================================
          CATEGORY 1: COMMUNICATION TOPICS
          ==================================================================== */}
      <div className="flex flex-col gap-6">
        {/* Row 1: Order & Delivery Updates (Always On / Mandatory) */}
        <div className="flex items-start justify-between gap-6 p-4 bg-[#121214] border border-[#1E1E21]">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-white">
                Order & delivery updates
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium tracking-wider text-[#8A8F98] border border-[#27272A] uppercase select-none">
                Required
              </span>
            </div>
            <p className="text-[12px] text-[#8A8F98] mt-1 leading-relaxed">
              Critical receipts, workshop custom exhaust build progress, and courier cargo tracking codes.
            </p>
          </div>
          <div className="pt-0.5 shrink-0">
            <StealthToggle
              id="pref-orders"
              label="Order and delivery updates"
              checked={true}
              disabled={true}
              onChange={() => {}}
            />
          </div>
        </div>

        {/* Row 2: Promotions & Exclusive Offers (Opt-in) */}
        <div className="flex items-start justify-between gap-6 p-4 bg-[#121214] border border-[#1E1E21] hover:border-[#27272A] transition-colors">
          <div className="flex-1 min-w-0 pr-4">
            <span className="text-[14px] font-medium text-white">
              Promotions & exclusive offers
            </span>
            <p className="text-[12px] text-[#8A8F98] mt-1 leading-relaxed">
              Seasonal sales, pay-day flash discounts, and member birthday voucher codes.
            </p>
          </div>
          <div className="pt-0.5 shrink-0">
            <StealthToggle
              id="pref-promotions"
              label="Promotions and exclusive offers"
              checked={preferences.promotions}
              onChange={(val) => handleToggle('promotions', val)}
            />
          </div>
        </div>

        {/* Row 3: New Exhaust Releases & Soundchecks (Opt-in) */}
        <div className="flex items-start justify-between gap-6 p-4 bg-[#121214] border border-[#1E1E21] hover:border-[#27272A] transition-colors">
          <div className="flex-1 min-w-0 pr-4">
            <span className="text-[14px] font-medium text-white">
              New exhaust releases & soundchecks
            </span>
            <p className="text-[12px] text-[#8A8F98] mt-1 leading-relaxed">
              Product launch announcements, dyno test data sheets, and official automotive meet invitations.
            </p>
          </div>
          <div className="pt-0.5 shrink-0">
            <StealthToggle
              id="pref-releases"
              label="New exhaust releases and soundchecks"
              checked={preferences.newReleases}
              onChange={(val) => handleToggle('newReleases', val)}
            />
          </div>
        </div>
      </div>

      {/* ====================================================================
          CATEGORY 2: PREFERRED NOTIFICATION CHANNELS
          ==================================================================== */}
      <div className="mt-10 pt-8 border-t border-[#1E1E21]">
        <h3 className="text-[15px] font-medium text-white tracking-tight mb-2">
          Preferred Notification Channels
        </h3>
        <p className="text-[13px] text-[#8A8F98] mb-6 leading-relaxed">
          Specify which channels ARM Exhaust is permitted to use for non-critical marketing & updates.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email Channel Toggle Card */}
          <div className="p-4 bg-[#121214] border border-[#1E1E21] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Mail size={16} className="text-[#8A8F98] shrink-0" />
              <div className="truncate">
                <div className="text-[13px] font-medium text-white">Email</div>
                <div className="text-[11px] text-[#8A8F98] truncate">{userEmail}</div>
              </div>
            </div>
            <StealthToggle
              id="channel-email"
              label="Email notification channel"
              checked={preferences.channelEmail}
              onChange={(val) => handleToggle('channelEmail', val)}
            />
          </div>

          {/* WhatsApp Channel Toggle Card */}
          <div className="p-4 bg-[#121214] border border-[#1E1E21] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <MessageSquare size={16} className="text-[#8A8F98] shrink-0" />
              <div className="truncate">
                <div className="text-[13px] font-medium text-white">WhatsApp</div>
                <div className="text-[11px] text-[#8A8F98] truncate">{displayPhone}</div>
              </div>
            </div>
            <StealthToggle
              id="channel-whatsapp"
              label="WhatsApp notification channel"
              checked={preferences.channelWhatsapp}
              onChange={(val) => handleToggle('channelWhatsapp', val)}
            />
          </div>
        </div>
      </div>

      {/* ====================================================================
          CATEGORY 3: DATA PROTECTION & LEGAL
          ==================================================================== */}
      <div className="mt-12 pt-8 border-t border-[#1E1E21]">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="text-[#8A8F98] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-[15px] font-medium text-white tracking-tight">
              Data Protection & Legal Transparency
            </h3>
            <p className="text-[13px] text-[#8A8F98] mt-1.5 leading-relaxed">
              Your exhaust specifications, motorcycle configurations, and cargo delivery addresses are
              stored securely adhering to industrial encryption standards. We never sell your personal
              identities or contact information to third-party advertising brokers.
            </p>

            <div className="flex flex-wrap items-center gap-6 mt-4">
              <a
                href="/legal/terms"
                className="text-[13px] text-white underline underline-offset-4 hover:text-[#8A8F98] transition-colors inline-flex items-center gap-1 group"
              >
                <span>Terms & Conditions</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </a>

              <a
                href="/legal/privacy"
                className="text-[13px] text-white underline underline-offset-4 hover:text-[#8A8F98] transition-colors inline-flex items-center gap-1 group"
              >
                <span>Privacy Policy</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
