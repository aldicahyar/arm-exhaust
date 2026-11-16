'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  MessageSquare,
  Filter,
  Search,
  X,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type {
  ExhaustOrder,
  ExhaustOrderStatus,
  ExhaustOrderType,
} from '../types';

export const DEFAULT_EXHAUST_ORDERS: ExhaustOrder[] = [
  {
    id: 'ARM-8821',
    customerName: 'Budi Hartanto',
    workshopName: 'SpeedWorks Garage Bali',
    customerRole: 'Reseller B2B',
    customerPhone: '081234567890',
    productName: 'ARM ZX-25R Full Carbon High Performance',
    exhaustSpecs: 'Full System Titanium Header • Short 300mm Canister • DB Killer Included',
    orderType: 'PRE-ORDER / CUSTOM',
    status: 'Antrean Produksi & QC',
    targetDispatchDate: '12 Nov 2026',
    slaLabel: 'Sisa 2 Hari',
    slaStatus: 'warning',
    totalAmount: 8500000,
    downPaymentAmount: 4250000,
    paymentStatus: 'DP 50%',
    courier: 'JNE Trucking (JTR)',
    notes: 'Laser logo khusus: "SpeedWorks Racing Team". Dyno test toleransi 1.5%.',
    createdAt: '10 Nov 2026, 09:30',
  },
  {
    id: 'ARM-8822',
    customerName: 'Dimas Prasetyo',
    customerRole: 'Retail Customer',
    customerPhone: '081987654321',
    productName: 'ARM Slip-On Stainless CBR250RR',
    exhaustSpecs: 'Inlet 51mm • Matte Black Coating • Street Legal dB Killer',
    orderType: 'READY STOCK',
    status: 'Siap Kirim',
    targetDispatchDate: '10 Nov 2026',
    slaLabel: 'Kirim Hari Ini',
    slaStatus: 'urgent',
    totalAmount: 2850000,
    paymentStatus: 'Lunas',
    courier: 'SiCepat Cargo',
    trackingNumber: 'SCP-ARM-0992381',
    notes: 'Sudah dipacking kayu + bubble wrap ekstra.',
    createdAt: '10 Nov 2026, 08:15',
  },
  {
    id: 'ARM-8823',
    customerName: 'Reza Motor Sport Bandung',
    workshopName: 'RMS Bandung Tuning',
    customerRole: 'Distributor VIP',
    customerPhone: '081311223344',
    productName: 'ARM Ninja ZX-4RR Titanium Competition Full System',
    exhaustSpecs: 'Custom Laser Logo "RMS Racing" • Megaphone Canister 350mm • O2 Sensor Bung',
    orderType: 'PRE-ORDER / CUSTOM',
    status: 'Menunggu Konfirmasi',
    targetDispatchDate: '18 Nov 2026',
    slaLabel: 'Verifikasi Specs',
    slaStatus: 'normal',
    totalAmount: 14200000,
    downPaymentAmount: 0,
    paymentStatus: 'Belum Bayar',
    courier: 'J&T Cargo',
    notes: 'Memerlukan konfirmasi dimensi inlet pipa manifold sebelum bending.',
    createdAt: '10 Nov 2026, 11:20',
  },
  {
    id: 'ARM-8824',
    customerName: 'Hendra Wijaya',
    customerRole: 'Retail Customer',
    customerPhone: '085712348765',
    productName: 'ARM Header Titanium Only Yamaha R25 / MT-25',
    exhaustSpecs: 'Bending Presisi CNC • Diameter Pipa 35-38-51mm • Finish Blue Heat Treated',
    orderType: 'READY STOCK',
    status: 'Selesai',
    targetDispatchDate: '08 Nov 2026',
    slaLabel: 'Terkirim',
    slaStatus: 'done',
    totalAmount: 4600000,
    paymentStatus: 'Lunas',
    courier: 'JNE YES',
    trackingNumber: 'JNE-YES-998811',
    notes: 'Pesanan telah diterima customer di Surabaya dengan baik.',
    createdAt: '07 Nov 2026, 14:10',
  },
  {
    id: 'ARM-8825',
    customerName: 'Yoga Pratama',
    workshopName: 'PitStop Racing Semarang',
    customerRole: 'Reseller B2B',
    customerPhone: '081299887766',
    productName: 'ARM Full System Drag Race Sonic 150R',
    exhaustSpecs: 'Inlet 54mm Kompetisi • Short Silencer 200mm • Bracket Gantung Balap',
    orderType: 'PRE-ORDER / CUSTOM',
    status: 'Antrean Produksi & QC',
    targetDispatchDate: '14 Nov 2026',
    slaLabel: 'Sisa 4 Hari',
    slaStatus: 'normal',
    totalAmount: 3800000,
    downPaymentAmount: 2000000,
    paymentStatus: 'DP 50%',
    courier: 'Kargo Baraka Express',
    notes: 'Header step 32-35-51mm untuk spek mesin FFA 200cc.',
    createdAt: '09 Nov 2026, 16:45',
  },
  {
    id: 'ARM-8826',
    customerName: 'Denny Kurniawan',
    customerRole: 'Retail Customer',
    customerPhone: '087811229900',
    productName: 'ARM Canister Carbon Hexagonal 51mm Universal',
    exhaustSpecs: 'Panjang 350mm • Carbon Glossy • Clamp Carbon Asli & Per Stainless',
    orderType: 'READY STOCK',
    status: 'Siap Kirim',
    targetDispatchDate: '10 Nov 2026',
    slaLabel: 'Kirim Hari Ini',
    slaStatus: 'urgent',
    totalAmount: 1850000,
    paymentStatus: 'Lunas',
    courier: 'JNE Trucking',
    trackingNumber: 'JNE-TRK-774411',
    notes: 'Menunggu pick-up kurir kargo sore jam 17:00.',
    createdAt: '10 Nov 2026, 07:30',
  },
];

