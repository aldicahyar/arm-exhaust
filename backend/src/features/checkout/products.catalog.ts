export interface VariantOption {
  value: string;
  addPrice?: number;
}

export interface Product {
  id: string;
  name: string;
  priceValue: number;
  material: string;
  variants: {
    kategori: VariantOption[];
    inlet: VariantOption[];
    saringan: VariantOption[];
    motor: VariantOption[];
  };
}

export interface Selection {
  kategori?: string;
  inlet?: string;
  saringan?: string;
  motor?: string;
}

export interface CalculatedPrice {
  priceRetail: number;
  discountAmount: number;
  priceEffective: number;
  discountPercent: number;
  isResellerPricing: boolean;
}

export interface ProductWithPricing extends Product {
  priceRetail: number;
  priceEffective: number;
  discountPercent: number;
  isResellerPricing: boolean;
}

const SARINGAN: VariantOption[] = [
  { value: 'Sarfull' },
  { value: 'Sarteng', addPrice: 100_000 },
  { value: 'Sarbor', addPrice: 200_000 },
];

const MOTOR: VariantOption[] = [
  'Vario 125', 'Vario 150', 'Vario 160', 'Honda Beat', 'Honda Scoopy',
  'Honda PCX', 'Yamaha NMAX', 'Yamaha Aerox', 'Lainnya',
].map((value) => ({ value }));

export const PRODUCTS: Product[] = [
  {
    id: 'kdv2-vario125',
    name: 'Kondoman V2',
    priceValue: 1_850_000,
    material: 'Stainless 304',
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
    priceValue: 1_250_000,
    material: 'Black Sandblast',
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
    priceValue: 2_350_000,
    material: 'Burnt Titanium Endcap',
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
    priceValue: 3_140_000,
    material: 'Burnt Blue Titanium',
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

export function defaultSelection(p: Product): Required<Selection> {
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

/**
 * Total SELALU dihitung server dari data produk — klien tidak bisa menentukan nominal
 */
export function totalPrice(p: Product, sel: Selection): number {
  return (
    p.priceValue +
    addPriceOf(p.variants.kategori, sel.kategori ?? '') +
    addPriceOf(p.variants.inlet, sel.inlet ?? '') +
    addPriceOf(p.variants.saringan, sel.saringan ?? '') +
    addPriceOf(p.variants.motor, sel.motor ?? '')
  );
}

/**
 * Menghitung harga ritel, diskon reseller/distributor, dan harga efektif (dibulatkan ke kelipatan 500 IDR terdekat)
 */
export function calculatePrice(
  product: Product,
  selection: Selection = {},
  discountPercent: number = 0,
): CalculatedPrice {
  const sel = { ...defaultSelection(product), ...selection };
  const retail = totalPrice(product, sel);
  const numDiscount = Number(discountPercent);
  const safeDiscount = isNaN(numDiscount) ? 0 : Math.max(0, Math.min(numDiscount, 100));

  if (safeDiscount <= 0) {
    return {
      priceRetail: retail,
      discountAmount: 0,
      priceEffective: retail,
      discountPercent: 0,
      isResellerPricing: false,
    };
  }

  const rawEffective = retail * (1 - safeDiscount / 100);
  const roundedEffective = Math.round(rawEffective / 500) * 500;
  const discountAmount = retail - roundedEffective;

  return {
    priceRetail: retail,
    discountAmount,
    priceEffective: roundedEffective,
    discountPercent: safeDiscount,
    isResellerPricing: true,
  };
}
