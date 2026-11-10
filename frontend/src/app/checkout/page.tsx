'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  defaultSelection,
  formatIDR,
  getProduct,
  totalPrice,
} from '@/shared/lib/products';

function CheckoutForm() {
  const params = useSearchParams();
  const product = getProduct(params.get('product') ?? '');

  // Varian dari URL (dikirim halaman detail) — fallback ke default
  const selection = product
    ? {
        kategori: params.get('category') ?? defaultSelection(product).kategori,
        inlet: params.get('inlet') ?? defaultSelection(product).inlet,
        saringan: params.get('screen') ?? defaultSelection(product).saringan,
        motor: params.get('motor') ?? defaultSelection(product).motor,
      }
    : null;
  const total = product && selection ? totalPrice(product, selection) : 0;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState('stripe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!product) {
    return (
      <div className="border border-dashed border-[#2B2B30] rounded-lg py-16 text-center">
        <p className="text-sm text-[#8A8F98]">Product not found.</p>
        <Link href="/catalog" className="mt-3 inline-block text-xs text-white underline underline-offset-4">
          Back to catalog
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, name, email, phone, address, note, ...selection }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Failed to create payment session.');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-[#101012] border border-[#2B2B30] rounded-md px-3 py-2.5 text-sm text-white placeholder:text-[#8A8F98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E6BFF]';

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-[1fr_380px] gap-10">
      {/* Data pembeli */}
      <div>
        <h2 className="font-['Space_Grotesk'] text-lg font-bold tracking-tight mb-6">Customer Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="grid gap-1.5 text-xs text-[#9AA0A8]">
            Full Name *
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} placeholder="Your name" />
          </label>
          <label className="grid gap-1.5 text-xs text-[#9AA0A8]">
            Email *
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} placeholder="email@example.com" />
          </label>
          <label className="grid gap-1.5 text-xs text-[#9AA0A8]">
            WhatsApp Number
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="08xxxxxxxxxx" />
          </label>
          <label className="grid gap-1.5 text-xs text-[#9AA0A8]">
            Shipping Address
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} placeholder="City, address" />
          </label>
          <label className="grid gap-1.5 text-xs text-[#9AA0A8] md:col-span-2">
            Notes (bike model, color, etc.)
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={inputCls} placeholder="Example: Vario 125, prefer black finish" />
          </label>
        </div>

        <h2 className="font-['Space_Grotesk'] text-lg font-bold tracking-tight mt-10 mb-6">Payment Method</h2>
        <div className="grid gap-3">
          {/* ponytail: aktifkan saat MIDTRANS_SERVER_KEY terisi — VA/QRIS/e-wallet domestik */}
          <label className="flex items-center gap-3 border border-[#2B2B30] rounded-md px-4 py-3 opacity-50 cursor-not-allowed">
            <input type="radio" name="method" checked={false} disabled className="accent-white" />
            <span className="text-sm text-white">Bank Transfer / QRIS / e-Wallet</span>
            <span className="ml-auto font-mono text-[10px] text-[#8A8F98] uppercase tracking-wider">Domestic (soon)</span>
          </label>
          <label
            className={`flex items-center gap-3 border rounded-md px-4 py-3 cursor-pointer transition-colors ${
              method === 'stripe' ? 'border-white bg-[#141416]' : 'border-[#2B2B30] hover:border-[#3A3A42]'
            }`}
          >
            <input type="radio" name="method" value="stripe" checked={method === 'stripe'} onChange={() => setMethod('stripe')} className="accent-white" />
            <span className="text-sm text-white">Credit / Debit Card (Stripe)</span>
            <span className="ml-auto font-mono text-[10px] text-[#8A8F98] uppercase tracking-wider">International</span>
          </label>
        </div>
      </div>

      {/* Ringkasan order */}
      <aside className="lg:sticky lg:top-36 self-start border border-[#1E1E21] rounded-lg p-5">
        <h2 className="font-mono text-[10px] text-[#8A8F98] tracking-widest uppercase mb-4">Order Summary</h2>
        <div className="flex gap-3">
          <div className="relative w-20 aspect-[4/3] rounded-md overflow-hidden border border-[#1E1E21] shrink-0">
            <Image src={product.image} alt={product.name} fill className="object-cover" sizes="80px" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{product.name}</p>
            <p className="font-mono text-[10px] text-[#8A8F98] uppercase mt-1">
              {selection!.kategori} · {selection!.inlet} · {selection!.saringan} · {selection!.motor}
            </p>
          </div>
        </div>
        <div className="border-t border-[#1E1E21] mt-4 pt-4 flex justify-between text-sm">
          <span className="text-[#9AA0A8]">Subtotal</span>
          <span className="text-white">{formatIDR(total)}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-[#9AA0A8]">Shipping</span>
          <span className="text-[#9AA0A8]">Set by admin</span>
        </div>
        <div className="border-t border-[#1E1E21] mt-4 pt-4 flex justify-between">
          <span className="text-sm font-semibold text-white">Total</span>
          <span className="text-lg font-bold text-white">{formatIDR(total)}</span>
        </div>

        {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-5 py-3 rounded-md bg-white text-[#0A0A0B] text-sm font-semibold hover:bg-[#E8E8EC] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Redirecting…' : 'Pay Now'}
        </button>
        <p className="mt-3 text-[10px] text-[#8A8F98] leading-relaxed">
          You will be redirected to Stripe&apos;s secure payment page. Test mode is active — use card 4242 4242 4242 4242.
        </p>
      </aside>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white selection:bg-[#2E6BFF] selection:text-white">
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 min-h-[calc(100svh-128px)] flex flex-col justify-center">
        <span className="font-mono text-[10px] text-[#8A8F98] tracking-widest uppercase">Checkout</span>
        <h1 className="font-['Space_Grotesk'] text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
          Complete your order.
        </h1>
        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-[#8A8F98]">Loading…</p>}>
            <CheckoutForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
