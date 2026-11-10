import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { DiscountPolicyService } from './discount-policy.service';
import { CheckoutController } from './checkout.controller';
import { CatalogController } from './catalog.controller';

@Module({
  controllers: [CheckoutController, CatalogController],
  providers: [CheckoutService, DiscountPolicyService],
  exports: [CheckoutService, DiscountPolicyService],
})
export class CheckoutModule {}
