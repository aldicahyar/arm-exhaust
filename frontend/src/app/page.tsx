'use client';

import { useState, useEffect } from 'react';
import { HeroCarousel, Reveal } from '@/shared/components';
import { NewArrivalsShowcase, type ShowcaseItem } from '@/features/catalog';
import { EventsAgenda } from '@/features/community';
import { preferCatalogImage } from '@/features/catalog/showcase-math';
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
  { stepNumber: '04', title: 'IN-HOUSE FITTING', description: 'Fitted in the ARM workshop by our own technicians, not a third-party installer.' },
];

export const DEFAULT_VALUE_PROPS_HEADER: HomeHeader = {
  tag: 'Why ARM Exhaust',
  title: 'Made for one bike at a time.',
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
      // Foto bawaan lama di data admin (sample-hero / flyer *-grid) diganti foto katalog resmi ARM.
      image: preferCatalogImage(item.imageUrl ?? item.image_url, catalogProduct.image) ?? catalogProduct.image,
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

  const showcaseItems: ShowcaseItem[] = newArrivals.map((item) => {
    const product = mapNewArrivalToProduct(item);
    return {
      key: item.id,
      product,
      href: item.href ?? `/products/${product.id}`,
    };
  });

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white selection:bg-zinc-800 selection:text-white">
      {/* Hero Section — Progressive Carousel */}
      <HeroCarousel />

      {/* Section 2: Trust / Value Props */}
      {/* Editorial split: gutter sama dengan hero (px-4 sm:px-10), tipografi Montserrat light uppercase */}
      <section
        aria-labelledby="value-props-title"
        className="border-t border-[#1E1E21] min-h-[calc(100svh-128px)] flex flex-col justify-center"
      >
        <div className="w-full px-4 sm:px-10 py-20 lg:py-28 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Kolom kiri — judul section (sticky di desktop) */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
            <span className="font-['Montserrat'] text-[11px] font-normal uppercase tracking-[0.22em] text-zinc-400">
              {valuePropsHeader.tag}
            </span>
            <h2
              id="value-props-title"
              className="mt-5 font-['Montserrat'] text-2xl sm:text-3xl lg:text-[40px] font-light uppercase tracking-[0.06em] lg:tracking-[0.08em] leading-[1.2] text-balance text-white"
            >
              {valuePropsHeader.title}
            </h2>
          </div>

          {/* Kolom kanan — daftar keunggulan (tanpa urutan) dipisah hairline; muncul sekali sebagai satu blok */}
          <Reveal className="lg:col-span-7">
            <ul className="border-b border-[#1E1E21]">
              {valueProps.map((v) => (
                <li
                  key={v.id ?? v.title}
                  className="grid grid-cols-1 gap-y-3 border-t border-[#1E1E21] py-8 sm:py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-x-10"
                >
                  <h3 className="font-['Montserrat'] text-base sm:text-lg font-light uppercase tracking-[0.14em] leading-snug text-white">
                    {v.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{v.description}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Section 3: New Arrival — pinned scrolling (desktop) / bertumpuk (HP, reduced-motion) */}
      <NewArrivalsShowcase
        header={{
          tag: newArrivalsHeader.tag,
          title: newArrivalsHeader.title,
          linkHref: newArrivalsHeader.linkHref ?? '/catalog',
        }}
        items={showcaseItems}
      />

      {/* Section 4: Events & Community — agenda editorial */}
      <EventsAgenda tag="Events & Community" title="ARM on the ground." events={events} />
    </main>
  );
}
