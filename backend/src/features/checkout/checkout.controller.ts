import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CheckoutService } from './checkout.service';
import { CheckoutStripeDto } from './dto/checkout-stripe.dto';
import { OptionalSessionAuthGuard } from '../../shared/guards/optional-session-auth.guard';

function getRequestOrigin(req: Request): string {
  const host =
    req.headers['x-forwarded-host'] ||
    req.headers.host ||
    `localhost:${process.env.PORT || 4000}`;
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return `${proto}://${host}`;
}

@Controller('checkout')
@UseGuards(OptionalSessionAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get('products')
  async getProducts(
    @Req() req: Request,
    @Query('city') city?: string,
  ) {
    return this.checkoutService.getProducts((req as any).user, { city });
  }

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async stripeCheckout(
    @Body() dto: CheckoutStripeDto,
    @Req() req: Request,
    @Query('city') queryCity?: string,
  ) {
    if (!dto.city && queryCity) {
      dto.city = queryCity;
    }
    const origin = getRequestOrigin(req);
    return this.checkoutService.createStripeSession(dto, origin, (req as any).user);
  }
}
