'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { PRODUCTS, type Product } from '@/shared/lib/products';
import { backdropTiles, specLine, tileImageClass } from './showcase-math';

export interface ShowcaseItem {
  readonly key: string;
  readonly product: Product;
  readonly href: string;
}

export interface ShowcaseHeader {
  readonly tag: string;
  readonly title: string;
  readonly linkHref: string;
}

interface NewArrivalsShowcaseProps {
  readonly header: ShowcaseHeader;
  readonly items: readonly ShowcaseItem[];
}

const SEE_ALL = 'See All New Arrival';
const BACKDROP_TILES = 6;

/**
 * Foto produk katalog (ikut di repo) untuk latar dekoratif — sengaja tidak memakai foto dari admin,
 * supaya suasana tetap "produk nyata" walau data New Arrival masih memakai foto contoh.
 */
const BACKDROP_PHOTOS = PRODUCTS.map((product) => product.image);

/** Latar: foto blur ringan (bentuk & warna knalpot masih terbaca) + lapisan gelap + tepi memudar ke halaman. */
function BlurredBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -inset-8 grid grid-cols-3 grid-rows-2 gap-2 blur-lg">
        {backdropTiles(BACKDROP_PHOTOS, BACKDROP_TILES).map((src, i) => (
          <div key={`${src}-${i}`} className="relative">
            {/* gambar latar di-blur: resolusi kecil sudah cukup */}
            <Image src={src} alt="" fill sizes="20vw" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-[#0A0A0B]/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B] via-transparent to-[#0A0A0B]" />
    </div>
  );
}

/** Kartu produk: ubin foto putih, nama (huruf biasa), satu baris spesifikasi, harga. Seluruh kartu = tautan. */
function ProductCard({ item }: Readonly<{ item: ShowcaseItem }>) {
  const { product } = item;
  const spec = specLine(product.inlet, product.material);
  return (
    <Link
      href={item.href}
      className="group block rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 25vw"
          className={`transition-transform duration-500 ease-out ${tileImageClass(product.image)}`}
        />
      </div>
      <h3 className="mt-5 font-['Montserrat'] text-lg font-light leading-snug text-white underline-offset-4 decoration-zinc-500 group-hover:underline">
        {product.name}
      </h3>
      {spec ? <p className="mt-1.5 text-sm text-zinc-400">{spec}</p> : null}
      <p className="mt-3 text-base text-white tabular-nums">{product.price}</p>
    </Link>
  );
}

/**
 * Section 3 beranda — New Arrival: satu layar, latar foto resmi ARM yang di-blur, judul + satu tautan ke
 * katalog, dan empat produk (deret geser di HP, satu baris di desktop). Tanpa pinned scroll.
 */
export function NewArrivalsShowcase({ header, items }: Readonly<NewArrivalsShowcaseProps>) {
  const reduce = useReducedMotion() ?? false;
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="new-arrivals-title"
      className="relative flex min-h-[calc(100svh-128px)] flex-col justify-center overflow-hidden"
    >
      <BlurredBackdrop />

      <div className="relative w-full px-4 py-20 sm:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-['Montserrat'] text-[11px] uppercase tracking-[0.22em] text-zinc-300">{header.tag}</p>
            <h2
              id="new-arrivals-title"
              className="mt-4 font-['Montserrat'] text-3xl sm:text-4xl lg:text-5xl font-light uppercase tracking-[0.06em] leading-[1.15] text-balance text-white"
            >
              {header.title}
            </h2>
          </div>
          <Link
            href={header.linkHref}
            className="group inline-flex items-center gap-3 self-start rounded py-1 font-['Montserrat'] text-[11px] uppercase tracking-[0.22em] text-white underline decoration-zinc-500 underline-offset-[8px] transition-colors hover:decoration-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 sm:self-auto"
          >
            <span>{SEE_ALL}</span>
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none">
              →
            </span>
          </Link>
        </div>

        <motion.ul
          className="-mx-4 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-10 sm:px-10 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-8 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.08 } } }}
        >
          {items.map((item) => (
            <motion.li
              key={item.key}
              className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-auto"
              variants={{ hidden: { opacity: 0, y: reduce ? 0 : 12 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: reduce ? 0 : 0.4, ease: 'easeOut' }}
            >
              <ProductCard item={item} />
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
