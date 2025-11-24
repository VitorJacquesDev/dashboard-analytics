declare module 'react-grid-layout' {
    import * as React from 'react';

    export interface Layout {
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
        minW?: number;
        maxW?: number;
        minH?: number;
        maxH?: number;
        static?: boolean;
        isDraggable?: boolean;
        isResizable?: boolean;
        resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
        isBounded?: boolean;
    }

    export interface ResponsiveProps {
        className?: string;
        style?: React.CSSProperties;
        width?: number;
        autoSize?: boolean;
        cols?: { [key: string]: number };
        draggableCancel?: string;
        draggableHandle?: string;
        verticalCompact?: boolean;
        compactType?: 'vertical' | 'horizontal' | null;
        layout?: Layout[];
        layouts?: { [key: string]: Layout[] };
        margin?: [number, number] | { [key: string]: [number, number] };
        containerPadding?: [number, number] | { [key: string]: [number, number] };
        rowHeight?: number;
        maxRows?: number;
        isDraggable?: boolean;
        isResizable?: boolean;
        isBounded?: boolean;
        useCSSTransforms?: boolean;
        transformScale?: number;
        droppingItem?: { i: string; w: number; h: number };
        isDroppable?: boolean;
        preventCollision?: boolean;
        onLayoutChange?: (layout: Layout[], layouts: { [key: string]: Layout[] }) => void;
        onDragStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
        onDrag?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
        onDragStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
        onResizeStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
        onResize?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
        onResizeStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
        onDrop?: (layout: Layout[], item: Layout, e: Event) => void;
        breakpoints?: { [key: string]: number };
        children?: React.ReactNode;
    }

    export class Responsive extends React.Component<ResponsiveProps, any> { }

    export interface WidthProviderProps {
        measureBeforeMount?: boolean;
        className?: string;
        style?: React.CSSProperties;
    }

    export function WidthProvider<P>(component: React.ComponentType<P>): React.ComponentType<P & WidthProviderProps>;

    export default class ReactGridLayout extends React.Component<any, any> { }
}
