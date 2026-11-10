import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CheckoutService } from './checkout.service';
import { OptionalSessionAuthGuard } from '../../shared/guards/optional-session-auth.guard';

@Controller('products')
@UseGuards(OptionalSessionAuthGuard)
export class CatalogController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get()
  async getProducts(
    @Req() req: Request,
    @Query('city') city?: string,
  ) {
    return this.checkoutService.getProducts((req as any).user, { city });
  }
}
