'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartData, ChartConfig } from '@/lib/types';

interface AreaChartProps {
    data: ChartData[];
    config?: ChartConfig;
}

export function AreaChart({ data, config = {} }: AreaChartProps) {
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
            .style('fill', 'currentColor');

        svg.append('g')
            .call(d3.axisLeft(y).ticks(5))
            .selectAll('text')
            .attr('class', 'text-xs text-slate-500 dark:text-slate-400 font-medium')
            .style('fill', 'currentColor');

        // Remove axis lines
        svg.selectAll('.domain').remove();

        // Gradient for area
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'area-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', config.colors?.[0] || '#3b82f6')
            .attr('stop-opacity', 0.5);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', config.colors?.[0] || '#3b82f6')
            .attr('stop-opacity', 0.05);

        // Area
        const area = d3.area<ChartData>()
            .x(d => x(String(d.x)) || 0)
            .y0(height)
            .y1(d => y(d.y as number))
            .curve(d3.curveMonotoneX);

        // Add the area
        svg.append('path')
            .datum(data)
            .attr('fill', 'url(#area-gradient)')
            .attr('stroke', 'none')
            .attr('d', area)
            .attr('opacity', 0)
            .transition()
            .duration(1000)
            .attr('opacity', 1);

        // Add the line on top
        const line = d3.line<ChartData>()
            .x(d => x(String(d.x)) || 0)
            .y(d => y(d.y as number))
            .curve(d3.curveMonotoneX);

        const path = svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', config.colors?.[0] || '#3b82f6')
            .attr('stroke-width', 3)
            .attr('d', line);

        // Animate line
        const totalLength = path.node()?.getTotalLength() || 0;
        path.attr('stroke-dasharray', totalLength + ' ' + totalLength)
            .attr('stroke-dashoffset', totalLength)
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0);

        // Add dots
        svg.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(String(d.x)) || 0)
            .attr('cy', d => y(d.y as number))
            .attr('r', 0)
            .attr('fill', '#fff')
            .attr('stroke', config.colors?.[0] || '#3b82f6')
            .attr('stroke-width', 2)
            .transition()
            .delay((d, i) => i * 50 + 500)
            .duration(500)
            .attr('r', 4);

        // Interactive overlay
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
                // Find the corresponding visible dot
                const index = data.indexOf(d);
                const dots = svg.selectAll('.dot').nodes();
                if (dots[index]) {
                    d3.select(dots[index] as Element)
                        .transition()
                        .duration(200)
                        .attr('r', 6)
                        .attr('stroke-width', 3);
                }
            })
            .on('mouseout', function (event, d) {
                const index = data.indexOf(d);
                const dots = svg.selectAll('.dot').nodes();
                if (dots[index]) {
                    d3.select(dots[index] as Element)
                        .transition()
                        .duration(200)
                        .attr('r', 4)
                        .attr('stroke-width', 2);
                }
            });

    }, [data, config]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[200px] text-slate-500 dark:text-slate-400">
            <svg ref={svgRef} className="w-full h-full overflow-visible" />
        </div>
    );
}
