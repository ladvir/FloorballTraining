import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pagination } from '../shared/models/pagination';
import { Tag } from '../shared/models/tag';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  baseUrl = 'https://localhost:7055/';
  tags: Tag[]=[];

  constructor(private http: HttpClient) { }

  getTags() {
    return this.http.get<Pagination<Tag[]>>(this.baseUrl+'tags');
 }
}