export function buildWhatsAppOrderUrl(order: ExhaustOrder): string {
  const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : cleanPhone;

  let message =
    `Halo ${order.customerName},\n\n` +
    `Update status pesanan knalpot dari Tim Operasional ARM Exhaust:\n` +
    `• No. Pesanan: ${order.id}\n` +
    `• Produk: ${order.productName}\n` +
    `• Spesifikasi: ${order.exhaustSpecs}\n` +
    `• Tipe: ${order.orderType}\n` +
    `• Status Terkini: ${order.status}\n`;

  if (order.status === 'Antrean Produksi & QC') {
    message +=
      `• Tahap Manufaktur: Perakitan presisi, pengelasan TIG chamber & Quality Control dyno.\n` +
      `• Estimasi Kirim: ${order.targetDispatchDate} (${order.slaLabel})\n`;
  } else if (order.status === 'Siap Kirim') {
    message += `• Status QC: Telah lolos inspeksi QC 100% dan terbungkus bubble wrap + box kayu.\n`;
    if (order.trackingNumber) {
      message += `• Kurir & Resi: ${order.courier || 'Ekspedisi'} — ${order.trackingNumber}\n`;
    }
  } else if (order.status === 'Selesai') {
    message += `• Pengiriman: Pesanan telah tiba di tujuan. Terima kasih telah mempercayakan sistem knalpot Anda kepada ARM Exhaust!\n`;
  } else if (order.status === 'Menunggu Konfirmasi') {
    message += `• Keterangan: Kami sedang memvalidasi spesifikasi kustom motor Anda sebelum diteruskan ke lantai produksi.\n`;
  }

  message += `\nJika ada instruksi khusus atau konfirmasi tambahan, silakan balas chat ini ya Kak. Salam dari bengkel ARM Exhaust!`;

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
}

