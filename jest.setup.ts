import '@testing-library/jest-dom';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Helper to create chainable mock
const createChainableMock = () => {
    const mock: Record<string, jest.Mock> = {};
    const methods = [
        'select', 'selectAll', 'append', 'attr', 'style', 'call', 'remove',
        'data', 'enter', 'exit', 'on', 'transition', 'duration', 'delay',
        'text', 'html', 'datum', 'each', 'filter', 'sort', 'order',
        'raise', 'lower', 'classed', 'property', 'dispatch', 'merge',
        'attrTween', 'styleTween', 'tween', 'ease', 'tickSize', 'tickFormat',
        'ticks', 'tickSizeOuter', 'tickSizeInner', 'tickValues', 'tickPadding'
    ];
    methods.forEach(method => {
        mock[method] = jest.fn(() => mock);
    });
    // Special handling for node() to return SVG element mock
    mock.node = jest.fn(() => ({
        getTotalLength: jest.fn(() => 100),
        getBoundingClientRect: jest.fn(() => ({ width: 100, height: 100 })),
    }));
    return mock;
};

// Mock D3
jest.mock('d3', () => {
    const chainable = createChainableMock();
    
    return {
        select: jest.fn(() => chainable),
        selectAll: jest.fn(() => chainable),
        
        scalePoint: jest.fn(() => {
            const scale: any = jest.fn((val) => 0);
            scale.domain = jest.fn().mockReturnValue(scale);
            scale.range = jest.fn().mockReturnValue(scale);
            scale.padding = jest.fn().mockReturnValue(scale);
            scale.bandwidth = jest.fn().mockReturnValue(10);
            return scale;
        }),
        
        scaleLinear: jest.fn(() => {
            const scale: any = jest.fn((val) => 0);
            scale.domain = jest.fn().mockReturnValue(scale);
            scale.range = jest.fn().mockReturnValue(scale);
            scale.nice = jest.fn().mockReturnValue(scale);
            scale.ticks = jest.fn().mockReturnValue([0, 25, 50, 75, 100]);
            return scale;
        }),
        
        scaleBand: jest.fn(() => {
            const scale: any = jest.fn((val) => 0);
            scale.domain = jest.fn().mockReturnValue(scale);
            scale.range = jest.fn().mockReturnValue(scale);
            scale.padding = jest.fn().mockReturnValue(scale);
            scale.paddingInner = jest.fn().mockReturnValue(scale);
            scale.paddingOuter = jest.fn().mockReturnValue(scale);
            scale.bandwidth = jest.fn().mockReturnValue(10);
            return scale;
        }),
        
        scaleOrdinal: jest.fn(() => {
            const scale: any = jest.fn(() => '#6366f1');
            scale.domain = jest.fn().mockReturnValue(scale);
            scale.range = jest.fn().mockReturnValue(scale);
            return scale;
        }),
        
        scaleSequential: jest.fn(() => {
            const scale: any = jest.fn(() => '#6366f1');
            scale.domain = jest.fn().mockReturnValue(scale);
            scale.interpolator = jest.fn().mockReturnValue(scale);
            return scale;
        }),
        
        axisBottom: jest.fn(() => {
            const axis: any = jest.fn();
            axis.tickSizeOuter = jest.fn().mockReturnValue(axis);
            axis.tickSize = jest.fn().mockReturnValue(axis);
            axis.tickFormat = jest.fn().mockReturnValue(axis);
            axis.ticks = jest.fn().mockReturnValue(axis);
            return axis;
        }),
        
        axisLeft: jest.fn(() => {
            const axis: any = jest.fn();
            axis.tickSizeOuter = jest.fn().mockReturnValue(axis);
            axis.tickSize = jest.fn().mockReturnValue(axis);
            axis.tickFormat = jest.fn().mockReturnValue(axis);
            axis.ticks = jest.fn().mockReturnValue(axis);
            return axis;
        }),
        
        line: jest.fn(() => {
            const lineFn: any = jest.fn(() => 'M0,0');
            lineFn.x = jest.fn().mockReturnValue(lineFn);
            lineFn.y = jest.fn().mockReturnValue(lineFn);
            lineFn.curve = jest.fn().mockReturnValue(lineFn);
            lineFn.defined = jest.fn().mockReturnValue(lineFn);
            return lineFn;
        }),
        
        area: jest.fn(() => {
            const areaFn: any = jest.fn(() => 'M0,0');
            areaFn.x = jest.fn().mockReturnValue(areaFn);
            areaFn.y0 = jest.fn().mockReturnValue(areaFn);
            areaFn.y1 = jest.fn().mockReturnValue(areaFn);
            areaFn.curve = jest.fn().mockReturnValue(areaFn);
            areaFn.defined = jest.fn().mockReturnValue(areaFn);
            return areaFn;
        }),
        
        pie: jest.fn(() => {
            const pieFn: any = jest.fn(() => []);
            pieFn.value = jest.fn().mockReturnValue(pieFn);
            pieFn.sort = jest.fn().mockReturnValue(pieFn);
            pieFn.padAngle = jest.fn().mockReturnValue(pieFn);
            return pieFn;
        }),
        
        arc: jest.fn(() => {
            const arcFn: any = jest.fn(() => 'M0,0');
            arcFn.innerRadius = jest.fn().mockReturnValue(arcFn);
            arcFn.outerRadius = jest.fn().mockReturnValue(arcFn);
            arcFn.cornerRadius = jest.fn().mockReturnValue(arcFn);
            arcFn.centroid = jest.fn(() => [0, 0]);
            return arcFn;
        }),
        
        curveMonotoneX: jest.fn(),
        curveBasis: jest.fn(),
        curveLinear: jest.fn(),
        
        max: jest.fn((data: any[], accessor?: (d: any) => number) => {
            if (!data || data.length === 0) return 0;
            if (accessor) {
                return Math.max(...data.map(accessor));
            }
            return Math.max(...data);
        }),
        
        min: jest.fn((data: any[], accessor?: (d: any) => number) => {
            if (!data || data.length === 0) return 0;
            if (accessor) {
                return Math.min(...data.map(accessor));
            }
            return Math.min(...data);
        }),
        
        sum: jest.fn((data: any[], accessor?: (d: any) => number) => {
            if (!data || data.length === 0) return 0;
            if (accessor) {
                return data.reduce((sum, d) => sum + accessor(d), 0);
            }
            return data.reduce((sum, d) => sum + d, 0);
        }),
        
        extent: jest.fn((data: any[], accessor?: (d: any) => number) => {
            if (!data || data.length === 0) return [0, 0];
            if (accessor) {
                const values = data.map(accessor);
                return [Math.min(...values), Math.max(...values)];
            }
            return [Math.min(...data), Math.max(...data)];
        }),
        
        interpolate: jest.fn(() => jest.fn(() => 0)),
        interpolateInferno: jest.fn(() => '#000'),
        
        schemeCategory10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
    };
});
