'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LabelInput } from '../../auth/LabelInput';
import { PasswordStrength } from '../../auth/PasswordStrength';
import { DateWheelPicker } from './DateWheelPicker';
import { DateWheelPickerModal } from './DateWheelPickerModal';
import { PhoneInput } from './PhoneInput';
import type {
  AccountDrawerMode,
  CustomerAccountData,
  ChangePasswordPayload,
  UpdateProfilePayload,
} from '../types';
import { changeAccountPassword, updateAccountProfile } from '../services/account.api';

function formatDateToString(d: Date): string {
  const day = d.getDate();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = months[d.getMonth()] ?? 'January';
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function parseDateString(str?: string): Date | undefined {
  if (!str || str === '-') return undefined;
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;
  return undefined;
}

interface AccountDrawerProps {
  readonly isOpen: boolean;
  readonly mode: AccountDrawerMode;
  readonly accountData: CustomerAccountData;
  readonly onClose: () => void;
  readonly onSuccess: (updatedData?: Partial<CustomerAccountData>, noticeMsg?: string) => void;
}

export function AccountDrawer({
  isOpen,
  mode,
  accountData,
  onClose,
  onSuccess,
}: Readonly<AccountDrawerProps>) {
  const router = useRouter();

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);

  // Edit profile form state
  const isDobLocked = Boolean(
    accountData.personal.dateOfBirth &&
    accountData.personal.dateOfBirth !== '-'
  );
  const [profileName, setProfileName] = useState(accountData.personal.name);
  const [profilePhone, setProfilePhone] = useState(accountData.personal.phoneNumber);
  const [profileAddress, setProfileAddress] = useState(accountData.personal.address);
  const [profileDob, setProfileDob] = useState(accountData.personal.dateOfBirth ?? '');
  const [selectedDobDate, setSelectedDobDate] = useState<Date>(
    () => parseDateString(accountData.personal.dateOfBirth) ?? new Date(1998, 9, 14)
  );
  const [isDobPickerOpen, setIsDobPickerOpen] = useState(false);

  // UI status state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset form state whenever drawer mode or open state changes
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsNewPasswordFocused(false);
      setProfileName(accountData.personal.name);
      setProfilePhone(accountData.personal.phoneNumber);
      setProfileAddress(accountData.personal.address);
      setErrorMessage(null);
      setIsSubmitting(false);
      setIsSuccess(false);
      setIsDobPickerOpen(false);

      const initialDate = parseDateString(accountData.personal.dateOfBirth) ?? new Date(1998, 9, 14);
      setSelectedDobDate(initialDate);
      if (isDobLocked) {
        setProfileDob(accountData.personal.dateOfBirth);
      } else {
        const hasExisting = Boolean(
          accountData.personal.dateOfBirth &&
          accountData.personal.dateOfBirth !== '-'
        );
        setProfileDob(hasExisting ? accountData.personal.dateOfBirth : '');
      }
    }
  }, [isOpen, mode, accountData, isDobLocked]);

  // Handle ESC key and prevent body scroll while drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSuccess) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isSuccess, onClose]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Current password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);
    const payload: ChangePasswordPayload = {
      currentPassword,
      newPassword,
      confirmPassword,
    };

    const res = await changeAccountPassword(payload);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.message ?? 'Failed to change password.');
      return;
    }

    // Success state: all devices revoked, redirect to login
    setIsSuccess(true);
    onSuccess(undefined, 'Password updated. All active sessions have been signed out for security.');

    // Auto-redirect to sign-in after 2.5 seconds
    setTimeout(() => {
      router.push('/login?status=password_changed');
    }, 2500);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    setIsSubmitting(true);
    const payload: UpdateProfilePayload = {
      name: profileName,
      phoneNumber: profilePhone,
      address: profileAddress,
      dateOfBirth: profileDob,
    };

    const res = await updateAccountProfile(payload);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.message ?? 'Failed to update profile.');
      return;
    }

    onSuccess(
      {
        personal: {
          ...accountData.personal,
          name: profileName,
          phoneNumber: profilePhone,
          address: profileAddress,
          dateOfBirth: profileDob || accountData.personal.dateOfBirth,
        },
      },
      'Personal information updated successfully.'
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && mode !== 'none' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* Backdrop with smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={isSuccess ? undefined : onClose}
            aria-hidden="true"
          />

          {/* Slide-over Panel (440px Pure Stealth with Pinned Header & Pinned Action Footer) */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto w-screen max-w-[440px] h-full max-h-screen bg-[#0E0E10] border-l border-[#1E1E21] flex flex-col text-white shadow-2xl overflow-hidden"
            >
              
              {/* Header (Permanently pinned at top) */}
              <div className="flex items-center justify-between p-6 md:p-8 pb-5 border-b border-[#1E1E21] shrink-0">
                <h2 id="drawer-title" className="text-xl font-normal tracking-tight text-white">
                  {mode === 'change-password' && 'Change password'}
                  {mode === 'edit-profile' && 'Edit personal information'}
                  {mode === 'change-email' && 'Change email'}
                </h2>
                {!isSuccess && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-[#8A8F98] hover:text-white transition-colors p-1"
                    aria-label="Close drawer"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Error Feedback Notice */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    role="alert"
                    className="mx-6 md:mx-8 mt-4 p-3 bg-[#1A1212] border border-[#7F1D1D] text-[#EF4444] text-[13px] rounded-none overflow-hidden shrink-0"
                  >
                    {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ==================================================================
                  MODE: CHANGE PASSWORD
                  ================================================================== */}
              {mode === 'change-password' && (
                <div className="flex flex-col flex-1 min-h-0">
                  {isSuccess ? (
                    /* Security Revocation Success Screen */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-8"
                    >
                      <div className="flex h-12 w-12 items-center justify-center bg-white text-black mb-4 select-none">
                        <Check size={26} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-[17px] font-normal text-white mb-2 tracking-tight">
                        Password Successfully Updated
                      </h3>
                      <p className="text-[13px] text-[#8A8F98] max-w-[320px] mb-6 leading-relaxed">
                        For your security, all active sessions across all devices have been signed out. Redirecting to sign in...
                      </p>
                      <a
                        href="/login?status=password_changed"
                        className="w-full py-3.5 px-4 bg-white text-black font-medium text-[14px] hover:bg-[#E2E2E2] active:bg-[#C8C8C8] transition-colors rounded-none block text-center"
                      >
                        Sign In Now
                      </a>
                    </motion.div>
                  ) : (
                    /* Hybrid Bencho Form with Pinned Footer */
                    <form onSubmit={handlePasswordSubmit} className="flex flex-col flex-1 min-h-0 justify-between">
                      {/* Scrollable Form Body */}
                      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-5 flex flex-col gap-3.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <p className="text-[13px] text-[#8A8F98] leading-relaxed mb-1">
                          Enter your current password and choose a secure new password.
                        </p>

                        {/* Current Password Field with Bencho LabelInput */}
                        <div>
                          <LabelInput
                            label="Current password"
                            type="password"
                            name="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            corner={0}
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* New Password Field with Bencho LabelInput & PasswordStrength */}
                        <div>
                          <LabelInput
                            label="New password"
                            type="password"
                            name="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onFocus={() => setIsNewPasswordFocused(true)}
                            onBlur={() => setIsNewPasswordFocused(false)}
                            required
                            minLength={8}
                            corner={0}
                            disabled={isSubmitting}
                          />
                          <div className="mt-2">
                            <PasswordStrength password={newPassword} isFocused={isNewPasswordFocused} />
                          </div>
                        </div>

                        {/* Confirm New Password Field with Bencho LabelInput */}
                        <div>
                          <LabelInput
                            label="Confirm new password"
                            type="password"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            corner={0}
                            disabled={isSubmitting}
                            error={Boolean(confirmPassword && confirmPassword !== newPassword)}
                          />
                        </div>

                        {/* Bottom Clearance Spacer */}
                        <div className="h-8 shrink-0" aria-hidden="true" />
                      </div>

                      {/* Pinned Action Footer (Always 100% visible, never cut off) */}
                      <div className="px-6 md:px-8 py-4 border-t border-[#1E1E21] bg-[#0E0E10] shrink-0">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3 px-4 bg-white text-black font-medium text-[14px] hover:bg-[#E2E2E2] active:bg-[#C8C8C8] transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed text-center"
                        >
                          {isSubmitting ? 'Updating password...' : 'Update password'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ==================================================================
                  MODE: EDIT PROFILE
                  ================================================================== */}
              {mode === 'edit-profile' && (
                <form onSubmit={handleProfileSubmit} className="flex flex-col flex-1 min-h-0 justify-between">
                  {/* Scrollable Form Body */}
                  <div className="flex-1 overflow-y-auto px-6 md:px-8 py-5 flex flex-col gap-3.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <p className="text-[13px] text-[#8A8F98] leading-relaxed mb-0.5">
                      Update your contact details and default cargo delivery address.
                    </p>

                    {/* Name */}
                    <div>
                      <LabelInput
                        label="Full name"
                        type="text"
                        name="name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        required
                        corner={0}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Phone with Country Dial Selector */}
                    <div>
                      <PhoneInput
                        value={profilePhone}
                        onChange={setProfilePhone}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Date of birth (Disabled if filled, clickable wheel picker if empty) */}
                    <div>
                      {isDobLocked ? (
                        <div>
                          <LabelInput
                            label="Date of birth"
                            value={accountData.personal.dateOfBirth}
                            disabled
                            corner={0}
                          />
                          <p className="text-[11px] text-[#8A8F98] mt-1.5 leading-relaxed">
                            Date of birth is permanently locked for promotional integrity.{' '}
                            <a
                              href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                                `Halo ARM Support, saya ingin mengajukan permohonan koreksi tanggal lahir untuk Akun ID: ${accountData.advanced.accountIdentifier}. Terima kasih.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white underline underline-offset-2 hover:text-[#8A8F98] transition-colors inline-block"
                            >
                              Contact ARM Support to correct a typo →
                            </a>
                          </p>
                        </div>
                      ) : (
                        <div>
                          <LabelInput
                            label="Date of birth"
                            value={profileDob}
                            readOnly
                            corner={0}
                            disabled={isSubmitting}
                            focused={isDobPickerOpen}
                            onClick={() => setIsDobPickerOpen(true)}
                            rightElement={
                              <ChevronDown
                                size={16}
                                className={`text-[#8A8F98] transition-transform duration-200 ${
                                  isDobPickerOpen ? 'rotate-180 text-white' : ''
                                }`}
                              />
                            }
                          />

                          {/* Dedicated Modal Overlay for Date Picker (No inline layout shift) */}
                          <DateWheelPickerModal
                            isOpen={isDobPickerOpen}
                            initialDate={selectedDobDate}
                            onClose={() => setIsDobPickerOpen(false)}
                            onConfirm={(newDate) => {
                              setSelectedDobDate(newDate);
                              setProfileDob(formatDateToString(newDate));
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div>
                      <label
                        htmlFor="profile-address-input"
                        className="block text-[13px] text-[#8A8F98] mb-1.5"
                      >
                        Delivery address
                      </label>
                      <textarea
                        id="profile-address-input"
                        rows={2}
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        className="w-full bg-[#141416] border border-[#1E1E21] text-white px-3.5 py-2 text-[14px] focus:outline-none focus:border-white transition-colors rounded-none resize-none scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-h-[64px]"
                      />
                    </div>

                    {/* Generous Bottom Clearance Spacer so textarea is NEVER touched/overlapped by footer */}
                    <div className="h-10 shrink-0" aria-hidden="true" />
                  </div>

                  {/* Pinned Action Footer (Clean padding with zero overlap) */}
                  <div className="px-6 md:px-8 py-4 border-t border-[#1E1E21] bg-[#0E0E10] shrink-0">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 bg-white text-black font-medium text-[14px] hover:bg-[#E2E2E2] active:bg-[#C8C8C8] transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed text-center"
                    >
                      {isSubmitting ? 'Saving changes...' : 'Save changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* ==================================================================
                  MODE: CHANGE EMAIL
                  ================================================================== */}
              {mode === 'change-email' && (
                <div className="flex flex-col flex-1 min-h-0 justify-between">
                  <div className="flex-1 overflow-y-auto px-6 md:px-8 py-5 flex flex-col gap-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <p className="text-[13px] text-[#8A8F98] leading-relaxed">
                      Your primary sign-in email is currently locked to your single sign-on identity:
                    </p>
                    <div className="p-4 bg-[#141416] border border-[#1E1E21] text-white text-[15px] font-medium">
                      {accountData.security.email}
                    </div>
                    <p className="text-[12px] text-[#8A8F98]">
                      To request an email address update for enterprise or reseller accounts, please contact ARM support directly.
                    </p>
                    <div className="h-8 shrink-0" aria-hidden="true" />
                  </div>
                  <div className="px-6 md:px-8 py-4 border-t border-[#1E1E21] bg-[#0E0E10] shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-3 px-4 bg-white text-black font-medium text-[14px] hover:bg-[#E2E2E2] transition-colors rounded-none text-center"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
