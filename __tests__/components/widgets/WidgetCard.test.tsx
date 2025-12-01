import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WidgetCard } from '@/app/components/widgets/WidgetCard';

// Mock exportUtils
jest.mock('@/lib/exportUtils', () => ({
    exportWidgetToPNG: jest.fn().mockResolvedValue(undefined),
}));

describe('WidgetCard', () => {
    const defaultProps = {
        title: 'Test Widget',
        children: <div>Widget Content</div>,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with title', () => {
        render(<WidgetCard {...defaultProps} />);
        expect(screen.getByText('Test Widget')).toBeInTheDocument();
    });

    it('renders children content', () => {
        render(<WidgetCard {...defaultProps} />);
        expect(screen.getByText('Widget Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(
            <WidgetCard {...defaultProps} className="custom-class" />
        );
        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders remove button when onRemove is provided', () => {
        const onRemove = jest.fn();
        render(<WidgetCard {...defaultProps} onRemove={onRemove} />);
        
        const removeButton = screen.getByLabelText('Remove widget');
        expect(removeButton).toBeInTheDocument();
    });

    it('calls onRemove when remove button is clicked', () => {
        const onRemove = jest.fn();
        render(<WidgetCard {...defaultProps} onRemove={onRemove} />);
        
        const removeButton = screen.getByLabelText('Remove widget');
        fireEvent.click(removeButton);
        
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('does not render remove button when onRemove is not provided', () => {
        render(<WidgetCard {...defaultProps} />);
        expect(screen.queryByLabelText('Remove widget')).not.toBeInTheDocument();
    });

    it('renders more options menu button', () => {
        render(<WidgetCard {...defaultProps} />);
        expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    it('opens menu when more options is clicked', () => {
        render(<WidgetCard {...defaultProps} widgetId="test-123" />);
        
        const menuButton = screen.getByLabelText('More options');
        fireEvent.click(menuButton);
        
        expect(screen.getByText('Export as PNG')).toBeInTheDocument();
    });

    it('sets data-widget-id attribute when widgetId is provided', () => {
        const { container } = render(
            <WidgetCard {...defaultProps} widgetId="widget-123" />
        );
        expect(container.firstChild).toHaveAttribute('data-widget-id', 'widget-123');
    });

    it('has correct base styling classes', () => {
        const { container } = render(<WidgetCard {...defaultProps} />);
        const card = container.firstChild as HTMLElement;
        
        expect(card).toHaveClass('bg-white');
        expect(card).toHaveClass('rounded-2xl');
        expect(card).toHaveClass('shadow-xl');
    });

    it('renders edit button in menu when onEdit is provided', () => {
        const onEdit = jest.fn();
        render(<WidgetCard {...defaultProps} onEdit={onEdit} widgetId="test" />);
        
        // Open menu
        fireEvent.click(screen.getByLabelText('More options'));
        
        expect(screen.getByText('Edit Widget')).toBeInTheDocument();
    });

    it('calls onEdit when edit button is clicked', () => {
        const onEdit = jest.fn();
        render(<WidgetCard {...defaultProps} onEdit={onEdit} widgetId="test" />);
        
        // Open menu
        fireEvent.click(screen.getByLabelText('More options'));
        
        // Click edit
        fireEvent.click(screen.getByText('Edit Widget'));
        
        expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('closes menu when clicking outside', () => {
        render(
            <div>
                <WidgetCard {...defaultProps} widgetId="test" />
                <div data-testid="outside">Outside</div>
            </div>
        );
        
        // Open menu
        fireEvent.click(screen.getByLabelText('More options'));
        expect(screen.getByText('Export as PNG')).toBeInTheDocument();
        
        // Click outside
        fireEvent.mouseDown(screen.getByTestId('outside'));
        
        // Menu should be closed
        expect(screen.queryByText('Export as PNG')).not.toBeInTheDocument();
    });
});
