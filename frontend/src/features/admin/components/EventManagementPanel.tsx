'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Upload,
  Link as LinkIcon,
  X,
  Calendar,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { useNotice, useConfirm } from '@/shared/components';
import { cn } from '@/shared/utils/cn';
import type { CommunityEvent } from '../types';
import {
  AdminModalSubmitButton,
  useModalSubmit,
  MODAL_INPUT_CLASS,
  type SubmitVisualState,
} from './AdminModalSubmit';

export const EVENT_CATEGORIES = ['TRACK EVENT', 'COMMUNITY', 'WORKSHOP'] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export const EVENT_NOTICE_SOURCE = 'Event & Komunitas';
export type { SubmitVisualState };

interface EventFormData {
  category: string;
  tag: string;
  event_date: string;
  title: string;
  description: string;
  image_url: string;
  href: string;
  is_active: boolean;
}

const INITIAL_FORM: EventFormData = {
  category: 'TRACK EVENT',
  tag: 'CIRCUIT RUN',
  event_date: '',
  title: '',
  description: '',
  image_url: '',
  href: '',
  is_active: true,
};

export { MODAL_INPUT_CLASS };

function validateEventForm(form: EventFormData): string | null {
  if (!form.title.trim()) return 'Judul event wajib diisi.';
  if (!form.event_date.trim()) return 'Tanggal event wajib diisi.';
  if (!form.tag.trim()) return 'Tag event wajib diisi.';
  if (!form.description.trim()) return 'Deskripsi event wajib diisi.';
  if (!form.image_url.trim()) return 'Unggah gambar poster atau isi URL gambar event.';
  return null;
}

