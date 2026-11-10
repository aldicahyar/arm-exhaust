// ponytail: semua addPrice di bawah adalah PLACEHOLDER — ganti dengan harga riil ARM Exhaust
export interface VariantOption {
  value: string;
  addPrice?: number; // tambahan harga di atas priceValue (IDR)
}

export interface ProductVariants {
  kategori: VariantOption[];
  inlet: VariantOption[];
  saringan: VariantOption[];
  motor: VariantOption[];
}

export interface VariantSelection {
  kategori: string;
  inlet: string;
  saringan: string;
  motor: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  inlet: string;
  material: string;
  price: string;
  priceValue: number; // harga dasar (varian default)
  image: string;
  images: string[];
  description: string[];
  variants: ProductVariants;
}

export const CATEGORY_LABELS: Record<string, string> = {
  kondoman: 'Kondoman',
  'standar-racing': 'Standar Racing',
  'db-killer': 'DB Killer',
  'full-system': 'Full System',
};

// Saringan internal silincer — 3 tipe
const SARINGAN: VariantOption[] = [
  { value: 'Sarfull' },
  { value: 'Sarteng', addPrice: 100_000 },
  { value: 'Sarbor', addPrice: 200_000 },
];

// ponytail: daftar motor umum — sesuaikan dengan motor yang memang dikerjakan bengkel
const MOTOR: VariantOption[] = [
  'Vario 125',
  'Vario 150',
  'Vario 160',
  'Honda Beat',
  'Honda Scoopy',
  'Honda PCX',
  'Yamaha NMAX',
  'Yamaha Aerox',
  'Other',
].map((value) => ({ value }));

