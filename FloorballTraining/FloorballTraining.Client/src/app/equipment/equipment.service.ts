import { Injectable } from '@angular/core';
import { Equipment } from '../shared/models/equipment';
import { HttpClient } from '@angular/common/http';
import { Pagination } from '../shared/models/pagination';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {


  baseUrl = 'https://localhost:7055/';
  equipments: Equipment[] = [];

  constructor(private http: HttpClient) { }

  getEquipments() {
    return this.http.get<Pagination<Equipment[]>>(this.baseUrl + 'equipments');
  }

  getEquipmentsAll() {
    return this.http.get<Equipment[]>(this.baseUrl + 'equipments');
  }
}