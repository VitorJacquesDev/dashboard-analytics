import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LineChart } from '@/app/components/charts/LineChart';
import { ChartData } from '@/lib/types';

describe('LineChart', () => {
    const mockData: ChartData[] = [
        { x: 'Jan', y: 100 },
        { x: 'Feb', y: 200 },
        { x: 'Mar', y: 150 },
        { x: 'Apr', y: 300 },
        { x: 'May', y: 250 },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { container } = render(<LineChart data={mockData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with empty data', () => {
        const { container } = render(<LineChart data={[]} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with custom config', () => {
        const config = {
            colors: ['#ff0000'],
            margin: { top: 10, right: 10, bottom: 10, left: 10 },
        };
        const { container } = render(<LineChart data={mockData} config={config} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('has correct container classes', () => {
        const { container } = render(<LineChart data={mockData} />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveClass('w-full', 'h-full', 'min-h-[200px]');
    });

    it('renders SVG with correct classes', () => {
        const { container } = render(<LineChart data={mockData} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveClass('w-full', 'h-full', 'overflow-visible');
    });

    it('handles single data point', () => {
        const singleData: ChartData[] = [{ x: 'Jan', y: 100 }];
        const { container } = render(<LineChart data={singleData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('handles large dataset', () => {
        const largeData: ChartData[] = Array.from({ length: 100 }, (_, i) => ({
            x: `Point ${i}`,
            y: Math.random() * 1000,
        }));
        const { container } = render(<LineChart data={largeData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('handles negative values', () => {
        const negativeData: ChartData[] = [
            { x: 'A', y: -50 },
            { x: 'B', y: 100 },
            { x: 'C', y: -25 },
        ];
        const { container } = render(<LineChart data={negativeData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('handles zero values', () => {
        const zeroData: ChartData[] = [
            { x: 'A', y: 0 },
            { x: 'B', y: 0 },
            { x: 'C', y: 0 },
        ];
        const { container } = render(<LineChart data={zeroData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});
