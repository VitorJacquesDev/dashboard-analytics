'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartData, ChartConfig } from '@/lib/types';

interface PieChartProps {
    data: ChartData[];
    config?: ChartConfig;
}

export function PieChart({ data, config = {} }: PieChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!data || data.length === 0 || !svgRef.current || !containerRef.current) return;

        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        // Dimensions
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const radius = Math.min(containerWidth, containerHeight) / 2 - 20;

        const svg = d3.select(svgRef.current)
            .attr('width', containerWidth)
            .attr('height', containerHeight)
            .append('g')
            .attr('transform', `translate(${containerWidth / 2},${containerHeight / 2})`);

        // Color scale
        const color = d3.scaleOrdinal()
            .domain(data.map(d => String(d.x)))
            .range(config.colors || ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4', '#10b981']);

        // Pie generator
        const pie = d3.pie<ChartData>()
            .value(d => d.y as number)
            .sort(null)
            .padAngle(0.03);

        // Arc generator
        const arc = d3.arc<d3.PieArcDatum<ChartData>>()
            .innerRadius(radius * 0.6) // Donut chart
            .outerRadius(radius)
            .cornerRadius(6);

        const arcHover = d3.arc<d3.PieArcDatum<ChartData>>()
            .innerRadius(radius * 0.6)
            .outerRadius(radius + 5)
            .cornerRadius(6);

        // Segments
        const arcs = svg.selectAll('arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('d', arc as any)
            .attr('fill', d => color(String(d.data.x)) as string)
            .attr('stroke', 'none')
            .style('opacity', 0) // Start invisible
            .transition()
            .duration(800)
            .delay((d, i) => i * 100)
            .style('opacity', 1)
            .attrTween('d', function (d) {
                const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
                return function (t) {
                    d.endAngle = i(t);
                    return arc(d as any) || '';
                };
            });

        // Interactive paths
        svg.selectAll('path')
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', arcHover as any)
                    .style('opacity', 0.9)
                    .style('filter', 'drop-shadow(0px 4px 8px rgba(0,0,0,0.2))');
            })
            .on('mouseout', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', arc as any)
                    .style('opacity', 1)
                    .style('filter', 'none');
            });

        // Center Text
        const total = d3.sum(data, d => d.y as number);

        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.5em')
            .text('Total')
            .attr('class', 'text-sm fill-slate-500 dark:fill-slate-400 font-medium');

        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1em')
            .text(total.toLocaleString())
            .attr('class', 'text-xl font-bold fill-slate-900 dark:fill-white');

    }, [data, config]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[200px]">
            <svg ref={svgRef} className="w-full h-full overflow-visible" />
        </div>
    );
}
