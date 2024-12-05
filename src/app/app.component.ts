import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
//import { ChartData, ChartOptions, ChartType } from 'chart.js';
import * as d3 from 'd3';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, HttpClientModule],
})
export class AppComponent implements OnInit {
  continents: any[] = [];
  years: number[] = [];
  startYear: number | null = null;
  endYear: number | null = null;
  countries: any[] = [];
  temperatureData: any[] = [];
  globalTemperatureData: any[] = []; // Store global average temperature data
isGlobalDataVisible: boolean = false; // Track if global data is displayed

  selectedContinent: number | null = null;
  selectedCountry: number | null = null;
  title = 'climate-visualization';
  showYearSelection: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchContinents();
    this.years = Array.from({ length: 2023 - 1961 + 1}, (_, i) => 1960 + i);
  }

  toggleYearFilter(): void {
    this.showYearSelection = !this.showYearSelection;
  }

  toggleGlobalData(): void {
    if (!this.isGlobalDataVisible) {
      // Fetch all global temperature data (no year filter applied)
      this.http
        .get<any[]>('http://localhost:2626/api/global-temperature')
        .subscribe((data) => {
          this.globalTemperatureData = data;
          this.isGlobalDataVisible = true; // Mark global data as visible
          this.drawChart(); // Redraw the chart with global data
        });
    } else {
      // Hide global data
      this.globalTemperatureData = []; // Clear global data
      this.isGlobalDataVisible = false; // Mark global data as hidden
      this.drawChart(); // Redraw the chart without global data
    }
  }
  
  
  

  hideYearFilter(): void {
    this.showYearSelection = false;
  }

  fetchContinents(): void {
    this.http.get<any[]>('http://localhost:2626/api/continents').subscribe((data) => {
      this.continents = data;
    });
  }

  onContinentSelect(event: any): void {
    this.selectedContinent = +event.target.value;
    this.http
      .get<any[]>(`http://localhost:2626/api/continent/${this.selectedContinent}/countries`)
      .subscribe((data) => {
        this.countries = data;
      });
      console.log(this.selectedContinent);
  }

  onCountrySelect(event: any): void {
    this.selectedCountry = +event.target.value;
    console.log(this.selectedCountry);
  }

  onStartYear(event: any): void {
    this.startYear = +event.target.value;
  }

  onEndYear(event: any): void {
    this.endYear = +event.target.value;
  }

  
  getFilteredTemperatureData(): void {
    if (!this.selectedCountry || !this.startYear || !this.endYear) {
      alert('Please select a country and a valid year range');
      return;
    }
  
    // Fetch country-specific data for the year range
    this.http
      .get<any[]>(`http://localhost:2626/api/temperature/${this.selectedCountry}/${this.startYear}/${this.endYear}`)
      .subscribe((data) => {
        this.temperatureData = data;
  
        // Fetch global average data for the same year range
        this.http
          .get<any[]>(`http://localhost:2626/api/global-temperature/${this.startYear}/${this.endYear}`)
          .subscribe((globalData) => {
            this.globalTemperatureData = globalData;
            this.drawChart(); // Redraw the chart with filtered data
          });
      });
  }
  
  
  fetchTemperatureData(): void {
    if (!this.selectedCountry) {
      alert('Please select a country to view temperature data.');
      return;
    }
  
    // Fetch temperature data for all years
    this.http
      .get<any[]>(`http://localhost:2626/api/temperature/${this.selectedCountry}`)
      .subscribe((data) => {
        this.temperatureData = data;
        this.drawChart(); // Update the chart with all data
      });
  }
  
  

  drawChart(): void {
    d3.select('#chart').selectAll('*').remove();
  
    const margin = { top: 20, right: 30, bottom: 40, left: 30 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
  
    const svg = d3
      .select('#chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    const x = d3
      .scaleLinear()
      .domain(d3.extent(this.temperatureData, (d: any) => d.year) as [number, number])
      .range([0, width]);
  
    const y = d3
      .scaleLinear()
      .domain([-3.3, 5.3]) // Adjust range as needed
      .range([height, 0]);
  
    svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format('d')));
    svg.append('g').call(d3.axisLeft(y));
  
    // Plot country-specific data
    svg
      .append('path')
      .datum(this.temperatureData)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2.5)
      .attr(
        'd',
        d3
          .line()
          .x((d: any) => x(d.year))
          .y((d: any) => y(d.temperature))
      );
  
    // Plot global data if visible
    if (this.isGlobalDataVisible && this.globalTemperatureData.length > 0) {
      svg
        .append('path')
        .datum(this.globalTemperatureData)
        .attr('fill', 'none')
        .attr('stroke', 'green') // Green for global data
        .attr('stroke-width', 2.5)
        .attr(
          'd',
          d3
            .line()
            .x((d: any) => x(d.year))
            .y((d: any) => y(d.temperature))
        );
    }
  
    // Add legend
    const legend = svg.append('g').attr('transform', `translate(${width - 100}, ${margin.top})`);
  
    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', 10)
      .attr('fill', 'steelblue');
  
    legend
      .append('text')
      .attr('x', 25)
      .attr('y', 10)
      .text('Country Data')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle');
  
    if (this.isGlobalDataVisible) {
      legend
        .append('rect')
        .attr('x', 0)
        .attr('y', 20)
        .attr('width', 20)
        .attr('height', 10)
        .attr('fill', 'green');
  
      legend
        .append('text')
        .attr('x', 25)
        .attr('y', 30)
        .text('Global Average')
        .style('font-size', '12px')
        .attr('alignment-baseline', 'middle');
    }
  }
  
  
}  