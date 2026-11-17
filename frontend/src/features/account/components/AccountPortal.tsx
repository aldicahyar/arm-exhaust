'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  AccountNavKey,
  AccountTabKey,
  AccountDrawerMode,
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
import { AccountDrawer } from './AccountDrawer';
import { fetchCurrentAccountData } from '../services/account.api';

// Bencho official transition curve
const BENCHO_EASE = [0.22, 1, 0.36, 1] as const;

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
  const [drawerMode, setDrawerMode] = useState<AccountDrawerMode>('none');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Sync with live server session data on mount
  useEffect(() => {
    let isMounted = true;
    void fetchCurrentAccountData().then((liveData) => {
      if (isMounted && liveData) {
        setAccountData(liveData);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Suppress visual scrollbar across entire page / window when on account portal
  useEffect(() => {
    document.documentElement.classList.add('scrollbar-none');
    document.body.classList.add('scrollbar-none');
    return () => {
      document.documentElement.classList.remove('scrollbar-none');
      document.body.classList.remove('scrollbar-none');
    };
  }, []);

  // Auto-dismiss notice banner after 4 seconds
  useEffect(() => {
    if (!noticeMessage) return;
    const timer = setTimeout(() => {
      setNoticeMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [noticeMessage]);

  const handleDrawerSuccess = (
    updated?: Partial<CustomerAccountData>,
    msg?: string
  ) => {
    if (updated) {
      setAccountData((prev) => ({
        ...prev,
        ...updated,
      }));
    }
    if (msg) {
      setNoticeMessage(msg);
    }
  };

  return (
    <div className="w-full bg-[#0A0A0B] text-white min-h-screen font-sans antialiased scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="max-w-[1160px] mx-auto px-4 md:px-8 py-12 md:py-20">
        
        {/* Success Notice Banner with Bencho smooth height/fade transition */}
        <AnimatePresence>
          {noticeMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.22, ease: BENCHO_EASE }}
              role="status"
              className="mb-8 p-3.5 bg-[#141416] border border-white text-white text-[13px] flex items-center justify-between overflow-hidden"
            >
              <span>{noticeMessage}</span>
              <button
                type="button"
                onClick={() => setNoticeMessage(null)}
                className="text-[#8A8F98] hover:text-white text-xs underline underline-offset-2 ml-4"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* POLESTAR 2-COLUMN GRID (Left Nav Rail + Right Main Content) */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-10 md:gap-20">
          
          {/* Left Vertical Navigation Rail */}
          <AccountNavRail
            activeKey={activeNav}
            onSelect={setActiveNav}
            onSignOut={onSignOut}
          />

          {/* Right Main Content Area with Fluid Cross-Fade Transition */}
          <main className="w-full min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNav}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: BENCHO_EASE }}
              >
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
                        className={`pb-2.5 transition-colors relative ${
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
                        className={`pb-2.5 transition-colors relative ${
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
                        className={`pb-2.5 transition-colors relative ${
                          activeTab === 'third-party'
                            ? 'text-white font-medium border-b-2 border-white'
                            : 'text-[#8A8F98] font-normal hover:text-white'
                        }`}
                      >
                        Third-party applications
                      </button>
                    </div>

                    {/* Tab Content with Fluid Sub-tab Transition */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: BENCHO_EASE }}
                      >
                        {activeTab === 'arm-id' && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
                            {/* QUADRANT 1: SIGN-IN AND SECURITY */}
                            <AccountSecuritySection
                              data={accountData.security}
                              onChangePassword={() => setDrawerMode('change-password')}
                            />

                            {/* QUADRANT 2: PERSONAL INFORMATION */}
                            <AccountPersonalInfoSection
                              data={accountData.personal}
                              onEdit={() => setDrawerMode('edit-profile')}
                            />

                            {/* QUADRANT 3: LOCATION / REGIONAL PREFERENCES */}
                            <AccountLocationSection
                              data={accountData.location}
                            />

                            {/* QUADRANT 4: ADVANCED / ACCOUNT MANAGEMENT */}
                            <AccountAdvancedSection
                              data={accountData.advanced}
                            />
                          </div>
                        )}

                        {activeTab === 'privacy' && (
                          <div className="py-8 text-[14px] text-[#8A8F98] leading-relaxed max-w-xl">
                            <p className="mb-4 text-white font-medium">ARM Exhaust Customer Data Privacy</p>
                            <p>
                              Your account data is encrypted adhering to official workshop and high-security transaction standards.
                              We never share your motorcycle build configurations or personal delivery addresses with third parties.
                            </p>
                          </div>
                        )}

                        {activeTab === 'third-party' && (
                          <div className="py-8 text-[14px] text-[#8A8F98] leading-relaxed max-w-xl">
                            <p className="mb-4 text-white font-medium">Connected Third-Party Applications</p>
                            <p>
                              No third-party applications currently have authorized access to your ARM Exhaust account.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
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
                          onClick={() => alert('J&T Cargo tracking number: 9821-4402-9912')}
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
                      The {activeNav} section is currently synchronizing with ARM Exhaust workshop data.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

      </div>

      {/* Slide-over Drawer for Password Change, Profile Edit, & Email */}
      <AccountDrawer
        isOpen={drawerMode !== 'none'}
        mode={drawerMode}
        accountData={accountData}
        onClose={() => setDrawerMode('none')}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
}
