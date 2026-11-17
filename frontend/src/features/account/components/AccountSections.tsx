import React from 'react';
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

interface SecuritySectionProps {
  readonly data: AccountSecurityInfo;
  readonly onChangeEmail?: () => void;
  readonly onResetPassword?: () => void;
  readonly onChangeRecoveryPhone?: () => void;
}

export function AccountSecuritySection({
  data,
  onChangeEmail,
  onResetPassword,
  onChangeRecoveryPhone,
}: Readonly<SecuritySectionProps>) {
  return (
    <section aria-labelledby="heading-security" className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 md:gap-10 pb-16">
      <h2 id="heading-security" className="text-[15px] font-normal text-white tracking-tight">
        Sign-in and security
      </h2>

      <div className="flex flex-col gap-8">
        {/* Email */}
        <div>
          <div className="flex items-center gap-1.5 text-[13px] text-[#8A8F98]">
            <span>Email</span>
            <TooltipIcon label="Primary sign-in email address" />
          </div>
          <div className="text-[15px] font-medium text-white mt-1">{data.email}</div>
          <button
            type="button"
            onClick={onChangeEmail}
            className="text-[13px] text-white underline underline-offset-4 mt-1.5 hover:text-[#8A8F98] transition-colors inline-block"
          >
            Change
          </button>
        </div>

        {/* Password */}
        <div>
          <div className="text-[13px] text-[#8A8F98]">Password</div>
          <div className="text-[15px] font-medium text-white tracking-widest mt-1">••••••••</div>
          <button
            type="button"
            onClick={onResetPassword}
            className="text-[13px] text-white underline underline-offset-4 mt-1.5 hover:text-[#8A8F98] transition-colors inline-block"
          >
            Reset
          </button>
        </div>

        {/* Two-factor authentication */}
        <div>
          <div className="flex items-center gap-1.5 text-[13px] text-[#8A8F98]">
            <span>Two-factor authentication</span>
            <TooltipIcon label="Two-factor verification channel" />
          </div>
          <div className="text-[15px] font-medium text-white mt-1">{data.twoFactorAuth}</div>
        </div>

        {/* Recovery phone number */}
        <div>
          <div className="flex items-center gap-1.5 text-[13px] text-[#8A8F98]">
            <span>Recovery phone number</span>
            <TooltipIcon label="Phone number used for account recovery and OTP" />
          </div>
          <div className="text-[15px] font-medium text-white mt-1">{data.recoveryPhoneNumber}</div>
          <button
            type="button"
            onClick={onChangeRecoveryPhone}
            className="text-[13px] text-white underline underline-offset-4 mt-1.5 hover:text-[#8A8F98] transition-colors inline-block"
          >
            Change
          </button>
        </div>
      </div>
    </section>
  );
}

interface PersonalInfoSectionProps {
  readonly data: AccountPersonalInfo;
  readonly onEditName?: () => void;
  readonly onEditPhone?: () => void;
  readonly onEditAddress?: () => void;
  readonly onAddDateOfBirth?: () => void;
}

