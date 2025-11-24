'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartData, ChartConfig } from '@/lib/types';

interface BarChartProps {
    data: ChartData[];
    config?: ChartConfig;
}

export function BarChart({ data, config = {} }: BarChartProps) {
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
        const x = d3.scaleBand()
            .domain(data.map(d => String(d.x)))
            .range([0, width])
            .padding(0.3);

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
            .call(d3.axisBottom(x))
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

        // Gradient for bars
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'bar-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', config.colors?.[0] || '#6366f1')
            .attr('stop-opacity', 1);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', config.colors?.[0] || '#6366f1')
            .attr('stop-opacity', 0.6);

        // Bars
        svg.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar transition-all duration-300')
            .attr('x', d => x(String(d.x)) || 0)
            .attr('y', height) // Start from bottom for animation
            .attr('width', x.bandwidth())
            .attr('height', 0) // Start with 0 height
            .attr('fill', 'url(#bar-gradient)')
            .attr('rx', 4) // Rounded corners top
            .attr('ry', 4)
            .on('mouseover', function () {
                d3.select(this)
                    .attr('opacity', 0.8)
                    .attr('filter', 'brightness(1.1)');
            })
            .on('mouseout', function () {
                d3.select(this)
                    .attr('opacity', 1)
                    .attr('filter', 'none');
            })
            .transition()
            .duration(800)
            .delay((d, i) => i * 50)
            .attr('y', d => y(d.y as number))
            .attr('height', d => height - y(d.y as number));

    }, [data, config]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[200px] text-slate-500 dark:text-slate-400">
            <svg ref={svgRef} className="w-full h-full overflow-visible" />
        </div>
    );
}
