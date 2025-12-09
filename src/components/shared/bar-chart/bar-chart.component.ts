import { ChangeDetectionStrategy, Component, ElementRef, inject, input, OnChanges, SimpleChanges, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

declare var d3: any;

export interface ChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent implements OnChanges {
  data = input.required<ChartData[]>();
  
  chartContainer = viewChild<ElementRef>('chart');
  
  private currencyPipe = inject(CurrencyPipe);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data() && this.chartContainer()) {
      this.createChart();
    }
  }

  private createChart(): void {
    const element = this.chartContainer()!.nativeElement;
    d3.select(element).select('svg').remove(); // Clear previous chart

    const data = this.data();
    
    const margin = { top: 20, right: 30, bottom: 80, left: 100 };
    const width = element.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X axis
    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.name))
      .padding(0.2);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-family', 'Almarai');

    // Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([height, 0]);

    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(d => this.currencyPipe.transform(d, 'SAR', '', '1.0-0')))
      .selectAll('text')
      .style('font-family', 'Almarai');

    // Tooltip
    const tooltip = d3.select(element)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0);

    // Bars
    svg.selectAll('mybar')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.name))
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.value))
      .attr('fill', '#3b82f6')
      .on('mouseover', (event, d) => {
        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.html(`<strong>${d.name}</strong><br/>${this.currencyPipe.transform(d.value, 'SAR', 'symbol', '1.0-0')}`)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });
  }
}