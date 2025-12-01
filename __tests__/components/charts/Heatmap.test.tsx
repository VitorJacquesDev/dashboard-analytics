import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Heatmap } from '@/app/components/charts/Heatmap';
import { ChartData } from '@/lib/types';

describe('Heatmap', () => {
    const mockData: ChartData[] = [
        { x: 'Mon', y: 10, label: '9AM' },
        { x: 'Tue', y: 20, label: '10AM' },
        { x: 'Wed', y: 30, label: '11AM' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { container } = render(<Heatmap data={mockData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with empty data', () => {
        const { container } = render(<Heatmap data={[]} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with custom config', () => {
        const { container } = render(<Heatmap data={mockData} config={{ colors: ['#0000ff'] }} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('has correct container classes', () => {
        const { container } = render(<Heatmap data={mockData} />);
        expect(container.firstChild).toHaveClass('w-full', 'h-full');
    });
});
