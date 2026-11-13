'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Reorder, AnimatePresence, motion, useDragControls } from 'framer-motion';
import {
  Plus,
  GripVertical,
  Upload,
  X,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { useNotice, useConfirm } from '@/shared/components';
import { cn } from '@/shared/utils/cn';
import type { HeroSlide } from '../types';
import {
  AdminModalSubmitButton,
  useModalSubmit,
  MODAL_INPUT_CLASS,
  type SubmitVisualState,
} from './AdminModalSubmit';

export const HERO_CATEGORIES = ['PRODUK', 'PROMO', 'ACARA', 'WORKSHOP'] as const;
export type HeroCategory = (typeof HERO_CATEGORIES)[number];
export const HERO_NOTICE_SOURCE = 'Hero Carousel';
export type { SubmitVisualState };

interface HeroFormData {
  category: string;
  tag: string;
  title: string;
  strip_title: string;
  href: string;
  image_url: string;
  is_active: boolean;
}

const INITIAL_FORM: HeroFormData = {
  category: 'PRODUK',
  tag: '',
  title: '',
  strip_title: '',
  href: '',
  image_url: '',
  is_active: true,
};

export { MODAL_INPUT_CLASS };

function formatSlideNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}

function validateHeroForm(form: HeroFormData): string | null {
  if (!form.title.trim()) return 'Judul slide wajib diisi.';
  if (!form.tag.trim()) return 'Tag slide wajib diisi.';
  if (!form.strip_title.trim()) return 'Strip title slide wajib diisi.';
  if (!form.href.trim()) return 'Link tujuan (href) slide wajib diisi.';
  if (!form.image_url.trim()) return 'Unggah gambar atau isi URL gambar slide.';
  return null;
}

interface HeroSortableRowProps {
  readonly slide: HeroSlide;
  readonly index: number;
  readonly total: number;
  readonly isFocused: boolean;
  readonly isDeleting: boolean;
  readonly reordering: boolean;
  readonly onFocusSlide: (id: string) => void;
  readonly onDragEnd: () => void;
  readonly onKeyboardMove: (index: number, direction: 'up' | 'down') => void;
  readonly onToggle: (slideId: string) => void;
  readonly onEdit: (slide: HeroSlide) => void;
  readonly onDelete: (slide: HeroSlide) => void;
}

