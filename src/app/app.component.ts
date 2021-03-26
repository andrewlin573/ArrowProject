import {Component} from '@angular/core';

import { FormControl } from '@angular/forms';
import { ApiClientService } from './api-client.service';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { Label } from 'ng2-charts';
import { MatTableDataSource } from '@angular/material/table';

export interface VaccineAllocation {
  jurisdiction: string;
  week_of_allocations: string;
  _1st_dose_allocations: number;
  _2nd_dose_allocations: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'arrow-project';

  // text variables
  result_text = new FormControl('');
  result_color = new FormControl('');
  result_font = new FormControl('');
  
  // api data variables
  vaccine_data_clean = [];
  vaccine_data = [];
  dataSource;
  displayedColumns: string[] = ['jurisdiction', 'week_of_allocations', '_1st_dose_allocations', '_2nd_dose_allocations'];
  
  // pagination variation
  pageSize = 50;
  currentPage = 0;
  totalSize = 0;

  // charting
  public barChartOptions: ChartOptions = {
    responsive: true,
    title: {
      text: 'Covid Vaccine Allocations by State',
      fontSize: 30,
      display: true
    },
    scales: { 
      xAxes: [{
        gridLines: {display: false}
      }], 
      yAxes: [{
      }] 
    },
    plugins: {
      datalabels: {
        display: false
      }
    }
  };
  public barChartLabels: Label[] = [];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [pluginDataLabels];
  public barChartData: ChartDataSets[] = [
    { data: [], label: '1st Dose Allocations' },
    { data: [], label: '2nd Dose Allocations' }
  ];
  
  constructor(private service: ApiClientService) { }

  ngOnInit(): void {
    // Call service method to access api for data
    this.service.getVaccineAllocations()
    .then(res => {
      // Parse string into list of object
      this.vaccine_data = JSON.parse(JSON.stringify(res));

      // For charting
      var states = [];
      var allocations1 = [];
      var allocations2 = [];

      // Each vaccine allocation
      for (let idx in this.vaccine_data) {
        // vars
        const obj = this.vaccine_data[idx];
        const state = obj["jurisdiction"];
        const week = (new Date(obj["week_of_allocations"].split("T")[0])).toDateString().substr(4);
        const allocations_dose1 = parseInt(obj["_1st_dose_allocations"]);
        const allocations_dose2 = parseInt(obj["_2nd_dose_allocations"]);

        // Push new vaccine allocation to array
        const new_vac_alloc: VaccineAllocation = {
          jurisdiction: state,
          week_of_allocations: week,
          _1st_dose_allocations: allocations_dose1,
          _2nd_dose_allocations: allocations_dose2
        };
        this.vaccine_data_clean.push(new_vac_alloc);

        // bar graph data
        if (!states.includes(state)) {
          states.push(state);
          allocations1.push(allocations_dose1);
          allocations2.push(allocations_dose2);
        } else {
          const state_index = states.indexOf(state);
          allocations1[state_index] += allocations_dose1;
          allocations2[state_index] += allocations_dose2;
        }
      }

      this.totalSize = this.vaccine_data_clean.length;

      // Set initial pagination
      const part = this.vaccine_data_clean.slice(0, this.pageSize);
      this.dataSource = new MatTableDataSource(part);

      // combine the three arrays
      var combined_data = states.map((state) => {
        const state_index = states.indexOf(state);
        return [state, allocations1[state_index], allocations2[state_index]];
      })

      // sort the combined array of charting arrays
      combined_data.sort((state1, state2) => {
        return (state2[1] + state2[2]) - (state1[1] + state1[2]);
      })

      // split the array back for charting
      this.barChartLabels = combined_data.map((data) => {
        return data[0];
      });
      this.barChartData[0].data = combined_data.map((data) => {
        return data[1];
      });
      this.barChartData[1].data = combined_data.map((data) => {
        return data[2];
      });

    })
  }

  onSubmit() {
    // Update text formatting
    var result_component = document.getElementById('result_text_formatted');
    result_component.innerHTML = this.result_text.value;
    result_component.style.color = this.result_color.value;

    // Handle font size
    if (this.result_font.value.includes("px")) {
      result_component.style.fontSize = this.result_font.value;
    } else {
      result_component.style.fontSize = this.result_font.value + "px";
    }
  }

  // Filter
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  
  // Pagination
  showPage(event: any) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;

    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    const part = this.vaccine_data_clean.slice(start, end);
    this.dataSource = new MatTableDataSource(part);
  }

  // events
  public chartClicked({ event, active }: { event: MouseEvent, active: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
    console.log(event, active);
  }
}
