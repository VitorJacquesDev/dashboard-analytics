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

        const margin = config.margin || { top: 20, right: 30, bottom: 40, left: 50 };
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
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.y as number) || 0])
            .nice()
            .range([height, 0]);

        // Grid lines
        const makeYGridlines = () => d3.axisLeft(y).ticks(5);

        svg.append('g')
            .attr('class', 'grid')
            .attr('opacity', 0.1)
            .call(makeYGridlines()
                .tickSize(-width)
                .tickFormat(() => '')
            )
            .style('stroke-dasharray', '3,3')
            .selectAll('line')
            .style('stroke', 'currentColor')
            .style('stroke-width', '1px');

        // Axes
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)')
            .attr('class', 'text-xs text-slate-500 dark:text-slate-400 font-medium')
            .style('fill', 'currentColor'); // Ensure fill uses the class color

        svg.append('g')
            .call(d3.axisLeft(y).ticks(5))
            .selectAll('text')
            .attr('class', 'text-xs text-slate-500 dark:text-slate-400 font-medium')
            .style('fill', 'currentColor');

        // Remove axis lines for cleaner look
        svg.selectAll('.domain').remove();

        // Line
        const line = d3.line<ChartData>()
            .x(d => x(String(d.x)) || 0)
            .y(d => y(d.y as number))
            .curve(d3.curveMonotoneX);

        // Add drop shadow filter
        const defs = svg.append('defs');
        const filter = defs.append('filter')
            .attr('id', 'drop-shadow')
            .attr('height', '130%');

        filter.append('feGaussianBlur')
            .attr('in', 'SourceAlpha')
            .attr('stdDeviation', 3)
            .attr('result', 'blur');

        filter.append('feOffset')
            .attr('in', 'blur')
            .attr('dx', 0)
            .attr('dy', 3)
            .attr('result', 'offsetBlur');

        filter.append('feFlood')
            .attr('flood-color', config.colors?.[0] || '#6366f1')
            .attr('flood-opacity', '0.3')
            .attr('result', 'offsetColor');

        filter.append('feComposite')
            .attr('in', 'offsetColor')
            .attr('in2', 'offsetBlur')
            .attr('operator', 'in')
            .attr('result', 'offsetBlur');

        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'offsetBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Add the line with shadow
        svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', config.colors?.[0] || '#6366f1')
            .attr('stroke-width', 3)
            .attr('d', line)
            .style('filter', 'url(#drop-shadow)');

        // Add dots
        svg.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'dot transition-all duration-200')
            .attr('cx', d => x(String(d.x)) || 0)
            .attr('cy', d => y(d.y as number))
            .attr('r', 0) // Animate in
            .attr('fill', '#fff')
            .attr('stroke', config.colors?.[0] || '#6366f1')
            .attr('stroke-width', 2)
            .transition()
            .duration(1000)
            .attr('r', 4);

        // Interactive dots
        svg.selectAll('.dot-overlay')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'dot-overlay cursor-pointer')
            .attr('cx', d => x(String(d.x)) || 0)
            .attr('cy', d => y(d.y as number))
            .attr('r', 10)
            .attr('fill', 'transparent')
            .on('mouseover', function (event, d) {
                d3.select(this.previousSibling as Element)
                    .transition()
                    .duration(200)
                    .attr('r', 6)
                    .attr('stroke-width', 3);
            })
            .on('mouseout', function (event, d) {
                d3.select(this.previousSibling as Element)
                    .transition()
                    .duration(200)
                    .attr('r', 4)
                    .attr('stroke-width', 2);
            });

    }, [data, config]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[200px] text-slate-500 dark:text-slate-400">
            <svg ref={svgRef} className="w-full h-full overflow-visible" />
        </div>
    );
}
