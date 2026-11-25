import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { HomeValueProp, HomeNewArrival } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  CreateCampaignSlideDto,
  UpdateCampaignSlideDto,
} from './dto/campaign-slide.dto';
import {
  CreateCommunityEventDto,
  UpdateCommunityEventDto,
} from './dto/community-event.dto';
import {
  CreateHomeValuePropDto,
  UpdateHomeValuePropDto,
} from './dto/home-value-prop.dto';
import {
  CreateHomeNewArrivalDto,
  UpdateHomeNewArrivalDto,
} from './dto/home-new-arrival.dto';
import {
  HomeHeaderDto,
  UpdateHomeHeadersDto,
} from './dto/home-header.dto';

export const DEFAULT_CAMPAIGN_SLIDES = [
  {
    category: 'PRODUK',
    tag: '01 / NEW ARRIVAL',
    title: 'ARM NUSANTARA BURNT TITANIUM',
    strip_title: 'Nusantara Titanium Series',
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

export const DEFAULT_HOME_VALUE_PROPS = [
  {
    step_number: '01',
    title: 'CUSTOM PER BIKE',
    description: 'Built to match your bike and preferred sound — not factory dimensions.',
    sort_order: 0,
    is_active: true,
  },
  {
    step_number: '02',
    title: 'ROAD TESTED',
    description: 'Every unit is road-tested before being handed to its owner.',
    sort_order: 1,
    is_active: true,
  },
  {
    step_number: '03',
    title: 'WORKSHOP WARRANTY',
    description: 'Official warranty on materials and build quality.',
    sort_order: 2,
    is_active: true,
  },
  {
    step_number: '04',
    title: 'IN-HOUSE FITTING',
    description: 'Installed by ARM technicians: precise, clean, measured.',
    sort_order: 3,
    is_active: true,
  },
];

export const DEFAULT_HOME_NEW_ARRIVALS = [
  {
    product_id: 'kdv2-vario125',
    badge_text: 'NEW ARRIVAL',
    name: 'Kondoman V2',
    category_label: 'Kondoman',
    inlet: '38MM',
    material: 'Stainless 304',
    price_display: 'Rp 1.850.000',
    image_url: '/assets/products/kdv2-vario125-grid.jpg',
    href: '/products/kdv2-vario125',
    sort_order: 0,
    is_active: true,
  },
  {
    product_id: 'kdv2-nmax',
    badge_text: 'NEW ARRIVAL',
    name: 'Kondoman V2 NMAX',
    category_label: 'Kondoman',
    inlet: '38MM',
    material: 'Stainless 304',
    price_display: 'Rp 1.850.000',
    image_url: '/assets/products/sample-hero.jpg',
    href: '/products/kdv2-nmax',
    sort_order: 1,
    is_active: true,
  },
  {
    product_id: 'std-racing-aerox',
    badge_text: 'BEST SELLER',
    name: 'Standar Racing Aerox',
    category_label: 'Standar Racing',
    inlet: '38MM',
    material: 'Stainless 304',
    price_display: 'Rp 1.650.000',
    image_url: '/assets/products/sample-hero.jpg',
    href: '/products/std-racing-aerox',
    sort_order: 2,
    is_active: true,
  },
  {
    product_id: 'dbk-universal',
    badge_text: 'ACCESORIES',
    name: 'DB Killer Universal',
    category_label: 'DB Killer',
    inlet: '38MM',
    material: 'Stainless 304',
    price_display: 'Rp 250.000',
    image_url: '/assets/products/sample-hero.jpg',
    href: '/products/dbk-universal',
    sort_order: 3,
    is_active: true,
  },
];

export const DEFAULT_HOME_SECTION_2_HEADER: HomeHeaderDto = {
  tag: 'Why ARM Exhaust',
  title: 'Custom, precise, warranted.',
};

export const DEFAULT_HOME_SECTION_3_HEADER: HomeHeaderDto = {
  tag: 'New Arrival',
  title: 'Fresh out of the workshop.',
  linkLabel: 'All Products ↗',
  linkHref: '/catalog',
};

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

      const valuePropCount = await this.prisma.homeValueProp.count();
      if (valuePropCount === 0) {
        await this.prisma.homeValueProp.createMany({
          data: DEFAULT_HOME_VALUE_PROPS,
        });
        this.logger.log('Seeded 4 default home value props to database');
      }

      const newArrivalCount = await this.prisma.homeNewArrival.count();
      if (newArrivalCount === 0) {
        await this.prisma.homeNewArrival.createMany({
          data: DEFAULT_HOME_NEW_ARRIVALS,
        });
        this.logger.log('Seeded 4 default home new arrivals to database');
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
  // Section 2: Why ARM Exhaust (Value Props)
  // ==========================================
  async getAllValueProps(): Promise<HomeValueProp[]> {
    await this.seedDefaultsIfEmpty();
    return this.prisma.homeValueProp.findMany({
      orderBy: { sort_order: 'asc' },
    });
  }

  async getActiveValueProps(): Promise<HomeValueProp[]> {
    await this.seedDefaultsIfEmpty();
    return this.prisma.homeValueProp.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      take: 4,
    });
  }

  async createValueProp(dto: CreateHomeValuePropDto): Promise<HomeValueProp> {
    const sortOrder = await this.resolveValuePropSortOrder(dto.sort_order);
    const data = this.normalizeValuePropPayload(dto, sortOrder);

    return this.prisma.homeValueProp.create({
      data,
    });
  }

  async updateValueProp(id: string, dto: UpdateHomeValuePropDto): Promise<HomeValueProp> {
    await this.ensureValuePropExists(id);
    const data = this.filterDefinedValues(this.normalizeValuePropUpdatePayload(dto));

    return this.prisma.homeValueProp.update({
      where: { id },
      data,
    });
  }

  async toggleValuePropStatus(id: string): Promise<HomeValueProp> {
    const existing = await this.ensureValuePropExists(id);
    return this.prisma.homeValueProp.update({
      where: { id },
      data: { is_active: !existing.is_active },
    });
  }

  async reorderValueProps(orderedIds: string[]): Promise<{ success: boolean; count: number }> {
    this.validateOrderedIds(orderedIds);

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.homeValueProp.update({
          where: { id },
          data: {
            sort_order: index,
            step_number: String(index + 1).padStart(2, '0'),
          },
        }),
      ),
    );

    return { success: true, count: orderedIds.length };
  }

  async deleteValueProp(id: string): Promise<HomeValueProp> {
    await this.ensureValuePropExists(id);
    return this.prisma.homeValueProp.delete({
      where: { id },
    });
  }

  // ==========================================
  // Section 3: New Arrivals (Featured Products)
  // ==========================================
  async getAllNewArrivals(): Promise<HomeNewArrival[]> {
    await this.seedDefaultsIfEmpty();
    return this.prisma.homeNewArrival.findMany({
      orderBy: { sort_order: 'asc' },
    });
  }

  async getActiveNewArrivals(): Promise<HomeNewArrival[]> {
    await this.seedDefaultsIfEmpty();
    return this.prisma.homeNewArrival.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      take: 4,
    });
  }

  async createNewArrival(dto: CreateHomeNewArrivalDto): Promise<HomeNewArrival> {
    const isActive = dto.is_active ?? true;
    if (isActive) {
      await this.validateNewArrivalActiveCap();
    }

    const sortOrder = await this.resolveNewArrivalSortOrder(dto.sort_order);
    const data = this.normalizeNewArrivalPayload(dto, sortOrder);

    return this.prisma.homeNewArrival.create({
      data,
    });
  }

  async updateNewArrival(id: string, dto: UpdateHomeNewArrivalDto): Promise<HomeNewArrival> {
    const existing = await this.ensureNewArrivalExists(id);
    if (dto.is_active === true && !existing.is_active) {
      await this.validateNewArrivalActiveCap();
    }

    const data = this.filterDefinedValues(this.normalizeNewArrivalUpdatePayload(dto));

    return this.prisma.homeNewArrival.update({
      where: { id },
      data,
    });
  }

  async toggleNewArrivalStatus(id: string): Promise<HomeNewArrival> {
    const existing = await this.ensureNewArrivalExists(id);
    if (!existing.is_active) {
      await this.validateNewArrivalActiveCap();
    }

    return this.prisma.homeNewArrival.update({
      where: { id },
      data: { is_active: !existing.is_active },
    });
  }

  async reorderNewArrivals(orderedIds: string[]): Promise<{ success: boolean; count: number }> {
    this.validateOrderedIds(orderedIds);

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.homeNewArrival.update({
          where: { id },
          data: { sort_order: index },
        }),
      ),
    );

    return { success: true, count: orderedIds.length };
  }

  async deleteNewArrival(id: string): Promise<HomeNewArrival> {
    await this.ensureNewArrivalExists(id);
    return this.prisma.homeNewArrival.delete({
      where: { id },
    });
  }

  // ==========================================
  // Section Headers (Section 2 & 3 via AppConfig)
  // ==========================================
  async getHomeHeaders(): Promise<{ section2: HomeHeaderDto; section3: HomeHeaderDto }> {
    const [sec2Config, sec3Config] = await Promise.all([
      this.prisma.appConfig.findUnique({ where: { key: 'home_section_2_header' } }),
      this.prisma.appConfig.findUnique({ where: { key: 'home_section_3_header' } }),
    ]);

    const section2 = this.parseHeaderConfig(sec2Config?.value, DEFAULT_HOME_SECTION_2_HEADER);
    const section3 = this.parseHeaderConfig(sec3Config?.value, DEFAULT_HOME_SECTION_3_HEADER);

    return { section2, section3 };
  }

  async updateHomeHeaders(dto: UpdateHomeHeadersDto): Promise<{ success: boolean }> {
    const operations: Promise<unknown>[] = [];

    if (dto.section2) {
      operations.push(
        this.prisma.appConfig.upsert({
          where: { key: 'home_section_2_header' },
          update: { value: JSON.stringify(dto.section2) },
          create: { key: 'home_section_2_header', value: JSON.stringify(dto.section2) },
        }),
      );
    }

    if (dto.section3) {
      operations.push(
        this.prisma.appConfig.upsert({
          where: { key: 'home_section_3_header' },
          update: { value: JSON.stringify(dto.section3) },
          create: { key: 'home_section_3_header', value: JSON.stringify(dto.section3) },
        }),
      );
    }

    if (operations.length > 0) {
      await Promise.all(operations);
    }

    return { success: true };
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

  private async ensureValuePropExists(id: string): Promise<HomeValueProp> {
    const item = await this.prisma.homeValueProp.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Pilar keunggulan dengan ID ${id} tidak ditemukan.`);
    }
    return item;
  }

  private async ensureNewArrivalExists(id: string): Promise<HomeNewArrival> {
    const item = await this.prisma.homeNewArrival.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Produk beranda dengan ID ${id} tidak ditemukan.`);
    }
    return item;
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

  private async resolveValuePropSortOrder(provided?: number): Promise<number> {
    if (typeof provided === 'number') {
      return provided;
    }
    const maxItem = await this.prisma.homeValueProp.findFirst({
      orderBy: { sort_order: 'desc' },
      select: { sort_order: true },
    });
    return maxItem ? maxItem.sort_order + 1 : 0;
  }

  private async resolveNewArrivalSortOrder(provided?: number): Promise<number> {
    if (typeof provided === 'number') {
      return provided;
    }
    const maxItem = await this.prisma.homeNewArrival.findFirst({
      orderBy: { sort_order: 'desc' },
      select: { sort_order: true },
    });
    return maxItem ? maxItem.sort_order + 1 : 0;
  }

  private async validateNewArrivalActiveCap(): Promise<void> {
    const activeCount = await this.prisma.homeNewArrival.count({
      where: { is_active: true },
    });
    if (activeCount >= 4) {
      throw new BadRequestException(
        'Maksimal 4 produk beranda yang dapat aktif bersamaan. Nonaktifkan salah satu produk terlebih dahulu.',
      );
    }
  }

  private normalizeSlidePayload(dto: any, sortOrder: number) {
    return {
      category: dto.category,
      tag: dto.tag,
      title: dto.title,
      strip_title: dto.strip_title ?? dto.stripTitle,
      href: dto.href,
      image_url: dto.image_url ?? dto.imageUrl ?? dto.image,
      image_mobile_url: this.normalizeOptionalImage(dto.image_mobile_url) ?? null,
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
      image_mobile_url: this.normalizeOptionalImage(dto.image_mobile_url),
      sort_order: dto.sort_order ?? dto.sortOrder,
      is_active: dto.is_active ?? dto.isActive,
    };
  }

  /**
   * Normalizes an optional image URL field:
   * `undefined` stays `undefined` (field untouched on update),
   * `null` / empty / whitespace-only strings become `null` (clears the image),
   * other strings are trimmed.
   */
  private normalizeOptionalImage(value: unknown): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
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

  private normalizeValuePropPayload(dto: CreateHomeValuePropDto, sortOrder: number) {
    return {
      step_number: dto.step_number ?? String(sortOrder + 1).padStart(2, '0'),
      title: dto.title,
      description: dto.description,
      sort_order: sortOrder,
      is_active: dto.is_active ?? true,
    };
  }

  private normalizeValuePropUpdatePayload(dto: UpdateHomeValuePropDto) {
    return {
      step_number: dto.step_number,
      title: dto.title,
      description: dto.description,
      sort_order: dto.sort_order,
      is_active: dto.is_active,
    };
  }

  private normalizeNewArrivalPayload(dto: CreateHomeNewArrivalDto, sortOrder: number) {
    return {
      product_id: dto.product_id,
      badge_text: dto.badge_text ?? null,
      name: dto.name,
      category_label: dto.category_label,
      inlet: dto.inlet ?? null,
      material: dto.material ?? null,
      price_display: dto.price_display,
      image_url: dto.image_url,
      href: dto.href,
      sort_order: sortOrder,
      is_active: dto.is_active ?? true,
    };
  }

  private normalizeNewArrivalUpdatePayload(dto: UpdateHomeNewArrivalDto) {
    return {
      product_id: dto.product_id,
      badge_text: dto.badge_text,
      name: dto.name,
      category_label: dto.category_label,
      inlet: dto.inlet,
      material: dto.material,
      price_display: dto.price_display,
      image_url: dto.image_url,
      href: dto.href,
      sort_order: dto.sort_order,
      is_active: dto.is_active,
    };
  }

  private parseHeaderConfig(raw: string | null | undefined, fallback: HomeHeaderDto): HomeHeaderDto {
    if (!raw) {
      return fallback;
    }
    try {
      return { ...fallback, ...JSON.parse(raw) };
    } catch (err: any) {
      this.logger.warn(`Failed to parse header config JSON: ${err?.message}`);
      return fallback;
    }
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
