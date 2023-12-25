import { Component, OnInit } from '@angular/core';
import { Tag } from '../shared/models/tags';
import { TagService } from './tag.service';

@Component({
  selector: 'app-tag',  
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.scss'
})

export class TagComponent implements OnInit {
tags : Tag[]=[];

constructor(private appService : TagService) {}

  ngOnInit(): void {
    

    this.appService.getTags().subscribe({
      next: response => this.tags = response.data, //what to do next
      error: error=> console.log(error), //what to do with the error
      complete: () => {
        console.log('request completed');
        console.log('extra statement');
      }
      
    })
  }
}
