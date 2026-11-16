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
  Layers,
  X,
  GripVertical,
} from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import { useNotice, useDoubleSafetyAction, ACTION_PRESETS } from '@/shared/components';
import { cn } from '@/shared/utils/cn';
import type { HomeValuePropItem, HomeSectionHeader } from '../types';
import {
  AdminModalSubmitButton,
  useModalSubmit,
  MODAL_INPUT_CLASS,
} from './AdminModalSubmit';

export const VALUE_PROPS_NOTICE_SOURCE = 'Pilar Keunggulan';

interface ValuePropFormData {
  step_number: string;
  title: string;
  description: string;
  is_active: boolean;
}

const INITIAL_FORM: ValuePropFormData = {
  step_number: '',
  title: '',
  description: '',
  is_active: true,
};

function validateValuePropForm(form: ValuePropFormData): string | null {
  if (!form.title.trim()) return 'Judul pilar keunggulan wajib diisi.';
  if (!form.description.trim()) return 'Deskripsi pilar keunggulan wajib diisi.';
  return null;
}

interface ValuePropModalProps {
  readonly isOpen: boolean;
  readonly editingItem: HomeValuePropItem | null;
  readonly formData: ValuePropFormData;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.FormEvent) => Promise<boolean>;
  readonly onChangeForm: React.Dispatch<React.SetStateAction<ValuePropFormData>>;
}

