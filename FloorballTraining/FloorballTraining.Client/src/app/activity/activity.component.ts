import { Component, OnInit } from '@angular/core';
import { Activity } from '../shared/models/Activity';
import { ActivityService } from './activity.service';
import { Equipment } from '../shared/models/equipment';
import { AgeGroup } from '../shared/models/agegroup';
import { Tag } from '../shared/models/tag';
import { TagService } from '../tag/tag.service';
import { EquipmentService } from '../equipment/equipment.service';
import { AgeGroupService } from '../agegroup/agegroup.service';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.scss'
})
export class ActivityComponent implements OnInit {
  activities: Activity[] = [];
  tags: Tag[] = [];
  equipments: Equipment[] = [];
  ageGroups: AgeGroup[] = [];

  constructor(
    private activityService: ActivityService,
    private tagService: TagService,
    private equipmentService: EquipmentService,
    private ageGroupService: AgeGroupService) {
  }

  ngOnInit(): void {
    this.getAgeGroups();
    //this.getEquipments();        
    //this.getTags();
    //this.getActivities();
  }

  getActivities() {
    this.activityService.getActivities().subscribe({
      next: response => this.activities = response.data,
      error: error => console.log(error),
    })
  }

  getTags() {
    this.tagService.getTagsAll().subscribe({
      next: response => this.tags = response,
      error: error => console.log(error),
    })
  }

  getEquipments() {
    this.equipmentService.getEquipmentsAll().subscribe({
      next: response => this.equipments = response,
      error: error => console.log(error),
    })
  }

  getAgeGroups() {
    this.ageGroupService.getAgeGroupsAll().subscribe({
      next: response => this.ageGroups = response,
      error: error => console.log(error),
    })
  }
}

