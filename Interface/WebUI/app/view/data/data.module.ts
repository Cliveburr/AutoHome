import { NgModule }  from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule }    from '@angular/forms';
import { Ng2DragDropModule } from 'ng2-drag-drop';

import { EnumSelect } from '../../component/enumSelect';
import { EnumTextComponent } from '../../component/enumText.component'

import { AreaComponent } from './area/area.component';
import { AreaEditComponent } from './area/area-edit.component';
import { AreaService } from '../../service/areaService';

import { ModuleComponent } from './module/module.component';
import { ModuleEditComponent } from './module/module-edit.component';
import { ModuleService } from '../../service/moduleService';

import { StandardComponent } from './standard/standard.component';
import { StandardEditComponent } from './standard/standard-edit.component';
import { StandardService } from '../../service/standardService';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'module', component: ModuleComponent },
  { path: 'module/:id', component: ModuleEditComponent },
  { path: 'standard', component: StandardComponent },
  { path: 'standard/:id', component: StandardEditComponent },
  { path: 'area', component: AreaComponent },
  { path: 'area/:id', component: AreaEditComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes), NgbModule, FormsModule, Ng2DragDropModule ],
  declarations: [ AreaComponent, AreaEditComponent, ModuleComponent, ModuleEditComponent, StandardComponent, StandardEditComponent, EnumTextComponent, EnumSelect ],
  exports: [ RouterModule ],
  providers: [ ModuleService, StandardService, AreaService ]
})
export default class DataModule {

}