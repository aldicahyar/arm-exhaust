import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  CreateCampaignSlideDto,
  UpdateCampaignSlideDto,
} from './dto/campaign-slide.dto';
import {
  CreateCommunityEventDto,
  UpdateCommunityEventDto,
} from './dto/community-event.dto';

export const DEFAULT_CAMPAIGN_SLIDES = [
  {
    category: 'PRODUK',
    tag: '01 / NEW ARRIVAL',
    title: 'ARM ZX-25R TITANIUM FULL SYSTEM',
    strip_title: 'ZX-25R Titanium Series',
    href: '/catalog',
    image_url: '/assets/products/sample-hero.jpg',
    sort_order: 0,
    is_active: true,
  },
  {
    category: 'PROMO',
    tag: '02 / SPECIAL PROMO',
    title: 'YEAR-END RACING DEALS: DISKON 20%',
    strip_title: 'Year-End Racing Deals',
    href: '/catalog',
    image_url: '/assets/products/sample-hero.jpg',
    sort_order: 1,
    is_active: true,
  },
  {
    category: 'ACARA',
    tag: '03 / TRACK EVENT',
    title: 'SENTUL TRACK DAY & DYNO MEETUP',
    strip_title: 'Sentul Track Day 2026',
    href: '/contact',
    image_url: '/assets/products/sample-hero.jpg',
    sort_order: 2,
    is_active: true,
  },
  {
    category: 'WORKSHOP',
    tag: '04 / IN-HOUSE WORKSHOP',
    title: 'CUSTOM INLET & PRECISION DYNO TUNE',
    strip_title: 'Custom Inlet & Dyno Tune',
    href: 'https://wa.me/6281234567890',
    image_url: '/assets/products/sample-hero.jpg',
    sort_order: 3,
    is_active: true,
  },
];

export const DEFAULT_COMMUNITY_EVENTS = [
  {
    category: 'SPONSORSHIP',
    tag: 'SPONSORSHIP',
    event_date: '2026-03-15',
    title: 'Sponsored event name',
    description: 'Dukungan resmi ARM Exhaust untuk kejuaraan balap nasional dan modifikasi.',
    image_url: '/assets/products/sample-hero.jpg',
    href: null,
    sort_order: 0,
    is_active: true,
  },
  {
    category: 'COMMUNITY',
    tag: 'COMMUNITY',
    event_date: '2026-04-10',
    title: 'Community gathering name',
    description: 'Kopdar dan silaturahmi komunitas motor pengguna ARM Exhaust.',
    image_url: '/assets/products/sample-hero.jpg',
    href: null,
    sort_order: 1,
    is_active: true,
  },
  {
    category: 'WORKSHOP',
    tag: 'WORKSHOP',
    event_date: '2026-05-20',
    title: 'Workshop activity name',
    description: 'Sesi workshop dyno tuning, instalasi sistem knalpot, dan maintenance.',
    image_url: '/assets/products/sample-hero.jpg',
    href: null,
    sort_order: 2,
    is_active: true,
  },
];

@Injectable()
export class ContentManagementService implements OnModuleInit {
  private readonly logger = new Logger(ContentManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultsIfEmpty();
  }

  // ==========================================
  // Auto-seed Defaults
  // ==========================================
  async seedDefaultsIfEmpty(): Promise<void> {
    try {
      const slideCount = await this.prisma.campaignSlide.count();
      if (slideCount === 0) {
        await this.prisma.campaignSlide.createMany({
          data: DEFAULT_CAMPAIGN_SLIDES,
        });
        this.logger.log('Seeded 4 default campaign slides to database');
      }

      const eventCount = await this.prisma.communityEvent.count();
      if (eventCount === 0) {
        await this.prisma.communityEvent.createMany({
          data: DEFAULT_COMMUNITY_EVENTS,
        });
        this.logger.log('Seeded 3 default community events to database');
      }
    } catch (err: any) {
      this.logger.warn(`Failed to auto-seed content defaults: ${err?.message}`);
    }
  }

  // ==========================================
  // Campaign / Hero Slides
  // ==========================================
  async getAllHeroSlides() {
    await this.seedDefaultsIfEmpty();
    return this.prisma.campaignSlide.findMany({
      orderBy: { sort_order: 'asc' },
    });
  }

