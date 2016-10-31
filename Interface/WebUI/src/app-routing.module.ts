import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

//import { HomeComponent } from './view/home/home.component';
//import { AreaComponent } from './view/area/area.component';
//import { DataComponent } from './view/data/data.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadChildren: './src/view/home/home.module' },
  { path: 'area', loadChildren: './src/view/area/area.module' },
  { path: 'data', loadChildren: './src/view/data/data.module' }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  // declarations: [ HomeComponent, AreaComponent, DataComponent ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {

}