'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNotice } from '@/shared/components';
import { CrmMetricsRibbon } from './CrmMetricsRibbon';
import { CrmToolbar } from './CrmToolbar';
import { VipInviteModal } from './VipInviteModal';
import { CustomerDetailDrawer } from './CustomerDetailDrawer';
import type { AdminUser, MasterRole, CrmMetrics, VipInviteItem } from '../types';

export function UserManagementTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<MasterRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Checkbox multi-select state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Modals & Drawers
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [drawerUser, setDrawerUser] = useState<AdminUser | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // CRM Ribbon Metrics
  const [metrics, setMetrics] = useState<CrmMetrics>({
    totalUsers: 0,
    resellerCount: 0,
    distributorCount: 0,
    pendingInvites: 0,
  });

  let notify: any = null;
  try {
    const noticeCtx = useNotice();
    notify = noticeCtx?.notify;
  } catch {}

  // Fetch Master Roles
  useEffect(() => {
    fetch('/api/admin/roles')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRoles(data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch KPI Ribbon Metrics
  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const [allUsersRes, resellerRes, distributorRes, invitesRes] = await Promise.allSettled([
        fetch('/api/admin/users?limit=1').then((r) => r.json()),
        fetch('/api/admin/users?role=reseller&limit=1').then((r) => r.json()),
        fetch('/api/admin/users?role=distributor&limit=1').then((r) => r.json()),
        fetch('/api/admin/reseller-invites').then((r) => r.json()),
      ]);

      const totalUsers =
        allUsersRes.status === 'fulfilled' ? allUsersRes.value?.pagination?.total ?? 0 : 0;
      const resellerCount =
        resellerRes.status === 'fulfilled' ? resellerRes.value?.pagination?.total ?? 0 : 0;
      const distributorCount =
        distributorRes.status === 'fulfilled' ? distributorRes.value?.pagination?.total ?? 0 : 0;

      let pendingInvites = 0;
      if (invitesRes.status === 'fulfilled') {
        const inviteItems: VipInviteItem[] = invitesRes.value?.invites || [];
        pendingInvites = inviteItems.filter(
          (inv) => inv.status === 'active' && !inv.is_revoked && !inv.isRevoked
        ).length;
      }

      setMetrics({
        totalUsers,
        resellerCount,
        distributorCount,
        pendingInvites,
      });
    } catch {
      // Graceful fallback
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Fetch Users Table
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter !== 'all') params.set('role', roleFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Gagal memuat data pelanggan.');
      }
      const data = await res.json();
      setUsers(data.users || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar pengguna.';
      notify?.error('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page, limit, notify]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Search Input Change with Page Reset
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  // Handle Role Filter Change with Page Reset
  const handleRoleFilterChange = (val: string) => {
    setRoleFilter(val);
    setPage(1);
  };

  // Handle Role Update from CustomerDetailDrawer
  const handleRoleUpdated = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengubah peran pengguna.');
      }

      notify?.success('Role Berhasil Diperbarui', data.message || `Peran diubah menjadi ${newRole}.`);

      if (drawerUser && drawerUser.id === userId) {
        setDrawerUser((prev) => (prev ? { ...prev, role: newRole } : null));
      }

      fetchUsers();
      fetchMetrics();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat mengubah role.';
      notify?.error('Gagal Update Role', msg);
    }
  };

  const openDetailDrawer = (user: AdminUser) => {
    setDrawerUser(user);
    setIsDrawerOpen(true);
  };

  const getCleanName = (rawName?: string, email?: string) => {
    const raw = rawName || email || 'Mitra';
    try {
      return decodeURIComponent(raw).replace(/\+/g, ' ');
    } catch {
      return raw;
    }
  };

  const getInitials = (name?: string, email?: string) => {
    const clean = getCleanName(name, email).trim();
    if (!clean) return '??';
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const handleExportSelectedCsv = () => {
    const targetUsers =
      selectedUserIds.length > 0
        ? users.filter((u) => selectedUserIds.includes(u.id))
        : users;

    if (targetUsers.length === 0) {
      notify?.info('Info', 'Tidak ada data pengguna untuk diekspor.');
      return;
    }

    const headers = ['ID', 'Nama', 'Email', 'Role', 'No_WhatsApp', 'Tanggal_Daftar'];
    const rows = targetUsers.map((u) => [
      u.id,
      `"${getCleanName(u.name, u.email).replace(/"/g, '""')}"`,
      `"${u.email}"`,
      u.role,
      `"${u.phone || ''}"`,
      `"${new Date(u.created_at).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `arm-mitra-${selectedUserIds.length > 0 ? 'selected-' : ''}${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify?.success('Ekspor Selesai', `${targetUsers.length} data mitra berhasil diekspor ke CSV.`);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Modern, spacious pill badges with Warm Minimalist Craft Palette
  const renderRoleBadge = (role: string, details?: any) => {
    const roleKey = role.toLowerCase();
    if (roleKey === 'admin') {
      return (
        <span className="inline-flex items-center rounded-full border border-[#1e1501]/20 bg-[#1e1501]/5 px-3 py-1 text-xs font-bold text-[#1e1501]">
          Admin Sistem
        </span>
      );
    }
    if (roleKey === 'distributor') {
      const disc = details?.discount_percent ?? 35;
      return (
        <span className="inline-flex items-center rounded-full border border-[#d6fa47] bg-[#d6fa47]/30 px-3 py-1 text-xs font-bold text-[#1e1501]">
          Distributor · {disc}%
        </span>
      );
    }
    if (roleKey === 'reseller') {
      const disc = details?.discount_percent ?? 20;
      return (
        <span className="inline-flex items-center rounded-full border border-[#f8a712]/40 bg-[#f7fb7e]/50 px-3 py-1 text-xs font-bold text-[#1e1501]">
          Reseller · {disc}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full border border-[#eedec5] bg-[#fffbf5] px-3 py-1 text-xs font-medium text-[#786b53]">
        Customer Ritel
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-4 relative">
      {/* 1. CRM Metrics Ribbon */}
      <CrmMetricsRibbon metrics={metrics} loading={metricsLoading} />

      {/* 2. Unified Action Toolbar */}
      <CrmToolbar
        search={search}
        onSearchChange={handleSearchChange}
        roleFilter={roleFilter}
        onRoleFilterChange={handleRoleFilterChange}
        onRefresh={() => {
          fetchUsers();
          fetchMetrics();
        }}
        isRefreshing={loading}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        onExportCsv={handleExportSelectedCsv}
        totalCount={totalCount}
      />

      {/* 3. Modern Spacious Data Card Table */}
      <div className="overflow-hidden rounded-xl border border-[#eedec5] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-[#eedec5] bg-[#fffbf5] text-xs font-semibold text-[#786b53]">
              <tr>
                <th className="w-12 px-5 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedUserIds.length === users.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[#eedec5] bg-white text-[#f8a712] focus:ring-0 focus:ring-offset-0 cursor-pointer h-4 w-4 accent-[#f8a712]"
                  />
                </th>
                <th className="px-5 py-3.5 font-medium">Mitra / Pelanggan</th>
                <th className="px-5 py-3.5 font-medium">Peran &amp; Diskon</th>
                <th className="px-5 py-3.5 font-medium">Status Akun</th>
                <th className="px-5 py-3.5 font-medium">WhatsApp</th>
                <th className="px-5 py-3.5 font-medium">Terdaftar</th>
                <th className="px-5 py-3.5 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eedec5]/60 text-[#1e1501]">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#786b53]">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#eedec5] border-t-[#f8a712]" />
                    <p className="mt-3 text-xs text-[#786b53]">Memuat direktori mitra…</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#786b53]">
                    <p className="text-sm font-semibold text-[#1e1501]">Tidak ada mitra yang cocok dengan filter.</p>
                    <p className="mt-1 text-xs text-[#786b53]/80">
                      Sesuaikan kata kunci atau reset filter tab di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleDet = user.roleDetails || user.role_details;
                  const phone = user.phone ? user.phone.replace(/\D/g, '') : '';
                  const cleanPhone = phone.startsWith('0') ? `62${phone.slice(1)}` : phone;
                  const isSelected = selectedUserIds.includes(user.id);
                  const cleanName = getCleanName(user.name, user.email);

                  return (
                    <tr
                      key={user.id}
                      onClick={() => openDetailDrawer(user)}
                      className={`group cursor-pointer transition-colors duration-150 ${
                        isSelected
                          ? 'bg-[#f8a712]/10'
                          : 'hover:bg-[#fbf5ea]/70'
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="px-5 py-3.5 text-center"
                        onClick={(e) => toggleSelectUser(user.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-[#eedec5] bg-white text-[#f8a712] focus:ring-0 focus:ring-offset-0 cursor-pointer h-4 w-4 accent-[#f8a712]"
                        />
                      </td>

                      {/* Customer (Avatar + Name + Email) */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#eedec5] bg-[#fbf5ea] text-xs font-semibold text-[#1e1501] shadow-xs">
                            {getInitials(user.name, user.email)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-sm text-[#1e1501] group-hover:text-[#f8a712] transition">
                              {cleanName}
                            </div>
                            <div className="truncate text-xs text-[#786b53] mt-0.5">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Margin */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {renderRoleBadge(user.role, roleDet)}
                      </td>

                      {/* Account Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          <span>Aktif</span>
                        </span>
                      </td>

                      {/* Contact */}
                      <td
                        className="px-5 py-3.5 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                              `Halo ${cleanName}, terima kasih telah bermitra dengan ARM Exhaust.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#eedec5] bg-[#fffbf5] px-3 py-1.5 text-xs font-mono text-[#1e1501] hover:border-[#f8a712] hover:bg-[#fbf5ea] transition shadow-xs"
                            title="Buka WhatsApp langsung"
                          >
                            <span>+{cleanPhone}</span>
                          </a>
                        ) : (
                          <span className="text-[#786b53]/40">—</span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="px-5 py-3.5 text-xs text-[#786b53] whitespace-nowrap">
                        {new Date(user.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Action Button */}
                      <td
                        className="px-5 py-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openDetailDrawer(user)}
                          className="inline-flex items-center justify-center rounded-lg border border-[#eedec5] bg-[#fffbf5] px-3.5 py-1.5 text-xs font-semibold text-[#1e1501] hover:bg-[#f8a712] hover:border-[#f8a712] transition shadow-xs"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Rows Per Page & Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#eedec5] bg-[#fffbf5] px-5 py-3.5 text-xs text-[#786b53]">
          <div className="flex items-center gap-3">
            <span>
              Menampilkan <span className="font-semibold text-[#1e1501] tabular-nums">{users.length}</span> dari{' '}
              <span className="font-semibold text-[#1e1501] tabular-nums">{totalCount}</span> total mitra
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="text-[#eedec5]">|</span>
              <span className="text-[#786b53]">Baris:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-[#eedec5] bg-white px-2 py-1 text-xs text-[#1e1501] focus:outline-none shadow-xs"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#786b53] tabular-nums">
                Hal {page} dari {totalPages}
              </span>
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-[#eedec5] bg-white px-3 py-1.5 text-xs font-semibold text-[#786b53] hover:bg-[#fbf5ea] hover:text-[#1e1501] disabled:opacity-30 disabled:cursor-not-allowed transition shadow-xs"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-[#eedec5] bg-white px-3 py-1.5 text-xs font-semibold text-[#786b53] hover:bg-[#fbf5ea] hover:text-[#1e1501] disabled:opacity-30 disabled:cursor-not-allowed transition shadow-xs"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Multi-Select Bulk Actions Bar */}
      {selectedUserIds.length > 0 && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-lg border border-[#eedec5] bg-white/95 px-4 py-2.5 text-xs shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1e1501]">
              <span className="tabular-nums text-[#f8a712] font-bold">{selectedUserIds.length}</span> mitra dipilih
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSelectedCsv}
              className="rounded-md border border-[#eedec5] bg-[#fbf5ea] px-3 py-1 text-xs font-semibold text-[#1e1501] hover:bg-[#f8a712] transition shadow-xs"
            >
              Ekspor Pilihan
            </button>
            <button
              type="button"
              onClick={() => setSelectedUserIds([])}
              className="rounded-md px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* 4. VIP Invite Creation Modal */}
      <VipInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteCreated={() => {
          fetchUsers();
          fetchMetrics();
        }}
      />

      {/* 5. Customer Detail Slide-Over Drawer */}
      <CustomerDetailDrawer
        user={drawerUser}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onRoleUpdated={handleRoleUpdated}
        roles={roles}
      />
    </div>
  );
}
