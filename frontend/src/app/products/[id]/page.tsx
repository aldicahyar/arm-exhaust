import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductGallery, ProductCard, ProductVariants } from '@/features/catalog';
import { Reveal } from '@/shared/components';
import { PRODUCTS, getProduct, CATEGORY_LABELS } from '@/shared/lib/products';

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  return { title: product ? `${product.name} | ARM Exhaust` : 'Product not found' };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  const category = CATEGORY_LABELS[product.category] ?? product.category;
  const related = PRODUCTS.filter((p) => p.id !== product.id);
  const idx = String(PRODUCTS.findIndex((p) => p.id === product.id) + 1).padStart(2, '0');

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white selection:bg-[#2E6BFF] selection:text-white">
      <section className="relative max-w-6xl mx-auto px-4 md:px-8 pt-12 md:pt-16 pb-28 lg:pb-16 overflow-visible">
        {/* Glow aksen di belakang galeri */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 left-0 w-[520px] h-[520px] bg-[radial-gradient(closest-side,rgba(46,107,255,0.10),transparent)]"
        />

        {/* Breadcrumb */}
        <Reveal>
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] text-[#8A8F98] tracking-widest uppercase">
            <Link href="/catalog" className="hover:text-white transition-colors">Catalog</Link>
            <span className="mx-2">/</span>
            <span>{category}</span>
            <span className="mx-2">/</span>
            <span className="text-[#9AA0A8]">{product.name}</span>
          </nav>
        </Reveal>

        {/* Info utama: galeri + detail */}
        <Reveal delay={0.08} className="grid lg:grid-cols-2 gap-8 lg:gap-12 mt-8">
          <div className="relative">
            <span
              aria-hidden="true"
              className="hidden md:block absolute -top-10 -left-12 font-['Space_Grotesk'] text-[120px] leading-none font-bold text-white/[0.04] select-none"
            >
              {idx}
            </span>
            <ProductGallery images={product.images} name={product.name} />
          </div>

          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-[#8A8F98] tracking-widest uppercase">
              {category} · Inlet {product.inlet}
            </span>
            <h1 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold tracking-tight text-white mt-2">
              {product.name}
            </h1>

            {/* Pemilih varian + harga live + CTA */}
            <ProductVariants product={product} />

            {/* Spesifikasi */}
            <dl className="mt-8 border-t border-[#1E1E21] divide-y divide-[#1E1E21] text-sm">
              {[
                ['Material', product.material],
                ['Screen', 'Sarfull / Sarteng / Sarbor'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-3">
                  <dt className="text-[#8A8F98]">{k}</dt>
                  <dd className="text-white">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        {/* Deskripsi */}
        <Reveal className="mt-16">
          <h2 className="font-mono text-[10px] text-[#8A8F98] tracking-widest uppercase mb-4">
            Description
          </h2>
          <div className="space-y-3 max-w-2xl text-sm text-[#C7CAD1] leading-relaxed">
            {product.description.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </Reveal>

        {/* Produk lainnya */}
        <Reveal className="mt-16">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-['Space_Grotesk'] text-lg md:text-xl font-bold tracking-tight text-white">
              Other Products
            </h2>
            <Link
              href="/catalog"
              className="font-mono text-[10px] text-[#9AA0A8] hover:text-white tracking-widest uppercase transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {related.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        </Reveal>
      </section>
    </main>
  );
}
