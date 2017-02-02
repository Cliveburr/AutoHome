import { NgModule }  from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule }    from '@angular/forms';

import { EnumSelect } from '../../component/enumSelect';
import { EnumTextComponent } from '../../component/enumText.component'

import { AreaComponent } from './area/area.component';

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
  { path: 'area', component: AreaComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes), NgbModule, FormsModule ],
  declarations: [ AreaComponent, ModuleComponent, ModuleEditComponent, StandardComponent, StandardEditComponent, EnumTextComponent, EnumSelect ],
  exports: [ RouterModule ],
  providers: [ ModuleService, StandardService ]
})
export default class DataModule {

}