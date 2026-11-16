'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  RefreshCw,
  ShoppingBag,
  Upload,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  GripVertical,
} from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import { useNotice, useDoubleSafetyAction, ACTION_PRESETS } from '@/shared/components';
import { cn } from '@/shared/utils/cn';
import { PRODUCTS, CATEGORY_LABELS } from '@/shared/lib/products';
import type { HomeNewArrivalItem, HomeSectionHeader } from '../types';
import {
  AdminModalSubmitButton,
  useModalSubmit,
  MODAL_INPUT_CLASS,
} from './AdminModalSubmit';

export const NEW_ARRIVAL_NOTICE_SOURCE = 'Produk Beranda';
const MAX_ACTIVE_SLOTS = 4;

interface NewArrivalFormData {
  product_id: string;
  badge_text: string;
  name: string;
  category_label: string;
  inlet: string;
  material: string;
  price_display: string;
  image_url: string;
  href: string;
  is_active: boolean;
}

const INITIAL_FORM: NewArrivalFormData = {
  product_id: '',
  badge_text: 'NEW ARRIVAL',
  name: '',
  category_label: '',
  inlet: '',
  material: '',
  price_display: '',
  image_url: '',
  href: '',
  is_active: true,
};

function validateNewArrivalForm(form: NewArrivalFormData): string | null {
  if (!form.product_id.trim()) return 'Pilih produk dari katalog atau isi Product ID.';
  if (!form.name.trim()) return 'Nama produk wajib diisi.';
  if (!form.category_label.trim()) return 'Label kategori wajib diisi.';
  if (!form.price_display.trim()) return 'Tampilan harga wajib diisi.';
  if (!form.image_url.trim()) return 'Unggah gambar produk atau masukkan URL gambar.';
  if (!form.href.trim()) return 'Link detail produk (href) wajib diisi.';
  return null;
}

