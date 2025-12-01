import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricWidget } from '@/app/components/widgets/MetricWidget';
import { ChartData } from '@/lib/types';

describe('MetricWidget', () => {
    const mockData: ChartData[] = [
        { x: 'current', y: 1500 },
    ];

    it('renders without crashing', () => {
        const { container } = render(<MetricWidget data={mockData} title="Revenue" />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('displays the metric value', () => {
        render(<MetricWidget data={mockData} title="Revenue" />);
        // The component displays the formatted value (locale-dependent)
        expect(screen.getByText(/1[.,]?500/)).toBeInTheDocument();
    });

    it('displays the label from data', () => {
        render(<MetricWidget data={mockData} title="Revenue" />);
        expect(screen.getByText('current')).toBeInTheDocument();
    });

    it('handles empty data', () => {
        const { container } = render(<MetricWidget data={[]} title="Empty Metric" />);
        expect(container.firstChild).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles zero value', () => {
        const zeroData: ChartData[] = [{ x: 'current', y: 0 }];
        render(<MetricWidget data={zeroData} title="Zero Metric" />);
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles large numbers', () => {
        const largeData: ChartData[] = [{ x: 'current', y: 1000000 }];
        const { container } = render(<MetricWidget data={largeData} title="Large Number" />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('handles decimal values', () => {
        const decimalData: ChartData[] = [{ x: 'current', y: 99.99 }];
        const { container } = render(<MetricWidget data={decimalData} title="Decimal" />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('handles negative values', () => {
        const negativeData: ChartData[] = [{ x: 'current', y: -500 }];
        render(<MetricWidget data={negativeData} title="Negative" />);
        expect(screen.getByText('-500')).toBeInTheDocument();
    });

    it('renders with correct structure', () => {
        const { container } = render(<MetricWidget data={mockData} title="Test" />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('shows trend when multiple data points exist', () => {
        const trendData: ChartData[] = [
            { x: 'previous', y: 100 },
            { x: 'current', y: 150 },
        ];
        render(<MetricWidget data={trendData} title="Trend" />);
        // 50% increase
        expect(screen.getByText('50.0%')).toBeInTheDocument();
    });
});
