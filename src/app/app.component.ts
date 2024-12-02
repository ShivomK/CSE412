import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, HttpClientModule],
})
export class AppComponent implements OnInit {
  continents: any[] = [];
  countries: any[] = [];
  temperatureData: any[] = [];
  selectedContinent: number | null = null;
  selectedCountry: number | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchContinents();
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

  fetchTemperatureData(): void {
    if (this.selectedCountry !== null) {
      this.http
        .get<any[]>(`http://localhost:2626/api/temperature/${this.selectedCountry}`)
        .subscribe((data) => {
          this.temperatureData = data;
          this.drawChart();
        });
    }
    else
    {
      console.log('Please select a country');
    }
  }

  drawChart(): void {
    d3.select('#chart').selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
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
      .domain([d3.min(this.temperatureData, (d: any) => d.temperature) as number,
               d3.max(this.temperatureData, (d: any) => d.temperature) as number])
      .range([height, 0]);

    svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append('g').call(d3.axisLeft(y));

    svg
      .append('path')
      .datum(this.temperatureData)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr(
        'd',
        d3
          .line()
          .x((d: any) => x(d.year))
          .y((d: any) => y(d.temperature))
      );
  }
}
