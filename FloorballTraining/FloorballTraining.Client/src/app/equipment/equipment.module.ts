import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipmentComponent } from './equipment.component';
import { EquipmentItemComponent } from './equipment-item/equipment-item.component';
import { EquipmentService } from './equipment.service';

@NgModule({
  declarations: [EquipmentComponent, EquipmentItemComponent],
  imports: [CommonModule],
  providers: [EquipmentService],
  exports: [EquipmentComponent, EquipmentItemComponent]

})
export class EquipmentModule { }

