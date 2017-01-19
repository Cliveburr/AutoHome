import { NgModule }  from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AreaComponent } from './area/area.component';

import { ModuleComponent } from './module/module.component';
import { BaseService } from '../../service/baseService';
import { ModuleService } from '../../service/moduleService';

import { RGBStandardsComponent } from './rgbstandards/rgbstandards.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'module', component: ModuleComponent },
  { path: 'rgbstandards', component: RGBStandardsComponent },
  { path: 'area', component: AreaComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes) ],
  declarations: [ AreaComponent, ModuleComponent, RGBStandardsComponent ],
  exports: [ RouterModule ],
  providers: [ BaseService, ModuleService ]
})
export default class DataModule {

}