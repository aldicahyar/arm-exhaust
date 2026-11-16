'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroCarousel } from '@/shared/components';
import { ProductCard } from '@/features/catalog';
import { PRODUCTS, type Product } from '@/shared/lib/products';

export interface CommunityEventItem {
  readonly id: string;
  readonly category: string;
  readonly tag: string;
  readonly eventDate: string;
  readonly title: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly href?: string | null;
}

export interface HomeHeader {
  readonly tag: string;
  readonly title: string;
  readonly linkLabel?: string;
  readonly linkHref?: string;
}

export interface HomeValuePropItem {
  readonly id?: string;
  readonly stepNumber?: string;
  readonly step_number?: string;
  readonly title: string;
  readonly description: string;
  readonly sortOrder?: number;
}

export interface HomeNewArrivalItem {
  readonly id: string;
  readonly productId?: string;
  readonly product_id?: string;
  readonly name: string;
  readonly categoryLabel?: string;
  readonly category_label?: string;
  readonly inlet?: string | null;
  readonly material?: string | null;
  readonly priceDisplay?: string;
  readonly price_display?: string;
  readonly imageUrl?: string;
  readonly image_url?: string;
  readonly href?: string;
  readonly badgeText?: string | null;
  readonly badge_text?: string | null;
  readonly sortOrder?: number;
}

export const DEFAULT_COMMUNITY_EVENTS: readonly CommunityEventItem[] = [
  {
    id: 'default-event-1',
    category: 'SPONSORSHIP',
    tag: 'SPONSORSHIP',
    eventDate: '2026-03-15',
    title: 'Sponsored event name',
    description: 'Dukungan resmi ARM Exhaust untuk kejuaraan balap nasional dan modifikasi.',
    imageUrl: '/assets/products/sample-hero.jpg',
    href: '/contact',
  },
  {
    id: 'default-event-2',
    category: 'COMMUNITY',
    tag: 'COMMUNITY',
    eventDate: '2026-04-10',
    title: 'Community gathering name',
    description: 'Kopdar dan silaturahmi komunitas motor pengguna ARM Exhaust.',
    imageUrl: '/assets/products/sample-hero.jpg',
    href: '/contact',
  },
  {
    id: 'default-event-3',
    category: 'WORKSHOP',
    tag: 'WORKSHOP',
    eventDate: '2026-05-20',
    title: 'Workshop activity name',
    description: 'Sesi workshop dyno tuning, instalasi sistem knalpot, dan maintenance.',
    imageUrl: '/assets/products/sample-hero.jpg',
    href: 'https://wa.me/6281234567890',
  },
];

export const DEFAULT_VALUE_PROPS: readonly HomeValuePropItem[] = [
  { stepNumber: '01', title: 'CUSTOM PER BIKE', description: 'Built to match your bike and preferred sound — not factory dimensions.' },
  { stepNumber: '02', title: 'ROAD TESTED', description: 'Every unit is road-tested before being handed to its owner.' },
  { stepNumber: '03', title: 'WORKSHOP WARRANTY', description: 'Official warranty on materials and build quality.' },
  { stepNumber: '04', title: 'IN-HOUSE FITTING', description: 'Installed by ARM technicians: precise, clean, measured.' },
];

export const DEFAULT_VALUE_PROPS_HEADER: HomeHeader = {
  tag: 'Why ARM Exhaust',
  title: 'Custom, precise, warranted.',
};

export const DEFAULT_NEW_ARRIVALS_HEADER: HomeHeader = {
  tag: 'New Arrival',
  title: 'Fresh out of the workshop.',
  linkLabel: 'All Products ↗',
  linkHref: '/catalog',
};

export const DEFAULT_NEW_ARRIVALS: readonly HomeNewArrivalItem[] = PRODUCTS.slice(0, 4).map((p, idx) => ({
  id: p.id,
  productId: p.id,
  product_id: p.id,
  name: p.name,
  categoryLabel: p.category,
  category_label: p.category,
  inlet: p.inlet,
  material: p.material,
  priceDisplay: p.price,
  price_display: p.price,
  imageUrl: p.image,
  image_url: p.image,
  href: `/products/${p.id}`,
  badgeText: idx === 0 ? 'NEW ARRIVAL' : null,
  badge_text: idx === 0 ? 'NEW ARRIVAL' : null,
  sortOrder: idx,
}));

interface RawApiCommunityEvent {
  readonly id?: string;
  readonly category?: string;
  readonly tag?: string;
  readonly event_date?: string;
  readonly eventDate?: string;
  readonly date?: string;
  readonly title?: string;
  readonly description?: string;
  readonly image_url?: string;
  readonly imageUrl?: string;
  readonly image?: string;
  readonly href?: string | null;
  readonly sort_order?: number;
  readonly is_active?: boolean;
}

