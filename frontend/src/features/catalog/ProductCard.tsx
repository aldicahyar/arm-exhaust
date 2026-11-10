import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/shared/lib/products';

export function ProductCard({ item }: { item: Product }) {
  return (
    <Link
      href={`/products/${item.id}`}
      className="group flex flex-col bg-[#141416] border border-[#2B2B30] rounded-lg overflow-hidden transition-colors hover:border-[#3A3A42] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E6BFF]"
    >
      {/* Foto 4:3 — canvas variant grid 800x600, presisi tanpa terpotong */}
      <div className="relative aspect-[4/3] bg-[#1E1E21] overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>

      {/* Meta & Harga */}
      <div className="p-3.5 flex flex-col flex-1 gap-2 justify-between">
        <div>
          <h3 className="font-['Space_Grotesk'] text-xs md:text-sm font-semibold text-white line-clamp-2 leading-snug">
            {item.name}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-mono text-[10px] text-[#C7CAD1] bg-[#2B2B30] px-1.5 py-0.5 rounded">
              {item.inlet}
            </span>
            <span className="text-[11px] text-[#8A8F98]">{item.material}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#2B2B30]/60 flex flex-col gap-2">
          <span className="font-bold text-sm md:text-base text-white">{item.price}</span>
          <span className="w-full text-center py-1.5 rounded-md text-xs font-semibold text-white border border-[#3A3A42] group-hover:bg-[#1E1E21] transition-colors">
            View Options & Price
          </span>
        </div>
      </div>
    </Link>
  );
}
