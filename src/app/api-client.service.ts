import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class ApiClientService {
  req_url = "https://data.cdc.gov/resource/saz5-9hgg.json";

  constructor() { }

  getVaccineAllocations = () => 
    fetch(this.req_url)
      .then(res => res.json());
}
