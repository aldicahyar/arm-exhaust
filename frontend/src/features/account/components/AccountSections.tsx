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
   Includes Role-Based Membership Status badge & Regional Preferences.
   ========================================================================== */
export interface MembershipBadgeInfo {
  readonly label: string;
  readonly badgeClass: string;
  readonly dotClass: string;
  readonly description: string;
}

export function getMembershipBadge(role?: string): MembershipBadgeInfo {
  const normalized = (role || '').trim().toLowerCase();
  if (normalized === 'reseller') {
    return {
      label: 'Official Reseller',
      badgeClass: 'text-white border-[#3F3F46] bg-[#18181B]',
      dotClass: 'bg-white',
      description: 'Authorized B2B partner with wholesale pricing and cargo priorities.',
    };
  }
  if (normalized === 'admin' || normalized === 'superadmin') {
    return {
      label: 'ARM Management',
      badgeClass: 'text-white border-[#3F3F46] bg-[#18181B]',
      dotClass: 'bg-white',
      description: 'System administrator and operations personnel.',
    };
  }
  return {
    label: 'ARM Member',
    badgeClass: 'text-white border-[#27272A] bg-[#141416]',
    dotClass: 'bg-[#8A8F98]',
    description: 'Verified retail customer entitled to official exhaust warranties and birthday rewards.',
  };
}

interface SecuritySectionProps {
  readonly data: AccountSecurityInfo;
  readonly location?: AccountLocationInfo;
  readonly onChangePassword?: () => void;
  readonly onResetPassword?: () => void;
}

export function AccountSecuritySection({
  data,
  location,
  onChangePassword,
  onResetPassword,
}: Readonly<SecuritySectionProps>) {
  const membership = getMembershipBadge(data.role);

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

          {/* Membership Status (Role-based Model 3: ARM Member / Official Reseller) */}
          <div>
            <div className="flex items-center gap-1.5 text-[13px] text-[#8A8F98]">
              <span>Membership status</span>
              <TooltipIcon label={membership.description} />
            </div>
            <div className="mt-1.5">
              <span className={`inline-flex items-center gap-2 px-2.5 py-1 text-[13px] font-medium border ${membership.badgeClass} rounded-none select-none`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${membership.dotClass}`} />
                <span>{membership.label}</span>
              </span>
            </div>
          </div>

          {/* Regional Preferences */}
          <div>
            <div className="text-[13px] text-[#8A8F98]">Regional preferences</div>
            <div className="text-[15px] font-medium text-white mt-1">
              {location ? `${location.country} • ${location.language} (Global)` : 'Indonesia • English (Global)'}
            </div>
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

          {/* Phone */}
          <div>
            <div className="text-[13px] text-[#8A8F98]">Phone</div>
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
            <div className="text-[15px] font-medium text-white mt-1">
              {hasDob ? data.dateOfBirth : '-'}
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


