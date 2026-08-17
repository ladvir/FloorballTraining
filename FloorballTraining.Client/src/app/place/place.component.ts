import { Component, OnInit } from '@angular/core';
import { Place } from '../shared/models/place';
import { PlaceService } from './place.service';

@Component({
  selector: 'app-place',  
  templateUrl: './place.component.html',
  styleUrl: './place.component.scss'
})
export class PlaceComponent implements OnInit{
  places :Place[]=[];

  constructor(private placeService: PlaceService) {}
  ngOnInit(): void {

    this.placeService.getPlaces().subscribe({
      next: response => this.places = response.data, //what to do next
      error: error=> console.log(error), //what to do with the error
      complete: () => {
        console.log('request completed');
        console.log('extra statement');
      }
      
    })
  }

}

