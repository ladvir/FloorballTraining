import { Component, Input } from '@angular/core';
import { AgeGroup } from '../../shared/models/agegroup';

@Component({
  selector: 'app-agegroup-item',
  standalone: false,
  templateUrl: './agegroup-item.component.html',
  styleUrl: './agegroup-item.component.scss'
})
export class AgeGroupItemComponent {
  @Input()
  ageGroup!:AgeGroup;
}