interface NewArrivalModalProps {
  readonly isOpen: boolean;
  readonly editingItem: HomeNewArrivalItem | null;
  readonly formData: NewArrivalFormData;
  readonly activeCount: number;
  readonly isUploading: boolean;
  readonly dragActive: boolean;
  readonly previewError: boolean;
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.FormEvent) => Promise<boolean>;
  readonly onChangeForm: React.Dispatch<React.SetStateAction<NewArrivalFormData>>;
  readonly onSetPreviewError: (err: boolean) => void;
  readonly onDrag: (e: React.DragEvent) => void;
  readonly onDrop: (e: React.DragEvent) => void;
  readonly onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function NewArrivalModal({
  isOpen,
  editingItem,
  formData,
  activeCount,
  isUploading,
  dragActive,
  previewError,
  fileInputRef,
  onClose,
  onSubmit,
  onChangeForm,
  onSetPreviewError,
  onDrag,
  onDrop,
  onFileChange,
}: Readonly<NewArrivalModalProps>) {
  const { submitState, isCloseLocked, handleFormSubmit } = useModalSubmit({
    isOpen,
    isUploading,
    resetTrigger: editingItem,
    onClose,
    onSubmit,
  });

  const handleSelectCatalog = (catalogId: string) => {
    if (!catalogId) return;
    const prod = PRODUCTS.find((p) => p.id === catalogId);
    if (!prod) return;

    const catLabel = CATEGORY_LABELS[prod.category] ?? prod.category;
    onChangeForm((prev) => ({
      ...prev,
      product_id: prod.id,
      name: prod.name,
      category_label: catLabel,
      inlet: prod.inlet ?? '',
      material: prod.material ?? '',
      price_display: prod.price,
      image_url: prod.image,
      href: `/products/${prod.id}`,
    }));
    onSetPreviewError(false);
  };

  const isSlotFull = !editingItem?.is_active && activeCount >= MAX_ACTIVE_SLOTS;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Tutup modal produk beranda"
        onClick={isCloseLocked ? undefined : onClose}
        disabled={isCloseLocked}
        className="fixed inset-0 w-full h-full bg-zinc-950/45 backdrop-blur-xs transition-opacity cursor-default"
      />

      {/* Dialog Box Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="arrival-modal-title"
        className="relative flex flex-col w-full max-w-xl max-h-[90vh] overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-950 shadow-2xl"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-zinc-200 px-5 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h3 id="arrival-modal-title" className="font-semibold text-sm text-zinc-950">
              {editingItem ? 'Edit Produk Unggulan Beranda' : 'Tambah Produk ke Beranda'}
            </h3>
            <p className="text-[11px] text-zinc-500">
              Pilih produk dari katalog resmi untuk auto-fill, atau sesuaikan spesifikasi tampilan beranda.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCloseLocked}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition disabled:opacity-40"
            title="Tutup (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto scrollbar-none p-5 sm:p-6 space-y-4 text-xs">
            {/* Catalog Picker Select */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-2">
              <label htmlFor="catalog-picker" className="block text-[11px] font-semibold text-zinc-800">
                Ambil dari Katalog Resmi (Auto-fill Cepat)
              </label>
              <select
                id="catalog-picker"
                value={formData.product_id}
                onChange={(e) => handleSelectCatalog(e.target.value)}
                className={cn(MODAL_INPUT_CLASS, 'cursor-pointer bg-white')}
              >
                <option value="">-- Pilih Produk Katalog Resmi --</option>
                {PRODUCTS.map((p) => {
                  const cat = CATEGORY_LABELS[p.category] ?? p.category;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} [{cat}] — {p.price} ({p.id})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Product ID & Badge Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="prod-id" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Product ID (Slug / Katalog)
                </label>
                <input
                  id="prod-id"
                  type="text"
                  required
                  placeholder="kdv2-vario125"
                  value={formData.product_id}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, product_id: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'font-mono')}
                />
              </div>

              <div>
                <label htmlFor="prod-badge" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Badge Text (Label Kartu)
                </label>
                <input
                  id="prod-badge"
                  type="text"
                  placeholder="NEW ARRIVAL / BEST SELLER"
                  value={formData.badge_text}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, badge_text: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'font-mono uppercase font-semibold')}
                />
              </div>
            </div>

            {/* Name & Category Label */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="prod-name" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Nama Produk
                </label>
                <input
                  id="prod-name"
                  type="text"
                  required
                  placeholder="Kondoman V2"
                  value={formData.name}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'font-semibold')}
                />
              </div>

              <div>
                <label htmlFor="prod-cat" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Label Kategori
                </label>
                <input
                  id="prod-cat"
                  type="text"
                  required
                  placeholder="Kondoman"
                  value={formData.category_label}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, category_label: e.target.value }))}
                  className={MODAL_INPUT_CLASS}
                />
              </div>
            </div>

            {/* Inlet, Material, & Display Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="prod-inlet" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Ukuran Inlet (Opsional)
                </label>
                <input
                  id="prod-inlet"
                  type="text"
                  placeholder="38MM"
                  value={formData.inlet}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, inlet: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'font-mono')}
                />
              </div>

              <div>
                <label htmlFor="prod-material" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Material (Opsional)
                </label>
                <input
                  id="prod-material"
                  type="text"
                  placeholder="Stainless 304"
                  value={formData.material}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, material: e.target.value }))}
                  className={MODAL_INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="prod-price" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Tampilan Harga
                </label>
                <input
                  id="prod-price"
                  type="text"
                  required
                  placeholder="Rp 1.850.000"
                  value={formData.price_display}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, price_display: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'font-semibold')}
                />
              </div>
            </div>

            {/* Target Link (href) */}
            <div>
              <label htmlFor="prod-href" className="block text-[11px] font-medium text-zinc-700 mb-1">
                URL Detail Produk (href)
              </label>
              <input
                id="prod-href"
                type="text"
                required
                placeholder="/products/kdv2-vario125"
                value={formData.href}
                onChange={(e) => onChangeForm((prev) => ({ ...prev, href: e.target.value }))}
                className={cn(MODAL_INPUT_CLASS, 'font-mono')}
              />
            </div>

            {/* Image Upload Dropzone & Manual URL Input */}
            <div className="space-y-2">
              <label className="block text-[11px] font-medium text-zinc-700">
                Foto Produk Beranda (Rasio Square / 4:3)
              </label>

              {/* File Dropzone */}
              <button
                type="button"
                onDragEnter={onDrag}
                onDragOver={onDrag}
                onDragLeave={onDrag}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'w-full flex flex-col items-center justify-center p-4 border border-dashed rounded-lg cursor-pointer transition text-center focus:outline-none focus:ring-1 focus:ring-zinc-900',
                  dragActive
                    ? 'border-zinc-900 bg-zinc-100'
                    : 'border-zinc-300 bg-zinc-50/70 hover:border-zinc-400 hover:bg-zinc-100/50'
                )}
                aria-label="Unggah foto produk"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onFileChange}
                  className="hidden"
                />
                {isUploading ? (
                  <div className="flex items-center gap-2 text-zinc-600">
                    <RefreshCw className="h-4 w-4 animate-spin text-zinc-900" />
                    <span className="font-medium text-zinc-900">Mengunggah foto produk...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-zinc-400 mb-1" />
                    <span className="text-zinc-900 font-medium">Klik atau seret foto produk ke sini</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      Maksimal 5MB (Format JPEG, PNG, atau WebP)
                    </span>
                  </>
                )}
              </button>

              {/* Manual URL Input */}
              <div>
                <input
                  type="text"
                  placeholder="Atau tempel URL gambar (/assets/products/...)"
                  value={formData.image_url}
                  onChange={(e) => {
                    onChangeForm((prev) => ({ ...prev, image_url: e.target.value }));
                    onSetPreviewError(false);
                  }}
                  className={cn(MODAL_INPUT_CLASS, 'font-mono text-[11px]')}
                />
              </div>

              {/* Preview Thumbnail */}
              {formData.image_url && (
                <div className="flex items-center gap-3 p-2 rounded-lg border border-zinc-200 bg-zinc-50">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-900">
                    {previewError ? (
                      <div className="flex h-full w-full items-center justify-center text-zinc-500">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    ) : (
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={() => onSetPreviewError(true)}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] text-zinc-700 truncate">
                      {formData.image_url}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {previewError ? 'Gagal memuat URL gambar' : 'Foto siap ditayangkan'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active Toggle & 4-Slot Guard Notification */}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <input
                  id="arrival-active"
                  type="checkbox"
                  disabled={isSlotFull && !formData.is_active}
                  checked={formData.is_active}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-950 accent-zinc-950 focus:ring-zinc-950/20 cursor-pointer disabled:opacity-40"
                />
                <label
                  htmlFor="arrival-active"
                  className={cn(
                    'text-xs cursor-pointer select-none',
                    isSlotFull && !formData.is_active ? 'text-zinc-400' : 'text-zinc-700'
                  )}
                >
                  Tayangkan aktif pada showcase produk beranda storefront
                </label>
              </div>
              {isSlotFull && (
                <p className="mt-1 text-[11px] text-zinc-500 pl-6">
                  Slot tayang aktif penuh (4/4). Simpan sebagai draf, lalu nonaktifkan salah satu produk yang ada untuk menayangkannya.
                </p>
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="shrink-0 border-t border-zinc-200 px-5 sm:px-6 py-3.5 bg-zinc-50 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCloseLocked}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-lg transition disabled:opacity-40"
            >
              Batal
            </button>
            <AdminModalSubmitButton
              isCloseLocked={isCloseLocked}
              submitState={submitState}
              idleLabel={editingItem ? 'Simpan Perubahan' : 'Tambah Produk'}
              savedLabel="Tersimpan!"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

interface NewArrivalSortableRowProps {
  readonly item: HomeNewArrivalItem;
  readonly index: number;
  readonly total: number;
  readonly reordering: boolean;
  readonly onKeyboardMove: (index: number, direction: 'up' | 'down') => void;
  readonly onToggle: (id: string) => void;
  readonly onEdit: (item: HomeNewArrivalItem) => void;
  readonly onDelete: (item: HomeNewArrivalItem) => void;
  readonly onDragEnd: () => void;
}

function NewArrivalSortableRow({
  item,
  index,
  total,
  reordering,
  onKeyboardMove,
  onToggle,
  onEdit,
  onDelete,
  onDragEnd,
}: Readonly<NewArrivalSortableRowProps>) {
  const dragControls = useDragControls();

  const handleGripKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowUp' && index > 0 && !reordering) {
      e.preventDefault();
      onKeyboardMove(index, 'up');
    } else if (e.key === 'ArrowDown' && index < total - 1 && !reordering) {
      e.preventDefault();
      onKeyboardMove(index, 'down');
    }
  };

  const containerClass = cn(
    'group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border p-3 sm:px-4 sm:py-3 transition-colors duration-150 select-none',
    item.is_active
      ? 'border-zinc-200 bg-white hover:border-zinc-300'
      : 'border-zinc-200 bg-zinc-50/70 opacity-75'
  );

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      whileDrag={{
        scale: 1.01,
        boxShadow: '0 14px 28px -8px rgba(9, 9, 11, 0.14)',
        zIndex: 30,
      }}
      transition={{ layout: { type: 'spring', stiffness: 420, damping: 32 } }}
      className={containerClass}
    >
      {/* Left Section: Drag Grip, Number, Compact Image (Standardized to Hero Carousel) */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              dragControls.start(e);
            }}
            onKeyDown={handleGripKeyDown}
            disabled={reordering}
            className="cursor-grab active:cursor-grabbing rounded-md p-1 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 touch-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 transition-colors"
            title="Tahan dan seret untuk memindahkan urutan (atau gunakan panah keyboard)"
            aria-label={`Seret atau gunakan panah atas/bawah untuk memindahkan produk ${item.name}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <span className="w-5 font-mono text-[11px] font-semibold text-zinc-500 tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Compact Thumbnail */}
        <div className="relative aspect-square w-14 h-14 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-900 shadow-2xs">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-500">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>

      {/* Center Section: Product Name, Specs & Price */}
      <div className="min-w-0 flex-1 space-y-0.5 sm:px-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 flex-wrap">
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-700 font-semibold uppercase">
            {item.category_label}
          </span>
          {item.badge_text && (
            <span className="rounded bg-[#0A0A0B] px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider text-zinc-200 border border-white/10 uppercase">
              {item.badge_text}
            </span>
          )}
          {item.inlet && <span>· {item.inlet}</span>}
          {item.material && <span className="hidden sm:inline">· {item.material}</span>}
        </div>

        <h3 className="font-semibold text-sm text-zinc-950 truncate">
          {item.name}
        </h3>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-950 font-sans tabular-nums">
            {item.price_display}
          </span>
          <span className="text-zinc-300">·</span>
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <LinkIcon className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[180px] font-mono text-[10px]">
              {item.href}
            </span>
          </div>
        </div>
      </div>

      {/* Right Section: Status Toggle Switch & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-zinc-500 min-w-[50px] text-right">
            {item.is_active ? 'Tayang' : 'Draft'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={item.is_active}
            onClick={() => onToggle(item.id)}
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
              item.is_active ? 'bg-zinc-900' : 'bg-zinc-300'
            )}
            aria-label={`Ubah status aktif produk ${item.name}`}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                item.is_active ? 'translate-x-4' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        {/* Actions Divider & Buttons */}
        <div className="flex items-center gap-1 border-l border-zinc-200 pl-2 sm:pl-3">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="group/btn inline-flex items-center gap-1.5 h-7 px-2 rounded-lg border border-transparent text-zinc-500 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:border-zinc-950 focus-visible:bg-zinc-100 focus-visible:text-zinc-950 focus-visible:outline-none transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            title="Edit produk beranda"
            aria-label={`Edit produk ${item.name}`}
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-medium opacity-0 group-hover/btn:max-w-[40px] group-hover/btn:opacity-100 group-focus-visible/btn:max-w-[40px] group-focus-visible/btn:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none">
              Edit
            </span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(item)}
            className="group/btn inline-flex items-center gap-1.5 h-7 px-2 rounded-lg border border-transparent text-zinc-400 hover:border-zinc-900 hover:bg-zinc-950 hover:text-white focus-visible:border-zinc-900 focus-visible:bg-zinc-950 focus-visible:text-white focus-visible:outline-none transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            title="Hapus produk beranda"
            aria-label={`Hapus produk ${item.name}`}
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-medium opacity-0 group-hover/btn:max-w-[45px] group-hover/btn:opacity-100 group-focus-visible/btn:max-w-[45px] group-focus-visible/btn:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none">
              Hapus
            </span>
          </button>
        </div>
      </div>
    </Reorder.Item>
  );
}

interface NewArrivalManagementPanelProps {
  readonly className?: string;
}

export function NewArrivalManagementPanel({ className }: Readonly<NewArrivalManagementPanelProps>) {
  const { notify } = useNotice();

  const [items, setItems] = useState<HomeNewArrivalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);

  const latestOrderRef = useRef<HomeNewArrivalItem[]>(items);
  const lastCommittedRef = useRef<HomeNewArrivalItem[]>(items);

  const persistOrder = useCallback(
    async (orderedItems: HomeNewArrivalItem[], fallbackSnapshot: HomeNewArrivalItem[]) => {
      const normalized = orderedItems.map((it, idx) => ({
        ...it,
        sort_order: idx,
      }));
      setItems(normalized);
      latestOrderRef.current = normalized;
      setReordering(true);
      try {
        const res = await fetch('/api/admin/home/new-arrivals/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds: normalized.map((it) => it.id) }),
        });

        if (!res.ok) {
          throw new Error('Gagal memperbarui urutan di server.');
        }

        lastCommittedRef.current = normalized;
        notify?.success('Urutan Diperbarui', 'Urutan produk beranda berhasil disinkronkan.', {
          source: NEW_ARRIVAL_NOTICE_SOURCE,
          action: 'reorder',
        });
      } catch (err: unknown) {
        setItems(fallbackSnapshot);
        latestOrderRef.current = fallbackSnapshot;
        const msg = err instanceof Error ? err.message : 'Gagal mengubah urutan.';
        notify?.error('Gagal Reorder', msg, {
          source: NEW_ARRIVAL_NOTICE_SOURCE,
        });
      } finally {
        setReordering(false);
      }
    },
    [notify]
  );

  const handleDragReorder = (nextOrder: HomeNewArrivalItem[]) => {
    latestOrderRef.current = nextOrder;
    setItems(nextOrder);
  };

  const handleDragEnd = () => {
    const nextIds = latestOrderRef.current.map((it) => it.id).join(',');
    const prevIds = lastCommittedRef.current.map((it) => it.id).join(',');
    if (nextIds !== prevIds && !reordering) {
      void persistOrder(latestOrderRef.current, lastCommittedRef.current);
    }
  };

  const handleKeyboardMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length || reordering) return;

    const fallback = [...items];
    const swapped = [...items];
    const temp = swapped[index];
    swapped[index] = swapped[targetIndex];
    swapped[targetIndex] = temp;

    void persistOrder(swapped, fallback);
  };

  // Section 3 Header Editor state
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [headerData, setHeaderData] = useState<HomeSectionHeader>({
    tag: 'New Arrival',
    title: 'Fresh out of the workshop.',
    linkLabel: 'All Products ↗',
    linkHref: '/catalog',
  });
  const [isSavingHeader, setIsSavingHeader] = useState(false);

  // Modal & File Upload state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HomeNewArrivalItem | null>(null);
  const [formData, setFormData] = useState<NewArrivalFormData>(INITIAL_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load items and headers on mount
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [arrivalsRes, headersRes] = await Promise.all([
        fetch('/api/admin/home/new-arrivals'),
        fetch('/api/admin/home/headers'),
      ]);

      if (arrivalsRes.ok) {
        const arrivalsData = (await arrivalsRes.json()) as HomeNewArrivalItem[];
        const sorted = [...arrivalsData].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setItems(sorted);
        latestOrderRef.current = sorted;
        lastCommittedRef.current = sorted;
      }

      if (headersRes.ok) {
        const headersJson = await headersRes.json();
        if (headersJson?.section3) {
          setHeaderData({
            tag: headersJson.section3.tag ?? 'New Arrival',
            title: headersJson.section3.title ?? 'Fresh out of the workshop.',
            linkLabel: headersJson.section3.linkLabel ?? 'All Products ↗',
            linkHref: headersJson.section3.linkHref ?? '/catalog',
          });
        }
      }
    } catch {
      notify?.error('Gagal Memuat Data', 'Tidak dapat mengambil data produk beranda.', {
        source: NEW_ARRIVAL_NOTICE_SOURCE,
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Save Header Section 3
  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHeader(true);
    try {
      const res = await fetch('/api/admin/home/headers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section3: headerData }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message ?? 'Gagal menyimpan header seksi 3.');
      }

      notify?.success('Header Diperbarui', 'Judul dan link New Arrival berhasil disimpan.', {
        source: NEW_ARRIVAL_NOTICE_SOURCE,
        action: 'update_header',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan header.';
      notify?.error('Gagal Menyimpan', msg, {
        source: NEW_ARRIVAL_NOTICE_SOURCE,
      });
    } finally {
      setIsSavingHeader(false);
    }
  };



  // Toggle Active Status with Max 4 Guard
  const handleToggle = async (id: string) => {
    const target = items.find((it) => it.id === id);
    if (!target) return;

    const prevActive = target.is_active;
    const nextActive = !prevActive;

    // Check 4-slot limit when activating
    if (nextActive) {
      const currentActiveCount = items.filter((it) => it.is_active).length;
      if (currentActiveCount >= MAX_ACTIVE_SLOTS) {
        notify?.warning(
          'Batas Maksimal Slot',
          'Maksimal 4 produk yang dapat ditayangkan aktif di beranda. Nonaktifkan salah satu produk terlebih dahulu.',
          {
            source: NEW_ARRIVAL_NOTICE_SOURCE,
          }
        );
        return;
      }
    }

    // Optimistic update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, is_active: nextActive } : it))
    );

    try {
      const res = await fetch(`/api/admin/home/new-arrivals/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Gagal memperbarui status produk di server.');
      }

      const updated = (await res.json()) as HomeNewArrivalItem;
      setItems((prev) => {
        const next = prev.map((it) => (it.id === id ? updated : it));
        latestOrderRef.current = next;
        lastCommittedRef.current = next;
        return next;
      });
      const statusText = nextActive ? 'diaktifkan' : 'dinonaktifkan';
      notify?.success('Status Berubah', `Produk "${target.name}" telah ${statusText}.`, {
        source: NEW_ARRIVAL_NOTICE_SOURCE,
        action: 'toggle',
      });
    } catch (err: unknown) {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, is_active: prevActive } : it))
      );
      const msg = err instanceof Error ? err.message : 'Gagal mengubah status aktif.';
      notify?.error('Gagal Mengubah Status', msg, {
        source: NEW_ARRIVAL_NOTICE_SOURCE,
      });
    }
  };

  // Delete via Double Safety Action
  const { executeAction: executeDeleteItem } = useDoubleSafetyAction<HomeNewArrivalItem>({
    preset: ACTION_PRESETS.NEW_ARRIVAL_DELETE,
    noticeSource: NEW_ARRIVAL_NOTICE_SOURCE,
    getItemPreview: (item) => item.name,
    onOptimisticExecute: (item) => {
      setItems((prev) => {
        const next = prev.filter((it) => it.id !== item.id);
        latestOrderRef.current = next;
        return next;
      });
    },
    onRestore: (item, originalIndex) => {
      setItems((prev) => {
        if (prev.some((it) => it.id === item.id)) return prev;
        const next = [...prev];
        const insertIdx =
          typeof originalIndex === 'number' && originalIndex >= 0 && originalIndex <= next.length
            ? originalIndex
            : next.length;
        next.splice(insertIdx, 0, item);
        latestOrderRef.current = next;
        lastCommittedRef.current = next;
        return next;
      });
    },
    onCommit: async (item) => {
      const res = await fetch(`/api/admin/home/new-arrivals/${item.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Gagal menghapus produk beranda dari server.');
      }
      latestOrderRef.current = latestOrderRef.current.filter((it) => it.id !== item.id);
      lastCommittedRef.current = latestOrderRef.current;
    },
  });

  const handleDelete = (item: HomeNewArrivalItem) => {
    const index = items.findIndex((it) => it.id === item.id);
    void executeDeleteItem(item, index);
  };

  // File Upload
  const handleFileUpload = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      notify?.error('Format Tidak Didukung', 'Gunakan file format JPG, PNG, atau WebP.', {
        source: NEW_ARRIVAL_NOTICE_SOURCE,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify?.error('Ukuran Melebihi Batas', 'Ukuran foto maksimal 5MB.', {
        source: NEW_ARRIVAL_NOTICE_SOURCE,
      });
      return;
    }

    setIsUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message ?? 'Gagal mengunggah gambar ke server.');
      }

      const result = await res.json();
      setFormData((prev) => ({ ...prev, image_url: result.url }));
      setPreviewError(false);
      notify?.success('Upload Berhasil', 'Foto produk berhasil diunggah.', {
        source: NEW_ARRIVAL_NOTICE_SOURCE,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto.';
      notify?.error('Gagal Mengunggah', msg, {
        source: NEW_ARRIVAL_NOTICE_SOURCE,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files?.[0]) {
      void handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      void handleFileUpload(e.target.files[0]);
    }
  };

  // Open Modal Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setPreviewError(false);
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (item: HomeNewArrivalItem) => {
    setEditingItem(item);
    setFormData({
      product_id: item.product_id,
      badge_text: item.badge_text || 'NEW ARRIVAL',
      name: item.name,
      category_label: item.category_label,
      inlet: item.inlet ?? '',
      material: item.material ?? '',
      price_display: item.price_display,
      image_url: item.image_url,
      href: item.href,
      is_active: item.is_active,
    });
    setPreviewError(false);
    setIsModalOpen(true);
  };

  // Form Submit (Create / Edit)
  const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();

    const valError = validateNewArrivalForm(formData);
    if (valError) {
      notify?.error('Validasi Gagal', valError, {
        source: NEW_ARRIVAL_NOTICE_SOURCE,
      });
      return false;
    }

    // Guard 4 slots
    if (formData.is_active) {
      const activeCount = Array.isArray(items) ? items.filter((it) => it.is_active).length : 0;
      const isAlreadyActive = editingItem?.is_active === true;
      if (!isAlreadyActive && activeCount >= MAX_ACTIVE_SLOTS) {
        notify?.warning(
          'Batas Maksimal Slot',
          'Maksimal 4 produk yang dapat ditayangkan aktif di beranda. Nonaktifkan status aktif sebelum menyimpan.',
          { source: NEW_ARRIVAL_NOTICE_SOURCE }
        );
        return false;
      }
    }

    const payload = {
      product_id: formData.product_id.trim(),
      badge_text: formData.badge_text.trim() || undefined,
      name: formData.name.trim(),
      category_label: formData.category_label.trim(),
      inlet: formData.inlet.trim() || undefined,
      material: formData.material.trim() || undefined,
      price_display: formData.price_display.trim(),
      image_url: formData.image_url.trim(),
      href: formData.href.trim(),
      is_active: formData.is_active,
    };

    try {
      if (editingItem) {
        const res = await fetch(`/api/admin/home/new-arrivals/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message ?? 'Gagal memperbarui produk beranda.');
        }

        const updated = (await res.json()) as HomeNewArrivalItem;
        setItems((prev) => {
          const next = prev.map((it) => (it.id === updated.id ? updated : it));
          latestOrderRef.current = next;
          lastCommittedRef.current = next;
          return next;
        });
        notify?.success('Produk Diperbarui', `Produk "${updated.name}" berhasil disimpan.`, {
          source: NEW_ARRIVAL_NOTICE_SOURCE,
          action: 'update',
        });
      } else {
        const res = await fetch('/api/admin/home/new-arrivals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message ?? 'Gagal menambahkan produk beranda baru.');
        }

        const created = (await res.json()) as HomeNewArrivalItem;
        setItems((prev) => {
          const next = [...prev, created].sort((a, b) => a.sort_order - b.sort_order);
          latestOrderRef.current = next;
          lastCommittedRef.current = next;
          return next;
        });
        notify?.success('Produk Ditambahkan', `Produk "${created.name}" berhasil dibuat.`, {
          source: NEW_ARRIVAL_NOTICE_SOURCE,
          action: 'create',
        });
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      notify?.error('Gagal Menyimpan', msg, {
        source: NEW_ARRIVAL_NOTICE_SOURCE,
      });
      return false;
    }
  };

  const activeCount = Array.isArray(items) ? items.filter((it) => it.is_active).length : 0;

  return (
    <section
      aria-label="Manajemen Produk Beranda"
      className={cn('space-y-6', className)}
    >
      {/* 1. Header & Section 3 Settings Editor */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsHeaderExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 sm:px-5 hover:bg-zinc-50/70 transition text-left"
          aria-expanded={isHeaderExpanded}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-950">
                Pengaturan Header Seksi (New Arrival Showcase)
              </h2>
              <p className="text-[11px] text-zinc-500">
                Atur tagline, judul utama, serta link CTA tujuan pada showcase produk beranda.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="text-[11px] hidden sm:inline">
              {isHeaderExpanded ? 'Sembunyikan' : 'Kustomisasi'}
            </span>
            {isHeaderExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {isHeaderExpanded && (
          <form
            onSubmit={handleSaveHeader}
            className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50/50 space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sec3-tag"
                  className="block text-[11px] font-medium text-zinc-700 mb-1"
                >
                  Tagline Seksi (Tag)
                </label>
                <input
                  id="sec3-tag"
                  type="text"
                  maxLength={50}
                  value={headerData.tag ?? ''}
                  onChange={(e) =>
                    setHeaderData((prev) => ({ ...prev, tag: e.target.value }))
                  }
                  placeholder="New Arrival"
                  className={cn(MODAL_INPUT_CLASS, 'font-medium bg-white')}
                />
              </div>

              <div>
                <label
                  htmlFor="sec3-title"
                  className="block text-[11px] font-medium text-zinc-700 mb-1"
                >
                  Judul Utama Seksi
                </label>
                <input
                  id="sec3-title"
                  type="text"
                  maxLength={150}
                  value={headerData.title ?? ''}
                  onChange={(e) =>
                    setHeaderData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Fresh out of the workshop."
                  className={cn(MODAL_INPUT_CLASS, 'font-medium bg-white')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sec3-link-label"
                  className="block text-[11px] font-medium text-zinc-700 mb-1"
                >
                  Label Link CTA
                </label>
                <input
                  id="sec3-link-label"
                  type="text"
                  maxLength={50}
                  value={headerData.linkLabel ?? ''}
                  onChange={(e) =>
                    setHeaderData((prev) => ({ ...prev, linkLabel: e.target.value }))
                  }
                  placeholder="All Products ↗"
                  className={cn(MODAL_INPUT_CLASS, 'font-medium bg-white')}
                />
              </div>

              <div>
                <label
                  htmlFor="sec3-link-href"
                  className="block text-[11px] font-medium text-zinc-700 mb-1"
                >
                  URL Link CTA (href)
                </label>
                <input
                  id="sec3-link-href"
                  type="text"
                  maxLength={255}
                  value={headerData.linkHref ?? ''}
                  onChange={(e) =>
                    setHeaderData((prev) => ({ ...prev, linkHref: e.target.value }))
                  }
                  placeholder="/catalog"
                  className={cn(MODAL_INPUT_CLASS, 'font-mono bg-white')}
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSavingHeader}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#141416] hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition shadow-xs disabled:opacity-40"
              >
                {isSavingHeader ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Simpan Header</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Minimalist Toolbar with 4-Slot Active Guard Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md border',
              activeCount >= MAX_ACTIVE_SLOTS
                ? 'bg-zinc-950 text-white border-zinc-800'
                : 'bg-zinc-100 text-zinc-950 border-zinc-200'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                activeCount >= MAX_ACTIVE_SLOTS ? 'bg-zinc-200' : 'bg-zinc-950'
              )}
              aria-hidden="true"
            />
            {`${activeCount} / ${MAX_ACTIVE_SLOTS} Slot Aktif`}
          </span>
          <span className="text-zinc-400">({items.length} total produk terdaftar)</span>
          <span className="hidden sm:inline text-zinc-300">·</span>
          <span className="hidden sm:inline text-[11px]">
            Hanya maksimal 4 produk dengan status aktif yang akan ditampilkan di storefront
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#141416] hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition shadow-xs active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* 3. Cards Grid / List Canvas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-16 text-center shadow-xs">
          <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
          <p className="mt-3 text-xs text-zinc-500">Memuat produk beranda...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-16 text-center shadow-xs">
          <ShoppingBag className="h-10 w-10 text-zinc-300" />
          <h3 className="mt-3 text-sm font-semibold text-zinc-950">
            Belum Ada Produk Beranda
          </h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm">
            Tampilkan 4 produk unggulan atau rilisan terbaru di halaman utama ARM Exhaust.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#141416] hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Produk Pertama</span>
          </button>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={handleDragReorder}
          className="flex flex-col gap-2.5"
        >
          {items.map((item, index) => (
            <NewArrivalSortableRow
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              reordering={reordering}
              onKeyboardMove={handleKeyboardMove}
              onToggle={(id) => void handleToggle(id)}
              onEdit={handleOpenEdit}
              onDelete={(target) => void handleDelete(target)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </Reorder.Group>
      )}

      {/* 4. Modal Form (Create / Edit) */}
      <NewArrivalModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        formData={formData}
        activeCount={activeCount}
        isUploading={isUploading}
        dragActive={dragActive}
        previewError={previewError}
        fileInputRef={fileInputRef}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        onChangeForm={setFormData}
        onSetPreviewError={setPreviewError}
        onDrag={handleDrag}
        onDrop={handleDrop}
        onFileChange={handleFileChange}
      />
    </section>
  );
}
