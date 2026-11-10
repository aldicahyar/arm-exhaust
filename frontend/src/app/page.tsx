import Link from 'next/link';
import { HeroCarousel } from '@/shared/components';
import { ProductCard } from '@/features/catalog';
import { PRODUCTS } from '@/shared/lib/products';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white selection:bg-[#2E6BFF] selection:text-white">
      {/* Hero Section — Progressive Carousel */}
      <HeroCarousel />

      {/* Section 2: Trust / Value Props */}
      <section className="border-t border-[#1E1E21] min-h-[calc(100svh-128px)] flex flex-col justify-center">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 w-full flex flex-col">
          <span className="font-mono text-xs text-[#8A8F98] tracking-wider uppercase">
            Why ARM Exhaust
          </span>
          <h2 className="font-['Space_Grotesk'] text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
            Custom, precise, warranted.
          </h2>

          {/* ponytail: klaim placeholder — konfirmasi syarat garansi sebelum publish */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1E1E21] border border-[#1E1E21] mt-8">
            {[
              {
                n: '01',
                title: 'CUSTOM PER BIKE',
                desc: 'Built to match your bike and preferred sound — not factory dimensions.',
              },
              {
                n: '02',
                title: 'ROAD TESTED',
                desc: 'Every unit is road-tested before being handed to its owner.',
              },
              {
                n: '03',
                title: 'WORKSHOP WARRANTY',
                desc: 'Official warranty on materials and build quality.',
              },
              {
                n: '04',
                title: 'IN-HOUSE FITTING',
                desc: 'Installed by ARM technicians: precise, clean, measured.',
              },
            ].map((v) => (
              <div key={v.n} className="bg-[#0A0A0B] p-6">
                <span className="font-mono text-xs text-white/25">{v.n}</span>
                <h3
                  className="text-white mt-3 leading-none"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', letterSpacing: '0.05em' }}
                >
                  {v.title}
                </h3>
                <p className="text-xs text-[#8A8F98] leading-relaxed mt-2">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: New Arrival — Product Grid */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 border-t border-[#1E1E21] w-full min-h-[calc(100svh-128px)] flex flex-col justify-center">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="font-mono text-xs text-[#8A8F98] tracking-wider uppercase">
              New Arrival
            </span>
            <h2 className="font-['Space_Grotesk'] text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
              Fresh out of the workshop.
            </h2>
          </div>
          <Link
            href="/catalog"
            className="text-xs font-medium text-[#9AA0A8] hover:text-white transition-colors"
          >
            All Products ↗
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {PRODUCTS.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Section 4: News / Event — ARM on the ground */}
      {/* ponytail: konten placeholder — isi tanggal & judul event riil + foto (ikuti docs/standar-aset-gambar.md), hapus item dummy sebelum publish */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 border-t border-[#1E1E21] w-full min-h-[calc(100svh-128px)] flex flex-col justify-center">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="font-mono text-xs text-[#8A8F98] tracking-wider uppercase">
              Events & Community
            </span>
            <h2 className="font-['Space_Grotesk'] text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
              ARM on the ground.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {[
            { date: 'PLACEHOLDER', tag: 'SPONSORSHIP', title: 'Sponsored event name' },
            { date: 'PLACEHOLDER', tag: 'COMMUNITY', title: 'Community gathering name' },
            { date: 'PLACEHOLDER', tag: 'WORKSHOP', title: 'Workshop activity name' },
          ].map((ev, i) => (
            <article
              key={i}
              className="flex flex-col bg-[#141416] border border-[#2B2B30] rounded-lg overflow-hidden transition-colors hover:border-[#3A3A42]"
            >
              {/* Slot foto event 4:3 */}
              <div className="relative aspect-[4/3] bg-[#1E1E21] overflow-hidden flex items-center justify-center">
                <span className="font-mono text-[10px] text-[#8A8F98] tracking-wider uppercase">
                  Event Photo
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#8A8F98]">{ev.date}</span>
                  <span className="font-mono text-[10px] text-white border border-[#3A3A42] px-1.5 py-0.5 rounded">
                    {ev.tag}
                  </span>
                </div>
                <h3 className="font-['Space_Grotesk'] text-sm font-semibold text-white leading-snug mt-2">
                  {ev.title}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
