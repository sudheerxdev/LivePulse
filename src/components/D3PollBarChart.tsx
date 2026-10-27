import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { PollOption } from '../types';

interface D3PollBarChartProps {
  options: PollOption[];
  totalVotes: number;
  selectedOptionId?: number | null;
  isActive?: boolean;
}

export const D3PollBarChart: React.FC<D3PollBarChartProps> = ({
  options,
  totalVotes,
  selectedOptionId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState(450);

  // Measure container for responsive D3 rendering
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // D3 animated render and smooth transition on vote updates
  useEffect(() => {
    if (!svgRef.current || options.length === 0) return;

    const svg = d3.select(svgRef.current);
    const barHeight = 36;
    const barGap = 16;
    const marginTop = 12;
    const marginBottom = 20;
    const marginLeft = 8;
    const marginRight = 60; // Space for vote count & percentage tags on right

    const height = options.length * (barHeight + barGap) + marginTop + marginBottom;
    const width = Math.max(containerWidth, 280);
    const chartWidth = width - marginLeft - marginRight;

    svg.attr('width', width).attr('height', height);

    // Compute max votes for scale domain
    const maxVotes = Math.max(1, d3.max(options, (d) => d.votes) || 1);

    const xScale = d3
      .scaleLinear()
      .domain([0, maxVotes])
      .range([0, chartWidth]);

    let g = svg.select<SVGGElement>('g.main-group');
    if (g.empty()) {
      g = svg.append('g').attr('class', 'main-group');
    }
    g.attr('transform', `translate(${marginLeft}, ${marginTop})`);

    // Defs for gradients if not already present
    let defs = svg.select<SVGDefsElement>('defs');
    if (defs.empty()) {
      defs = svg.append('defs');

      // Default indigo gradient
      const gradDefault = defs
        .append('linearGradient')
        .attr('id', 'd3-bar-gradient-default')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
      gradDefault.append('stop').attr('offset', '0%').attr('stop-color', '#4f46e5');
      gradDefault.append('stop').attr('offset', '100%').attr('stop-color', '#818cf8');

      // Selected user option gradient (emerald to cyan)
      const gradSelected = defs
        .append('linearGradient')
        .attr('id', 'd3-bar-gradient-selected')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
      gradSelected.append('stop').attr('offset', '0%').attr('stop-color', '#059669');
      gradSelected.append('stop').attr('offset', '100%').attr('stop-color', '#10b981');
    }

    // Join data on option id
    const barGroups = g
      .selectAll<SVGGElement, PollOption>('g.bar-row')
      .data(options, (d) => d.id.toString());

    // Enter
    const enterGroups = barGroups
      .enter()
      .append('g')
      .attr('class', 'bar-row')
      .attr('transform', (_, i) => `translate(0, ${i * (barHeight + barGap)})`);

    // Background track (full width of chart)
    enterGroups
      .append('rect')
      .attr('class', 'bg-track')
      .attr('x', 0)
      .attr('y', 18)
      .attr('width', chartWidth)
      .attr('height', 14)
      .attr('rx', 7)
      .attr('fill', '#27272a') // zinc-800
      .attr('opacity', 0.5);

    // Foreground animated bar
    enterGroups
      .append('rect')
      .attr('class', 'fg-bar')
      .attr('x', 0)
      .attr('y', 18)
      .attr('width', 0)
      .attr('height', 14)
      .attr('rx', 7);

    // Option text label (top of each row)
    enterGroups
      .append('text')
      .attr('class', 'option-label')
      .attr('x', 0)
      .attr('y', 12)
      .attr('fill', '#e4e4e7') // zinc-200
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('font-family', 'ui-sans-serif, system-ui, sans-serif');

    // Stats label (votes & percentage on the right)
    enterGroups
      .append('text')
      .attr('class', 'stats-label')
      .attr('x', chartWidth + 10)
      .attr('y', 29)
      .attr('font-size', '11px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-weight', '600');

    // Update + Enter merged
    const allGroups = enterGroups.merge(barGroups);

    // Update positions with smooth transition
    allGroups
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr('transform', (_, i) => `translate(0, ${i * (barHeight + barGap)})`);

    // Update background track width on resize
    allGroups
      .select('rect.bg-track')
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr('width', chartWidth);

    // Smoothly transition foreground bars with D3
    allGroups
      .select('rect.fg-bar')
      .attr('fill', (d) =>
        d.id === selectedOptionId
          ? 'url(#d3-bar-gradient-selected)'
          : 'url(#d3-bar-gradient-default)'
      )
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr('width', (d) => (d.votes > 0 ? Math.max(10, xScale(d.votes)) : 0));

    // Update option label text
    allGroups
      .select('text.option-label')
      .text((d) => {
        const isSelected = d.id === selectedOptionId;
        return `${isSelected ? '✓ ' : ''}${d.text}`;
      })
      .attr('fill', (d) => (d.id === selectedOptionId ? '#a7f3d0' : '#e4e4e7'));

    // Update stats label with transition
    allGroups
      .select('text.stats-label')
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr('x', chartWidth + 10)
      .text((d) => {
        const pct = totalVotes > 0 ? Math.round((d.votes / totalVotes) * 100) : 0;
        return `${d.votes} (${pct}%)`;
      })
      .attr('fill', (d) => (d.id === selectedOptionId ? '#34d399' : '#a1a1aa'));

    // Exit
    barGroups
      .exit()
      .transition()
      .duration(300)
      .style('opacity', 0)
      .remove();
  }, [options, totalVotes, selectedOptionId, containerWidth]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mb-2 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span>D3 Real-Time Visualizer</span>
        </span>
        <span>{totalVotes} total responses</span>
      </div>
      <svg
        ref={svgRef}
        className="w-full overflow-visible select-none"
        style={{ minHeight: `${options.length * 52 + 30}px` }}
      />
    </div>
  );
};
