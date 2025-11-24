'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartData, ChartConfig } from '@/lib/types';

interface HeatmapProps {
    data: ChartData[];
    config?: ChartConfig;
}

export function Heatmap({ data, config = {} }: HeatmapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!data || data.length === 0 || !svgRef.current || !containerRef.current) return;

        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        // Dimensions
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const margin = config.margin || { top: 20, right: 30, bottom: 50, left: 50 };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr('width', containerWidth)
            .attr('height', containerHeight)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Groups and Vars
        // Assuming x is the column (variable 1) and label is the row (variable 2)
        // If label is missing, we might need to infer or fail.
        // For robustness, let's map data.
        const myGroups = Array.from(new Set(data.map(d => String(d.x))));
        const myVars = Array.from(new Set(data.map(d => d.label || 'Row 1')));

        // Scales
        const x = d3.scaleBand()
            .range([0, width])
            .domain(myGroups)
            .padding(0.05);

        const y = d3.scaleBand()
            .range([height, 0])
            .domain(myVars)
            .padding(0.05);

        const myColor = d3.scaleSequential()
            .interpolator(d3.interpolateInferno)
            .domain([0, d3.max(data, d => d.y as number) || 100]);

        // Axes
        svg.append('g')
            .style('font-size', 12)
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).tickSize(0))
            .select('.domain').remove();

        svg.append('g')
            .style('font-size', 12)
            .call(d3.axisLeft(y).tickSize(0))
            .select('.domain').remove();

        // Squares
        svg.selectAll()
            .data(data, function (d: any) { return d.x + ':' + (d.label || 'Row 1'); } as any)
            .enter()
            .append('rect')
            .attr('x', d => x(String(d.x)) || 0)
            .attr('y', d => y(d.label || 'Row 1') || 0)
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .style('fill', d => myColor(d.y as number))
            .style('stroke-width', 4)
            .style('stroke', 'none')
            .style('opacity', 0.8)
            .on('mouseover', function () {
                d3.select(this)
                    .style('stroke', 'black')
                    .style('opacity', 1);
            })
            .on('mouseout', function () {
                d3.select(this)
                    .style('stroke', 'none')
                    .style('opacity', 0.8);
            });

    }, [data, config]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[200px]">
            <svg ref={svgRef} className="w-full h-full" />
        </div>
    );
}