function HeroSortableRow({
  slide,
  index,
  total,
  isFocused,
  isDeleting,
  reordering,
  onFocusSlide,
  onDragEnd,
  onKeyboardMove,
  onToggle,
  onEdit,
  onDelete,
}: Readonly<HeroSortableRowProps>) {
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
    'group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 transition-colors duration-150 select-none',
    isFocused
      ? 'border-zinc-900 bg-white shadow-xs'
      : 'border-zinc-200 bg-white hover:border-zinc-300',
    !slide.is_active && 'bg-zinc-50 opacity-65'
  );

  return (
    <Reorder.Item
      value={slide}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      whileDrag={{
        scale: 1.01,
        boxShadow: '0 14px 28px -8px rgba(9, 9, 11, 0.14)',
        zIndex: 30,
      }}
      transition={{ layout: { type: 'spring', stiffness: 420, damping: 32 } }}
      onMouseEnter={() => onFocusSlide(slide.id)}
      className={containerClass}
    >
      {/* Left + Center: Grip, Index, Thumbnail & Typography */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Drag Grip + Order Index */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onPointerDown={(e) => {
              onFocusSlide(slide.id);
              dragControls.start(e);
            }}
            onKeyDown={handleGripKeyDown}
            disabled={reordering}
            className="cursor-grab active:cursor-grabbing rounded-md p-1 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 touch-none"
            aria-label={`Seret atau gunakan panah atas/bawah untuk memindahkan slide ${slide.title}`}
            title="Seret untuk urutkan (atau tekan panah atas/bawah)"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="w-5 font-mono text-[11px] font-semibold text-zinc-500 tabular-nums">
            {formatSlideNumber(index)}
          </span>
        </div>

        {/* Native Clickable Button for Thumbnail & Typography Preview Focus */}
        <button
          type="button"
          onClick={() => onFocusSlide(slide.id)}
          className="flex items-center gap-3.5 min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 rounded-lg"
        >
          {/* Clean 16:9 Thumbnail (No text overlay clutter) */}
          <div
            className={cn(
              'relative aspect-video w-24 sm:w-28 shrink-0 overflow-hidden rounded-lg bg-[#0E0E10] border transition-colors',
              isFocused ? 'border-zinc-900' : 'border-zinc-200'
            )}
          >
            {slide.image_url ? (
              <img
                src={slide.image_url}
                alt={slide.title}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-600">
                <ImageIcon className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Clean Minimal Typography Meta */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-zinc-500 truncate">
              <span className="font-semibold text-zinc-950/80">{slide.category}</span>
              <span className="text-zinc-300">/</span>
              <span className="truncate">{slide.tag}</span>
            </div>

            <h3 className="text-sm font-semibold tracking-tight text-zinc-950 truncate" title={slide.title}>
              {slide.title}
            </h3>

            <div className="flex items-center gap-2 text-[11px] text-zinc-500 truncate">
              <span className="truncate font-medium">{slide.strip_title}</span>
              <span className="text-zinc-300">—</span>
              <span className="font-mono text-[10px] text-zinc-500 truncate">{slide.href}</span>
            </div>
          </div>
        </button>
      </div>

      {/* Minimalist Action Rail (Switch + Text Buttons, Zero Icon Soup) */}
      <div className="flex items-center justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(slide)}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
            aria-label={`Edit slide ${slide.title}`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(slide)}
            disabled={isDeleting}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
            aria-label={`Hapus slide ${slide.title}`}
          >
            Hapus
          </button>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={slide.is_active}
          onClick={() => onToggle(slide.id)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/40',
            slide.is_active ? 'bg-[#141416]' : 'bg-zinc-300'
          )}
          aria-label={`Ubah status aktif slide ${slide.title}`}
          title={slide.is_active ? 'Tayang di Beranda' : 'Disembunyikan'}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200',
              slide.is_active ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>
    </Reorder.Item>
  );
}

interface HeroLivePreviewProps {
  readonly slides: HeroSlide[];
  readonly focusedSlide: HeroSlide | null;
  readonly onSelectSlide: (id: string) => void;
}

function HeroLivePreview({
  slides,
  focusedSlide,
  onSelectSlide,
}: Readonly<HeroLivePreviewProps>) {
  const activeSlides = slides.filter((s) => s.is_active);
  const previewSlide = focusedSlide ?? activeSlides[0] ?? slides[0] ?? null;

  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-[#0A0A0B] text-white overflow-hidden shadow-lg">
      {/* Minimal Stage Caption */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-900">
        <span className="font-mono text-[10px] tracking-widest uppercase text-zinc-400">
          Pratinjau Storefront
        </span>
        {previewSlide && (
          <span
            className={cn(
              'font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border',
              previewSlide.is_active
                ? 'border-zinc-700 bg-zinc-900 text-zinc-200'
                : 'border-zinc-800 bg-transparent text-zinc-500'
            )}
          >
            {previewSlide.is_active ? 'Tayang' : 'Nonaktif'}
          </span>
        )}
      </div>

      {/* 16:9 Hero Canvas Mirror */}
      <div className="relative aspect-video w-full bg-[#0E0E10] overflow-hidden">
        {previewSlide ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${previewSlide.id}-${previewSlide.image_url}`}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.4 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              {previewSlide.image_url ? (
                <img
                  src={previewSlide.image_url}
                  alt={previewSlide.title}
                  className={cn(
                    'h-full w-full object-cover transition-opacity duration-300',
                    !previewSlide.is_active && 'opacity-35 grayscale'
                  )}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-700">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}

              {/* Storefront Gradient Overlay */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/20 to-transparent"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B]/85 via-[#0A0A0B]/20 to-transparent"
              />

              {/* Headline Copy Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <div className="mb-1 flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-zinc-400">
                  <span className="h-px w-3 bg-zinc-500" aria-hidden="true" />
                  <span>{previewSlide.tag}</span>
                </div>
                <p className="font-['Space_Grotesk'] text-base sm:text-lg font-bold tracking-tight text-white leading-snug line-clamp-2">
                  {previewSlide.title}
                </p>
                <div className="mt-1.5 font-mono text-[10px] text-zinc-400 truncate">
                  {previewSlide.href}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
            Belum ada slide untuk ditampilkan
          </div>
        )}
      </div>

      {/* Live Strip Navigation Mirror (Reflects Drag-and-Drop Order Real-Time) */}
      {activeSlides.length > 0 && (
        <div
          className="grid border-t border-[#1E1E21] bg-[#0A0A0B]"
          style={{
            gridTemplateColumns: `repeat(${activeSlides.length}, minmax(0, 1fr))`,
          }}
        >
          {activeSlides.map((activeItem, idx) => {
            const isSelected = previewSlide?.id === activeItem.id;
            return (
              <button
                key={activeItem.id}
                type="button"
                onClick={() => onSelectSlide(activeItem.id)}
                className={cn(
                  'relative p-2.5 text-left border-r border-[#1E1E21] last:border-r-0 transition-colors',
                  isSelected ? 'bg-[#141418]' : 'hover:bg-[#111114]'
                )}
              >
                {isSelected && <div className="absolute inset-x-0 top-0 h-[2px] bg-white" />}
                <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 truncate">
                  {`${formatSlideNumber(idx)} · ${activeItem.category}`}
                </div>
                <div
                  className={cn(
                    'mt-0.5 text-[11px] font-semibold truncate',
                    isSelected ? 'text-white' : 'text-zinc-400'
                  )}
                >
                  {activeItem.strip_title}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface HeroSlideModalProps {
  readonly isOpen: boolean;
  readonly editingSlide: HeroSlide | null;
  readonly formData: HeroFormData;
  readonly isUploading: boolean;
  readonly dragActive: boolean;
  readonly previewError: boolean;
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.FormEvent) => Promise<boolean>;
  readonly onChangeForm: React.Dispatch<React.SetStateAction<HeroFormData>>;
  readonly onSetPreviewError: (err: boolean) => void;
  readonly onDrag: (e: React.DragEvent) => void;
  readonly onDrop: (e: React.DragEvent) => void;
  readonly onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function HeroSlideModal({
  isOpen,
  editingSlide,
  formData,
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
}: Readonly<HeroSlideModalProps>) {
  const { submitState, isCloseLocked, handleFormSubmit } = useModalSubmit({
    isOpen,
    isUploading,
    resetTrigger: editingSlide,
    onClose,
    onSubmit,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Tutup dialog"
        onClick={isCloseLocked ? undefined : onClose}
        disabled={isCloseLocked}
        className="fixed inset-0 w-full h-full bg-zinc-950/45 backdrop-blur-xs transition-opacity cursor-default"
      />

      {/* Dialog Box Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hero-modal-title"
        className="relative flex flex-col w-full max-w-xl max-h-[88vh] overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-950 shadow-2xl"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-zinc-200 px-5 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h3 id="hero-modal-title" className="font-semibold text-sm text-zinc-950">
              {editingSlide ? 'Edit Slide Hero' : 'Tambah Slide Hero'}
            </h3>
            <p className="text-[11px] text-zinc-500">
              Visual 16:9 dan informasi teks banner beranda.
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

        {/* Form & Scrollable Body */}
        <form onSubmit={handleFormSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto scrollbar-none p-5 sm:p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="slide-category" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Kategori
                </label>
                <select
                  id="slide-category"
                  value={formData.category}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, category: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'cursor-pointer')}
                >
                  {HERO_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="slide-tag" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Tag
                </label>
                <input
                  id="slide-tag"
                  type="text"
                  required
                  placeholder="01 / NEW ARRIVAL"
                  value={formData.tag}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, tag: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'font-mono')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="slide-title" className="block text-[11px] font-medium text-zinc-700 mb-1">
                Judul Slide
              </label>
              <input
                id="slide-title"
                type="text"
                required
                placeholder="ARM ZX-25R TITANIUM FULL SYSTEM"
                value={formData.title}
                onChange={(e) => onChangeForm((prev) => ({ ...prev, title: e.target.value }))}
                className={cn(MODAL_INPUT_CLASS, 'font-semibold')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="slide-strip-title" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Label Strip Tab
                </label>
                <input
                  id="slide-strip-title"
                  type="text"
                  required
                  placeholder="ZX-25R Titanium Series"
                  value={formData.strip_title}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, strip_title: e.target.value }))}
                  className={MODAL_INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="slide-href" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Link Tujuan
                </label>
                <input
                  id="slide-href"
                  type="text"
                  required
                  placeholder="/catalog"
                  value={formData.href}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, href: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'font-mono')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-[11px] font-medium text-zinc-700">
                Gambar Slide (16:9)
              </span>

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
                aria-label="Unggah file gambar slide"
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
                    <span className="font-medium text-zinc-900">Mengunggah media...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-zinc-400 mb-1" />
                    <span className="text-zinc-900 font-medium">Klik atau seret gambar ke sini</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">JPEG, PNG, atau WebP (maks. 5MB)</span>
                  </>
                )}
              </button>

              <input
                type="text"
                aria-label="URL gambar manual"
                placeholder="Atau masukkan URL gambar (/images/hero/...)"
                value={formData.image_url}
                onChange={(e) => {
                  onChangeForm((prev) => ({ ...prev, image_url: e.target.value }));
                  onSetPreviewError(false);
                }}
                className={cn(MODAL_INPUT_CLASS, 'font-mono py-1.5')}
              />

              {formData.image_url && (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                  {previewError ? (
                    <div className="flex flex-col items-center justify-center h-full w-full bg-zinc-100 text-zinc-500 text-center p-3">
                      <ImageIcon className="h-5 w-5 mb-1 text-zinc-400" />
                      <span className="text-[10px]">URL gambar tidak dapat dimuat</span>
                    </div>
                  ) : (
                    <img
                      src={formData.image_url}
                      alt="Pratinjau slide"
                      className="w-full h-full object-cover"
                      onError={() => onSetPreviewError(true)}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300 bg-white text-zinc-900 focus:ring-0 focus:outline-none"
                />
                <span className="text-xs text-zinc-700 font-medium">Tayangkan langsung di beranda</span>
              </label>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 border-t border-zinc-200 bg-zinc-50/90 px-5 sm:px-6 py-3.5 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isCloseLocked}
              className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition disabled:opacity-40"
            >
              Batal
            </button>
            <AdminModalSubmitButton
              isCloseLocked={isCloseLocked}
              submitState={submitState}
              idleLabel="Simpan Slide"
              savedLabel="Tersimpan!"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export function HeroManagementPanel() {
  const { notify } = useNotice();
  const confirm = useConfirm();

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [focusedSlideId, setFocusedSlideId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reordering, setReordering] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState<HeroFormData>(INITIAL_FORM);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastCommittedRef = useRef<HeroSlide[]>([]);
  const latestOrderRef = useRef<HeroSlide[]>([]);
  const pendingDeletesRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup pending delete timers on unmount
  useEffect(() => {
    const pending = pendingDeletesRef.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hero-slides', {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`Gagal memuat slide hero (HTTP ${res.status}).`);
      }
      const data: HeroSlide[] = await res.json();
      const sorted = [...data].sort((a, b) => a.sort_order - b.sort_order);
      setSlides(sorted);
      lastCommittedRef.current = sorted;
      latestOrderRef.current = sorted;
      if (sorted.length > 0) {
        setFocusedSlideId((prev) => prev ?? sorted[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan jaringan.';
      notify?.error('Gagal Memuat Data', msg, {
        source: HERO_NOTICE_SOURCE,
        action: 'fetch',
        detail: msg,
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void fetchSlides();
  }, [fetchSlides]);

  const handleOpenCreate = () => {
    setEditingSlide(null);
    setFormData(INITIAL_FORM);
    setPreviewError(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      category: slide.category,
      tag: slide.tag,
      title: slide.title,
      strip_title: slide.strip_title,
      href: slide.href,
      image_url: slide.image_url,
      is_active: slide.is_active,
    });
    setPreviewError(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    if (isUploading) return;
    setIsModalOpen(false);
    setEditingSlide(null);
    setFormData(INITIAL_FORM);
    setPreviewError(false);
  }, [isUploading]);

  const handleFileUpload = async (file: File) => {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      notify?.error('Format Tidak Didukung', 'Gunakan file JPEG, PNG, atau WebP.', {
        source: HERO_NOTICE_SOURCE,
        action: 'upload',
        detail: `Tipe file ${file.type} tidak didukung`,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify?.error('File Terlalu Besar', 'Ukuran maksimal file gambar adalah 5MB.', {
        source: HERO_NOTICE_SOURCE,
        action: 'upload',
        detail: `Ukuran file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
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
      notify?.success('Upload Berhasil', 'Gambar slide berhasil diunggah.', {
        source: HERO_NOTICE_SOURCE,
        action: 'upload',
        detail: result.url,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah file media.';
      notify?.error('Upload Gagal', msg, {
        source: HERO_NOTICE_SOURCE,
        action: 'upload',
        detail: msg,
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

  const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();

    const validationError = validateHeroForm(formData);
    if (validationError) {
      notify?.error('Validasi Gagal', validationError, {
        source: HERO_NOTICE_SOURCE,
        action: editingSlide ? 'update' : 'create',
        detail: validationError,
      });
      return false;
    }

    const payload = {
      category: formData.category.trim(),
      tag: formData.tag.trim(),
      title: formData.title.trim(),
      strip_title: formData.strip_title.trim(),
      href: formData.href.trim(),
      image_url: formData.image_url.trim(),
      is_active: formData.is_active,
    };

    try {
      if (editingSlide) {
        const res = await fetch(`/api/admin/hero-slides/${editingSlide.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message ?? 'Gagal memperbarui slide hero.');
        }
        const updated: HeroSlide = await res.json();
        setSlides((prev) => {
          const next = prev.map((s) => (s.id === updated.id ? updated : s));
          lastCommittedRef.current = next;
          latestOrderRef.current = next;
          return next;
        });
        setFocusedSlideId(updated.id);
        notify?.success('Slide Diperbarui', `Slide "${updated.title}" berhasil disimpan.`, {
          source: HERO_NOTICE_SOURCE,
          action: 'update',
          detail: `ID: ${updated.id}`,
        });
      } else {
        const res = await fetch('/api/admin/hero-slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message ?? 'Gagal menambahkan slide hero.');
        }
        const created: HeroSlide = await res.json();
        setSlides((prev) => {
          const next = [...prev, created].sort((a, b) => a.sort_order - b.sort_order);
          lastCommittedRef.current = next;
          latestOrderRef.current = next;
          return next;
        });
        setFocusedSlideId(created.id);
        notify?.success('Slide Ditambahkan', `Slide "${created.title}" berhasil dibuat.`, {
          source: HERO_NOTICE_SOURCE,
          action: 'create',
          detail: `ID: ${created.id}`,
        });
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      notify?.error('Gagal Menyimpan', msg, {
        source: HERO_NOTICE_SOURCE,
        action: editingSlide ? 'update' : 'create',
        detail: msg,
      });
      return false;
    }
  };

  const handleToggle = async (slideId: string) => {
    const targetSlide = slides.find((s) => s.id === slideId);
    if (!targetSlide) return;

    const previousStatus = targetSlide.is_active;
    const nextStatus = !previousStatus;

    setSlides((prev) =>
      prev.map((s) => (s.id === slideId ? { ...s, is_active: nextStatus } : s))
    );

    try {
      const res = await fetch(`/api/admin/hero-slides/${slideId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error('Gagal memperbarui status aktif di server.');
      }
      const updated: HeroSlide = await res.json();
      setSlides((prev) => {
        const next = prev.map((s) => (s.id === slideId ? updated : s));
        lastCommittedRef.current = next;
        latestOrderRef.current = next;
        return next;
      });
      notify?.success(
        'Status Berubah',
        `Slide "${targetSlide.title}" telah ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
        {
          source: HERO_NOTICE_SOURCE,
          action: 'toggle',
          detail: `ID: ${slideId}, is_active: ${nextStatus}`,
        }
      );
    } catch (err: unknown) {
      setSlides((prev) =>
        prev.map((s) => (s.id === slideId ? { ...s, is_active: previousStatus } : s))
      );
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui status aktif.';
      notify?.error('Gagal Mengubah Status', msg, {
        source: HERO_NOTICE_SOURCE,
        action: 'toggle',
        detail: msg,
      });
    }
  };

  const persistOrder = useCallback(
    async (orderedSlides: HeroSlide[], fallbackSnapshot: HeroSlide[]) => {
      const normalizedSlides = orderedSlides.map((s, idx) => ({ ...s, sort_order: idx + 1 }));
      setSlides(normalizedSlides);
      latestOrderRef.current = normalizedSlides;
      setReordering(true);
      try {
        const res = await fetch('/api/admin/hero-slides/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds: normalizedSlides.map((s) => s.id) }),
        });

        if (!res.ok) {
          throw new Error('Gagal memperbarui urutan slide di server.');
        }

        lastCommittedRef.current = normalizedSlides;
        notify?.success('Urutan Diperbarui', 'Urutan carousel berhasil disimpan.', {
          source: HERO_NOTICE_SOURCE,
          action: 'reorder',
          detail: `Total slide: ${normalizedSlides.length}`,
        });
      } catch (err: unknown) {
        setSlides(fallbackSnapshot);
        latestOrderRef.current = fallbackSnapshot;
        const msg = err instanceof Error ? err.message : 'Gagal memperbarui urutan.';
        notify?.error('Gagal Mengubah Urutan', msg, {
          source: HERO_NOTICE_SOURCE,
          action: 'reorder',
          detail: msg,
        });
      } finally {
        setReordering(false);
      }
    },
    [notify]
  );

  const handleDragReorder = (nextOrder: HeroSlide[]) => {
    latestOrderRef.current = nextOrder;
    setSlides(nextOrder);
  };

  const handleDragEnd = () => {
    const nextIds = latestOrderRef.current.map((s) => s.id).join(',');
    const prevIds = lastCommittedRef.current.map((s) => s.id).join(',');
    if (nextIds !== prevIds && !reordering) {
      void persistOrder(latestOrderRef.current, lastCommittedRef.current);
    }
  };

  const handleKeyboardMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length || reordering) return;

    const fallback = [...slides];
    const swapped = [...slides];
    const temp = swapped[index];
    swapped[index] = swapped[targetIndex];
    swapped[targetIndex] = temp;

    void persistOrder(swapped, fallback);
  };

  const handleDelete = async (slide: HeroSlide) => {
    const confirmed = await confirm({
      title: 'Hapus Slide Hero?',
      description: 'Slide ini akan dihapus dari banner beranda storefront.',
      itemPreview: slide.title,
      confirmText: 'Hapus Slide',
      variant: 'danger',
    });
    if (!confirmed) return;

    // 1. Optimistic removal from state
    const previousSlides = slides;
    const removedIndex = slides.findIndex((s) => s.id === slide.id);
    setSlides((prev) => {
      const next = prev.filter((s) => s.id !== slide.id);
      lastCommittedRef.current = next;
      latestOrderRef.current = next;
      if (focusedSlideId === slide.id) {
        setFocusedSlideId(next[0]?.id ?? null);
      }
      return next;
    });

    // 2. Schedule commit with 6-second delay
    let isUndone = false;
    const timeoutId = setTimeout(async () => {
      pendingDeletesRef.current.delete(slide.id);
      if (isUndone) return;

      try {
        const res = await fetch(`/api/admin/hero-slides/${slide.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error('Gagal menghapus slide dari server.');
        }
      } catch (err: unknown) {
        // Rollback on server error
        setSlides(previousSlides);
        lastCommittedRef.current = previousSlides;
        latestOrderRef.current = previousSlides;
        const msg = err instanceof Error ? err.message : 'Gagal menghapus slide.';
        notify?.error('Gagal Menghapus', `${msg} Data slide dipulihkan.`, {
          source: HERO_NOTICE_SOURCE,
          action: 'delete',
          detail: msg,
        });
      }
    }, 6000);

    pendingDeletesRef.current.set(slide.id, timeoutId);

    // 3. Show DynamicIslandNotice with Undo button
    notify?.info('Slide Dihapus', `Slide "${slide.title}" disembunyikan.`, {
      duration: 6000,
      source: HERO_NOTICE_SOURCE,
      action: 'delete',
      detail: `ID: ${slide.id}`,
      actionButton: {
        label: 'Urungkan',
        onClick: () => {
          isUndone = true;
          const timer = pendingDeletesRef.current.get(slide.id);
          if (timer) {
            clearTimeout(timer);
            pendingDeletesRef.current.delete(slide.id);
          }
          setSlides((prev) => {
            const exists = prev.some((s) => s.id === slide.id);
            if (exists) return prev;
            const next = [...prev];
            const insertIdx =
              removedIndex >= 0 && removedIndex <= next.length ? removedIndex : next.length;
            next.splice(insertIdx, 0, slide);
            lastCommittedRef.current = next;
            latestOrderRef.current = next;
            return next;
          });
          notify?.success('Pemulihan Berhasil', `Slide "${slide.title}" telah dipulihkan.`, {
            source: HERO_NOTICE_SOURCE,
            action: 'undo',
          });
        },
      },
    });
  };

  const activeCount = slides.filter((s) => s.is_active).length;
  const focusedSlide = slides.find((s) => s.id === focusedSlideId) ?? slides[0] ?? null;

  return (
    <section aria-label="Manajemen Hero Carousel" className="space-y-5">
      {/* Minimalist Toolbar (No Duplicate Title Card) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-zinc-950">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" aria-hidden="true" />
            {`${activeCount} Tayang / ${slides.length} Slide`}
          </span>
          <span className="hidden sm:inline text-zinc-300">·</span>
          <span className="hidden sm:inline text-[11px]">
            Seret baris untuk mengatur urutan rotasi
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#141416] hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition shadow-xs active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Slide</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-16 text-center">
          <RefreshCw className="h-5 w-5 animate-spin text-zinc-500" />
          <p className="mt-3 text-xs text-zinc-500">Memuat slide hero...</p>
        </div>
      ) : slides.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-16 text-center">
          <h3 className="text-sm font-semibold text-zinc-950">Belum Ada Slide Hero</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm">
            Tambahkan banner visual pertama untuk ditampilkan pada hero storefront.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#141416] hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Slide</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Sortable List */}
          <div className="lg:col-span-7">
            <Reorder.Group
              axis="y"
              values={slides}
              onReorder={handleDragReorder}
              className="space-y-2.5"
            >
              {slides.map((slide, index) => (
                <HeroSortableRow
                  key={slide.id}
                  slide={slide}
                  index={index}
                  total={slides.length}
                  isFocused={focusedSlide?.id === slide.id}
                  isDeleting={deletingId === slide.id}
                  reordering={reordering}
                  onFocusSlide={setFocusedSlideId}
                  onDragEnd={handleDragEnd}
                  onKeyboardMove={handleKeyboardMove}
                  onToggle={(id) => void handleToggle(id)}
                  onEdit={handleOpenEdit}
                  onDelete={(item) => void handleDelete(item)}
                />
              ))}
            </Reorder.Group>
          </div>

          {/* Right: Eye-Catching Live Storefront Mirror */}
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <HeroLivePreview
              slides={slides}
              focusedSlide={focusedSlide}
              onSelectSlide={setFocusedSlideId}
            />
          </div>
        </div>
      )}

      <HeroSlideModal
        isOpen={isModalOpen}
        editingSlide={editingSlide}
        formData={formData}
        isUploading={isUploading}
        dragActive={dragActive}
        previewError={previewError}
        fileInputRef={fileInputRef}
        onClose={handleCloseModal}
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
