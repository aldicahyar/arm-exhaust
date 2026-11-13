import { Controller, Get } from '@nestjs/common';
import { ContentManagementService } from './content-management.service';

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
}
