import { NgModule }  from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule }    from '@angular/forms';

import { AreaComponent } from './area/area.component';

import { ModuleComponent } from './module/module.component';
import { ModuleEditComponent } from './module/module-edit.component';
import { BaseService } from '../../service/baseService';
import { ModuleService } from '../../service/moduleService';

import { RGBStandardsComponent } from './rgbstandards/rgbstandards.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'module', component: ModuleComponent },
  { path: 'module/:uid', component: ModuleEditComponent },
  { path: 'rgbstandards', component: RGBStandardsComponent },
  { path: 'area', component: AreaComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes), NgbModule, FormsModule ],
  declarations: [ AreaComponent, ModuleComponent, ModuleEditComponent, RGBStandardsComponent ],
  exports: [ RouterModule ],
  providers: [ BaseService, ModuleService ]
})
export default class DataModule {

}