export function formatIDR(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export type OrderFilterTab = 'Semua' | ExhaustOrderStatus;

export interface OrdersTableProps {
  readonly initialOrders?: ExhaustOrder[];
  readonly onOrderUpdate?: (order: ExhaustOrder) => void;
  readonly className?: string;
}

export function OrdersTable({
  initialOrders = DEFAULT_EXHAUST_ORDERS,
  onOrderUpdate,
  className,
}: Readonly<OrdersTableProps>) {
  const [orders, setOrders] = useState<ExhaustOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<OrderFilterTab>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ExhaustOrderType>('ALL');

  // Slide-over Pop-up Drawer State
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    initialOrders[0]?.id ?? 'ARM-8821'
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // SSR-safe portal mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Inline Advance/Resi Form State (Inside Drawer Inspector)
  const [isAdvancingInline, setIsAdvancingInline] = useState<boolean>(false);
  const [inputCourier, setInputCourier] = useState<string>('SiCepat Cargo');
  const [inputTrackingNumber, setInputTrackingNumber] = useState<string>('');

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Status Tabs definitions
  const statusTabs: readonly {
    readonly label: OrderFilterTab;
    readonly icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { label: 'Semua', icon: Filter },
    { label: 'Menunggu Konfirmasi', icon: Clock },
    { label: 'Antrean Produksi & QC', icon: Package },
    { label: 'Siap Kirim', icon: Truck },
    { label: 'Selesai', icon: CheckCircle2 },
  ];

  // Counts per tab - Synchronized with typeFilter
  const countsByTab = useMemo(() => {
    const scopedOrders = typeFilter === 'ALL'
      ? orders
      : orders.filter((o) => o.orderType === typeFilter);

    const counts: Record<OrderFilterTab, number> = {
      Semua: scopedOrders.length,
      'Menunggu Konfirmasi': 0,
      'Antrean Produksi & QC': 0,
      'Siap Kirim': 0,
      Selesai: 0,
    };
    for (const o of scopedOrders) {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    }
    return counts;
  }, [orders, typeFilter]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab !== 'Semua' && order.status !== activeTab) {
        return false;
      }
      if (typeFilter !== 'ALL' && order.orderType !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchId = order.id.toLowerCase().includes(query);
        const matchCustomer = order.customerName.toLowerCase().includes(query);
        const matchWorkshop = (order.workshopName || '').toLowerCase().includes(query);
        const matchProduct = order.productName.toLowerCase().includes(query);
        const matchPhone = (order.customerPhone || '').includes(query);
        const matchTracking = (order.trackingNumber || '').toLowerCase().includes(query);
        if (!matchId && !matchCustomer && !matchWorkshop && !matchProduct && !matchPhone && !matchTracking) {
          return false;
        }
      }
      return true;
    });
  }, [orders, activeTab, typeFilter, searchQuery]);

  // Selected Order Object
  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || filteredOrders[0] || null;
  }, [orders, selectedOrderId, filteredOrders]);

  // Selected Order Index among filtered
  const selectedIndex = useMemo(() => {
    return filteredOrders.findIndex((o) => o.id === selectedOrderId);
  }, [filteredOrders, selectedOrderId]);

  // Physical Workshop Telemetry (Zero Financial Figures in Telemetry)
  const telemetryMetrics = useMemo(() => {
    const totalActive = orders.filter((o) => o.status !== 'Selesai').length;
    const pendingValidation = orders.filter((o) => o.status === 'Menunggu Konfirmasi').length;
    const inProduction = orders.filter((o) => o.status === 'Antrean Produksi & QC').length;
    const readyToShip = orders.filter((o) => o.status === 'Siap Kirim').length;

    return {
      totalActive,
      pendingValidation,
      inProduction,
      readyToShip,
    };
  }, [orders]);

  // Update order state handler
  const updateOrderState = useCallback(
    (updated: ExhaustOrder) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (onOrderUpdate) {
        onOrderUpdate(updated);
      }
    },
    [onOrderUpdate]
  );

  // Handle open drawer for order
  const handleOpenDrawer = (order: ExhaustOrder) => {
    setSelectedOrderId(order.id);
    setIsAdvancingInline(false);
    setIsDrawerOpen(true);
  };

  // Navigate to previous order
  const handlePrevOrder = () => {
    if (filteredOrders.length === 0) return;
    const prevIdx = selectedIndex > 0 ? selectedIndex - 1 : filteredOrders.length - 1;
    setSelectedOrderId(filteredOrders[prevIdx].id);
    setIsAdvancingInline(false);
  };

  // Navigate to next order
  const handleNextOrder = () => {
    if (filteredOrders.length === 0) return;
    const nextIdx = selectedIndex < filteredOrders.length - 1 ? selectedIndex + 1 : 0;
    setSelectedOrderId(filteredOrders[nextIdx].id);
    setIsAdvancingInline(false);
  };

  // Keyboard navigation across rows (ArrowUp / ArrowDown / Enter)
  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLTableElement>) => {
    if (filteredOrders.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = selectedIndex < filteredOrders.length - 1 ? selectedIndex + 1 : 0;
      setSelectedOrderId(filteredOrders[nextIdx].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = selectedIndex > 0 ? selectedIndex - 1 : filteredOrders.length - 1;
      setSelectedOrderId(filteredOrders[prevIdx].id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setIsDrawerOpen(true);
    }
  };

  // Inline Advance Trigger
  const handleStartAdvance = () => {
    if (!selectedOrder) return;

    if (selectedOrder.status === 'Menunggu Konfirmasi') {
      const updated: ExhaustOrder = {
        ...selectedOrder,
        status: 'Antrean Produksi & QC',
        slaLabel: 'Sisa 3 Hari',
        slaStatus: 'warning',
      };
      updateOrderState(updated);
    } else if (selectedOrder.status === 'Antrean Produksi & QC') {
      setInputCourier(selectedOrder.courier || 'SiCepat Cargo');
      setInputTrackingNumber(selectedOrder.trackingNumber || 'SCP-ARM-0992381');
      setIsAdvancingInline(true);
    } else if (selectedOrder.status === 'Siap Kirim') {
      const updated: ExhaustOrder = {
        ...selectedOrder,
        status: 'Selesai',
        slaLabel: 'Selesai',
        slaStatus: 'done',
      };
      updateOrderState(updated);
    }
  };

  // Save Inline Advancement to "Siap Kirim" with Courier & Resi
  const handleSaveInlineAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const updated: ExhaustOrder = {
      ...selectedOrder,
      status: 'Siap Kirim',
      courier: inputCourier.trim() || 'SiCepat Cargo',
      trackingNumber: inputTrackingNumber.trim() || 'ARM-TRK-774411',
      slaLabel: 'Kirim Hari Ini',
      slaStatus: 'urgent',
    };
    updateOrderState(updated);
    setIsAdvancingInline(false);
  };

  // Monochrome Stage Badge Renderer (Pure Zinc Tokens)
  const renderStageBadge = (status: ExhaustOrderStatus) => {
    if (status === 'Antrean Produksi & QC') {
      return (
        <span className="inline-flex items-center rounded-full border border-zinc-900 bg-zinc-900 text-white px-2.5 py-0.5 text-[10px] font-semibold shadow-xs">
          Produksi &amp; QC
        </span>
      );
    }
    if (status === 'Siap Kirim') {
      return (
        <span className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-900">
          Siap Kirim
        </span>
      );
    }
    if (status === 'Menunggu Konfirmasi') {
      return (
        <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600">
          Menunggu Konfirmasi
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-700">
        Selesai
      </span>
    );
  };

  return (
    <div className={cn('space-y-5 font-sans text-zinc-950', className)}>
      
      {/* 1. Header with Slim Physical Workshop Telemetry Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            Pesanan Masuk &amp; Manufaktur
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Monitoring lantai pengelasan TIG, toleransi dyno knalpot kustom, dan jadwal pickup kargo.
          </p>
        </div>

        {/* Physical Workshop Telemetry Strip */}
        <div className="flex items-center gap-2 text-xs flex-wrap sm:flex-nowrap shrink-0">
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg border border-zinc-200 bg-white shadow-xs">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-zinc-500 whitespace-nowrap">Antrean Aktif:</span>
              <span className="font-mono font-bold text-zinc-950 tabular-nums">
                {telemetryMetrics.totalActive}
              </span>
            </div>

            <span className="text-zinc-300">|</span>

            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-zinc-500 whitespace-nowrap">Validasi Specs:</span>
              <span className="font-mono font-semibold text-zinc-700 tabular-nums">
                {telemetryMetrics.pendingValidation}
              </span>
            </div>

            <span className="text-zinc-300">|</span>

            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-zinc-500 whitespace-nowrap">Workshop TIG &amp; Dyno:</span>
              <span className="font-mono font-bold text-zinc-950 tabular-nums">
                {telemetryMetrics.inProduction}
              </span>
            </div>

            <span className="text-zinc-300">|</span>

            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-zinc-500 whitespace-nowrap">Siap Pickup Kargo:</span>
              <span className="font-mono font-bold text-zinc-950 tabular-nums">
                {telemetryMetrics.readyToShip}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Linear-Style 2-Tier Filter & Search Toolbar (Zero Squishing) */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs space-y-3">
        
        {/* Tier 1: Stage Filter Tabs Row */}
        <div className="overflow-x-auto scrollbar-none pb-0.5">
          <div className="inline-flex items-center gap-1 rounded-lg bg-zinc-100/80 p-1 border border-zinc-200 text-xs">
            {statusTabs.map((tab) => {
              const isActive = activeTab === tab.label;
              const count = countsByTab[tab.label] || 0;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(tab.label)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-[#141416] text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-950 hover:bg-white'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-mono font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-zinc-200/70 text-zinc-600'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier 2: Search Box & Secondary Type Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-zinc-100">
          
          {/* Protected Wide Search Box */}
          <div className="relative flex-1 max-w-md min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode ARM, nama mitra, knalpot..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-9 pr-8 text-xs text-zinc-950 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none transition font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-400 hover:text-zinc-950"
                title="Reset pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Secondary Type Filter Segmented Buttons */}
          <div className="inline-flex rounded-lg bg-zinc-100 p-1 border border-zinc-200 text-xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={cn(
                'px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all',
                typeFilter === 'ALL'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              )}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('READY STOCK')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium text-[11px] transition-all',
                typeFilter === 'READY STOCK'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              )}
            >
              READY STOCK
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('PRE-ORDER / CUSTOM')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium text-[11px] transition-all',
                typeFilter === 'PRE-ORDER / CUSTOM'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              )}
            >
              PRE-ORDER / CUSTOM
            </button>
          </div>

        </div>

      </div>

      {/* 3. Full-Width Clean Table (Spacious Even When Sidebar Is Expanded) */}
      <div className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="overflow-x-auto scrollbar-none">
          <table
            tabIndex={0}
            onKeyDown={handleTableKeyDown}
            className="w-full text-left text-xs border-collapse focus:outline-none"
          >
            <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500">
              <tr>
                <th className="px-5 py-3.5 font-medium w-36 shrink-0">Kode Order</th>
                <th className="px-5 py-3.5 font-medium min-w-[180px]">Pelanggan &amp; Mitra</th>
                <th className="px-5 py-3.5 font-medium min-w-[280px]">Knalpot &amp; Spesifikasi</th>
                <th className="px-5 py-3.5 font-medium w-44 shrink-0">Tahap Manufaktur</th>
                <th className="px-5 py-3.5 font-medium w-36 shrink-0">Target SLA</th>
                <th className="px-5 py-3.5 font-medium w-40 shrink-0">Ekspedisi &amp; Resi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-200/70 text-zinc-950">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                    <Package className="h-8 w-8 text-zinc-400 mx-auto" />
                    <p className="mt-2 text-sm font-semibold text-zinc-950">
                      Tidak ada antrean pesanan yang cocok.
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Sesuaikan kata kunci pencarian atau reset filter status.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = order.id === selectedOrderId;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenDrawer(order)}
                      className={cn(
                        'group cursor-pointer transition-colors duration-150',
                        isSelected && isDrawerOpen
                          ? 'bg-zinc-100/90 border-l-2 border-zinc-950'
                          : 'hover:bg-zinc-50/80'
                      )}
                    >
                      {/* Col 1: Clean Alphanumeric Order Code & Date */}
                      <td className="px-5 py-4 align-top">
                        <div className="font-mono font-bold text-zinc-950 text-xs tracking-tight">
                          {order.id}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {order.createdAt}
                        </div>
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-mono border border-zinc-200 bg-zinc-50 text-zinc-700 font-medium">
                          {order.orderType === 'READY STOCK' ? 'READY' : 'CUSTOM PO'}
                        </span>
                      </td>

                      {/* Col 2: Customer Name & Workshop */}
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-zinc-950 text-xs">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          {order.customerRole}
                        </div>
                        {order.workshopName && (
                          <span className="inline-block text-[10px] text-zinc-600 font-medium mt-0.5">
                            {order.workshopName}
                          </span>
                        )}
                      </td>

                      {/* Col 3: Exhaust Product & Spec Summary */}
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-zinc-950 text-xs leading-snug">
                          {order.productName}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
                          {order.exhaustSpecs}
                        </div>
                      </td>

                      {/* Col 4: Manufacturing Stage Badge */}
                      <td className="px-5 py-4 align-top">
                        {renderStageBadge(order.status)}
                        <div className="text-[10px] text-zinc-500 mt-1">
                          {order.status === 'Antrean Produksi & QC' && 'Chamber TIG Welding'}
                          {order.status === 'Siap Kirim' && 'Packing Kayu OK'}
                          {order.status === 'Menunggu Konfirmasi' && 'Validasi Spesifikasi'}
                          {order.status === 'Selesai' && 'Telah Diterima'}
                        </div>
                      </td>

                      {/* Col 5: SLA Target & Deadline */}
                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-zinc-900 text-xs">
                          {order.targetDispatchDate}
                        </div>
                        <div className="text-[10px] font-medium text-zinc-600 mt-0.5">
                          {order.slaLabel}
                        </div>
                      </td>

                      {/* Col 6: Courier / Cargo & Tracking Number */}
                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-zinc-900 text-xs">
                          {order.courier || 'Ekspedisi'}
                        </div>
                        {order.trackingNumber ? (
                          <span className="font-mono text-[10px] text-zinc-500 block truncate max-w-[140px] mt-0.5">
                            {order.trackingNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 italic block mt-0.5">
                            Pending resi
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Menampilkan <strong className="text-zinc-950 font-mono font-bold">{filteredOrders.length}</strong> pesanan
          </span>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-zinc-500 text-[10px]">Klik baris atau gunakan ↑ ↓ + Enter untuk inspeksi detail</span>
          </div>
        </div>
      </div>

      {/* 4. Slide-Over Pop-Up Drawer (Inspector Sheet via React Portal to document.body) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isDrawerOpen && selectedOrder && (
              <>
                {/* Global Viewport Backdrop Overlay (Covers Entire Screen Including Topbar & Sidebar) */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setIsDrawerOpen(false)}
                  className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
                  aria-hidden="true"
                />

                {/* Slide-over Drawer Panel */}
                <motion.aside
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg lg:max-w-xl flex-col border-l border-zinc-200 bg-[#FAFAFA] shadow-2xl overflow-hidden scrollbar-none"
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Inspeksi Pesanan ${selectedOrder.id}`}
                >
              {/* 1. Sticky Drawer Top Navigation Bar */}
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-[#FAFAFA]/95 backdrop-blur-md px-6 py-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Inspeksi Manufaktur &amp; Dispatch
                  </span>
                </div>

                <div className="flex items-center gap-2 pr-6 sm:pr-8">
                  {/* Prev / Next Stepper */}
                  <div className="flex items-center rounded-md border border-zinc-200 bg-white shadow-xs p-0.5">
                    <button
                      type="button"
                      onClick={handlePrevOrder}
                      disabled={filteredOrders.length <= 1}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Pesanan Sebelumnya (↑)"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-2 text-[10px] font-mono text-zinc-600 font-semibold tabular-nums">
                      {selectedIndex + 1}/{filteredOrders.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextOrder}
                      disabled={filteredOrders.length <= 1}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Pesanan Selanjutnya (↓)"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Close Drawer Button */}
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-950 transition"
                    title="Tutup (Esc)"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* 2. Scrollable Drawer Body (Clean & scrollbar-none) */}
              <div className="flex-1 overflow-y-auto scrollbar-none overscroll-y-contain px-6 py-4 space-y-4">
                {/* Order Header Card */}
                <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-zinc-950 tracking-tight">
                        {selectedOrder.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-zinc-200 bg-zinc-100 text-zinc-800 font-medium">
                        {selectedOrder.orderType}
                      </span>
                    </div>
                    {renderStageBadge(selectedOrder.status)}
                  </div>

                  <div className="text-xs text-zinc-600 pt-1">
                    <strong className="text-zinc-900 font-semibold">{selectedOrder.customerName}</strong>
                    {selectedOrder.workshopName ? ` • ${selectedOrder.workshopName}` : ''}
                    <span className="text-zinc-400"> ({selectedOrder.customerRole})</span>
                  </div>

                  <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-100">
                    <span>Dibuat: {selectedOrder.createdAt}</span>
                    <span>WhatsApp: {selectedOrder.customerPhone || '-'}</span>
                  </div>
                </div>

                {/* Exhaust Manufacturing Technical Specs */}
                <div className="space-y-1.5 text-xs">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Spesifikasi Manufaktur Knalpot
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-zinc-200 space-y-2.5 shadow-xs">
                    <div className="font-semibold text-zinc-950 text-sm">
                      {selectedOrder.productName}
                    </div>
                    <div className="text-zinc-600 leading-relaxed text-xs">
                      {selectedOrder.exhaustSpecs}
                    </div>
                    {selectedOrder.notes && (
                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-700 text-[11px]">
                        <span className="font-semibold text-zinc-900">Catatan Khusus Lantai Produksi:</span>{' '}
                        {selectedOrder.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Logistics & Tracking Slot */}
                <div className="space-y-1.5 text-xs">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Logistik &amp; Pelacakan Ekspedisi
                  </div>
                  <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Ekspedisi / Kargo:</span>
                        <span className="font-semibold text-zinc-900 text-xs mt-0.5 block">
                          {selectedOrder.courier || 'Ekspedisi'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 block">Target Dispatch:</span>
                        <span className="font-semibold text-zinc-900 text-xs mt-0.5 block">
                          {selectedOrder.targetDispatchDate} ({selectedOrder.slaLabel})
                        </span>
                      </div>
                    </div>

                    {/* Resi & Live Tracking Slot */}
                    <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-[10px] text-zinc-400 block">No. Resi Pengiriman:</span>
                        <span className="font-mono text-xs font-semibold text-zinc-900">
                          {selectedOrder.trackingNumber || 'Menunggu Cetak Label'}
                        </span>
                      </div>
                      <div>
                        {selectedOrder.trackingNumber ? (
                          <a
                            href={`https://cekresi.com/?noresi=${selectedOrder.trackingNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-md border border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-zinc-100 font-semibold text-[11px] transition shadow-xs inline-flex items-center gap-1.5"
                          >
                            <span>Lacak Ekspedisi</span>
                            <ExternalLink className="h-3 w-3 text-zinc-500" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-mono italic">
                            Belum terbit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown (Invoice Details Inside Drawer) */}
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-white flex items-center justify-between text-xs shadow-xs">
                  <div>
                    <span className="text-zinc-400 text-[11px] block">Total Nilai Tagihan:</span>
                    <span className="font-mono font-bold text-base text-zinc-950">
                      {formatIDR(selectedOrder.totalAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono border border-zinc-300 bg-zinc-100 font-semibold text-zinc-800">
                      {selectedOrder.paymentStatus}
                    </span>
                    {selectedOrder.downPaymentAmount ? (
                      <span className="block text-[10px] text-zinc-500 mt-0.5 font-mono">
                        DP Masuk: {formatIDR(selectedOrder.downPaymentAmount)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Inline Resi Form when advancing to "Siap Kirim" */}
                <AnimatePresence>
                  {isAdvancingInline && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleSaveInlineAdvance}
                      className="p-3.5 rounded-xl border border-zinc-300 bg-white space-y-2.5 text-xs shadow-xs"
                    >
                      <div className="font-semibold text-zinc-950 flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-zinc-700" />
                        <span>Input Ekspedisi &amp; Nomor Resi</span>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="courier-input" className="text-[10px] text-zinc-500 font-medium">Nama Kurir / Kargo</label>
                        <input
                          id="courier-input"
                          type="text"
                          value={inputCourier}
                          onChange={(e) => setInputCourier(e.target.value)}
                          placeholder="Contoh: SiCepat Cargo / JNE Trucking"
                          className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="tracking-input" className="text-[10px] text-zinc-500 font-medium">Nomor Resi / AWB</label>
                        <input
                          id="tracking-input"
                          type="text"
                          value={inputTrackingNumber}
                          onChange={(e) => setInputTrackingNumber(e.target.value)}
                          placeholder="Contoh: SCP-ARM-0992381"
                          className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-mono text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAdvancingInline(false)}
                          className="px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 text-xs font-medium transition"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-md bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold transition shadow-xs"
                        >
                          Simpan &amp; Tandai Siap Kirim
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Sticky Action Footer (Always Visible at Bottom, Zero Hunting) */}
              <div className="sticky bottom-0 z-20 flex items-center gap-2 border-t border-zinc-200 bg-[#FAFAFA]/95 backdrop-blur-md px-6 py-3.5 shrink-0 shadow-xs">
                <a
                  href={buildWhatsAppOrderUrl(selectedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-semibold text-zinc-800 transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-zinc-600" />
                  <span>Update WhatsApp</span>
                </a>

                {selectedOrder.status !== 'Selesai' && !isAdvancingInline && (
                  <button
                    type="button"
                    onClick={handleStartAdvance}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {selectedOrder.status === 'Menunggu Konfirmasi' && (
                      <span className="flex items-center gap-1">
                        Mulai Antrean Produksi <ArrowRight className="h-3 w-3" />
                      </span>
                    )}
                    {selectedOrder.status === 'Antrean Produksi & QC' && (
                      <span className="flex items-center gap-1">
                        Input Resi &amp; Kirim <ArrowRight className="h-3 w-3" />
                      </span>
                    )}
                    {selectedOrder.status === 'Siap Kirim' && (
                      <span>Selesaikan Pesanan ✓</span>
                    )}
                  </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}

    </div>
  );
}
