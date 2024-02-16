import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityComponent } from './activity.component';
import { ActivityItemComponent } from './activity-item/activity-item.component';
import { ActivityService } from './activity.service';
import { SharedModule } from '../shared/shared.module';
import { RouterLink, RouterModule } from '@angular/router';



@NgModule({
  declarations: [ActivityComponent, ActivityItemComponent],
  imports: [CommonModule, SharedModule, RouterModule, RouterLink],
  providers:[ActivityService],
  exports: [ActivityComponent, ActivityItemComponent]
})
export class ActivityModule { }
