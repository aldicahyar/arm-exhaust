'use client';

import React, { useState, useMemo } from 'react';
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
  FileText,
  AlertCircle,
  Eye,
  Check,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type {
  ExhaustOrder,
  ExhaustOrderStatus,
  ExhaustOrderType,
  ExhaustPaymentStatus,
  ExhaustSlaStatus,
} from '../types';

export const DEFAULT_EXHAUST_ORDERS: ExhaustOrder[] = [
  {
    id: '#ARM-8821',
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
    id: '#ARM-8822',
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
    id: '#ARM-8823',
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
    id: '#ARM-8824',
    customerName: 'Hendra Wijaya',
    customerRole: 'Retail Customer',
    customerPhone: '085712348765',
    productName: 'ARM Header Bend Titanium Yamaha R6',
    exhaustSpecs: 'Pie-cut welded Titanium Grade 1 • 4-2-1 Config • Blue Heat Anodized',
    orderType: 'READY STOCK',
    status: 'Selesai',
    targetDispatchDate: '08 Nov 2026',
    slaLabel: 'Selesai',
    slaStatus: 'done',
    totalAmount: 6400000,
    paymentStatus: 'Lunas',
    courier: 'J&T Cargo',
    trackingNumber: 'JTC-88129012',
    notes: 'Paket telah diterima pelanggan di Jakarta Barat.',
    createdAt: '06 Nov 2026, 14:00',
  },
  {
    id: '#ARM-8825',
    customerName: 'Apex Moto Workshop Surabaya',
    workshopName: 'Apex Moto HQ',
    customerRole: 'Reseller B2B',
    customerPhone: '082199887766',
    productName: 'ARM GP-Pro Titanium Slip-on Honda CBR1000RR-R',
    exhaustSpecs: 'Burn Titanium End-Tip • Mesh Grill • Carbon Heat Shield',
    orderType: 'PRE-ORDER / CUSTOM',
    status: 'Antrean Produksi & QC',
    targetDispatchDate: '13 Nov 2026',
    slaLabel: 'Sisa 3 Hari',
    slaStatus: 'normal',
    totalAmount: 9750000,
    downPaymentAmount: 9750000,
    paymentStatus: 'Lunas',
    courier: 'JNE Trucking (JTR)',
    notes: 'Tahap pengelasan TIG argon chamber & leak test manifold.',
    createdAt: '09 Nov 2026, 16:45',
  },
  {
    id: '#ARM-8826',
    customerName: 'Kurnia Racing Solo',
    workshopName: 'Kurnia Speed Shop',
    customerRole: 'Reseller B2B',
    customerPhone: '081233445566',
    productName: 'ARM XMAX 300 Full Carbon Exhaust System',
    exhaustSpecs: 'Header Stainless 304 Polished • Oval Carbon Muffler 400mm',
    orderType: 'READY STOCK',
    status: 'Siap Kirim',
    targetDispatchDate: '10 Nov 2026',
    slaLabel: 'Kirim Hari Ini',
    slaStatus: 'urgent',
    totalAmount: 4900000,
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
    message +=
      `• Status QC: Telah lolos inspeksi QC 100% dan terbungkus bubble wrap + hard box kayu.\n`;
    if (order.trackingNumber) {
      message += `• Kurir & Resi: ${order.courier || 'Ekspedisi'} — ${order.trackingNumber}\n`;
    }
  } else if (order.status === 'Selesai') {
    message +=
      `• Pengiriman: Pesanan telah tiba di tujuan. Terima kasih telah mempercayakan sistem knalpot Anda kepada ARM Exhaust!\n`;
  } else if (order.status === 'Menunggu Konfirmasi') {
    message +=
      `• Keterangan: Kami sedang memvalidasi spesifikasi kustom motor Anda sebelum diteruskan ke lantai produksi.\n`;
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
  initialOrders?: ExhaustOrder[];
  onOrderUpdate?: (order: ExhaustOrder) => void;
  className?: string;
}

export function OrdersTable({
  initialOrders = DEFAULT_EXHAUST_ORDERS,
  onOrderUpdate,
  className,
}: OrdersTableProps) {
  const [orders, setOrders] = useState<ExhaustOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<OrderFilterTab>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ExhaustOrderType>('ALL');

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<ExhaustOrder | null>(null);

  // Status Advance / Resi Dialog State
  const [advancingOrder, setAdvancingOrder] = useState<ExhaustOrder | null>(null);
  const [inputCourier, setInputCourier] = useState<string>('JNE Trucking (JTR)');
  const [inputTrackingNumber, setInputTrackingNumber] = useState<string>('');

  // Status Tabs definitions
  const statusTabs: { label: OrderFilterTab; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: 'Semua', icon: Filter },
    { label: 'Menunggu Konfirmasi', icon: Clock },
    { label: 'Antrean Produksi & QC', icon: Package },
    { label: 'Siap Kirim', icon: Truck },
    { label: 'Selesai', icon: CheckCircle2 },
  ];

  // Counts per tab
  const countsByTab = useMemo(() => {
    const counts: Record<OrderFilterTab, number> = {
      Semua: orders.length,
      'Menunggu Konfirmasi': 0,
      'Antrean Produksi & QC': 0,
      'Siap Kirim': 0,
      Selesai: 0,
    };
    for (const o of orders) {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    }
    return counts;
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status tab filter
      if (activeTab !== 'Semua' && order.status !== activeTab) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'ALL' && order.orderType !== typeFilter) {
        return false;
      }
      // Search query filter
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

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalActive = orders.filter((o) => o.status !== 'Selesai').length;
    const inProduction = orders.filter((o) => o.status === 'Antrean Produksi & QC').length;
    const readyToShip = orders.filter((o) => o.status === 'Siap Kirim').length;
    const totalRevenue = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);

    return {
      totalActive,
      inProduction,
      readyToShip,
      totalRevenue,
    };
  }, [orders]);

  // Handler for advancing status
  const handleAdvanceClick = (order: ExhaustOrder) => {
    if (order.status === 'Menunggu Konfirmasi') {
      // Advance directly to Antrean Produksi & QC
      const updated: ExhaustOrder = {
        ...order,
        status: 'Antrean Produksi & QC',
        slaLabel: 'Sisa 3 Hari',
        slaStatus: 'warning',
      };
      updateOrderState(updated);
    } else if (order.status === 'Antrean Produksi & QC') {
      // Open dialog to input courier & resi
      setAdvancingOrder(order);
      setInputCourier(order.courier || 'JNE Trucking (JTR)');
      setInputTrackingNumber(order.trackingNumber || '');
    } else if (order.status === 'Siap Kirim') {
      // Advance to Selesai
      const updated: ExhaustOrder = {
        ...order,
        status: 'Selesai',
        slaLabel: 'Selesai',
        slaStatus: 'done',
      };
      updateOrderState(updated);
    }
  };

  const handleSaveAdvancement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advancingOrder) return;

    const updated: ExhaustOrder = {
      ...advancingOrder,
      status: 'Siap Kirim',
      courier: inputCourier.trim() || 'JNE Trucking (JTR)',
      trackingNumber: inputTrackingNumber.trim() || `ARM-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      slaLabel: 'Kirim Hari Ini',
      slaStatus: 'urgent',
    };
    updateOrderState(updated);
    setAdvancingOrder(null);
  };

  const updateOrderState = (updated: ExhaustOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    if (selectedOrder && selectedOrder.id === updated.id) {
      setSelectedOrder(updated);
    }
    if (onOrderUpdate) {
      onOrderUpdate(updated);
    }
  };

  return (
    <div className={cn('space-y-6 font-sans text-zinc-200', className)}>
      {/* KPI Ribbon Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Pesanan Aktif</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">{metrics.totalActive}</span>
            <span className="text-xs text-zinc-400">unit berjalan</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Produksi & QC</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{metrics.inProduction}</span>
            <span className="text-xs text-amber-400/80">antrean workshop</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Siap Kirim</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{metrics.readyToShip}</span>
            <span className="text-xs text-emerald-400/80">siap pickup logistik</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Total Nilai Pesanan</span>
            <div className="rounded-lg bg-zinc-800 p-2 text-zinc-300">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-zinc-100">{formatIDR(metrics.totalRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Main Operational Container */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-6 shadow-xl backdrop-blur-md">
        {/* Top Controls: Segmented Status Tabs */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Manufaktur & Antrean Pesanan Knalpot
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Monitoring status produksi, verifikasi dyno, badge SLA kirim, dan transparansi WhatsApp mitra.
              </p>
            </div>

            {/* Quick Type Filter Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
                  typeFilter === 'ALL'
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                Semua Tipe
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('READY STOCK')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
                  typeFilter === 'READY STOCK'
                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                READY STOCK
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('PRE-ORDER / CUSTOM')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
                  typeFilter === 'PRE-ORDER / CUSTOM'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                PRE-ORDER / CUSTOM
              </button>
            </div>
          </div>

          {/* Segmented Status Tabs Bar */}
          <div className="overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-1.5 min-w-max">
              {statusTabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.label;
                const count = countsByTab[tab.label] || 0;

                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setActiveTab(tab.label)}
                    className={cn(
                      'relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition duration-150 ease-out',
                      isActive
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    )}
                  >
                    <TabIcon className="h-4 w-4 shrink-0" />
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-mono font-bold transition-colors',
                        isActive
                          ? 'bg-zinc-950 text-amber-400'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar & Reset Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari no pesanan, nama mitra, knalpot..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-9 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-hidden transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-100 rounded-md hover:bg-zinc-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {(searchQuery || typeFilter !== 'ALL' || activeTab !== 'Semua') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('ALL');
                    setActiveTab('Semua');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-amber-500/30"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reset Filter</span>
                </button>
              )}
              <span className="text-xs text-zinc-500 font-mono">
                Menampilkan <strong className="text-zinc-200">{filteredOrders.length}</strong> pesanan
              </span>
            </div>
          </div>
        </div>

        {/* Orders Table Layout */}
        <div className="mt-5 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-inner">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4">No. Pesanan</th>
                  <th className="py-3 px-4">Pelanggan / Mitra</th>
                  <th className="py-3 px-4">Spesifikasi Knalpot</th>
                  <th className="py-3 px-4 text-center">Tipe Pesanan</th>
                  <th className="py-3 px-4 text-center">SLA & Target Kirim</th>
                  <th className="py-3 px-4 text-right">Total & Bayar</th>
                  <th className="py-3 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <AnimatePresence mode="popLayout">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package className="h-8 w-8 text-zinc-600" />
                          <p className="text-sm font-medium text-zinc-400">Tidak ada pesanan yang sesuai kriteria</p>
                          <p className="text-xs text-zinc-500 max-w-sm">
                            Coba ubah filter status, tipe pesanan, atau hapus kata kunci pencarian.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const waUrl = buildWhatsAppOrderUrl(order);

                      return (
                        <motion.tr
                          key={order.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.18 }}
                          className="hover:bg-zinc-800/40 transition-colors group"
                        >
                          {/* Col 1: Order ID & Date */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-mono font-bold text-amber-400 flex items-center gap-1.5">
                              <span>{order.id}</span>
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">{order.createdAt}</div>
                            {order.trackingNumber && (
                              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 w-fit">
                                <Truck className="h-3 w-3 text-amber-500 shrink-0" />
                                <span className="truncate max-w-[120px]">{order.trackingNumber}</span>
                              </div>
                            )}
                          </td>

                          {/* Col 2: Customer / Partner */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                              {order.customerName}
                            </div>
                            {order.workshopName && (
                              <div className="text-zinc-400 text-[11px] flex items-center gap-1 mt-0.5">
                                <span className="text-amber-500/80 font-mono">•</span>
                                <span>{order.workshopName}</span>
                              </div>
                            )}
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={cn(
                                  'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight',
                                  order.customerRole === 'Distributor VIP'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : order.customerRole === 'Reseller B2B'
                                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                                )}
                              >
                                {order.customerRole}
                              </span>
                              <span className="text-[11px] text-zinc-500 font-mono">{order.customerPhone}</span>
                            </div>
                          </td>

                          {/* Col 3: Exhaust Product & Specs */}
                          <td className="py-3.5 px-4 align-top max-w-xs">
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedOrder(order)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setSelectedOrder(order);
                                }
                              }}
                              className="font-medium text-zinc-200 hover:text-amber-400 transition cursor-pointer"
                            >
                              {order.productName}
                            </div>
                            <div className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                              {order.exhaustSpecs}
                            </div>
                            {order.notes && (
                              <div className="mt-1 text-[10px] text-zinc-500 italic flex items-center gap-1">
                                <Sparkles className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                                <span className="truncate max-w-[200px]">{order.notes}</span>
                              </div>
                            )}
                          </td>

                          {/* Col 4: Order Type Badge */}
                          <td className="py-3.5 px-4 align-top text-center">
                            {order.orderType === 'READY STOCK' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-zinc-800/90 text-zinc-300 border border-zinc-700/80 shadow-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                                READY STOCK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs">
                                <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                                PRE-ORDER / CUSTOM
                              </span>
                            )}
                          </td>

                          {/* Col 5: SLA & Target Dispatch */}
                          <td className="py-3.5 px-4 align-top text-center">
                            <div className="font-mono text-zinc-300 font-medium text-xs">{order.targetDispatchDate}</div>
                            <div className="mt-1">
                              {order.slaStatus === 'urgent' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                  <AlertCircle className="h-3 w-3" />
                                  {order.slaLabel}
                                </span>
                              )}
                              {order.slaStatus === 'warning' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/60 text-amber-400 border border-amber-800/50">
                                  <Clock className="h-3 w-3" />
                                  {order.slaLabel}
                                </span>
                              )}
                              {order.slaStatus === 'normal' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700">
                                  <Clock className="h-3 w-3" />
                                  {order.slaLabel}
                                </span>
                              )}
                              {order.slaStatus === 'done' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {order.slaLabel}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1">{order.status}</div>
                          </td>

                          {/* Col 6: Price & Payment Status */}
                          <td className="py-3.5 px-4 align-top text-right">
                            <div className="font-mono font-bold text-zinc-100 text-xs">
                              {formatIDR(order.totalAmount)}
                            </div>
                            <div className="mt-1 flex justify-end">
                              <span
                                className={cn(
                                  'inline-block px-2 py-0.5 rounded text-[10px] font-semibold',
                                  order.paymentStatus === 'Lunas'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : order.paymentStatus === 'DP 50%'
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                )}
                              >
                                {order.paymentStatus}
                              </span>
                            </div>
                          </td>

                          {/* Col 7: Quick Actions */}
                          <td className="py-3.5 px-4 align-top text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* WhatsApp Quick Update Action */}
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Kirim Update Transparan via WhatsApp"
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all hover:scale-105"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </a>

                              {/* Advance Status Button */}
                              {order.status !== 'Selesai' && (
                                <button
                                  type="button"
                                  onClick={() => handleAdvanceClick(order)}
                                  title={
                                    order.status === 'Menunggu Konfirmasi'
                                      ? 'Mulai Antrean Produksi'
                                      : order.status === 'Antrean Produksi & QC'
                                      ? 'Input Resi & Tandai Siap Kirim'
                                      : 'Selesaikan Pesanan'
                                  }
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all hover:scale-105"
                                >
                                  {order.status === 'Menunggu Konfirmasi' && <Package className="h-4 w-4" />}
                                  {order.status === 'Antrean Produksi & QC' && <Truck className="h-4 w-4" />}
                                  {order.status === 'Siap Kirim' && <Check className="h-4 w-4" />}
                                </button>
                              )}

                              {/* View Details Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                title="Lihat Detail Pesanan Knalpot"
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 border border-zinc-700/60 transition-all"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Advance Status / Input Resi Dialog */}
      <AnimatePresence>
        {advancingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdvancingOrder(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-zinc-100 z-10"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-amber-500" />
                  <h3 className="font-bold text-sm">Lolos QC & Siap Kirim Kargo</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAdvancingOrder(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAdvancement} className="mt-4 space-y-4">
                <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 text-xs">
                  <div className="text-zinc-400">Nomor Pesanan:</div>
                  <div className="font-mono font-bold text-amber-400">{advancingOrder.id}</div>
                  <div className="text-zinc-300 mt-1">{advancingOrder.productName}</div>
                  <div className="text-zinc-500 mt-0.5 font-mono">Mitra: {advancingOrder.customerName}</div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Pilihan Ekspedisi Kargo</label>
                  <select
                    value={inputCourier}
                    onChange={(e) => setInputCourier(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="JNE Trucking (JTR)">JNE Trucking (JTR) - Rekomendasi Knalpot Box</option>
                    <option value="SiCepat Cargo">SiCepat Cargo (Gokil)</option>
                    <option value="J&T Cargo">J&T Cargo Heavy Duty</option>
                    <option value="Lalamove Van">Lalamove Van (Same Day Jabodetabek)</option>
                    <option value="Ambil di Bengkel ARM">Ambil Langsung di Workshop ARM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Nomor Resi / Surat Jalan Pengiriman
                  </label>
                  <input
                    type="text"
                    required
                    value={inputTrackingNumber}
                    onChange={(e) => setInputTrackingNumber(e.target.value)}
                    placeholder="Contoh: JTR-ARM-8821992"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Nomor resi ini akan otomatis tercantum pada format pesan WhatsApp mitra.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setAdvancingOrder(null)}
                    className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-sm"
                  >
                    Konfirmasi Siap Kirim
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exhaust Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-zinc-100 z-10 scrollbar-none"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <span>Rincian Manufaktur {selectedOrder.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {selectedOrder.orderType}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400">{selectedOrder.createdAt}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                {/* Product Detail Banner */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">
                    Spesifikasi Produk Knalpot
                  </span>
                  <div className="text-base font-bold text-zinc-100 mt-1">{selectedOrder.productName}</div>
                  <div className="text-zinc-400 mt-1 leading-relaxed">{selectedOrder.exhaustSpecs}</div>

                  {selectedOrder.notes && (
                    <div className="mt-3 p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300">
                      <span className="font-semibold text-amber-400">Instruksi Khusus: </span>
                      {selectedOrder.notes}
                    </div>
                  )}
                </div>

                {/* Customer & Workshop Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Data Pemesan</span>
                    <div className="font-bold text-zinc-100 mt-1">{selectedOrder.customerName}</div>
                    {selectedOrder.workshopName && (
                      <div className="text-zinc-400 text-xs mt-0.5">{selectedOrder.workshopName}</div>
                    )}
                    <div className="text-zinc-400 font-mono mt-1">{selectedOrder.customerPhone}</div>
                    <div className="mt-2">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {selectedOrder.customerRole}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                      Status Logistik & SLA
                    </span>
                    <div className="font-bold text-amber-400 mt-1">{selectedOrder.status}</div>
                    <div className="text-zinc-400 mt-0.5">Target Kirim: {selectedOrder.targetDispatchDate}</div>
                    <div className="text-zinc-500 text-[11px] mt-1 font-mono">SLA: {selectedOrder.slaLabel}</div>
                    {selectedOrder.trackingNumber && (
                      <div className="mt-2 font-mono text-[11px] text-zinc-300 bg-zinc-900 p-1.5 rounded border border-zinc-800">
                        {selectedOrder.courier}: {selectedOrder.trackingNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Total Tagihan Manufaktur</span>
                    <span className="font-mono text-sm font-bold text-zinc-100">
                      {formatIDR(selectedOrder.totalAmount)}
                    </span>
                  </div>
                  {selectedOrder.downPaymentAmount !== undefined && selectedOrder.downPaymentAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-zinc-400 mt-1">
                      <span>Uang Muka (DP) Terbayar</span>
                      <span className="font-mono text-xs text-zinc-300">
                        {formatIDR(selectedOrder.downPaymentAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-zinc-400 mt-2 pt-2 border-t border-zinc-800">
                    <span>Status Pembayaran</span>
                    <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <a
                    href={buildWhatsAppOrderUrl(selectedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Chat Pelanggan (WhatsApp)</span>
                  </a>

                  <div className="flex items-center justify-end gap-2">
                    {selectedOrder.status !== 'Selesai' && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = selectedOrder;
                          setSelectedOrder(null);
                          handleAdvanceClick(target);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition"
                      >
                        <ArrowRight className="h-4 w-4" />
                        <span>Perbarui Status Alur</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
