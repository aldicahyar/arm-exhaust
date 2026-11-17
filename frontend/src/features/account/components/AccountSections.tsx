'use client';

import React, { useState } from 'react';
import type {
  AccountSecurityInfo,
  AccountPersonalInfo,
  AccountLocationInfo,
  AccountAdvancedInfo,
} from '../types';

interface TooltipIconProps {
  readonly label: string;
}

function TooltipIcon({ label }: Readonly<TooltipIconProps>) {
  return (
    <span
      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-[#8A8F98] text-[#8A8F98] text-[10px] leading-none select-none"
      title={label}
      aria-label={label}
    >
      ?
    </span>
  );
}

/* ==========================================================================
   QUADRANT 1: Sign-in and security
   Streamlined to focus purely on active authentication credentials.
   Email is the read-only primary identity (no pseudo-change button).
   Password retains fully functional session-revoking Change action.
   ========================================================================== */
interface SecuritySectionProps {
  readonly data: AccountSecurityInfo;
  readonly onChangePassword?: () => void;
  readonly onResetPassword?: () => void;
}

export function AccountSecuritySection({
  data,
  onChangePassword,
  onResetPassword,
}: Readonly<SecuritySectionProps>) {
  return (
    <section
      aria-labelledby="heading-security"
      className="border-t border-[#1E1E21] pt-6 flex flex-col justify-between"
    >
      <div>
        <h2 id="heading-security" className="text-[16px] font-normal text-white tracking-tight mb-7">
          Sign-in and security
        </h2>

        <div className="flex flex-col gap-6">
          {/* Email (Primary SSO Identity) */}
          <div>
            <div className="flex items-center gap-1.5 text-[13px] text-[#8A8F98]">
              <span>Email</span>
              <TooltipIcon label="Primary sign-in email address (locked to single sign-on identity)" />
            </div>
            <div className="text-[15px] font-medium text-white mt-1">{data.email}</div>
          </div>

          {/* Password (Functional change flow) */}
          <div>
            <div className="text-[13px] text-[#8A8F98]">Password</div>
            <div className="text-[15px] font-medium text-white tracking-widest mt-1">••••••••</div>
            <button
              type="button"
              onClick={onChangePassword ?? onResetPassword}
              className="text-[13px] text-white underline underline-offset-4 mt-1.5 hover:text-[#8A8F98] transition-colors inline-block"
            >
              Change
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   QUADRANT 2: Personal information
   Consolidates multiple inline edit links into a single clean header-level Edit action.
   Includes Name, Phone, Delivery Address, and Date of birth (with Steam-style CS fallback).
   ========================================================================== */
interface PersonalInfoSectionProps {
  readonly data: AccountPersonalInfo;
  readonly onEdit?: () => void;
}

export function AccountPersonalInfoSection({
  data,
  onEdit,
}: Readonly<PersonalInfoSectionProps>) {
  const hasAddress = Boolean(data.address && data.address !== '-');
  const hasDob = Boolean(data.dateOfBirth && data.dateOfBirth !== '-');

  return (
    <section
      aria-labelledby="heading-personal"
      className="border-t border-[#1E1E21] pt-6 flex flex-col justify-between"
    >
      <div>
        {/* Header with single unified Edit action */}
        <div className="flex items-center justify-between mb-7">
          <h2 id="heading-personal" className="text-[16px] font-normal text-white tracking-tight">
            Personal information
          </h2>
          <button
            type="button"
            onClick={onEdit}
            className="text-[13px] text-white underline underline-offset-4 hover:text-[#8A8F98] transition-colors"
          >
            Edit
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {/* Name */}
          <div>
            <div className="text-[13px] text-[#8A8F98]">Name</div>
            <div className="text-[15px] font-medium text-white mt-1">{data.name}</div>
          </div>

          {/* Phone number */}
          <div>
            <div className="text-[13px] text-[#8A8F98]">Phone number</div>
            <div className="text-[15px] font-medium text-white mt-1">{data.phoneNumber}</div>
          </div>

          {/* Delivery Address */}
          <div>
            <div className="text-[13px] text-[#8A8F98]">Delivery address</div>
            <div className="text-[15px] font-medium text-white mt-1 leading-relaxed">
              {hasAddress ? data.address : '-'}
            </div>
          </div>

          {/* Date of birth (Protected for loyalty & promotion integrity) */}
          <div>
            <div className="flex items-center gap-1.5 text-[13px] text-[#8A8F98]">
              <span>Date of birth</span>
              <TooltipIcon label="Used for annual birthday rewards and member promotions. Locked against frequent changes to prevent reward abuse." />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[15px] font-medium text-white">
                {hasDob ? data.dateOfBirth : '-'}
              </span>
              {hasDob && (
                <span className="text-[11px] font-mono uppercase tracking-wider text-white bg-[#1E1E21] px-1.5 py-0.5 select-none">
                  Locked
                </span>
              )}
            </div>
            {hasDob && (
              <div className="mt-1">
                <a
                  href="https://wa.me/6281234567890?text=Halo%20ARM%20Support%2C%20saya%20ingin%20mengajukan%20koreksi%20tanggal%20lahir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-[#8A8F98] underline underline-offset-2 hover:text-white transition-colors"
                >
                  Need to correct a typo? Contact ARM Support →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   QUADRANT 3: Location / Regional preferences
   Displays country and global language without non-functional pseudo-toggle buttons.
   ========================================================================== */
interface LocationSectionProps {
  readonly data: AccountLocationInfo;
}

export function AccountLocationSection({
  data,
}: Readonly<LocationSectionProps>) {
  return (
    <section
      aria-labelledby="heading-location"
      className="border-t border-[#1E1E21] pt-6 flex flex-col justify-between"
    >
      <div>
        <h2 id="heading-location" className="text-[16px] font-normal text-white tracking-tight mb-7">
          Location
        </h2>

        <div className="flex flex-col gap-6">
          {/* Country */}
          <div>
            <div className="text-[13px] text-[#8A8F98]">Country</div>
            <div className="text-[15px] font-medium text-white mt-1">{data.country}</div>
          </div>

          {/* Language (Global English) */}
          <div>
            <div className="text-[13px] text-[#8A8F98]">Language</div>
            <div className="text-[15px] font-medium text-white mt-1">{data.language} (Global)</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   QUADRANT 4: Advanced / Account management
   Includes interactive 1-click 'Copy ID' for fast customer support reference.
   ========================================================================== */
interface AdvancedSectionProps {
  readonly data: AccountAdvancedInfo;
}

export function AccountAdvancedSection({
  data,
}: Readonly<AdvancedSectionProps>) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined' && navigator?.clipboard) {
      void navigator.clipboard.writeText(data.accountIdentifier).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <section
      aria-labelledby="heading-advanced"
      className="border-t border-[#1E1E21] pt-6 flex flex-col justify-between"
    >
      <div>
        <h2 id="heading-advanced" className="text-[16px] font-normal text-white tracking-tight mb-7">
          Advanced
        </h2>

        <div className="flex flex-col gap-6">
          {/* Account identifier */}
          <div>
            <div className="text-[13px] text-[#8A8F98]">Account identifier</div>
            <div className="text-[14px] font-mono text-white mt-1 break-all select-all">
              {data.accountIdentifier}
            </div>
            <button
              type="button"
              onClick={handleCopyId}
              className="text-[13px] text-white underline underline-offset-4 mt-1.5 hover:text-[#8A8F98] transition-colors inline-block"
            >
              {copied ? 'Copied to clipboard' : 'Copy ID'}
            </button>
          </div>

          {/* Terms & Conditions */}
          <div>
            <a
              href={data.termsUrl}
              className="text-[14px] text-white underline underline-offset-4 hover:text-[#8A8F98] transition-colors inline-block"
            >
              Terms & Conditions →
            </a>
          </div>

          {/* Membership Status Badge */}
          <div>
            <div className="text-[13px] text-[#8A8F98]">Membership status</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-white select-none" />
              <span className="text-[14px] font-medium text-white">Verified Customer</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
