import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import { DatabaseService } from '../../core/database/database.service';
import { DiscountPolicyService } from './discount-policy.service';
import {
  getProduct,
  defaultSelection,
  calculatePrice,
  PRODUCTS,
  ProductWithPricing,
} from './products.catalog';
import { CheckoutStripeDto } from './dto/checkout-stripe.dto';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly discountPolicyService: DiscountPolicyService,
  ) {}

  /**
   * Resolves the user's role string from object, string, or database lookup
   */
  async resolveUserRole(user?: any): Promise<string | undefined> {
    if (!user) return undefined;
    if (typeof user === 'string') return user;
    if (user.role) return user.role;
    if (user.id) {
      try {
        const { rows } = await this.db.query(
          `SELECT role FROM master.t_mtr_users WHERE id = $1`,
          [user.id],
        );
        if (rows && rows.length > 0) {
          return rows[0].role;
        }
      } catch (err: any) {
        this.logger.warn(`Failed to resolve role for user ${user.id}: ${err.message}`);
      }
    }
    return undefined;
  }

  /**
   * Mengambil persentase diskon dinamis menggunakan DiscountPolicyService
   */
  async getDiscountPercentForUser(
    user?: any,
    options?: { city?: string; category?: string; qty?: number; productId?: string; couponCode?: string },
  ): Promise<number> {
    const role = await this.resolveUserRole(user);
    const evaluation = await this.discountPolicyService.evaluateDiscount({
      role,
      city: options?.city,
      category: options?.category,
      qty: options?.qty,
      productId: options?.productId,
      couponCode: options?.couponCode,
    });
    return evaluation.discountPercent;
  }

  /**
   * Mengembalikan daftar katalog produk dengan harga dinamis (ritel vs grosir)
   * berdasarkan evaluasi kebijakan diskon decoupled (role, kota, promo).
   */
  async getProducts(
    user?: any,
    options?: { city?: string },
  ): Promise<{
    discountPercent: number;
    isResellerPricing: boolean;
    products: ProductWithPricing[];
    matchedPolicies: string[];
  }> {
    const role = await this.resolveUserRole(user);
    const evaluation = await this.discountPolicyService.evaluateDiscount({
      role,
      city: options?.city,
    });
    const discountPercent = evaluation.discountPercent;
    const isResellerPricing = discountPercent > 0;

    const productsWithPricing: ProductWithPricing[] = PRODUCTS.map((product) => {
      const pricing = calculatePrice(product, {}, discountPercent);
      return {
        ...product,
        priceRetail: pricing.priceRetail,
        priceEffective: pricing.priceEffective,
        discountPercent: pricing.discountPercent,
        isResellerPricing: pricing.isResellerPricing,
      };
    });

    return {
      discountPercent,
      isResellerPricing,
      products: productsWithPricing,
      matchedPolicies: evaluation.matchedPolicies,
    };
  }

  /**
   * Membuat Stripe Checkout Session dengan nominal diskon dinamis sesuai kebijakan diskon
   */
  async createStripeSession(
    dto: CheckoutStripeDto,
    origin: string,
    user?: any,
  ): Promise<{
    url: string | null;
    sessionId?: string;
    amount?: number;
    priceRetail?: number;
    priceEffective?: number;
    discountPercent?: number;
    isResellerPricing?: boolean;
    matchedPolicies?: string[];
  }> {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new InternalServerErrorException('Stripe belum dikonfigurasi.');
    }

    const product = getProduct(dto.productId);
    if (!product) {
      throw new BadRequestException('Produk tidak ditemukan.');
    }

    const fallback = defaultSelection(product);
    const sel = {
      kategori: dto.kategori || fallback.kategori,
      inlet: dto.inlet || fallback.inlet,
      saringan: dto.saringan || fallback.saringan,
      motor: dto.motor || fallback.motor,
    };

    const role = await this.resolveUserRole(user);
    const evaluation = await this.discountPolicyService.evaluateDiscount({
      role,
      city: dto.city,
      category: sel.kategori,
      productId: dto.productId,
      qty: 1,
    });

    const discountPercent = evaluation.discountPercent;
    const pricing = calculatePrice(product, sel, discountPercent);
    const amount = pricing.priceEffective;

    const stripe = new Stripe(key);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'idr',
            unit_amount: amount,
            product_data: {
              name: `${product.name} | ARM Exhaust${pricing.isResellerPricing ? ' (Wholesale)' : ''}`,
              description: `${sel.kategori} · Inlet ${sel.inlet} · ${sel.saringan} · ${sel.motor} · ${product.material}${
                pricing.isResellerPricing ? ` · Margin: ${pricing.discountPercent}% OFF` : ''
              }`,
            },
          },
        },
      ],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/custom-order?canceled=1`,
      customer_email: dto.email,
      metadata: {
        productId: dto.productId,
        name: dto.name || '',
        phone: dto.phone || '',
        address: dto.address || '',
        city: dto.city || '',
        note: dto.note || '',
        userId: user?.id || '',
        userRole: role || 'guest',
        priceRetail: String(pricing.priceRetail),
        priceEffective: String(pricing.priceEffective),
        discountPercent: String(pricing.discountPercent),
        isResellerPricing: String(pricing.isResellerPricing),
        matchedPolicies: evaluation.matchedPolicies.join(','),
        ...sel,
      },
    });

    this.logger.log(
      `Stripe Checkout Session created: ${session.id} for product ${dto.productId} (amount: ${amount} IDR, discount: ${pricing.discountPercent}%, policies: ${evaluation.matchedPolicies.join(',') || 'NONE'})`,
    );

    return {
      url: session.url,
      sessionId: session.id,
      amount,
      priceRetail: pricing.priceRetail,
      priceEffective: pricing.priceEffective,
      discountPercent: pricing.discountPercent,
      isResellerPricing: pricing.isResellerPricing,
      matchedPolicies: evaluation.matchedPolicies,
    };
  }
}
