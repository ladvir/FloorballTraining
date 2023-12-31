import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-paging-header',
  standalone: false,
  templateUrl: './paging-header.component.html',
  styleUrl: './paging-header.component.scss'
})
export class PagingHeaderComponent {
  @Input() pageNumber?: number;
  @Input() pageSize?: number;
  @Input() totalCount?: number;
}
