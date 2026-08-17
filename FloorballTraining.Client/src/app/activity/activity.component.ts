import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Activity } from '../shared/models/Activity';
import { ActivityService } from './activity.service';
import { Equipment } from '../shared/models/equipment';
import { AgeGroup } from '../shared/models/agegroup';
import { Tag } from '../shared/models/tag';
import { TagService } from '../tag/tag.service';
import { EquipmentService } from '../equipment/equipment.service';
import { AgeGroupService } from '../agegroup/agegroup.service';
import { ActivityParams } from '../shared/models/ActivityParams';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.scss'
})
export class ActivityComponent implements OnInit {
  @ViewChild('search') searchTerm?: ElementRef;

  activities: Activity[] = [];
  tags: Tag[] = [];
  equipments: Equipment[] = [];
  ageGroups: AgeGroup[] = [];
  activityParams = new ActivityParams;

  totalCount = 0;

  constructor(
    private activityService: ActivityService,
    private tagService: TagService,
    private equipmentService: EquipmentService,
    private ageGroupService: AgeGroupService) {
  }

  ngOnInit(): void {
    this.getAgeGroups();
    this.getEquipments();        
    this.getTags();
    this.getActivities();
  }

  getActivities() {
    this.activityService.getActivities(this.activityParams).subscribe({
      next: response => {
        this.activities = response.data;
        this.activityParams.pageNumber = response.pageIndex;
        this.activityParams.pageSize = response.pageSize;
        this.totalCount = response.count;
      },
      error: error => {
        this.activities = [];
        console.log(error);
      }
    })
  }

  getTags() {
    this.tagService.getTagsAll().subscribe({
      next: response => this.tags = [{id:0, name:'Vše', color:'', isTrainingGoal:false, parentTag:''}, ...response],
      error: error => console.log(error),
    })
  }

  getEquipments() {
    this.equipmentService.getEquipmentsAll().subscribe({
      next: response => this.equipments = [{id:0, name:'Vše'}, ...response],
      error: error => console.log(error),
    })
  }

  getAgeGroups() {
    this.ageGroupService.getAgeGroupsAll().subscribe({
      next: response => this.ageGroups = response,
      error: error => console.log(error),
    })
  }

  onTagSelected(tagId:number) {
    this.activityParams.tagId=tagId;
    this.activityParams.pageNumber=1;
    this.getActivities();
  }

  onAgeGroupSelected(ageGroupId:number) {
    this.activityParams.ageGroupId=ageGroupId;
    this.activityParams.pageNumber=1;
    this.getActivities();
  }

  onEquipmentSelected(equipmentId:number) {
    this.activityParams.equipmentId=equipmentId;
    this.activityParams.pageNumber=1;
    this.getActivities();
  }

  onPageChanged(event:any) {
    if(this.activityParams.pageNumber !== event) {
      this.activityParams.pageNumber = event;
      
      this.getActivities();
    }
  }

  onSearch() {
    this.activityParams.name = this.searchTerm?.nativeElement.value;
    this.activityParams.pageNumber=1;
    this.getActivities();
  }

  onReset() {
    if(this.searchTerm) this.searchTerm.nativeElement.value='';
    this.activityParams.name='';
    this.activityParams.pageNumber=1;
    this.getActivities();
  }
}

