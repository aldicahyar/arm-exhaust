import type { Metadata } from 'next';
import { KatalogGrid } from '@/features/catalog';
import { PRODUCTS } from '@/shared/lib/products';

export const metadata: Metadata = {
  title: 'Catalog | ARM Exhaust',
  description: 'All ARM Exhaust custom exhausts: slip-on, standard racing, DB killer, full system.',
};

export default function CatalogPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white selection:bg-[#2E6BFF] selection:text-white">
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 min-h-[calc(100svh-128px)] flex flex-col justify-center">
        <span className="font-mono text-xs text-[#8A8F98] tracking-wider uppercase">Catalog</span>
        <h1 className="font-['Space_Grotesk'] text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
          All ARM Exhaust exhausts.
        </h1>
        <p className="font-mono text-[10px] text-[#8A8F98] tracking-wider mt-2 uppercase">
          {PRODUCTS.length} products
        </p>

        <div className="mt-8">
          <KatalogGrid products={PRODUCTS} />
        </div>
      </section>
    </main>
  );
}
