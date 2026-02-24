import type { PrismaClient } from '@prisma/client';
import type { Filter, Widget } from '@/lib/types';

export interface WidgetDataProviderContext {
  prisma: PrismaClient;
  widget: Widget;
  filters?: Filter[];
}

export interface WidgetDataProvider {
  readonly name: string;
  canHandle(widget: Widget): boolean;
  getData(context: WidgetDataProviderContext): Promise<any[]>;
}

