import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaceComponent } from './place.component';
import { PlaceItemComponent } from './place-item/place-item.component';
import { PlaceService } from './place.service';

@NgModule({
  declarations: [PlaceComponent, PlaceItemComponent],
  imports: [CommonModule],
  providers: [PlaceService],
  exports: [PlaceComponent, PlaceItemComponent]
})
export class PlaceModule { }

/*
@NgModule({
  declarations: [TagComponent,TagItemComponent],
  imports: [CommonModule ],
  providers:[TagService],
  exports:[TagComponent, TagItemComponent]
})
export class TagModule { } */