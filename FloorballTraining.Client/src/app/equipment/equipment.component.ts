import { Component, OnInit } from '@angular/core';
import { Equipment } from '../shared/models/equipment';
import { EquipmentService } from './equipment.service';

@Component({
  selector: 'app-equipment',
  templateUrl: './equipment.component.html',
  styleUrl: './equipment.component.scss'
})

export class EquipmentComponent implements OnInit {
  equipments : Equipment[] = [];
  
  constructor(private equipmentService : EquipmentService) {}

  ngOnInit(): void {
    this.equipmentService.getEquipments().subscribe({
      next: response => this.equipments = response.data, //what to do next
      error: error=> console.log(error), //what to do with the error
      complete: () => {
        console.log('request completed');
        console.log('extra statement');
      }      
    })    
  }
}