interface HomeContentApiResponse {
  readonly section2?: {
    readonly header?: Partial<HomeHeader>;
    readonly items?: readonly HomeValuePropItem[];
  };
  readonly section3?: {
    readonly header?: Partial<HomeHeader> & {
      readonly link_label?: string;
      readonly link_href?: string;
    };
    readonly items?: readonly HomeNewArrivalItem[];
  };
}

function mapNewArrivalToProduct(item: HomeNewArrivalItem): Product {
  const targetId = item.productId ?? item.product_id ?? item.id;
  const catalogProduct = PRODUCTS.find((p) => p.id === targetId);

  if (catalogProduct) {
    return {
      ...catalogProduct,
      name: item.name || catalogProduct.name,
      inlet: item.inlet ?? catalogProduct.inlet,
      material: item.material ?? catalogProduct.material,
      price: item.priceDisplay ?? item.price_display ?? catalogProduct.price,
      image: item.imageUrl ?? item.image_url ?? catalogProduct.image,
    };
  }

  return {
    id: targetId,
    name: item.name,
    category: item.categoryLabel ?? item.category_label ?? 'Kondoman',
    inlet: item.inlet ?? '38MM',
    material: item.material ?? 'Stainless 304',
    price: item.priceDisplay ?? item.price_display ?? 'Rp 1.850.000',
    priceValue: 0,
    image: item.imageUrl ?? item.image_url ?? '/assets/products/sample-hero.jpg',
    images: [item.imageUrl ?? item.image_url ?? '/assets/products/sample-hero.jpg'],
    description: [],
    variants: { kategori: [], inlet: [], saringan: [], motor: [] },
  };
}

function applyHomeContent(
  data: HomeContentApiResponse,
  setValuePropsHeader: React.Dispatch<React.SetStateAction<HomeHeader>>,
  setValueProps: React.Dispatch<React.SetStateAction<readonly HomeValuePropItem[]>>,
  setNewArrivalsHeader: React.Dispatch<React.SetStateAction<HomeHeader>>,
  setNewArrivals: React.Dispatch<React.SetStateAction<readonly HomeNewArrivalItem[]>>,
) {
  if (data.section2?.header) {
    setValuePropsHeader((prev) => ({
      ...prev,
      tag: data.section2?.header?.tag ?? prev.tag,
      title: data.section2?.header?.title ?? prev.title,
    }));
  }
  if (data.section2?.items && data.section2.items.length > 0) {
    setValueProps(data.section2.items);
  }
  if (data.section3?.header) {
    setNewArrivalsHeader((prev) => ({
      ...prev,
      tag: data.section3?.header?.tag ?? prev.tag,
      title: data.section3?.header?.title ?? prev.title,
      linkLabel: data.section3?.header?.linkLabel ?? data.section3?.header?.link_label ?? prev.linkLabel,
      linkHref: data.section3?.header?.linkHref ?? data.section3?.header?.link_href ?? prev.linkHref,
    }));
  }
  if (data.section3?.items && data.section3.items.length > 0) {
    setNewArrivals(data.section3.items);
  }
}

