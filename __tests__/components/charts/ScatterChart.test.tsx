import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScatterChart } from '@/app/components/charts/ScatterChart';
import { ChartData } from '@/lib/types';

describe('ScatterChart', () => {
    const mockData: ChartData[] = [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
        { x: 50, y: 60 },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { container } = render(<ScatterChart data={mockData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with empty data', () => {
        const { container } = render(<ScatterChart data={[]} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with custom config', () => {
        const { container } = render(<ScatterChart data={mockData} config={{ colors: ['#00ff00'] }} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('has correct container classes', () => {
        const { container } = render(<ScatterChart data={mockData} />);
        expect(container.firstChild).toHaveClass('w-full', 'h-full');
    });
});
