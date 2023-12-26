import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Pagination } from '../shared/models/pagination';
import { Place } from '../shared/models/place';

@Injectable({
  providedIn: 'root'
})
export class PlaceService {

  baseUrl = 'https://localhost:7055/';
  tags: Place[]=[];

  constructor(private http: HttpClient) { }

  getPlaces() {
    return this.http.get<Pagination<Place[]>>(this.baseUrl+'places?pageSize=15');
 }
}
