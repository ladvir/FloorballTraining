import { Component, OnInit } from '@angular/core';
import { AgeGroupService } from './agegroup.service';
import { AgeGroup } from '../shared/models/agegroup';

@Component({
  selector: 'app-agegroup',
  templateUrl: './agegroup.component.html',
  styleUrl: './agegroup.component.scss'
})
export class AgeGroupComponent implements OnInit{
  ageGroups: AgeGroup[]=[];

  constructor(private ageGroupService: AgeGroupService) {}

  ngOnInit(): void {
    this.ageGroupService.getAgeGroups().subscribe({
      next: response => this.ageGroups = response.data, //what to do next
      error: error=> console.log(error), //what to do with the error
      complete: () => {
        console.log('request completed');
        console.log('extra statement');
      }      
    }) 
  }
}