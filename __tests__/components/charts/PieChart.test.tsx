import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PieChart } from '@/app/components/charts/PieChart';
import { ChartData } from '@/lib/types';

describe('PieChart', () => {
    const mockData: ChartData[] = [
        { x: 'Category A', y: 30 },
        { x: 'Category B', y: 50 },
        { x: 'Category C', y: 20 },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { container } = render(<PieChart data={mockData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with empty data', () => {
        const { container } = render(<PieChart data={[]} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with custom colors', () => {
        const config = { colors: ['#ff0000', '#00ff00', '#0000ff'] };
        const { container } = render(<PieChart data={mockData} config={config} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('has correct container structure', () => {
        const { container } = render(<PieChart data={mockData} />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveClass('w-full', 'h-full');
    });

    it('handles single slice', () => {
        const singleData: ChartData[] = [{ x: 'Only', y: 100 }];
        const { container } = render(<PieChart data={singleData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('handles many slices', () => {
        const manySlices: ChartData[] = Array.from({ length: 10 }, (_, i) => ({
            x: `Slice ${i}`,
            y: Math.random() * 100,
        }));
        const { container } = render(<PieChart data={manySlices} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('handles equal values', () => {
        const equalData: ChartData[] = [
            { x: 'A', y: 33 },
            { x: 'B', y: 33 },
            { x: 'C', y: 34 },
        ];
        const { container } = render(<PieChart data={equalData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('handles very small values', () => {
        const smallData: ChartData[] = [
            { x: 'Large', y: 99 },
            { x: 'Tiny', y: 1 },
        ];
        const { container } = render(<PieChart data={smallData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});
