import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

import { CoreModule } from './core/core.module';
import { TagModule } from './tag/tag.module';
import { PlaceModule } from './place/place.module';
import { EquipmentModule } from './equipment/equipment.module';
import { AgeGroupModule } from './agegroup/agegroup.module';
import { ActivityModule } from './activity/activity.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    imports: [CommonModule, RouterOutlet, RouterModule, CoreModule, TagModule, 
      PlaceModule, EquipmentModule, AgeGroupModule, ActivityModule, DashboardModule] 
})

export class AppComponent implements OnInit{
  title = 'Floorball training';

   constructor() {}

   ngOnInit() : void {    
   }
}