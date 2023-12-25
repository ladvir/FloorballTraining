import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { CoreModule } from './core/core.module';
import { TagModule } from './tag/tag.module';

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    imports: [CommonModule, RouterOutlet, CoreModule, TagModule]
})

export class AppComponent implements OnInit{
  title = 'Floorball training';

   constructor() {}

   ngOnInit() : void {    
   }
}