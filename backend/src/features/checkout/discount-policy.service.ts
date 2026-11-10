import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export interface DiscountEvaluationContext {
  role?: string;
  category?: string;
  city?: string;
  couponCode?: string;
  qty?: number;
  productId?: string;
}

export interface DiscountEvaluationResult {
  discountPercent: number;
  matchedPolicies: string[];
}

export interface DiscountPolicyRow {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: number | string;
  target_roles?: string[] | null;
  target_categories?: string[] | null;
  target_product_ids?: string[] | null;
  min_order_qty: number;
  min_order_amount: number | string;
  coupon_code?: string | null;
  criteria_rules?: any;
  priority: number;
  stacking_mode: 'EXCLUSIVE' | 'STACKABLE';
  valid_from?: Date | string | null;
  valid_until?: Date | string | null;
  is_active: boolean;
}

@Injectable()
export class DiscountPolicyService {
  private readonly logger = new Logger(DiscountPolicyService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Evaluates active discount policies against the provided customer & order context.
   * Multi-dimensional matching: role, category, product ID, quantity, coupon, and city.
   */
  async evaluateDiscount(context: DiscountEvaluationContext = {}): Promise<DiscountEvaluationResult> {
    try {
      const { rows } = await this.db.query<DiscountPolicyRow>(
        `SELECT 
           id, code, name, description, discount_type, discount_value,
           target_roles, target_categories, target_product_ids,
           min_order_qty, min_order_amount, coupon_code,
           criteria_rules, priority, stacking_mode,
           valid_from, valid_until, is_active
         FROM master.t_mtr_discount_policies
         WHERE is_active = TRUE
           AND (valid_from IS NULL OR valid_from <= NOW())
           AND (valid_until IS NULL OR valid_until >= NOW())
         ORDER BY priority DESC, created_at ASC`,
      );

      const matchingPolicies = rows.filter((policy) => this.matchesContext(policy, context));

      if (matchingPolicies.length === 0) {
        return { discountPercent: 0, matchedPolicies: [] };
      }

      // Group by stacking mode: EXCLUSIVE takes max, STACKABLE sums up
      const exclusive = matchingPolicies.filter(
        (p) => (p.stacking_mode || 'EXCLUSIVE').toUpperCase() === 'EXCLUSIVE',
      );
      const stackable = matchingPolicies.filter(
        (p) => (p.stacking_mode || '').toUpperCase() === 'STACKABLE',
      );

      let maxExclusive = 0;
      for (const p of exclusive) {
        const val = Number(p.discount_value) || 0;
        if (val > maxExclusive) {
          maxExclusive = val;
        }
      }

      let sumStackable = 0;
      for (const p of stackable) {
        sumStackable += Number(p.discount_value) || 0;
      }

      const rawDiscount = maxExclusive + sumStackable;
      const discountPercent = Math.min(100, Math.max(0, rawDiscount));
      const matchedPolicies = matchingPolicies.map((p) => p.code);

      return {
        discountPercent,
        matchedPolicies,
      };
    } catch (err: any) {
      this.logger.error(`Error evaluating discount policies: ${err.message}`, err.stack);
      return { discountPercent: 0, matchedPolicies: [] };
    }
  }

  /**
   * Alias method for evaluateDiscount
   */
  async getEffectiveDiscount(context: DiscountEvaluationContext = {}): Promise<DiscountEvaluationResult> {
    return this.evaluateDiscount(context);
  }

  /**
   * Helper method to get the highest base discount percent for a specific role
   */
  async getDiscountPercentForRole(role?: string): Promise<{ discountPercent: number; policyCode: string | null }> {
    if (!role) return { discountPercent: 0, policyCode: null };
    const res = await this.evaluateDiscount({ role });
    return {
      discountPercent: res.discountPercent,
      policyCode: res.matchedPolicies[0] || null,
    };
  }

  private matchesContext(policy: DiscountPolicyRow, context: DiscountEvaluationContext): boolean {
    // 1. Role validation
    if (policy.target_roles && policy.target_roles.length > 0) {
      if (!context.role) return false;
      const userRole = context.role.trim().toLowerCase();
      const hasRole = policy.target_roles.some(
        (r: string) => String(r).trim().toLowerCase() === userRole,
      );
      if (!hasRole) return false;
    }

    // 2. Category validation
    if (policy.target_categories && policy.target_categories.length > 0) {
      if (!context.category) return false;
      const itemCat = context.category.trim().toLowerCase();
      const hasCat = policy.target_categories.some(
        (c: string) => String(c).trim().toLowerCase() === itemCat,
      );
      if (!hasCat) return false;
    }

    // 3. Product ID validation
    if (policy.target_product_ids && policy.target_product_ids.length > 0) {
      if (!context.productId) return false;
      const prodId = context.productId.trim().toLowerCase();
      const hasProd = policy.target_product_ids.some(
        (p: string) => String(p).trim().toLowerCase() === prodId,
      );
      if (!hasProd) return false;
    }

    // 4. Min Order Quantity
    const qty = context.qty ?? 1;
    if (policy.min_order_qty && qty < policy.min_order_qty) {
      return false;
    }

    // 5. Coupon code validation
    if (policy.coupon_code && policy.coupon_code.trim()) {
      if (!context.couponCode) return false;
      if (policy.coupon_code.trim().toLowerCase() !== context.couponCode.trim().toLowerCase()) {
        return false;
      }
    }

    // 6. Criteria rules -> City scoping
    let rules = policy.criteria_rules;
    if (typeof rules === 'string') {
      try {
        rules = JSON.parse(rules);
      } catch {
        rules = {};
      }
    }

    if (rules && Array.isArray(rules.cities) && rules.cities.length > 0) {
      if (!context.city || !context.city.trim()) {
        return false;
      }
      const normalizedCtxCity = context.city.trim().toUpperCase();
      const cityMatch = rules.cities.some(
        (c: string) => String(c).trim().toUpperCase() === normalizedCtxCity,
      );
      if (!cityMatch) return false;
    }

    return true;
  }
}
