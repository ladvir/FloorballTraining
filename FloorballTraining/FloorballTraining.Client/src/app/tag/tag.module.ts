import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagComponent } from './tag.component';
import { TagService } from './tag.service';
import { TagItemComponent } from './tag-item/tag-item.component';



@NgModule({
  declarations: [TagComponent,TagItemComponent],
  imports: [CommonModule ],
  providers:[TagService],
  exports:[TagComponent, TagItemComponent]
})
export class TagModule { }
