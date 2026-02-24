import type { WidgetDataProvider, WidgetDataProviderContext } from './types';

export class WidgetDataProviderRegistry {
  constructor(
    private readonly providers: WidgetDataProvider[],
    private readonly fallbackProvider: WidgetDataProvider
  ) {}

  resolve(context: WidgetDataProviderContext): WidgetDataProvider {
    return this.providers.find((provider) => provider.canHandle(context.widget)) ?? this.fallbackProvider;
  }

  async getData(context: WidgetDataProviderContext): Promise<any[]> {
    const provider = this.resolve(context);
    return provider.getData(context);
  }
}