  async getActiveHeroSlides() {
    await this.seedDefaultsIfEmpty();
    return this.prisma.campaignSlide.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    });
  }

  async createHeroSlide(dto: CreateCampaignSlideDto) {
    const sortOrder = await this.resolveSlideSortOrder(dto.sort_order);
    const data = this.normalizeSlidePayload(dto, sortOrder);

    return this.prisma.campaignSlide.create({
      data,
    });
  }

  async updateHeroSlide(id: string, dto: UpdateCampaignSlideDto) {
    await this.ensureHeroSlideExists(id);
    const data = this.filterDefinedValues(this.normalizeSlideUpdatePayload(dto));

    return this.prisma.campaignSlide.update({
      where: { id },
      data,
    });
  }

  async toggleHeroSlideStatus(id: string) {
    const existing = await this.ensureHeroSlideExists(id);
    return this.prisma.campaignSlide.update({
      where: { id },
      data: { is_active: !existing.is_active },
    });
  }

  async reorderHeroSlides(orderedIds: string[]) {
    this.validateOrderedIds(orderedIds);

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.campaignSlide.update({
          where: { id },
          data: { sort_order: index },
        }),
      ),
    );

    return { success: true, count: orderedIds.length };
  }

  async deleteHeroSlide(id: string) {
    await this.ensureHeroSlideExists(id);
    return this.prisma.campaignSlide.delete({
      where: { id },
    });
  }

  // ==========================================
  // Community Events
  // ==========================================
  async getAllCommunityEvents() {
    await this.seedDefaultsIfEmpty();
    return this.prisma.communityEvent.findMany({
      orderBy: { sort_order: 'asc' },
    });
  }

  async getActiveCommunityEvents() {
    await this.seedDefaultsIfEmpty();
    return this.prisma.communityEvent.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    });
  }

  async createCommunityEvent(dto: CreateCommunityEventDto) {
    const sortOrder = await this.resolveEventSortOrder(dto.sort_order);
    const data = this.normalizeEventPayload(dto, sortOrder);

    return this.prisma.communityEvent.create({
      data,
    });
  }

  async updateCommunityEvent(id: string, dto: UpdateCommunityEventDto) {
    await this.ensureCommunityEventExists(id);
    const data = this.filterDefinedValues(this.normalizeEventUpdatePayload(dto));

    return this.prisma.communityEvent.update({
      where: { id },
      data,
    });
  }

  async toggleCommunityEventStatus(id: string) {
    const existing = await this.ensureCommunityEventExists(id);
    return this.prisma.communityEvent.update({
      where: { id },
      data: { is_active: !existing.is_active },
    });
  }

  async reorderCommunityEvents(orderedIds: string[]) {
    this.validateOrderedIds(orderedIds);

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.communityEvent.update({
          where: { id },
          data: { sort_order: index },
        }),
      ),
    );

    return { success: true, count: orderedIds.length };
  }

  async deleteCommunityEvent(id: string) {
    await this.ensureCommunityEventExists(id);
    return this.prisma.communityEvent.delete({
      where: { id },
    });
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================
  private async ensureHeroSlideExists(id: string) {
    const slide = await this.prisma.campaignSlide.findUnique({ where: { id } });
    if (!slide) {
      throw new NotFoundException(`Campaign slide dengan ID ${id} tidak ditemukan.`);
    }
    return slide;
  }

  private async ensureCommunityEventExists(id: string) {
    const event = await this.prisma.communityEvent.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Community event dengan ID ${id} tidak ditemukan.`);
    }
    return event;
  }

  private async resolveSlideSortOrder(provided?: number): Promise<number> {
    if (typeof provided === 'number') {
      return provided;
    }
    const maxItem = await this.prisma.campaignSlide.findFirst({
      orderBy: { sort_order: 'desc' },
      select: { sort_order: true },
    });
    return maxItem ? maxItem.sort_order + 1 : 0;
  }

  private async resolveEventSortOrder(provided?: number): Promise<number> {
    if (typeof provided === 'number') {
      return provided;
    }
    const maxItem = await this.prisma.communityEvent.findFirst({
      orderBy: { sort_order: 'desc' },
      select: { sort_order: true },
    });
    return maxItem ? maxItem.sort_order + 1 : 0;
  }

  private normalizeSlidePayload(dto: any, sortOrder: number) {
    return {
      category: dto.category,
      tag: dto.tag,
      title: dto.title,
      strip_title: dto.strip_title ?? dto.stripTitle,
      href: dto.href,
      image_url: dto.image_url ?? dto.imageUrl ?? dto.image,
      sort_order: sortOrder,
      is_active: dto.is_active ?? dto.isActive ?? true,
    };
  }

  private normalizeSlideUpdatePayload(dto: any) {
    return {
      category: dto.category,
      tag: dto.tag,
      title: dto.title,
      strip_title: dto.strip_title ?? dto.stripTitle,
      href: dto.href,
      image_url: dto.image_url ?? dto.imageUrl ?? dto.image,
      sort_order: dto.sort_order ?? dto.sortOrder,
      is_active: dto.is_active ?? dto.isActive,
    };
  }

  private normalizeEventPayload(dto: any, sortOrder: number) {
    return {
      category: dto.category,
      tag: dto.tag,
      event_date: dto.event_date ?? dto.eventDate,
      title: dto.title,
      description: dto.description,
      image_url: dto.image_url ?? dto.imageUrl ?? dto.image,
      href: dto.href ?? null,
      sort_order: sortOrder,
      is_active: dto.is_active ?? dto.isActive ?? true,
    };
  }

  private normalizeEventUpdatePayload(dto: any) {
    return {
      category: dto.category,
      tag: dto.tag,
      event_date: dto.event_date ?? dto.eventDate,
      title: dto.title,
      description: dto.description,
      image_url: dto.image_url ?? dto.imageUrl ?? dto.image,
      href: dto.href,
      sort_order: dto.sort_order ?? dto.sortOrder,
      is_active: dto.is_active ?? dto.isActive,
    };
  }

  private validateOrderedIds(orderedIds: string[]): void {
    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new BadRequestException('orderedIds harus berupa array string tidak kosong.');
    }
  }

  private filterDefinedValues(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }
}
