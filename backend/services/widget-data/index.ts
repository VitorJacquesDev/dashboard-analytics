import { WidgetDataProviderRegistry } from './WidgetDataProviderRegistry';
import { MockWidgetDataProvider } from './providers/MockWidgetDataProvider';
import { PrismaDashboardWidgetDataProvider } from './providers/PrismaDashboardWidgetDataProvider';

export function createDefaultWidgetDataProviderRegistry(): WidgetDataProviderRegistry {
  return new WidgetDataProviderRegistry(
    [new PrismaDashboardWidgetDataProvider()],
    new MockWidgetDataProvider()
  );
}

export { WidgetDataProviderRegistry } from './WidgetDataProviderRegistry';
export type { WidgetDataProvider, WidgetDataProviderContext } from './types';

