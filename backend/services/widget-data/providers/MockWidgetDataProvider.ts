import { WidgetType } from '@prisma/client';
import type { WidgetDataProvider, WidgetDataProviderContext } from '../types';

export class MockWidgetDataProvider implements WidgetDataProvider {
  readonly name = 'mock';

  canHandle(): boolean {
    return true;
  }

  async getData({ widget }: WidgetDataProviderContext): Promise<any[]> {
    let data: any[] = [];

    switch (widget.type) {
      case WidgetType.PIE_CHART:
        data = [
          { x: 'Direct', y: Math.floor(Math.random() * 50) + 10 },
          { x: 'Social', y: Math.floor(Math.random() * 40) + 10 },
          { x: 'Organic', y: Math.floor(Math.random() * 60) + 20 },
          { x: 'Referral', y: Math.floor(Math.random() * 30) + 5 },
        ];
        break;

      case WidgetType.SCATTER_CHART:
        data = Array.from({ length: 20 }, () => ({
          x: Math.floor(Math.random() * 100),
          y: Math.floor(Math.random() * 100),
          label: 'Point',
        }));
        break;

      case WidgetType.HEATMAP: {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const times = ['Morning', 'Afternoon', 'Evening'];

        for (const day of days) {
          for (const time of times) {
            data.push({
              x: day,
              label: time,
              y: Math.floor(Math.random() * 100),
            });
          }
        }
        break;
      }

      case WidgetType.TABLE:
        data = Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
          value: Math.floor(Math.random() * 1000),
          status: Math.random() > 0.5 ? 'Active' : 'Inactive',
        }));
        break;

      case WidgetType.METRIC:
        data = [
          {
            x: 'Total Revenue',
            y: Math.floor(Math.random() * 50000) + 10000,
          },
        ];
        break;

      default:
        data = Array.from({ length: 7 }, (_, i) => ({
          x: `Day ${i + 1}`,
          y: Math.floor(Math.random() * 100),
        }));
    }

    return data;
  }
}

