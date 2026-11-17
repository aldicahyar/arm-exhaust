'use client';

import React, { useState } from 'react';
import type {
  AccountNavKey,
  AccountTabKey,
  CustomerAccountData,
} from '../types';
import { DEFAULT_CUSTOMER_ACCOUNT } from '../types';
import { AccountNavRail } from './AccountNavRail';
import {
  AccountSecuritySection,
  AccountPersonalInfoSection,
  AccountLocationSection,
  AccountAdvancedSection,
} from './AccountSections';

interface AccountPortalProps {
  readonly initialData?: CustomerAccountData;
  readonly onSignOut?: () => void;
}

export function AccountPortal({
  initialData = DEFAULT_CUSTOMER_ACCOUNT,
  onSignOut,
}: Readonly<AccountPortalProps>) {
  const [activeNav, setActiveNav] = useState<AccountNavKey>('dashboard');
  const [activeTab, setActiveTab] = useState<AccountTabKey>('arm-id');
  const [accountData, setAccountData] = useState<CustomerAccountData>(initialData);

  const handleEditName = () => {
    const newName = window.prompt('Ubah Nama Pengguna:', accountData.personal.name);
    if (newName && newName.trim()) {
      setAccountData((prev) => ({
        ...prev,
        personal: { ...prev.personal, name: newName.trim() },
      }));
    }
  };

  const handleEditPhone = () => {
    const newPhone = window.prompt('Ubah Nomor Telepon:', accountData.personal.phoneNumber);
    if (newPhone && newPhone.trim()) {
      setAccountData((prev) => ({
        ...prev,
        personal: { ...prev.personal, phoneNumber: newPhone.trim() },
      }));
    }
  };

  const handleEditAddress = () => {
    const newAddress = window.prompt('Ubah Alamat Pengiriman:', accountData.personal.address);
    if (newAddress && newAddress.trim()) {
      setAccountData((prev) => ({
        ...prev,
        personal: { ...prev.personal, address: newAddress.trim() },
      }));
    }
  };

  const handleEditLanguage = () => {
    const nextLang = accountData.location.language === 'English' ? 'Bahasa Indonesia' : 'English';
    setAccountData((prev) => ({
      ...prev,
      location: { ...prev.location, language: nextLang },
    }));
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus akun ini secara permanen?')) {
      alert('Permintaan penghapusan akun telah dicatat.');
    }
  };

  return (
    <div className="w-full bg-[#0A0A0B] text-white min-h-screen font-sans antialiased">
      <div className="max-w-[1160px] mx-auto px-4 md:px-8 py-12 md:py-20">
        
        {/* POLESTAR 2-COLUMN GRID (Left Nav Rail + Right Main Content) */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10 md:gap-20">
          
          {/* Left Vertical Navigation Rail */}
          <AccountNavRail
            activeKey={activeNav}
            onSelect={setActiveNav}
            onSignOut={onSignOut}
          />

          {/* Right Main Content Area */}
          <main className="w-full">
            {activeNav === 'account' && (
              <div>
                <h1 className="text-3xl md:text-4xl font-normal text-white tracking-tight mb-7">
                  Account
                </h1>

                {/* TABS (ARM ID / Privacy / Third-party) */}
                <div className="flex gap-8 border-b border-[#1E1E21] mb-12 text-[14px]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('arm-id')}
                    className={`pb-2.5 transition-colors ${
                      activeTab === 'arm-id'
                        ? 'text-white font-medium border-b-2 border-white'
                        : 'text-[#8A8F98] font-normal hover:text-white'
                    }`}
                  >
                    ARM ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('privacy')}
                    className={`pb-2.5 transition-colors ${
                      activeTab === 'privacy'
                        ? 'text-white font-medium border-b-2 border-white'
                        : 'text-[#8A8F98] font-normal hover:text-white'
                    }`}
                  >
                    Privacy
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('third-party')}
                    className={`pb-2.5 transition-colors ${
                      activeTab === 'third-party'
                        ? 'text-white font-medium border-b-2 border-white'
                        : 'text-[#8A8F98] font-normal hover:text-white'
                    }`}
                  >
                    Third-party applications
                  </button>
                </div>

                {activeTab === 'arm-id' && (
                  <div>
                    {/* SECTION 1: SIGN-IN AND SECURITY */}
                    <AccountSecuritySection
                      data={accountData.security}
                      onChangeEmail={() => alert('Fitur ubah email memerlukan verifikasi tautan.')}
                      onResetPassword={() => alert('Instruksi reset password dikirimkan ke email terdaftar.')}
                      onChangeRecoveryPhone={handleEditPhone}
                    />

                    {/* SECTION 2: PERSONAL INFORMATION */}
                    <AccountPersonalInfoSection
                      data={accountData.personal}
                      onEditName={handleEditName}
                      onEditPhone={handleEditPhone}
                      onEditAddress={handleEditAddress}
                      onAddDateOfBirth={() => {
                        const dob = window.prompt('Masukkan Tanggal Lahir (DD/MM/YYYY):');
                        if (dob) {
                          setAccountData((prev) => ({
                            ...prev,
                            personal: { ...prev.personal, dateOfBirth: dob.trim() },
                          }));
                        }
                      }}
                    />

                    {/* SECTION 3: LOCATION */}
                    <AccountLocationSection
                      data={accountData.location}
                      onEditLanguage={handleEditLanguage}
                    />

                    {/* SECTION 4: ADVANCED */}
                    <AccountAdvancedSection
                      data={accountData.advanced}
                      onDeleteAccount={handleDeleteAccount}
                    />
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div className="py-8 text-[14px] text-[#8A8F98] leading-relaxed max-w-xl">
                    <p className="mb-4 text-white">Privasi Data Pelanggan ARM Exhaust</p>
                    <p>
                      Data akun Anda disimpan secara terenkripsi sesuai standar keamanan bengkel dan transaksi resmi.
                      Kami tidak pernah membagikan riwayat modifikasi atau alamat bengkel pribadi Anda kepada pihak ketiga.
                    </p>
                  </div>
                )}

                {activeTab === 'third-party' && (
                  <div className="py-8 text-[14px] text-[#8A8F98] leading-relaxed max-w-xl">
                    <p className="mb-4 text-white">Aplikasi Pihak Ketiga Terhubung</p>
                    <p>
                      Tidak ada aplikasi pihak ketiga yang saat ini memiliki akses ke akun ARM Exhaust Anda.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeNav === 'dashboard' && (
              <div>
                <h1 className="text-3xl md:text-4xl font-normal text-white tracking-tight mb-2">
                  Hi, {accountData.personal.name}
                </h1>
                <div className="text-[14px] text-[#8A8F98] mb-8">
                  Your motorbikes (1)
                </div>

                <div className="border-t border-[#1E1E21] py-8 border-b border-[#1E1E21] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-[20px] font-normal text-white mb-1">
                      Kawasaki Ninja ZX-25R
                    </div>
                    <div className="text-[13px] text-[#8A8F98]">
                      2023 • 4-Cylinder Inline • Megaphone Titanium GP Full System
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav('orders')}
                    className="text-[14px] text-white underline underline-offset-4 hover:text-[#8A8F98] transition-colors text-left"
                  >
                    View motorcycle details →
                  </button>
                </div>
              </div>
            )}

            {activeNav === 'orders' && (
              <div>
                <h1 className="text-3xl md:text-4xl font-normal text-white tracking-tight mb-8">
                  Orders
                </h1>

                <div className="border-t border-[#1E1E21]">
                  <div className="py-7 border-b border-[#1E1E21] flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <div className="text-[13px] text-[#8A8F98] mb-1">Order #ARM-2026-0882</div>
                      <div className="text-[18px] font-normal text-white">
                        Megaphone Titanium GP Full System
                      </div>
                      <div className="text-[13px] text-[#8A8F98] mt-1">
                        Estimated delivery: 20 November 2026 • In fabrication
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert('Rincian nomor resi J&T Cargo: 9821-4402-9912')}
                      className="text-[14px] text-white underline underline-offset-4 hover:text-[#8A8F98] transition-colors text-left"
                    >
                      View order →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeNav !== 'account' && activeNav !== 'dashboard' && activeNav !== 'orders' && (
              <div>
                <h1 className="text-3xl md:text-4xl font-normal text-white tracking-tight mb-4 capitalize">
                  {activeNav}
                </h1>
                <p className="text-[14px] text-[#8A8F98]">
                  Bagian {activeNav} sedang disinkronkan dengan data workshop ARM Exhaust.
                </p>
              </div>
            )}
          </main>
        </div>

      </div>
    </div>
  );
}
