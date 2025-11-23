'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartData, ChartConfig } from '@/lib/types';

interface LineChartProps {
    data: ChartData[];
    config?: ChartConfig;
}

export function LineChart({ data, config = {} }: LineChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!data || data.length === 0 || !svgRef.current || !containerRef.current) return;

        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        // Dimensions
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const margin = config.margin || { top: 20, right: 30, bottom: 30, left: 40 };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr('width', containerWidth)
            .attr('height', containerHeight)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scalePoint()
            .domain(data.map(d => String(d.x)))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.y as number) || 0])
            .nice()
            .range([height, 0]);

        // Axes
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        svg.append('g')
            .call(d3.axisLeft(y));

        // Line
        const line = d3.line<ChartData>()
            .x(d => x(String(d.x)) || 0)
            .y(d => y(d.y as number))
            .curve(d3.curveMonotoneX);

        // Add the line
        svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', config.colors?.[0] || '#3b82f6')
            .attr('stroke-width', 2)
            .attr('d', line);

        // Add dots
        svg.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(String(d.x)) || 0)
            .attr('cy', d => y(d.y as number))
            .attr('r', 4)
            .attr('fill', config.colors?.[0] || '#3b82f6')
            .on('mouseover', function (event, d) {
                d3.select(this).attr('r', 6);
                // Tooltip logic could go here
            })
            .on('mouseout', function (event, d) {
                d3.select(this).attr('r', 4);
            });

    }, [data, config]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[200px]">
            <svg ref={svgRef} className="w-full h-full" />
        </div>
    );
}
