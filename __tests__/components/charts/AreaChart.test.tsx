import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AreaChart } from '@/app/components/charts/AreaChart';
import { ChartData } from '@/lib/types';

describe('AreaChart', () => {
    const mockData: ChartData[] = [
        { x: 'Jan', y: 100 },
        { x: 'Feb', y: 200 },
        { x: 'Mar', y: 150 },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { container } = render(<AreaChart data={mockData} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with empty data', () => {
        const { container } = render(<AreaChart data={[]} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with custom config', () => {
        const { container } = render(<AreaChart data={mockData} config={{ colors: ['#ff0000'] }} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('has correct container classes', () => {
        const { container } = render(<AreaChart data={mockData} />);
        expect(container.firstChild).toHaveClass('w-full', 'h-full');
    });
});