export function AccountPersonalInfoSection({
  data,
  onEditName,
  onEditPhone,
  onEditAddress,
  onAddDateOfBirth,
}: Readonly<PersonalInfoSectionProps>) {
  const hasAddress = Boolean(data.address && data.address !== '-');
  const hasDob = Boolean(data.dateOfBirth && data.dateOfBirth !== '-');

  return (
    <section aria-labelledby="heading-personal" className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 md:gap-10 pb-16">
      <h2 id="heading-personal" className="text-[15px] font-normal text-white tracking-tight">
        Personal information
      </h2>

      <div className="flex flex-col gap-8">
        {/* Name */}
        <div>
          <div className="text-[13px] text-[#8A8F98]">Name</div>
          <div className="text-[15px] font-medium text-white mt-1">{data.name}</div>
          <button
            type="button"
            onClick={onEditName}
            className="text-[13px] text-white underline underline-offset-4 mt-1.5 hover:text-[#8A8F98] transition-colors inline-block"
          >
            Edit
          </button>
        </div>

        {/* Phone number */}
        <div>
          <div className="text-[13px] text-[#8A8F98]">Phone number</div>
          <div className="text-[15px] font-medium text-white mt-1">{data.phoneNumber}</div>
          <button
            type="button"
            onClick={onEditPhone}
            className="text-[13px] text-white underline underline-offset-4 mt-1.5 hover:text-[#8A8F98] transition-colors inline-block"
          >
            Edit
          </button>
        </div>

        {/* Address */}
        <div>
          <div className="text-[13px] text-[#8A8F98]">Address</div>
          <div className="text-[15px] font-medium text-white mt-1">
            {hasAddress ? data.address : '-'}
          </div>
          <button
            type="button"
            onClick={onEditAddress}
            className="text-[13px] text-white underline underline-offset-4 mt-1.5 hover:text-[#8A8F98] transition-colors inline-block"
          >
            {hasAddress ? 'Edit' : 'Add'}
          </button>
        </div>

        {/* Date of birth */}
        <div>
          <div className="text-[13px] text-[#8A8F98]">Date of birth</div>
          <div className="text-[15px] font-medium text-white mt-1">
            {hasDob ? data.dateOfBirth : '-'}
          </div>
          <button
            type="button"
            onClick={onAddDateOfBirth}
            className="text-[13px] text-white underline underline-offset-4 mt-1.5 hover:text-[#8A8F98] transition-colors inline-block"
          >
            {hasDob ? 'Edit' : 'Add'}
          </button>
        </div>
      </div>
    </section>
  );
}

interface LocationSectionProps {
  readonly data: AccountLocationInfo;
  readonly onEditLanguage?: () => void;
}

export function AccountLocationSection({
  data,
  onEditLanguage,
}: Readonly<LocationSectionProps>) {
  return (
    <section aria-labelledby="heading-location" className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 md:gap-10 pb-16">
      <h2 id="heading-location" className="text-[15px] font-normal text-white tracking-tight">
        Location
      </h2>

      <div className="flex flex-col gap-8">
        {/* Country */}
        <div>
          <div className="text-[13px] text-[#8A8F98]">Country</div>
          <div className="text-[15px] font-medium text-white mt-1">{data.country}</div>
        </div>

        {/* Language */}
        <div>
          <div className="text-[13px] text-[#8A8F98]">Language</div>
          <div className="text-[15px] font-medium text-white mt-1">{data.language}</div>
          <button
            type="button"
            onClick={onEditLanguage}
            className="text-[13px] text-white underline underline-offset-4 mt-1.5 hover:text-[#8A8F98] transition-colors inline-block"
          >
            Edit
          </button>
        </div>
      </div>
    </section>
  );
}

interface AdvancedSectionProps {
  readonly data: AccountAdvancedInfo;
  readonly onDeleteAccount?: () => void;
}

export function AccountAdvancedSection({
  data,
  onDeleteAccount,
}: Readonly<AdvancedSectionProps>) {
  return (
    <section aria-labelledby="heading-advanced" className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 md:gap-10">
      <h2 id="heading-advanced" className="text-[15px] font-normal text-white tracking-tight">
        Advanced
      </h2>

      <div className="flex flex-col gap-8">
        {/* Account identifier */}
        <div>
          <div className="text-[13px] text-[#8A8F98]">Account identifier</div>
          <div className="text-[14px] font-mono text-white mt-1 break-all">
            {data.accountIdentifier}
          </div>
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

        {/* Delete account */}
        <div>
          <button
            type="button"
            onClick={onDeleteAccount}
            className="text-[14px] text-[#8A8F98] underline underline-offset-4 hover:text-white transition-colors"
          >
            Delete account
          </button>
        </div>
      </div>
    </section>
  );
}
