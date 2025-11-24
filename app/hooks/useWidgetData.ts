import { useState, useEffect } from 'react';
import { ChartData, ActiveFilter } from '@/lib/types';

interface UseWidgetDataResult {
    data: ChartData[];
    isLoading: boolean;
    error: string | null;
}

export function useWidgetData(widgetId: string, dataSource: string, config: any = {}, filters: ActiveFilter[] = []): UseWidgetDataResult {
    const [data, setData] = useState<ChartData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Serialize filters
                const filterParams = JSON.stringify(filters);

                // In a real scenario, we might pass filters as query params
                const params = new URLSearchParams({
                    dataSource,
                    filters: filterParams,
                    ...config
                });

                const response = await fetch(`/api/widgets/${widgetId}/data?${params.toString()}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.statusText}`);
                }

                const result = await response.json();

                if (isMounted) {
                    setData(result);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || 'An error occurred');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        if (widgetId) {
            fetchData();
        }

        return () => {
            isMounted = false;
        };
    }, [widgetId, dataSource, JSON.stringify(config), JSON.stringify(filters)]);

    return { data, isLoading, error };
}
