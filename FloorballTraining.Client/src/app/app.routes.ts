import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ActivityComponent } from './activity/activity.component';
import { ActivityDetailsComponent } from './activity/activity-details/activity-details.component';
import { TagComponent } from './tag/tag.component';
import { PlaceComponent } from './place/place.component';
import { EquipmentComponent } from './equipment/equipment.component';
import { AgeGroupComponent } from './agegroup/agegroup.component';

export const routes: Routes = [
    {path: '', component:DashboardComponent},
    {path: 'activities', component:ActivityComponent},
    {path: 'activities?:id', component:ActivityDetailsComponent},
    {path: 'tags', component:TagComponent},
    {path: 'places', component:PlaceComponent},
    {path: 'equipments', component:EquipmentComponent},
    {path: 'ageGroups', component:AgeGroupComponent},
    {path: '**', redirectTo: '', pathMatch: 'full'},
];
