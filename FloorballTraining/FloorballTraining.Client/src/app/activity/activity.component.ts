import { Component, OnInit } from '@angular/core';
import { Activity } from '../shared/models/Activity';
import { ActivityService } from './activity.service';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.scss'
})
export class ActivityComponent implements OnInit{
 activities: Activity[]=[];
 
  constructor(private activityService: ActivityService) {}

  ngOnInit(): void {
    this.activityService.getActivities().subscribe({
      next: response => this.activities = response.data, //what to do next
      error: error=> console.log(error), //what to do with the error
      complete: () => {
        console.log('request completed');
        console.log('extra statement');
      }      
    }) 
  }
}
