import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BarChart } from '@/app/components/charts/BarChart';
import { ChartData } from '@/lib/types';

describe('BarChart', () => {
    const mockData: ChartData[] = [
        { x: 'Product A', y: 100 },
        { x: 'Product B', y: 200 },
        { x: 'Product C', y: 150 },
        { x: 'Product D', y: 300 },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { container } = render(<BarChart data={mockData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with empty data', () => {
        const { container } = render(<BarChart data={[]} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with custom colors', () => {
        const config = { colors: ['#ff0000', '#00ff00', '#0000ff'] };
        const { container } = render(<BarChart data={mockData} config={config} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('has correct container structure', () => {
        const { container } = render(<BarChart data={mockData} />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveClass('w-full', 'h-full');
    });

    it('handles single bar', () => {
        const singleData: ChartData[] = [{ x: 'Only', y: 500 }];
        const { container } = render(<BarChart data={singleData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('handles many bars', () => {
        const manyBars: ChartData[] = Array.from({ length: 20 }, (_, i) => ({
            x: `Item ${i}`,
            y: Math.random() * 100,
        }));
        const { container } = render(<BarChart data={manyBars} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('handles zero values', () => {
        const zeroData: ChartData[] = [
            { x: 'A', y: 0 },
            { x: 'B', y: 50 },
            { x: 'C', y: 0 },
        ];
        const { container } = render(<BarChart data={zeroData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});