export const PRODUCTS: Product[] = [
  {
    id: 'kdv2-vario125',
    name: 'Kondoman V2',
    category: 'kondoman',
    inlet: '38MM',
    material: 'Stainless 304',
    price: 'Rp 1.850.000',
    priceValue: 1_850_000,
    image: '/assets/products/kdv2-vario125-grid.jpg',
    images: [
      '/assets/products/kdv2-vario125-grid.jpg',
      '/assets/products/kdv2-vario125-hero.jpg',
      '/assets/Arm Luster V2 M-quick/WhatsApp Image 2026-10-21 at 13.22.20.jpeg',
      '/assets/Arm Luster V2 M-quick/WhatsApp Image 2026-10-21 at 13.22.20 (1).jpeg',
      '/assets/Arm Luster V2 M-quick/WhatsApp Image 2026-10-21 at 13.22.20 (2).jpeg',
      '/assets/Arm Luster V2 M-quick/WhatsApp Image 2026-10-21 at 13.22.21.jpeg',
      '/assets/Arm Luster V2 M-quick/WhatsApp Image 2026-10-21 at 13.22.21 (1).jpeg',
      '/assets/Arm Luster V2 M-quick/WhatsApp Image 2026-10-21 at 13.22.21 (2).jpeg',
    ],
    description: [
      'Second-generation full-sleeve build with precision single-pipe construction: sharp racing sound that stays comfortable for daily riding.',
      'Made from corrosion-resistant 304 stainless with clean finishing — ideal for 125cc scooters wanting a tidy look without drilling the block.',
    ],
    variants: {
      kategori: [
        { value: 'Kondoman' },
        { value: 'Standar Racing' },
        { value: 'DB Killer', addPrice: 500_000 },
        { value: 'Full System', addPrice: 1_500_000 },
      ],
      inlet: [
        { value: '35MM' },
        { value: '38MM' },
        { value: '45MM', addPrice: 200_000 },
      ],
      saringan: SARINGAN,
      motor: MOTOR,
    },
  },
  {
    id: 'stdr-beat',
    name: 'Standar Racing',
    category: 'standar-racing',
    inlet: '35MM',
    material: 'Black Sandblast',
    price: 'Rp 1.250.000',
    priceValue: 1_250_000,
    image: '/assets/products/stdr-beat-grid.jpg',
    images: [
      '/assets/products/stdr-beat-grid.jpg',
      '/assets/products/stdr-beat-hero.jpg',
      '/assets/Std racing nusantara black edition/WhatsApp Image 2026-10-21 at 13.26.54.jpeg',
      '/assets/Std racing nusantara black edition/WhatsApp Image 2026-10-21 at 13.26.55.jpeg',
      '/assets/Std racing nusantara black edition/WhatsApp Image 2026-10-21 at 13.26.55 (1).jpeg',
      '/assets/Std racing nusantara black edition/WhatsApp Image 2026-10-21 at 13.26.55 (2).jpeg',
    ],
    description: [
      'Entry-level racing option: standard shape but a deeper sound character than the stock exhaust.',
      'Matte black sandblast finish that resists heat and needs minimal upkeep.',
    ],
    variants: {
      kategori: [
        { value: 'Standar Racing' },
        { value: 'Kondoman', addPrice: 600_000 },
        { value: 'DB Killer', addPrice: 1_100_000 },
        { value: 'Full System', addPrice: 2_100_000 },
      ],
      inlet: [
        { value: '32MM' },
        { value: '35MM' },
        { value: '38MM', addPrice: 150_000 },
      ],
      saringan: SARINGAN,
      motor: MOTOR,
    },
  },
  {
    id: 'dbk-vario160',
    name: 'DB Killer Kondoman',
    category: 'db-killer',
    inlet: '45MM',
    material: 'Burnt Titanium Endcap',
    price: 'Rp 2.350.000',
    priceValue: 2_350_000,
    image: '/assets/products/dbk-vario160-grid.jpg',
    images: [
      '/assets/products/dbk-vario160-grid.jpg',
      '/assets/products/dbk-vario160-hero.jpg',
      '/assets/Arm Exhause Neptune V2/WhatsApp Image 2026-10-21 at 13.26.49.jpeg',
      '/assets/Arm Exhause Neptune V2/WhatsApp Image 2026-10-21 at 13.26.49 (1).jpeg',
      '/assets/Arm Exhause Neptune V2/WhatsApp Image 2026-10-21 at 13.26.49 (2).jpeg',
      '/assets/Arm Exhause Neptune V2/WhatsApp Image 2026-10-21 at 13.26.50.jpeg',
    ],
    description: [
      'Racing sound with a damping option: fit the DB killer for daily riding, remove it for the track.',
      'Burnt titanium endcap with controlled-heat color gradient — every unit has a unique color character.',
    ],
    variants: {
      kategori: [
        { value: 'DB Killer' },
        { value: 'Kondoman' },
        { value: 'Full System', addPrice: 1_000_000 },
        { value: 'Standar Racing' },
      ],
      inlet: [
        { value: '38MM' },
        { value: '45MM' },
        { value: '50MM', addPrice: 250_000 },
      ],
      saringan: SARINGAN,
      motor: MOTOR,
    },
  },
  {
    id: 'fs-nmax-turbo',
    name: 'Full System',
    category: 'full-system',
    inlet: '50MM',
    material: 'Burnt Blue Titanium',
    price: 'Rp 3.140.000',
    priceValue: 3_140_000,
    image: '/assets/products/fs-nmax-turbo-grid.jpg',
    images: [
      '/assets/products/fs-nmax-turbo-grid.jpg',
      '/assets/products/fs-nmax-turbo-hero.jpg',
      '/assets/Border Titanium Aerox Old/WhatsApp Image 2026-10-21 at 13.24.46.jpeg',
      '/assets/Border Titanium Aerox Old/WhatsApp Image 2026-10-21 at 13.24.46 (1).jpeg',
    ],
    description: [
      'Complete system from header to silencer, fully optimized gas flow for throttle response and top speed.',
      'Premium burnt blue titanium: lightweight, high heat resistance, and the exotic look of a custom exhaust.',
    ],
    variants: {
      kategori: [
        { value: 'Full System' },
        { value: 'DB Killer' },
        { value: 'Kondoman' },
        { value: 'Standar Racing' },
      ],
      inlet: [
        { value: '45MM' },
        { value: '50MM' },
        { value: '54MM', addPrice: 300_000 },
      ],
      saringan: SARINGAN,
      motor: MOTOR,
    },
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function defaultSelection(p: Product): VariantSelection {
  return {
    kategori: p.variants.kategori[0].value,
    inlet: p.variants.inlet[0].value,
    saringan: p.variants.saringan[0].value,
    motor: p.variants.motor[0].value,
  };
}

function addPriceOf(options: VariantOption[], value: string): number {
  return options.find((o) => o.value === value)?.addPrice ?? 0;
}

/** Total = harga dasar + semua tambahan varian terpilih */
export function totalPrice(p: Product, sel: Partial<VariantSelection>): number {
  return (
    p.priceValue +
    addPriceOf(p.variants.kategori, sel.kategori ?? '') +
    addPriceOf(p.variants.inlet, sel.inlet ?? '') +
    addPriceOf(p.variants.saringan, sel.saringan ?? '') +
    addPriceOf(p.variants.motor, sel.motor ?? '')
  );
}

export function formatIDR(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}
