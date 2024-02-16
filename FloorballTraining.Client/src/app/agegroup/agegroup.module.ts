import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgeGroupItemComponent } from './agegroup-item/agegroup-item.component';
import { AgeGroupComponent } from './agegroup.component';
import { AgeGroupService } from './agegroup.service';

@NgModule({
  declarations: [AgeGroupComponent, AgeGroupItemComponent],
  imports: [CommonModule],
  providers:[AgeGroupService],
  exports: [AgeGroupComponent, AgeGroupItemComponent]
})

export class AgeGroupModule { }
