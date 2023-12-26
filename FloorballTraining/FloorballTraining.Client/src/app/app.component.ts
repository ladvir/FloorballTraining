import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { CoreModule } from './core/core.module';
import { TagModule } from './tag/tag.module';
import { PlaceModule } from './place/place.module';
import { EquipmentModule } from './equipment/equipment.module';

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    imports: [CommonModule, RouterOutlet, CoreModule, TagModule, PlaceModule, EquipmentModule] 
})

export class AppComponent implements OnInit{
  title = 'Floorball training';

   constructor() {}

   ngOnInit() : void {    
   }
}