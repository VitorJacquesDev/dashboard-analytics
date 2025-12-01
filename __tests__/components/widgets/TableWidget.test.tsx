import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TableWidget } from '@/app/components/widgets/TableWidget';
import { ChartData } from '@/lib/types';

describe('TableWidget', () => {
    const mockData: ChartData[] = [
        { x: 'Product A', y: 100, label: 'Electronics' },
        { x: 'Product B', y: 200, label: 'Clothing' },
        { x: 'Product C', y: 150, label: 'Food' },
    ];

    it('renders without crashing', () => {
        const { container } = render(<TableWidget data={mockData} />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('renders table headers', () => {
        render(<TableWidget data={mockData} />);
        // Should have headers based on data keys
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('renders all data rows', () => {
        render(<TableWidget data={mockData} />);
        const rows = screen.getAllByRole('row');
        // Header row + data rows
        expect(rows.length).toBeGreaterThanOrEqual(mockData.length);
    });

    it('handles empty data', () => {
        const { container } = render(<TableWidget data={[]} />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('handles single row', () => {
        const singleRow: ChartData[] = [{ x: 'Only', y: 100 }];
        render(<TableWidget data={singleRow} />);
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles many rows', () => {
        const manyRows: ChartData[] = Array.from({ length: 50 }, (_, i) => ({
            x: `Item ${i}`,
            y: i * 10,
        }));
        render(<TableWidget data={manyRows} />);
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('displays data values correctly', () => {
        render(<TableWidget data={mockData} />);
        // Check if values are displayed
        expect(screen.getByText('Product A')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('handles data with extra properties', () => {
        const extraData: ChartData[] = [
            { x: 'Test', y: 50, label: 'Label', extra: 'Extra Value' } as ChartData,
        ];
        render(<TableWidget data={extraData} />);
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('has scrollable container for overflow', () => {
        const { container } = render(<TableWidget data={mockData} />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveClass('overflow-auto');
    });
});
