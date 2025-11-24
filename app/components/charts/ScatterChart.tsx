'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartData, ChartConfig } from '@/lib/types';

interface ScatterChartProps {
    data: ChartData[];
    config?: ChartConfig;
}

export function ScatterChart({ data, config = {} }: ScatterChartProps) {
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
        // Check if x is numeric or categorical
        const isXNumeric = data.every(d => typeof d.x === 'number');

        let x: any;
        if (isXNumeric) {
            x = d3.scaleLinear()
                .domain(d3.extent(data, d => Number(d.x)) as [number, number])
                .nice()
                .range([0, width]);
        } else {
            x = d3.scalePoint()
                .domain(data.map(d => String(d.x)))
                .range([0, width])
                .padding(0.5);
        }

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.y as number) || 0])
            .nice()
            .range([height, 0]);

        // Axes
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        svg.append('g')
            .call(d3.axisLeft(y));

        // Dots
        svg.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(isXNumeric ? Number(d.x) : String(d.x)) || 0)
            .attr('cy', d => y(d.y as number))
            .attr('r', 5)
            .attr('fill', config.colors?.[0] || '#3b82f6')
            .attr('opacity', 0.7)
            .on('mouseover', function () {
                d3.select(this).attr('r', 8).attr('opacity', 1);
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 5).attr('opacity', 0.7);
            });

    }, [data, config]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[200px]">
            <svg ref={svgRef} className="w-full h-full" />
        </div>
    );
}