export default function LandingPage() {
  const [events, setEvents] = useState<readonly CommunityEventItem[]>(DEFAULT_COMMUNITY_EVENTS);
  const [valuePropsHeader, setValuePropsHeader] = useState<HomeHeader>(DEFAULT_VALUE_PROPS_HEADER);
  const [valueProps, setValueProps] = useState<readonly HomeValuePropItem[]>(DEFAULT_VALUE_PROPS);
  const [newArrivalsHeader, setNewArrivalsHeader] = useState<HomeHeader>(DEFAULT_NEW_ARRIVALS_HEADER);
  const [newArrivals, setNewArrivals] = useState<readonly HomeNewArrivalItem[]>(DEFAULT_NEW_ARRIVALS);

  // Fetch dynamic Section 2 & 3 content from /api/public/home-content on mount
  useEffect(() => {
    let isMounted = true;

    void fetch('/api/public/home-content', {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data: HomeContentApiResponse | null) => {
        if (!isMounted || !data) return;
        applyHomeContent(data, setValuePropsHeader, setValueProps, setNewArrivalsHeader, setNewArrivals);
      })
      .catch(() => {
        // Fallback gracefully to default values without throwing or blanking
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch active community events from /api/public/community-events on mount
  useEffect(() => {
    let isMounted = true;

    void fetch('/api/public/community-events', {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data: unknown) => {
        if (!isMounted || !Array.isArray(data) || data.length === 0) return;
        const mapped: CommunityEventItem[] = data.map((item: RawApiCommunityEvent, idx: number) => ({
          id: item.id ?? `event-${idx}`,
          category: item.category ?? 'COMMUNITY',
          tag: item.tag ?? item.category ?? 'EVENT',
          eventDate: item.event_date ?? item.eventDate ?? item.date ?? 'UPCOMING',
          title: item.title ?? '',
          description: item.description ?? '',
          imageUrl: item.image_url ?? item.imageUrl ?? item.image ?? '/assets/products/sample-hero.jpg',
          href: item.href ?? null,
        }));
        if (mapped.length > 0) {
          setEvents(mapped);
        }
      })
      .catch(() => {
        // Fallback gracefully to DEFAULT_COMMUNITY_EVENTS
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white selection:bg-zinc-800 selection:text-white">
      {/* Hero Section — Progressive Carousel */}
      <HeroCarousel />

      {/* Section 2: Trust / Value Props */}
      <section className="border-t border-[#1E1E21] min-h-[calc(100svh-128px)] flex flex-col justify-center">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 w-full flex flex-col">
          <span className="font-mono text-xs text-[#8A8F98] tracking-wider uppercase">
            {valuePropsHeader.tag}
          </span>
          <h2 className="font-['Space_Grotesk'] text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
            {valuePropsHeader.title}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1E1E21] border border-[#1E1E21] mt-8">
            {valueProps.map((v, idx) => {
              const stepNumber = String(idx + 1).padStart(2, '0');
              return (
                <div key={v.id ?? `val-prop-${stepNumber}`} className="bg-[#0A0A0B] p-6">
                  <span className="font-mono text-xs text-white/25">{stepNumber}</span>
                  <h3
                    className="text-white mt-3 leading-none"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', letterSpacing: '0.05em' }}
                  >
                    {v.title}
                  </h3>
                  <p className="text-xs text-[#8A8F98] leading-relaxed mt-2">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3: New Arrival — Product Grid */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 border-t border-[#1E1E21] w-full min-h-[calc(100svh-128px)] flex flex-col justify-center">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="font-mono text-xs text-[#8A8F98] tracking-wider uppercase">
              {newArrivalsHeader.tag}
            </span>
            <h2 className="font-['Space_Grotesk'] text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
              {newArrivalsHeader.title}
            </h2>
          </div>
          <Link
            href={newArrivalsHeader.linkHref ?? '/catalog'}
            className="text-xs font-medium text-[#9AA0A8] hover:text-white transition-colors"
          >
            {newArrivalsHeader.linkLabel ?? 'All Products ↗'}
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {newArrivals.map((item) => {
            const product = mapNewArrivalToProduct(item);
            const badge = item.badgeText ?? item.badge_text;
            return (
              <div key={item.id} className="relative group/card">
                {badge ? (
                  <span className="pointer-events-none absolute top-2.5 left-2.5 z-10 font-mono text-[10px] text-zinc-300 border border-[#3A3A42] bg-[#141416]/90 backdrop-blur-sm px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                    {badge}
                  </span>
                ) : null}
                <ProductCard item={product} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 4: News / Event — ARM on the ground */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {events.map((ev) => (
            <article
              key={ev.id}
              className="group flex flex-col bg-[#141416] border border-[#2B2B30] rounded-lg overflow-hidden transition-colors hover:border-[#3A3A42]"
            >
              {/* Slot foto event 4:3 */}
              <div className="relative aspect-[4/3] bg-[#1E1E21] overflow-hidden flex items-center justify-center">
                <Image
                  src={ev.imageUrl}
                  alt={ev.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#8A8F98]">{ev.eventDate}</span>
                    <span className="font-mono text-[10px] text-zinc-300 border border-[#3A3A42] bg-[#1E1E21] px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {ev.tag}
                    </span>
                  </div>
                  <h3 className="font-['Space_Grotesk'] text-sm font-semibold text-white leading-snug mt-2">
                    {ev.href ? (
                      <Link
                        href={ev.href}
                        className="hover:text-zinc-300 transition-colors inline-flex items-center gap-1"
                      >
                        <span>{ev.title}</span>
                        <span aria-hidden="true" className="text-zinc-500">↗</span>
                      </Link>
                    ) : (
                      ev.title
                    )}
                  </h3>
                  {ev.description && (
                    <p className="text-xs text-[#8A8F98] leading-relaxed mt-2 line-clamp-2">
                      {ev.description}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