function ValuePropModal({
  isOpen,
  editingItem,
  formData,
  onClose,
  onSubmit,
  onChangeForm,
}: Readonly<ValuePropModalProps>) {
  const { submitState, isCloseLocked, handleFormSubmit } = useModalSubmit({
    isOpen,
    isUploading: false,
    resetTrigger: editingItem,
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
        aria-label="Tutup modal pilar keunggulan"
        onClick={isCloseLocked ? undefined : onClose}
        disabled={isCloseLocked}
        className="fixed inset-0 w-full h-full bg-zinc-950/45 backdrop-blur-xs transition-opacity cursor-default"
      />

      {/* Dialog Box Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="value-prop-modal-title"
        className="relative flex flex-col w-full max-w-lg max-h-[88vh] overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-950 shadow-2xl"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-zinc-200 px-5 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h3 id="value-prop-modal-title" className="font-semibold text-sm text-zinc-950">
              {editingItem ? 'Edit Pilar Keunggulan' : 'Tambah Pilar Keunggulan Baru'}
            </h3>
            <p className="text-[11px] text-zinc-500">
              Pilar akan ditampilkan berurutan pada seksi Why ARM Exhaust di beranda storefront.
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
            {/* Step Number & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-1">
                <label htmlFor="prop-step" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Nomor Langkah
                </label>
                <input
                  id="prop-step"
                  type="text"
                  placeholder="01"
                  maxLength={10}
                  value={formData.step_number}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, step_number: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'font-mono font-bold text-center')}
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="prop-title" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Judul Pilar
                </label>
                <input
                  id="prop-title"
                  type="text"
                  required
                  placeholder="Contoh: Presisi Mandrel Bending"
                  value={formData.title}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, title: e.target.value }))}
                  className={cn(MODAL_INPUT_CLASS, 'font-semibold')}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="prop-description" className="block text-[11px] font-medium text-zinc-700 mb-1">
                Deskripsi Keunggulan
              </label>
              <textarea
                id="prop-description"
                required
                rows={4}
                placeholder="Jelaskan proses, material, atau jaminan mutu yang ditawarkan..."
                value={formData.description}
                onChange={(e) => onChangeForm((prev) => ({ ...prev, description: e.target.value }))}
                className={cn(MODAL_INPUT_CLASS, 'resize-none leading-relaxed')}
              />
            </div>

            {/* Active Toggle in Form */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="prop-active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => onChangeForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-950 accent-zinc-950 focus:ring-zinc-950/20 cursor-pointer"
              />
              <label htmlFor="prop-active" className="text-xs text-zinc-700 cursor-pointer select-none">
                Langsung aktifkan dan tayangkan di beranda storefront
              </label>
            </div>
          </div>

          {/* Footer Submit Button */}
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
              idleLabel={editingItem ? 'Simpan Perubahan' : 'Tambah Pilar'}
              savedLabel="Tersimpan!"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

interface ValuePropSortableRowProps {
  readonly item: HomeValuePropItem;
  readonly index: number;
  readonly total: number;
  readonly reordering: boolean;
  readonly onKeyboardMove: (index: number, direction: 'up' | 'down') => void;
  readonly onToggle: (id: string) => void;
  readonly onEdit: (item: HomeValuePropItem) => void;
  readonly onDelete: (item: HomeValuePropItem) => void;
  readonly onDragEnd: () => void;
}

function ValuePropSortableRow({
  item,
  index,
  total,
  reordering,
  onKeyboardMove,
  onToggle,
  onEdit,
  onDelete,
  onDragEnd,
}: Readonly<ValuePropSortableRowProps>) {
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
      {/* Left Section: Drag Grip & Step Number (Standardized to Hero Carousel) */}
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
          aria-label={`Seret atau gunakan panah atas/bawah untuk memindahkan pilar ${item.title}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <span className="w-5 font-mono text-[11px] font-semibold text-zinc-500 tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Center Section: Title & Full-width Description */}
      <div className="min-w-0 flex-1 space-y-0.5 sm:px-2">
        <h3 className="font-semibold text-sm text-zinc-950 leading-snug">
          {item.title}
        </h3>
        <p className="text-xs text-zinc-500 line-clamp-1 sm:line-clamp-2 leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Right Section: Active Toggle & Edit/Delete Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-zinc-500 min-w-[42px] text-right">
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
            aria-label={`Ubah status aktif pilar ${item.title}`}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                item.is_active ? 'translate-x-4' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        <div className="flex items-center gap-1 border-l border-zinc-200 pl-2 sm:pl-3">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="group/btn inline-flex items-center gap-1.5 h-7 px-2 rounded-lg border border-transparent text-zinc-500 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:border-zinc-950 focus-visible:bg-zinc-100 focus-visible:text-zinc-950 focus-visible:outline-none transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            title="Edit pilar"
            aria-label={`Edit pilar ${item.title}`}
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
            title="Hapus pilar"
            aria-label={`Hapus pilar ${item.title}`}
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

interface ValuePropsManagementPanelProps {
  readonly className?: string;
}

export function ValuePropsManagementPanel({ className }: Readonly<ValuePropsManagementPanelProps>) {
  const { notify } = useNotice();

  const [items, setItems] = useState<HomeValuePropItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);

  const latestOrderRef = useRef<HomeValuePropItem[]>(items);
  const lastCommittedRef = useRef<HomeValuePropItem[]>(items);

  const persistOrder = useCallback(
    async (orderedItems: HomeValuePropItem[], fallbackSnapshot: HomeValuePropItem[]) => {
      const normalized = orderedItems.map((it, idx) => ({
        ...it,
        sort_order: idx,
        step_number: String(idx + 1).padStart(2, '0'),
      }));
      setItems(normalized);
      latestOrderRef.current = normalized;
      setReordering(true);
      try {
        const res = await fetch('/api/admin/home/value-props/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds: normalized.map((it) => it.id) }),
        });

        if (!res.ok) {
          throw new Error('Gagal memperbarui urutan di server.');
        }

        lastCommittedRef.current = normalized;
        notify?.success('Urutan Diperbarui', 'Urutan pilar keunggulan berhasil disinkronkan.', {
          source: VALUE_PROPS_NOTICE_SOURCE,
          action: 'reorder',
        });
      } catch (err: unknown) {
        setItems(fallbackSnapshot);
        latestOrderRef.current = fallbackSnapshot;
        const msg = err instanceof Error ? err.message : 'Gagal mengubah urutan.';
        notify?.error('Gagal Reorder', msg, {
          source: VALUE_PROPS_NOTICE_SOURCE,
        });
      } finally {
        setReordering(false);
      }
    },
    [notify]
  );

  const handleDragReorder = (nextOrder: HomeValuePropItem[]) => {
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

  // Section 2 Header Editor state
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [headerData, setHeaderData] = useState<HomeSectionHeader>({
    tag: 'Why ARM Exhaust',
    title: 'Custom, precise, warranted.',
  });
  const [isSavingHeader, setIsSavingHeader] = useState(false);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HomeValuePropItem | null>(null);
  const [formData, setFormData] = useState<ValuePropFormData>(INITIAL_FORM);

  // Load items and headers on mount
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [propsRes, headersRes] = await Promise.all([
        fetch('/api/admin/home/value-props'),
        fetch('/api/admin/home/headers'),
      ]);

      if (propsRes.ok) {
        const propsData = (await propsRes.json()) as unknown;
        if (Array.isArray(propsData)) {
          const sorted = [...(propsData as HomeValuePropItem[])].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          );
          setItems(sorted);
          latestOrderRef.current = sorted;
          lastCommittedRef.current = sorted;
        }
      }

      if (headersRes.ok) {
        const headersJson = await headersRes.json();
        if (headersJson?.section2) {
          setHeaderData({
            tag: headersJson.section2.tag ?? 'Why ARM Exhaust',
            title: headersJson.section2.title ?? 'Custom, precise, warranted.',
          });
        }
      }
    } catch {
      notify?.error('Gagal Memuat Data', 'Tidak dapat mengambil data pilar keunggulan.', {
        source: VALUE_PROPS_NOTICE_SOURCE,
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Save Header Section 2
  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHeader(true);
    try {
      const res = await fetch('/api/admin/home/headers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section2: headerData }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message ?? 'Gagal menyimpan header seksi 2.');
      }

      notify?.success('Header Diperbarui', 'Judul dan tagline Why ARM Exhaust berhasil disimpan.', {
        source: VALUE_PROPS_NOTICE_SOURCE,
        action: 'update_header',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan header.';
      notify?.error('Gagal Menyimpan', msg, {
        source: VALUE_PROPS_NOTICE_SOURCE,
      });
    } finally {
      setIsSavingHeader(false);
    }
  };

  // Toggle Active
  const handleToggle = async (id: string) => {
    const target = items.find((it) => it.id === id);
    if (!target) return;

    const prevActive = target.is_active;
    const nextActive = !prevActive;

    // Optimistic update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, is_active: nextActive } : it))
    );

    try {
      const res = await fetch(`/api/admin/home/value-props/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Gagal memperbarui status pilar di server.');
      }

      const updated = (await res.json()) as HomeValuePropItem;
      setItems((prev) => {
        const next = prev.map((it) => (it.id === id ? updated : it));
        latestOrderRef.current = next;
        lastCommittedRef.current = next;
        return next;
      });
      const statusText = nextActive ? 'diaktifkan' : 'dinonaktifkan';
      notify?.success('Status Berubah', `Pilar "${target.title}" telah ${statusText}.`, {
        source: VALUE_PROPS_NOTICE_SOURCE,
        action: 'toggle',
      });
    } catch (err: unknown) {
      // Revert
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, is_active: prevActive } : it))
      );
      const msg = err instanceof Error ? err.message : 'Gagal mengubah status aktif.';
      notify?.error('Gagal Mengubah Status', msg, {
        source: VALUE_PROPS_NOTICE_SOURCE,
      });
    }
  };

  // Delete Item via Double-Safety Engine
  const { executeAction: executeDeleteItem } = useDoubleSafetyAction<HomeValuePropItem>({
    preset: ACTION_PRESETS.VALUE_PROP_DELETE,
    noticeSource: VALUE_PROPS_NOTICE_SOURCE,
    getItemPreview: (item) => item.title,
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
      const res = await fetch(`/api/admin/home/value-props/${item.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Gagal menghapus pilar keunggulan dari server.');
      }
      latestOrderRef.current = latestOrderRef.current.filter((it) => it.id !== item.id);
      lastCommittedRef.current = latestOrderRef.current;
    },
  });

  const handleDelete = (item: HomeValuePropItem) => {
    const index = items.findIndex((it) => it.id === item.id);
    void executeDeleteItem(item, index);
  };

  // Open Modal Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    const nextStep = String(items.length + 1).padStart(2, '0');
    setFormData({
      step_number: nextStep,
      title: '',
      description: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (item: HomeValuePropItem) => {
    setEditingItem(item);
    setFormData({
      step_number: item.step_number || '',
      title: item.title,
      description: item.description,
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  // Form Submit (Create / Edit)
  const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();

    const valError = validateValuePropForm(formData);
    if (valError) {
      notify?.error('Validasi Gagal', valError, {
        source: VALUE_PROPS_NOTICE_SOURCE,
      });
      return false;
    }

    const payload = {
      step_number: formData.step_number.trim() || undefined,
      title: formData.title.trim(),
      description: formData.description.trim(),
      is_active: formData.is_active,
    };

    try {
      if (editingItem) {
        const res = await fetch(`/api/admin/home/value-props/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message ?? 'Gagal memperbarui pilar keunggulan.');
        }

        const updated = (await res.json()) as HomeValuePropItem;
        setItems((prev) => {
          const next = prev.map((it) => (it.id === updated.id ? updated : it));
          latestOrderRef.current = next;
          lastCommittedRef.current = next;
          return next;
        });
        notify?.success('Pilar Diperbarui', `Pilar "${updated.title}" berhasil disimpan.`, {
          source: VALUE_PROPS_NOTICE_SOURCE,
          action: 'update',
        });
      } else {
        const res = await fetch('/api/admin/home/value-props', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message ?? 'Gagal menambahkan pilar baru.');
        }

        const created = (await res.json()) as HomeValuePropItem;
        setItems((prev) => {
          const next = [...prev, created].sort((a, b) => a.sort_order - b.sort_order);
          latestOrderRef.current = next;
          lastCommittedRef.current = next;
          return next;
        });
        notify?.success('Pilar Ditambahkan', `Pilar "${created.title}" berhasil dibuat.`, {
          source: VALUE_PROPS_NOTICE_SOURCE,
          action: 'create',
        });
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      notify?.error('Gagal Menyimpan', msg, {
        source: VALUE_PROPS_NOTICE_SOURCE,
      });
      return false;
    }
  };

  const activeCount = Array.isArray(items) ? items.filter((it) => it.is_active).length : 0;

  return (
    <section
      aria-label="Manajemen Pilar Keunggulan"
      className={cn('space-y-6', className)}
    >
      {/* 1. Header & Section 2 Tagline/Title Settings Editor */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsHeaderExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 sm:px-5 hover:bg-zinc-50/70 transition text-left"
          aria-expanded={isHeaderExpanded}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-950">
                Pengaturan Header Seksi (Why ARM Exhaust)
              </h2>
              <p className="text-[11px] text-zinc-500">
                Atur tagline dan judul utama yang tampil di atas pilar keunggulan storefront.
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
                  htmlFor="sec2-tag"
                  className="block text-[11px] font-medium text-zinc-700 mb-1"
                >
                  Tagline Seksi (Tag)
                </label>
                <input
                  id="sec2-tag"
                  type="text"
                  maxLength={50}
                  value={headerData.tag ?? ''}
                  onChange={(e) =>
                    setHeaderData((prev) => ({ ...prev, tag: e.target.value }))
                  }
                  placeholder="Why ARM Exhaust"
                  className={cn(MODAL_INPUT_CLASS, 'font-medium bg-white')}
                />
              </div>

              <div>
                <label
                  htmlFor="sec2-title"
                  className="block text-[11px] font-medium text-zinc-700 mb-1"
                >
                  Judul Utama Seksi
                </label>
                <input
                  id="sec2-title"
                  type="text"
                  maxLength={150}
                  value={headerData.title ?? ''}
                  onChange={(e) =>
                    setHeaderData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Custom, precise, warranted."
                  className={cn(MODAL_INPUT_CLASS, 'font-medium bg-white')}
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

      {/* 2. Minimalist Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-zinc-950">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" aria-hidden="true" />
            {`${activeCount} Tayang / ${items.length} Pilar`}
          </span>
          <span className="hidden sm:inline text-zinc-300">·</span>
          <span className="hidden sm:inline text-[11px]">
            Tahan dan geser item untuk mengubah alur urutan pilar di beranda
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#141416] hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition shadow-xs active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Pilar</span>
        </button>
      </div>

      {/* 3. Cards Grid / List Canvas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-16 text-center shadow-xs">
          <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
          <p className="mt-3 text-xs text-zinc-500">Memuat pilar keunggulan...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-16 text-center shadow-xs">
          <Layers className="h-10 w-10 text-zinc-300" />
          <h3 className="mt-3 text-sm font-semibold text-zinc-950">
            Belum Ada Pilar Keunggulan
          </h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm">
            Publikasikan keunggulan manufaktur, material, atau garansi knalpot ARM Exhaust.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#141416] hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Pilar Pertama</span>
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
            <ValuePropSortableRow
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
      <ValuePropModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        formData={formData}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        onChangeForm={setFormData}
      />
    </section>
  );
}
