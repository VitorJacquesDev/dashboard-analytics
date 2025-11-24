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
            .range(config.colors || d3.schemeCategory10);

        // Pie generator
        const pie = d3.pie<ChartData>()
            .value(d => d.y as number)
            .sort(null);

        // Arc generator
        const arc = d3.arc<d3.PieArcDatum<ChartData>>()
            .innerRadius(0)
            .outerRadius(radius);

        const labelArc = d3.arc<d3.PieArcDatum<ChartData>>()
            .innerRadius(radius * 0.6)
            .outerRadius(radius * 0.6);

        // Segments
        const arcs = svg.selectAll('arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('d', arc as any)
            .attr('fill', d => color(String(d.data.x)) as string)
            .attr('stroke', 'white')
            .style('stroke-width', '2px')
            .style('opacity', 0.8)
            .on('mouseover', function () {
                d3.select(this).style('opacity', 1);
            })
            .on('mouseout', function () {
                d3.select(this).style('opacity', 0.8);
            });

        // Labels
        if (config.showLegend !== false) {
            arcs.append('text')
                .attr('transform', d => `translate(${labelArc.centroid(d)})`)
                .attr('text-anchor', 'middle')
                .text(d => String(d.data.x))
                .style('fill', 'white')
                .style('font-size', '12px')
                .style('pointer-events', 'none');
        }

    }, [data, config]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[200px]">
            <svg ref={svgRef} className="w-full h-full" />
        </div>
    );
}
