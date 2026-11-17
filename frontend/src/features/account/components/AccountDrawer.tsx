'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import type {
  AccountDrawerMode,
  CustomerAccountData,
  ChangePasswordPayload,
  UpdateProfilePayload,
} from '../types';
import { changeAccountPassword, updateAccountProfile } from '../services/account.api';

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
  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Edit profile form state
  const [profileName, setProfileName] = useState(accountData.personal.name);
  const [profilePhone, setProfilePhone] = useState(accountData.personal.phoneNumber);
  const [profileAddress, setProfileAddress] = useState(accountData.personal.address);

  // UI status state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form state whenever drawer mode or open state changes
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setProfileName(accountData.personal.name);
      setProfilePhone(accountData.personal.phoneNumber);
      setProfileAddress(accountData.personal.address);
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, mode, accountData]);

  // Handle ESC key and prevent body scroll while drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose]);

  if (!isOpen || mode === 'none') {
    return null;
  }

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

    onSuccess(undefined, 'Password updated successfully.');
    onClose();
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    setIsSubmitting(true);
    const payload: UpdateProfilePayload = {
      name: profileName,
      phoneNumber: profilePhone,
      address: profileAddress,
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
        },
      },
      'Personal information updated successfully.'
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Panel (440px Pure Stealth) */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-[440px] bg-[#0E0E10] border-l border-[#1E1E21] flex flex-col justify-between p-6 md:p-8 text-white shadow-2xl">
          
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-[#1E1E21]">
              <h2 id="drawer-title" className="text-xl font-normal tracking-tight text-white">
                {mode === 'change-password' && 'Change password'}
                {mode === 'edit-profile' && 'Edit personal information'}
                {mode === 'change-email' && 'Change email'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-[#8A8F98] hover:text-white transition-colors p-1"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Feedback Notice */}
            {errorMessage && (
              <div
                role="alert"
                className="mt-4 p-3 bg-[#1A1212] border border-[#7F1D1D] text-[#EF4444] text-[13px] rounded-none"
              >
                {errorMessage}
              </div>
            )}

            {/* Change Password Body */}
            {mode === 'change-password' && (
              <form onSubmit={handlePasswordSubmit} className="mt-6 flex flex-col gap-5">
                <p className="text-[13px] text-[#8A8F98] leading-relaxed">
                  Enter your current password and choose a secure new password.
                </p>

                {/* Current Password Field */}
                <div>
                  <label
                    htmlFor="current-password-input"
                    className="block text-[13px] text-[#8A8F98] mb-1.5"
                  >
                    Current password
                  </label>
                  <div className="relative">
                    <input
                      id="current-password-input"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#141416] border border-[#1E1E21] text-white px-3.5 py-2.5 pr-10 text-[14px] focus:outline-none focus:border-white transition-colors rounded-none placeholder:text-[#52525A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F98] hover:text-white transition-colors"
                      aria-label={showCurrent ? 'Hide password' : 'Show password'}
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div>
                  <label
                    htmlFor="new-password-input"
                    className="block text-[13px] text-[#8A8F98] mb-1.5"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password-input"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      className="w-full bg-[#141416] border border-[#1E1E21] text-white px-3.5 py-2.5 pr-10 text-[14px] focus:outline-none focus:border-white transition-colors rounded-none placeholder:text-[#52525A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F98] hover:text-white transition-colors"
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="block text-[12px] text-[#8A8F98] mt-1.5">
                    Must be at least 8 characters with letters and numbers.
                  </span>
                </div>

                {/* Confirm New Password Field */}
                <div>
                  <label
                    htmlFor="confirm-password-input"
                    className="block text-[13px] text-[#8A8F98] mb-1.5"
                  >
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password-input"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      className="w-full bg-[#141416] border border-[#1E1E21] text-white px-3.5 py-2.5 pr-10 text-[14px] focus:outline-none focus:border-white transition-colors rounded-none placeholder:text-[#52525A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F98] hover:text-white transition-colors"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-4 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-white text-black font-medium text-[14px] hover:bg-[#E2E2E2] active:bg-[#C8C8C8] transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed text-center"
                  >
                    {isSubmitting ? 'Updating password...' : 'Update password'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-transparent border border-[#1E1E21] text-[#8A8F98] hover:text-white hover:border-[#3E3E44] font-medium text-[14px] transition-colors rounded-none text-center"
                  >
                    Cancel
                  </button>
                </div>

                {/* Escape Hatch Link to /forgot-password */}
                <div className="pt-2 text-center text-[13px] text-[#8A8F98]">
                  Forgot your current password?{' '}
                  <a
                    href="/forgot-password"
                    className="text-white underline underline-offset-4 hover:text-[#8A8F98] transition-colors"
                  >
                    Recover account
                  </a>
                </div>
              </form>
            )}

            {/* Edit Profile Body */}
            {mode === 'edit-profile' && (
              <form onSubmit={handleProfileSubmit} className="mt-6 flex flex-col gap-5">
                <p className="text-[13px] text-[#8A8F98] leading-relaxed">
                  Update your contact details and default cargo delivery address.
                </p>

                {/* Name */}
                <div>
                  <label
                    htmlFor="profile-name-input"
                    className="block text-[13px] text-[#8A8F98] mb-1.5"
                  >
                    Full name
                  </label>
                  <input
                    id="profile-name-input"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="w-full bg-[#141416] border border-[#1E1E21] text-white px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-white transition-colors rounded-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="profile-phone-input"
                    className="block text-[13px] text-[#8A8F98] mb-1.5"
                  >
                    Phone / WhatsApp number
                  </label>
                  <input
                    id="profile-phone-input"
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full bg-[#141416] border border-[#1E1E21] text-white px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-white transition-colors rounded-none"
                  />
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
                    rows={4}
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="w-full bg-[#141416] border border-[#1E1E21] text-white px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-white transition-colors rounded-none resize-none"
                  />
                </div>

                {/* Submit Actions */}
                <div className="pt-4 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-white text-black font-medium text-[14px] hover:bg-[#E2E2E2] active:bg-[#C8C8C8] transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed text-center"
                  >
                    {isSubmitting ? 'Saving changes...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-transparent border border-[#1E1E21] text-[#8A8F98] hover:text-white hover:border-[#3E3E44] font-medium text-[14px] transition-colors rounded-none text-center"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Change Email Body */}
            {mode === 'change-email' && (
              <div className="mt-6 flex flex-col gap-5">
                <p className="text-[13px] text-[#8A8F98] leading-relaxed">
                  Your primary sign-in email is currently locked to your single sign-on identity:
                </p>
                <div className="p-4 bg-[#141416] border border-[#1E1E21] text-white text-[15px] font-medium">
                  {accountData.security.email}
                </div>
                <p className="text-[12px] text-[#8A8F98]">
                  To request an email address update for enterprise or reseller accounts, please contact ARM support directly.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-white text-black font-medium text-[14px] hover:bg-[#E2E2E2] transition-colors rounded-none text-center mt-2"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Drawer Footer Branding Hairline */}
          <div className="pt-6 border-t border-[#1E1E21] text-[11px] text-[#52525A] flex justify-between items-center select-none">
            <span>ARM ACCOUNT SECURITY</span>
            <span>END-TO-END ENCRYPTED</span>
          </div>

        </div>
      </div>
    </div>
  );
}
