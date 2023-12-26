import { Component, Input } from '@angular/core';
import { Tag } from '../../shared/models/tags';

@Component({
  selector: 'app-tag-item',  
  standalone: false,  
  templateUrl: './tag-item.component.html',
  styleUrl: './tag-item.component.scss'
})

export class TagItemComponent {
  @Input()
  tag!: Tag;

}
