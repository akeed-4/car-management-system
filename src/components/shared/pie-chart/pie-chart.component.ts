import { ChangeDetectionStrategy, Component, ElementRef, input, OnChanges, SimpleChanges, viewChild } from '@angular/core';

declare var d3: any;

export interface ChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [],
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent implements OnChanges {
  data = input.required<ChartData[]>();
  
  chartContainer = viewChild<ElementRef>('chart');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data() && this.data().length > 0 && this.chartContainer()) {
      this.createChart();
    }
  }

  private createChart(): void {
    const element = this.chartContainer()!.nativeElement;
    d3.select(element).select('svg').remove(); // Clear previous chart

    const data = this.data();
    
    const width = element.clientWidth;
    const height = 400;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.name))
      .range(['#22c55e', '#ef4444', '#f59e0b', '#6b7280']); // Green, Red, Yellow, Gray for Available, Sold, Reserved, In Maintenance

    const pie = d3.pie()
      .value(d => d.value)
      .sort(null); // Use the order from the data array

    const data_ready = pie(data);

    const arc = d3.arc()
      .innerRadius(radius * 0.5) // Donut chart
      .outerRadius(radius);
      
    const tooltip = d3.select(element)
      .append('div')
      .attr('class', 'chart-tooltip');

    svg.selectAll('slices')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.name))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.7)
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 1);
        tooltip.style('opacity', .9);
        tooltip.html(`<strong>${d.data.name}</strong><br/>${d.data.value} سيارة`)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.7);
        tooltip.style('opacity', 0);
      });
      
    // Add text in the middle
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .text(`${d3.sum(data, d => d.value)} سيارة`);
  }
}