interface EventFormModalProps {
  readonly isOpen: boolean;
  readonly editingEvent: CommunityEvent | null;
  readonly formData: EventFormData;
  readonly isUploading: boolean;
  readonly dragActive: boolean;
  readonly previewError: boolean;
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.FormEvent) => Promise<boolean>;
  readonly onChangeForm: React.Dispatch<React.SetStateAction<EventFormData>>;
  readonly onSetPreviewError: (err: boolean) => void;
  readonly onDrag: (e: React.DragEvent) => void;
  readonly onDrop: (e: React.DragEvent) => void;
  readonly onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function EventFormModal({
  isOpen,
  editingEvent,
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
}: Readonly<EventFormModalProps>) {
  const { submitState, isCloseLocked, handleFormSubmit } = useModalSubmit({
    isOpen,
    isUploading,
    resetTrigger: editingEvent,
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
        aria-label="Tutup modal event"
        onClick={isCloseLocked ? undefined : onClose}
        disabled={isCloseLocked}
        className="fixed inset-0 w-full h-full bg-zinc-950/45 backdrop-blur-xs transition-opacity cursor-default"
      />

      {/* Dialog Box Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        className="relative flex flex-col w-full max-w-xl max-h-[88vh] overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-950 shadow-2xl"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-zinc-200 px-5 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h3 id="event-modal-title" className="font-semibold text-sm text-zinc-950">
              {editingEvent ? 'Edit Agenda Event' : 'Tambah Event Komunitas Baru'}
            </h3>
            <p className="text-[11px] text-zinc-500">
              Lengkapi jadwal, deskripsi, dan visual poster rasio 4:3.
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
            {/* Category & Tag Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="event-category" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Kategori Event
                </label>
                <select
                  id="event-category"
                  value={formData.category}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, category: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'cursor-pointer')}
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="event-tag" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Tag / Label Sub-Kategori
                </label>
                <input
                  id="event-tag"
                  type="text"
                  required
                  placeholder="Contoh: CIRCUIT RUN atau KOPDAR"
                  value={formData.tag}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, tag: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'font-mono')}
                />
              </div>
            </div>

            {/* Event Date & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label htmlFor="event-date" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Tanggal Event
                </label>
                <input
                  id="event-date"
                  type="text"
                  required
                  placeholder="14 MEI 2026"
                  value={formData.event_date}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, event_date: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'font-mono font-semibold')}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="event-title" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Judul Event
                </label>
                <input
                  id="event-title"
                  type="text"
                  required
                  placeholder="Contoh: ARM Track Day Mandalika 2026"
                  value={formData.title}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, title: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'font-semibold')}
                />
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label htmlFor="event-description" className="block text-[11px] font-medium text-zinc-700 mb-1">
                Deskripsi Event
              </label>
              <textarea
                id="event-description"
                required
                rows={3}
                placeholder="Jelaskan detail agenda, lokasi, dan ketentuan partisipasi..."
                value={formData.description}
                onChange={(e) => onChangeForm((prev) => ({ ...prev, description: e.target.value }))}
                className={cn(MODAL_INPUT_CLASS, 'resize-none leading-relaxed')}
              />
            </div>

            {/* Href / Target Link (Optional) */}
            <div>
              <label htmlFor="event-href" className="block text-[11px] font-medium text-zinc-700 mb-1">
                URL Registrasi / Info Eksternal (Opsional)
              </label>
              <input
                id="event-href"
                type="text"
                placeholder="Contoh: https://instagram.com/... atau /events/mandalika"
                value={formData.href}
                onChange={(e) => onChangeForm((prev) => ({ ...prev, href: e.target.value }))}
                className={cn(MODAL_INPUT_CLASS, 'font-mono')}
              />
            </div>

            {/* Media Upload Dropzone & Manual URL Fallback */}
            <div className="space-y-2">
              <label className="block text-[11px] font-medium text-zinc-700">
                Poster Gambar Event (Rasio 4:3)
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
                aria-label="Unggah poster event"
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
                    <span className="font-medium text-zinc-900">Mengunggah poster event...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-zinc-400 mb-1" />
                    <span className="text-zinc-900 font-medium">Klik atau seret poster ke sini</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      Maksimal 5MB (Format JPEG, PNG, atau WebP)
                    </span>
                  </>
                )}
              </button>

              {/* Manual URL Input Fallback */}
              <div>
                <input
                  type="text"
                  placeholder="Atau masukkan URL poster gambar manual (misal: /images/events/...)"
                  value={formData.image_url}
                  onChange={(e) => {
                    onChangeForm((prev) => ({ ...prev, image_url: e.target.value }));
                    onSetPreviewError(false);
                  }}
                  className={cn(MODAL_INPUT_CLASS, 'font-mono py-1.5')}
                />
              </div>

              {/* 4:3 Image Preview */}
              {formData.image_url && (
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500">Pratinjau Aspek 4:3:</span>
                  <div className="relative aspect-[4/3] max-w-[200px] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                    {previewError ? (
                      <div className="flex flex-col items-center justify-center h-full w-full bg-zinc-100 text-zinc-500 text-center p-3">
                        <ImageIcon className="h-5 w-5 mb-1 text-zinc-400" />
                        <span className="text-[10px]">URL gambar tidak valid atau tidak dapat dimuat</span>
                      </div>
                    ) : (
                      <img
                        src={formData.image_url}
                        alt="Pratinjau event"
                        className="w-full h-full object-cover"
                        onError={() => onSetPreviewError(true)}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active Toggle Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300 bg-white text-zinc-900 focus:ring-0 focus:outline-none"
                />
                <span className="text-xs text-zinc-700 font-medium">
                  Tayangkan event pada galeri komunitas beranda
                </span>
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
              idleLabel="Simpan Event"
              savedLabel="Tersimpan!"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export function EventManagementPanel() {
  const { notify } = useNotice();
  const confirm = useConfirm();

  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reordering, setReordering] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(INITIAL_FORM);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDeletesRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup pending delete timers on unmount
  useEffect(() => {
    const pending = pendingDeletesRef.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  // Fetch all community events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/community-events', {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`Gagal memuat event komunitas (HTTP ${res.status}).`);
      }
      const data: CommunityEvent[] = await res.json();
      setEvents(data.sort((a, b) => a.sort_order - b.sort_order));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan jaringan.';
      notify?.error('Gagal Memuat Data', msg, {
        source: EVENT_NOTICE_SOURCE,
        action: 'fetch',
        detail: msg,
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  // Open modal for create
  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData(INITIAL_FORM);
    setPreviewError(false);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (eventItem: CommunityEvent) => {
    setEditingEvent(eventItem);
    setFormData({
      category: eventItem.category,
      tag: eventItem.tag,
      event_date: eventItem.event_date,
      title: eventItem.title,
      description: eventItem.description,
      image_url: eventItem.image_url,
      href: eventItem.href ?? '',
      is_active: eventItem.is_active,
    });
    setPreviewError(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    if (isUploading) return;
    setIsModalOpen(false);
    setEditingEvent(null);
    setFormData(INITIAL_FORM);
    setPreviewError(false);
  }, [isUploading]);

  // Handle Image Upload File
  const handleFileUpload = async (file: File) => {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      notify?.error('Format Tidak Didukung', 'Gunakan file JPEG, PNG, atau WebP.', {
        source: EVENT_NOTICE_SOURCE,
        action: 'upload',
        detail: `Tipe file ${file.type} tidak didukung`,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify?.error('File Terlalu Besar', 'Ukuran maksimal file gambar adalah 5MB.', {
        source: EVENT_NOTICE_SOURCE,
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
      notify?.success('Upload Berhasil', 'Poster event berhasil diunggah.', {
        source: EVENT_NOTICE_SOURCE,
        action: 'upload',
        detail: result.url,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah file media.';
      notify?.error('Upload Gagal', msg, {
        source: EVENT_NOTICE_SOURCE,
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

  // Handle Form Submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();

    const validationError = validateEventForm(formData);
    if (validationError) {
      notify?.error('Validasi Gagal', validationError, {
        source: EVENT_NOTICE_SOURCE,
        action: editingEvent ? 'update' : 'create',
        detail: validationError,
      });
      return false;
    }

    const payload = {
      category: formData.category.trim(),
      tag: formData.tag.trim(),
      event_date: formData.event_date.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      image_url: formData.image_url.trim(),
      href: formData.href.trim() || undefined,
      is_active: formData.is_active,
    };

    try {
      if (editingEvent) {
        // Update event
        const res = await fetch(`/api/admin/community-events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message ?? 'Gagal memperbarui event komunitas.');
        }

        const updated = await res.json();
        setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
        notify?.success('Event Diperbarui', `Event "${updated.title}" berhasil disimpan.`, {
          source: EVENT_NOTICE_SOURCE,
          action: 'update',
          detail: `ID: ${updated.id}`,
        });
      } else {
        // Create event
        const res = await fetch('/api/admin/community-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message ?? 'Gagal menambahkan event baru.');
        }

        const created = await res.json();
        setEvents((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
        notify?.success('Event Ditambahkan', `Event "${created.title}" berhasil dibuat.`, {
          source: EVENT_NOTICE_SOURCE,
          action: 'create',
          detail: `ID: ${created.id}`,
        });
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      notify?.error('Gagal Menyimpan', msg, {
        source: EVENT_NOTICE_SOURCE,
        action: editingEvent ? 'update' : 'create',
        detail: msg,
      });
      return false;
    }
  };

  // Optimistic Toggle Active Status
  const handleToggle = async (eventId: string) => {
    const targetEvent = events.find((ev) => ev.id === eventId);
    if (!targetEvent) return;

    const previousStatus = targetEvent.is_active;
    const nextStatus = !previousStatus;

    // Optimistic UI update
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, is_active: nextStatus } : ev))
    );

    try {
      const res = await fetch(`/api/admin/community-events/${eventId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Gagal memperbarui status aktif di server.');
      }

      const updated = await res.json();
      setEvents((prev) => prev.map((ev) => (ev.id === eventId ? updated : ev)));
      const statusText = nextStatus ? 'diaktifkan' : 'dinonaktifkan';
      notify?.success('Status Berubah', `Event "${targetEvent.title}" telah ${statusText}.`, {
        source: EVENT_NOTICE_SOURCE,
        action: 'toggle',
        detail: `ID: ${eventId}, is_active: ${nextStatus}`,
      });
    } catch (err: unknown) {
      // Revert optimistic update
      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, is_active: previousStatus } : ev))
      );
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui status aktif.';
      notify?.error('Gagal Mengubah Status', msg, {
        source: EVENT_NOTICE_SOURCE,
        action: 'toggle',
        detail: msg,
      });
    }
  };

  // Reorder Events (Move Up / Move Down)
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= events.length) return;

    const newEvents = [...events];
    const temp = newEvents[index];
    newEvents[index] = newEvents[targetIndex];
    newEvents[targetIndex] = temp;

    // Optimistically update positions
    const reindexed = newEvents.map((ev, idx) => ({ ...ev, sort_order: idx + 1 }));
    setEvents(reindexed);
    setReordering(true);

    try {
      const res = await fetch('/api/admin/community-events/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: reindexed.map((ev) => ev.id) }),
      });

      if (!res.ok) {
        throw new Error('Gagal memperbarui urutan event di server.');
      }

      notify?.success('Urutan Diperbarui', 'Urutan event komunitas berhasil disimpan.', {
        source: EVENT_NOTICE_SOURCE,
        action: 'reorder',
        detail: `Total event: ${reindexed.length}`,
      });
    } catch (err: unknown) {
      // Rollback to previous order
      setEvents(events);
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui urutan.';
      notify?.error('Gagal Mengubah Urutan', msg, {
        source: EVENT_NOTICE_SOURCE,
        action: 'reorder',
        detail: msg,
      });
    } finally {
      setReordering(false);
    }
  };

  // Delete Event
  const handleDelete = async (eventItem: CommunityEvent) => {
    const confirmed = await confirm({
      title: 'Hapus Event Komunitas?',
      description: 'Event ini akan dihapus dari daftar kalender kegiatan storefront.',
      itemPreview: eventItem.title,
      confirmText: 'Hapus Event',
      variant: 'danger',
    });
    if (!confirmed) return;

    // 1. Optimistic removal from state
    const previousEvents = events;
    const removedIndex = events.findIndex((ev) => ev.id === eventItem.id);
    setEvents((prev) => prev.filter((ev) => ev.id !== eventItem.id));

    // 2. Schedule commit with 6-second delay
    let isUndone = false;
    const timeoutId = setTimeout(async () => {
      pendingDeletesRef.current.delete(eventItem.id);
      if (isUndone) return;

      try {
        const res = await fetch(`/api/admin/community-events/${eventItem.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error('Gagal menghapus event dari server.');
        }
      } catch (err: unknown) {
        // Rollback on server error
        setEvents(previousEvents);
        const msg = err instanceof Error ? err.message : 'Gagal menghapus event.';
        notify?.error('Gagal Menghapus', `${msg} Data event dipulihkan.`, {
          source: EVENT_NOTICE_SOURCE,
          action: 'delete',
          detail: msg,
        });
      }
    }, 6000);

    pendingDeletesRef.current.set(eventItem.id, timeoutId);

    // 3. Show DynamicIslandNotice with Undo button
    notify?.info('Event Dihapus', `Event "${eventItem.title}" disembunyikan.`, {
      duration: 6000,
      source: EVENT_NOTICE_SOURCE,
      action: 'delete',
      detail: `ID: ${eventItem.id}`,
      actionButton: {
        label: 'Urungkan',
        onClick: () => {
          isUndone = true;
          const timer = pendingDeletesRef.current.get(eventItem.id);
          if (timer) {
            clearTimeout(timer);
            pendingDeletesRef.current.delete(eventItem.id);
          }
          setEvents((prev) => {
            const exists = prev.some((ev) => ev.id === eventItem.id);
            if (exists) return prev;
            const next = [...prev];
            const insertIdx =
              removedIndex >= 0 && removedIndex <= next.length ? removedIndex : next.length;
            next.splice(insertIdx, 0, eventItem);
            return next;
          });
          notify?.success('Pemulihan Berhasil', `Event "${eventItem.title}" telah dipulihkan.`, {
            source: EVENT_NOTICE_SOURCE,
            action: 'undo',
          });
        },
      },
    });
  };

  const activeCount = events.filter((ev) => ev.is_active).length;

  return (
    <section aria-label="Manajemen Event & Komunitas" className="space-y-5">
      {/* 1. Minimalist Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-zinc-950">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" aria-hidden="true" />
            {`${activeCount} Tayang / ${events.length} Event`}
          </span>
          <span className="hidden sm:inline text-zinc-300">·</span>
          <span className="hidden sm:inline text-[11px]">
            Gunakan kontrol urutan untuk mengatur prioritas agenda
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#141416] hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition shadow-xs active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Event</span>
        </button>
      </div>

      {/* 2. Events Grid / List Canvas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-16 text-center shadow-xs">
          <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
          <p className="mt-3 text-xs text-zinc-500">Memuat agenda event komunitas...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-16 text-center shadow-xs">
          <Calendar className="h-10 w-10 text-zinc-300" />
          <h3 className="mt-3 text-sm font-semibold text-zinc-950">Belum Ada Agenda Event</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm">
            Publikasikan jadwal track day atau kopdar komunitas agar pengendara dapat berpartisipasi.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#141416] hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Event Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((eventItem, index) => {
            const isFirst = index === 0;
            const isLast = index === events.length - 1;
            const isDeleting = deletingId === eventItem.id;

            return (
              <div
                key={eventItem.id}
                className={cn(
                  'flex flex-col justify-between rounded-xl border p-4 sm:p-5 transition-all duration-200',
                  eventItem.is_active
                    ? 'border-zinc-200 bg-white shadow-xs'
                    : 'border-zinc-200 bg-zinc-50/70 opacity-75'
                )}
              >
                {/* Top Section: Reorder, 4:3 Image Thumbnail, Details */}
                <div className="flex gap-4">
                  {/* Reorder Buttons & Index */}
                  <div className="flex flex-col items-center justify-start gap-1 shrink-0 pt-1">
                    <button
                      type="button"
                      onClick={() => void handleMove(index, 'up')}
                      disabled={isFirst || reordering}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 disabled:opacity-20 transition"
                      aria-label={`Pindahkan event ${eventItem.title} ke atas`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-mono text-[11px] font-bold text-zinc-500 tabular-nums">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleMove(index, 'down')}
                      disabled={isLast || reordering}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 disabled:opacity-20 transition"
                      aria-label={`Pindahkan event ${eventItem.title} ke bawah`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* 4:3 Image Thumbnail Preview */}
                  <div className="relative aspect-[4/3] w-28 sm:w-36 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-900 shadow-2xs">
                    {eventItem.image_url ? (
                      <img
                        src={eventItem.image_url}
                        alt={eventItem.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-500">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                    <div className="absolute top-1.5 left-1.5">
                      <span className="rounded bg-[#0A0A0B]/80 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider text-zinc-200 backdrop-blur-xs border border-white/10 uppercase">
                        {eventItem.category}
                      </span>
                    </div>
                  </div>

                  {/* Event Meta & Titles */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span className="font-mono font-semibold text-[11px] text-zinc-950">
                        {eventItem.event_date}
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span className="font-mono text-[10px] uppercase text-zinc-400 truncate">
                        {eventItem.tag}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-zinc-950 line-clamp-1" title={eventItem.title}>
                      {eventItem.title}
                    </h3>

                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {eventItem.description}
                    </p>

                    {eventItem.href && (
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 pt-0.5">
                        <LinkIcon className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[180px] font-mono">
                          {eventItem.href}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Section: Active Toggle & Edit/Delete */}
                <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-zinc-100">
                  {/* Status Toggle Switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-zinc-500">
                      {eventItem.is_active ? 'Tayang' : 'Disimpan'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={eventItem.is_active}
                      onClick={() => void handleToggle(eventItem.id)}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                        eventItem.is_active ? 'bg-zinc-900' : 'bg-zinc-300'
                      )}
                      aria-label={`Ubah status aktif event ${eventItem.title}`}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                          eventItem.is_active ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(eventItem)}
                      className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition shadow-2xs"
                      title="Edit event"
                      aria-label={`Edit event ${eventItem.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(eventItem)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition shadow-2xs disabled:opacity-50"
                      title="Hapus event"
                      aria-label={`Hapus event ${eventItem.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Modal Form (Create / Edit) */}
      <EventFormModal
        isOpen={isModalOpen}
        editingEvent={editingEvent}
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
