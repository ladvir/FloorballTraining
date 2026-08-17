import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pagination } from '../shared/models/pagination';
import { Activity } from '../shared/models/Activity';
import { ActivityParams } from "../shared/models/ActivityParams";

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  baseUrl = 'https://localhost:7055/';
  activities: Activity[]=[];

  constructor(private http: HttpClient) { }

  getActivities(activityParams:ActivityParams) {
    let params = new HttpParams();

   /* if(id) params = params.append('id', id);
if(name) params = params.append('name', name);
if(description) params = params.append('description', description);
if(personsmin) params = params.append('personsmin', personsmin);
if(personsmax) params = params.append('personsmax', personsmax);
if(durationmin) params = params.append('durationmin', durationmin);
if(durationmax) params = params.append('durationmax', durationmax);
if(intensity) params = params.append('intensity', intensity);
if(difficulty) params = params.append('difficulty', difficulty);
if(placewidth) params = params.append('placewidth', placewidth);
if(placelength) params = params.append('placelength', placelength);
if(environment) params = params.append('environment', environment);
if(intensitymin) params = params.append('intensitymin', intensitymin);
if(intensitymax) params = params.append('intensitymax', intensitymax);
if(difficultymin) params = params.append('difficultymin', difficultymin);
if(difficultymax) params = params.append('difficultymax', difficultymax);
if(placewidthmin) params = params.append('placewidthmin', placewidthmin);
if(placewidthmax) params = params.append('placewidthmax', placewidthmax);
if(placelengthmin) params = params.append('placelengthmin', placelengthmin);
if(placelengthmax) params = params.append('placelengthmax', placelengthmax);
if(placeareamin) params = params.append('placeareamin', placeareamin);
if(placeareamax) params = params.append('placeareamax', placeareamax);
if(persons) params = params.append('persons', persons);
if(duration) params = params.append('duration', duration);
if(placearea) params = params.append('placearea', placearea);*/

if(activityParams.ageGroupId>1) params = params.append('agegroup', activityParams.ageGroupId);
if(activityParams.tagId>0) params = params.append('tag', activityParams.tagId);
if(activityParams.equipmentId>0) params = params.append('equipment', activityParams.equipmentId);

params = params.append('sort', activityParams.sort);
params = params.append('pageIndex', activityParams.pageNumber);
params = params.append('pageSize', activityParams.pageSize);

if (activityParams.name) params = params.append('name', activityParams.name);

    return this.http.get<Pagination<Activity[]>>(this.baseUrl+'activities', {params});
 }
}


