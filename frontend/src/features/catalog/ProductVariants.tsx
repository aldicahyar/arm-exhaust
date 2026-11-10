'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { defaultSelection, formatIDR, totalPrice } from '@/shared/lib/products';
import type { Product, VariantOption, VariantSelection } from '@/shared/lib/products';

function VariantGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: VariantOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] text-[#8A8F98] tracking-widest uppercase mb-2">
        {label}
        <span className="text-[#9AA0A8] normal-case tracking-normal"> · {value}</span>
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              className={`px-3.5 py-2 rounded-md text-xs border transition active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E6BFF] ${
                active
                  ? 'bg-white text-[#0A0A0B] border-white'
                  : 'bg-transparent text-[#9AA0A8] border-[#2B2B30] hover:border-[#3A3A42] hover:text-white'
              }`}
            >
              {o.value}
              {o.addPrice ? (
                <span className={active ? 'text-[#5A5A64]' : 'text-[#8A8F98]'}> +{formatIDR(o.addPrice)}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProductVariants({ product }: { product: Product }) {
  const [sel, setSel] = useState<VariantSelection>(() => defaultSelection(product));
  const reduce = useReducedMotion();
  const total = totalPrice(product, sel);

  const query = new URLSearchParams({
    product: product.id,
    category: sel.kategori,
    inlet: sel.inlet,
    screen: sel.saringan,
    motor: sel.motor,
  }).toString();

  const set = (key: keyof VariantSelection) => (v: string) => setSel((s) => ({ ...s, [key]: v }));

  return (
    <div className="mt-8 space-y-5">
      <VariantGroup label="Category" options={product.variants.kategori} value={sel.kategori} onChange={set('kategori')} />
      <VariantGroup label="Inlet Size" options={product.variants.inlet} value={sel.inlet} onChange={set('inlet')} />
      <VariantGroup label="Screen" options={product.variants.saringan} value={sel.saringan} onChange={set('saringan')} />
      <VariantGroup label="Motorcycle Type" options={product.variants.motor} value={sel.motor} onChange={set('motor')} />

      {/* Harga live — bergulir saat berubah */}
      <div className="border-t border-[#1E1E21] pt-5">
        {total !== product.priceValue && (
          <p className="font-mono text-[10px] text-[#8A8F98] tracking-widest uppercase">
            Starting at {product.price}
          </p>
        )}
        <div className="relative overflow-hidden mt-1 h-[2.4rem] md:h-[2.75rem]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={total}
              initial={reduce ? { opacity: 0 } : { y: '110%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: '-110%', opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 text-2xl md:text-3xl font-bold text-white"
            >
              {formatIDR(total)}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/checkout?${query}`}
          className="flex-1 text-center py-3 rounded-md bg-white text-[#0A0A0B] text-sm font-semibold hover:bg-[#E8E8EC] hover:-translate-y-0.5 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E6BFF]"
        >
          Buy Now
        </Link>
        <Link
          href="/contact"
          className="flex-1 text-center py-3 rounded-md border border-[#3A3A42] text-sm font-semibold text-white hover:bg-[#1E1E21] hover:-translate-y-0.5 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E6BFF]"
        >
          Ask Us First
        </Link>
      </div>

      {/* Sticky CTA mobile — harga live + beli */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#0A0A0B]/95 backdrop-blur border-t border-[#1E1E21] px-4 py-3 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] text-[#8A8F98] uppercase tracking-widest truncate">
            {sel.kategori} · {sel.inlet} · {sel.saringan} · {sel.motor}
          </p>
          <p className="text-lg font-bold text-white leading-tight">{formatIDR(total)}</p>
        </div>
        <Link
          href={`/checkout?${query}`}
          className="shrink-0 px-8 py-3 rounded-md bg-white text-[#0A0A0B] text-sm font-semibold hover:bg-[#E8E8EC] active:scale-[0.97] transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E6BFF]"
        >
          Buy
        </Link>
      </div>
    </div>
  );
}
