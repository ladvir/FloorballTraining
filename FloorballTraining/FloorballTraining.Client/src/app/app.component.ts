import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from "./nav-bar/nav-bar.component";
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Tag } from './models/tags';
import { Pagination } from './models/pagination';

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    imports: [CommonModule, RouterOutlet, NavBarComponent, HttpClientModule]
})
export class AppComponent implements OnInit{
  title = 'Floorball training';
  tags: Tag[] = [];

   constructor(private http: HttpClient) {}

   ngOnInit() : void {
    this.http.get<Pagination<Tag[]>>('https://localhost:7055/tags?pageSize=50&sort=parentTagAsc').subscribe({
      next: response => this.tags = response.data, //what to do next
      error: error=> console.log(error), //what to do with the error
      complete: () => {
        console.log('request completed');
        console.log('extra statement');
      }
      
    })
   }
}
function Pagination<T>(arg0: string) {
  throw new Error('Function not implemented.');
}

