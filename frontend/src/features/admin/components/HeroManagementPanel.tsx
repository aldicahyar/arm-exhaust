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
  Pencil,
  Trash2,
  PanelRightClose,
  PanelRightOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNotice, useDoubleSafetyAction, ACTION_PRESETS } from '@/shared/components';
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
  image_mobile_url: string;
  is_active: boolean;
}

const INITIAL_FORM: HeroFormData = {
  category: 'PRODUK',
  tag: '',
  title: '',
  strip_title: '',
  href: '',
  image_url: '',
  image_mobile_url: '',
  is_active: true,
};

type HeroImageTarget = 'image_url' | 'image_mobile_url';
type HeroImageFlags = Readonly<Record<HeroImageTarget, boolean>>;
type PreviewDevice = 'desktop' | 'mobile';

const NO_IMAGE_FLAGS: HeroImageFlags = { image_url: false, image_mobile_url: false };

const IMAGE_UPLOAD_SUCCESS_MESSAGE: Readonly<Record<HeroImageTarget, string>> = {
  image_url: 'Gambar slide berhasil diunggah.',
  image_mobile_url: 'Gambar HP berhasil diunggah.',
};

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const VALID_UPLOAD_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

function getUploadValidationError(file: File): { title: string; message: string; detail: string } | null {
  if (!VALID_UPLOAD_MIMES.includes(file.type)) {
    return {
      title: 'Format Tidak Didukung',
      message: 'Gunakan file JPEG, PNG, atau WebP.',
      detail: `Tipe file ${file.type} tidak didukung`,
    };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      title: 'File Terlalu Besar',
      message: 'Ukuran maksimal file gambar adalah 5MB.',
      detail: `Ukuran file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    };
  }
  return null;
}

/** HP preview uses the mobile image when set, otherwise the desktop image (same as the storefront). */
function getPreviewImageSrc(slide: HeroSlide, device: PreviewDevice): string {
  if (device === 'mobile' && slide.image_mobile_url) {
    return slide.image_mobile_url;
  }
  return slide.image_url;
}

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
  readonly isSelected: boolean;
  readonly onSelect: (id: string) => void;
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
  isSelected,
  onSelect,
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
    isSelected && 'ring-1 ring-zinc-900 bg-zinc-50/70 border-zinc-900',
    isFocused && !isSelected && 'border-zinc-900 bg-white shadow-xs',
    !isFocused && !isSelected && 'border-zinc-200 bg-white hover:border-zinc-300',
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
      {/* Left + Center: Checkbox, Grip, Index, Thumbnail & Typography */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Row Selection Checkbox */}
        <div className="flex items-center pl-0.5 shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(slide.id)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-950 accent-zinc-950 focus:ring-zinc-950/20 cursor-pointer"
            aria-label={`Pilih slide ${slide.title}`}
          />
        </div>

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
              {!slide.image_mobile_url && (
                <>
                  <span className="text-zinc-300" aria-hidden="true">·</span>
                  <span className="shrink-0 normal-case tracking-normal text-zinc-400">Tanpa gambar HP</span>
                </>
              )}
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
        <div className="flex items-center gap-1.5">
          {/* Edit Button - Subtle Zinc Expansion (Gentle Luxury 800ms) */}
          <button
            type="button"
            onClick={() => onEdit(slide)}
            aria-label={`Edit slide ${slide.title}`}
            title="Edit slide"
            className="group/btn inline-flex items-center gap-1.5 h-7 px-2 rounded-lg border border-transparent text-zinc-500 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:border-zinc-950 focus-visible:bg-zinc-100 focus-visible:text-zinc-950 focus-visible:outline-none transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-medium opacity-0 group-hover/btn:max-w-[40px] group-hover/btn:opacity-100 group-focus-visible/btn:max-w-[40px] group-focus-visible/btn:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none">
              Edit
            </span>
          </button>

          {/* Delete Button - Dark Inversion Monochrome Expansion (Gentle Luxury 800ms) */}
          <button
            type="button"
            onClick={() => onDelete(slide)}
            disabled={isDeleting}
            aria-label={`Hapus slide ${slide.title}`}
            title="Hapus slide"
            className="group/btn inline-flex items-center gap-1.5 h-7 px-2 rounded-lg border border-transparent text-zinc-400 hover:border-zinc-900 hover:bg-zinc-950 hover:text-white focus-visible:border-zinc-900 focus-visible:bg-zinc-950 focus-visible:text-white focus-visible:outline-none transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-medium opacity-0 group-hover/btn:max-w-[45px] group-hover/btn:opacity-100 group-focus-visible/btn:max-w-[45px] group-focus-visible/btn:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none">
              Hapus
            </span>
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

interface PreviewDeviceToggleProps {
  readonly device: PreviewDevice;
  readonly onChange: (device: PreviewDevice) => void;
}

const PREVIEW_DEVICE_OPTIONS: ReadonlyArray<{ readonly value: PreviewDevice; readonly label: string }> = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'HP' },
];

function PreviewDeviceToggle({ device, onChange }: Readonly<PreviewDeviceToggleProps>) {
  return (
    <fieldset className="inline-flex items-center rounded-md border border-zinc-800 p-0.5">
      <legend className="sr-only">Mode pratinjau</legend>
      {PREVIEW_DEVICE_OPTIONS.map((option) => {
        const isActive = device === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500',
              isActive ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-200'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}

interface HeroPreviewSlideProps {
  readonly slide: HeroSlide;
  readonly device: PreviewDevice;
  readonly activeSlides: HeroSlide[];
  readonly onSelectSlide: (id: string) => void;
}

function HeroPreviewSlide({
  slide,
  device,
  activeSlides,
  onSelectSlide,
}: Readonly<HeroPreviewSlideProps>) {
  const imageSrc = getPreviewImageSrc(slide, device);

  const selectRelative = (step: number) => {
    const curIdx = activeSlides.findIndex((s) => s.id === slide.id);
    const nextIdx = (curIdx + step + activeSlides.length) % activeSlides.length;
    onSelectSlide(activeSlides[nextIdx].id);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${slide.id}-${device}-${imageSrc}`}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0.4 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0"
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={slide.title}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-300',
              !slide.is_active && 'opacity-35 grayscale'
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

        {/* Headline Contextual Action Links Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <p className="font-['Space_Grotesk'] text-base sm:text-lg font-bold tracking-tight text-white leading-snug line-clamp-2">
            {slide.title}
          </p>
          <div className="mt-2 flex items-center gap-2.5 font-mono text-[9px] text-zinc-300">
            <span className="text-white">Specifications ↗</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">Series ↗</span>
          </div>
        </div>

        {/* Subtle Side Chevrons in Preview */}
        {activeSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectRelative(-1);
              }}
              aria-label="Slide sebelumnya"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center bg-transparent text-white/50 hover:text-white transition drop-shadow-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectRelative(1);
              }}
              aria-label="Slide selanjutnya"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center bg-transparent text-white/50 hover:text-white transition drop-shadow-md"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

