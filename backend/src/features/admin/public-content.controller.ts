import { Controller, Get } from '@nestjs/common';
import { HomeValueProp, HomeNewArrival } from '@prisma/client';
import { ContentManagementService } from './content-management.service';

function formatValueProp(item: HomeValueProp) {
  return {
    ...item,
    stepNumber: item.step_number,
    sortOrder: item.sort_order,
    isActive: item.is_active,
  };
}

function formatNewArrival(item: HomeNewArrival) {
  return {
    ...item,
    productId: item.product_id,
    badgeText: item.badge_text,
    categoryLabel: item.category_label,
    priceDisplay: item.price_display,
    imageUrl: item.image_url,
    sortOrder: item.sort_order,
    isActive: item.is_active,
  };
}

@Controller(['public', 'public/content'])
export class PublicContentController {
  constructor(
    private readonly contentManagementService: ContentManagementService,
  ) {}

  @Get('campaign-slides')
  async getCampaignSlides() {
    return this.contentManagementService.getActiveHeroSlides();
  }

  @Get('community-events')
  async getCommunityEvents() {
    return this.contentManagementService.getActiveCommunityEvents();
  }

  @Get('home-content')
  async getHomeContent() {
    const [valueProps, newArrivals, headers] = await Promise.all([
      this.contentManagementService.getActiveValueProps(),
      this.contentManagementService.getActiveNewArrivals(),
      this.contentManagementService.getHomeHeaders(),
    ]);

    return {
      section2: {
        header: headers.section2,
        items: valueProps.map(formatValueProp),
      },
      section3: {
        header: headers.section3,
        items: newArrivals.map(formatNewArrival),
      },
    };
  }
}

