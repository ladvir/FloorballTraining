import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pagination } from '../shared/models/pagination';
import { Activity } from '../shared/models/Activity';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  baseUrl = 'https://localhost:7055/';
  activities: Activity[]=[];

  constructor(private http: HttpClient) { }

  getActivities() {
    return this.http.get<Pagination<Activity[]>>(this.baseUrl+'activities');
 }
}
