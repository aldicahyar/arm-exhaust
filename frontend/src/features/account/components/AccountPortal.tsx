'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  AccountNavKey,
  AccountTabKey,
  AccountDrawerMode,
  CustomerAccountData,
  CustomerDashboardTelemetry,
} from '../types';
import { DEFAULT_CUSTOMER_ACCOUNT } from '../types';
import { AccountNavRail } from './AccountNavRail';
import {
  AccountSecuritySection,
  AccountPersonalInfoSection,
} from './AccountSections';
import { AccountPrivacyTab } from './AccountPrivacyTab';
import { AccountDrawer } from './AccountDrawer';
import { AccountCertificateModal } from './AccountCertificateModal';
import { fetchCurrentAccountData, fetchDashboardTelemetry } from '../services/account.api';

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
  const [telemetry, setTelemetry] = useState<CustomerDashboardTelemetry | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<{
    readonly serialNumber: string;
    readonly modelName: string;
    readonly vehicleMatch: string;
    readonly warrantyStatus?: string;
    readonly warrantyType?: string;
    readonly verificationToken?: string;
  } | null>(null);
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
    void fetchDashboardTelemetry().then((data) => {
      if (isMounted && data) {
        setTelemetry(data);
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

                    {/* TABS (ARM ID / Privacy) */}
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
                            {/* COLUMN 1: PERSONAL INFORMATION */}
                            <AccountPersonalInfoSection
                              data={accountData.personal}
                              onEdit={() => setDrawerMode('edit-profile')}
                            />

                            {/* COLUMN 2: SIGN-IN, SECURITY & MEMBERSHIP */}
                            <AccountSecuritySection
                              data={accountData.security}
                              location={accountData.location}
                              onChangePassword={() => setDrawerMode('change-password')}
                            />
                          </div>
                        )}

                        {activeTab === 'privacy' && (
                          <AccountPrivacyTab
                            userEmail={accountData.security.email}
                            userPhone={accountData.personal.phoneNumber}
                            userId={accountData.security.email}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}

                {activeNav === 'dashboard' && (
                  <div>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
                      <div>
                        <h1 className="text-3xl md:text-4xl font-normal text-white tracking-tight">
                          Hi, {accountData.personal.name}
                        </h1>
                        <div className="text-[13px] text-[#8A8F98] mt-1 font-mono">
                          ARM Member • Member since {telemetry?.memberSince ?? 'November 2026'}
                        </div>
                      </div>
                    </div>

                    {/* SEKSI 1: ACTIVE FABRICATION & WORKSHOP STATUS */}
                    {telemetry?.activeFabrication && (
                      <section aria-labelledby="active-fabrication-heading" className="border-t border-[#1E1E21] py-8 border-b border-[#1E1E21]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <span id="active-fabrication-heading" className="text-[11px] font-mono tracking-widest text-[#8A8F98] uppercase">
                            Active Fabrication • Workshop Log
                          </span>
                          <span className="text-[12px] text-white font-mono">
                            ESTIMATED DELIVERY: {telemetry.activeFabrication.estimatedDelivery}
                          </span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div>
                            <div className="text-[20px] font-normal text-white">
                              {telemetry.activeFabrication.productName}
                            </div>
                            <div className="text-[13px] text-[#8A8F98] mt-0.5">
                              Order {telemetry.activeFabrication.orderCode} • Custom tuned for {telemetry.activeFabrication.targetMotorbike}
                            </div>
                          </div>
                          <div className="text-left md:text-right">
                            <div className="text-[14px] text-white font-medium">
                              Stage: {telemetry.activeFabrication.stageLabel} ({telemetry.activeFabrication.progressPercentage}%)
                            </div>
                            <div className="text-[12px] text-[#8A8F98] mt-0.5 font-mono">
                              Courier: {telemetry.activeFabrication.courier.name} • Resi: {telemetry.activeFabrication.courier.waybillNumber}
                            </div>
                          </div>
                        </div>

                        {/* Hairline 4-Stage Progress Bar */}
                        <div className="mt-6 mb-4">
                          <div className="w-full h-[2px] bg-[#1E1E21] overflow-hidden">
                            <div
                              className="h-full bg-white transition-all duration-500"
                              style={{ width: `${telemetry.activeFabrication.progressPercentage}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono mt-2 text-[#8A8F98]">
                            <span className="text-white">1. Tube Bending ✓</span>
                            <span className="text-white font-semibold">2. TIG Welding (75%)</span>
                            <span>3. Acoustic & Laser QC</span>
                            <span>4. Shipped</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-6 pt-3 text-[13px]">
                          <button
                            type="button"
                            onClick={() => setActiveNav('orders')}
                            className="text-white underline underline-offset-4 hover:text-[#8A8F98] transition-colors"
                          >
                            View full order details →
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNoticeMessage(
                                `J&T Cargo Waybill: ${telemetry?.activeFabrication?.courier.waybillNumber} • In Transit to Bandung`
                              )
                            }
                            className="text-[#8A8F98] hover:text-white underline underline-offset-4 transition-colors"
                          >
                            Track cargo shipment ↗
                          </button>
                        </div>
                      </section>
                    )}

                    {/* SEKSI 2: MY GARAGE & DIGITAL PASSPORT */}
                    <section aria-labelledby="garage-heading" className="py-8 border-b border-[#1E1E21]">
                      <div className="flex items-center justify-between mb-6">
                        <span id="garage-heading" className="text-[11px] font-mono tracking-widest text-[#8A8F98] uppercase">
                          My Garage ({telemetry?.motorbikes.length ?? 1})
                        </span>
                        <button
                          type="button"
                          onClick={() => setNoticeMessage('Motorcycle registration will be available in the next workshop update.')}
                          className="text-[12px] text-[#8A8F98] hover:text-white underline underline-offset-4 transition-colors"
                        >
                          + Register motorcycle →
                        </button>
                      </div>

                      {(telemetry?.motorbikes ?? []).map((bike) => (
                        <div key={bike.id} className="py-2">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                              <div className="text-[20px] font-normal text-white">
                                {bike.brand} {bike.model} ({bike.year})
                              </div>
                              <div className="text-[13px] text-[#8A8F98] mt-0.5">
                                {bike.engineSpecs} • {bike.headerPortMm} mm Header Port
                              </div>

                              {bike.installedExhaust && (
                                <div className="mt-4 p-4 bg-[#141416] border border-[#1E1E21] max-w-xl">
                                  <div className="text-[11px] font-mono text-[#8A8F98] uppercase">Installed Exhaust System</div>
                                  <div className="text-[15px] font-medium text-white mt-0.5">
                                    {bike.installedExhaust.modelName}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[12px] font-mono">
                                    <span className="text-white">Serial: {bike.installedExhaust.serialNumber}</span>
                                    <span className="bg-white text-black px-1.5 py-0.5 font-bold text-[10px] uppercase">
                                      AUTHENTIC
                                    </span>
                                    <span className="text-[#8A8F98]">• {bike.installedExhaust.warrantyStatus} Warranty</span>
                                  </div>
                                  <div className="mt-4 pt-3 border-t border-[#1E1E21] flex flex-wrap gap-4 text-[13px]">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedCertificate({
                                          serialNumber: bike.installedExhaust!.serialNumber,
                                          modelName: bike.installedExhaust!.modelName,
                                          vehicleMatch: `${bike.brand} ${bike.model} (${bike.year})`,
                                          warrantyStatus: bike.installedExhaust!.warrantyStatus,
                                          warrantyType: bike.installedExhaust!.warrantyType,
                                          verificationToken: bike.installedExhaust!.verificationToken,
                                        })
                                      }
                                      className="text-white underline underline-offset-4 hover:text-[#8A8F98] transition-colors"
                                    >
                                      View Authenticity Certificate & QR Code ↗
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setActiveNav('orders')}
                              className="text-[13px] text-[#8A8F98] hover:text-white underline underline-offset-4 transition-colors text-left"
                            >
                              View motorcycle specs →
                            </button>
                          </div>
                        </div>
                      ))}
                    </section>

                    {/* SEKSI 3: WORKSHOP QUICK SERVICES */}
                    <section aria-labelledby="workshop-services-heading" className="py-8">
                      <div id="workshop-services-heading" className="text-[11px] font-mono tracking-widest text-[#8A8F98] uppercase mb-4">
                        Workshop Services & Aftercare
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
                        <button
                          type="button"
                          onClick={() => setNoticeMessage('Dyno tuning slot requested. Workshop coordinator will confirm via WhatsApp.')}
                          className="p-4 border border-[#1E1E21] text-left hover:border-white transition-colors group"
                        >
                          <div className="font-medium text-white group-hover:underline underline-offset-4">Book Dyno Run & dB Test →</div>
                          <p className="text-[12px] text-[#8A8F98] mt-1">Calibrate exhaust backpressure and acoustic sound levels.</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNoticeMessage('Glasswool repacking service requested for your silencer.')}
                          className="p-4 border border-[#1E1E21] text-left hover:border-white transition-colors group"
                        >
                          <div className="font-medium text-white group-hover:underline underline-offset-4">Schedule Silencer Repack →</div>
                          <p className="text-[12px] text-[#8A8F98] mt-1">Thermal glasswool inspection and refresh for optimal tone.</p>
                        </button>

                        <a
                          href="/catalog"
                          className="p-4 border border-[#1E1E21] text-left hover:border-white transition-colors group block"
                        >
                          <div className="font-medium text-white group-hover:underline underline-offset-4">Explore Compatible Parts ↗</div>
                          <p className="text-[12px] text-[#8A8F98] mt-1">Browse titanium headers, dB killers, and carbon brackets.</p>
                        </a>
                      </div>
                    </section>
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
                            Luster V2 M-Quick
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

      {/* Digital Authenticity Passport & QR Modal */}
      {selectedCertificate && (
        <AccountCertificateModal
          isOpen={Boolean(selectedCertificate)}
          serialNumber={selectedCertificate.serialNumber}
          modelName={selectedCertificate.modelName}
          vehicleMatch={selectedCertificate.vehicleMatch}
          warrantyStatus={selectedCertificate.warrantyStatus}
          warrantyType={selectedCertificate.warrantyType}
          verificationToken={selectedCertificate.verificationToken}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
}
