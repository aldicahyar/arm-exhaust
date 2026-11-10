import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About & Contact | ARM Exhaust',
  description: 'Get to know ARM Exhaust: custom exhaust workshop, road-tested, officially warranted.',
};

// ponytail: nomor WA, alamat, jam buka & sosmed placeholder — isi data riil sebelum publish
const CONTACT = [
  { label: 'WHATSAPP', value: '+62 000-0000-0000', href: 'https://wa.me/620000000000' },
  { label: 'INSTAGRAM', value: '@armexhaust', href: '#' },
  { label: 'WORKSHOP ADDRESS', value: 'Jl. Placeholder No. 00, Kota' },
  { label: 'OPENING HOURS', value: 'Mon–Sat 09:00–17:00' },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white selection:bg-[#2E6BFF] selection:text-white">
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 min-h-[calc(100svh-128px)] flex flex-col justify-center">
        <span className="font-mono text-xs text-[#8A8F98] tracking-wider uppercase">About & Contact</span>
        <h1 className="font-['Space_Grotesk'] text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
          Get to know ARM Exhaust.
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mt-10">
          {/* About */}
          <div>
            <h2
              className="text-white leading-none"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '0.05em' }}
            >
              CUSTOM EXHAUST WORKSHOP
            </h2>
            {/* ponytail: narasi tentang placeholder — konfirmasi cerita riil workshop sebelum publish */}
            <p className="text-sm text-[#9AA0A8] leading-relaxed mt-4">
              ARM Exhaust is a custom exhaust workshop that builds every product to match the owner&apos;s
              bike and sound preference — not factory dimensions. Every unit is road-tested, made from
              selected materials, and covered by an official warranty.
            </p>
            <p className="text-sm text-[#9AA0A8] leading-relaxed mt-3">
              Installation is done in-house by ARM technicians: precise, clean, and measured.
            </p>

            <Link
              href="https://wa.me/620000000000"
              className="inline-block mt-6 px-5 py-2.5 rounded-md text-xs font-semibold text-white bg-[#E81828] hover:bg-[#FF2B3C] transition-colors focus-visible:ring-1 focus-visible:ring-white"
            >
              Chat on WhatsApp
            </Link>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#1E1E21] border border-[#1E1E21] h-fit">
            {CONTACT.map((k) => (
              <div key={k.label} className="bg-[#0A0A0B] p-6">
                <span className="font-mono text-[10px] text-white/60 tracking-wider">{k.label}</span>
                {k.href ? (
                  <a
                    href={k.href}
                    className="block text-sm text-[#C7CAD1] hover:text-white transition-colors mt-2 focus-visible:ring-1 focus-visible:ring-[#2E6BFF] rounded"
                  >
                    {k.value}
                  </a>
                ) : (
                  <p className="text-sm text-[#C7CAD1] mt-2">{k.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