interface HeroPreviewFrameProps {
  readonly device: PreviewDevice;
  readonly children: React.ReactNode;
}

/** Desktop: full-width 16:9 canvas. HP: narrow 9/19.5 phone frame. */
function HeroPreviewFrame({ device, children }: Readonly<HeroPreviewFrameProps>) {
  if (device === 'mobile') {
    return (
      <div className="flex justify-center bg-[#0E0E10] px-4 py-5">
        <div className="relative aspect-[9/19.5] w-full max-w-[220px] overflow-hidden rounded-[1.25rem] border border-zinc-800 bg-[#0E0E10]">
          {children}
        </div>
      </div>
    );
  }
  return <div className="relative aspect-video w-full bg-[#0E0E10] overflow-hidden">{children}</div>;
}

interface HeroModalPhonePreviewProps {
  readonly formData: HeroFormData;
}

const NO_PREVIEW_SLIDES: HeroSlide[] = [];
const noopSelectSlide = () => {};

/** Live HP preview inside the add/edit modal, built from the unsaved form values. */
function HeroModalPhonePreview({ formData }: Readonly<HeroModalPhonePreviewProps>) {
  const imageUrl = formData.image_url.trim();
  const imageMobileUrl = formData.image_mobile_url.trim();
  if (!imageUrl && !imageMobileUrl) return null;

  // Always rendered as "active" so the admin sees the real storefront look, not the greyed inactive state.
  const draftSlide: HeroSlide = {
    id: 'modal-draft',
    category: formData.category,
    tag: formData.tag,
    title: formData.title.trim() || 'Judul slide',
    strip_title: formData.strip_title,
    href: formData.href,
    image_url: imageUrl,
    image_mobile_url: imageMobileUrl || null,
    sort_order: 0,
    is_active: true,
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-[11px] font-medium text-zinc-700">Pratinjau HP</span>
      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <HeroPreviewFrame device="mobile">
          <HeroPreviewSlide
            slide={draftSlide}
            device="mobile"
            activeSlides={NO_PREVIEW_SLIDES}
            onSelectSlide={noopSelectSlide}
          />
        </HeroPreviewFrame>
      </div>
      {!imageMobileUrl && (
        <p className="text-[10px] text-zinc-500">Tanpa gambar HP — memakai gambar desktop (terpotong)</p>
      )}
    </div>
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
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const activeSlides = slides.filter((s) => s.is_active);
  const previewSlide = focusedSlide ?? activeSlides[0] ?? slides[0] ?? null;
  const showMobileFallbackNote = device === 'mobile' && previewSlide !== null && !previewSlide.image_mobile_url;

  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-[#0A0A0B] text-white overflow-hidden shadow-lg">
      {/* Minimal Stage Caption */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-zinc-900">
        <span className="font-mono text-[10px] tracking-widest uppercase text-zinc-400">
          Pratinjau Storefront
        </span>
        <div className="flex items-center gap-2">
          <PreviewDeviceToggle device={device} onChange={setDevice} />
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
      </div>

      {/* Hero Canvas Mirror (Desktop 16:9 / HP 9:19.5) */}
      <HeroPreviewFrame device={device}>
        {previewSlide ? (
          <HeroPreviewSlide
            slide={previewSlide}
            device={device}
            activeSlides={activeSlides}
            onSelectSlide={onSelectSlide}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
            Belum ada slide untuk ditampilkan
          </div>
        )}
      </HeroPreviewFrame>

      {showMobileFallbackNote && (
        <p className="px-4 pb-3 -mt-2 bg-[#0E0E10] text-center font-mono text-[10px] text-zinc-500">
          Tanpa gambar HP — memakai gambar desktop (terpotong)
        </p>
      )}

      {/* Live Slide Thumb Bar */}
      {activeSlides.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-900 bg-[#0A0A0B] text-[10px]">
          <span className="font-mono text-zinc-500">
            Slide {activeSlides.findIndex((s) => s.id === previewSlide?.id) + 1} dari {activeSlides.length}
          </span>
          <div className="flex items-center gap-1.5">
            {activeSlides.map((activeItem, idx) => {
              const isSelected = previewSlide?.id === activeItem.id;
              return (
                <button
                  key={activeItem.id}
                  type="button"
                  onClick={() => onSelectSlide(activeItem.id)}
                  aria-label={`Pilih slide ${idx + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-200',
                    isSelected ? 'w-5 bg-white' : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                  )}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface HeroImageFieldProps {
  readonly target: HeroImageTarget;
  readonly label: string;
  readonly helpText?: string;
  readonly value: string;
  readonly isUploading: boolean;
  readonly dragActive: boolean;
  readonly previewError: boolean;
  readonly uploadAriaLabel: string;
  readonly urlAriaLabel: string;
  readonly urlPlaceholder: string;
  readonly previewAlt: string;
  /** Tailwind classes for the thumbnail frame (aspect ratio + width). */
  readonly thumbnailClass: string;
  readonly onChangeUrl: (target: HeroImageTarget, value: string) => void;
  readonly onClear?: (target: HeroImageTarget) => void;
  readonly onSetPreviewError: (target: HeroImageTarget, err: boolean) => void;
  readonly onDrag: (e: React.DragEvent, target: HeroImageTarget) => void;
  readonly onDrop: (e: React.DragEvent, target: HeroImageTarget) => void;
  readonly onFileSelect: (file: File, target: HeroImageTarget) => void;
}

function HeroImageField({
  target,
  label,
  helpText,
  value,
  isUploading,
  dragActive,
  previewError,
  uploadAriaLabel,
  urlAriaLabel,
  urlPlaceholder,
  previewAlt,
  thumbnailClass,
  onChangeUrl,
  onClear,
  onSetPreviewError,
  onDrag,
  onDrop,
  onFileSelect,
}: Readonly<HeroImageFieldProps>) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file, target);
    }
    // Allow re-selecting the same file after clearing / a failed upload
    e.target.value = '';
  };

  // aria-disabled (not `disabled`) while uploading: a disabled button gets no drag events in
  // Chromium, so a drop would fall through and open the file in the tab.
  const handleClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleDragEvent = (e: React.DragEvent) => {
    if (isUploading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onDrag(e, target);
  };

  const handleDropEvent = (e: React.DragEvent) => {
    if (isUploading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onDrop(e, target);
  };

  return (
    <div className="space-y-2">
      <span className="block text-[11px] font-medium text-zinc-700">{label}</span>
      {helpText && <p className="text-[10px] text-zinc-500 -mt-1">{helpText}</p>}

      <button
        type="button"
        onDragEnter={handleDragEvent}
        onDragOver={handleDragEvent}
        onDragLeave={handleDragEvent}
        onDrop={handleDropEvent}
        onClick={handleClick}
        aria-disabled={isUploading}
        className={cn(
          'w-full flex flex-col items-center justify-center p-4 border border-dashed rounded-lg cursor-pointer transition text-center focus:outline-none focus:ring-1 focus:ring-zinc-900 aria-disabled:cursor-wait',
          dragActive
            ? 'border-zinc-900 bg-zinc-100'
            : 'border-zinc-300 bg-zinc-50/70 hover:border-zinc-400 hover:bg-zinc-100/50'
        )}
        aria-label={uploadAriaLabel}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        {isUploading ? (
          <div className="flex items-center gap-2 text-zinc-600">
            <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none text-zinc-900" />
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
        aria-label={urlAriaLabel}
        placeholder={urlPlaceholder}
        value={value}
        onChange={(e) => {
          onChangeUrl(target, e.target.value);
          onSetPreviewError(target, false);
        }}
        className={cn(MODAL_INPUT_CLASS, 'font-mono py-1.5')}
      />

      {value && (
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'relative rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100',
              thumbnailClass
            )}
          >
            {previewError ? (
              <div className="flex flex-col items-center justify-center h-full w-full bg-zinc-100 text-zinc-500 text-center p-3">
                <ImageIcon className="h-5 w-5 mb-1 text-zinc-400" />
                <span className="text-[10px]">URL gambar tidak dapat dimuat</span>
              </div>
            ) : (
              <img
                src={value}
                alt={previewAlt}
                className="w-full h-full object-cover"
                onError={() => onSetPreviewError(target, true)}
              />
            )}
          </div>
          {onClear && (
            <button
              type="button"
              onClick={() => onClear(target)}
              disabled={isUploading}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition disabled:opacity-40"
            >
              <X className="h-3.5 w-3.5" />
              <span>Hapus gambar HP</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface HeroSlideModalProps {
  readonly isOpen: boolean;
  readonly editingSlide: HeroSlide | null;
  readonly formData: HeroFormData;
  readonly uploading: HeroImageFlags;
  readonly dragTarget: HeroImageTarget | null;
  readonly previewErrors: HeroImageFlags;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.FormEvent) => Promise<boolean>;
  readonly onChangeForm: React.Dispatch<React.SetStateAction<HeroFormData>>;
  readonly onSetPreviewError: (target: HeroImageTarget, err: boolean) => void;
  readonly onDrag: (e: React.DragEvent, target: HeroImageTarget) => void;
  readonly onDrop: (e: React.DragEvent, target: HeroImageTarget) => void;
  readonly onFileSelect: (file: File, target: HeroImageTarget) => void;
}

function HeroSlideModal({
  isOpen,
  editingSlide,
  formData,
  uploading,
  dragTarget,
  previewErrors,
  onClose,
  onSubmit,
  onChangeForm,
  onSetPreviewError,
  onDrag,
  onDrop,
  onFileSelect,
}: Readonly<HeroSlideModalProps>) {
  const isUploading = uploading.image_url || uploading.image_mobile_url;
  const { submitState, isCloseLocked, handleFormSubmit } = useModalSubmit({
    isOpen,
    isUploading,
    resetTrigger: editingSlide,
    onClose,
    onSubmit,
  });

  if (!isOpen) return null;

  const handleChangeImageUrl = (target: HeroImageTarget, value: string) => {
    onChangeForm((prev) => ({ ...prev, [target]: value }));
  };

  const handleClearImage = (target: HeroImageTarget) => {
    onChangeForm((prev) => ({ ...prev, [target]: '' }));
    onSetPreviewError(target, false);
  };

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
              Visual desktop 16:9, gambar HP 9:16 (opsional), dan teks banner beranda.
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
                placeholder="ARM NUSANTARA TI — BURNT TITANIUM"
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
                  placeholder="Nusantara Titanium Series"
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

            <HeroImageField
              target="image_url"
              label="Gambar Slide (16:9)"
              value={formData.image_url}
              isUploading={uploading.image_url}
              dragActive={dragTarget === 'image_url'}
              previewError={previewErrors.image_url}
              uploadAriaLabel="Unggah file gambar slide"
              urlAriaLabel="URL gambar manual"
              urlPlaceholder="Atau masukkan URL gambar (/images/hero/...)"
              previewAlt="Pratinjau slide"
              thumbnailClass="aspect-video w-full"
              onChangeUrl={handleChangeImageUrl}
              onSetPreviewError={onSetPreviewError}
              onDrag={onDrag}
              onDrop={onDrop}
              onFileSelect={onFileSelect}
            />

            <HeroImageField
              target="image_mobile_url"
              label="Gambar HP (9:16) — opsional"
              helpText="Tanpa gambar ini, tampilan HP memotong gambar desktop. Disarankan 1080 × 1920 px."
              value={formData.image_mobile_url}
              isUploading={uploading.image_mobile_url}
              dragActive={dragTarget === 'image_mobile_url'}
              previewError={previewErrors.image_mobile_url}
              uploadAriaLabel="Unggah file gambar HP"
              urlAriaLabel="URL gambar HP manual"
              urlPlaceholder="Atau masukkan URL gambar HP (/images/hero/...)"
              previewAlt="Pratinjau gambar HP"
              thumbnailClass="aspect-[9/16] w-28 shrink-0"
              onChangeUrl={handleChangeImageUrl}
              onClear={handleClearImage}
              onSetPreviewError={onSetPreviewError}
              onDrag={onDrag}
              onDrop={onDrop}
              onFileSelect={onFileSelect}
            />

            <HeroModalPhonePreview formData={formData} />

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

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [focusedSlideId, setFocusedSlideId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reordering, setReordering] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState<HeroFormData>(INITIAL_FORM);
  const [uploading, setUploading] = useState<HeroImageFlags>(NO_IMAGE_FLAGS);
  const [dragTarget, setDragTarget] = useState<HeroImageTarget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewErrors, setPreviewErrors] = useState<HeroImageFlags>(NO_IMAGE_FLAGS);
  const isUploading = uploading.image_url || uploading.image_mobile_url;

  const setUploadingFor = (target: HeroImageTarget, value: boolean) => {
    setUploading((prev) => ({ ...prev, [target]: value }));
  };

  const setPreviewErrorFor = useCallback((target: HeroImageTarget, value: boolean) => {
    setPreviewErrors((prev) => ({ ...prev, [target]: value }));
  }, []);
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(true);

  // Initialize from localStorage after mounting to avoid Next.js SSR hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem('arm_admin_hero_preview_visible');
      if (saved !== null) {
        setIsPreviewVisible(saved === 'true');
      }
    } catch {
      // Safe fallback for restricted storage environments
    }
  }, []);

  const handleTogglePreview = () => {
    setIsPreviewVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('arm_admin_hero_preview_visible', String(next));
      } catch {
        // Safe fallback
      }
      return next;
    });
  };

  const [selectedSlideIds, setSelectedSlideIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  const handleSelectSlide = (id: string) => {
    setSelectedSlideIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedSlideIds.size === slides.length) {
      setSelectedSlideIds(new Set());
    } else {
      setSelectedSlideIds(new Set(slides.map((s) => s.id)));
    }
  };

  const lastCommittedRef = useRef<HeroSlide[]>([]);
  const latestOrderRef = useRef<HeroSlide[]>([]);

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
    setPreviewErrors(NO_IMAGE_FLAGS);
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
      image_mobile_url: slide.image_mobile_url ?? '',
      is_active: slide.is_active,
    });
    setPreviewErrors(NO_IMAGE_FLAGS);
    setIsModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    if (isUploading) return;
    setIsModalOpen(false);
    setEditingSlide(null);
    setFormData(INITIAL_FORM);
    setPreviewErrors(NO_IMAGE_FLAGS);
  }, [isUploading]);

  /** Uploads one image file and writes the returned URL into the given form field. */
  const handleFileUpload = async (file: File, target: HeroImageTarget) => {
    const validationError = getUploadValidationError(file);
    if (validationError) {
      notify?.error(validationError.title, validationError.message, {
        source: HERO_NOTICE_SOURCE,
        action: 'upload',
        detail: validationError.detail,
      });
      return;
    }

    setUploadingFor(target, true);
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
      setFormData((prev) => ({ ...prev, [target]: result.url }));
      setPreviewErrorFor(target, false);
      notify?.success('Upload Berhasil', IMAGE_UPLOAD_SUCCESS_MESSAGE[target], {
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
      setUploadingFor(target, false);
    }
  };

  const handleFileSelect = (file: File, target: HeroImageTarget) => {
    void handleFileUpload(file, target);
  };

  const handleDrag = (e: React.DragEvent, target: HeroImageTarget) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragTarget(target);
    } else if (e.type === 'dragleave') {
      setDragTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent, target: HeroImageTarget) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTarget(null);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      void handleFileUpload(file, target);
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
      image_mobile_url: formData.image_mobile_url.trim() || null,
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

  const { executeAction: executeDeleteSlide } = useDoubleSafetyAction<HeroSlide>({
    preset: ACTION_PRESETS.HERO_SLIDE_DELETE,
    noticeSource: HERO_NOTICE_SOURCE,
    getItemPreview: (slide) => slide.title,
    onOptimisticExecute: (slide) => {
      setSlides((prev) => {
        const next = prev.filter((s) => s.id !== slide.id);
        lastCommittedRef.current = next;
        latestOrderRef.current = next;
        if (focusedSlideId === slide.id) {
          setFocusedSlideId(next[0]?.id ?? null);
        }
        return next;
      });
    },
    onRestore: (slide, originalIndex) => {
      setSlides((prev) => {
        if (prev.some((s) => s.id === slide.id)) return prev;
        const next = [...prev];
        const insertIdx =
          typeof originalIndex === 'number' && originalIndex >= 0 && originalIndex <= next.length
            ? originalIndex
            : next.length;
        next.splice(insertIdx, 0, slide);
        lastCommittedRef.current = next;
        latestOrderRef.current = next;
        return next;
      });
    },
    onCommit: async (slide) => {
      const res = await fetch(`/api/admin/hero-slides/${slide.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Gagal menghapus slide dari server.');
      }
    },
  });

  const handleDelete = (slide: HeroSlide) => {
    const index = slides.findIndex((s) => s.id === slide.id);
    void executeDeleteSlide(slide, index);
  };

  const handleBulkDelete = async () => {
    if (selectedSlideIds.size === 0 || isBulkDeleting) return;

    const count = selectedSlideIds.size;
    const slidesToDelete = slides.filter((s) => selectedSlideIds.has(s.id));
    const activeSlides = slides.filter((s) => s.is_active);
    const deletingActiveCount = slidesToDelete.filter((s) => s.is_active).length;
    const willEmptyStorefront = activeSlides.length > 0 && deletingActiveCount === activeSlides.length;

    if (willEmptyStorefront) {
      notify?.info(
        'Perhatian Storefront',
        'Tindakan ini menghapus seluruh slide aktif. Pastikan menambahkan slide baru agar beranda tidak kosong.',
        { source: HERO_NOTICE_SOURCE, action: 'bulk-delete-guard' }
      );
    }

    setIsBulkDeleting(true);
    const previousSlides = [...slides];

    // Optimistically remove
    setSlides((prev) => prev.filter((s) => !selectedSlideIds.has(s.id)));
    setSelectedSlideIds(new Set());

    let isUndone = false;
    const timeoutId = setTimeout(async () => {
      if (isUndone) return;
      try {
        await Promise.all(
          slidesToDelete.map(async (slide) => {
            const res = await fetch(`/api/admin/hero-slides/${slide.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`Gagal menghapus slide "${slide.title}".`);
          })
        );
        notify?.success(
          'Slide Dihapus Massal',
          `${count} slide berhasil dihapus secara permanen.`,
          { source: HERO_NOTICE_SOURCE, action: 'bulk-delete' }
        );
      } catch (err: unknown) {
        setSlides(previousSlides);
        lastCommittedRef.current = previousSlides;
        latestOrderRef.current = previousSlides;
        const msg = err instanceof Error ? err.message : 'Gagal menghapus slide massal di server.';
        notify?.error('Gagal Hapus Massal', msg, { source: HERO_NOTICE_SOURCE, action: 'bulk-delete' });
      } finally {
        setIsBulkDeleting(false);
      }
    }, 5000);

    notify?.info(
      `${count} Slide Dihapus`,
      `${count} slide telah dihapus dari daftar hero.`,
      {
        duration: 5000,
        source: HERO_NOTICE_SOURCE,
        action: 'bulk-delete',
        actionButton: {
          label: 'Urungkan',
          onClick: () => {
            isUndone = true;
            clearTimeout(timeoutId);
            setSlides(previousSlides);
            lastCommittedRef.current = previousSlides;
            latestOrderRef.current = previousSlides;
            setIsBulkDeleting(false);
            notify?.success('Pemulihan Berhasil', `${count} slide telah dikembalikan ke daftar.`, {
              source: HERO_NOTICE_SOURCE,
              action: 'undo-bulk-delete',
            });
          },
        },
      }
    );
  };

  const activeCount = slides.filter((s) => s.is_active).length;
  const focusedSlide = slides.find((s) => s.id === focusedSlideId) ?? slides[0] ?? null;

  return (
    <section aria-label="Manajemen Hero Carousel" className="space-y-5">
      {/* Minimalist Toolbar (No Duplicate Title Card) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {/* Select All Checkbox */}
          {slides.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={selectedSlideIds.size === slides.length && slides.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-950 accent-zinc-950 focus:ring-zinc-950/20 cursor-pointer"
                aria-label="Pilih semua slide"
              />
              <span className="text-[11px] font-medium text-zinc-700">Pilih Semua</span>
            </label>
          )}

          {slides.length > 0 && <span className="hidden sm:inline text-zinc-300">·</span>}

          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-zinc-950">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" aria-hidden="true" />
            {`${activeCount} Tayang / ${slides.length} Slide`}
          </span>
          <span className="hidden sm:inline text-zinc-300">·</span>
          <span className="hidden sm:inline text-[11px]">
            Seret baris untuk mengatur urutan rotasi
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Collapsible Preview Toggle */}
          <button
            type="button"
            onClick={handleTogglePreview}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 hover:border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition shadow-xs active:scale-[0.98]"
            title={isPreviewVisible ? 'Sembunyikan Pratinjau Storefront' : 'Tampilkan Pratinjau Storefront'}
            aria-label={isPreviewVisible ? 'Sembunyikan Pratinjau Storefront' : 'Tampilkan Pratinjau Storefront'}
          >
            {isPreviewVisible ? (
              <>
                <PanelRightClose className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sembunyikan Pratinjau</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tampilkan Pratinjau</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#141416] hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition shadow-xs active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Slide</span>
          </button>
        </div>
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
          {/* Left: Sortable List (Dynamic 7 cols vs 12 cols, Gentle Luxury 800ms) */}
          <motion.div
            layout
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={cn(isPreviewVisible ? 'lg:col-span-7' : 'lg:col-span-12')}
          >
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
                  isSelected={selectedSlideIds.has(slide.id)}
                  onSelect={handleSelectSlide}
                  onFocusSlide={setFocusedSlideId}
                  onDragEnd={handleDragEnd}
                  onKeyboardMove={handleKeyboardMove}
                  onToggle={(id) => void handleToggle(id)}
                  onEdit={handleOpenEdit}
                  onDelete={(item) => void handleDelete(item)}
                />
              ))}
            </Reorder.Group>
          </motion.div>

          {/* Right: Eye-Catching Live Storefront Mirror (Collapsible with AnimatePresence, Gentle Luxury 800ms) */}
          <AnimatePresence>
            {isPreviewVisible && (
              <motion.div
                initial={{ opacity: 0, x: 24, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.98 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-5 lg:sticky lg:top-20"
              >
                <HeroLivePreview
                  slides={slides}
                  focusedSlide={focusedSlide}
                  onSelectSlide={setFocusedSlideId}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <HeroSlideModal
        isOpen={isModalOpen}
        editingSlide={editingSlide}
        formData={formData}
        uploading={uploading}
        dragTarget={dragTarget}
        previewErrors={previewErrors}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onChangeForm={setFormData}
        onSetPreviewError={setPreviewErrorFor}
        onDrag={handleDrag}
        onDrop={handleDrop}
        onFileSelect={handleFileSelect}
      />
      {/* Floating Action Bar (Monochrome Dock for Multi-Select Bulk Delete) */}
      <AnimatePresence>
        {selectedSlideIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3.5 rounded-full border border-zinc-800 bg-[#141416] px-5 py-2.5 text-white shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center gap-2 pr-3 border-r border-zinc-800 text-xs font-medium">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-zinc-950 tabular-nums">
                {selectedSlideIds.size}
              </span>
              <span>Slide Terpilih</span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSlideIds(new Set())}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Batalkan
            </button>

            <button
              type="button"
              onClick={() => void handleBulkDelete()}
              disabled={isBulkDeleting}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus ({selectedSlideIds.size})</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
