import { Injectable } from '@angular/core';
import { AgeGroup } from '../shared/models/agegroup';
import { HttpClient } from '@angular/common/http';
import { Pagination } from '../shared/models/pagination';

@Injectable({
  providedIn: 'root'
})
export class AgeGroupService {

  baseUrl = 'https://localhost:7055/';
  equipments: AgeGroup[]=[];

  constructor(private http: HttpClient) { }

  getAgeGroups() {
    return this.http.get<Pagination<AgeGroup[]>>(this.baseUrl+'agegroups');
 }
}
