import { Component, Input } from '@angular/core';
import { Activity } from '../../shared/models/Activity';

@Component({
  selector: 'app-activity-item',
  standalone: false,
  templateUrl: './activity-item.component.html',
  styleUrl: './activity-item.component.scss'
})
export class ActivityItemComponent {
  @Input()
  activity!:Activity;
}
