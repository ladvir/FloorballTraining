import { Component, Input } from '@angular/core';
import { Place } from '../../shared/models/place';

@Component({
  selector: 'app-place-item',
  standalone: false,
  templateUrl: './place-item.component.html',
  styleUrl: './place-item.component.scss'
})
export class PlaceItemComponent {
@Input()
  place!:Place;
}