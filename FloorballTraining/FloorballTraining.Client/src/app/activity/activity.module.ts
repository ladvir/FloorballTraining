import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityComponent } from './activity.component';
import { ActivityItemComponent } from './activity-item/activity-item.component';
import { ActivityService } from './activity.service';



@NgModule({
  declarations: [ActivityComponent, ActivityItemComponent],
  imports: [CommonModule],
  providers:[ActivityService],
  exports: [ActivityComponent, ActivityItemComponent]
})
export class ActivityModule { }
