'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from './ProductCard';
import type { Product } from '@/shared/lib/products';

const CATEGORY_LABELS: Record<string, string> = {
  kondoman: 'Kondoman',
  'standar-racing': 'Standar Racing',
  'db-killer': 'DB Killer',
  'full-system': 'Full System',
};

type SortKey = 'new' | 'asc' | 'desc';

function FilterChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
        isActive
          ? 'bg-white text-[#0A0A0B] border-white'
          : 'bg-transparent text-[#9AA0A8] border-[#2B2B30] hover:border-[#3A3A42] hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      className="size-2.5"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function KatalogGrid({ products }: { products: Product[] }) {
  const [active, setActive] = useState('all');
  const [inlets, setInlets] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>('new');

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const inletOptions = Array.from(new Set(products.map((p) => p.inlet)));

  const toggleInlet = (v: string) =>
    setInlets((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  let filtered = products.filter(
    (p) =>
      (active === 'all' || p.category === active) &&
      (inlets.size === 0 || inlets.has(p.inlet)),
  );
  if (sort === 'asc') filtered = [...filtered].sort((a, b) => a.priceValue - b.priceValue);
  if (sort === 'desc') filtered = [...filtered].sort((a, b) => b.priceValue - a.priceValue);

  const resetAll = () => {
    setActive('all');
    setInlets(new Set());
  };

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-8">
      {/* ===== Sidebar filter (desktop) ===== */}
      <aside className="hidden lg:block">
        <div className="lg:sticky lg:top-36 border border-[#1E1E21] rounded-lg p-4">
          <p className="font-mono text-[10px] text-[#8A8F98] tracking-widest uppercase mb-3">
            Product Type
          </p>
          <div className="flex flex-col -mx-2">
            <button
              type="button"
              onClick={() => setActive('all')}
              className={`flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
                active === 'all' ? 'bg-[#141416] text-white' : 'text-[#9AA0A8] hover:text-white'
              }`}
            >
              <span>All</span>
              <span className="font-mono text-[10px] text-[#8A8F98]">{products.length}</span>
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActive(c)}
                className={`flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
                  active === c ? 'bg-[#141416] text-white' : 'text-[#9AA0A8] hover:text-white'
                }`}
              >
                <span>{CATEGORY_LABELS[c] ?? c}</span>
                <span className="font-mono text-[10px] text-[#8A8F98]">
                  {products.filter((p) => p.category === c).length}
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-[#1E1E21] mt-4 pt-4">
            <p className="font-mono text-[10px] text-[#8A8F98] tracking-widest uppercase mb-3">
              Inlet Size
            </p>
            <div className="flex flex-col gap-1">
              {inletOptions.map((v) => {
                const checked = inlets.has(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleInlet(v)}
                    aria-pressed={checked}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer text-[#9AA0A8] hover:text-white"
                  >
                    <span
                      className={`size-3.5 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${
                        checked ? 'bg-white border-white text-[#0A0A0B]' : 'border-[#2B2B30]'
                      }`}
                    >
                      {checked && <CheckIcon />}
                    </span>
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#1E1E21] mt-4 pt-4">
            <button
              type="button"
              onClick={resetAll}
              className="text-xs text-[#9AA0A8] hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Kolom kanan: toolbar + grid ===== */}
      <div>
        {/* Chips kategori (mobile saja — di desktop pakai sidebar) */}
        <div className="flex lg:hidden flex-wrap gap-2 mb-6" role="group" aria-label="Filter by product type">
          <FilterChip label="All" isActive={active === 'all'} onClick={() => setActive('all')} />
          {categories.map((c) => (
            <FilterChip
              key={c}
              label={CATEGORY_LABELS[c] ?? c}
              isActive={active === c}
              onClick={() => setActive(c)}
            />
          ))}
        </div>

        {/* Toolbar: jumlah hasil + sort */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <p className="font-mono text-[10px] text-[#8A8F98] tracking-widest uppercase">
            {filtered.length} products
          </p>
          <label className="flex items-center gap-2 text-xs text-[#9AA0A8]">
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-[#0A0A0B] border border-[#2B2B30] rounded-md px-2 py-1.5 text-xs text-white cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E6BFF]"
            >
              <option value="new">Newest</option>
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
            </select>
          </label>
        </div>

        {filtered.length > 0 ? (
          <motion.div
            key={`${active}-${Array.from(inlets).join(',')}-${sort}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4"
          >
            {filtered.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </motion.div>
        ) : (
          <div className="border border-dashed border-[#2B2B30] rounded-lg py-16 text-center">
            <p className="text-sm text-[#8A8F98]">No products match your filters.</p>
            <button
              type="button"
              onClick={resetAll}
              className="mt-3 text-xs text-white underline underline-offset-4 hover:text-[#9AA0A8] transition-colors cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
