import { Component, Input } from '@angular/core';
import { Equipment } from '../../shared/models/equipment';

@Component({
  selector: 'app-equipment-item',
  standalone: false,
  templateUrl: './equipment-item.component.html',
  styleUrl: './equipment-item.component.scss'
})

export class EquipmentItemComponent {
  @Input()
  equipment!: Equipment;
}
